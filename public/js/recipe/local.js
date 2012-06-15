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
					descriptions = ampl.descriptions;
				
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
					batch.points.each(function (point) {
						var popoverContent = '';
						
						if (point.action === 'pitch') {
							// pitch
							if (point.ambient) popoverContent = popoverContent + '<h4>Ambient Temp</h4><p>' + (point.ambient ? (point.ambient + '&deg;F') : '-') + '</p>';
							if (point.notes) popoverContent = popoverContent + '<br><h4>Notes</h4><p>' + point.notes + '</p>';
							points.grab(new Element('tr', {
								title: 'Details',
								'data-content': popoverContent,
								'data-show': popoverContent ? 'popover' : ''
							}).adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>\
										<span>' + ', OG <strong>' + (point.gravity ? (point.gravity + '</strong>') : '-') + '</span>'
								})
							));
						} else if (point.action === 'temp') {
							// temp
							if (point.ambient) popoverContent = popoverContent + '<h4>Ambient Temp</h4><p>' + (point.ambient ? (point.ambient + '&deg;F') : '-') + '</p>';
							if (point.notes) popoverContent = popoverContent + '<br><h4>Notes</h4><p>' + point.notes + '</p>';
							points.grab(new Element('tr', {
								title: 'Details',
								'data-content': popoverContent,
								'data-show': popoverContent ? 'popover' : ''
							}).adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>'
								})
							));
						} else if (point.action === 'gravity') {
							// gravity
							points.grab(new Element('tr').adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': SG <strong>' + (point.gravity ? (point.gravity + '</strong>') : '-') + '</span>'
								})
							));
						} else if (point.action === 'addition') {
							// addition
							points.grab(new Element('tr').adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>\
										<p>' + point.notes + '</p>'
								})
							));
						} else if (point.action === 'dryHop') {
							// dryHop
							points.grab(new Element('tr').adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': <strong>' + (point.temp ? (point.temp + '</strong>&deg;F') : '-') + '</span>\
										<p>' + point.notes + '</p>'
								})
							));
						} else if (point.action === 'rack') {
							// rack
							if (point.notes) popoverContent = popoverContent + '<h4>Notes</h4><p>' + point.notes + '</p>';
							points.grab(new Element('tr', {
								title: 'Details',
								'data-content': popoverContent,
								'data-show': popoverContent ? 'popover' : ''
							}).adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': To <strong>' + (point.to ? (point.to + '</strong>') : '-') + '</span>\
										<span>' + ', SG <strong>' + (point.gravity ? (point.gravity + '</strong>') : '-') + '</span>'
								})
							));
						} else if (point.action === 'package') {
							// package
							if (point.notes) popoverContent = popoverContent + '<h4>Notes</h4><p>' + point.notes + '</p>';
							points.grab(new Element('tr', {
								title: 'Details',
								'data-content': popoverContent,
								'data-show': popoverContent ? 'popover' : ''
							}).adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': In <strong>' + (point['in'] ? (point['in'] + '</strong>') : '-') + '</span>'
								})
							));
						} else if (point.action === 'tasting') {
							// tasting
							if (point.tasting.aroma) popoverContent = popoverContent + '<h4>Aroma</h4><p>' + point.tasting.aroma + '</p>';
							if (point.tasting.appearance) popoverContent = popoverContent + '<br><h4>Appearance</h4><p>' + point.tasting.appearance + '</p>';
							if (point.tasting.flavor) popoverContent = popoverContent + '<br><h4>Flavor</h4><p>' + point.tasting.flavor + '</p>';
							if (point.tasting.mouthfeel) popoverContent = popoverContent + '<br><h4>Mouthfeel</h4><p>' + point.tasting.mouthfeel + '</p>';
							if (point.tasting.overall) popoverContent = popoverContent + '<br><h4>Overall</h4><p>' + point.tasting.overall + '</p>';
							points.grab(new Element('tr', {
								title: 'Details',
								'data-content': popoverContent,
								'data-show': popoverContent ? 'popover' : ''
							}).adopt(
								new Element('td', {
									text: mobile ? new Date(point.at).format('%x') : new Date(point.at).format('%x %X')
								}),
								new Element('td', {
									html: '\
										<span>' + descriptions[point.action] + '</span>\
										<span>' + ': From <strong>' + (point.tasting.from ? (point.tasting.from + '</strong>') : '-') + '</span>'
								})
							));
						}
					});
					jQuery(points).popover({
						selector: '[data-show=popover]',
						placement: 'bottom'
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