// 
//  local.js
//  seeker-brewing
//  
//  Created by Carson Christian on 2012-06-13.
//  Copyright 2012 Carson Christian. All rights reserved.
// 

window.addEvent('domready', function () {
	!function (context) {
		var routes, router, swap,
			mobile = Browser.Platform.ios || Browser.Platform.android || Browser.Platform.webos;
	
		// scroll away from url bar for mobile
		setTimeout(function () {
			if (mobile) window.scrollTo(0, 1);
		}, 10);
		
		// Swapper
		swap = function () {
			var route = window.location.hash.slice(2),
				areas = document.getElements('.area');

			areas.hide();
			if (document.id(route)) {
				document.id(route).show();
				try {
					if (!mobile) document.id(route).getElement('input[type=text]').focus();
				} catch (e) {}
			} else {
				// show content on #/
				document.id('batches').show();
			}
		};
	
		// Validation rules
		context.validationRules = {
			onElementFail: function (el) {
				el.getParent('.control-group').addClass('error');
			},
			onElementPass: function (el) {
				el.getParent('.control-group').removeClass('error');
			}
		};
		// Special Validators
		Form.Validator.add('validate-dateWithTime', {
			errorMsg: 'This field requires a date.',
			test: function (element) {
				if (Date.parse(element.value) === null) return false;
				if (!Date.parse(element.value).isValid()) return false;
				element.value = Date.parse(element.value).format('%x %X');
				return true;
			}
		});
		
		// Form validation
		context.validators = {
			createBatch: new Form.Validator(document.getElement('form[action="/createBatch"]'), context.validationRules),
			createDataPoint: new Form.Validator(document.getElement('form[action="/createDataPoint"]'), context.validationRules)
		};
		
		// times
		document.getElements('td[data-mtime]').each(function (el) {
			el.set('text', jQuery.timeago(Date.parse(el.get('data-mtime'))));
		});
		
		// batch detail
		document.getElements('#batches tr.interactive').addEvent('click', function () {
			var _id = this.get('data-id');
			
			context.active = ampl.batches.filter(function (batch) {
				return batch._id === _id;
			})[0];
			window.location.hash = '#/batch';
		});
		
		// delete batch
		document.getElement('#batch a.btn-danger').addEvent('click', function (e) {
			if (mobile) setTimeout(function () {
				window.scrollTo(0, 0);
			}, 250);
		});
		document.getElement('#deleteBatchModal a.btn-danger').addEvent('click', function (e) {
			e.stop();
			document.getElement('#batch form[action="/updateBatch"]').set('action', '/deleteBatch').submit();
		});
		
		// create data point
		document.getElement('#batch button[data-target="#createDataPointModal"]').addEvent('click', function () {
			var form = document.getElement('#batch form[action="/createDataPoint"]');
			
			form.reset();
			document.getElement('#batch form[action="/createDataPoint"] select[name=action]').fireEvent('change');
			form.getElement('input[name=at]').set('value', (new Date()).format('%x %X'));
			form.getElements('.control-group').removeClass('error');
			if (mobile) setTimeout(function () { window.scrollTo(0, 0); }, 250), context.hidden = document.getElement('#batch form[action="/updateBatch"]').hide();
			else setTimeout(function () { form.getElement('input[name=at]').focus(); }, 10);
		});
		document.getElement('#createDataPointModal a.btn[data-dismiss=modal]').addEvent('click', function () {
			if (mobile) context.hidden.show();
		});
		document.getElement('#batch form[action="/createDataPoint"]').addEvent('submit', function (e) {
			if (!this.validate()) return e.stop(), false;
			if (Date.parse(this.getElement('input[name=at]').get('value')) < (new Date()).decrement('day', 30) && !window.confirm('This date is more than 30 days ago. Save anyways?')) return e.stop(), false;
			if (Date.parse(this.getElement('input[name=at]').get('value')) > (new Date()) && !window.confirm('This date is in the future. Save anyways?')) return e.stop(), false;
			this.getElement('input[name=at]').set('value', Date.parse(this.getElement('input[name=at]').get('value')));
			if (this.getElement('input[name=gravity]').get('disabled') !== true) this.getElement('input[name=gravity]').set('value', '1.' + this.getElement('input[name=gravity]').get('value'));
		});
		
		// now button
		document.getElement('#batch form[action="/createDataPoint"] button.now').addEvent('click', function () {
			document.getElement('#batch form[action="/createDataPoint"] input[name=at]').set('value', (new Date()).format('%x %X'));
		});
		
		// action chooser
		document.getElement('#batch form[action="/createDataPoint"] select[name=action]').addEvent('change', function () {
			this.getParent('form').getElements('.hide').hide();
			this.getParent('form').getElements('.hide input, .hide select, .hide textarea').set('disabled', true);
			this.getParent('form').getElements('.' + this.get('value')).show();
			this.getParent('form').getElements('.' + this.get('value') + ' input, .' + this.get('value') + ' select, .' + this.get('value') + ' textarea').set('disabled', false);
			this.getParent('form').getElements('.control-group').removeClass('error');
		});
		
		// Router
		routes = {
			'/': function () {},
			'/createBatch': function () {
				document.getElement('#createBatch form').reset();
				document.getElement('#createBatch form input[name=brewed]').set('value', (new Date()).format('%m/%d/%Y'));
				document.getElement('#createBatch form').getElements('.control-group').removeClass('error');
			},
			'/batch': function () {
				var form = document.getElement('#batch form[action="/updateBatch"]'),
					points = document.getElement('#batch table tbody'),
					batch = context.active,
					descriptions = ampl.descriptions,
					offsetFrom;
				
				if (!context.active) return window.location.hash = '#/';
				document.getElements('#batch .name').set('text', batch.name);
				form.getElement('input[name=_id]').set('value', batch._id);
				document.getElement('#batch form[action="/createDataPoint"] input[name=batch]').set('value', batch._id);
				form.getElement('input[name=name]').set('value', batch.name);
				form.getElement('.fixed[data-name=brewed]').set('text', Date.parse(batch.brewed).format('%m/%d/%Y'));
				form.getElement('.fixed[data-name=equipment]').set('text', descriptions[batch.equipment]);
				form.getElement('.fixed[data-name=yeastMethod]').set('text', descriptions[batch.yeastMethod]);
				form.getElement('.fixed[data-name=fermentor]').set('text', descriptions[batch.fermentor]);
				form.getElement('.fixed[data-name=control]').set('text', descriptions[batch.control]);
				form.getElement('textarea[name=notes]').set('value', batch.notes);
				if (batch.points.length) {
					points.getElements('tr').destroy();
					batch.points.sort(function (a, b) {
						// sort oldest point first
						return a.at > b.at ? 1 : (a.at < b.at ? -1 : 0);
					});
					
					// find "start" point. Use "pitch" if only one is available, otherwise use batch "brewed" date
					offsetFrom = batch.points.filter(function (point) { return point.action === 'pitch'; }).length === 1 ? batch.points.filter(function (point) { return point.action === 'pitch'; })[0].at : batch.brewed;
					
					batch.points.each(function (point) {
						var detailContent = '', deleteControl, timeDisplay;
						
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
												recipe: ampl._id,
												batch: batch._id,
												point: point._id
											},
											onSuccess: function (res) {
												that.getParent('tbody').getElements('tr[data-point=' + point._id + ']').destroy();
											}
										});
										req.send();
									}
								}
							}
						});
						
						// calculate time display
						timeDisplay = offset(offsetFrom, point.at, 'hours') + '<br>' + jQuery.timeago(point.at);
						
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
						} else if (point.action === 'temp') {
							// temp
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
			}
		};
		router = Router(routes);
		router.configure({
			on: swap
		});
		router.init();
	}({});
});

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