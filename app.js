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
	app = express.createServer();

// Configuration
app.log = winston;
app.couch = new (require('cradle')).Connection('http://plastic', 5984, { cache: true });

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

Number.from = function (item) {
	var number = parseFloat(item);
	return isFinite(number) ? number : null;
};

// routes
require('./modules/routes')(app);

app.listen(80, function () {
	app.log.remove(winston.transports.Console);
	app.log.add(winston.transports.Console, {
		colorize: true,
		timestamp: true
	});
	app.log.info('seeker-brewing listening on port ' + app.address().port);
});