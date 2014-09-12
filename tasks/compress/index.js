// TODO gulp task for advancedzip compression
// zopfli compression into zip
/* advzip --add game.zip game.js -4 --iter 10000 */
var through = require('through2');
var exec    = require("child_process").exec;

module.exports = function () {
    'use strict';

    function compress(file, enc, callback) {

        if (file.isBuffer())
        {

            exec("advzip --add game.zip game.js -4 --iter 10000", function(error, stdout, stderr) {
                if(error) console.log("Error in task spritesheets: "+error);
            });

//            var crushed = jscrush(String(file.contents));
//            file.contents = new Buffer(crushed);

        }

//        if (file.isStream()) {
//            console.log('STREAM');
//            var bufferStream = new BufferStreams(function (err, buffer, callback) {
//                if (err) this.emit('error', err);
//
//                var crushed = jscrush(buffer.toString('utf8'));
//                callback(null, new Buffer(crushed));
//            }.bind(this));
//
//            file.contents = file.contents.pipe(bufferStream);
//        }

        this.push(file);
        return callback();
    }

    return through.obj(compress)
};
