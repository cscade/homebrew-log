// 
//  batch.js
//  seeker-brewing
//  
//  Created by Carson S. Christian on 2012-11-07.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

exports.tweak = function (doc, next) {
	if (doc.resource === 'batch') {
		
	}
	// no-change endpoint
	next();
};

exports.design = {
	_id:"_design/batches",
	language: "javascript",
	views: {
		// all batches by parent beer id, reduced to counts
		byBeer: {
			map: function (doc) {
				if (doc.resource === 'batch') { emit(doc.beer, null); }
			},
			reduce: "_count"
		},
		// all batches keyed by batch number
		byNumber: {
			map: function (doc) {
				var number;
				
				if (doc.resource === 'batch') {
					number = parseFloat(doc.number);
					emit(isFinite(number) ? number : 0, null);
				}
			}
		},
		// aggregate batch number stats
		numbers: {
			map: function (doc) {
				var number;
				
				if (doc.resource === 'batch') {
					number = parseFloat(doc.number);
					emit(null, isFinite(number) ? number : 0);
				}
			},
			reduce: "_stats"
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
		
		// Batch of Beer
		if (resource === 'batch') {
			/*
			beer - string
			
			couch _id of the beer this is a batch of.
			*/
			require('beer', 'string');
			
			/*
			number - string
			
			Batch index number, server-style.
			*/
			require('number', 'string');
			
			/*
			name - string
			
			Batch name.
			*/
			require('name', 'string');
			
			/*
			brewed - number (Date)
			
			The "brewed" date for the batch. User arbitrary, has no effect on data points.
			*/
			require('brewed', 'number');
			
			/*
			equipment - string
			
			Equipment identifier string.
			*/
			require('equipment', 'string');
			
			/*
			yeastMethod - string
			
			The yeast method identifier string, ex; "starter-stir"
			*/
			require('yeastMethod', 'string');
			
			/*
			fermentor - string
			
			Fermentor identifier string.
			*/
			require('fermentor', 'string');
			
			/*
			control - string
			
			Control type identifier string.
			*/
			require('control', 'string');
			
			/*
			points - array
			
			The data points for the batch.
			*/
			require('points', 'array');
			
			/*
			notes - string
			*/
			optional('notes', 'string');
		}
	}
};