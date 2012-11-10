// 
//  local.js
//  homebrew-log
//  
//  Created by Carson Christian on 2012-06-13.
//  Copyright 2012 Carson Christian. All rights reserved.
// 

window.addEvent('domready', function () {
	/*
	View
	*/
	!function (view) {
		view.mobile = (Browser.Platform.ios || Browser.Platform.android || Browser.Platform.webos) || false;
	
		// scroll away from url bar for mobile
		setTimeout(function () {
			if (view.mobile) window.scrollTo(0, 1);
		}, 100);
		
		// form validation
		!function (module) {
			// rules
			module.rules = {
				onElementFail: function (el) { el.getParent('.control-group').addClass('error'); },
				onElementPass: function (el) { el.getParent('.control-group').removeClass('error'); }
			};
			// forms
			module.forms = {
				createBatch: new Form.Validator(document.getElement('form[action="/createBatch"]'), module.rules)
			};
		}(view.validation = new view.Module());
		
		// nav tabs
		jQuery('#content ul.nav.nav-tabs a').click(function (e) {
			if (e) e.preventDefault();
			jQuery(this).tab('show');
		});
		
		// times
		document.getElements('td span[data-mtime]').each(function (el) {
			el.set('text', jQuery.timeago(Date.parse(el.get('data-mtime'))));
		});
		
		// batch detail
		document.getElements('#batches tr.interactive').addEvent('click', function () {
			window.location = '/beer/' + ampl.get('_id') + '/' + this.get('data-id') + '/#/';
		});
		
		// Router
		view.routes = {
			'/': function () {
				setTimeout(function () {
					// set active tab
					jQuery('#content ul.nav.nav-tabs li a:first').trigger('click');
				}, 10);
			},
			'/createBatch': function () {
				document.getElement('#createBatch form').reset();
				document.getElement('#createBatch form input[name=brewed]').set('value', (new Date()).format('%m/%d/%Y'));
				document.getElement('#createBatch form').getElements('.control-group').removeClass('error');
			},
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
					document.id('content').show();
				}
			}
		});
		view.router.init();
	}(ampl.set('view', new ampl.View()));
});
