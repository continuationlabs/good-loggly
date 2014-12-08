# good-loggly

Loggly broadcasting for Good process monitor

[![Build Status](https://travis-ci.org/fhemberger/good-loggly.svg?branch=master)](http://travis-ci.org/fhemberger/good-loggly)![Current Version](https://img.shields.io/npm/v/good-loggly.svg)


## Usage

`good-loggly` is a [good-reporter](https://github.com/hapijs/good-reporter) implementation to write [hapi](http://hapijs.com/) server events to Loggly.

Example integration:
```javascript
var Hapi = require('hapi');
var server = new Hapi.Server();

var options = {
    reporters: [{
        reporter: require('good-loggly'),
        args: [
            { log: '*', request: '*'},
            {
                // Required
                token     : 'YOUR LOGGLY TOKEN',
                subdomain : 'YOUR LOGGLY SUBDOMAIN',
                // Optional
                name      : 'myapp',
                hostname  : 'myapp.example.com'
                tags      : ['global', 'tags', 'for', 'all', 'requests']
            }
        ]
    }]
};

server.pack.register(
    {
        plugin: require('good'),
        options: options
    }, function (err) {
        if (err) {
            console.log(err);
            return;
        }
    }
);

```


## License

[MIT](LICENSE)
