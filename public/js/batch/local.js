// 
//  local.js
//  homebrew-log
//  
//  Created by Carson Christian on 2012-06-13.
//  Copyright 2012 Carson Christian. All rights reserved.
// 

window.addEvent('domready', function () {
	/*
	offset

	Calulate the offset between two Date objects, and return the
	result as a number.

	offset(from, to, as='days','hours')
	*/
	var offset = function (from, to, as) {
		var start, end,
			seconds, minutes, hours, days;
	
		// get ms
		start = (new Date(from)).getTime();
		end = (new Date(to)).getTime();
	
		// create values
		seconds = (end - start) / 1000;
		minutes = seconds / 60;
		hours = minutes / 60;
		days = hours / 24;
	
		if (as === 'hours') {
			return hours.round();
		} if (as === 'days') {
			return days.round(1);
		} else {
			return 'Invalid offset "as" type.';
		}
	};
	
	/*
	View
	*/
	!function (view) {
		view.mobile = (Browser.Platform.ios || Browser.Platform.android || Browser.Platform.webos) || false;
	
		// scroll away from url bar for mobile
		setTimeout(function () {
			if (view.mobile && window.getSize().y < 600) window.scrollTo(0, 1);
		}, 100);
		
		// form validation
		!function (module) {
			// rules
			module.rules = {
				onElementFail: function (el) { el.getParent('.control-group').addClass('error'); },
				onElementPass: function (el) { el.getParent('.control-group').removeClass('error'); }
			};
			// extend validators (global)
			Form.Validator.add('validate-dateWithTime', {
				errorMsg: 'This field requires a date.',
				test: function (element) {
					if (Date.parse(element.value) === null) return false;
					if (!Date.parse(element.value).isValid()) return false;
					element.value = Date.parse(element.value).format('%x %X');
					return true;
				}
			});
			// forms
			module.forms = {
				createDataPoint: new Form.Validator(document.getElement('form[action="/createDataPoint"]'), module.rules)
			};
		}(view.validation = new view.Module());
		
		// nav tabs
		jQuery('#batch ul.nav.nav-tabs a').click(function (e) {
			if (e) e.preventDefault();
			jQuery(this).tab('show');
			// charting triggers
			if (document.id(this).get('href') === '#batchPlot') {
				view.plot.generate();
			} else {
				view.plot.cleanup();
			}
			if (document.id(this).get('href') === '#batchDevice') {
				var time = jQuery.timeago(Date.parse(document.getElement('[data-nextEdge]').get('data-nextEdge')));
				
				time = time.slice(0, time.indexOf(' ago'));
				document.getElement('[data-nextEdge]').set('text', time);
			}
		});
		
		// delete batch
		document.getElement('#deleteBatchModal a.btn-danger').addEvent('click', function (e) {
			e.stop();
			document.getElement('#batch form[action="/updateBatch"]').set('action', '/deleteBatch').submit();
		});
		
		// create data point
		document.getElement('#createDataPoint form').addEvent('submit', function (e) {
			if (!this.validate()) return e.stop(), false;
			if (Date.parse(this.getElement('input[name=at]').get('value')) < (new Date()).decrement('day', 30) && !window.confirm('This date is more than 30 days ago. Save anyways?')) return e.stop(), false;
			if (Date.parse(this.getElement('input[name=at]').get('value')) > (new Date()) && !window.confirm('This date is in the future. Save anyways?')) return e.stop(), false;
			this.getElement('input[name=at]').set('value', Date.parse(this.getElement('input[name=at]').get('value')));
			if (this.getElement('input[name=gravity]').get('disabled') !== true) this.getElement('input[name=gravity]').set('value', '1.' + this.getElement('input[name=gravity]').get('value'));
		});
		
		// now button
		document.getElement('#createDataPoint form button.now').addEvent('click', function () {
			document.getElement('#createDataPoint form input[name=at]').set('value', (new Date()).format('%x %X'));
		});
		
		// action chooser
		document.getElement('#createDataPoint form select[name=action]').addEvent('change', function () {
			this.getParent('form').getElements('.hide').hide();
			this.getParent('form').getElements('.hide input, .hide select, .hide textarea').set('disabled', true);
			this.getParent('form').getElements('.' + this.get('value')).show();
			this.getParent('form').getElements('.' + this.get('value') + ' input, .' + this.get('value') + ' select, .' + this.get('value') + ' textarea').set('disabled', false);
			this.getParent('form').getElements('.control-group').removeClass('error');
		});
		
		// batch charting
		!function (module) {
			// plot options
			module.options = {
				xaxis: {
					show: true,
					position: 'bottom'
				},
				yaxis: {
					show: true,
					position: 'left',
					// min: 55, 
					// max: 80,
					tickSize: 1
				},
				colors: ["#3F9FCF", "#3c3c3c", "#3c3c3c", "#3c3c3c"],
				grid: {
					markings: [
						// lag
						{ color: "#eac932", xaxis: { from: 15, to: 15 } },
						// exponential growth
						{ color: "#3F9FCF", xaxis: { from: 96, to: 96 } },
						// stationary
						{ color: "#1dbc48", xaxis: { from: 240, to: 240 } }
					]
				}
			};
			
			/*
			generate
			
			format data and generate chart
			*/
			module.generate = function () {
				var points = ampl.get('batch').points, pitch, temps, ambients;
				
				if (!points.length) return module.cleanup();
				// find pitch
				points.each(function (point) { if (point.action === 'pitch') pitch = point; });
				if (!pitch) return module.cleanup();
				// use pitch as zero
				pitch.plotTime = (((pitch.at / 1000) / 60) / 60).round();
				pitch.plotAt = 0;
				
				// sort by time, asc
				points.sort(function (a, b) { return a.at > b.at ? 1 : (a.at < b.at ? -1 : 0); });
				
				// find temps & ambients
				temps = points.filter(function (point) { return point.temp !== undefined; });
				ambients = points.filter(function (point) { return point.ambient !== undefined; });
				// develop plotAt for all points vs pitch (in hours)
				temps.each(function (point) { point.plotAt = (((point.at / 1000) / 60) / 60).round() - pitch.plotTime; });
				ambients.each(function (point) { point.plotAt = (((point.at / 1000) / 60) / 60).round() - pitch.plotTime; });
				
				module.draw([
					{
						label: '&deg;F Ambient',
						lines: {
							show: true,
							fill: true,
							lineWidth: 1
						},
						data: ambients.map(function (point) { return [point.plotAt, point.ambient]; })
					}, {
						label: '&deg;F Fermentation',
						lines: {
							show: true,
							lineWidth: 2
						},
						data: temps.map(function (point) { return [point.plotAt, point.temp]; })
					}, {
						points: {
							show: true,
							lineWidth: 1,
							radius: 4
						},
						data: temps.filter(function (point) { return point.action === 'auto-temp'; }).map(function (point) { return [point.plotAt, point.temp]; })
					}, {
						points: {
							show: true,
							lineWidth: 3,
							radius: 4
						},
						data: temps.filter(function (point) { return point.action === 'temp'; }).map(function (point) { return [point.plotAt, point.temp]; })
					}
				]);
			};
			
			/*
			draw
			
			draw all elements of flot chart
			
			@param {Array} series
			*/
			module.draw = function (series) {
				var offsets = {};
				
				module.cleanup();
				
				// resize chart on mobile
				if (view.mobile && window.getSize().y < 600) document.id('flot').setStyle('height', '180px').setStyle('width', '98%');
				
				// draw flot chart
				module.flot = jQuery.plot(jQuery("#flot"), series, module.options);
				
				if (!view.mobile) {
					// get offsets for label locations
					offsets.lag = module.flot.pointOffset({ x: 1, y: module.flot.getData()[1].data[0][1] + 0.5 }); // .5 degree above and 1 hour right of ferment temp 0
					offsets.growth = module.flot.pointOffset({ x: 16, y: module.flot.getData()[1].data[0][1] + 0.5 }); // .5 degree above ferment temp 0, and 1 hour right of phase start
					offsets.stationary = module.flot.pointOffset({ x: 97, y: module.flot.getData()[1].data[0][1] + 0.5 }); // .5 degree above ferment temp 0, and 1 hour right of phase start
					offsets.conditioning = module.flot.pointOffset({ x: 241, y: module.flot.getData()[1].data[0][1] + 0.5 }); // .5 degree above ferment temp 0, and 1 hour right of phase start
					// apply labels to flot chart
					document.id('flot').adopt([
						new Element('div.label', {
							text: 'Lag',
							styles: {
								position: 'absolute',
								left: offsets.lag.left + 'px',
								top: offsets.lag.top + 'px'
							}
						}),
						new Element('div.label.label-warning', {
							text: 'Growth (Esters)',
							styles: {
								position: 'absolute',
								left: offsets.growth.left + 'px',
								top: offsets.growth.top + 'px'
							}
						}),
						new Element('div.label.label-info', {
							text: 'Stationary (Cleanup)',
							styles: {
								position: 'absolute',
								left: offsets.stationary.left + 'px',
								top: offsets.stationary.top + 'px'
							}
						}),
						new Element('div.label.label-success', {
							text: 'Conditioning',
							styles: {
								position: 'absolute',
								left: offsets.conditioning.left + 'px',
								top: offsets.conditioning.top + 'px'
							}
						})
					]);
				}
				
				// apply axis label
				document.getElement('.container').grab(new Element('div.volatile.xaxis', {
					text: 'Hours Elapsed vs Pitch',
					styles: {
						position: 'absolute',
						top: document.id('flot').getPosition().y + document.id('flot').getSize().y + 10 + 'px'
					}
				}));
				document.getElement('.volatile.xaxis').setStyle('left', (window.getSize().x / 2) - (document.getElement('.volatile.xaxis').getSize().x / 2));
			};
			
			/*
			cleanup
			
			clean up generated elements
			*/
			module.cleanup = function () {
				document.getElements('.volatile').destroy();
				document.id('flot').empty();
			};
		}(view.plot = new view.Module());
		
		// device integration
		!function (module) {
			// populate probes
			document.getElement('#batchDevice select[name=device]').addEvent('change', function () {
				var sensors = JSON.parse(this.get('value')).sensors,
					process = document.getElement('#batchDevice select[name=process]'),
					ambient = document.getElement('#batchDevice select[name=ambient]');
				
				if (sensors) {
					[process, ambient].each(function (select) {
						select.set('value', '-1').getElements('option[value!=-1]').destroy();
						select.adopt(sensors.map(function (sensor, index) {
							return new Element('option', {
								html: '&nbsp;&nbsp;' + index + ': ' + sensor.name,
								value: index
							});
						}));
						select.set('disabled', false);
					});
				} else {
					[process, ambient].each(function (select) {
						select.set('value', '-1').getElements('option[value!=-1]').destroy();
						select.set('disabled', true);
					});
				}
			});
			// include points
			document.id('showAuto').addEvent('change', function () {
				view.points.draw(!this.get('checked'));
			});
		}(view.intregration = new view.Module());
		
		!function (module) {
			module.draw = function (excludeAuto) {
				var points = document.getElement('#batch table tbody'),
					batch = ampl.get('batch'),
					descriptions = ampl.get('descriptions'),
					offsetFrom;
				
				points.empty();
				if (batch.points.length) {
					points.getElements('tr').destroy();
					batch.points.sort(function (a, b) {
						// sort oldest point last
						return a.at > b.at ? -1 : (a.at < b.at ? 1 : 0);
					});
					
					// find "start" point. Use "pitch" if only one is available, otherwise use batch "brewed" date
					offsetFrom = batch.points.filter(function (point) { return point.action === 'pitch'; }).length === 1 ? batch.points.filter(function (point) { return point.action === 'pitch'; })[0].at : batch.brewed;
					
					batch.points.each(function (point) {
						var detailContent = '', deleteControl, offsetValue, timeDisplay;
						
						deleteControl = new Element('a.close', {
							href: '#',
							text: '×',
							events: {
								click: function (e) {
									var req,
										that = this;
									
									e.stop();
									if (confirm('Delete data point? There\'s no undo!')) {
										req = new Request({
											url: '/deleteDataPoint',
											data: {
												batch: batch._id,
												point: point._id
											},
											onSuccess: function (res) {
												that.getParent('tbody').getElements('tr[data-point=' + point._id + ']').destroy();
												batch.points = batch.points.filter(function (p) { return p._id !== point._id; });
											}
										});
										req.send();
									}
								}
							}
						});
						
						// calculate time display
						if (offset(offsetFrom, point.at, 'hours') > 72) {
							// display as days
							offsetValue = offset(offsetFrom, point.at, 'days');
							timeDisplay = 'Pitch<strong> ' + (offsetValue > 0 ? '+' : '') + offsetValue + ' days</strong>';
							timeDisplay = timeDisplay + '<br><span class="descriptor">' + jQuery.timeago(point.at) + '</span>';
						} else {
							// display as hours
							offsetValue = offset(offsetFrom, point.at, 'hours');
							timeDisplay = 'Pitch<strong> ' + (offsetValue > 0 ? '+' : '') + offsetValue + ' hours</strong>';
							timeDisplay = timeDisplay + '<br><span class="descriptor">' + jQuery.timeago(point.at) + '</span>';
						}
						
						if (point.action === 'pitch') {
							// pitch
							if (point.ambient) detailContent = detailContent + '<h5>Ambient Temp</h5><p>' + (point.ambient ? (point.ambient + '&deg;F') : '-') + '</p>';
							if (point.notes) detailContent = detailContent + '<h5>Notes</h5><p>' + point.notes + '</p>';
							points.adopt(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									rowspan: 2,
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>\
										<span>' + ', OG <strong>' + (point.gravity ? (point.gravity + '</strong>') : '-') + '</span>'
								}).grab(deleteControl)
							), new Element('tr', { 'data-point': point._id }).grab(new Element('td', {
								html: detailContent
							})));
						} else if (point.action === 'temp' || (!excludeAuto && point.action === 'auto-temp')) {
							// temp
							if (point.ambient) detailContent = detailContent + '<h5>Ambient Temp</h5><p>' + (point.ambient ? (point.ambient + '&deg;F') : '-') + '</p>';
							if (point.notes) detailContent = detailContent + '<h5>Notes</h5><p>' + point.notes + '</p>';
							if (point.action === 'auto-temp') detailContent = detailContent + '<p>(auto)</p>';
							points.adopt(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									rowspan: 2,
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>'
								}).grab(deleteControl)
							), new Element('tr', { 'data-point': point._id }).grab(new Element('td', {
								html: detailContent
							})));
						} else if (point.action === 'gravity') {
							// gravity
							points.adopt(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': SG <strong>' + (point.gravity ? (point.gravity + '</strong>') : '-') + '</span>'
								}).grab(deleteControl)
							));
						} else if (point.action === 'addition') {
							// addition
							points.grab(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>\
										<p>' + point.notes + '</p>'
								}).grab(deleteControl)
							));
						} else if (point.action === 'dryHop') {
							// dryHop
							points.grab(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>\
										<p>' + point.notes + '</p>'
								}).grab(deleteControl)
							));
						} else if (point.action === 'rack') {
							// rack
							if (point.notes) detailContent = detailContent + '<h5>Notes</h5><p>' + point.notes + '</p>';
							points.adopt(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									rowspan: 2,
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': To <strong>' + (point.to ? (point.to + '</strong>') : '-') + '</span>\
										<span>' + ', SG <strong>' + (point.gravity ? (point.gravity + '</strong>') : '-') + '</span>'
								}).grab(deleteControl)
							), new Element('tr', { 'data-point': point._id }).grab(new Element('td', {
								html: detailContent
							})));
						} else if (point.action === 'package') {
							// package
							if (point.notes) detailContent = detailContent + '<h5>Notes</h5><p>' + point.notes + '</p>';
							points.adopt(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									rowspan: 2,
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': In <strong>' + (point['in'] ? (point['in'] + '</strong>') : '-') + '</span>'
								}).grab(deleteControl)
							), new Element('tr', { 'data-point': point._id }).grab(new Element('td', {
								html: detailContent
							})));
						} else if (point.action === 'note') {
							// notes
							if (point.notes) detailContent = point.notes;
							points.adopt(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									rowspan: 2,
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>'
								}).grab(deleteControl)
							), new Element('tr', { 'data-point': point._id }).grab(new Element('td', {
								html: detailContent
							})));
						} else if (point.action === 'tasting') {
							// tasting
							if (point.tasting.aroma) detailContent = detailContent + '<h5>Aroma</h5><p>' + point.tasting.aroma + '</p>';
							if (point.tasting.appearance) detailContent = detailContent + '<h5>Appearance</h5><p>' + point.tasting.appearance + '</p>';
							if (point.tasting.flavor) detailContent = detailContent + '<h5>Flavor</h5><p>' + point.tasting.flavor + '</p>';
							if (point.tasting.mouthfeel) detailContent = detailContent + '<h5>Mouthfeel</h5><p>' + point.tasting.mouthfeel + '</p>';
							if (point.tasting.overall) detailContent = detailContent + '<h5>Overall</h5><p>' + point.tasting.overall + '</p>';
							points.adopt(new Element('tr', { 'data-point': point._id }).adopt(
								new Element('td', {
									rowspan: 2,
									html: timeDisplay
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': From <strong>' + (point.tasting.from ? (point.tasting.from + '</strong>') : '-') + '</span>'
								}).grab(deleteControl)
							), new Element('tr', { 'data-point': point._id }).grab(new Element('td', {
								html: detailContent
							})));
						}
					});
				}
			};
		}(view.points = new view.Module());
		
		// Router
		view.routes = {
			'/': function () {
				setTimeout(function () {
					// set active tab
					jQuery('#batch ul.nav.nav-tabs li a:first').trigger('click');
				}, 10);
				view.points.draw();
			},
			'/createDataPoint': function () {
				var form = document.getElement('#createDataPoint form');
			
				form.reset();
				document.getElement('#createDataPoint form select[name=action]').fireEvent('change');
				form.getElement('input[name=at]').set('value', (new Date()).format('%x %X'));
				form.getElements('.control-group').removeClass('error');
			}
		};
		view.router = Router(view.routes);
		view.router.configure({
			on: function () {
				var route = window.location.hash.slice(2),
					areas = document.getElements('.area');
				
				areas.hide();
				if (document.id(route)) {
					document.id(route).show();
					try {
						if (!view.mobile) document.id(route).getElement('.firstFocus, input[type=text]').focus();
					} catch (e) {}
				} else {
					document.id('batch').show();
				}
			}
		});
		view.router.init();
	}(ampl.set('view', new ampl.View()));
});
