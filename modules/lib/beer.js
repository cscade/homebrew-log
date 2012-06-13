/*!
 * beer.js
 * seeker-brewing
 * 
 * Created by Carson Christian on 2012-06-12.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

var connect = require('connect'),
	convert = require('./convert'),
	Fermentable = require('./fermentable');

var Beer = module.exports = function (specs) {
	var that = this;
	
	// specs
	this.specs = connect.utils.merge({
		type: '',			// May be one of “Extract”, “Partial Mash” or “All Grain”
		brewer: '',
		batch: {
			size: 0			// Target size of the finished batch in liters.
		},
		boil: {
			size: 0,		// Starting size for the main boil of the wort in liters.
			time: 0			// The total time to boil the wort in minutes.
		},
		efficiency: 100,	// The percent brewhouse efficiency to be used for estimating the starting gravity of the beer. Not required for “Extract” recipes, but is required for “Partial Mash” and “All Grain” recipes.
		fermentables: []	// Fermentables array, direct from XML
	}, specs || {});
	
	// convert fermentables
	if (!Array.isArray(this.specs.fermentables)) this.specs.fermentables = [this.specs.fermentables];
	this.specs.fermentables = this.specs.fermentables.map(function (fermentable) {
		var specs = {};
		
		Object.keys(fermentable).forEach(function (key) {
			specs[key.toLowerCase()] = fermentable[key];
		});
		return new Fermentable(specs);
	});
	
	// calculate og
	this.specs.og = (function () {
		var og = 0;
		
		that.specs.fermentables.forEach(function (fermentable) {
			og = og + (fermentable.gravity(that.specs.batch.size) - 1);
		});
		return 1 + convert.round.call((og * (that.specs.efficiency / 100)), 3);
	})();
};