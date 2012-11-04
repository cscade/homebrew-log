// 
//  beer.js
//  seeker-brewing
//  
//  Created by Carson S. Christian on 2012-11-04.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

exports.tweak = function (doc, next) {
	if (doc.resource === 'beer') {
		
	}
	// no-change endpoint
	next();
};

exports.design = {
	_id:"_design/beers",
	language: "javascript",
	views: {
		all: {
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
		
		// Recipe
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
			xmlFile - String
			
			Location of BeerXML file on disk.
			*/
			optional('xmlFile', 'string');
			
			/*
			batches - Array
			
			Batches of this beer.
			*/
			require('batches', 'array');
			
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