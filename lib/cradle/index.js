// 
//  cradle
//  sgt-app
//  
//  Created by Carson S. Christian on 2012-08-15.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

/*
Tools for working with cradle.
*/

var cradle = require('cradle'),
	app;

exports.initialize = function (appRef) {
	var config = appRef.get('config').couch;
	
	// create connection
	app = appRef;
	app.couch = new cradle.Connection(config.url, config.port, {
		cache: true,
		auth: config.auth
	});
	
	// field validation methods
	var optional = function (doc, field, type) {
		if (type === 'array') {
			if (doc[field] && Object.prototype.toString.call(doc[field]) !== "[object Array]") return field + ' is not of type ' + type;
		} else {
			if (doc[field] && typeof doc[field] !== type) return field + ' is not of type ' + type;
		}
	};
	var require = function (doc, field, type) {
		if (!doc[field]) return field + ' is a required field';
		return optional(doc, field, type);
	};
	
	// document factories
	app.create = {
		beer: function (beer, next) {
			beer.resource = 'beer';
			// defaults
			beer.batches = [];
			beer.ctime = Date.now();
			// create
			app.couch.database(app.get('config').couch.database).save(beer, function (e, res) {
				if (e) return next(e);
				beer._id = res.id;
				beer._rev = res.rev;
				next(null, beer);
			});
		},
		batch: function (beer, batch, next) {
			var e;
			
			// defaults
			batch._id = '0';
			batch.points = batch.points || [];
			
			// convert
			batch.brewed = new Date(batch.brewed) == "Invalid Date" ? false : new Date(batch.brewed).getTime();
			
			// validate
			e = require(batch, 'number', 'string');
			e = require(batch, 'name', 'string');
			e = require(batch, 'brewed', 'number');
			e = require(batch, 'equipment', 'string');
			e = require(batch, 'yeastMethod', 'string');
			e = require(batch, 'fermentor', 'string');
			e = require(batch, 'control', 'string');
			e = optional(batch, 'notes', 'string');
			e = require(batch, 'points', 'array');
			if (e) return next(new Error(e));
			
			// create
			app.couch.database(app.get('config').couch.database).get(beer, function (e, beer) {
				if (e) return next(e);
				// generate a higher batch._id
				beer.batches.forEach(function (b) {
					batch._id = (Number.from(b._id) >= Number.from(batch._id) ? (Number.from(b._id) + 1) : batch._id).toString();
				});
				beer.batches.push(batch);
				app.couch.database(app.get('config').couch.database).save(beer._id, beer._rev, beer, function (e) {
					if (e) return next(e);
					next();
				});
			});
		}
	};
};

/**
 * publish
 * 
 * Publish this design to a database, updating if needed.
 * 
 * Usage: app.couch.publish(design, 'dbname', next)
 * 
 * @param {Object} design Design document
 * @param {String} to
 * @param {Function} next Callback when complete
 */
exports.publish = function (design, to, next) {
	var couch = app.get('config').couch,
		connection = new cradle.Connection(couch.url, couch.port, { cache: false, auth: couch.admin }),
		db = connection.database(to);
	
	db.save(design, function (e) {
		var connect;
		
		if (e && e.error === 'conflict') {
			// update
			db.get(design._id, function (e, design) {
				if (e) return app.log.error('[Design] could not get: ' + design._id), next(e);
				connect = require('connect');
				db.save(connect.utils.merge(design, design), function (e, design) {
					if (e) return app.log.error('[Design] could not save: ' + design._id), next(e);
					app.log.info('[Design] updated: ' + design._id + ' to: ' + to + ' rev: ' + design._rev);
					next();
				});
			});
		}
		else if (e) return app.log.error('[Design] could not save: ' + design._id + ' to: ' + to), next(e);
		else {
			app.log.info('[Design] saved: ' + design._id + ' to: ' + to);
			next();
		}
	});
};
