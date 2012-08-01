/*!
 * recipe.js
 * seeker-brewing
 * 
 * Created by Carson Christian on 2012-06-12.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

var resourceful = require('resourceful');

var config = {
	url: 'https://seeker.iriscouch.com',
	database: 'seeker'
};

exports.Recipe = resourceful.define('recipe', function () {
	this.use('couchdb', {
		host: config.url,
		port: 6984,
		database: config.database,
		secure: true,
		auth: {
			username: 'seeker',
			password: 'beer'
		}
	});

	this.string('name',{
		required: true
	});
	this.object('data', {
		required: true
	});
	this.string('xmlFile');
	this.array('batches');
	this.timestamps();
});

/**
 * Design Doc
 */
exports.design = {
	_id:"_design/recipes",
	language: "javascript",
	views: {
		all: {
			map: function (doc) {
				if (doc.resource === 'Recipe') {
					emit(doc.name, null);
				}
			}
		}
	}
};

/**
 * publish
 * 
 * Publish this design to a database, updating if needed.
 * 
 * Usage: require('recipe').publish.call(app)
 */
exports.publish = function () {
	var app = this,
		cradle = require('cradle'),
		connection = new cradle.Connection(config.url),
		db = connection.database(config.database);
	
	db.save(exports.design, function (e) {
		var connect;
		
		if (e && e.error === 'conflict') {
			// update
			db.get(exports.design._id, function (e, design) {
				if (e) app.log.error('[Design] could not get: ' + exports.design._id);
				else {
					connect = require('connect');
					db.save(connect.utils.merge(design, exports.design), function (e, design) {
						app.log.info('[Design] updated: ' + exports.design._id + ' to: ' + config.database + ' rev: ' + design._rev);
					});
				}
			});
		}
		else if (e) app.log.error('[Design] could not save: ' + exports.design._id + ' to: ' + config.database);
		else app.log.info('[Design] saved: ' + exports.design._id + ' to: ' + config.database);
	});
};