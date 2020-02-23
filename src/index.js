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

Calculated internally provided sufficient data is provided from the server.
    navigation.courseOverGroundTrue if missing
    navigation.courseOverGroundMagnetic if missing
    navigation.headingTrue if missing
    navigation.headingMagnetic if missing
    performance.leeway needs roll, awa, stw

    environment.wind.angleTrueWater if missing, requires awa, aws, stw
    environment.wind.speedTrue if missing, requires awa, aws, stw

    the following require tws && twa && stw && hdt 
    performance.polarSpeed polar speed at this twa
*    performance.polarSpeedRatio polar speed ratio
    performance.oppositeTrackMagnetic opposite track magnetic bearing
    performance.oppositeTrackTrue opposite track true bearing
    performance.oppositeHeadingMagnetic opposite geading magnetic bearing
    performance.oppositeHeadingTrue opposite geading true bearing
    performance.targetTwa target twa on this track for best vmg
    performance.targetStw target speed on at best vmg and angle
    performance.targetVmg target vmg -ve == downwind
    performance.vmg current vmg at polar speed
    performance.polarVmg current vmg at best angle
*    performance.polarVmgRatio ratio between vmg and optimal vmg
    environment.wind.windDirectionTrue True wind direction
    environment.wind.windDirectionMagnetic Magnetic wind direction





*/

        var row = 0;
        var col = 0;
        function r() {
            var r = row;
            row++;
            if ( row > 3) {
                row = 0;
                col++;
            }
            return r;
        }
        function c() {
            return col;
        }

        var display = {
            "default": [
                new EInkRelativeAngle('environment.wind.angleApparent','awa', c(),r()),
                new EInkSpeed('environment.wind.speedApparent', 'aws',        c(),r()),
                new EInkSpeed('navigation.speedThroughWater', 'stw',          c(),r()),
                new EInkDistance('environment.depth.belowTransducer', 'dbt',  c(),r()),
                new EInkRelativeAngle('environment.wind.angleTrueWater','twa',c(),r()),
                new EInkSpeed('environment.wind.speedTrue', 'tws',            c(),r()),
                new EInkRelativeAngle('performance.leeway','leeway',c(),r(), undefined, 1),
                new EInkAttitude(c(),r()),
                new EInkSpeed('navigation.speedOverGround', 'sog',            c(),r()),
                new EInkBearing('navigation.courseOverGroundMagnetic', 'cogm',c(),r()),
                new EInkPossition(c(),r()),
                new EInkLog(c(),r()),
                new EInkCurrent(c(),r()),
                new EInkPilot(c(),r()),
                new EInkFix(c(),r()),
                new EInkTemperature('environment.water.temperature','water',c(),r()),
                new EInkBearing('environment.wind.windDirectionMagnetic', 'windM',c(),r()),
                new EInkSpeed('performance.velocityMadeGood', 'vmg',          c(),r()),
                new EInkSys(c(),r()),
                new EInkBearing('navigation.headingMagnetic','hdm',c(),r()),
                new EInkSpeed('performance.polarSpeed', 'polar stw',        c(),r()),
                new EInkSpeed('performance.vmg', 'polar vmg',        c(),r()),
                new EInkSpeed('performance.polarVmg', 'best polar vmg',        c(),r()),
                new EInkSpeed('performance.targetStw', 'target stw',        c(),r()),
                new EInkSpeed('performance.targetVmg', 'target vmg',        c(),r()),
                new EInkBearing('performance.oppositeTrackMagnetic', 'op tack m',c(),r()),
                new EInkBearing('performance.oppositeHeadingMagnetic', 'op head m',c(),r()),
                new EInkRelativeAngle('performance.targetTwa','target twa',c(),r()),
                new EInkRatio('performance.polarSpeedRatio',"polar stw perf", c(), r()),
                new EInkRatio('performance.polarVmgRatio',"polar vmg perf", c(), r())


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
            width: 1850,
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
