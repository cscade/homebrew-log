/*!
 * routes
 * seeker-brewing
 * 
 * Created by Carson Christian on 2012-06-12.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

var xml2js = require('xml2js'),
	fs = require('fs'),
	connect = require('connect'),
	path = require('path'),
	Recipe = require('../database/recipe').Recipe;

module.exports = function (app) {
	
	app.get('/', function (req, res) {
		app.couch.database('seeker').view('recipes/all', { include_docs: true }, function (e, rows) {
			if (e) return app.log.error(e.message || e.reason);
			render.dashboard.call(res, {
				recipes: rows.map(function (recipe) {
					return recipe;
				})
			});
		});
	});
	
	app.get('/recipe/:recipe', function (req, res) {
		var extension = req.params.recipe.split('.')[1];
		
		if (extension) {
			req.params.recipe = req.params.recipe.split('.')[0];
		}
		app.couch.database('seeker').get(req.params.recipe, function (e, recipe) {
			if (e) return app.log.error(e.message || e.reason), res.writeHead(404), res.end();
			if (extension) {
				if (extension === 'json') {
					res.writeHeader('content-type', 'application/json');
					res.end(JSON.stringify(recipe));
				} else {
					res.writeHead(400);
					res.end();
				}
			} else {
				render.recipe.call(res, {
					recipe: recipe
				});
			}
		});
	});

	app.get('/upload', function (req, res) {
		render.upload.call(res);
	});

	app.post('/upload', function (req, res) {
		var parser = new xml2js.Parser();

		if (req.files && req.files.recipe) {
			if (req.files.recipe.size < 1) {
				render.upload.call(res, {
					message: '\
						<div class="alert">\
							<strong>Uh...</strong> Forget something?\
						</div>'
				});
				fs.unlink(req.files.recipe.path);
				return;
			}
			fs.readFile(req.files.recipe.path, function(e, data) {
				// discard temp file
				fs.unlink(req.files.recipe.path);
				if (e) return render.upload.call(res, {
					message: '\
						<div class="alert alert-error">\
							<strong>Shit.</strong> Could not read the target file. All is lost.\
						</div>'
				});
				parser.parseString(data, function (e, result) {
					var fileRef = path.join('/Users/cscade/Projects/seeker-brewing', 'public', '_uploads', connect.utils.uid(8) + '.xml');

					if (e || !result.RECIPE) return render.upload.call(res, {
						message: '\
							<div class="alert alert-error">\
								<strong>Nope.</strong> Upload BeerXML v1 only.\
							</div>'
					});
					fs.writeFile(fileRef, data, function (e) {
						if (e) return render.upload.call(res, {
							message: '\
								<div class="alert alert-error">\
									<strong>Shit.</strong> Could not write the target file. All is lost.\
								</div>'
						});
						// good upload
						Recipe.create({
							name: result.RECIPE.NAME,
							data: result.RECIPE,
							xmlFile: fileRef
						}, function (e, recipe) {
							if (e) return render.upload.call(res, {
								message: '\
									<div class="alert alert-error">\
										<strong>Shit.</strong> The xml file was saved at ' + fileRef + ', but we couldn\'t talk to couch.\
									</div>'
							});
							res.redirect('/');
						});
					});
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
		},
		recipe: function (data) {
			this.render('recipe.jade', {
				layout: false,
				locals: connect.utils.merge({
					message: '',
				}, data || {})
			});
		},
		dashboard: function (data) {
			this.render('dashboard.jade', {
				layout: false,
				locals: connect.utils.merge({
					message: '',
				}, data || {})
			});
		}
	};
};