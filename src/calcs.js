/*jshint node:false */


Calcs = function(options) {
    this.performance = new Performance({});
}

"use strict";



Calcs.prototype.resolveAndCreate = function(state, path) {
    var pathElements = path.split(".");
    var n = state;
    for (var i = 0; i < pathElements.length; i++) {
        if ( n[pathElements[i]] === undefined ) {
            n[pathElements[i]] = {};
        }
        n = n[pathElements[i]];
    }
    return n;
};

Calcs.prototype.save = function(state, path, v, ts, units, description, overwrite) {
    var n = this.resolveAndCreate(state, path);
    if ( overwrite || n.value === undefined ) {
        n.value = v;
        n.timestamp = ts;
        n.meta = { units: units, description: description };
        n["$source"] = "calculated";        
    }
};

Calcs.prototype.calcBearing = function(state, truePath, magneticPath, variation) {
    var trueBearing = this.resolveAndCreate(state, truePath);
    var magneticBearing = this.resolveAndCreate(state, magneticPath);
    if ( trueBearing.value && magneticBearing.value === undefined ) {
        var bearing = trueBearing.value+variation;
        if (bearing > 2*Math.PI ) {
            bearing = bearing - 2*Math.PI;
        } else if ( bearing < 0 ) {
            bearing = bearing + 2*Math.PI;
        }
        magneticBearing.value =  bearing;
        magneticBearing.timestamp = trueBearing.timestamp;
        magneticBearing.meta = { units: "rad" };
        magneticBearing["$source"] = "calculated";
    } else if ( magneticBearing.value && trueBearing.value === undefined ) {
        var bearing = magneticBearing.value-variation;
        if (bearing > 2*Math.PI ) {
            bearing = bearing - 2*Math.PI;
        } else if ( bearing < 0 ) {
            bearing = bearing + 2*Math.PI;
        }
        trueBearing.value =  bearing;
        trueBearing.timestamp = magneticBearing.timestamp;
        trueBearing.meta = { units: "rad" };
        trueBearing["$source"] = "calculated";
    }
};

Calcs.prototype.enhance = function(state) {
    if ( !state) {
        return;
    }
    var calcStart = Date.now();
    // true and magnetic
    var magneticVariation = 0;
    if (state.navigation && state.navigation.magneticVariation ) {
        magneticVariation = state.navigation.magneticVariation.value;
    }
    this.calcBearing(state, "navigation.courseOverGroundTrue", "navigation.courseOverGroundMagnetic", magneticVariation);
    this.calcBearing(state, "navigation.headingTrue", "navigation.headingMagnetic", magneticVariation);

    var stw = undefined, awa = undefined, roll = undefined, aws = undefined,
       cogm = undefined, cogt = undefined, hdm = undefined, hdt = undefined,
       tws = undefined, twa = undefined, timestamp = undefined;

    if ( state.navigation ) {
        if ( state.navigation.speedThroughWater ) {
            stw = state.navigation.speedThroughWater.value;
            timestamp = state.navigation.speedThroughWater.timestamp;
        }
        if ( state.navigation.attitude ) {
            roll = state.navigation.attitude.value.roll;
        }
        if ( state.navigation.courseOverGroundMagnetic ) {
            cogm = state.navigation.courseOverGroundMagnetic.value;
        }
        if ( state.navigation.courseOverGroundTrue ) {
            cogt = state.navigation.courseOverGroundTrue.value;
        }
        if ( state.navigation.headingTrue ) {
            hdt = state.navigation.headingTrue.value;
        }
        if ( state.navigation.headingMagnetic ) {
            hdm = state.navigation.headingMagnetic.value;
        }
    }
    if ( state.environment ) {
        if (state.environment.wind ) {
            if (state.environment.wind.speedApparent ){
                aws = state.environment.wind.speedApparent.value;
            }
            if (state.environment.wind.angleApparent ){
                awa = state.environment.wind.angleApparent.value;
            }
            if (state.environment.wind.angleTrueWater ){
                twa = state.environment.wind.angleTrueWater.value;
            }
            if (state.environment.wind.speedTrue ){
                tws = state.environment.wind.speedTrue.value;
            }
        }
    }
    var leeway = undefined;
    if ( stw && roll  && awa && stw) {
        leeway = 0.0;
        if ( Math.abs(awa) < Math.PI/2 &&
             aws < 30/1.943844) {
            if ( stw > 0.5 ) {
                  // This comes from Pedrick see http://www.sname.org/HigherLogic/System/DownloadDocumentFile.ashx?DocumentFileKey=5d932796-f926-4262-88f4-aaca17789bb0
                  // for aws < 30 and awa < 90. UK  =15 for masthead and 5 for fractional
                leeway = 5 * roll / (stw * stw);
            }
        } 
        this.save(state, "performance.leeway", leeway, timestamp, "rad", "Leway calulated from roll", true);
    }
    if ( awa && aws && (!twa || !tws)) {
        var apparentX = Math.cos(awa) * aws;
        var apparentY = Math.sin(awa) * aws;
        twa = Math.atan2(apparentY, -stw + apparentX),
        tws = Math.sqrt(Math.pow(apparentY, 2) + Math.pow(-stw + apparentX, 2));

        this.save(state, "environment.wind.angleTrueWater", twa, timestamp, "rad", "True Wind Angle", false);
        this.save(state, "environment.wind.speedTrue", tws, timestamp, "rad", "True Wind Speed", false);
    }
    if ( tws && twa && stw && hdt ) {
        var performance = this.performance.calcPerformance(tws, twa, stw, hdt, magneticVariation, leeway);
        this.save(state, 'performance.polarSpeed', performance.polarSpeed, timestamp, "m/s", "polar speed at this twa", true);
        this.save(state, 'performance.polarSpeedRatio', performance.polarSpeedRatio, timestamp, "%", "polar speed ratio", true);
        this.save(state, 'performance.oppositeTrackMagnetic', performance.oppositeTrackMagnetic, timestamp, "rad", "opposite track magnetic bearing", true);
        this.save(state, 'performance.oppositeTrackTrue', performance.oppositeTrackTrue, timestamp, "rad", "opposite track true bearing", true);
        this.save(state, 'performance.oppositeHeadingMagnetic', performance.oppositeHeadingMagnetic, timestamp,  "rad", "opposite geading magnetic bearing",true);
        this.save(state, 'performance.oppositeHeadingTrue', performance.oppositeHeadingTrue, timestamp, "rad", "opposite geading true bearing", true);
        this.save(state, 'performance.targetTwa', performance.targetTwa, timestamp, "rad", "target twa on this track for best vmg", true);
        this.save(state, 'performance.targetStw', performance.targetStw, timestamp, "m/s", "target speed on at best vmg and angle", true);
        this.save(state, 'performance.targetVmg', performance.targetVmg, timestamp, "m/s", "target vmg -ve == downwind", true);
        this.save(state, 'performance.vmg', performance.vmg, timestamp, "m/s", "current vmg at polar speed", true);
        this.save(state, 'performance.polarVmg', performance.polarVmg, timestamp, "m/s", "current vmg at best angle", true);
        this.save(state, 'performance.polarVmgRatio', performance.polarVmgRatio, timestamp, "m/s", "ratio between vmg and optimal vmg", true);
        this.save(state, 'environment.wind.windDirectionTrue', performance.windDirectionTrue, timestamp, "rad","True wind direction", true);
        this.save(state, 'environment.wind.windDirectionMagnetic', performance.windDirectionMagnetic, timestamp, "rad","Magnetic wind direction", true);
    }
    this.save(state, 'sys.polarBuild', this.performance.fineBuildTime, timestamp, "ms","Timetaken to build the Polar Table", true);
    this.save(state, 'sys.calcTime', Date.now() - calcStart, timestamp, "ms","Timetaken perform caculations", true);
    if ( window.performance && window.performance.memory  ) {
        this.save(state, 'sys.jsHeapSizeLimit', window.performance.memory.jsHeapSizeLimit , timestamp, "bytes","JS Heap Limit", true);
        this.save(state, 'sys.totalJSHeapSize', window.performance.memory.totalJSHeapSize , timestamp, "bytes","JS Heap Size", true);
        this.save(state, 'sys.usedJSHeapSize', window.performance.memory.usedJSHeapSize , timestamp, "bytes","JS Heap Used", true);
    }
}

var pogo1250Polar = {
  name : "pogo1250",
  tws : [0,4,6,8,10,12,14,16,20,25,30,35,40,45,50,55,60],
  twa : [0,5,10,15,20,25,32,36,40,45,52,60,70,80,90,100,110,120,130,140,150,160,170,180],
  stw : [
[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
[0,0.4,0.6,0.8,0.9,1,1,1,1.1,1.1,1.1,1.1,0.1,0.1,0.1,0,0],
[0,0.8,1.2,1.6,1.8,2,2,2.1,2.1,2.2,2.2,2.2,0.5,0.2,0.2,0,0],
[0,1.2,1.8,2.4,2.7,2.9,3,3.1,3.2,3.3,3.3,3.3,1.2,0.5,0.3,0,0],
[0,1.4,2.1,2.7,3.1,3.4,3.5,3.6,3.6,3.7,3.8,3.7,1.7,0.7,0.4,0,0],
[0,1.7,2.5,3.2,3.7,4,4.1,4.3,4.3,4.4,4.5,4.4,2.6,1.1,0.4,0,0],
[0,2.8,4.2,5.4,6.2,6.7,6.9,7.1,7.2,7.4,7.5,7.4,5.6,2.2,0.7,0,0],
[0,3.1,4.7,5.9,6.7,7,7.2,7.4,7.6,7.8,7.9,7.9,6.5,2.6,0.8,0,0],
[0,3.5,5.1,6.3,7,7.3,7.5,7.7,7.9,8.1,8.2,8.3,7.4,2.9,1.2,0,0],
[0,3.8,5.6,6.7,7.3,7.6,7.8,8,8.2,8.4,8.5,8.6,8.2,3,1.3,0,0],
[0,4.2,6,7,7.7,8,8.2,8.3,8.6,8.9,9,9.1,8.9,3.2,1.4,0,0],
[0,4.6,6.3,7.3,8,8.3,8.5,8.7,9,9.3,9.5,9.6,9.6,3.8,1.9,0,0],
[0,4.8,6.6,7.5,8.2,8.6,8.9,9.1,9.5,9.8,10.1,10.4,10.4,4.2,2.1,0,0],
[0,5,6.9,7.9,8.3,8.8,9.2,9.4,9.9,10.4,10.9,11.3,11.3,4.5,2.3,0,0],
[0,5.3,7.1,8.1,8.6,8.9,9.3,9.7,10.4,11.1,11.8,12.5,12.5,5.6,3.1,0.6,0.6],
[0,5.4,7.1,8.2,8.8,9.2,9.5,9.9,10.9,11.9,12.8,14.1,14.1,7.1,4.2,0.7,0.7],
[0,5.3,7,8.1,8.8,9.4,9.8,10.3,11.2,12.7,14.3,15,15,8.3,5.3,1.5,1.5],
[0,5,6.8,7.8,8.6,9.4,10,10.6,11.8,13.2,14.9,15.7,15.7,9.4,6.3,1.6,1.6],
[0,4.5,6.3,7.4,8.3,9,9.8,10.6,12.3,14.4,15.6,16.6,16.6,10.8,7.5,2.5,2.5],
[0,3.8,5.6,6.9,7.8,8.5,9.2,10,12.2,15,16.3,17.6,17.6,13.2,9.7,3.5,2.6],
[0,3.2,4.8,6.1,7.1,7.9,8.6,9.3,10.9,14.4,16.8,18.6,18.6,14.9,11.2,3.7,3.7],
[0,2.7,4.1,5.3,6.4,7.3,8,8.7,10,12.4,15.4,17.9,17.9,15.2,11.6,4.5,3.6],
[0,2.4,3.6,4.8,5.9,6.8,7.6,8.2,9.4,11.4,14.3,16.6,16.6,15.8,12.5,5,4.2],
[0,2.2,3.3,4.4,5.5,6.4,7.2,7.9,9,10.6,12.8,15.4,15.4,15.4,12.3,4.6,3.9]
]
};



Performance = function(options) {
    if ( options.url) {
        var that = this;
        var DONE = XMLHttpRequest.DONE || 4;
        var httpRequest = new XMLHttpRequest();
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState === DONE) {
              if (httpRequest.status === 200) {
                var polar = JSON.parse(httpRequest.responseText);
                that._finishLoad(polar);
              }
            }
        };
        httpRequest.open('GET', options.url);
        httpRequest.send();
    } else {
        this._finishLoad(pogo1250Polar);
    }

}

Performance.prototype._finishLoad = function(polar) {
    if ( polar.twa.length !== polar.stw.length) {
      throw("Polar STW does not have enough rows for the TWA array. Expected:"+polar.twa.length+" Found:"+polar.stw.length);
    }
    for (var i = 0; i < polar.stw.length; i++) {
      if ( polar.tws.length !== polar.stw[i].length ) {
            throw("Polar STW row "+i+" does not ave enough columns Expected:"+polar.tws.length+" Found:"+polar.stw.length);
      }
    }
    for (var i = 1; i < polar.twa.length; i++) {
      if ( polar.twa[i] < polar.twa[i-1] ) {
        throw("Polar TWA must be in ascending order and match the columns of stw.");
      }
    };
    for (var i = 1; i < polar.tws.length; i++) {
      if ( polar.tws[i] < polar.tws[i-1] ) {
        throw("Polar TWA must be in ascending order and match the rows of stw.");
      }
    };
    // Optimisatin,
    this.polarTable = this._buildFinePolarTable(polar);
};

Performance.prototype._buildFinePolarTable = function(polarInput) {
    var finePolar = {
      lookup: true,
      siunits: true,
      twsstep : 0.1, // 600 0 - 60Kn
      twastep : 1,  //  180 0 - 180 deg
      tws : [],
      twa : [],
      stw : []  // 108000 elements
    }
    var startFineBuild = Date.now();
    for(var twa = 0; twa < polarInput.twa[polarInput.twa.length-1]; twa += 1) {
      finePolar.twa.push(twa*Math.PI/180);
      finePolar.stw.push([]);
    }
    for(var tws = 0; tws < polarInput.tws[polarInput.tws.length-1]; tws += 0.1) {
      finePolar.tws.push(tws/1.9438444924);
    }
    for (var ia = 0; ia < finePolar.twa.length; ia++) {
      for (var is = 0; is < finePolar.tws.length; is++) {
        finePolar.stw[ia][is] = this._calcPolarSpeed(polarInput,finePolar.tws[is],finePolar.twa[ia],0);
      }
    }
    this.fineBuildTime = Date.now() - startFineBuild;
    return finePolar;
}

Performance.prototype._findIndexes = function(a, v) {
    for (var i = 0; i < a.length; i++) {
        if ( a[i] > v ) {
            if ( i == 0 ) {
                return [ 0,0];
            } else {
                return [ i-1, i];
            }
        }
    }
    return [ a.length-1, a.length-1];
};

/**
 * find y between yl and yh in the same ratio of x between xl, xh
 * simple straight line interpolation.
 */
Performance.prototype._interpolate = function(x, xl, xh, yl, yh) {
  var r = 0;
  if ( x >= xh ) {
    r = yh;
  } else if ( x <= xl ) {
    r =  yl;
  } else if ( (xh - xl) < 1.0E-8 ) {
    r =  yl+(yh-yl)*((x-xl)/1.0E-8);
  } else {
    r = yl+(yh-yl)*((x-xl)/(xh-xl));
  }
  return r;
};


Performance.prototype._fixDirection =  function(d) {
    if ( d > Math.PI*2 ) d = d - Math.PI*2;
    if ( d < 0 ) d = d + Math.PI*2;
    return d;
}

Performance.prototype._calcPolarSpeed = function(polarInput, tws, twa, stw, targets) {
    // polar Data is in KN and deg
    tws = tws*1.9438444924;
    twa = twa*180/Math.PI;      
    // after here in Deg and Kn
    var twsi = this._findIndexes(polarInput.tws, tws);
    var twai = this._findIndexes(polarInput.twa, twa);
    var stwl = this._interpolate(twa, polarInput.twa[twai[0]], polarInput.twa[twai[1]], polarInput.stw[twai[0]][twsi[0]], polarInput.stw[twai[1]][twsi[0]]);
      // interpolate a stw high value for a given tws and range
    var stwh = this._interpolate(twa, polarInput.twa[twai[0]], polarInput.twa[twai[1]], polarInput.stw[twai[0]][twsi[1]], polarInput.stw[twai[1]][twsi[1]]);
      // interpolate a stw final value for a given tws and range using the high an low values for twa.
    return this._interpolate(tws, polarInput.tws[twsi[0]], polarInput.tws[twsi[1]], stwl, stwh)/1.9438444924;      
}

/**
 * Returns polarPerf = {
  vmg : 0,
  polarVmg: 0;
  polarSpeed: 0,
  polarSpeedRatio:  1,
  polarVmgRatio: 1
 }
 Only calcuates polr Vmg ration is targets is defined.
 All inputs outputs are SI
 */

Performance.prototype.calcPerformance = function(tws, twa, stw, trueHeading, magneticVariation, leeway) {
    var abs_twa = twa;
    if ( twa < 0) abs_twa = -twa;
    var twsi = this._findIndexes(this.polarTable.tws, tws);
    var twai = this._findIndexes(this.polarTable.twa, abs_twa);
    var polarSpeed = this.polarTable.stw[twai[1]][twsi[1]];
    if (polarSpeed !== 0) {
      polarSpeedRatio = stw/polarSpeed;
    }
    var polarVmg = polarSpeed*Math.cos(abs_twa);
    var vmg = stw*Math.cos(abs_twa);


    // calculate the optimal VMG angles
    var twal = 0;
    var twah = Math.PI;
    if ( abs_twa < Math.PI/2 ) {
      twah = Math.PI/2;
    } else {
      twal = Math.PI/2;
      // downwind scan from 90 - 180
    }
    var targetVmg = 0, targetTwa = 0, targetStw = 0;
    for(var ttwa = twal; ttwa <= twah; ttwa += Math.PI/180) {
        var twai = this._findIndexes(this.polarTable.twa, ttwa);
        var tswt = this.polarTable.stw[twai[1]][twsi[1]];
        var tvmg = tswt*Math.cos(ttwa);
        if ( Math.abs(tvmg) > Math.abs(targetVmg) ) {
          targetVmg = tvmg;
          targetTwa = ttwa;
          targetStw = tswt;
        }
    }
    if ( twa < 0 ) {
      targetTwa = -targetTwa;
    }
    if (Math.abs(targetVmg) > 1.0E-8 ) {
       polarVmgRatio = vmg/targetVmg;
    }

    // calculate other track
    leeway = leeway || 0;

    var windDirectionTrue = this._fixDirection(trueHeading+twa);
    var windDirectionMagnetic = this._fixDirection(windDirectionTrue+magneticVariation);
    otherTrackHeadingTrue = this._fixDirection(windDirectionTrue+targetTwa);
    if ( twa > 0 ) {
      oppositeTrackTrue = otherTrackHeadingTrue+leeway*2;
    } else {
      oppositeTrackTrue = otherTrackHeadingTrue-leeway*2;
    }
    oppositeTrackMagnetic = oppositeTrackTrue + magneticVariation;
    oppositeHeadingMagnetic = this._fixDirection(otherTrackHeadingTrue + magneticVariation);

    return {
      vmg: vmg,
      polarVmg: polarVmg,
      polarSpeed: polarSpeed,
      polarSpeedRatio:  polarSpeedRatio,
      polarVmgRatio: polarVmgRatio,
      targetVmg: targetVmg,
      targetTwa: targetTwa,
      targetStw: targetStw,
      windDirectionTrue: windDirectionTrue,
      windDirectionMagnetic: windDirectionMagnetic,
      oppositeHeadingTrue: otherTrackHeadingTrue,
      oppositeTrackTrue: oppositeTrackTrue,
      oppositeTrackMagnetic: oppositeTrackMagnetic,
      oppositeHeadingMagnetic: oppositeHeadingMagnetic
    };
}

