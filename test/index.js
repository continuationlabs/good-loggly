'use strict';

const Stream = require('stream');
const Code = require('code');
const Lab = require('lab');
const Loggly = require('loggly');
const Merge = require('lodash.merge');
const GoodLoggly = require('../lib');

const logglyOptions = {
  token: 'TOKEN',
  subdomain: 'SUBDOMAIN'
};

const logEventData = {
  event: 'log',
  timestamp: 1396207735000,
  tags: ['info', 'server'],
  data: 'Log message',
  pid: 1234
};

const logglyResult = {
  event: 'log',
  timestamp: new Date(1396207735000).toISOString(),
  tags: ['info', 'server'],
  data: 'Log message',
  msg: 'Log message',
  pid: 1234
};

const optionalFields = {
  name: 'loggly-name',
  hostname: 'example.com'
};

const readStream = () => {
  const result = new Stream.Readable({ objectMode: true });
  result._read = function () {};
  return result;
};


// Test shortcuts
const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;


describe('GoodLoggly', () => {
  it('can be created with new', (done) => {
    const reporter = new GoodLoggly(logglyOptions);

    expect(reporter._client).to.exist();
    done();
  });

  it('throws if constructed without new', (done) => {
    expect(() => {
      GoodLoggly();
    }).to.throw(Error, /cannot be invoked without 'new'/);
    done();
  });

  it('can pass in an array of global tags to Loggly', (done) => {
    const options = Merge({}, logglyOptions, { tags: ['foo', 'bar'] });
    const reporter = new GoodLoggly(options);

    expect(reporter._client.tags).to.equal(['foo', 'bar']);
    done();
  });

  it('throws if no Loggly API token is defined', (done) => {
    expect(() => {
      // eslint-disable-next-line no-unused-vars
      const reporter = new GoodLoggly({ subdomain: 'SUBDOMAIN' });
    }).to.throw(Error, 'Loggly API token required');
    done();
  });

  it('throws if no Loggly subdomain is defined', (done) => {
    expect(() => {
      // eslint-disable-next-line no-unused-vars
      const reporter = new GoodLoggly({ token: 'TOKEN' });
    }).to.throw('Loggly subdomain required');
    done();
  });

  it('logs an event', (done) => {
    const stream = readStream();
    const reporter = new GoodLoggly(logglyOptions);

    Loggly.Loggly.prototype.log = function (event, tags) {
      expect(event).to.equal(logglyResult);
      expect(tags).to.equal(['info', 'server']);
      done();
    };

    stream.pipe(reporter);
    stream.push(logEventData);
  });

  it('passes through optional "name" and "hostname" fields', (done) => {
    const stream = readStream();
    const options = Merge({}, logglyOptions, optionalFields);
    const reporter = new GoodLoggly(options);

    Loggly.Loggly.prototype.log = function (event, tags) {
      expect(event).to.equal(Merge({}, logglyResult, optionalFields));
      expect(tags).to.equal(['info', 'server']);
      done();
    };

    stream.pipe(reporter);
    stream.push(logEventData);
  });

  describe('timeString()', () => {
    it('formats the time as ISO 8601 date', (done) => {
      const time = new Date(1396207735000);
      const result = GoodLoggly.timeString(time);

      expect(result).to.equal(time.toISOString());
      done();
    });
  });

  describe('getMessage()', () => {
    it('returns the contents of the message property', (done) => {
      const result = GoodLoggly.getMessage({ data: { message: 'msg' }});

      expect(result).to.equal('msg');
      done();
    });

    it('falls back to the contents of the error property', (done) => {
      const result = GoodLoggly.getMessage({ data: { error: 'err' }});

      expect(result).to.equal('err');
      done();
    });

    it('falls back to the contents of the data property', (done) => {
      const result = GoodLoggly.getMessage({ data: 'dat' });

      expect(result).to.equal('dat');
      done();
    });

    it('returns an empty string, if no data is present', (done) => {
      const result = GoodLoggly.getMessage({});

      expect(result).to.equal('');
      done();
    });
  });
});
