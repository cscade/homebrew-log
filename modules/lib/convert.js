/*!
 * convert.js
 * seeker-brewing
 * 
 * Created by Carson Christian on 2012-06-12.
 * Copyright 2012 (ampl)EGO. All rights reserved.
 */

exports.liters = {
	toGallons: function (liters) {
		return Number.from(liters) * 0.2642;
	}
};

exports.kilograms = {
	toPounds: function (kilograms) {
		return Number.from(kilograms) * 2.205;
	}
};

exports.round = function (precision) {
	precision = Math.pow(10, precision || 0).toFixed(precision < 0 ? -precision : 0);
	return Math.round(this * precision) / precision;
};