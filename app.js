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
	app = express.createServer();

// Configuration

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

// Routes
app.get('/', function (req, res) {
	res.render('dashboard.jade', { layout: false });
});

app.get('/upload', function (req, res) {
	res.render('upload.jade', { layout: false });
});

app.post('/upload', function (req, res) {
	res.end(JSON.stringify({ files: req.files, body: req.body }));
});

app.listen(80, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
