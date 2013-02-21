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
		all: ['Gruntfile.js', 'lib/*/*.js'],
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
		files: 'lib/**',
		tasks: 'default'
	}
});

// Grab dependencies
grunt.loadNpmTasks('grunt-contrib-jshint');

// Tasks (command line)
grunt.registerTask('default', ['jshint']);
};