var gulp        = require('gulp');
var jscrush     = require('gulp-jscrush');
var closure     = require('gulp-closure-compiler-service');
var debug       = require('gulp-debug');
var exec        = require("child_process").exec;
var runSequence = require('run-sequence');

//var uglify  = require('gulp-uglify');
//var compress = require('./tasks/compress');

gulp.task('default', function(cb) {
    runSequence('minify', 'pack', cb);
});

gulp.task('minify', function() {
    var stream = gulp.src('src/game.js')
//      .pipe(uglify({mangle:true, compress: {unsafe:true, hoist_vars:true}}))
        .pipe(closure({compilation_level: "ADVANCED_OPTIMIZATIONS"}))
        .pipe(jscrush())
        .pipe(gulp.dest('dist'));

    return stream; // make sure this task is identified as asynchronous
});

gulp.task('pack', function() {
    // number of iterations for the zoplfi algorithm. The larger the number the better the compression
    // NOTE large numbers can make this slooooowww
    var iterations = 10000;

    exec('advzip --add game.zip game.js -4 --iter '+iterations, { cwd: './dist' }, function(error, stdout, stderr) {
        if(error) console.log(error+'Most likely you should download AdvanceComp and set it in your path variable. Download it from: http://advancemame.sourceforge.net/comp-readme.html');
    });
});