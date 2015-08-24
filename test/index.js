'use strict';

// Load modules

var Stream       = require('stream');
var Proxyquire   = require('proxyquire');
var Hoek         = require('hoek');
var Lab          = require('lab');
var Code         = require('code');
var Merge        = require('lodash.merge');

var logglyStub = {
    createClient: function () {}
};
var GoodLoggly = Proxyquire('..', { 'loggly': logglyStub });


// Declare internals

var internals = {};

internals.logglyOptions = {
    token     : 'TOKEN',
    subdomain : 'SUBDOMAIN'
};

internals.logEventData = Object.freeze({
    event     : 'log',
    timestamp : 1396207735000,
    tags      : ['info', 'server'],
    data      : 'Log message',
    pid       : 1234
});

internals.logglyResult = {
    event     : 'log',
    timestamp : new Date(1396207735000).toISOString(),
    tags      : ['info', 'server'],
    data      : 'Log message',
    msg       : 'Log message',
    pid       : 1234
};

internals.optionalFields = {
    name: 'loggly-name',
    hostname: 'example.com'
};

internals.readStream = function () {

    var result = new Stream.Readable({ objectMode: true });
    result._read = Hoek.ignore;
    return result;
};


// Test shortcuts
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;


describe('GoodLoggly', function () {

    it('can be created with new', function (done) {

        var reporter = new GoodLoggly(null, internals.logglyOptions);
        expect(reporter._client).to.exist();
        done();
    });

    it('can be created without new', function (done) {

        var options = Hoek.clone(internals.logglyOptions);
        options.tags = ['foo'];
        var reporter = GoodLoggly(null, options);
        expect(reporter._client).to.exist();
        expect(reporter._client.tags).to.deep.equal(['foo']);
        done();
    });

    it('should throw an error for ops events', function (done) {

        expect(function () {

            /* eslint-disable no-unused-vars */
            var reporter = new GoodLoggly({ ops: '*' });
            /* eslint-enable no-unused-vars */
        }).to.throw('"ops" events are not supported by Loggly');
        done();
    });

    it('should initialize if no events are defined', function (done) {

        var reporter = GoodLoggly(null, internals.logglyOptions);
        expect(reporter._client).to.exist();
        done();
    });

    it('should throw an error if no Loggly API token is defined', function (done) {

        expect(function () {

            /* eslint-disable no-unused-vars */
            var reporter = new GoodLoggly(null, { subdomain: 'SUBDOMAIN' });
            /* eslint-enable no-unused-vars */
        }).to.throw('Loggly API token required');
        done();
    });

    it('should throw an error if no Loggly subdomain is defined', function (done) {

        expect(function () {

            /* eslint-disable no-unused-vars */
            var reporter = new GoodLoggly(null, { token: 'TOKEN' });
            /* eslint-enable no-unused-vars */
        }).to.throw('Loggly subdomain required');
        done();
    });

    it('should log an event', function (done) {

        var stream = internals.readStream();
        var reporter = new GoodLoggly({ log: '*' }, internals.logglyOptions);

        logglyStub.Loggly.prototype.log = function (event, tags) {

            expect(event).to.deep.equal(internals.logglyResult);
            expect(tags).to.deep.equal([ 'info', 'server' ]);
            done();
        };

        reporter.init(stream, null, function (err) {

            expect(err).to.not.exist();
            stream.push(internals.logEventData);
        });
    });

    it('should pass through optional "name" and "hostname" fields', function (done) {

        var stream = internals.readStream();
        var reporter = new GoodLoggly({ log: '*' }, Merge({}, internals.logglyOptions, internals.optionalFields));

        logglyStub.Loggly.prototype.log = function (event, tags) {

            expect(event).to.deep.equal(Merge({}, internals.logglyResult, internals.optionalFields));
            expect(tags).to.deep.equal([ 'info', 'server' ]);
            done();
        };

        reporter.init(stream, null, function (err) {

            expect(err).to.not.exist();
            stream.push(internals.logEventData);
        });
    });

    describe('_timeString()', function () {

        it('should formats the time as ISO 8601 date', function (done) {

            var time = new Date(1396207735000);
            var result = GoodLoggly.timeString(time);

            expect(result).to.equal(time.toISOString());
            done();
        });
    });

    describe('_getMessage()', function () {

        it('should return the contents of the message property', function (done) {

            var result = GoodLoggly.getMessage({ data: { message: 'message' }});

            expect(result).to.equal('message');
            done();
        });

        it('should fallback to the contents of the error property', function (done) {

            var result = GoodLoggly.getMessage({ data: { error: 'error' }});

            expect(result).to.equal('error');
            done();
        });

        it('should then fallback to the contents of the data property', function (done) {

            var result = GoodLoggly.getMessage({ data: 'data' });

            expect(result).to.equal('data');
            done();
        });

        it('should return an empty string, if no data is present', function (done) {

            var result = GoodLoggly.getMessage({});

            expect(result).to.equal('');
            done();
        });
    });
});
