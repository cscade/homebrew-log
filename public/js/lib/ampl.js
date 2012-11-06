/*!
 * ampl.js
 * sgt-app
 * 
 * Created by Carson Christian on 2012-06-04.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

/**
 * ampl Namespace
 */
!function (context) {
	// require MooTools
	if (!window.MooTools) throw new Error('Namespace requires MooTools');
	
	var Namespace = function () {
		this.collection = {};
	};
	
	/**
	 * set
	 * 
	 * set an object in the collection.
	 * 
	 * @return {Mixed} object
	 */
	Namespace.prototype.set = function (name, object) {
		this.collection[name] = object;
		return object;
	};

	/**
	 * get
	 * 
	 * get an object from the collection.
	 * 
	 * @return {Mixed} object
	 */
	Namespace.prototype.get = function (name) {
		return this.collection[name];
	};
	
	/**
	 * list
	 * 
	 * Log the current collection contents to the console.
	 */
	Namespace.prototype.list = function () {
		Object.each(this.collection, function (value, key) {
			console.log(key, value);
		});
	};
	
	/*
	convenience conventions
	*/
	var View = function () {};
	
	Namespace.prototype.View = View;
	View.prototype.Module = function () {};
	
	context.ampl = new Namespace();
}(window);