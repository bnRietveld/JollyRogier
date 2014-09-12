// Karma configuration
module.exports = function (config) {
	config.set({

		// base path, that will be used to resolve files and exclude
		basePath  : '',

		// frameworks to use
		frameworks: ['mocha', 'chai', 'sinon-chai'],

		// list of files / patterns to load in the browser
		files     : [
			// these are only watched and served
			{pattern: 'dist/game.js'},
			// included files - tests
			{pattern: 'test/unit/**/*.js'}
		],

		preprocessors: {
			// source files, that you wanna generate coverage for
			// do not include tests or libraries
			// (these files will be instrumented by Istanbul)
            '/dist/game.js': ['coverage']
		},

//		// optionally, configure the reporter
		coverageReporter: {
			type : 'html',
			dir : '.coverage/'
		},

		// list of files to exclude
		exclude       : [

		],
        // FIXME coverage does not work anymore
		// test results reporter to use
		// possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters     : ['dots', 'coverage'],
//		reporters     : ['dots'],

		// enable / disable colors in the output (reporters and logs)
		colors        : true,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel      : config.LOG_INFO,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch     : true,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		browsers      : ['Chrome'],
//		browsers      : ['PhantomJS'],

		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 60000,

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun     : false,

		plugins: [
			'karma-mocha',
			'karma-chai-plugins',
			'karma-coverage',
			'karma-chrome-launcher',
            'karma-phantomjs-launcher'
		]
	});
};
