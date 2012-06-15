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
	convert = require('../lib/convert'),
	Recipe = require('../database/recipe').Recipe,
	Batch = require('../database/recipe.batch').Batch,
	DataPoint = require('../database/recipe.batch.datapoint').DataPoint;

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
					recipe: {
						_id: recipe._id,
						name: recipe.name,
						type: {
							category: {
								number: recipe.data.style.CATEGORY_NUMBER,
								name: recipe.data.style.CATEGORY
							},
							style: {
								letter: recipe.data.style.STYLE_LETTER,
								name: recipe.data.style.NAME
							},
							link: 'http://www.bjcp.org/styles04/Category' + recipe.data.style.CATEGORY_NUMBER + '.php#style' + recipe.data.style.CATEGORY_NUMBER + recipe.data.style.STYLE_LETTER
						},
						specs: recipe.data,
						batches: recipe.batches.sort(function (a, b) {
							// sort by newest batch first
							return a.brewed > b.brewed ? -1 : (a.brewed < b.brewed ? 1 : 0);
						})
					}
				});
			}
		});
	});
	
	app.post('/createBatch', function (req, res) {
		Recipe.get(req.body._id, function (e, recipe) {
			if (e) return app.log.error(e.message || e.reason), res.writeHead(404), res.end();
			// format batch as a subrecord
			req.body._id = '0';
			recipe.batches.forEach(function (batch) {
				// generate a higher _id
				req.body._id = (Number.from(batch._id) >= Number.from(req.body._id) ? (Number.from(batch._id) + 1) : req.body._id).toString();
			});
			req.body.brewed = new Date(req.body.brewed).getTime();
			Batch.create(req.body, function (e, batch) {
				if (e) return app.log.error(e.message || e.reason), res.writeHead(400), res.end();
				recipe.batches.push(batch);
				recipe.save(function (e) {
					if (e) return app.log.error(e.message || e.reason), res.writeHead(500), res.end();
					res.redirect('/recipe/' + recipe._id + '#/');
				});
			});
		});
	});
	
	app.post('/updateBatch', function (req, res) {
		Recipe.get(req.body.parent, function (e, recipe) {
			var parent = req.body.parent;
			
			if (e) return app.log.error(e.message || e.reason), res.writeHead(404), res.end();
			batch = recipe.batches.filter(function (batch) {
				// find batch
				return batch._id === req.body._id;
			})[0];
			if (!batch) return app.log.error('No batch with id ' + req.body._id + ' in ' + parent), res.writeHead(404), res.end();
			batch.name = req.body.name;
			batch.notes = req.body.notes;
			Batch.create(batch, function (e, batch) {
				if (e) return app.log.error(e.message || e.reason), res.writeHead(400), res.end();
				recipe.batches = recipe.batches.filter(function (batch) {
					// discard prior batch version
					return batch._id !== req.body._id;
				});
				// push in new batch version
				recipe.batches.push(batch);
				recipe.save(function (e) {
					if (e) return app.log.error(e.message || e.reason), res.writeHead(500), res.end();
					res.redirect('/recipe/' + recipe._id + '#/');
				});
			});
		});
	});
	
	app.post('/deleteBatch', function (req, res) {
		Recipe.get(req.body.parent, function (e, recipe) {
			if (e) return app.log.error(e.message || e.reason), res.writeHead(404), res.end();
			recipe.batches = recipe.batches.filter(function (batch) {
				// discard prior batch version
				return batch._id !== req.body._id;
			});
			recipe.save(function (e) {
				if (e) return app.log.error(e.message || e.reason), res.writeHead(500), res.end();
				res.redirect('/recipe/' + recipe._id + '#/');
			});
		});
	});
	
	app.post('/createDataPoint', function (req, res) {
		Recipe.get(req.body.parent, function (e, recipe) {
			var batch, at, pointId = '0';
			
			if (e) return app.log.error(e.message || e.reason), res.writeHead(404), res.end();
			batch = recipe.batches.filter(function (batch) {
				// find batch
				return batch._id === req.body.batch;
			})[0];
			if (!batch) return app.log.error('No batch with id ' + req.body._id + ' in ' + parent), res.writeHead(404), res.end();
			at = new Date(req.body.at);
			if (!at) return app.log.error('Invalid date.'), res.writeHead(400), res.end();
			batch.points.forEach(function (point) {
				// generate a higher _id
				pointId = (Number.from(point._id) >= Number.from(pointId) ? (Number.from(point._id) + 1) : pointId).toString();
			});
			DataPoint.create({
				_id: pointId,
				at: at.getTime(),
				action: req.body.action,
				temp: Number.from(req.body.temp) || undefined,
				ambient: Number.from(req.body.ambient) || undefined,
				to: req.body.to,
				'in': req.body['in'],
				notes: req.body.notes,
				gravity: req.body.gravity,
				tasting: req.body.action === 'tasting' ? {
					from: req.body.from,
					aroma: req.body.aroma,
					appearance: req.body.appearance,
					flavor: req.body.flavor,
					mouthfeel: req.body.mouthfeel,
					overall: req.body.overall
				} : undefined
			}, function (e, point) {
				if (e) return app.log.error(e.message || e.reason), res.writeHead(400), res.end();
				batch.points.push(point);
				recipe.save(function (e) {
					if (e) return app.log.error(e.message || e.reason), res.writeHead(500), res.end();
					res.redirect('/recipe/' + recipe._id + '#/');
				});
			});
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
					var recipe;
					
					if (e || !result.RECIPE) return render.upload.call(res, {
						message: '\
							<div class="alert alert-error">\
								<strong>Nope.</strong> Upload BeerXML v1 only.\
							</div>'
					});
					recipe = {
						ibu: {
							value: Number.from(req.body.ibu),
							model: req.body.ibuMethod
						},
						color: {
							value: Number.from(req.body.color),
							model: req.body.colorMethod
						}
					};
					// translate first level xml keys to lowercase
					Object.keys(result.RECIPE).forEach(function (key) {
						recipe[key.toLowerCase()] = result.RECIPE[key];
					});
					Recipe.create({
						name: result.RECIPE.NAME,
						data: recipe
					}, function (e, recipe) {
						if (e) return render.upload.call(res, {
							message: '\
								<div class="alert alert-error">\
									<strong>Shit.</strong> We couldn\'t talk to couch.\
								</div>'
						});
						res.redirect('/');
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
					convert: convert,
					message: '',
					descriptions: {
						"stovetop": 'Stovetop / Extract / Partial Mash',
						"ag-biab": 'All Grain, BIAB',
						"ag-insulated": 'All Grain, Insulated',
						"ag-direct": 'All Grain, Direct Fire',
						"ag-rims": 'All Grain, RIMS',
						"ag-herms": 'All Grain, HERMS',
						"rehydrate-water": 'Rehydrate in water',
						"rehydrate-wort": 'Rehydrate in wort',
						"starter": 'Starter, simple',
						"starter-O2": 'Starter, simple w/ O2',
						"starter-shaken": 'Starter, shaken',
						"starter-aerated": 'Starter, aerated',
						"starter-stir": 'Starter, stir plate',
						"bucket": 'Bucket',
						"carboy-5": 'Carboy, 5 gal',
						"carboy-6": 'Carboy, 6 gal',
						"conical-plastic": 'Conical, Plastic',
						"conical-stainless": 'Conical, Stainless',
						"none": 'No Control; Let it run wild',
						"manual": 'Manual; Wet towels, swamp cooling, etc',
						"auto-enclosed": 'Auto Space; Temperature controlled space',
						"auto-wort": 'Auto in Wort; Temperature controlled wort',
						"pitch": 'Pitch',
						"temp": 'Temperature',
						"gravity": 'Gravity',
						"addition": 'Addition',
						"dryHop": 'Dry Hop',
						"rack": 'Rack',
						"package": 'Package',
						"tasting": 'Tasting Notes'
					}
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