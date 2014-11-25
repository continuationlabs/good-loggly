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
    timestamp : '2014-03-30T21:28:55.000Z',
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

    describe('_timeString()', function () {
        it('should formats the time as ISO 8601 date', function (done) {
            var time = new Date(1396207735000);
            var result = GoodLoggly.timeString(time);

            expect(result).to.equal('2014-03-30T21:28:55.000Z');
            done();
        });
    });

    describe('_report()', function () {

        it('should throw an error for ops events', function (done) {
            expect(function () {
                var reporter = new GoodLoggly({ ops: '*' }, internals.logglyOptions);
            }).to.throw('"ops" events are not supported by Loggly');
            done();
        });

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
