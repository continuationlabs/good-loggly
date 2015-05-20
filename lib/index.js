'use strict';

// Load modules
var Loggly = require('loggly');
var Squeeze = require('good-squeeze').Squeeze;
var Hoek = require('Hoek');
var Moment = require('moment');
var Through = require('through2');


// Declare internals
var internals = {};


module.exports = internals.GoodLoggly = function (events, options) {

    if (!(this instanceof internals.GoodLoggly)) {
        return new internals.GoodLoggly(events, options);
    }
    options = options || {};

    Hoek.assert(!(events && events.ops), '"ops" events are not supported by Loggly');

    Hoek.assert(options.token && typeof options.token === 'string', 'Loggly API token required');
    Hoek.assert(options.subdomain && typeof options.subdomain === 'string', 'Loggly subdomain required');

    internals.client = Loggly.createClient({
        token        : options.token,
        subdomain    : options.subdomain,
        json         : true,

        // Tags in JSON logs don't seem to appear properly in Loggly when sent with the X-LOGGLY-TAG header
        useTagHeader : false,
        tags         : Array.isArray(options.tags) ? options.tags : []
    });

    this._settings = Hoek.clone(options);
    this._filter = new Squeeze(events);
};


internals.GoodLoggly.prototype.init = function (stream, emitter, callback) {

    var self = this;

    if (!stream._readableState.objectMode) {
        return callback(new Error('stream must be in object mode'));
    }

    stream.pipe(this._filter).pipe(Through.obj(function goodLogglyTransform (data, enc, next) {

        var eventName = data.event;
        var tags = [];

        /* eslint-disable */
        if (Array.isArray(data.tags)) {
            tags = data.tags.concat([]);
        } else if (data.tags != null) {
            tags = [data.tags];
        }
        /* eslint-enable */

        tags.unshift(eventName);

        if (eventName === 'response') {
            this.push(self._printEvent(data));
            return next();
        }

        var eventPrintData = {
            timestamp: new Date(data.timestamp).toISOString() || Date.now(),
            tags: tags,
            msg: undefined
        };

        if (eventName === 'error') {
            eventPrintData.msg = data.error;

            this.push(self._printEvent(eventPrintData));
            return next();
        }

        if (eventName === 'request' || eventName === 'log') {
            eventPrintData.msg = data.data.message || data.data;

            this.push(self._printEvent(eventPrintData));
            return next();
        }

        // Event that is unknown to good-Loggly, try a default.
        if (data.data) {
            eventPrintData.msg = data.data.message || data.data;
        }

        this.push(self._printEvent(eventPrintData));
        return next();
    }));

    callback();
};


internals.GoodLoggly.prototype._printEvent = function (event) {

    var m = Moment.utc(event.timestamp);
    if (!this._settings.utc) { m.local(); }
    event.timestamp = m.format();

    // Map hapi event data fields to Loggly fields
    if (this._settings.name)     { event.name     = this._settings.name; }
    if (this._settings.hostname) { event.hostname = this._settings.hostname; }

    internals.client.log(event, event.tags);
    return event;
};

