'use strict';

const Assert = require('assert');
const Stream = require('stream');
const Loggly = require('loggly');
const Merge = require('lodash.merge');


class GoodLoggly extends Stream.Writable {
  constructor (config) {
    config = Merge({ threshold: 0, maxDelay: 15000 }, config);

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

    this._bufferStart = null;
    this._buffer = [];

    // Send last messages on your way out
    this.once('finish', () => {
      this._sendMessages();
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

    this._buffer.push(data);

    if (this._bufferReady()) {
      this._sendMessages(callback);
    } else {
      if (!this._bufferStart) {
        this._bufferStart = Date.now();
      }

      setImmediate(callback);
    }
  }
  _bufferReady () {
    if (this._buffer.length >= this._config.threshold) {
      // Buffer is full
      return true;
    }

    if (this._config.maxDelay > 0 && this._bufferStart &&
      Date.now() - this._bufferStart > this._config.maxDelay) {
      // Max wait time exceeded
      return true;
    }

    return false;
  }
  _sendMessages (callback) {
    const sendComplete = (err) => {
      this._bufferStart = null;
      this._buffer = [];

      if (typeof callback === 'function') {
        callback(err);
      }
    };

    if (this._buffer.length) {
      if (this._buffer.length === 1) {
        // Backward-compatible behavior to do single log send
        return this._client.log(this._buffer[0], this._buffer[0].tags, sendComplete);
      }

      // If using bulk, individual message tags can't be sent
      return this._client.log(this._buffer, sendComplete);
    }

    // Fall-through behavior for empty buffer, ensuring async response
    setImmediate(() => { sendComplete(null); });
  }
}

module.exports = GoodLoggly;


GoodLoggly.timeString = function (timestamp) {
  return new Date(timestamp).toISOString();
};


GoodLoggly.getMessage = function (event) {
  return event.data ? event.data.message || event.data.error || event.data : '';
};
