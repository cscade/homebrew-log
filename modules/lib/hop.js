//
//  hop.js
//  seeker-brewing
//
//  Created by Carson Christian on 2012-06-13.
//  Copyright 2012 Carson Christian. All rights reserved.
//

var convert = require('./convert');

/**
 * @constructor
 */
/*
 * @param {Object} specs HOP object direct from BEERXML
*/
var Hop = module.exports = function (specs) {
	var that = this;
	
	this.specs = {};
	Object.keys(specs).forEach(function (key) {
		that.specs[key.toLowerCase()] = specs[key];
	});
};

/*
bitterness

Calculate the bitterness contribution for this hop.
Uses Tinseth formula, derived from http://realbeer.com/hops/bcalc_js.html

 * @param {Number} water Batch size in liters.
 * @param {Number} gravity Boil gravity in SG.
 * @returns Bitterness contribution in IBUs & utilization as percentage for this hop.
 * @type Object
*/
Hop.prototype.bitterness = function (water, gravity) {
	var alpha, mass, time, utilization, mgPerL, bu, result;
	
	water = convert.liters.toGallons(water);
	gravity = Number.from(gravity) - 1;
	alpha = Number.from(this.specs.alpha) / 100;
	mass = convert.kilograms.toOunces(this.specs.amount);
	time = Number.from(this.specs.time);
	mgPerL = alpha * mass * 7490 / water;
	utilization = 1.65 * Math.pow(0.000125, gravity) * (1 - Math.exp( - 0.04 * time)) / 4.15;
	bu = (mgPerL * utilization);
	result = {
		ibu: bu,
		utilization: utilization
	};
	// console.log(this.specs.name, result);
	return result;
};