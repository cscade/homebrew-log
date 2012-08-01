// 
//  auth.js
//  seeker-brewing
//  
//  Created by Carson Christian on 2012-08-01.
//  Copyright 2012 Carson Christian. All rights reserved.
// 

/**
 * Design Doc
 */
exports.design = {
	_id:"_design/auth",
	language: "javascript",
	validate_doc_update: function (newDoc, oldDoc, user) {
		if (!user) throw({
			forbidden: 'Unauthorized.'
		});
		if (user.roles.indexOf('writer') === -1) throw({
			forbidden: 'Unauthorized.'
		});
	}.toString()
};
