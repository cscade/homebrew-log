// 
//  recipe.batch.js
//  seeker-brewing
//  
//  Created by Carson Christian on 2012-06-13.
//  Copyright 2012 Carson Christian. All rights reserved.
// 

var resourceful = require('resourceful');

exports.Batch = resourceful.define('batch', function () {
	// batch no.
	this.string('number');
	
	// batch name
	this.string('name', {
		required: true
	});
	
	// brewed date
	this.number('brewed', {
		required: true
	});
	
	// equipment type
	this.string('equipment', {
		required: true
	});
	
	// yeast method
	this.string('yeastMethod', {
		required: true
	});
	
	// ferment type
	this.string('fermentor', {
		required: true
	});
	
	// temp control type
	this.string('control', {
		required: true
	});
	
	// notes
	this.string('notes');
	
	// data points
	this.array('points');
});
