'use strict';

const Assert = require('assert');
const Stream = require('stream');
const Loggly = require('loggly');
const Merge = require('lodash.merge');


class GoodLoggly extends Stream.Writable {
  constructor (config) {
    config = Merge({}, config);

    Assert(typeof config.token === 'string', 'Loggly API token required');
    Assert(typeof config.subdomain === 'string', 'Loggly subdomain required');

    super({ objectMode: true, decodeStrings: false });
    this._config = config;
    this._client = Loggly.createClient({
      token: config.token,
      subdomain: config.subdomain,
      json: true,
      // Tags in JSON logs don't seem to appear properly in Loggly when
      // sent with the X-LOGGLY-TAG header
      useTagHeader: false,
      tags: Array.isArray(config.tags) ? config.tags : []
    });
  }
  _write (data, encoding, callback) {
    // Map hapi event data fields to Loggly fields
    if (this._config.name) {
      data.name = this._config.name;
    }

    if (this._config.hostname) {
      data.hostname = this._config.hostname;
    }

    data.timestamp = GoodLoggly.timeString(data.timestamp);
    data.msg = GoodLoggly.getMessage(data);
    this._client.log(data, data.tags, callback);
  }
}

module.exports = GoodLoggly;


GoodLoggly.timeString = function (timestamp) {
  return new Date(timestamp).toISOString();
};


GoodLoggly.getMessage = function (event) {
  return event.data ? event.data.message || event.data.error || event.data : '';
};
