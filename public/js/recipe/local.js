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
		
		// Form validation
		context.validators = {
			createBatch: new Form.Validator(document.getElement('form[action="/createBatch"]'), context.validationRules)
		};
		
		// times
		document.getElements('td[data-mtime]').each(function (el) {
			el.set('text', jQuery.timeago(Date.parse(el.get('data-mtime'))));
		});
		
		// Router
		routes = {
			'/': function () {},
			'/createBatch': function () {
				document.getElement('#createBatch form').reset();
				document.getElement('#createBatch form input[name=brewed]').set('value', (new Date()).format('%m/%d/%Y'));
				document.getElement('#createBatch form').getElements('.control-group').removeClass('error');
			}
		};
		router = Router(routes);
		router.configure({
			on: swap
		});
		router.init();
		
		// Tooltips
		jQuery('#updateAccount').tooltip({
			selector: 'span[data-tooltip]',
			delay: 2000,
			placement: 'bottom'
		});
	}({});
});