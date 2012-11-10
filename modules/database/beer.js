// 
//  beer.js
//  homebrew-log
//  
//  Created by Carson S. Christian on 2012-11-04.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

exports.tweak = function (doc, next) {
	var create;
	
	if (doc.resource === 'beer') {
		if (doc.batches && doc.batches.length > 0) {
			create = doc.batches.shift();
			create.beer = doc._id;
			create.resource = 'batch';
			delete create._id;
			return next(doc, create);
		} else if (doc.batches) {
			delete doc.batches;
			return next(doc);
		}
	}
	// no-change endpoint
	next();
};

exports.design = {
	_id:"_design/beers",
	language: "javascript",
	views: {
		byName: {
			map: function (doc) {
				if (doc.resource === 'beer') {
					emit(doc.name, null);
				}
			}
		}
	},
	validate_doc_update: function (n, o) {
		var e, require, optional, resource = n.resource;
		
		// throw convenience wrapper
		e = function (msg) { throw({ forbidden: msg }); };
		
		// delete? allow
		if (n._deleted) return;
		
		// resource specified?
		if (!resource) return e('all documents must have a resource property');
		
		// convenience methods
		require = function (field, type) {
			if (!n[field]) e(field + ' is a required field');
			if (type === 'array') {
				if (Object.prototype.toString.call(n[field]) !== "[object Array]") e(field + ' is not of type ' + type);
			} else {
				if (typeof n[field] !== type) e(field + ' is not of type ' + type);
			}
		};
		optional = function (field, type) {
			if (type === 'array') {
				if (n[field] && Object.prototype.toString.call(n[field]) !== "[object Array]") e(field + ' is not of type ' + type);
			} else {
				if (n[field] && typeof n[field] !== type) e(field + ' is not of type ' + type);
			}
		};
		
		// Beer
		if (resource === 'beer') {
			/*
			name - String
			*/
			require('name', 'string');
			
			/*
			properties - Object
			
			Beer properties (color, bitterness, etc)
			*/
			require('properties', 'object');
			
			/*
			data - Object
			
			BeerXML data.
			*/
			optional('data', 'object');
			
			/*
			mtime - Number
			
			Modified time.
			*/
			require('mtime', 'number');
			
			/*
			ctime - Number
			
			Created time.
			*/
			require('ctime', 'number');
		}
	}
};