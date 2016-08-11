# good-loggly

[![Current Version](https://img.shields.io/npm/v/good-loggly.svg)](https://www.npmjs.org/package/good-loggly)
[![Build Status via Travis CI](https://travis-ci.org/continuationlabs/good-loggly.svg?branch=master)](https://travis-ci.org/continuationlabs/good-loggly)
![Dependencies](http://img.shields.io/david/continuationlabs/good-loggly.svg)

[![belly-button-style](https://cdn.rawgit.com/continuationlabs/belly-button/master/badge.svg)](https://github.com/continuationlabs/belly-button)

Loggly writable stream.

`good-loggly` is a writable stream that is used to send events to [Loggly](https://www.loggly.com/). Below is an example of how to use it with the [good](https://github.com/hapijs/good) logger for [hapi](http://hapijs.com/).

**Credit:** This module was originally written and maintained by [fhemberger](https://github.com/fhemberger).

## Compatibility

- `good@7.x.x` is compatible with version >=3.x.x.
- `good@6.x.x` is compatible with version 1.x.x and 2.x.x.
- For older versions of `good`, use [v0.1.4](https://github.com/continuationlabs/good-loggly/releases/tag/v0.1.4).

## Usage

### `new GoodLoggly(config)`

Creates a new `GoodLoggly` object where:

- `config` - Configuration object:
  - `token` - Your Loggly token. Required.
  - `subdomain` - Your Loggly subdomain. Required.
  - `[tags]` - A list of global tags to provide to Loggly with all messages.
  - `[name]` - An application name to provide to Loggly with all messages.
  - `[hostname]` - A hostname to provide to Loggly with all messages.
  - `[threshold]` - The number of events to hold before transmission. Defaults to `0` for backwards compatibility, which transmits every event immediately. It is recommended to set `threshold` as high as possible to make data transmission more efficient and reduce the number of network connections that must be initiated.
    - ___Note:___ When bulk messaging is enabled, tags on individual messages will not be transmitted to Loggly. Global tags will continue to be transmitted.
  - `[maxDelay]` - Maximum milliseconds to allow buffer to wait before forcing a stream write on next message. This setting only has an effect if `threshold` is greater than `0`. Defaults to `15000`; set to `0` to turn off this feature. If you have a server that generates logs infrequently, turn on this feature to see logs arriving in batches, but more regularly.

When `stream` emits an "end" event, `GoodLoggly` will transmit any events remaining in its internal buffer to attempt to prevent data loss.

### Example

```javascript
var Hapi = require('hapi');
var Good = require('good');

var server = new Hapi.Server();
var options = {
    reporters: {
        loggly: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{log: '*', request: '*', error: '*', response: '*'}]
        }, {
            module: 'good-loggly',
            args: [{
                token: 'YOUR LOGGLY TOKEN',
                subdomain: 'YOUR LOGGLY SUBDOMAIN',
                tags: ['global', 'tags', 'for', 'all', 'requests'],
                name: 'myapp',
                hostname: 'myapp.example.com',
                threshold: 20,
                maxDelay: 15000
            }]
        }]
    }
};

server.register({
    register: Good,
    options: options
}, function (err) {
    if (err) {
        return console.error(err);
    }
});
```
