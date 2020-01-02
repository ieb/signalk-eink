/*jshint node:false */
"use strict";
(function() {

/*
Raw PGNs seen on Luna from Raymarine bus

EInkPilot
   steering.autopilot.target.headingMagnetic.value (rad) pilot
   steering.autopilot.state.value  (text)  pilot

EInkLog
   navigation.trip.log (m)   distance
   navigation.log (m) distance
   
EInkFix
   navigation.gnss.methodQuality (text) fix
   navigation.gnss.horizontalDilution (float) fix
   navigation.gnss.type (text) fix
   navigation.gnss.satellites (int) fix
   navigation.gnss.integrity (text) fix
   
EInkPossition
   navigation.position (lat, lon, deg) position
   navigation.datetime (date)
   
EInkCurrent
   environment.current (drift (m/s), setTrue (rad))
   
EInkAttitude
   navigation.attitude (roll, pitch, yaw rad)


   environment.water.temperature (K) temperature
   

   steering.rudderAngle.value  (rad) angle
   navigation.magneticVariation (rad) angle
   navigation.courseOverGroundTrue (rad) angle 
   navigation.rateOfTurn (rad/s) anglerate
   navigation.speedThroughWater (m/s) speed
   navigation.headingMagnetic (rad) angle
   navigation.speedOverGround (m/s) speed
   environment.wind.speedApparent (m/s) speed
   environment.wind.angleApparent (rad) wind
   environment.depth.belowTransducer (m) meters

   navigation.speedThroughWaterReferenceType (text)

*/
        var display = {
            "default": [
                new EInkRelativeAngle('environment.wind.angleApparent','awa', 0,0),
                new EInkSpeed('environment.wind.speedApparent', 'aws',        0,1),
                new EInkDistance('environment.depth.belowTransducer', 'dbt',  0,2),
                new EInkPossition(0,3),
                new EInkPilot(1,0),
                new EInkLog(1,1),
                new EInkFix(1,2),
                new EInkCurrent(1,3),
                new EInkSpeed('navigation.speedOverGround', 'sog',            2,0),
                new EInkBearing('navigation.courseOverGroundTrue','cogt',2,1),
                new EInkSpeed('navigation.speedThroughWater', 'stw',          2,2),
                new EInkAttitude(2,3),
                new EInkRelativeAngle('environment.wind.angleTrueWater','twa',3,0),
                new EInkSpeed('performance.velocityMadeGood', 'vmg',          3,1),
                new EInkSpeed('environment.wind.speedTrue', 'tws',            3,2),
                new EInkBearing('navigation.courseOverGroundMagnetic', 'cogm',3,3),
                new EInkTemperature('environment.water.temperature','water',4,0),
                new EInkSys(4,1)
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
        var drawingOptions = {
            canvas: document.getElementById("canvas"),            
            themes: themes,
            portrait: true, 
            width: 1500,
            height: 600,
            theme: "night",
            displayList: display            
        };
        if ( isKindle ) {
            drawingOptions.portrait = false;
        }
        var drawingContext = new EInkDrawingContext(drawingOptions);
        var updater =  new EInkUpdater({
            url: '/signalk/v1/api/vessels/self',
            calculations: new Calcs(),
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
