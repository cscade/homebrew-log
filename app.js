// 
//	app.js
//	seeker-brewing
//	
//	Created by Carson Christian on 2012-06-11.
//	Copyright 2012 Carson Christian. All rights reserved.
// 

/**
 * Module dependencies.
 */

var express = require('express'),
	winston = require('winston'),
	https = require('https'),
	fs = require('fs'),
	app = express();

// Configuration
app.env = process.env.NODE_ENV || 'development';
app.log = winston;
app.couch = new (require('cradle')).Connection('https://seeker.iriscouch.com', 6984, {
	cache: true,
	auth: {
		username: 'seeker',
		password: 'beer'
	}
});

app.configure(function(){
	app.set('views', __dirname + '/jade');
	app.set('view engine', 'jade');
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public', {
		maxAge: 86400000 // 1 Day
	}));
});

app.configure('development', function () {
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function () {
	app.use(express.errorHandler());
});

// Number.from utility
Number.from = function (item) {
	var number = parseFloat(item);
	return isFinite(number) ? number : null;
};

// routes
require('./modules/routes')(app);

var options = {
	key: fs.readFileSync('/etc/ssl/node-snakeoil.pem'),
	cert: fs.readFileSync('/etc/ssl/log.seekerbrewing.dev.pem')
};

https.createServer(options, app).listen(443, function () {
	app.log.remove(winston.transports.Console);
	app.log.add(winston.transports.Console, {
		colorize: true,
		timestamp: true
	});
	app.log.info('seeker-brewing listening on port 443');
});
