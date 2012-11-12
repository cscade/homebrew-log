// 
//  lib/controllers
//  homebrew-log
//  
//  Created by Carson S. Christian on 2012-11-12.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

var app,
	async = require('async'),
	controllers,
	db,
	Device = require('bcs.client'),
	targets;

/*
Target

Each target object is a self contained logger.
*/
var Target = function (device, probe, interval, batch, key) {
	// properties
	this.device = device;
	this.probe = probe;
	this.interval = interval;
	this.batch = batch;
	this.key = key;
	// "zero" is this past midnight
	this.nextEdge = new Date();
	this.nextEdge.setHours(0);
	this.nextEdge.setMinutes(0);
	this.nextEdge.setSeconds(0);
	this.nextEdge.setMilliseconds(0);
	// find next edge after now
	this.nextEdge = this.nextEdge.getTime();
	while (Date.now() > this.nextEdge) {
		this.nextEdge += this.interval;
	}
	console.log('new target', this.batch, this.key, 'now', Date.now(), 'next edge', this.nextEdge);
};

/*
check

See if a log needs recorded now.
*/
Target.prototype.check = function () {
	if (this.nextEdge < Date.now()) {
		var lastEdge = this.nextEdge,
			that = this;
		
		// increment to next edge
		this.nextEdge += this.interval;
		// log
		this.device.read('temp.value' + this.probe, function (e, temp) {
			if (e) return;
			db.get(that.batch, function (e, batch) {
				var _id = 0, point;
				
				if (e) return;
				batch.points.forEach(function (batch) {
					if (Number.from(batch._id) >= _id) _id = Number.from(batch._id) + 1;
				});
				point = {
					_id: _id,
					at: lastEdge,
					action: 'auto-temp'
				};
				point[that.key] = temp;
				batch.points.push(point);
				db.save(batch._id, batch._rev, batch, function (e) {
					if (e) return;
					console.log('[LOG]', that.batch, 'next edge:', new Date(that.nextEdge).toString(), point);
				});
			});
		});
	}
};


/*
initialize

Load the current list of devices, poll them for
status, and begin polling if targets are specified.
*/
exports.initialize = function (appRef, next) {
	app = appRef;
	next = next || function () {};
	
	db = app.couch.database(app.get('config').couch.database);
	
	// get all controllers
	db.view('bcs-controllers/byName', { include_docs: true }, function (e, rows) {
		if (e) return app.log.error(e.message || e.reason);
		controllers = rows.map(function (key, doc) { return doc; });
		controllers.refresh = function (next) { app.log.info('[BCS] controller refresh'); exports.initialize(app, next); }; // convenience method for later refreshing
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
			var ready = controllers.filter(function (bcs) { return bcs.device.info.ready; }).length;
			
			targets = undefined; // unset any prior targets
			if (e) return app.log.error(e.message || e.reason), next(e);
			app.log.info("[BCS] controllers ready: " + ready + ' of ' + controllers.length);
			if (ready > 0) {
				targets = [];
				controllers.forEach(function (bcs) {
					if (!bcs.device.info.ready) return;
					if (Object.keys(bcs.targets).length < 1) return;
					Object.keys(bcs.targets).forEach(function (batch) {
						var target = bcs.targets[batch];
						
						if (target.ambient) targets.push(new Target(bcs.device, target.ambient, target.interval, batch, 'ambient'));
						if (target.process) targets.push(new Target(bcs.device, target.process, target.interval, batch, 'temp'));
					});
				});
			}
			app.log.info('[BCS] targets:', targets.length ? targets.length : 'none specified');
			next();
		});
	});
};

/*
poll

Check all active targets to see if they need to be logged.
Executes once per second.
*/
setInterval(function () {
	if (!app || !targets) return;
	targets.forEach(function (target) {
		target.check.call(target);
	});
}, 1000);