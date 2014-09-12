// setup :
polyFillPerfNow();
injectMeasure();
polyFillRAFNow();
setupLoader();
detectBrowser();

// at this point, we have :
//   now() with sub-ms accuracy,
//   requestAnimationFrame(),
//   a stop-watch : startCW(), stopCW(), lastCW().
//   a basic rsc handling : var myImg = addRsc(Image, 'http://...') ;
//         AnyFile can stand for XMLHttpRequest
//   cl is console.log
//   isSafari, isiOS, isOpera, isChrome

// Canvas setup
var cv = document.getElementById('cv');
var ctx = context = cv.getContext('2d');
var canvasWidth   = cv.width  = 600;
var canvasHeight  = cv.height = 300;

// event
document.getElementById('waveShape').addEventListener('change', changeWave); // onchange = changeWave;
function changeWave(e) {
    waveForm = this.selectedIndex;
}

var waveForm = 0;
// -----------------------------------------------------
//            Interesting code goes here
// -----------------------------------------------------

var cloudImage = window.addRsc(Image, 'http://images.wikia.com/fantendo/images/b/bb/Lakitu_Cloud.png');


//var cloudImage = window.addRsc(Image, //'http://clipartist.net/social/clipartist.net/2012/D12/cloud-999px.png');

function GrassBlock(x, y, width, depth) {
    this.x = x;
    this.width = width;
    this.y = y;
    this.depth = depth;
    var col1 = 'hsl(80, 80%, 60%)';
    var col2 = 'hsl(80, 50%, 40%)';
    var col3 = 'hsl(35, 85%, 85%)';
    var col4 = 'hsl(35, 63%, 44%)';
    var gd = ctx.createLinearGradient(0, this.y, 0, this.y + this.depth);
    gd.addColorStop(0, col1);
    gd.addColorStop(0.1, col2);
    gd.addColorStop(0.11, col3);
    gd.addColorStop(1.0, col4);
    this.gd = gd;
}

GrassBlock.prototype.collide = function (x, y, vx, vy) {
    if ((x < this.x) || (x > this.x + this.width) || (y > this.y + this.depth) || (y < this.y)) return false;
    return true;
}

GrassBlock.prototype.draw = function () {
    ctx.fillStyle = this.gd;
    ctx.fillRect(this.x, this.y, this.width, this.depth);
}

function WaterBlock(x, y, width, depth, pointCount) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.depth = depth;
    this.pointCount = pointCount;
    this.kFactor = 0.00002;
    this.friction = 0.0025;
    this.water = [];
    this.w = width / pointCount;
    this.init();
}

WaterBlock.prototype.init = function initWater() {
    var water = this.water;
    for (var i = 0; i < 3 * this.pointCount; i++) {
        water[i] = 0;
    }
}

WaterBlock.prototype.draw = function drawWater() {
    // get a random blue gradient
    var randBlue =  0 | (( 5 + (  (0 | Math.sin(Date.now() / 1000) * 5)) ) % 360 );
    var col1 = 'hsl(' + randBlue + ', 80%, 75%)';
    var col2 = 'hsl(' + randBlue + ', 70%, 40%)';
    var gd = ctx.createLinearGradient(0, this.y, 0, this.y + this.depth);
    gd.addColorStop(0, col1);
    gd.addColorStop(1, col2);
    ctx.fillStyle = gd;
    ctx.lineWidth = 0.0001;

    var water = this.water;
    var w = this.w;
    var ptIndex = 0,
        i = 0;

    ctx.beginPath();
    ctx.moveTo(this.x + this.width, this.y + this.depth);
    ctx.lineTo(this.x, this.y + this.depth);
    var x, y, nextX, nextY;
    x = this.x;
    y = this.y;
    nextX = this.x + this.w;
    nextY = this.y + water[2];

    ctx.lineTo(x, y);

    for (ptIndex = 1, i = 3; ptIndex <= this.pointCount; ptIndex += 1, i += 3) {
        var ox = x,
            oy = y;
        x = nextX;
        y = nextY;
        nextX = this.x + (ptIndex + 1) * this.w;
        nextY =  ptIndex < this.pointCount ? this.y + water[i + 2] : this.y;

        // ang and l are used only for waveForm >0
        var ang = Math.atan2(y - oy, x - ox);
        var l = length(x, y, ox, oy);

        switch (waveForm) {
            case 0:
                ctx.lineTo(x, y);
                break;
            case 1:
                ctx.arc((x + ox) / 2, (y + oy) / 2, l / 2, ang - π, ang);
                break;
            case 2:
                ctx.arc((x + ox) / 2, (y + oy) / 2, l / 2, ang - π / 2, ang + π / 2);
                break;
            case 3:
                ctx.arc((x + ox) / 2, (y + oy) / 2, l / 2, -ang, -ang + π / 2);
                break;
            case 4:
                ctx.lineTo(x-w/2, y);
                ctx.arc(x,y, w / 2, ang - π, ang , true );
                // ctx.arc(x,y-w/2, w , ang - 2*π/3, ang , true );
                break;
        }
    }
    ctx.lineTo(this.x + this.width, this.y);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

}

WaterBlock.prototype.update = function updateWater(dt) {
    var water = this.water;
    var pointCount = this.pointCount;
    var kFactor = this.kFactor;
    var friction = this.friction;
    var w = this.w;
    var pt = 0,
        i = 0;
    var left = 0,
        y = -1;
    var right = water[2];
    for (; pt < pointCount; pt++, i += 3) {
        y = right;
        right = (pt < pointCount - 1) ? water[i + 5] : 0;
        if (right === undefined) alert('nooo');
        // acceleration
        water[i] = (-0.3 * y + (left - y) + (right - y)) * kFactor - water[i + 1] * friction;
        // speed
        water[i + 1] += water[i] * dt;
        // height
        water[i + 2] += water[i + 1] * dt;
        left = y;
    }
}

WaterBlock.prototype.collide = function collideWater(x, y, vx, vy) {
    if ((x < this.x) || (x > this.x + this.width) || (y > this.y + this.depth) || (y < this.y - 10)) return false;
    var blockNumber = 0 | (0.5 + (x - this.x) / this.w);
    var waterValue = this.water[blockNumber * 3 + 2];
    if (y - this.y - waterValue < 0) return false;
    this.water[blockNumber * 3 + 1] += 0.02;
    this.water[blockNumber * 3 + 2] += 1;
    return true;
}


function RainDrop(x, y) {
    this.x = x;
    this.y = y;
}

RainDrop.prototype.draw = function () {
    ctx.fillStyle = '#BBF';
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.bezierCurveTo (this.x + 10, this.y + 4, this.x+4, this.y + 10, this.x, this.y ) ;
    ctx.fill();
//    ctx.fillRect(this.x, this.y, 3, 3);
    //  ctx.fillRect(this.x, this.y - 1, 2, 2);
}

// 80 320  width 200;
RainDrop.prototype.update = function (dt) {
    this.x += 0.04 * dt;
    this.y += 0.1 * dt;

    var i = 0;
    var collided = false;
    while (elem = scene[i++]) {
        if (elem.collide) collided = elem.collide(this.x, this.y, 0.1, 0.1);
        if (collided) break;
    }
    if (collided || this.y > 220) {
        this.y = 50;
        if (Math.random() > 0.5 )  this.x = 80 + 140 *Math.random();
        else       this.x = 320 + 180 * Math.random() ;
    }
}

function Rain(w, h, baseY, cnt) {
    this.cnt = cnt;
    this.w = w;
    this.baseY = baseY;
    this.rain = [];
    for (var i = 0; i < cnt; i++) this.rain.push(new RainDrop(Math.random() * w, this.baseY + Math.random() * h));
}

Rain.prototype.update = function (dt) {
    for (var i = 0; i < this.cnt; i++) this.rain[i].update(dt);
}
Rain.prototype.draw = function () {
    for (var i = 0; i < this.cnt; i++) this.rain[i].draw();
}


cv.addEventListener('mousedown', strokeWater);

function strokeWater(e) {
    var bcr = cv.getBoundingClientRect();
    var x = e.clientX - bcr.left;
    var y = e.clientY - bcr.top;
    wb1.collide(x, y, 0.5, 0.5);
}


var scene = [];
var bgGrad = null;

var lastTime = -1;
var dt = 0;
var elem = null;

function main() {
    // build blue background
    bgGrad = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    bgGrad.addColorStop(0, 'hsl(200 , 80%, 70%)');
    bgGrad.addColorStop(0.666, 'hsl(200 , 70%, 50%)');
    bgGrad.addColorStop(1, 'hsl(200 , 50%, 30%)');

    // build scene
    scene.push(new GrassBlock(0, 195, 140, 105));
    scene.push(new WaterBlock(140, 200, 140, 100, 16));
    scene.push(new GrassBlock(280, 195, 140, 105));
    scene.push(new WaterBlock(420, 200, 180, 100, 22));
    scene.push(new Rain(canvasWidth, 200, 0, 30));
    prepareMountain();

    cl(cloudImage);

    // launch animation
    lastTime = window.perfNow() - 16;
    animate(window.perfNow());
}

var osc = {
    valueOf : function() {
        return  2.5 * Math.sin( 4 * Date.now() / 1000 );
    }
}

var osc2 = {
    valueOf : function() {
        return  2.5 * Math.sin( 1 + 6 * Date.now() / 1000 );
    }
}

function animate(ts) {
    requestAnimationFrame(animate);
    dt = ts - lastTime;
    if (dt > 50) dt = 50;
    lastTime = ts;
    // clear screen
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    drawMountains();
    // draw all
    i = 0;
    while (elem = scene[i++]) {
        if (elem.draw) elem.draw();
    }

    ctx.save();
    ctx.translate( 80, 5 + osc);
    ctx.scale(0.35, 0.2);
    ctx.drawImage(  cloudImage, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate( 520, 10 + osc2);
    ctx.scale(-0.35, 0.2);
    ctx.drawImage(  cloudImage, 0, 0);
    ctx.restore();


    // update all
    var i = 0;
    while (elem = scene[i++]) {
        if (elem.update) elem.update(dt);
    }


//    potato (150, 50, 340, 150, 200, 140);
}


var i = 0,
    π = Math.PI;

var mountainGradient = null;
var mountainFunction = null;

function prepareMountain() {
    var mGrad = ctx.createLinearGradient(0, 40, 0, 200);
    mGrad.addColorStop(0, '#FFF');
    mGrad.addColorStop(0.26, '#CCC');
    mGrad.addColorStop(0.4, '#AAA');
    mGrad.addColorStop(1, '#555');
    mountainGradient = mGrad;

    var mainMountain = buildTriangleFunc(600, 100, 200, 280);
    var secMountain = buildTriangleFunc(310, 0, 80, 230);
    var spikes = buildTriangleFunc(55, 0, 16, 0);
    var spikes2 = buildTriangleFunc(72, 0, 10, 0);
    mountainFunction = function (x) {
        return canvasHeight - mainMountain(x) - secMountain(x) - spikes(x) - spikes2(x)
    }
}

function drawMountains() {

    var step = 20;
    ctx.beginPath();
    ctx.moveTo(0, mountainFunction(0));
    for (var x = step; x < canvasWidth + step; x += step) {
        ctx.lineTo(x, mountainFunction(x));
    }
    x -= step;
    ctx.lineTo(x, 220);
    ctx.lineTo(0, 220);
    ctx.closePath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = mountainGradient;
    ctx.stroke();
    ctx.fill();
}



// -----------------------------------------------------
//          ///  Interesting code ends here
// -----------------------------------------------------

function potato(x0,y0, x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x0,y0);
    var cpx = x0  + ( y1 - y0 + y2 - y0 ) / 4;
    var cpy =  y0 - ( x1 - x0 + x2 - x0 ) / 4;
    var cp2x = x1  - (y0 - y1 + y2 - y1 ) / 4;
    var cp2y = y1  + (x0 - x1  + x2 - x1 ) / 4;
    ctx.bezierCurveTo(cpx, cpy, cp2x, cp2y, x1, y1);
    var cpx = x1  + ( y2 - y1 + y0 - y1 ) / 4;
    var cpy =  y1 - ( x2 - x1 + x0 - x1 ) / 4;
    var cp2x = x2  - (y1 - y2 + y0 - y2 ) / 4;
    var cp2y = y2  + (x1 - x2  + x0 - x2 ) / 4;
    ctx.bezierCurveTo(cpx, cpy, cp2x, cp2y, x2, y2);
    var cpx = x2  + ( y0 - y2 + y1 - y2 ) / 4;
    var cpy =  y2 - ( x0 - x2 + x1 - x2 ) / 4;
    var cp2x = x0  - (y2 - y0 + y1 - y0 ) / 4;
    var cp2y = y0  + (x2 - x0  + x1 - x0 ) / 4;
    ctx.bezierCurveTo(cpx, cpy, cp2x, cp2y, x0, y0);


    ctx.lineWidth = 4;
    ctx.strokeStyle ='#AAA';

    ctx.stroke();


    ctx.beginPath();
    ctx.strokeStyle='#F00';
    ctx.moveTo(x0,y0);
    ctx.lineTo(x1,y1);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle='#0F0';
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle='#00F';
    ctx.moveTo(x2,y2);
    ctx.lineTo(x0,y0);
    ctx.stroke();


}

function roundRect(x0, y0, x1, y1, r) {
    var w = x1 - x0;
    var h = y1 - y0;
    if (r > w / 2) r = w / 2;
    if (r > h / 2) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x1 - r, y0);
    ctx.quadraticCurveTo(x1, y0, x1, y0 + r);
    ctx.lineTo(x1, y1 - r);
    ctx.quadraticCurveTo(x1, y1, x1 - r, y1);
    ctx.lineTo(x0 + r, y1);
    ctx.quadraticCurveTo(x0, y1, x0, y1 - r);
    ctx.lineTo(x0, y0 + r);
    ctx.quadraticCurveTo(x0, y0, x0 + r, y0);
    ctx.closePath();
}


// performance.now polyfill
// measure time with now()
function polyFillPerfNow() {
    window.performance = window.performance ? window.performance : {};
    window.performance.now = window.performance.now || window.performance.webkitNow || window.performance.msNow || window.performance.mozNow || Date.now;
    window.perfNow = window.now = window.performance.now.bind(performance);
    // warm up the function, fooling the interpreter not to skip;
    var a = now();
    a += now();
    return a;
};

// ! requires (window.)now() to be defined.
// inject startCW() and stopCW() to get a stop watch using
// performace.now. call with a factor to use another unit
//   (1e3 -> ns ; 1e-3 -> s )
// use with :
//   startCW();
//   // ... the thing i want to measure
//   stopCW();
//   console.log(lastCW());
// or you can store in a var the result of stopCW(), but do not
// use console.log(stopCW()); for consistant results.
function injectMeasure(factor) {
    var startTime = 0;
    var stopTime = 0;
    factor = factor | 1;

    window.startCW = function () {
        startTime = now();
        return startTime;
    };
    window.stopCW = function () {
        stopTime = now();
        return factor * (stopTime - startTime);
    };
    window.lastCW = function () {
        return factor * (stopTime - startTime);
    };
    // warming up the functions,
    // fooling the interpreter not to skip;
    var w = 0;
    w = window.startCW();
    w += window.startCW();
    w += window.stopCW();
    w += window.stopCW();
    w += window.lastCW();
    return w;
}

function polyFillRAFNow() {
    // requestAnimationFrame polyfill
    var w = window,
        foundRequestAnimationFrame = w.requestAnimationFrame || w.webkitRequestAnimationFrame || w.msRequestAnimationFrame || w.mozRequestAnimationFrame || w.oRequestAnimationFrame || function (cb) {
            setTimeout(cb, 1000 / 60);
        };
    window.requestAnimationFrame = foundRequestAnimationFrame;
    // warm-up the function
    requestAnimationFrame(voidFunction);
}

function voidFunction() {};


// resources loader
function setupLoader() {

    window.AnyFile = XMLHttpRequest;

    var rscCount = 1;
    var errorCount = 0;
    var errMsgs = '';

    window.addRsc = function (rscType, rscUrl) {
        var rsc = new rscType();
        rscCount++;
        rsc.addEventListener('load', loadEnded);
        rsc.addEventListener('error', errorWhileLoading);
        if (rscType !== window.AnyFile) rsc.src = rscUrl;
        else {
            rsc.open("GET", rscUrl, true);
            rsc.send(null);
        }
        return rsc;
    }
    window.addEventListener('load', loadEnded);
    window.addEventListener('error', errorWhileLoading);

    function loadEnded() {
        cl('l ed ');
        rscCount--;
        if (!rscCount) launchMain();
    }

    function errorWhileLoading(e) {
        errorCount++;
        rscCount--;
        errMsgs += e.message + '\n';
        if (!rscCount) launchMain();
    }

    function launchMain() {
        if (errorCount) alert('errors while loading rsc : \n' + errMsgs);
        setTimeout(main, 1000);
    }
}

function cl() {
    console.log.apply(console, arguments);
}

function length(x1, y1, x2, y2) {
    y2 -= y1;
    y2 *= y2;
    x2 -= x1;
    x2 *= x2;
    return Math.sqrt(x2 + y2)
}

function detectBrowser() {
    window.isOpera = !! window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    window.isFirefox = typeof InstallTrigger !== 'undefined'; // Firefox 1.0+
    var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    window.isChrome = !! window.chrome && !window.isOpera; // Chrome 1+
    window.isIE = /*@cc_on!@*/
        false || document.documentMode;

    var uagent = navigator.userAgent.toLowerCase();
    window.isiOS = (uagent.search("iphone") > -1 || uagent.search("ipod") > -1 || uagent.search("ipad") > -1 || uagent.search("appletv") > -1);

    var transform = null;
    if (window.isSafari || window.isChrome || window.isiOS) transform = 'webkitTransform';
    if (window.isOpera) transform = 'OTransform';
    if (window.isFirefox) transform = 'MozTransform';

    window.transform = transform;
}

function sq(x) {
    return x * x;
}

function buildTriangleFunc(period, min, max, phase) {
    var halfPeriod = period / 2;
    var spread = (max - min) / halfPeriod;
    phase = phase || 0;
    phase += period;
    return function (x) {
        x += phase;
        x = x % period;
        if (x > halfPeriod) x = period - x;
        return min + x * spread;
    }
}