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
		connection = new cradle.Connection(couch.host, couch.port),
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
