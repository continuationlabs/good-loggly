# good-loggly

[![Current Version](https://img.shields.io/npm/v/good-loggly.svg)](https://www.npmjs.org/package/good-loggly)
[![Build Status via Travis CI](https://travis-ci.org/continuationlabs/good-loggly.svg?branch=master)](https://travis-ci.org/continuationlabs/good-loggly)
![Dependencies](http://img.shields.io/david/continuationlabs/good-loggly.svg)

[![belly-button-style](https://cdn.rawgit.com/continuationlabs/belly-button/master/badge.svg)](https://github.com/continuationlabs/belly-button)

Loggly broadcasting for Good.

**Credit:** This module was originally written and maintained by [fhemberger](https://github.com/fhemberger).

Version >=1.x.x requires `good@6.x.x`. For older versions of `good`, please use [v0.1.4](https://github.com/continuationlabs/good-loggly/releases/tag/v0.1.4) instead.

## Usage

`good-loggly` is a [good](https://github.com/hapijs/good) reporter implementation to write [hapi](http://hapijs.com/) server events to Loggly.

Example integration:

```javascript
var Hapi = require('hapi');
var Good = require('good');
var GoodLoggly = require('good-loggly');

var server = new Hapi.Server();
var options = {
  reporters: [
    {
      reporter: GoodLoggly,
      events: { log: '*', request: '*'},
      config: {
        // Required
        token: 'YOUR LOGGLY TOKEN',
        subdomain: 'YOUR LOGGLY SUBDOMAIN',
        // Optional
        name: 'myapp',
        hostname: 'myapp.example.com',
        tags: ['global', 'tags', 'for', 'all', 'requests']
      }
    }
  ]
};

server.register({
  plugin: Good,
  register: options
}, function (err) {
  if (err) {
    return console.error(err);
  }
});
```
