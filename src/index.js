/*jshint node:false */
"use strict";
(function() {
        function wind(path,symbol,x,y,size) {
            return new EInkTextBox({ 
                    path: path,
                    x: x,
                    y: y,
                    labels: {
                        bl: symbol,
                        br: "deg"
                    },
                    scale: 180/Math.PI,
                    precision: 0,
                    boxSize: size
                });
        }
        function speed(path, symbol, x, y, size) {
            return new EInkTextBox({ 
                    path: path,
                    x: x,
                    y: y,
                    labels: {
                        bl: symbol,
                        br: "kn"
                    },
                    scale: 1.943844,
                    precision: 1,
                    boxSize: size
                });

        }
        function meters(path, symbol, x, y, size) {
            return new EInkTextBox({ 
                    path: path,
                    x: x,
                    y: y,
                    labels: {
                        bl: symbol,
                        br: "m"
                    },
                    scale: 1,
                    precision: 1,
                    boxSize: size
                });

        }
        function angle(path, symbol, x, y, size) {
            return new EInkTextBox({ 
                    path: path,
                    x: x,
                    y: y,
                    labels: {
                        bl: symbol,
                        br: "deg"
                    },
                    withStats: false,
                    scale: 180/Math.PI,
                    precision: 0,
                    boxSize: size
                });
        }
        var display = {
            "default": [
                wind('environment.wind.angleApparent','awa',0,0,100),
                speed('environment.wind.speedApparent','aws',0,1,100),
                meters('environment.depth.belowTransducer','dbt',0,2,100),
                wind('environment.wind.angleTrueWater','twa',1,0,100),
                speed('environment.wind.speedTrue','tws',1,1,100),
                angle('navigation.courseOverGroundMagnetic','cogm',1,2,100),
                speed('navigation.speedOverGround','sog',2,0,100),
                speed('performance.velocityMadeGood','vmg',2,1,100),
                speed('navigation.speedThroughWater','stw',2,2,100)
            ],
            "large": [
                speed('navigation.speedOverGround','sog',0,0,200),
                speed('performance.velocityMadeGood','vmg',0,1,200),
                speed('navigation.speedThroughWater','stw',0,2,200)
            ],
        };
        var themes = {
            "day": {
                foreground: "black",
                background: "white"
            },
            "night" : {
                foreground: "white",
                background: "black"

            },
            "nightred" : {
                foreground: "red",
                background: "black"
            },
            "nightvision" : {
                foreground: "green",
                background: "black"
            }
        }
        var drawingContext = new EInkDrawingContext({
            canvas: document.getElementById("canvas"),            
            themes: themes,
            theme: "night",
            displayList: display
        });
        var updater =  new EInkUpdater({
            url: '/signalk/v1/api/vessels/self',
            context: drawingContext,
            period: 1000
        });
        updater.update();

        var uiController = new EInkUIController({
            context: drawingContext,
            rotateControl: document.getElementById("rotate"),
            pageControl: document.getElementById("page"),
            themeControl: document.getElementById("theme"),
            rotations: [ "portrate", "landscape"],
            pages: ["default", "large"],
            themes: ["day","night","nightred","nightvision"]
        });

        document.getElementById("body").addEventListener("keydown", function(e) {
            debug("got keydown");
        });
        document.getElementById("body").addEventListener("auxclick", function(e) {
            debug("got auxclick");
        });
        document.getElementById("body").addEventListener("keypress", function(e) {
            debug("got keypress");
        });
        document.getElementById("body").addEventListener("scroll", function(e) {
            debug("got scroll");
        });




})();
