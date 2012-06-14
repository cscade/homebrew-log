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
			form.getElement('input[name=at]').set('value', (new Date()).format('%x %X'));
			form.getElements('.control-group').removeClass('error');
			if (mobile) setTimeout(function () { window.scrollTo(0, 0); }, 250), context.hidden = document.getElement('#batch form[action="/updateBatch"]').hide();
			else setTimeout(function () { form.getElement('input[name=at]').focus(); }, 10);
		});
		document.getElement('#createDataPointModal a.btn[data-dismiss=modal]').addEvent('click', function () {
			if (mobile) context.hidden.show();
		});
		document.getElement('#batch form[action="/createDataPoint"]').addEvent('submit', function () {
			this.getElement('input[name=at]').set('value', Date.parse(this.getElement('input[name=at]').get('value')));
		});
		
		// now button
		document.getElement('#batch form[action="/createDataPoint"] button.now').addEvent('click', function () {
			document.getElement('#batch form[action="/createDataPoint"] input[name=at]').set('value', (new Date()).format('%x %X'));
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
						points.grab(new Element('tr').adopt(
							new Element('td', {
								text: new Date(point.at).format('%x %X')
							}),
							new Element('td', {
								html: point.temp + ' &deg;F'
							}),
							new Element('td', {
								html: point.ambient + ' &deg;F'
							})
						));
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