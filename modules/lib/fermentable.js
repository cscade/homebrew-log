/*!
 * fermentable.js
 * seeker-brewing
 * 
 * Created by Carson Christian on 2012-06-12.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

var connect = require('connect'),
	convert = require('./convert');

var Fermentable = module.exports = function (specs) {
	this.specs = connect.utils.merge({
		name: 'Example Grain',
		yield: 0,		// Percent dry yield (fine grain) for the grain, or the raw yield by weight if this is an extract adjunct or sugar.
		color: 0,		// The color of the item in Lovibond Units (SRM for liquid extracts).
		amount: 0,		// Weight of the fermentable, extract or sugar in Kilograms.
		type: 'Grain'	// May be "Grain", "Sugar", "Extract", "Dry Extract" or "Adjunct".  Extract refers to liquid extract.
	}, specs || {});
};

/**
 * gravity
 * 
 * Return the gravity contribution of this
 * fermentable for the volume of water specified.
 * 
 * @param {Number} water (liters)
 * 
 * @return {Number} sg (unrounded)
 */
Fermentable.prototype.gravity = function (water) {
	var ppppg = (this.specs.yield * 0.01) * 46.214;
	
	console.log(this.specs.name, ppppg, {
		batch: convert.liters.toGallons(water)
	});
	return (((ppppg * convert.kilograms.toPounds(this.specs.amount)) / convert.liters.toGallons(water)) / 1000) + 1;
};
