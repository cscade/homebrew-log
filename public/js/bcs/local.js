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
		
		// form validation
		!function (module) {
			// rules
			module.rules = {
				onElementFail: function (el) { el.getParent('.control-group').addClass('error'); },
				onElementPass: function (el) { el.getParent('.control-group').removeClass('error'); }
			};
			// forms
			module.forms = {
				createDevice: new Form.Validator(document.getElement('form[action="/bcs/create"]'), module.rules)
			};
		}(view.validation = new view.Module());
		
		// Router
		view.routes = {
			'/': function () {},
			'/createDevice': function () {
				document.getElement('form[action="/bcs/create"]').reset();
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
					document.id('content').show();
				}
			}
		});
		view.router.init();
		
		// scroll away from url bar for mobile
		setTimeout(function () {
			if (view.mobile) window.scrollTo(0, 1);
		}, 100);
	}(ampl.set('view', new ampl.View()));
});
