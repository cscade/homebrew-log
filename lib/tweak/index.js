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
	Object.keys(config.watch).forEach(function (database) {
		var design, update, db;
		
		// get design and versions object from database definition
		!function (definition) {
			design = definition.design;
			update = definition.tweak;
		}(require(path.join(__dirname, config.watch[database].path)));
		if (!update || typeof update !== 'function') return; // nothing to do
		
		// look up tweak document for this database
		db = app.couch.database(database);
		db.get('tweak_version', function (e, doc) {
			if (e && e.error !== 'not_found') return app.log.error('[Tweak] ' + database + ' :', e);
			if (app.get('env') === 'development') app.log.verbose('[Tweak] forcing update (development)');
			if (doc && app.get('env') !== 'development' && semver.gte(doc.versions[config.watch[database].resource], version)) return app.log.verbose('[Tweak] database already upgraded : ' + database);
			// updating is required
			doc = doc || { _id: 'tweak_version', resource: 'tweak', versions: {} };
			app.log.info('[Tweak] documents require update : ' + database + '/' + config.watch[database].resource + ' :', { previous: doc.versions[config.watch[database].resource], at: new Date(doc.last).toString() });
			doc.versions[config.watch[database].resource] = version;
			doc.last = Date.now();
			// publish latest design doc
			if (!design) {
				app.log.warn('[Tweak] no design, skipping publish : ' + database + '/' + config.watch[database].resource);
				// run update method on all documents in database
				updateAll(db, update, database, function (e) {
					if (e) return app.log.error('[Tweak] ' + database + '/' + config.watch[database].resource + ' :', e);
					updateTweak(db, doc, database);
				});
			} else {
				// publish design doc
				cradle.publish(design, database, function (e) {
					if (e) return app.log.error('[Tweak] publishing design : ' + database + '/' + config.watch[database].resource + ' :', e);
					// run update method on all documents in database
					updateAll(db, update, database, function (e) {
						if (e) return app.log.error('[Tweak] ' + database + '/' + config.watch[database].resource + ' :', e);
						updateTweak(db, doc, database);
					});
				});
			}
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
@param {Function} next
*/
var updateAll = function (db, update, database, next) {
	var changed = 0;
	
	db.all({ include_docs: true }, function (e, rows) {
		if (e) return app.log.error('[Tweak] ' + database + '/' + config.watch[database].resource + ' :', e), next(e);
		app.log.info('[Tweak] scanning : ' + rows.length + ' documents');
		async.forEach(rows, function (row, next) {
			update(row, function (doc) {
				if (doc) return changed++, db.save(doc._id, doc._rev, doc, next);
				next();
			});
		}, function (e) {
			app.log.info('[Tweak] updated: ' + changed + ' documents');
			next(e);
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
*/
var updateTweak = function (db, doc, database) {
	// update or create tweak_version document
	if (doc._rev) {
		delete doc._rev;
		db.merge(doc._id, doc, function (e) {
			if (e) return app.log.error('[Tweak] can\'t save tweak document : ' + database + '/' + config.watch[database].resource + ' :', e);
			app.log.info('[Tweak] done : ' + database + '/' + config.watch[database].resource);
		});
	} else {
		db.save(doc._id, doc, function (e) {
			if (e) return app.log.error('[Tweak] can\'t save tweak document : ' + database + '/' + config.watch[database].resource + ' :', e);
			app.log.info('[Tweak] done : ' + database + '/' + config.watch[database].resource);
		});
	}
};