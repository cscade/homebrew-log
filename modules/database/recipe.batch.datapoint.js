// 
//  recipe.batch.datapoint.js
//  seeker-brewing
//  
//  Created by Carson Christian on 2012-06-13.
//  Copyright 2012 Carson Christian. All rights reserved.
// 

var resourceful = require('resourceful');

exports.DataPoint = resourceful.define('datapoint', function () {
	this.number('at', {
		required: true
	});
	this.number('temp', {
		required: true
	});
	this.number('ambient', {
		required: true
	});
});
