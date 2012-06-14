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
				areas = document.getElements('.area'),
				subarea;

			areas.hide();
			if (route.indexOf('.') !== -1) subarea = route.split('.')[1], route = route.split('.')[0];
			if (document.id(route)) {
				document.id(route).show();
				// subareas
				if (subarea) document.getElement('#' + route + ' .area.' + subarea).show();
				else {
					try {
						document.getElements('#' + route + ' .area.default').show();
					} catch (e) {}
				}
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
		document.getElement('#deleteBatchModal a.btn-danger').addEvent('click', function (e) {
			e.stop();
			document.getElement('#batch form[action="/updateBatch"]').set('action', '/deleteBatch').submit();
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
					batch = context.active,
					descriptions = ampl.descriptions;
				
				if (!context.active) return window.location.hash = '#/';
				document.getElement('a[href="#/batch.createDataPoint"]').show();
				document.getElements('#batch .name').set('text', batch.name);
				form.getElement('input[name=_id]').set('value', batch._id);
				form.getElement('input[name=name]').set('value', batch.name);
				form.getElement('.fixed[data-name=brewed]').set('text', Date.parse(batch.brewed).format('%m/%d/%Y'));
				form.getElement('.fixed[data-name=equipment]').set('text', descriptions[batch.equipment]);
				form.getElement('.fixed[data-name=yeastMethod]').set('text', descriptions[batch.yeastMethod]);
				form.getElement('.fixed[data-name=fermentor]').set('text', descriptions[batch.fermentor]);
				form.getElement('.fixed[data-name=control]').set('text', descriptions[batch.control]);
				form.getElement('textarea[name=notes]').set('value', batch.notes);
			},
			'/batch.createDataPoint': function () {
				if (!context.active) return window.location.hash = '#/';
				document.getElement('a[href="#/batch.createDataPoint"]').hide();
			}
		};
		router = Router(routes);
		router.configure({
			on: swap
		});
		router.init();
	}({});
});