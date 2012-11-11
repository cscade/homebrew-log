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
			optional('port', 'number');
			
			/*
			target - string
			
			Target batch _id to log to. Absence causes inactivity.
			*/
			optional('target', 'string');
			
			/*
			sensors - object
			
			Assigned temp sensors for ferment/ambient.
			
			ex. { ferment: 0, ambient: 1 }
			*/
			optional('sensors', 'object');
			
			/*
			interval - number
			
			Polling interval, in ms
			*/
			optional('interval', 'number');
		}
	}
};