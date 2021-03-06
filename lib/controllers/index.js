/*
	# Controllers.
*/

var app,
	async = require('async'),
	controllers,
	db,
	Device = require('bcs.client'),
	targets, updateCycleActive;

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
	app.log.info('[BCS] logging for batch ' + batch + ' : ' + key + ' : next tick at ' + new Date(this.nextEdge).toString());
};

/*
	check

	See if a log needs recorded now.

	@param {Function} next(e)
*/
Target.prototype.check = function (next) {
	if (this.nextEdge < Date.now()) {
		var lastEdge = this.nextEdge,
			that = this;
		
		app.log.silly('[BCS] attempting to log for ' + this.batch + ' : ' + this.key + ' at ' + Date.now());
		// increment to next edge
		this.nextEdge += this.interval;
		// log
		this.device.read('temp.value' + this.probe, function (e, temp) {
			if (e) return next(e);
			db.get(that.batch, function (e, batch) {
				var _id = 0, point;
				
				if (e) return next(e);
				app.log.silly('[BCS] batch returned for ' + that.batch + ' : ' + that.key + ' at ' + Date.now() + ' rev: ' + batch._rev);
				batch.points.forEach(function (batch) {
					if (Number.from(batch._id) >= _id) _id = Number.from(batch._id) + 1;
				});
				point = {
					_id: _id.toString(),
					at: lastEdge,
					action: 'auto-temp'
				};
				point[that.key] = temp;
				batch.points.push(point);
				db.save(batch._id, batch._rev, batch, function (e) {
					if (e) {
						app.log.silly('[BCS] failed to log for ' + that.batch + ' : ' + that.key + ' at ' + Date.now() + ' rev: ' + batch._rev);
						return next(e);
					}
					app.log.silly('[BCS] log ok for ' + that.batch + ' : ' + that.key + ' at ' + Date.now() + ' rev: ' + batch._rev);
					app.log.info('[BCS] log : batch #' + batch.number + ' : ' + that.key + ' : ' + temp + 'F : next tick at ' + new Date(that.nextEdge).toString());
					next();
				});
			});
		});
	} else {
		next();
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
						
						if (target.ambient !== undefined) targets.push(new Target(bcs.device, target.ambient, target.interval, batch, 'ambient'));
						if (target.process !== undefined) targets.push(new Target(bcs.device, target.process, target.interval, batch, 'temp'));
					});
				});
			}
			next();
		});
	});
};

/*
	activeTargets

	Return the active targets array.
*/
exports.activeTargets = function () {
	return targets || [];
};

/*
	poll

	Check all active targets to see if they need to be logged.
	Executes once per second.
*/
setInterval(function () {
	if (updateCycleActive || !app || !targets) return;
	updateCycleActive = true; // start an update cycle
	async.forEachSeries(targets, function (target, next) {
		target.check.call(target, next);
	}, function (e) {
		if (e) app.log.error('[BCS] log : ', e);
		updateCycleActive = false; // finish the update cycle (prevents races if not all targets have finished logging by the next interval)
	});
}, 1000);
