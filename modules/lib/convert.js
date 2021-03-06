/*
	# Conversion tools.
*/

exports.liters = {
	toGallons: function (liters) {
		return Number.from(liters) * 0.2642;
	}
};

exports.kilograms = {
	toPounds: function (kilograms) {
		return Number.from(kilograms) * 2.205;
	},
	toOunces: function (kilograms) {
		return Number.from(kilograms) * 35.27;
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

/*
abv

Calculate the ABV from two gravities.

@param {Number} og
@param {Number} fg

@return {Number} abv
*/
exports.abv = function (og, fg) {
	return exports.round.call(((og - fg) * 131) / 1000, 1, true);
};