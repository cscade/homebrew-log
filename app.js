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
	xml2js = require('xml2js'),
	fs = require('fs'),
	connect = require('connect'),
	app = express.createServer();
	
var recipes = [];

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
	res.render('dashboard.jade', {
		layout: false,
		locals: {
			/*
				TODO real recipes
			*/
			recipes: recipes
		}
	});
});

app.get('/upload', function (req, res) {
	render.upload.call(res);
});

app.post('/upload', function (req, res) {
	var parser = new xml2js.Parser();
	
	if (req.files && req.files.recipe) {
		if (req.files.recipe.size < 1) return render.upload.call(res, {
				message: '\
					<div class="alert">\
						<strong>Uh...</strong> Forget something?\
					</div>'
			});
		fs.readFile(req.files.recipe.path, function(e, data) {
			if (e) return res.end(JSON.stringify(e));
			parser.parseString(data, function (e, result) {
				if (e || !result.RECIPE) return render.upload.call(res, {
						message: '\
							<div class="alert alert-error">\
								<strong>Nope.</strong> Upload BeerXML v1 only.\
							</div>'
					});
				recipes.push({
					name: result.RECIPE.NAME,
					modified: new Date(),
					data: result.RECIPE
				});
				res.redirect('/');
			});
		});
	}
	else render.upload.call(res);
});

// renderers
var render = {
	upload: function (data) {
		this.render('upload.jade', {
			layout: false,
			locals: connect.utils.merge({
				message: '',
			}, data || {})
		});
	}
};

app.listen(80, function(){
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
