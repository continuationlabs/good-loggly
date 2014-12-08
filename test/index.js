// Load modules
var EventEmitter = require('events').EventEmitter;
var proxyquire   = require('proxyquire');
var hoek         = require('hoek');
var Lab          = require('lab');
var Code         = require('code');

var logglyStub = {
    createClient: function() {},
    log: function(event, tags) { process.exit(); }
};
var GoodLoggly = proxyquire('..', { 'loggly': logglyStub });


// Declare internals
var internals = {};

internals.logglyOptions = {
    token     : 'TOKEN',
    subdomain : 'SUBDOMAIN'
};

internals.logEventData = {
    event     : 'log',
    timestamp : 1396207735000,
    tags      : ['info', 'server'],
    data      : 'Log message',
    pid       : 1234
};

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


// Test shortcuts
var lab = exports.lab = Lab.script();
var describe = lab.describe;
var it = lab.it;
var before = lab.before;
var after = lab.after;
var expect = Code.expect;


describe('GoodLoggly', function () {
    it('should throw an error if not constructed with new', function (done) {
        expect(function () {
            var reporter = GoodLoggly();
        }).to.throw('GoodLoggly must be created with new');
        done();
    });

    it('should throw an error for ops events', function (done) {
        expect(function () {
            var reporter = new GoodLoggly({ ops: '*' });
        }).to.throw('"ops" events are not supported by Loggly');
        done();
    });

    it('should initialize if no events are defined', function (done) {
        expect(function () {
            var reporter = new GoodLoggly(undefined, internals.logglyOptions);
        }).not.to.throw();
        done();
    });

    it('should throw an error if no Loggly API token is defined', function (done) {
        expect(function () {
            var reporter = new GoodLoggly({}, { subdomain: 'SUBDOMAIN' });
        }).to.throw('Loggly API token required');
        done();
    });

    it('should throw an error if no Loggly subdomain is defined', function (done) {
        expect(function () {
            var reporter = new GoodLoggly({}, { token: 'TOKEN' });
        }).to.throw('Loggly subdomain required');
        done();
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

    describe('_report()', function () {
        it('should log an event', function (done) {
            var reporter = new GoodLoggly({ test: '*' }, internals.logglyOptions);
            var result = reporter._report('log', internals.logEventData);

            expect(result).to.deep.equal(internals.logglyResult);
            done();
        });

        it('should pass through optional "name" and "hostname" fields', function (done) {
            var logEventData = hoek.applyToDefaults(internals.logEventData, internals.optionalFields);
            var reporter = new GoodLoggly({ test: '*' }, internals.logglyOptions);
            var result = reporter._report('log', logEventData);

            expect(result).to.include(internals.optionalFields);
            done();
        });
    });
});
