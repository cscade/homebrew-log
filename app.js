/*
	# Homebrew log.

	Logging software for all your home brew data.

	Created by Carson S. Christian <cc@seekerbeer.com>
*/

var Convey = require('convey').Convey;

var app;
var async = require('async');
var express = require('express');
var http = require('http');
var winston = require('winston');

app = express();

// Configuration
app.log = new (winston.Logger)({
	transports: [
		new (winston.transports.Console)({
			level: app.get('env') === 'production' ? 'info' : 'silly',
			timestamp: true,
			colorize: true
		})
	]
});

app.configure(function(){
	app.set('views', __dirname + '/jade');
	app.set('view engine', 'jade');
	app.set('config', require('./config/config.json')[app.get('env')]);
	app.set('version', require('./package.json').version);
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express['static'](__dirname + '/public', {
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

// routes
require('./modules/routes')(app);

/*
	Convey database check.
*/
var convey = new Convey({
	extendDocument: {
		resource: 'convey-document'
	}
});
convey
	.on('start', function (info) {
		app.log.info('[Convey] start: ' + info.couch + ' for application version ' + info.version);
	})
	.on('database:start', function (info) {
		app.log.info('[Convey] database start: ' + info.database);
	})
	.on('resource:fresh', function (info) {
		app.log.info('[Convey] resource already fresh: ' + info.resource);
	})
	.on('resource:stale', function (info) {
		app.log.info('[Convey] resource stale: ' + info.resource + (info.forced ? ' (forced)' : ''));
	})
	.on('target:done', function (info) {
		app.log.info('[Convey] target done: ' + info.database + ', created: ' + info.created + ', updated: ' + info.updated);
	})
	.on('resource:done', function (info) {
		app.log.info('[Convey] resource done: ', info.resource);
	})
	.on('database:done', function (info) {
		app.log.info('[Convey] database done: ' + info.database);
	})
	.on('done', function (info) {
		app.log.info('[Convey] done: ' + info.duration + 's elapsed');
	});

/*
	Startup.
*/
async.series({
	convey: function (next) {
		convey.check(app.get('config').couch.url + ':' + app.get('config').couch.port, app.get('version'), 'config/convey.json', app.get('env') !== 'production', next);
	},
	bcs: function (next) {
		require('./lib/controllers').initialize(app, next);
	},
	listen: function (next) {
		var server;
		
		server = http.createServer(app);
		server.on('error', next);
		server.on('listening', next);
		server.listen(app.get('config').listen);
	}
}, function (e) {
	if (e) return app.log.error('[Error]', e);
	app.log.info('[Application] ' + app.get('config').name + ' ' + app.get('version') + ' listening on port ' + app.get('config').listen);
});