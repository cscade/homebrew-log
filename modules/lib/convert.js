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

/*
round

Round a number to the given precision.

 * @param {Number} precision Places to round to.
 * @param {Bool} pad Pad zeros after the decimal place, if any.
*/
exports.round = function (precision, pad) {
	var result, requested = precision;
	
	precision = Math.pow(10, precision || 0).toFixed(precision < 0 ? -precision : 0);
	result = Math.round(this * precision) / precision;
	if (pad && result.toString().indexOf('.') !== -1) {
		result = result.toString();
		while ((result.length - result.indexOf('.')) <= requested) {
			result = result + '0';
		}
	}
	return result;
};