parcelRequire=function(e,r,t,n){var i,o="function"==typeof parcelRequire&&parcelRequire,u="function"==typeof require&&require;function f(t,n){if(!r[t]){if(!e[t]){var i="function"==typeof parcelRequire&&parcelRequire;if(!n&&i)return i(t,!0);if(o)return o(t,!0);if(u&&"string"==typeof t)return u(t);var c=new Error("Cannot find module '"+t+"'");throw c.code="MODULE_NOT_FOUND",c}p.resolve=function(r){return e[t][1][r]||r},p.cache={};var l=r[t]=new f.Module(t);e[t][0].call(l.exports,p,l,l.exports,this)}return r[t].exports;function p(e){return f(p.resolve(e))}}f.isParcelRequire=!0,f.Module=function(e){this.id=e,this.bundle=f,this.exports={}},f.modules=e,f.cache=r,f.parent=o,f.register=function(r,t){e[r]=[function(e,r){r.exports=t},{}]};for(var c=0;c<t.length;c++)try{f(t[c])}catch(e){i||(i=e)}if(t.length){var l=f(t[t.length-1]);"object"==typeof exports&&"undefined"!=typeof module?module.exports=l:"function"==typeof define&&define.amd?define(function(){return l}):n&&(this[n]=l)}if(parcelRequire=f,i)throw i;return f}({"w3cE":[function(require,module,exports) {
Calcs=function(e){this.performance=new Performance({})},Calcs.prototype.resolveAndCreate=function(e,a){for(var t=a.split("."),i=e,r=0;r<t.length;r++)void 0===i[t[r]]&&(i[t[r]]={}),i=i[t[r]];return i},Calcs.prototype.save=function(e,a,t,i,r,n,o){var s=this.resolveAndCreate(e,a);(o||void 0===s.value)&&(s.value=t,s.timestamp=i,s.meta={units:r,description:n},s.$source="calculated")},Calcs.prototype.calcBearing=function(e,a,t,i){var r=this.resolveAndCreate(e,a),n=this.resolveAndCreate(e,t);if(r.value&&void 0===n.value)(o=r.value+i)>2*Math.PI?o-=2*Math.PI:o<0&&(o+=2*Math.PI),n.value=o,n.timestamp=r.timestamp,n.meta={units:"rad"},n.$source="calculated";else if(n.value&&void 0===r.value){var o;(o=n.value-i)>2*Math.PI?o-=2*Math.PI:o<0&&(o+=2*Math.PI),r.value=o,r.timestamp=n.timestamp,r.meta={units:"rad"},r.$source="calculated"}},Calcs.prototype.enhance=function(e){if(e){var a=Date.now(),t=0;e.navigation&&e.navigation.magneticVariation&&(t=e.navigation.magneticVariation.value),this.calcBearing(e,"navigation.courseOverGroundTrue","navigation.courseOverGroundMagnetic",t),this.calcBearing(e,"navigation.headingTrue","navigation.headingMagnetic",t);var i=void 0,r=void 0,n=void 0,o=void 0,s=void 0,p=void 0,d=void 0,c=void 0;e.navigation&&(e.navigation.speedThroughWater&&(i=e.navigation.speedThroughWater.value,c=e.navigation.speedThroughWater.timestamp),e.navigation.attitude&&(n=e.navigation.attitude.value.roll),e.navigation.courseOverGroundMagnetic&&e.navigation.courseOverGroundMagnetic.value,e.navigation.courseOverGroundTrue&&e.navigation.courseOverGroundTrue.value,e.navigation.headingTrue&&(s=e.navigation.headingTrue.value),e.navigation.headingMagnetic&&e.navigation.headingMagnetic.value),e.environment&&e.environment.wind&&(e.environment.wind.speedApparent&&(o=e.environment.wind.speedApparent.value),e.environment.wind.angleApparent&&(r=e.environment.wind.angleApparent.value),e.environment.wind.angleTrueWater&&(d=e.environment.wind.angleTrueWater.value),e.environment.wind.speedTrue&&(p=e.environment.wind.speedTrue.value));var g=void 0;if(i&&n&&r&&i&&(g=0,Math.abs(r)<Math.PI/2&&o<30/1.943844&&i>.5&&(g=5*n/(i*i)),this.save(e,"performance.leeway",g,c,"rad","Leway calulated from roll",!0)),r&&o&&(!d||!p)){var l=Math.cos(r)*o,h=Math.sin(r)*o;d=Math.atan2(h,-i+l),p=Math.sqrt(Math.pow(h,2)+Math.pow(-i+l,2)),this.save(e,"environment.wind.angleTrueWater",d,c,"rad","True Wind Angle",!1),this.save(e,"environment.wind.speedTrue",p,c,"rad","True Wind Speed",!1)}if(p&&d&&i&&s){var v=this.performance.calcPerformance(p,d,i,s,t,g);this.save(e,"performance.polarSpeed",v.polarSpeed,c,"m/s","polar speed at this twa",!0),this.save(e,"performance.polarSpeedRatio",v.polarSpeedRatio,c,"%","polar speed ratio",!0),this.save(e,"performance.oppositeTrackMagnetic",v.oppositeTrackMagnetic,c,"rad","opposite track magnetic bearing",!0),this.save(e,"performance.oppositeTrackTrue",v.oppositeTrackTrue,c,"rad","opposite track true bearing",!0),this.save(e,"performance.oppositeHeadingMagnetic",v.oppositeHeadingMagnetic,c,"rad","opposite geading magnetic bearing",!0),this.save(e,"performance.oppositeHeadingTrue",v.oppositeHeadingTrue,c,"rad","opposite geading true bearing",!0),this.save(e,"performance.targetTwa",v.targetTwa,c,"rad","target twa on this track for best vmg",!0),this.save(e,"performance.targetStw",v.targetStw,c,"m/s","target speed on at best vmg and angle",!0),this.save(e,"performance.targetVmg",v.targetVmg,c,"m/s","target vmg -ve == downwind",!0),this.save(e,"performance.vmg",v.vmg,c,"m/s","current vmg at polar speed",!0),this.save(e,"performance.polarVmg",v.polarVmg,c,"m/s","current vmg at best angle",!0),this.save(e,"performance.polarVmgRatio",v.polarVmgRatio,c,"m/s","ratio between vmg and optimal vmg",!0),this.save(e,"environment.wind.windDirectionTrue",v.windDirectionTrue,c,"rad","True wind direction",!0),this.save(e,"environment.wind.windDirectionMagnetic",v.windDirectionMagnetic,c,"rad","Magnetic wind direction",!0)}this.save(e,"sys.polarBuild",this.performance.fineBuildTime,c,"ms","Timetaken to build the Polar Table",!0),this.save(e,"sys.calcTime",Date.now()-a,c,"ms","Timetaken perform caculations",!0),window.performance&&window.performance.memory&&(this.save(e,"sys.jsHeapSizeLimit",window.performance.memory.jsHeapSizeLimit,c,"bytes","JS Heap Limit",!0),this.save(e,"sys.totalJSHeapSize",window.performance.memory.totalJSHeapSize,c,"bytes","JS Heap Size",!0),this.save(e,"sys.usedJSHeapSize",window.performance.memory.usedJSHeapSize,c,"bytes","JS Heap Used",!0))}};var e={name:"pogo1250",tws:[0,4,6,8,10,12,14,16,20,25,30,35,40,45,50,55,60],twa:[0,5,10,15,20,25,32,36,40,45,52,60,70,80,90,100,110,120,130,140,150,160,170,180],stw:[[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],[0,.4,.6,.8,.9,1,1,1,1.1,1.1,1.1,1.1,.1,.1,.1,0,0],[0,.8,1.2,1.6,1.8,2,2,2.1,2.1,2.2,2.2,2.2,.5,.2,.2,0,0],[0,1.2,1.8,2.4,2.7,2.9,3,3.1,3.2,3.3,3.3,3.3,1.2,.5,.3,0,0],[0,1.4,2.1,2.7,3.1,3.4,3.5,3.6,3.6,3.7,3.8,3.7,1.7,.7,.4,0,0],[0,1.7,2.5,3.2,3.7,4,4.1,4.3,4.3,4.4,4.5,4.4,2.6,1.1,.4,0,0],[0,2.8,4.2,5.4,6.2,6.7,6.9,7.1,7.2,7.4,7.5,7.4,5.6,2.2,.7,0,0],[0,3.1,4.7,5.9,6.7,7,7.2,7.4,7.6,7.8,7.9,7.9,6.5,2.6,.8,0,0],[0,3.5,5.1,6.3,7,7.3,7.5,7.7,7.9,8.1,8.2,8.3,7.4,2.9,1.2,0,0],[0,3.8,5.6,6.7,7.3,7.6,7.8,8,8.2,8.4,8.5,8.6,8.2,3,1.3,0,0],[0,4.2,6,7,7.7,8,8.2,8.3,8.6,8.9,9,9.1,8.9,3.2,1.4,0,0],[0,4.6,6.3,7.3,8,8.3,8.5,8.7,9,9.3,9.5,9.6,9.6,3.8,1.9,0,0],[0,4.8,6.6,7.5,8.2,8.6,8.9,9.1,9.5,9.8,10.1,10.4,10.4,4.2,2.1,0,0],[0,5,6.9,7.9,8.3,8.8,9.2,9.4,9.9,10.4,10.9,11.3,11.3,4.5,2.3,0,0],[0,5.3,7.1,8.1,8.6,8.9,9.3,9.7,10.4,11.1,11.8,12.5,12.5,5.6,3.1,.6,.6],[0,5.4,7.1,8.2,8.8,9.2,9.5,9.9,10.9,11.9,12.8,14.1,14.1,7.1,4.2,.7,.7],[0,5.3,7,8.1,8.8,9.4,9.8,10.3,11.2,12.7,14.3,15,15,8.3,5.3,1.5,1.5],[0,5,6.8,7.8,8.6,9.4,10,10.6,11.8,13.2,14.9,15.7,15.7,9.4,6.3,1.6,1.6],[0,4.5,6.3,7.4,8.3,9,9.8,10.6,12.3,14.4,15.6,16.6,16.6,10.8,7.5,2.5,2.5],[0,3.8,5.6,6.9,7.8,8.5,9.2,10,12.2,15,16.3,17.6,17.6,13.2,9.7,3.5,2.6],[0,3.2,4.8,6.1,7.1,7.9,8.6,9.3,10.9,14.4,16.8,18.6,18.6,14.9,11.2,3.7,3.7],[0,2.7,4.1,5.3,6.4,7.3,8,8.7,10,12.4,15.4,17.9,17.9,15.2,11.6,4.5,3.6],[0,2.4,3.6,4.8,5.9,6.8,7.6,8.2,9.4,11.4,14.3,16.6,16.6,15.8,12.5,5,4.2],[0,2.2,3.3,4.4,5.5,6.4,7.2,7.9,9,10.6,12.8,15.4,15.4,15.4,12.3,4.6,3.9]]};Performance=function(a){if(a.url){var t=this,i=XMLHttpRequest.DONE||4,r=new XMLHttpRequest;r.onreadystatechange=function(){if(r.readyState===i&&200===r.status){var e=JSON.parse(r.responseText);t._finishLoad(e)}},r.open("GET",a.url),r.send()}else this._finishLoad(e)},Performance.prototype._finishLoad=function(e){if(e.twa.length!==e.stw.length)throw"Polar STW does not have enough rows for the TWA array. Expected:"+e.twa.length+" Found:"+e.stw.length;for(var a=0;a<e.stw.length;a++)if(e.tws.length!==e.stw[a].length)throw"Polar STW row "+a+" does not ave enough columns Expected:"+e.tws.length+" Found:"+e.stw.length;for(a=1;a<e.twa.length;a++)if(e.twa[a]<e.twa[a-1])throw"Polar TWA must be in ascending order and match the columns of stw.";for(a=1;a<e.tws.length;a++)if(e.tws[a]<e.tws[a-1])throw"Polar TWA must be in ascending order and match the rows of stw.";this.polarTable=this._buildFinePolarTable(e)},Performance.prototype._buildFinePolarTable=function(e){for(var a={lookup:!0,siunits:!0,twsstep:.1,twastep:1,tws:[],twa:[],stw:[]},t=Date.now(),i=0;i<e.twa[e.twa.length-1];i+=1)a.twa.push(i*Math.PI/180),a.stw.push([]);for(var r=0;r<e.tws[e.tws.length-1];r+=.1)a.tws.push(r/1.9438444924);for(var n=0;n<a.twa.length;n++)for(var o=0;o<a.tws.length;o++)a.stw[n][o]=this._calcPolarSpeed(e,a.tws[o],a.twa[n],0);return this.fineBuildTime=Date.now()-t,a},Performance.prototype._findIndexes=function(e,a){for(var t=0;t<e.length;t++)if(e[t]>a)return 0==t?[0,0]:[t-1,t];return[e.length-1,e.length-1]},Performance.prototype._interpolate=function(e,a,t,i,r){return e>=t?r:e<=a?i:t-a<1e-8?i+(e-a)/1e-8*(r-i):i+(e-a)/(t-a)*(r-i)},Performance.prototype._fixDirection=function(e){return e>2*Math.PI&&(e-=2*Math.PI),e<0&&(e+=2*Math.PI),e},Performance.prototype._calcPolarSpeed=function(e,a,t,i,r){a*=1.9438444924,t=180*t/Math.PI;var n=this._findIndexes(e.tws,a),o=this._findIndexes(e.twa,t),s=this._interpolate(t,e.twa[o[0]],e.twa[o[1]],e.stw[o[0]][n[0]],e.stw[o[1]][n[0]]),p=this._interpolate(t,e.twa[o[0]],e.twa[o[1]],e.stw[o[0]][n[1]],e.stw[o[1]][n[1]]);return this._interpolate(a,e.tws[n[0]],e.tws[n[1]],s,p)/1.9438444924},Performance.prototype.calcPerformance=function(e,a,t,i,r,n){var o=a;a<0&&(o=-a);var s=this._findIndexes(this.polarTable.tws,e),p=this._findIndexes(this.polarTable.twa,o),d=this.polarTable.stw[p[1]][s[1]];0!==d&&(polarSpeedRatio=t/d);var c=d*Math.cos(o),g=t*Math.cos(o),l=0,h=Math.PI;o<Math.PI/2?h=Math.PI/2:l=Math.PI/2;for(var v=0,u=0,m=0,w=l;w<=h;w+=Math.PI/180){p=this._findIndexes(this.polarTable.twa,w);var f=this.polarTable.stw[p[1]][s[1]],T=f*Math.cos(w);Math.abs(T)>Math.abs(v)&&(v=T,u=w,m=f)}a<0&&(u=-u),Math.abs(v)>1e-8&&(polarVmgRatio=g/v),n=n||0;var M=this._fixDirection(i+a),P=this._fixDirection(M+r);return otherTrackHeadingTrue=this._fixDirection(M+u),oppositeTrackTrue=a>0?otherTrackHeadingTrue+2*n:otherTrackHeadingTrue-2*n,oppositeTrackMagnetic=oppositeTrackTrue+r,oppositeHeadingMagnetic=this._fixDirection(otherTrackHeadingTrue+r),{vmg:g,polarVmg:c,polarSpeed:d,polarSpeedRatio:polarSpeedRatio,polarVmgRatio:polarVmgRatio,targetVmg:v,targetTwa:u,targetStw:m,windDirectionTrue:M,windDirectionMagnetic:P,oppositeHeadingTrue:otherTrackHeadingTrue,oppositeTrackTrue:oppositeTrackTrue,oppositeTrackMagnetic:oppositeTrackMagnetic,oppositeHeadingMagnetic:oppositeHeadingMagnetic}};
},{}]},{},["w3cE"], null)
//# sourceMappingURL=calcs.ecb52515.js.map