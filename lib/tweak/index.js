// 
//  tweak
//  starusa-sgt
//  
//  Created by Carson S. Christian on 2012-10-26.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

/*
Tweak is a module to ease the manual aspects of keeping
couch documents and views up to date as your application
versions change.

In each watched module, tweak will look for an exports.tweak function
with the following signature:

tweak(doc, next)

Every document in the database will be passed through this function
if tweak determines the resource (in ./config.json) has not been
checked yet for the running application version.

The function can perform any modification to the document, or none.
If the document is modified, return next(doc). This will cause it to be
updated in couch. If it is not modified, return next() instead and tweak
will not ask couch to update it's copy.
*/

/*
dependencies
*/
var path = require('path'),
	fs = require('fs'),
	semver = require('semver'),
	async = require('async'),
	cradle = require('../cradle');

var app;

/*
config
*/
var config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

/*
check

Checks all databases in config, and runs upgrades on documents as needed.
Returns immediately, however work is async.

@param {Object} app
*/
exports.check = function (appRef) {
	var version = appRef.get('version');
	
	if (!config.watch) return;
	app = appRef;
	app.log.verbose('[Tweak] check : ' + version);
	// loop all databases to be checked
	config.watch.forEach(function (watch) {
		var db = app.couch.database(watch.database);
		
		// look up tweak document for this database
		db.get('tweak_version', function (e, doc) {
			if (e && e.error !== 'not_found') return app.log.error('[Tweak] ' + watch.database + ' :', e);
			if (!doc) doc = { _id: 'tweak_version', resource: 'tweak', versions: {} };
			if (app.get('env') === 'development') app.log.verbose('[Tweak] forcing update (development)');
			// run all watched resources
			async.forEach(watch.resources, function (resource, next) {
				var design, update;
			
				// get design and versions object from database definition
				!function (definition) {
					design = definition.design;
					update = definition.tweak;
				}(require(path.join(__dirname, resource.path)));
				if (!update || typeof update !== 'function') return next(); // nothing to do
			
				if (app.get('env') !== 'development' && semver.gte(doc.versions[resource.name], version)) return app.log.verbose('[Tweak] resource already upgraded : ' + watch.database), next();
				// updating is required
				app.log.info('[Tweak] documents require update : ' + watch.database + '/' + resource.name + ' :', { previous: doc.versions[resource.name] });
				doc.versions[resource.name] = version;
				doc.last = Date.now();
				// publish latest design doc
				if (!design) {
					app.log.warn('[Tweak] no design, skipping publish : ' + watch.database + '/' + resource.name);
					// run update method on all documents in database
					updateAll(db, update, watch.database, next);
				} else {
					// publish design doc
					cradle.publish(design, watch.database, function (e) {
						if (e) return next(e);
						// run update method on all documents in database
						updateAll(db, update, watch.database, next);
					});
				}
			}, function (e) {
				if (e) return app.log.error('[Tweak] ' + watch.database + ' :', e);
				updateTweak(db, doc, watch.database, function (e) {
					if (e) return app.log.error('[Tweak] can\'t save tweak document : ' + watch.database + '/' + resource.name + ' :', e);
					app.log.info('[Tweak] ' + watch.database + ' : done');
				});
			});
		});
	});
};

/*
updateAll

Updates all documents in the database by calling the
update method on them.

@param {Object} db
@param {Function} update
@param {String} database
@param {Function} next(e)
*/
var updateAll = function (db, update, database, next) {
	var changed = 0, created = 0, called = 0;
	
	db.all({ include_docs: true }, function (e, rows) {
		if (e) return next(e);
		app.log.info('[Tweak] ' + database + ' : scanning : ' + rows.length + ' documents');
		async.forEach(rows, function (row, next) {
			update(row, function (doc, createDoc) {
				called++;
				if (createDoc) {
					db.save(createDoc, function (e) {
						if (e) return next(e);
						created++;
						if (doc) {
							db.save(doc._id, doc._rev, doc, function (e) {
								if (e) return next(e);
								changed++
								next();
							});
						} else {
							next();
						}
					});
				} else if (doc) {
					changed++;
					db.save(doc._id, doc._rev, doc, next);
				} else {
					next();
				}
			});
		}, function (e) {
			if (e) return next(e);
			app.log.info('[Tweak] ' + database + ' : updated ' + changed + ' documents' + (created ? (' : created ' + created + ' documents') : ''));
			next();
		});
	});
};

/*
updateTweak

Updates the tweak reference document in the database,
preventing multiple passes on conscutive restarts
with no version number change.

@param {Object} db
@param {Object} doc
@param {String} database
@param {Function} next(e)
*/
var updateTweak = function (db, doc, database, next) {
	// update or create tweak_version document
	if (doc._rev) {
		delete doc._rev;
		db.merge(doc._id, doc, next);
	} else {
		db.save(doc._id, doc, next);
	}
};