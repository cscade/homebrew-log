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
		cache: false,
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
			beer.ctime = Date.now();
			// create
			beer.mtime = Date.now();
			app.couch.database(app.get('config').couch.database).save(beer, function (e, res) {
				if (e) return next(e);
				beer._id = res.id;
				beer._rev = res.rev;
				next(null, beer);
			});
		},
		batch: function (batch, next) {
			batch.resource = 'batch';
			// defaults
			batch.points = batch.points || [];
			batch.brewed = new Date(batch.brewed) == "Invalid Date" ? Date.now() : new Date(batch.brewed).getTime();
			
			// create
			app.couch.database(app.get('config').couch.database).save(batch, function (e, res) {
				if (e) return next(e);
				batch._id = res.id;
				batch._rev = res.rev;
				next(null, batch);
			});
		},
		datapoint: function (batch, datapoint, next) {
			var e;
			
			// defaults
			datapoint._id = '0';
			datapoint.at = new Date(datapoint.at) == "Invalid Date" ? Date.now() : new Date(datapoint.at).getTime();
			
			// validate
			e = require(batch, 'action', 'string');
			e = optional(batch, 'temp', 'number');
			e = optional(batch, 'ambient', 'number');
			e = optional(batch, 'gravity', 'string');
			e = optional(batch, 'to', 'string');
			e = optional(batch, 'in', 'string');
			e = optional(batch, 'notes', 'string');
			e = optional(batch, 'tasting', 'object');
			if (e) return next(new Error(e));
			
			// create
			app.couch.database(app.get('config').couch.database).get(batch, function (e, batch) {
				if (e) return next(e);
				// generate a higher datapoint._id
				batch.points.forEach(function (p) {
					datapoint._id = (Number.from(p._id) >= Number.from(datapoint._id) ? (Number.from(p._id) + 1) : datapoint._id).toString();
				});
				batch.points.push(datapoint);
				app.couch.database(app.get('config').couch.database).save(batch._id, batch._rev, batch, function (e) {
					if (e) return next(e);
					next(null, batch);
				});
			});
		},
		bcs: function (bcs, next) {
			bcs.resource= 'bcs-controller';
			
			// defaults
			bcs.port = Number.from(bcs.port) || 80;
			bcs.targets = {};
			
			// create
			app.couch.database(app.get('config').couch.database).save(bcs, function (e, res) {
				if (e) return next(e);
				bcs._id = res.id;
				bcs._rev = res.rev;
				next(null, bcs);
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
