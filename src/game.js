!function() {
    // setup :
    polyFillPerfNow();
//    injectMeasure();
    polyFillRAFNow();
    setupLoader();
//    detectBrowser();

    // at this point, we have :
    //   now() with sub-ms accuracy,
    //   requestAnimationFrame(),
    //   a stop-watch : startCW(), stopCW(), lastCW().
    //   a basic rsc handling : var myImg = addRsc(Image, 'http://...') ;
    //         AnyFile can stand for XMLHttpRequest
    //   cl is console.log
    //   isSafari, isiOS, isOpera, isChrome


    // Canvas setup
    var cv  = document.getElementById('cv');
    var ctx = cv.getContext('2d');

    var designWidth = 1920;
    var designHeight = 1080;
    var aspect = designHeight / designWidth;

    var canvasWidth = window.innerWidth; //window.innerHeight / aspect;
    var canvasHeight = window.innerHeight;

    cv.width = canvasWidth;
    cv.height = canvasHeight;

    var scale = canvasWidth / designWidth;
    var mobile = false;

    initTheEverything();

    // -----------------------------------------------------
    //            Interesting code goes here
    // -----------------------------------------------------

    var score = 0;

    var lavaColor = '#171101';

    var scene = [];

    var lastTime = -1;
    var dt = 0;
    var elem = null;

    var gravity = 0.001;
    var waterStrength = 0.75;
    var friction = 1.01;

    var sea;
    var ship;
    var startUI;
    var volcano;
    var shipMaxVel = 2 * scale;
    var shipMinVel = -0.5 * scale;
    var shipMaxSwipeVel = 10 * scale;
    var swipeStr = 0.0001;

    var gameover = false;

    var waitingForInit = false;

    function main() {

        score = 0;

        // Polyfill yay!
        if(!Function.prototype.bind)
        {
            Function.prototype.bind = function (oThis) {
                if (typeof this !== "function") {
                    // closest thing possible to the ECMAScript 5
                    // internal IsCallable function
                    throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
                }

                var aArgs = Array.prototype.slice.call(arguments, 1),
                    fToBind = this,
                    fNOP = function () {},
                    fBound = function () {
                        return fToBind.apply(this instanceof fNOP && oThis
                                ? this
                                : oThis,
                            aArgs.concat(Array.prototype.slice.call(arguments)));
                    };

                fNOP.prototype = this.prototype;
                fBound.prototype = new fNOP();

                return fBound;
            };
        }

        sea  = new WaterBlock(0, canvasHeight * 0.75, canvasWidth, canvasHeight, 64);
        ship = new Ship(canvasWidth * 0.2, canvasHeight * 0.75);
        volcano = new Volcano();

        ship.velocity.x = 0;

        startUI = new StartUI();

        // build scene
        scene.push(volcano, sea, ship, startUI);
//        scene.push(new Rain(canvasWidth, 200, 0, 30));

        // launch animation
        lastTime = window.perfNow() - 16;
        animate(window.perfNow());
    }

    function Volcano() {
        this.layer = 0;

        //The different position vars
        this.x = 0;
        //It stars with drawing the hill at the bottom left corner
        this.y = canvasHeight;
        //The width of the mouth for the volcano
        this.mouthWidth = canvasWidth * 0.15;
        //The mouth of the volcano start and end position
        this.mouthX    = (canvasWidth*0.5) - (this.mouthWidth * 0.5);
        this.mouthEndX = this.mouthX + this.mouthWidth;
        this.mouthY    = canvasHeight * 0.2;

        this.origX = this.x;
        this.origMouthX = this.mouthX;
        this.origMouthEndX = this.mouthEndX;

        //flag to keep track of, if the volcano is erupted or not
        //and the other vars needed to keep track of the eruption
        this.erupted = false;
        this.currSleepTime = 0;
        this.maxSleepTime  = 2500;
        this.currAnimTime  = 0;
        this.maxAnimTime   = 4000;
        this.currShakeTime = 0;
        this.maxShakeTime  = 250;

        //The mount of shake it starts with, gets higher over time
        this.shakeX = 3 * scale;

        //A var that skips the eruption frames
        this.skipFrame = false;

        //The list of segments for the hill
        this.hillSegments = [];

        //The list of segments for the mouth
        this.mouthSegments = [];

        this.callback = function()
        {
            this.erupted = true;

            if (!mobile)
                initParticles();

            this.updateRockFire();

            this.callback = this.updateRockFire;

        };

        //Create the left hill segment, it is also used for the left on buy then mirrored with a slight offset
        this.createHillSegments(20, 35 * scale, this.hillSegments);

        //Creates the segments for the mouth of the volcano
        this.createMouthSegments(10, 13 * scale, this.mouthSegments);

        var firstStreamY = 0;
        var secondStreamY = 0;

        //A list of possible lava streams
        this.lavaStreams = [{
            x: this.mouthX + this.mouthWidth *0.15,
            //Will be set later
            y: 0,
            lines: []
        }, {
            x: this.mouthX + this.mouthWidth *0.85,
            //Will be set later
            y: 0,
            lines: []
        }, {
            x: this.mouthX + this.mouthWidth *0.5,
            //Will be set later
            y: 0,
            lines: []
        }];

        var x = this.mouthX;
        var y = this.mouthY;

        var segmentWidth = Math.abs(this.mouthX - this.mouthEndX) / this.mouthSegments.length;
        this.mouthSegments.forEach(function(segmentY, index){
            x += segmentWidth * (index+1);
            y = this.mouthY + segmentY;

            if(this.lavaStreams[0].y === 0 && this.lavaStreams[0].x < x)
            {
                this.lavaStreams[0].x = x;
                this.lavaStreams[0].y = y;
            }else if(this.lavaStreams[1].y === 0 && this.lavaStreams[1].x < x){
                this.lavaStreams[1].y = x;
                this.lavaStreams[1].y = y;
            }else if(this.lavaStreams[2].y === 0 && this.lavaStreams[2].x < x){
                this.lavaStreams[2].y = x;
                this.lavaStreams[2].y = y;
            }
        }, this)

        this.lavaStreams.forEach(function(object){
           object.lines.push(this.newLavaLine(object));
        }, this)
    }

    //Creates the different segment points
    Volcano.prototype.updateRockFire = function(){
        this.currSleepTime = 0;
        this.maxSleepTime = 1000 + (3000 * Math.random());
        this.currAnimTime = 0;
        this.maxAnimTime = 1500;
        this.currShakeTime = 0;
        this.shakeX = 6;
    };

    //Creates the different segment points
    Volcano.prototype.createHillSegments = function(segmentAmount, segmentMaxY, segmentList){
        for(var i = 0; i < segmentAmount; i++)
        {
            var newSegment = segmentMaxY*Math.random();

            if(Math.random() > 0.5){
                newSegment = -newSegment;
            }

            if(i === segmentAmount - 1)
            {
                segmentList.push(0);
            }else
            {
                segmentList.push(newSegment)
            }
        }
    };

    //Creates the different segment points for the mouth of the volcano
    Volcano.prototype.createMouthSegments = function(mouthSegments, mouthSegMaxY, mouthSegList){
        for(var i = 0; i < mouthSegments; i++)
        {
            var newSegment = mouthSegMaxY*Math.random();

            if(i === mouthSegments - 1)
            {
                mouthSegList.push(0);
            }else
            {
                mouthSegList.push(-(newSegment - (20 * scale)))
            }

        }
    };

    Volcano.prototype.update = function(deltaTime)
    {
        if (gameover || waitingForInit)
            return;

        this.updateShaking(deltaTime);
    };

    //Draws the volcano
    Volcano.prototype.draw = function()
    {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);

        //Draw left Hill
        this.drawHill(this.x, this.y, this.mouthX, this.mouthY);
        //Draw mouth
        this.drawMouth();

        //Draw right Hill
        this.drawHill(this.mouthEndX, this.mouthY, this.mouthEndX + (this.mouthX - this.x), this.y);

        ctx.closePath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#000';
        ctx.stroke();
        ctx.fillStyle = lavaColor;
        ctx.fill();
        ctx.closePath();

        if(this.erupted)
            this.drawLava();
    };

    Volcano.prototype.updateShaking = function(deltaTime)
    {
        this.currSleepTime += deltaTime;

        if(this.currSleepTime >= this.maxSleepTime)
        {
            this.currAnimTime += deltaTime;

            this.skipFrame = !this.skipFrame;

            if(this.skipFrame)
                return;

            this.currShakeTime += deltaTime;

            if(this.currShakeTime >= this.maxShakeTime)
            {
                this.currShakeTime = 0;

                if(this.shakeX > 0)
                {
                    this.shakeX++;
                }else{
                    this.shakeX--;
                }
            }

            if(this.currAnimTime >= this.maxAnimTime)
            {
                this.x = this.origX;
                this.mouthX = this.origMouthX;
                this.mouthEndX = this.origMouthEndX;

                this.fireBoulder();

                this.callback();
            }else
            {
                this.x += this.shakeX;
                this.mouthX += this.shakeX;
                this.mouthEndX += this.shakeX;

                this.shakeX = -this.shakeX;
            }
        }
    };

    Volcano.prototype.fireBoulder = function()
    {
        var amount = Math.max(1, Math.floor(4 * Math.random()));

        //Determine if one of the boulders
        var indexToGoForPlayer = Math.floor((amount * 4) * Math.random());

        for(var i = 0; i<amount;i++)
        {
            scene.push(new Rock(this.mouthX + this.mouthWidth*0.5, this.mouthY, 3000, null, null, i * 150, i === indexToGoForPlayer));
        }
    };

    Volcano.prototype.drawLava = function()
    {
        var startX = this.mouthX;
        var startY = this.mouthY;

        ctx.beginPath();
        ctx.moveTo(startX, startY);

        var segmentWidth = Math.abs(startX - this.mouthEndX) / this.mouthSegments.length;

        var x = 0;
        var y = 0;

        for(var i = 0, max = this.mouthSegments.length; i < max; i++)
        {
            var segmentNumber = this.mouthSegments[i];

            x = startX + (segmentWidth * (i+1));
            y = startY + segmentNumber;

            if(i === this.mouthSegments.length-1)
            {
                x = this.mouthEndX;
                y = this.mouthY;
            }

            ctx.lineTo(x, y);
        }

        ctx.lineWidth = 10;
        ctx.strokeStyle = '#FF0000';
        ctx.stroke();

        ctx.beginPath();
        //Draw&update the lava streams
        this.drawLavaStreams();
    }

    Volcano.prototype.drawLavaStreams = function()
    {
        this.lavaStreams.forEach(function(object){
           //If this returns true the end of the line has been reached
           if(this.drawLavaLine(object))
           {
                object.lines.push(this.newLavaLine(object.lines[object.lines.length-1]))
           }
        }, this);
    };

    Volcano.prototype.drawLavaLine = function(object)
    {
        var endReached = false;

        for(var i = 0, max = object.lines.length; i<max; i++)
        {
            var line = object.lines[i];

            //Take shake into account
            var correctionX = this.x - this.origX;

            ctx.moveTo(line.x + correctionX, line.y);
            ctx.lineTo(line.currentX + correctionX, line.currentY);

            //Add length to the line
            if(!line.ended)
            {
                line.currentX += (line.toX - line.x) * (dt/1000);
                line.currentY += (line.toY - line.y) * (dt/1000);

                if(line.x < line.toX)
                {
                    if(line.currentX > line.toX)
                    {
                        line.currentX = line.toX;
                        line.currentY = line.toY;
                        line.ended = true;
                        endReached = true;
                    }
                }else
                {
                    if(line.currentX < line.toX)
                    {
                        line.currentX = line.toX;
                        line.currentY = line.toY;
                        line.ended = true;
                        endReached = true;
                    }
                }

                if(line.currentY >= canvasHeight)
                {
                    endReached = false;
                    line.currentY = canvasHeight;
                    line.toY = canvasHeight;
                }
            }

            //ctx.closePath();

        }

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FF0000';
        ctx.stroke();

        return endReached
    }

    Volcano.prototype.newLavaLine = function(object)
    {
        var startX = object.currentX || object.x;
        var startY = object.currentY || object.y;

        var deltaX = (Math.random() * 10);

        if((Math.random() * 11) > 5)
            deltaX = -deltaX;

        var toX = startX + deltaX;

        return {
            x: startX,
            y: startY,
            toX: toX,
            toY: startY + (5 + (Math.random()*20)),
            currentX: startX,
            currentY: startY
        }
    };

    Volcano.prototype.drawHill = function(startX, startY, endX, endY)
    {
        var ascending = startY > endY;

        var segmentWidth = Math.abs(startX - endX) / this.hillSegments.length;
        var segmentHeight = Math.abs(startY - endY) / this.hillSegments.length;

        var x = 0;
        var y = 0;

        for(var i = 0, max = this.hillSegments.length; i < max; i++)
        {
            var segmentNumber = ascending ? this.hillSegments[i] : this.hillSegments[(this.hillSegments.length-1)-i];

            x = startX + (segmentWidth * i);

            if(ascending)
            {
                y = startY - (segmentHeight*i) - segmentNumber;
            }else
            {
                y = startY + (segmentHeight*i) - segmentNumber;
            }

            if(i === this.hillSegments.length-1)
            {
                x = endX;
                y = endY;
            }

            ctx.lineTo(x, y);
        }
    };

    Volcano.prototype.drawMouth = function()
    {
        var startX = this.mouthX;
        var startY = this.mouthY;

        var segmentWidth = Math.abs(startX - this.mouthEndX) / this.mouthSegments.length;

        var x = 0;
        var y = 0;

        for(var i = 0, max = this.mouthSegments.length; i < max; i++)
        {
            var segmentNumber = this.mouthSegments[i];

            x = startX + (segmentWidth * (i+1));
            y = startY + segmentNumber;

            if(i === this.mouthSegments.length-1)
            {
                x = this.mouthEndX;
                y = this.mouthY;
            }

            ctx.lineTo(x, y);
        }
    };

    //The volcano rock
    function Rock(x, y, velocityY, accelY, radius, delay, targetPlayer) {
        this.x = x;
        this.y = y;

        this.velocityY = (velocityY || 0) * scale;
        this.maxVelY   = 600 * scale;
        this.accelY    = (accelY || 1000) * scale;
        this.friction  = 0.96;

        this.targetPlayer = targetPlayer || false;

        //On top of everything
        this.layer = 25;

        this.airTime = 500 + (1000 * Math.random());

        this.delay = delay || 0;

        //States are:
        //0: Going up, 1: Waiting, 2: Show indicator, 3: coming down
        this.state = 0;

        this.standardRadius = 30;

        this.radius = (radius || this.standardRadius) * scale;

        this.weight = 7;

        //The point list to draw
        this.pointList = [];
        this.segmentMax    = 3;
        this.segmentAmount = 20;
        this.generateSegments();
    }

    Rock.prototype.generateSegments = function()
    {
        for(var i = 0; i <= this.segmentAmount; i++)
        {
            var pointX = Math.cos(2 * (Math.PI * (i/this.segmentAmount)))*this.radius;
            var pointY = Math.sin(2 * (Math.PI * (i/this.segmentAmount)))*this.radius;

            pointX += (this.segmentMax+1) * Math.random();
            pointY += (this.segmentMax+1) * Math.random();


            this.pointList.push({x: pointX, y: pointY});
        }
    };

    Rock.prototype.draw = function()
    {
        if(this.delay > 0) return;


        if(this.state >= 2 &&  (this.y + this.radius) < 0)
        {
            //Draw lave routes
            ctx.beginPath();
            ctx.moveTo(this.x - this.radius, 0);
            ctx.lineTo(this.x, 0 + (this.radius*2));
            ctx.moveTo(this.x + this.radius, 0);
            ctx.lineTo(this.x, 0 + (this.radius*2));
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';
            ctx.stroke();
        }else
        {
            ctx.beginPath();
            this.pointList.forEach(function(object){
                ctx.lineTo(this.x + object.x, this.y + object.y);
            }, this);
            ctx.fillStyle = '#663F09';
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#663F09';
            ctx.stroke();
            ctx.closePath();
            ctx.fill();
        }
    };

    Rock.prototype.update = function(deltaTime) {

        this.delay -= deltaTime;
        if(this.delay > 0) return;

        this.velocityY += this.accelY * (deltaTime/1000);

        ship.collide(this);

        if(this.velocityY >= this.maxVelY && this.state > 1)
            this.velocityY = this.maxVelY;

        if(this.state === 0)
        {
            this.y -= this.velocityY * (deltaTime/1000);

            if(this.y < -50)
            {
                this.state++;
            }
        }else if(this.state === 1)
        {
            this.y = -100 -(1000 * Math.random());
            this.x = this.radius + ((canvasWidth - this.radius)*Math.random());

            if(this.targetPlayer) this.x = ship.x + ship.width * 0.5;

            this.state++;
        }else if(this.state === 2){

            this.airTime -= deltaTime;

            if(this.airTime < 0)
            {
                this.state++;
            }
        }else if(this.state === 3)
        {
            this.y += this.velocityY * (deltaTime/1000);

            if(this.y + this.radius > sea.y)
            {
                this.state++;
                sea.collide(this.x, this.y + 15, 0.020, { x: 0, y: this.velocityY * this.weight });
                this.accelY = 0;
                this.layer = 1;
                //The player scored a point
                if(!gameover) score += 100;
            }
        }else if(this.state === 4)
        {
            //Friction is added
            this.velocityY *= this.friction;

            var minVelocity = 50 * scale;
            if(this.velocityY < minVelocity) this.velocityY = minVelocity;

            this.y += this.velocityY * (deltaTime/1000);

            if(this.y - this.radius > canvasHeight)
            {
                this.state++;

                this.dead = true;
            }
        }
    };

    function Ship(x, y)
    {
        this.layer = 5;
        this.x = x || 0;
        this.y = y || 0;

        this.velocity = {
            x: 0,
            y: 0
        };

        this.width  = cv.width * 0.1;
        this.height = cv.width * 0.1;
        this.weight = 3;

        this.y -= this.height;

        this.swiping = false;
        this.rotation = 0;
    }

    Ship.prototype.draw = function(){

        ctx.save();

        var lastPos = {
            x: this.x,
            y: this.y
        };

        if (gameover)
        {
            ctx.translate(this.x, this.y);

            this.x = 0;
            this.y = 0;

            var toRotation = Math.PI / 180;

            if (this.rotation / toRotation < 45) {
                var rotationSpeed = 2;
                this.rotation += rotationSpeed * toRotation;
            }

            ctx.rotate(this.rotation);

        }

        var line1 = {
            one:{
                x: this.x,
                y: this.y + this.height * 0.6
            },
            two: {
                x: this.x + this.width * 0.5,
                y: this.y + this.height * 0.7
            },
            three: {
                x: this.x + this.width,
                y: this.y + this.height * 0.6
            }
        };

        var line2 = {
            one:{
                x: this.x,
                y: this.y + this.height * 0.6
            },
            two: {
                x: this.x + this.width * 0.5,
                y: this.y + this.height * 1.3
            },
            three: {
                x: this.x + this.width,
                y: this.y + this.height * 0.6
            }
        };

        var mastLine = {
            one:{
                x: this.x + this.width * 0.5,
                y: this.y + this.height * 0.65
            },
            two: {
                x: this.x + this.width * 0.5,
                y: this.y + this.height * 0.3
            },
            three: {
                x: this.x + this.width * 0.5,
                y: this.y
            }
        };

        ctx.beginPath();
        ctx.moveTo(line1.one.x, line1.one.y);
        ctx.bezierCurveTo(line1.one.x, line1.one.y, line1.two.x, line1.two.y, line1.three.x, line1.three.y);
        ctx.moveTo(line2.one.x, line2.one.y);
        ctx.bezierCurveTo(line2.one.x, line2.one.y, line2.two.x, line2.two.y, line2.three.x, line2.three.y);
        ctx.moveTo(mastLine.one.x, mastLine.one.y);
        ctx.bezierCurveTo(mastLine.one.x, mastLine.one.y, mastLine.two.x, mastLine.two.y, mastLine.three.x, mastLine.three.y);
        ctx.closePath();

        ctx.lineWidth = 3;

        ctx.strokeStyle = 'brown';
        ctx.stroke();

        ctx.fillStyle = 'brown';
        ctx.fill();

        var sailLine = {
            one:{
                x: this.x + this.width * 0.5,
                y: this.y + this.height * 0.5
            },
            two: {
                x: this.x + this.width * 0.5 + this.width * (this.velocity.x * 0.1) / scale,
                y: this.y + this.height * 0.3
            },
            three: {
                x: this.x + this.width * 0.5,
                y: this.y
            }
        };

        ctx.beginPath();
        ctx.moveTo(sailLine.one.x, sailLine.one.y);
        ctx.bezierCurveTo(sailLine.one.x, sailLine.one.y, sailLine.two.x, sailLine.two.y, sailLine.three.x, sailLine.three.y);

        ctx.lineWidth = 5;

        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.restore();

        if (gameover)
        {
            this.x = lastPos.x;
            this.y = lastPos.y;
        }
    };

    Ship.prototype.update = function(dt) {
        if (gameover)
            this.y += 1 * scale;
        else
        {
            var coll = sea.collide(this.x + this.width * 0.5, this.y + this.height * 0.75, this.weight, this.velocity);

            if (coll)
                this.velocity.y -= dt * (waterStrength / ((sea.y + sea.depth) - this.y)) * scale;

            this.velocity.y += dt * gravity * scale;//Math.max(0, (dt * gravity)) * scale;

            if (this.velocity.y > shipMaxVel)
                this.velocity.y = shipMaxVel;
            if (this.velocity.y < shipMinVel)
                this.velocity.y = shipMinVel;

            if (this.velocity.x > shipMaxSwipeVel)
                this.velocity.x = shipMaxSwipeVel;
            if (this.velocity.x < -shipMaxSwipeVel)
                this.velocity.x = -shipMaxSwipeVel;

            this.velocity.x /= friction;

            this.y += this.velocity.y;
            this.x += this.velocity.x;

            var bounds = {
                left: cv.width * 0.0,
                right: cv.width * 1 - this.width
            };

            if (this.x < bounds.left)
            {
                this.x = bounds.left;
                this.velocity.x = -this.velocity.x;
            }

            if (this.x > bounds.right)
            {
                this.x = bounds.right;
                this.velocity.x = -this.velocity.x;
            }
        }
    };

    Ship.prototype.startSwipe = function(e){
        this.swiping = true;
        this.startSwipePos = e.clientX || e.touches[0].clientX;
        this.lastSwipePos = e.clientX || e.touches[0].clientX;
        this.currentSwipePos = e.clientX || e.touches[0].clientX;
    };

    Ship.prototype.swipe = function(e){
        if (!this.swiping)
            return;

        var swipeX = e.clientX || e.touches[0].clientX;
        var swipeY = e.clientY || e.touches[0].clientY;

        this.lastSwipePos = this.currentSwipePos;
        this.currentSwipePos = swipeX;

        if (swipeX > this.x + this.width * 0.2 && swipeX < this.x + this.width - this.width * 0.2 &&
            swipeY > this.y - this.height * 0.2 && swipeY < this.y + this.height + this.height * 0.2)
        {
            if (this.windBlown)
                return;

            var swipeDistance = this.startSwipePos - this.currentSwipePos;
            var expectedDistance = cv.width * 0.1;

//            if (this.lastSwipePos && swipeDistance > expectedDistance || swipeDistance < -expectedDistance)
                this.velocity.x += ((this.currentSwipePos - this.lastSwipePos) * o.width * swipeStr);

            this.windBlown = true;
        }
        else
            this.windBlown = false;
    };

    Ship.prototype.endSwipe = function(){
        this.swiping = false;
        this.windBlown = false;
    };

    Ship.prototype.collide = function(object)
    {
        if ((object.x < this.x) || (object.x > this.x + this.width) || (object.y > this.y + this.height) || (object.y < this.y + this.height * 0.6)) return false;

        object.hitBoat = true;
        object.shipHitDistance = object.x - ship.x;

        if(!gameover)
        {
            //Add the game over screen to the scene
            scene.push(new GameOverPopup());
        }

        gameover = true;
    };

    function GameOverPopup()
    {
        this.layer = 10000;

        this.width  = canvasWidth * 0.5;
        this.height = canvasHeight * 0.3;

        this.x = (canvasWidth*0.5) - this.width * 0.5;
        this.y = (canvasHeight*0.5) - this.height * 0.5

        this.color  = 'black';

        this.score = score;
    }

    GameOverPopup.prototype.draw = function()
    {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.fillStyle = '#DEDEDE';

        ctx.font = "20pt Arial";
        ctx.textAlign = 'center';
        ctx.fillText("You scored: " + this.score, this.x + this.width*0.5, this.y + (60*scale));

        ctx.fillText("You did kind of alright, I guess.", this.x + this.width*0.5, this.y + (120*scale));

        ctx.fillText("Press the screen to restart and try again !", this.x + this.width*0.5, this.y + (220*scale));


        ctx.textAlign = 'left';
    };

    function StartUI()
    {
        waitingForInit = true;

        this.layer = 10000;

        this.width  = canvasWidth * 0.5;
        this.height = canvasHeight * 0.3;

        this.x = (canvasWidth*0.5) - this.width * 0.5;
        this.y = (canvasHeight*0.5) - this.height * 0.5

        this.color  = 'black';

        this.score = score;
    }

    StartUI.prototype.draw = function()
    {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.fillStyle = '#DEDEDE';

        ctx.font = "20pt Arial";
        ctx.textAlign = 'center';

        ctx.fillText("Swipe across the boat to move it move it.", this.x + this.width*0.5, this.y + (90*scale));

        ctx.fillText("Press the screen to start!", this.x + this.width*0.5, this.y + (220*scale));


        ctx.textAlign = 'left';
    };

    StartUI.prototype.remove = function()
    {
        this.dead = true;
    };

    function WaterBlock(x, y, width, depth, pointCount) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.depth = depth - y;
        this.pointCount = pointCount;
        this.kFactor = 0.00002;
        this.friction = 0.00025;
        this.water = [];
        this.w = width / pointCount;
        this.layer = 9;
        this.init();
    }

    WaterBlock.prototype.init = function initWater() {
        var water = this.water;
        for (var i = 0; i < 3 * this.pointCount; i++) {
            water[i] = 0;
        }
    };

    WaterBlock.prototype.draw = function drawWater() {

        // get a random blue gradient
//        var randBlue =  0 | (( 5 + (  (0 | Math.sin(Date.now() / 1000) * 5)) ) % 360 );
        var randBlue =  223;

        var col1 = 'hsla(' + randBlue + ', 80%, 24%, 0.7)';
        var col2 = 'hsla(' + 100 + ', 70%, 10%, 0.7)';
        var gd = ctx.createLinearGradient(0, this.y, 0, this.y + this.depth);
        gd.addColorStop(0, col1);
        gd.addColorStop(1, col2);
        ctx.fillStyle = gd;
        ctx.lineWidth = 0.0001;

        var water = this.water;
        var w = this.w;

        ctx.beginPath();
        ctx.moveTo(this.x + this.width, this.y + this.depth);
        ctx.lineTo(this.x, this.y + this.depth);
        var x, y, nextX, nextY;
        x = this.x;
        y = this.y;
        nextX = this.x + this.w;
        nextY = this.y + water[2];

        ctx.lineTo(x, y);

        for(var ptIndex = 1, i = 3; ptIndex <= this.pointCount; ptIndex += 1, i += 3) {
            x = nextX;
            y = nextY;
            nextX = this.x + (ptIndex + 1) * this.w;
            nextY =  ptIndex < this.pointCount ? this.y + water[i + 2] : this.y;

            ctx.lineTo(x, y);
        }
        ctx.lineTo(this.x + this.width, this.y);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
    };

    WaterBlock.prototype.update = function updateWater(dt) {
        var water       = this.water;
        var pointCount  = this.pointCount;
        var kFactor     = this.kFactor;
        var friction    = this.friction;

        var left = 0;
        var right = water[2];
        var y = -1;

        for (var pt = 0, i = 0; pt < pointCount; pt++, i += 3)
        {
            y = right;

            right = (pt < pointCount - 1) ? water[i + 5] : 0;

            // acceleration
            water[i] = (-0.3 * y + (left - y) + (right - y)) * kFactor - water[i + 1] * friction;
            // speed
            water[i + 1] += (water[i] * dt) * scale;
            // height
            water[i + 2] += (water[i + 1] * dt) * scale;

            left = y;
        }
    };

    WaterBlock.prototype.collide = function collideWater(x, y, weight, velocity) {
        // check for collision
        if ((x < this.x) || (x > this.x + this.width) || (y > this.y + this.depth)/* || (y < this.y)*/) return false;

        var blockNumber = 0 | (0.5 + (x - this.x) / this.w);
        var waterValue = this.water[blockNumber * 3 + 2];

        if (y - this.y - waterValue < 0) return false;

        var vx = (velocity.x * weight * 0.0003) * scale;
        var vy = (velocity.y * weight) * scale;

        if (y < this.y + 30)
        {
            this.water[blockNumber * 3 + 1] += vx;
            this.water[blockNumber * 3 + 2] += vy;
        }

        return true;
    };

    function animate(ts) {
        requestAnimationFrame(animate);
        dt = ts - lastTime;
        if (dt > 50) dt = 50;
        lastTime = ts;
        // clear screen
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        //Loop through the scene and delete old elems
        for(var i = 0, max = scene.length; i < max; i++)
        {
            if(scene[i] && scene[i].dead)
            {
                scene.splice(scene.indexOf(scene[i]), 1);
            }
        }


        //Sort drawn elements on the layer property
        scene.sort(function(a,b){
            return a.layer - b.layer;
        })

        // draw all
        i = 0;
        while (elem = scene[i++]) {
            if (elem.draw) elem.draw();
        }

        // update all
        var i = 0;
        while (elem = scene[i++]) {
            if (elem.update) elem.update(dt);
        }

        ctx.fillStyle = '#DEDEDE';

        ctx.font = "20pt Arial";
        ctx.fillText("Score: " + score, 10, 50);

        //Reset the fill
        ctx.fillStyle = '#5F51F5';
    }



    // -----------------------------------------------------
    //          ///  Wind particles start here
    // -----------------------------------------------------


    var work = false;
    function C() {
        e.clearRect(0, 0, f, p);
        e.globalCompositeOperation = "source-over";
        e.fillStyle = "rgba(8,8,12,0.0)";
        e.fillRect(0, 0, f, p);
        e.globalCompositeOperation = "lighter";
        x = q - u;
        y = r - v;
        u = q;
        v = r;

        for (var d = 0.86 * f, l = 0.125 * f, t = Math.random, n = Math.abs, o = z; o--; )
        {
            var h = A[o], i = h.x, j = h.y, a = h.a, b = h.b, c = work ? i - q : i - h.targetPos.x, k = work ? j - r : j - h.targetPos.y, g = Math.sqrt(c * c + k * k) || 0.001, c = c / g, k = k / g;

            CheckForPositionReached(h);

            g < d && (s = 0.00014 * (1 - g / d) * f, a -= c * s, b -= k * s); // standard move speed
            g < l && (c = 0.00005 * (1 - g / l) * f, a += x * c, b += y * c); // move speed on drag
            a *= B; //friction
            b *= B; //friction
            c = n(a);
            k = n(b);
            g = 0.5 * (c + k); // speed value
            0.1 > c && (a *= 3 * t());
            0.1 > k && (b *= 3 * t());
            c = 0.45 * g;
            c = Math.max(Math.min(c, 5 * scale), 2.5 * scale); // size
            i += a;
            j += b;
            i > f ? (i = f, a *= -1) : 0 > i && (i = 0, a *= -1);
            j > p ? (j = p, b *= -1) : 0 > j && (j = 0, b *= -1);
            h.a = a;
            h.b = b;
            h.x = i;
            h.y = j;

            SetColor(h, g);

            e.fillStyle = h.color;
            e.beginPath();
            e.arc(i, j, c, 0, D, !0);
            e.closePath();
            e.fill();
        }
    }
    function SetTargetPos(particle)
    {
        var distance = {
            x: o.width * 0.5,
            y: o.height * 0.5
        };
        var randomDistX = Math.floor(Math.random() * distance.x) - distance.x * 0.5;
        var randomDistY = Math.floor(Math.random() * distance.y) - distance.y * 0.5;

        particle.targetPos.x = particle.targetPos.x + randomDistX;
        particle.targetPos.y = particle.targetPos.y + randomDistY;

//        if (particle.targetPos.x < 0 || particle.targetPos.x > o.width ||
//            particle.targetPos.y < 0 || particle.targetPos.y > o.height)
//            SetTargetPos(particle);

        if (particle.targetPos.x < 0) particle.targetPos.x = o.width * 0.05;
        if (particle.targetPos.x > o.width) particle.targetPos.x = o.width - o.width * 0.05;
        if (particle.targetPos.y < 0) particle.targetPos.y = o.height * 0.05;
        if (particle.targetPos.y > sea.y - o.height * 0.1) particle.targetPos.y = sea.y - o.height * 0.05;
    }
    function CheckForPositionReached(particle)
    {
        var deadZone = 3;
        var dist = distance(particle.x, particle.y, particle.targetPos.x, particle.targetPos.y);
        if (dist < deadZone)
            SetTargetPos(particle);
    }
    function SetColor(particle, speed)
    {
        var r = 254, g = 59, b = 18;

        var multiply = 0.35;

        var red = Math.floor(r * speed * multiply);
        var green = Math.floor(g * speed * multiply);
        var blue = Math.floor(b * speed * multiply);

        if (red > r)
            red = r;

        if (green > g)
            green = g;

        if (blue > b)
            blue = b;

        particle.color = "rgb("+red+","+green+","+blue+")";
    }
    function E(d) {

        if (!work)
            return;

        d = d ? d : window.event;
        q = d.clientX || d.touches[0].clientX;
        r = d.clientY || d.touches[0].clientY;
    }
    function F() {
        w = !0;
        return !1;
    }
    function G() {
        return w = !1;
    }
    function H() {
        this.color = "rgb(0,0,0)";
        this.targetPos = {
            x: 0,
            y: 0
        };
        this.b = this.a = this.x = this.y = 0;
        this.size = 1;
    }
    function I(d)
    {
        work = true;
        d = d ? d : window.event;
        u = q = d.clientX || d.touches[0].clientX;
        v = r = d.clientY || d.touches[0].clientY;
    }
    function J()
    {
        work = false;
        for (var i = 0; i < A.length; i++)
            SetTargetPos(A[i]);
    }
    function mouseMove(e)
    {
        E(e);
        ship.swipe(e);
    }

    function mouseDown(e)
    {
        if (gameover)
            window.location.reload();

        if (waitingForInit)
        {
            waitingForInit = false;

            volcano.maxSleepTime = 0;

            startUI.remove();
        }


        if (gameover || waitingForInit)
            return;

        I(e);
        ship.startSwipe(e);
    }

    function mouseUp(e)
    {
        J();
        ship.endSwipe();
    }

    var D = 2 * Math.PI, f = 0, p = 0, z = 200, B = 0.96, A = [], o, e, q, r, x, y, u, v, w;

    function initTheEverything()
    {
        o = document.getElementById("particles");
        if (o.getContext) {

            var regex = /Mobile|Android|BlackBerry/;
            mobile = regex.test(navigator.userAgent);

            if (mobile)
            {
                document.body.addEventListener("touchstart", mouseDown, false);
                document.body.addEventListener("touchend", mouseUp, false);
                document.body.addEventListener("touchcancel", mouseUp, false);
                document.body.addEventListener("touchleave", mouseUp, false);
                document.body.addEventListener("touchmove", mouseMove, false);
            }
            else
            {
                document.onmousemove = mouseMove;
                document.onmousedown = mouseDown;
                document.onmouseup = mouseUp;
            }
        }
    }

    function initParticles()
    {
//        o = document.getElementById("particles");
//        if (o.getContext) {
            e = o.getContext("2d");
            o.width = f = canvasWidth;
            o.height = p = canvasHeight;
            for (var d = z; d--;) {
                var l = new H;
                l.x = f * 0.5;
                l.y = p * 0.2;//Math.random() * (p - sea.y - o.height * 0.1);
                l.a = 20 * Math.cos(d) * Math.random(); // set start speed and direction x
                l.b = 10 * Math.sin(d) * Math.random(); // set start speed and direction y
                l.targetPos.x = l.x;
                l.targetPos.y = l.y;
                A[d] = l
            }
            q = u = 0.5 * f;
            r = v = 0.5 * p;
//        }

        setInterval(C, 1);
    }

    // -----------------------------------------------------
    //          ///  Wind particles ends here
    // -----------------------------------------------------

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
        };
        window.addEventListener('load', loadEnded);
        window.addEventListener('error', errorWhileLoading);

        function loadEnded() {
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

    function distance(x1, y1, x2, y2) {
        y2 -= y1;
        y2 *= y2;
        x2 -= x1;
        x2 *= x2;
        return Math.sqrt(x2 + y2)
    }
}.call(this);