/*
	grunt.js
	
	Gruntfile for brew log.
	
	!* Grunt 0.4+
*/

module.exports = function (grunt) {

// Project configuration.
grunt.initConfig({
	/*
	jshint automatic code quality checking
	*/
	jshint: {
		all: ['Gruntfile.js', 'app.js', 'lib/*/*.js', 'modules/*/*.js'],
		options: {
			eqeqeq: true,
			immed: true,
			latedef: true,
			newcap: true,
			noarg: true,
			sub: true,
			undef: true,
			unused: true,
			// relax
			boss: true,
			smarttabs: true,
			strict: false,
			// environment
			node: true
		}
	},
	watch: {
		files: ['Gruntfile.js', 'app.js', 'lib/*/*.js', 'modules/*/*.js'],
		tasks: 'default'
	}
});

// Grab dependencies
grunt.loadNpmTasks('grunt-contrib-jshint');
grunt.loadNpmTasks('grunt-contrib-watch');

// Tasks (command line)
grunt.registerTask('default', ['jshint']);
};