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
		
		if (!window.location.hash || window.location.hash === '#') window.location.hash = '#/';
		
		// form validation
		!function (module) {
			// rules
			module.rules = {
				onElementFail: function (el) { el.getParent('.control-group').addClass('error'); },
				onElementPass: function (el) { el.getParent('.control-group').removeClass('error'); }
			};
			// forms
			module.forms = {
				createDevice: new Form.Validator(document.getElement('form[action="/bcs/create"]'), module.rules),
				editDevice: new Form.Validator(document.getElement('form[action="/bcs/edit"]'), module.rules)
			};
		}(view.validation = new view.Module());
		
		!function (module) {
			// edit device
			document.getElements('#content table tbody tr').addEvent('click', function () {
				module.active = JSON.parse(this.get('data-device'));
				window.location.hash = '#/editDevice';
			});
			// delete device
			document.getElement('#deleteModal .btn-danger').addEvent('click', function () {
				document.getElement('form[action="/bcs/edit"]').getElement('input[name=delete]').set('value', 'true');
				document.getElement('form[action="/bcs/edit"]').submit();
			});
		}(view.devices = new view.Module());
		
		// Router
		view.routes = {
			'/': function () {},
			'/createDevice': function () {
				document.getElement('form[action="/bcs/create"]').reset();
			},
			'/editDevice': function () {
				var form = document.getElement('form[action="/bcs/edit"]');
				
				if (!view.devices.active) return window.location.hash = '#/';
				form.reset();
				form.getElement('input[name=_id]').set('value', view.devices.active._id);
				form.getElement('[data-name=device]').set('text', view.devices.active.state.ready ? view.devices.active.state.firmware : '- offline -');
				form.getElement('input[name=name]').set('value', view.devices.active.name);
				form.getElement('input[name=host]').set('value', view.devices.active.host);
				form.getElement('input[name=port]').set('value', view.devices.active.port);
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
