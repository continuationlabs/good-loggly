# good-loggly

Loggly broadcasting for Good process monitor

[![Build Status](https://travis-ci.org/fhemberger/good-loggly.svg?branch=master)](http://travis-ci.org/fhemberger/good-loggly)![Current Version](https://img.shields.io/npm/v/good-loggly.svg)

Version 1.x.x require `good@6.x.x`. For older versions of `good`, please use [v0.1.4](https://github.com/fhemberger/good-loggly/releases/tag/v0.1.4) instead. Special thanks to [Adam Bretz](https://github.com/arb) for migrating good-loggly to the latest version of `good`.


## Usage

`good-loggly` is a [good](https://github.com/hapijs/good) reporter implementation to write [hapi](http://hapijs.com/) server events to Loggly.

Example integration:
```javascript
var Hapi = require('hapi');
var server = new Hapi.Server();

var options = {
    reporters: [{
        reporter: require('good-loggly'),
        events: { log: '*', request: '*'},
        config: {
            // Required
            token     : 'YOUR LOGGLY TOKEN',
            subdomain : 'YOUR LOGGLY SUBDOMAIN',
            // Optional
            name      : 'myapp',
            hostname  : 'myapp.example.com',
            tags      : ['global', 'tags', 'for', 'all', 'requests']
        }
    }]
};

server.register({
    plugin: require('good'),
    options: options
}, function (err) {

    if (err) {
        return console.error(err);
    }
});

```


## License

[MIT](LICENSE)
