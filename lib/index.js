// Load modules

var GoodReporter  = require('good-reporter');
var safeStringify = require('json-stringify-safe');
var hoek          = require('hoek');
var loggly        = require('loggly');


// Declare internals

var internals = {};


module.exports = internals.GoodLoggly = function (events, options) {
    options = options || {};

    hoek.assert(this.constructor === internals.GoodLoggly, 'GoodLoggly must be created with new');
    hoek.assert(!(events && events.ops), '"ops" events are not supported by Loggly');

    hoek.assert(options.token && typeof options.token === 'string', 'Loggly API token required');
    hoek.assert(options.subdomain && typeof options.subdomain === 'string', 'Loggly subdomain required');

    internals.client = loggly.createClient({
        token     : options.token,
        subdomain : options.subdomain,
        json      : true
    });

    var settings = hoek.clone(options);

    GoodReporter.call(this, events, settings);
};

hoek.inherits(internals.GoodLoggly, GoodReporter);


internals.GoodLoggly.timeString = function (timestamp) {
    return new Date(timestamp).toISOString();
};

internals.GoodLoggly.getMessage = function (event) {
    return event.data ?
        event.data.message || event.data.error || event.data || '' :
        '';
};

internals.GoodLoggly.prototype._report = function (event, eventData) {
    // Map hapi event data fields to Loggly fields
    if (this._settings.name) { eventData.name = this._settings.name; }
    if (this._settings.hostname) { eventData.hostname = this._settings.hostname; }
    eventData.timestamp = internals.GoodLoggly.timeString(eventData.timestamp);
    eventData.msg       = internals.GoodLoggly.getMessage(eventData);

    internals.client.log(eventData, eventData.tags);
    return eventData;
};
