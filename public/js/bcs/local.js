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
				createDevice: new Form.Validator(document.getElement('form[action="/bcs/create"]'), module.rules)
			};
		}(view.validation = new view.Module());
		
		!function (module) {
			// edit device
			document.getElements('#content table tbody tr').addEvent('click', function () {
				window.location = '/bcs/' + this.get('data-id') + '/#/';
			});
		}(view.devices = new view.Module());
		
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
