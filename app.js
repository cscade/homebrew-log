// 
//	app.js
//	homebrew-log
//	
//	Created by Carson Christian on 2012-06-11.
//	Copyright 2012 Carson Christian. All rights reserved.
// 

/**
 * Module dependencies.
 */

var express = require('express'),
	winston = require('winston'),
	http = require('http'),
	fs = require('fs'),
	path = require('path'),
	app = express(),
	tweak = require('./lib/tweak'),
	sslConfig;

// Configuration
app.log = winston;

app.configure(function(){
	app.set('views', __dirname + '/jade');
	app.set('view engine', 'jade');
	app.set('config', JSON.parse(fs.readFileSync(path.join(__dirname, 'config', 'config.json'), 'utf-8'))[app.get('env')]);
	app.set('version', JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')).version);
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

// couch
require('./lib/cradle').initialize(app);

// tweak
tweak.check(app);

// routes
require('./modules/routes')(app);

http.createServer(app).listen(app.get('config').listen, function () {
	app.log.remove(winston.transports.Console);
	app.log.add(winston.transports.Console, {
		colorize: true,
		timestamp: true
	});
	app.log.info(app.get('config').name + ' ' + app.get('version') + ' listening on port ' + app.get('config').listen);
});
