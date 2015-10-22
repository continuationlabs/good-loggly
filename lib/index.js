'use strict';
var Assert = require('assert');
var GoodSqueeze = require('good-squeeze');
var Loggly = require('loggly');
var Merge = require('lodash.merge');


function GoodLoggly (events, config) {
  if (!(this instanceof GoodLoggly)) {
    return new GoodLoggly(events, config);
  }

  config = config || {};

  Assert(!(events && events.ops), 'ops events are not supported by Loggly');
  Assert(typeof config.token === 'string', 'Loggly API token required');
  Assert(typeof config.subdomain === 'string', 'Loggly subdomain required');

  this._client = Loggly.createClient({
    token: config.token,
    subdomain: config.subdomain,
    json: true,

    // Tags in JSON logs don't seem to appear properly in Loggly when sent with the X-LOGGLY-TAG header
    useTagHeader: false,
    tags: Array.isArray(config.tags) ? config.tags : []
  });
  this._config = Merge({}, config);
  this._streams = {
    squeeze: GoodSqueeze.Squeeze(events)
  };
}

module.exports = GoodLoggly;


GoodLoggly.prototype.init = function (stream, emitter, callback) {
  this._streams.squeeze.on('data', this._report.bind(this));
  stream.pipe(this._streams.squeeze);
  callback();
};


GoodLoggly.timeString = function (timestamp) {
  return new Date(timestamp).toISOString();
};


GoodLoggly.getMessage = function (event) {
  return event.data ? event.data.message || event.data.error || event.data : '';
};


GoodLoggly.prototype._report = function (report) {
  var data = Merge({}, report);

  // Map hapi event data fields to Loggly fields
  if (this._config.name) {
    data.name = this._config.name;
  }

  if (this._config.hostname) {
    data.hostname = this._config.hostname;
  }

  data.timestamp = GoodLoggly.timeString(data.timestamp);
  data.msg = GoodLoggly.getMessage(data);
  this._client.log(data, data.tags);
};
