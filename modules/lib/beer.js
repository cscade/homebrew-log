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

/**
 * @constructor
 */
 /*
  * @param {Object} specs Raw data object generated directly from BEERXML
 */
var Beer = module.exports = function (specs) {
	var that = this;
	
	specs = specs || {};
	this.specs = {};
	Object.keys(specs).forEach(function (key) {
		that.specs[key.toLowerCase()] = specs[key];
	});
	
	// convert fermentables
	this.specs.fermentables = this.specs.fermentables.FERMENTABLE;
	if (!Array.isArray(this.specs.fermentables)) this.specs.fermentables = [this.specs.fermentables];
	this.specs.fermentables = this.specs.fermentables.map(function (fermentable) {
		return new Fermentable(fermentable);
	});
	
	// calculate og
	if (this.specs.og) this.specs.precalculated = { og: this.specs.og };
	if (this.specs.fg) this.specs.precalculated.fg = this.specs.fg, delete this.specs.fg;
	this.specs.og = (function () {
		var og = 0;
		
		that.specs.fermentables.forEach(function (fermentable) {
			og = og + (fermentable.gravity(that.specs.batch_size) - 1);
		});
		return 1 + convert.round.call((og * (that.specs.efficiency / 100)), 3);
	})();
};