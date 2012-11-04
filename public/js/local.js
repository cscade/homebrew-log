// 
//  local.js
//  seeker-brewing
//  
//  Created by Carson S. Christian on 2012-11-03.
//  Copyright 2012 (ampl)EGO. All rights reserved.
// 

window.addEvent('domready', function () {
	var routes, router, context = {},
		mobile = Browser.Platform.ios || Browser.Platform.android || Browser.Platform.webos;
	
	if (!window.location.hash) window.location = '/#/';
	
	// scroll away from url bar for mobile
	setTimeout(function () {
		if (mobile) window.scrollTo(0, 1);
	}, 10);
	
	// Validation rules
	context.validationRules = {
		onElementFail: function (el) { el.getParent('.control-group').addClass('error'); },
		onElementPass: function (el) { el.getParent('.control-group').removeClass('error'); }
	};
		
	// Form validation
	context.validators = {
		createBeer: new Form.Validator(document.getElement('form[action="/createBeer"]'), context.validationRules)
	};
	
	/*
	Beer List
	*/
	// edit time
	document.getElements('td[data-mtime]').each(function (el) {
		el.set('text', jQuery.timeago(Date.parse(el.get('data-mtime'))));
	});
	// click for details
	document.getElements('tr[data-id]').addEvent('click', function () {
		window.location = '/beer/' + this.get('data-id') + '/#/';
	});
	
	// Router
	routes = {
		'/': function () {
			
		},
		'/createBeer': function () {
			document.getElement('form[action="/createBeer"]').getElements('.control-group').removeClass('error');
			document.getElement('form[action="/createBeer"]').reset();
		}
	};
	router = Router(routes);
	router.configure({
		on: function () {
			var route = window.location.hash.slice(2),
				areas = document.getElements('.area');

			areas.hide();
			if (document.id(route)) {
				document.id(route).show();
				try {
					if (!mobile) document.id(route).getElement('.firstFocus, input[type=text]').focus();
				} catch (e) {}
			} else {
				document.id('beers').show();
			}
		}
	});
	router.init();
});