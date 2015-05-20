'use strict';

// Load modules
var Stream = require('stream');

var Code = require('code');
var Hoek = require('hoek');
var Lab = require('lab');
var Moment = require('moment');
var Sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru();


// Declare internals
var internals = {};

internals.spy = Sinon.spy();

internals.logglyStub = {
    createClient: function () {

        return { log: internals.spy };
    }
};

internals.logglyOptions = {
    token     : 'TOKEN',
    subdomain : 'SUBDOMAIN'
};

internals.logEventData = {
    event     : 'log',
    timestamp : 1396207735000,
    tags      : ['info', 'server'],
    msg      : 'Log message',
    pid       : 1234
};

internals.logglyResult = {
    event     : 'log',
    timestamp : '2014-03-30T21:28:55+02:00',
    tags      : ['info', 'server'],
    msg       : 'Log message',
    pid       : 1234
};

internals.optionalFields = {
    name: 'loggly-name',
    hostname: 'example.com'
};

internals.response = {
    event: 'response',
    method: 'post',
    statusCode: 200,
    timestamp: Date.now(),
    instance: 'localhost',
    path: '/data',
    responseTime: 150,
    query: {
        name: 'adam'
    },
    responsePayload: {
        foo: 'bar',
        value: 1
    }
};

internals.request = {
    event: 'request',
    timestamp: 1411583264547,
    tags: ['user', 'info'],
    data: 'you made a request',
    pid: 64291,
    id: '1419005623332:new-host.local:48767:i3vrb3z7:10000',
    method: 'get',
    path: '/'
};

internals.readStream = function (done) {

    var result = new Stream.Readable({ objectMode: true });
    result._read = Hoek.ignore;

    if (typeof done === 'function') {
        result.once('end', done);
    }

    return result;
};


var GoodLoggly = proxyquire('..', { 'loggly': internals.logglyStub });


// Test shortcuts
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var afterEach = lab.afterEach;
var expect = Code.expect;


describe('GoodLoggly', function () {

    afterEach(function (done) {

        internals.spy.reset();
        done();
    });


    it('returns a new object without "new"', function (done) {

        var reporter = GoodLoggly({ log: '*' }, internals.logglyOptions);
        expect(reporter._settings).to.exist();

        done();
    });


    it('returns a new object with "new"', function (done) {

        var reporter = new GoodLoggly({ log: '*' }, internals.logglyOptions);
        expect(reporter._settings).to.exist();

        done();
    });


    it('throws an error if the incomming stream is not in objectMode', function (done) {

        var reporter = GoodLoggly({ log: '*' }, internals.logglyOptions);
        expect(reporter._settings).to.exist();

        var stream = new Stream.Readable();

        reporter.init(stream, null, function (err) {

            expect(err).to.exist();
            expect(err.message).to.equal('stream must be in object mode');
            done();
        });
    });


    it('should throw an error for ops events', function (done) {

        expect(function () {

            GoodLoggly({ ops: '*' }, internals.logglyOptions);
        }).to.throw('"ops" events are not supported by Loggly');
        done();
    });


    it('should throw if no events are defined', function (done) {

        expect(function () {

            GoodLoggly(undefined, internals.logglyOptions);
        }).to.throw('events must be specified');
        done();
    });


    it('should throw an error if no Loggly API token is defined', function (done) {

        expect(function () {

            GoodLoggly({}, { subdomain: 'SUBDOMAIN' });
        }).to.throw('Loggly API token required');
        done();
    });


    it('should throw an error if no Loggly subdomain is defined', function (done) {

        expect(function () {

            GoodLoggly({}, { token: 'TOKEN' });
        }).to.throw('Loggly subdomain required');
        done();
    });


    it('prints error events', function (done) {

        var reporter = new GoodLoggly({ error: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment.utc(now).format();
        var event = {
            event: 'error',
            error: {
                message: 'test message',
                stack: 'fake stack for testing'
            }
        };

        event.timestamp = now;

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push(event);
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    it('prints request events with string data', function (done) {

        var reporter = new GoodLoggly({ request: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment.utc(now).format();

        internals.request.timestamp = now;

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push(internals.request);
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    it('prints request events with object data', function (done) {

        var reporter = new GoodLoggly({ request: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment.utc(now).format();

        internals.request.timestamp = now;
        internals.request.data = { message: 'you made a request to a resource' };

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push(internals.request);
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    it('prints a generic message for unknown event types with "data" as an object', function (done) {

        var reporter = new GoodLoggly({ test: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment.utc(now).format();
        var event = {
            event: 'test',
            data: {
                reason: 'for testing'
            },
            tags: ['user'],
            timestamp: now
        };

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push(event);
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    it('prints a generic message for unknown event types with "data" as a string', function (done) {

        var reporter = new GoodLoggly({ test: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment.utc(now).format();
        var event = {
            event: 'test',
            data: 'for testing',
            tags: ['user'],
            timestamp: now
        };

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push(event);
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    it('prints a generic message for unknown event types with no "data" attribute', function (done) {

        var reporter = new GoodLoggly({ test: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment.utc(now).format();
        var event = {
            event: 'test',
            tags: 'user',
            timestamp: now
        };

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push(event);
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    it('prints log events with string data', function (done) {

        var reporter = new GoodLoggly({ log: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment(now).format('DD-YY -- ZZ');

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push({
                event: 'log',
                timestamp: now,
                tags: ['info'],
                data: 'this is a log'
            });
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    it('prints log events with object data', function (done) {

        var reporter = new GoodLoggly({ log: '*' }, internals.logglyOptions);
        var now = Date.now();
        var timeString = Moment.utc(now).format();

        internals.request.timestamp = now;

        var s = internals.readStream(done);

        reporter.init(s, null, function (err) {

            expect(err).to.not.exist();
            s.push({
                event: 'log',
                timestamp: now,
                tags: ['info', 'high'],
                data: {
                    message: 'this is a log'
                }
            });
            expect(internals.spy.calledOnce).to.be.true();
            s.push(null);
        });
    });

    describe('_printEvent()', function () {
        it('should log an event', function (done) {
            var reporter = new GoodLoggly({ test: '*' }, internals.logglyOptions);
            var result = reporter._printEvent(internals.logEventData);

            expect(result).to.deep.include(internals.logglyResult);
            done();
        });

        it('should pass through optional "name" and "hostname" fields', function (done) {
            var logEventData = Hoek.applyToDefaults(internals.logEventData, internals.optionalFields);
            var reporter = new GoodLoggly({ test: '*' }, internals.logglyOptions);
            var result = reporter._printEvent(logEventData);

            expect(result).to.include(internals.optionalFields);
            done();
        });
    });
});
