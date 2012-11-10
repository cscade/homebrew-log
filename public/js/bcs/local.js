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
	}(ampl.set('view', new ampl.View()));
});
