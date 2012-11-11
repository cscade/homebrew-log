/*!
 * routes
 * homebrew-log
 * 
 * Created by Carson Christian on 2012-06-12.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

var async = require('async'),
	bjcp,
	colorMap,
	convert = require('../lib/convert'),
	Device = require('bcs.client'),
	extend = require('xtend'),
	fs = require('fs'),
	path = require('path'),
	xml2js = require('xml2js');

bjcp = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'lib', 'bjcp.json'), 'utf-8'));

// SRM to RGB Color Model
!function (xml) {
	var parser = new xml2js.Parser();
	
	parser.parseString(xml, function (e, colors) {
		if (e) return app.log.error('could not parse colors xml', e);
		colorMap = colors.COLOR.map(function (color) {
			return {
				srm: Number.from(color.SRM),
				rgb: color.RGB
			};
		});
	});
}(fs.readFileSync(path.join(__dirname, '..', 'lib', 'colors.xml'), 'utf-8'));

module.exports = function (app) {
	
	// locals
	var db = app.couch.database(app.get('config').couch.database);
	
	app.get('/', function (req, res) {
		async.parallel({
			beers: function (next) {
				db.view('beers/byName', { include_docs: true }, function (e, beers) {
					if (e) return next(e);
					next(null, beers.map(function (key, doc) { return doc; }));
				});
			},
			batches: function (next) {
				db.view('batches/byBeer', { group: true }, function (e, rows) {
					var batches = {};
					
					if (e) return next(e);
					rows.forEach(function (beer, count) {
						batches[beer] = count;
					});
					next(null, batches);
				});
			},
			numbers: function (next) {
				db.view('batches/numbers', function (e, numbers) {
					if (e) return next(e);
					numbers = numbers.map(function (key, value) { return value; })[0];
					db.view('batches/byNumber', { key: numbers.max }, function (e, rows) {
						var beer;
						
						if (e) return next(e);
						beer = rows.map(function (key, value) { return value; })[0];
						next(null, {
							numbers: numbers,
							beer: beer
						});
					})
				});
			}
		}, function (e, results) {
			if (e) return app.log.error(e.message || e.reason), res.send(500);
			render.dashboard.call(res, {
				beers: results.beers,
				batches: results.batches,
				numbers: results.numbers
			});
		});
	});
	
	/*
	/beer namespace
	*/
	app.all('/beer/:beer*', function (req, res, next) {
		db.get(req.params.beer, function (e, beer) {
			var color;
			
			if (e) return app.log.error(e.message || e.reason), res.send(500);
			color = convert.round.call(beer.properties.color, 1);
			beer.properties.colorRGB = color ? colorMap.filter(function (c) { return c.srm === color; })[0].rgb : '255,255,255';
			beer.properties.bjcp.name = bjcp.categories[Number.from(beer.properties.bjcp.number) - 1].subcategories.filter(function (cat) { return cat.id === beer.properties.bjcp.number + beer.properties.bjcp.letter; })[0].name;
			req.data = { beer: beer };
			db.view('batches/byBeer', { key: beer._id, include_docs: true, reduce: false }, function (e, rows) {
				if (e) return app.log.error(e.message || e.reason), res.send(500);
				beer.batches = rows.map(function (key, doc) { return doc; });
				db.view('batches/numbers', function (e, numbers) {
					if (e) return next(e);
					req.data.numbers = numbers.map(function (key, value) { return value; })[0];
					next();
				});
			});
		});
	});
	
	app.get('/beer/:beer', function (req, res) {
		var beer = req.data.beer;
		
		render.beer.call(res, {
			beer: {
				_id: beer._id,
				name: beer.name,
				bjcp: beer.properties.bjcp,
				properties: beer.properties,
				batches: beer.batches.sort(function (a, b) {
					// sort by newest batch first
					return a.brewed > b.brewed ? -1 : (a.brewed < b.brewed ? 1 : 0);
				})
			},
			numbers: req.data.numbers
		});
	});
	
	app.get('/beer/:beer/:batch', function (req, res) {
		var beer = req.data.beer, batch;
		
		if (req.params.batch.length !== 32) {
			// lookup batch by number
			batch = beer.batches.filter(function (batch) { return batch.number == req.params.batch; })[0];
		} else {
			// lookup batch by id
			batch = beer.batches.filter(function (batch) { return batch._id === req.params.batch; })[0];
		}
		if (!batch) return app.log.error('no batch ' + req.params.batch), res.send(400);
		render.batch.call(res, {
			beer: beer,
			batch: batch
		});
	});
	
	/*
	/bcs namespace
	*/
	app.all('/bcs*', function (req, res, next) {
		db.view('bcs-controllers/byName', { include_docs: true }, function (e, rows) {
			if (e) return app.log.error(e.message || e.reason), res.send(500);
			req.data = {
				bcss: rows.map(function (key, doc) { return doc; })
			}
			next();
		});
	});
	
	app.get('/bcs', function (req, res) {
		// request state of each BCS device
		async.map(req.data.bcss, function (bcs, next) {
			var device;
			
			device = new Device(bcs.host, bcs.port, function (e, state) {
				if (e) next(e);
				bcs.state = state;
				next(null, bcs);
			});
		}, function (e, bcss) {
			if (e) return app.log.error(e.message || e.reason), res.send(500);
			res.render('bcs/index.jade', {
				bcss: bcss
			});
		});
	});
	
	app.get('/bcs/:id', function (req, res) {
		var bcs, device;
		
		bcs = req.data.bcss.filter(function (bcs) { return bcs._id === req.params.id; })[0];
		if (!bcs) return app.log.error('Device not found.'), res.send(500);
		device = new Device(bcs.host, bcs.port, function (e, state) {
			if (e) return app.log.error(e.message || e.reason), res.send(500);
			bcs.state = state;
			res.render('bcs/device.jade', {
				bcs: bcs
			});
		});
	});
	
	app.post('/bcs/create', function (req, res) {
		app.create.bcs(req.body, function (e, bcs) {
			if (e) return app.log.error(e.message || e.reason), res.send(500);
			res.redirect('/bcs/#/');
		});
	});
	
	app.post('/bcs/edit', function (req, res) {
		if (req.body.delete === 'true') {
			// delete
			db.get(req.body._id, function (e, bcs) {
				if (e) return app.log.error(e.message || e.reason), res.send(500);
				db.remove(bcs._id, bcs._rev, function (e) {
					if (e) return app.log.error(e.message || e.reason), res.send(500);
					res.redirect('/bcs/#/');
				});
			});
		} else {
			// edit
			db.get(req.body._id, function (e, bcs) {
				if (e) return app.log.error(e.message || e.reason), res.send(500);
				delete req.body.delete;
				req.body.port = Number.from(req.body.port) || 80;
				extend(bcs, req.body);
				db.save(bcs._id, bcs._rev, bcs, function (e) {
					if (e) return app.log.error(e.message || e.reason), res.send(500);
					res.redirect('/bcs/' + bcs._id + '/#/');
				});
			});
		}
	});
	
	app.post('/createBeer', function (req, res) {
		var body = req.body, beer,
			parser = new xml2js.Parser(),
			next;
		
		beer = {
			name: body.name,
			properties: {
				bjcp: JSON.parse(body.bjcp),
				color: Number.from(body.color) > 40 ? '40' : (Number.from(body.color) < 0 ? '0' : convert.round.call(Number.from(body.color), 1, true).toString()),
				bitterness: convert.round.call(Number.from(body.bitterness), 1, true).toString(),
				type: body.type,
				og: convert.round.call(1 + (Number.from(body.og) / 1000), 3, true).toString(),
				fg: convert.round.call(1 + (Number.from(body.fg) / 1000), 3, true).toString(),
				efficiency: convert.round.call(Number.from(body.efficiency), 1, true).toString(),
				attenuation: convert.round.call(Number.from(body.attenuation), 1, true).toString(),
				yeast: body.yeast.name + ' (' + body.yeast.type + ')',
				abv: convert.round.call(((Number.from(body.og) - Number.from(body.fg)) * 131) / 1000, 1, true).toString()
			}
		};
		next = function () {
			app.create.beer(beer, function (e, beer) {
				if (e) return app.log.error(e.message || e.reason), res.send(500);
				res.redirect('/beer/' + beer._id + '/#/');
			});
		};
		// BeerXML?
		if (req.files && req.files.recipe && req.files.recipe.size) {
			fs.readFile(req.files.recipe.path, function(e, data) {
				// discard file
				fs.unlink(req.files.recipe.path);
				if (e) return next();
				parser.parseString(data, function (e, result) {
					var recipe = {};
					
					if (e || !result.RECIPE) return next();
					// translate first level xml keys to lowercase
					Object.keys(result.RECIPE).forEach(function (key) {
						recipe[key.toLowerCase()] = result.RECIPE[key];
					});
					beer.recipe = recipe;
					next();
				});
			});
		} else {
			next();
		}
	});
	
	app.post('/createBatch', function (req, res) {
		app.create.batch(req.body, function (e, batch) {
			if (e) return app.log.error(e.message || e.reason), res.send(500);
			res.redirect('/beer/' + batch.beer + '/#/');
		});
	});
	
	app.post('/updateBatch', function (req, res) {
		db.get(req.body._id, function (e, batch) {
			if (e) return app.log.error(e.message || e.reason), res.send(404);
			batch.name = req.body.name;
			batch.notes = req.body.notes;
			db.save(batch._id, batch._rev, batch, function (e) {
				if (e) return app.log.error(e.message || e.reason), res.send(500);
				res.redirect('/beer/' + batch.beer + '/' + batch._id + '/#/');
			});
		});
	});
	
	app.post('/deleteBatch', function (req, res) {
		db.get(req.body._id, function (e, batch) {
			if (e) return app.log.error(e.message || e.reason), res.send(404);
			db.remove(batch._id, batch._rev, function (e) {
				if (e) return app.log.error(e.message || e.reason), res.send(500);
				res.redirect('/beer/' + batch.beer + '/#/');
			});
		});
	});
	
	app.post('/createDataPoint', function (req, res) {
		app.create.datapoint(req.body.batch, {
			at: req.body.at,
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
		}, function (e, batch) {
			if (e) return app.log.error(e.message || e.reason), res.writeHead(400), res.end();
			res.redirect('/beer/' + batch.beer + '/' + batch._id + '/#/');
		});
	});
	
	app.post('/deleteDataPoint', function (req, res) {
		db.get(req.body.batch, function (e, batch) {
			if (e) return app.log.error(e.message || e.reason), res.send(404);
			// filter out point
			batch.points = batch.points.filter(function (point) {
				return point._id !== req.body.point;
			});
			db.save(batch._id, batch._rev, batch, function (e) {
				if (e) return app.log.error(e.message || e.reason), res.send(500);
				res.end();
			});
		});
	});

	// renderers
	var render = {
		beer: function (data) {
			this.render('beer.jade', extend({
				message: '',
				descriptions: descriptions
			}, data || {}));
		},
		batch: function (data) {
			this.render('batch.jade', extend({
				message: '',
				descriptions: descriptions
			}, data || {}));
		},
		dashboard: function (data) {
			var locals;
			
			locals = extend({
				message: '',
				categories: bjcp.categories
			}, data || {});
			
			// sort by mtime
			locals.beers = locals.beers.sort(function (a, b) {
				return a.mtime === b.mtime ? 0 : (a.mtime > b.mtime ? -1 : 1);
			});
			this.render('dashboard.jade', locals);
		}
	};
	var descriptions = {
		"stovetop": 'Stovetop / Extract / Partial Mash',
		"ag-biab": 'All Grain, BIAB',
		"ag-insulated": 'All Grain, Insulated',
		"ag-direct": 'All Grain, Direct Fire',
		"ag-rims": 'All Grain, RIMS',
		"ag-herms": 'All Grain, HERMS',
		"rehydrate-water": 'Dry, Rehydrate in water',
		"rehydrate-wort": 'Dry, Rehydrate in wort',
		"starter": 'Liquid, Starter, simple',
		"starter-O2": 'Liquid, Starter, simple w/ O2',
		"starter-shaken": 'Liquid, Starter, shaken',
		"starter-aerated": 'Liquid, Starter, aerated',
		"starter-stir": 'Liquid, Starter, stir plate',
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
		"note": 'Notes',
		"tasting": 'Tasting Notes'
	};
};