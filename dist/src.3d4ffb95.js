parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"Focm":[function(require,module,exports) {
"use strict";!function(){var e=0,n=0;function t(){var t=e;return++e>3&&(e=0,n++),t}function r(){return n}var a={defaultView:[new EInkRelativeAngle("environment.wind.angleApparent","awa",r(),t()),new EInkSpeed("environment.wind.speedApparent","aws",r(),t()),new EInkSpeed("navigation.speedThroughWater","stw",r(),t()),new EInkDistance("environment.depth.belowTransducer","dbt",r(),t()),new EInkRelativeAngle("environment.wind.angleTrueWater","twa",r(),t()),new EInkSpeed("environment.wind.speedTrue","tws",r(),t()),new EInkRelativeAngle("performance.leeway","leeway",r(),t(),void 0,1),new EInkAttitude(r(),t()),new EInkSpeed("navigation.speedOverGround","sog",r(),t()),new EInkBearing("navigation.courseOverGroundMagnetic","cogm",r(),t()),new EInkPossition(r(),t()),new EInkLog(r(),t()),new EInkCurrent(r(),t()),new EInkPilot(r(),t()),new EInkFix(r(),t()),new EInkTemperature("environment.water.temperature","water",r(),t()),new EInkBearing("environment.wind.windDirectionMagnetic","windM",r(),t()),new EInkSpeed("performance.velocityMadeGood","vmg",r(),t()),new EInkSys(r(),t()),new EInkBearing("navigation.headingMagnetic","hdm",r(),t()),new EInkSpeed("performance.polarSpeed","polar stw",r(),t()),new EInkSpeed("performance.vmg","polar vmg",r(),t()),new EInkSpeed("performance.polarVmg","best polar vmg",r(),t()),new EInkSpeed("performance.targetStw","target stw",r(),t()),new EInkSpeed("performance.targetVmg","target vmg",r(),t()),new EInkBearing("performance.oppositeTrackMagnetic","op tack m",r(),t()),new EInkBearing("performance.oppositeHeadingMagnetic","op head m",r(),t()),new EInkRelativeAngle("performance.targetTwa","target twa",r(),t()),new EInkRatio("performance.polarSpeedRatio","polar stw perf",r(),t()),new EInkRatio("performance.polarVmgRatio","polar vmg perf",r(),t())]},o=(Object.create,{canvas:document.getElementById("canvas"),themes:{day:{foreground:"black",background:"white"},night:{foreground:"white",background:"black"},nightred:{foreground:"red",background:"black"},nightvision:{foreground:"green",background:"black"}},portrait:!isKindle,width:1850,height:600,theme:"night",displayList:a}),i=new EInkDrawingContext(o);new EInkUpdater({url:"/signalk/v1/api/vessels/self",calculations:new Calcs,context:i,period:1e3}).update();new EInkUIController({context:i,rotateControl:document.getElementById("rotate"),pageControl:document.getElementById("page"),themeControl:document.getElementById("theme"),rotations:["portrate","landscape"],pages:["default","large"],themes:["day","night","nightred","nightvision"]});document.getElementById("body").addEventListener("keydown",function(e){debug("got keydown")}),document.getElementById("body").addEventListener("auxclick",function(e){debug("got auxclick")}),document.getElementById("body").addEventListener("keypress",function(e){debug("got keypress")}),document.getElementById("body").addEventListener("scroll",function(e){debug("got scroll")})}();
},{}]},{},["Focm"], null)
//# sourceMappingURL=src.3d4ffb95.js.map