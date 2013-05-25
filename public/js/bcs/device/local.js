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
				editDevice: new Form.Validator(document.getElement('form[action="/bcs/edit"]'), module.rules)
			};
		}(view.validation = new view.Module());
		
		!function (module) {
			// delete device
			document.getElement('#deleteModal .btn-danger').addEvent('click', function () {
				document.getElement('form[action="/bcs/edit"]').getElement('input[name=delete]').set('value', 'true');
				document.getElement('form[action="/bcs/edit"]').submit();
			});
		}(view.device = new view.Module());
		
		!function (module) {
			module.draw = function (target, value) {
				var chart;
			
				chart = new Highcharts.Chart({
					chart: {
						renderTo: target,
						type: 'gauge',
						alignTicks: false,
						plotBackgroundColor: null,
						plotBackgroundImage: null,
						plotBorderWidth: 0,
						plotShadow: false
					},
					title: false,
					pane: {
						startAngle: -150,
						endAngle: 150
					},
					yAxis: [
						{
							min: 20,
							max: 220,
							lineColor: '#0c5e8d',
							tickColor: '#3792c6',
							minorTickColor: '#3792c6',
							offset: -3,
							lineWidth: 2,
							labels: {
								distance: -18,
								rotation: 'auto'
							},
							tickLength: 8,
							minorTickLength: 6,
							endOnTick: false
						}, {
							min: -6.66,
							max: 104.44,
							tickPosition: 'outside',
							lineColor: '#0f622e',
							lineWidth: 1,
							minorTickPosition: 'outside',
							tickColor: '#2c864e',
							minorTickColor: '#2c864e',
							tickLength: 5,
							minorTickLength: 5,
							labels: {
								distance: -12,
								rotation: 'auto'
							},
							offset: -30,
							endOnTick: false
						}
					],
					series: [
						{
							name: 'Temperature',
							data: [value],
							dataLabels: {
								enabled: false
							}
						}
					]
				});
			};
			
			document.getElements('#temps td').forEach(function (td) {
				if (Number.from(td.get('data-value'))) module.draw(td, Number.from(td.get('data-value')));
			});
			document.getElements('#content table th, #content table td').setStyle('text-align', 'center');
		}(view.gauges = new view.Module());
		
		// Router
		view.routes = {
			'/': function () {},
			'/editDevice': function () {
				document.getElement('form[action="/bcs/edit"]').reset();
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
