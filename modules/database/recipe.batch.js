// 
//  recipe.batch.js
//  seeker-brewing
//  
//  Created by Carson Christian on 2012-06-13.
//  Copyright 2012 Carson Christian. All rights reserved.
// 

var resourceful = require('resourceful');

exports.Batch = resourceful.define('batch', function () {
	this.string('name', {
		required: true
	});
	this.number('brewed', {
		required: true
	});
	this.string('equipment', {
		required: true
	});
	this.string('yeastMethod', {
		required: true
	});
	this.string('fermentor', {
		required: true
	});
	this.string('control', {
		required: true
	});
	this.string('notes');
	this.array('points');
	this.timestamps();
});
