// 
//  bcs.js
//  homebrew-log
//  
//  Created by Carson S. Christian on 2012-11-07.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

exports.tweak = function (doc, next) {
	if (doc.resource === 'bcs-controller') {
		
	}
	// no-change endpoint
	next();
};

exports.design = {
	_id:"_design/bcs-controllers",
	language: "javascript",
	views: {
		byName: {
			map: function (doc) {
				if (doc.resource === 'bcs-controller') emit(doc.name, null);
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
		
		// BCS Device
		if (resource === 'bcs-controller') {
			/*
			name - string
			*/
			require('name', 'string');
			
			/*
			host - string
			*/
			require('host', 'string');
			
			/*
			port - number
			*/
			require('port', 'number');
			
			/*
			targets - object
			
			Each "target" is keyed to a batch object with options.
			
			ex. 
			
			targets = {
				3b9283fb28ff9554c8400d7d5a00349e: {
					ambient: 'temp.value0',
					process: 'temp.value1',
					interval: 1000 * 60 * 15 // 15 minutes
				}
			}
			
			This targets object would cause this BCS device
			to record the values of temp0, temp1 to ambient and process respectively
			to batch 3b9283... every 15 minutes.
			*/
			require('targets', 'object');
		}
	}
};