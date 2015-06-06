'use strict';

// Load modules

var GoodSqueeze   = require('good-squeeze');
var Hoek          = require('hoek');
var Loggly        = require('loggly');


// Declare internals

var internals = {};


module.exports = internals.GoodLoggly = function (events, config) {

    if (!(this instanceof internals.GoodLoggly)) {
        return new internals.GoodLoggly(events, config);
    }

    config = config || {};

    Hoek.assert(!(events && events.ops), '"ops" events are not supported by Loggly');
    Hoek.assert(typeof config.token === 'string', 'Loggly API token required');
    Hoek.assert(typeof config.subdomain === 'string', 'Loggly subdomain required');

    this._client = Loggly.createClient({
        token        : config.token,
        subdomain    : config.subdomain,
        json         : true,

        // Tags in JSON logs don't seem to appear properly in Loggly when sent with the X-LOGGLY-TAG header
        useTagHeader : false,
        tags         : Array.isArray(config.tags) ? config.tags : []
    });
    this._config = Hoek.clone(config);
    this._streams = {
        squeeze: GoodSqueeze.Squeeze(events)
    };
};


internals.GoodLoggly.prototype.init = function (stream, emitter, callback) {

    this._streams.squeeze.on('data', this._report.bind(this));
    stream.pipe(this._streams.squeeze);
    callback();
};


internals.GoodLoggly.timeString = function (timestamp) {

    return new Date(timestamp).toISOString();
};

internals.GoodLoggly.getMessage = function (event) {

    return event.data ?
        event.data.message || event.data.error || event.data :
        '';
};

internals.GoodLoggly.prototype._report = function (data) {

    // Map hapi event data fields to Loggly fields
    if (this._config.name)     { data.name     = this._config.name; }
    if (this._config.hostname) { data.hostname = this._config.hostname; }
    data.timestamp = internals.GoodLoggly.timeString(data.timestamp);
    data.msg       = internals.GoodLoggly.getMessage(data);

    this._client.log(data, data.tags);
};
