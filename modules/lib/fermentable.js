/*!
 * fermentable.js
 * seeker-brewing
 * 
 * Created by Carson Christian on 2012-06-12.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

var convert = require('./convert');

/**
 * @constructor
 */
/*
 * @param {Object} specs FERMENTABLE object direct from BEERXML
*/
var Fermentable = module.exports = function (specs) {
	var that = this;
	
	this.specs = {};
	Object.keys(specs).forEach(function (key) {
		that.specs[key.toLowerCase()] = specs[key];
	});
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
	var ppppg = (this.specs.yield * 0.01) * 46.214,
		contribution;
	
	contribution = (((ppppg * convert.kilograms.toPounds(this.specs.amount)) / convert.liters.toGallons(water)) / 1000) + 1;
	console.log({
		name: this.specs.name,
		ppppg: convert.round.call(ppppg),
		batch_size: convert.round.call(convert.liters.toGallons(water), 2) + ' gallons',
		contribution: convert.round.call(contribution, 3)
	});
	return contribution;
};

/*
color

 * @param {Number} water Batch size in liters.
 * @returns Color contribution of this fermentable in SRM
 * @type Number
*/
Fermentable.prototype.color = function (water) {
	// Morey's Formula
	// SRM = 1.4922 * (W * L / V) ^ .6859
	
	return Math.pow(1.4922 * ((convert.kilograms.toPounds(this.specs.amount) * Number.from(this.specs.color)) / convert.liters.toGallons(water)), 0.6859);
};
