// 
//  lib/controllers
//  homebrew-log
//  
//  Created by Carson S. Christian on 2012-11-12.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

var async = require('async'),
	Device = require('bcs.client');

/*
initialize

Load the current list of devices, poll them for
status, and begin polling if targets are specified.
*/
exports.initialize = function (app, next) {
	var controllers, db;
	
	next = next || function () {};
	
	db = app.couch.database(app.get('config').couch.database);
	
	// get all controllers
	db.view('bcs-controllers/byName', { include_docs: true }, function (e, rows) {
		if (e) return app.log.error(e.message || e.reason);
		controllers = rows.map(function (key, doc) { return doc; });
		controllers.refresh = function (next) { exports.initialize(app, next); }; // convenience method for later refreshing
		app.set('controllers', controllers);
		// get all controller statuses
		async.forEach(controllers, function (bcs, next) {
			bcs.device = new Device(bcs.host, bcs.port, function (e, state) {
				if (e) return next(e);
				if (state.ready) {
					// get sensor information
					bcs.sensors = [0,1,2,3];
					async.map(bcs.sensors, function (i, next) {
						var sensor = {};
						
						bcs.device.read('temp.name' + i, function (e, name) {
							if (e) return next(e);
							sensor.name = name;
							next(null, sensor);
						});
					}, function (e, sensors) {
						if (e) return next(e);
						bcs.sensors = sensors;
						next();
					});
				} else {
					next();
				}
			});
		}, function (e) {
			if (e) return app.log.error(e.message || e.reason), next(e);
			app.log.info("[BCS] Controllers ready: " + controllers.filter(function (bcs) { return bcs.device.info.ready; }).length + ' of ' + controllers.length);
			next();
		});
	});
};