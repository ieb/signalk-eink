
try {
    var debugEl = document.getElementById("debug");
    debug = () => {};
    if ( debugEl ) {
        debug = (msg) => {
            if ( typeof msg === 'string') {
                debugEl.value = debugEl.value+"\n"+msg;
            } else if ( JSON ) {
                debugEl.value = debugEl.value+"\n"+JSON.stringify(msg);
            } else {
                debugEl.value = debugEl.value+"\n"+msg;
            }
        };
    }
} catch (e) {
    document.getElementById("debug").value = document.getElementById("debug").value + "\nFailed Fixes\n"+e;
}
var isKindle = (Object.create === undefined);
debug("Kindle: "+isKindle);
function log(msg) {
    if (!isKindle) {
        //console.log(msg);
    }
}

// perform extension of a class
function extend(extension, base ) {
    for (var fn in base.prototype) {
        extension.prototype[fn] = base.prototype[fn];
    }
    extension.prototype.constructor = extension;
}

EInkDataStoreFactory = function(options) {
    this.dataStores = {};
}

EInkDataStoreFactory.prototype.getStore = function(d, path) {
    if ( !this.dataStores[path]) {
        if (d.meta.units === "rad") {
            this.dataStores[path] = new EInkCircularStats();
        } else {
            this.dataStores[path] = new EInkStats();
        }
    }
    return this.dataStores[path];
};


EInkDrawingContext = function(options) {
    this.dataStoreFactory = new EInkDataStoreFactory();
    this.canvas = options.canvas;
    this.themes = options.themes || {};
    this.displayList = options.displayList;
    this.displayPage = this.displayList[options.page || "default"];
    this.ctx = canvas.getContext("2d");
    this.setTheme(options.theme || "default");
    this.setOrientation(options.orientation, options.width || 700, options.height || 580);
}

EInkDrawingContext.prototype.setOrientation = function(portrait, width, height) {
    this.width = width || this.width;
    this.height = height || this.height;
    if (portrait) {
        this.canvas.setAttribute("width",this.width+"px");
        this.canvas.setAttribute("height",this.height+"px");
        this.ctx.translate(10,10);
    } else {
        this.canvas.setAttribute("width",this.height+"px");
        this.canvas.setAttribute("height",this.width+"px");
        this.ctx.rotate(-Math.PI/2);
        this.ctx.translate(-this.width+10,10);
    }    
}

EInkDrawingContext.prototype.setPage = function(page) {
    if ( this.displayList[page] ) {
        this.displayPage = this.displayList[page]; 
        this.canvas.setAttribute("style","background-color:"+this.theme.background);
        this.ctx.clearRect(-10,-10,this.width+10,this.height+10);
    }
}

EInkDrawingContext.prototype.setTheme = function(theme) {
    if ( this.themeName != theme ) {
        this.theme = this.themes[theme];
        this.themeName = theme;
        this.canvas.setAttribute("style","background-color:"+this.theme.background);
        this.ctx.clearRect(-10,-10,this.width+10,this.height+10);
    }
}

EInkDrawingContext.prototype.update = function(state) {

    log(state);
    for(var k in this.displayList) {
        for (var i = 0; i < this.displayList[k].length; i++) {
            this.displayList[k][i].update(state, this.dataStoreFactory);
        }
    }
    for (var i = 0; i < this.displayPage.length; i++) {
        this.displayPage[i].render(this.ctx, state, this.theme, this.dataStoreFactory);
    };
};


EInkUIController = function(options) {
    this.drawingContext = options.context;
    this.rotateControl = options.rotateControl;
    this.pageControl = options.pageControl;
    this.themeControl = options.themeControl;
    this.pages = options.pages;
    this.themes = options.themes;
    this.rotation = false;
    this.page = 0;
    this.theme = 0;
    var that = this;
    if ( this.rotateControl ) {
        this.rotateControl.addEventListener("click", function(event) {
            that.rotation = !that.rotation;
            that.drawingContext.setOrientation(that.rotation);
            debug("Rotate Click");
        });        
    }
    if ( this.pageControl ) {
        this.pageControl.addEventListener("click", function(event) {
            that.page++;
            if (that.page === that.pages.length) {
                that.page = 0;
            }
            that.drawingContext.setPage(that.pages[that.page]);
            debug("Page Click");
        });        
    }
    if ( this.themeControl ) {
        this.themeControl.addEventListener("click", function(event) {
            that.theme++;
            if (that.theme === that.themes.length) {
                that.theme = 0;
            }
            that.drawingContext.setTheme(that.themes[that.theme]);
            debug(that.themes[that.theme]);
        });        
    }

}



EInkUpdater = function(options) {
    this.url = options.url;
    if ( isKindle ) {
        this.url = this.url+"?k=1";
    }
    this.period = options.period;
    if ( isKindle ) {
        this.period = Math.max(this.period,2000);
    }
    this.context = options.context;
    if ( ! XMLHttpRequest.DONE ) {
        XMLHttpRequest.UNSENT = XMLHttpRequest.UNSENT || 0;
        XMLHttpRequest.OPENED = XMLHttpRequest.OPENED || 1;
        XMLHttpRequest.HEADERS_RECEIVED = XMLHttpRequest.HEADERS_RECEIVED || 2;
        XMLHttpRequest.LOADING = XMLHttpRequest.LOADING || 3;
        XMLHttpRequest.DONE = XMLHttpRequest.DONE || 4;
    }

    if ( this.period ) {
        var that = this;
        debug(this.period);
        setInterval(function() {
            try {
                that.update();
            } catch (e) {
                debug("error "+e);
            }
        }, this.period);        
    }
}
EInkUpdater.prototype.update = function() {
    var that = this;
    var httpRequest = new XMLHttpRequest();
    httpRequest.onreadystatechange = function() {
        if (httpRequest.readyState === XMLHttpRequest.DONE) {
          if (httpRequest.status === 200) {
            var state = JSON.parse(httpRequest.responseText);
            state._ts = new Date().getTime();
            that.context.update(state);
          }
        }
    };
    httpRequest.open('GET', this.url);
    httpRequest.send();
};

// stats classes -------------------------------------

EInkStats = function(options) {
    this.withStats = true;
    this._ts = 0;
    this.currentValue = 0.0;
    this.values = [];
    this.mean = 0;
    this.max = 0;
    this.min = 0;
    this.stdev = 0;
}

EInkStats.prototype.doUpdate = function(state) {
    if ( !state._ts ) {
        state._ts = new Date().getTime();
    }
    if ( this._ts === state.ts ) {
        return false;
    }
    this._ts = state._ts;
    return true;
}

EInkStats.prototype.updateValues = function(v, state) {
    if (!this.doUpdate(state)) {
        return;
    }
    this.currentValue = v;
    if ( !this.withStats ) {
        return;
    }
    this.values.push(v);
    while(this.values.length > 100) {
        this.values.shift();
    }

    var s = 0.0;
    var n = 0.0;
    for (var i = 0; i < this.values.length; i++) {
        w = (i+1)/2;
        s += this.values[i]*w;
        n += w;
    }
    this.mean = s/n;
    s = 0.0;
    n = 0.0;
    for (var i = 0; i < this.values.length; i++) {
        w = (i+1)/2;
        s += (this.values[i]-this.mean)*(this.values[i]-this.mean)*w;
        n += w;
    }
    this.stdev = Math.sqrt(s/n);

    this.min = this.mean;
    this.max = this.mean;
    for (var i = this.values.length - 1; i >= 0; i--) {
        this.min = Math.min(this.values[i],this.min);
    };
    for (var i = this.values.length - 1; i >= 0; i--) {
        this.max = Math.max(this.values[i],this.max);
    };
}

EInkCircularStats = function(options) {
    EInkStats.call(this, options);
    this.sinvalues = [];
    this.cosvalues = [];
}

extend(EInkCircularStats, EInkStats);

EInkCircularStats.prototype.updateValues = function(v, state) {
    if (!this.doUpdate(state)) {
        return;
    }    this.currentValue = v;
    if ( !this.withStats ) {
        return;
    }
    this.values.push(v);
    while(this.values.length > 100) {
        this.values.shift();
    }
    this.sinvalues.push(Math.sin(v));
    while(this.sinvalues.length > 100) {
        this.sinvalues.shift();
    }
    this.cosvalues.push(Math.cos(v));
    while(this.cosvalues.length > 100) {
        this.cosvalues.shift();
    }
    var s = 0.0, c= 0.0;
    var n = 0.0;
    for (var i = 0; i < this.values.length; i++) {
        w = (i+1)/2;
        s += this.sinvalues[i]*w;
        c += this.cosvalues[i]*w;
        n += w;
    }
    this.mean = Math.atan2(s/n,c/n);

    // probably not the right way of calculating a SD of a circular
    // value, however it does produces a viable result.
    // other methods are estimates.
    // Not 100% certain about the weighting here.
    s = 0.0;
    n = 0.0;
    for (var i = 0; i < this.values.length; i++) {
        w = (i+1)/2;
        a = this.values[i]-this.mean;
        // find the smallest sweep from the mean.
        if ( a > Math.PI ) {
            a = a - 2*Math.PI;
        } else if ( a < -Math.PI ) {
            a = a + 2*Math.PI;
        }
        s += a*a*w;
        n += w;
    }
    this.stdev = Math.sqrt(s/n);
    this.min = this.mean;
    this.max = this.mean;
    for (var i = this.values.length - 1; i >= 0; i--) {
        this.min = Math.min(this.values[i],this.min);
    };
    for (var i = this.values.length - 1; i >= 0; i--) {
        this.max = Math.max(this.values[i],this.max);
    };
}

// UI classes -------------------------------------


EInkTextBox = function(options) {
    this.options = options;
    this.path = options.path;
    this.pathElements = options.path.split(".");
    this.boxSize = options.boxSize || 100;
    this.labels = options.labels || {};
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.withStats = (options.withStats===undefined)?true:options.withStats;
    this.scale = options.scale || 1 ;
    this.precision = (options.precision ===undefined)?1:options.precision;
    this.out = 0;
    this.data = undefined;
    if ( this.withStats ) {
        this.outmean = 0;
        this.outstdev = 0;
        this.outmax = 1;
        this.outmin = 0;
    }
}
EInkTextBox.prototype.resolve = function(state, path) {
    var pathElements = this.pathElements;
    if ( path ) {
        pathElements = path.split(".");
    }
    var n = state;
    for (var i = 0; n && i < pathElements.length; i++) {
        n = n[pathElements[i]];
    }
    return n;
};


EInkTextBox.prototype.toDispay = function(v, precision) {
    return v.toFixed((precision === undefined)?this.precision:precision);
}

EInkTextBox.prototype.formatOutput = function(data, scale, precision) {
    scale = scale || this.scale;
    if ( !this.withStats) {
        this.out = this.toDispay(data.currentValue*scale, precision);
    } else {
        this.out = this.toDispay(data.currentValue*scale, precision);
        this.outmax = this.toDispay(data.max*scale, precision);
        this.outmin = this.toDispay(data.min*scale, precision);
        this.outmean = this.toDispay(data.mean*scale, precision);
        this.outstdev = this.toDispay(data.stdev*scale, precision);            
    }
    return this.out;
}


EInkTextBox.prototype.startDraw = function(ctx, theme) {
  var sz = this.boxSize;
  var t = this.y*1.3*sz, l = this.x*2.3*sz,  w = sz*2.2, h= sz*1.2;
  ctx.translate(l,t); 
  ctx.beginPath();
  ctx.fillStyle = theme.background;
  ctx.fillRect(0,0,w,h);
  ctx.strokeRect(0,0,w,h);
  ctx.fillStyle = theme.foreground;
  ctx.strokeStyle = theme.foreground;
  return {
    t, l, w, h, sz
  };
};

EInkTextBox.prototype.endDraw = function(ctx, dim) {
  ctx.translate(-dim.l,-dim.t);
}

EInkTextBox.prototype.update = function(state, dataStoreFactory) {
  var d = this.resolve(state);
  if (!d) {
    return;
  }
  var data = dataStoreFactory.getStore(d, this.path);
  data.updateValues(d.value, state);
}

EInkTextBox.prototype.render = function(ctx, state, theme, dataStoreFactory) {
  var d = this.resolve(state);
  if (!d) {
    return;
  }
  var data = dataStoreFactory.getStore(d, this.path);
  this.formatOutput(data);

  var labels = this.labels;
  var dim = this.startDraw(ctx, theme);

  ctx.font =  dim.sz+"px arial";
  ctx.textBaseline="bottom";
  ctx.textAlign="center";
  ctx.fillText(this.out, dim.w*0.5,dim.h);
  if ( labels ) {
    ctx.font =  (dim.sz/4)+"px arial";
    ctx.textAlign="left";
    if ( labels.tl  && !this.withStats ) {
        ctx.fillText(labels.tl, dim.w*0.05, sz/4);
    }
    if ( labels.bl ) {
        ctx.fillText(labels.bl, dim.w*0.05, dim.h);
    }
    ctx.textAlign="right";
    if ( labels.tr  && !this.withStats ) {
        ctx.fillText(labels.tr, dim.w*0.95, dim.sz/4);
    }
    if ( labels.br ) {
        ctx.fillText(labels.br, dim.w*0.95, dim.h);
    }
  }
  if ( this.withStats ) {
      ctx.textAlign="left";
      ctx.fillText(this.outmin, dim.w*0.05,dim.sz/4);
      ctx.textAlign="right";
      ctx.fillText(this.outmax, dim.w*0.95,dim.sz/4);
      ctx.font =  (dim.sz/8)+"px arial";
      ctx.textAlign="center";
      ctx.fillText(this.outmean, dim.w*0.5,dim.sz/8);
      ctx.fillText(this.outstdev, dim.w*0.5,dim.sz/4);
  }
  this.endDraw(ctx, dim);
}


EInkPilot = function(x, y, boxSize) {
    var options = {
        path: "none",
        x: x,
        y: y,
        withStats: false,
        scale: 180/Math.PI,
        precision: 0,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkPilot, EInkTextBox);

EInkPilot.prototype.update = function( state, dataStoreFactory) {
    // no action as there are no stats stored centrally.
    return;
}


EInkPilot.prototype.render = function(ctx, state, theme, dataStoreFactory) {
    var d = this.resolve(state, "steering.autopilot.state");
    if ( !d ) {
        return;
    }
    var autoState = d.value;
    var h = this.resolve(state, "steering.autopilot.target.headingMagnetic");
    var heading = "-";
    if ( h ) {
        heading = this.formatOutput({ currentValue: h.value});
    }

    var dim = this.startDraw(ctx,theme);
    ctx.font =  dim.sz+"px arial";
    ctx.textBaseline="bottom";
    ctx.textAlign="center";
    ctx.fillText(heading, dim.w*0.5,dim.h);

    ctx.font =  (dim.sz/4)+"px arial";
    ctx.textAlign="left";
    ctx.fillText(autoState, dim.w*0.05, dim.h);
    ctx.textAlign="right";
    ctx.fillText("deg", dim.w*0.95, dim.h);
    ctx.textAlign="center";
    ctx.fillText("pilot", dim.w*0.5, (dim.sz/4));
    this.endDraw(ctx, dim);
};



EInkLog = function(x,y,boxSize) {
    var options = {
        path: "none",
        x: x,
        y: y,
        withStats: false,
        scale: 1/1852,
        precision: 1,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkLog, EInkTextBox);


EInkLog.prototype.update = function( state, dataStoreFactory) {
    // no action as there are no stats stored centrally.
    return;
}

EInkLog.prototype.render = function(ctx, state, theme, dataStoreFactory) {
    // there are 2 paths
    // navigation.trip.log (m)   distance
    // navigation.log (m) distance

    var t = this.resolve(state, "navigation.trip.log");
    var l = this.resolve(state, "navigation.log");
    if ( ! (t || l) ) {
        return;
    }
    var trip = "0.0";
    if ( t ) {
        trip = this.formatOutput({currentValue: t.value},this.scale,2);
    }
    var log = "0.0";
    if ( l ) {
        log = this.formatOutput({currentValue: l.value});
    }
    // this will need some adjustment
    var dim = this.startDraw(ctx,theme);
    ctx.font =  (dim.sz/2.5)+"px arial";
    ctx.textAlign="center";
    ctx.textBaseline="top";
    ctx.fillText(trip, dim.w*0.5,dim.sz/4);
    ctx.textBaseline="alphabetic";
    ctx.fillText(log, dim.w*0.5,dim.h-dim.sz/4);

    ctx.textBaseline="bottom";
    ctx.font =  (dim.sz/4)+"px arial";
    ctx.textAlign="left";
    ctx.fillText("trip", dim.w*0.05, dim.sz/4);
    ctx.fillText("log", dim.w*0.05, dim.h);
    ctx.textAlign="right";
    ctx.fillText("Nm", dim.w*0.95, dim.h);


    this.endDraw(ctx, dim);
}



EInkFix = function(x,y,boxSize) {
    var options = {
        path: "none",
        x: x,
        y: y,
        withStats: false,
        scale: 1/1852,
        precision: 1,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkFix, EInkTextBox);
EInkFix.prototype.update = function( state, dataStoreFactory) {
    // no action as there are no stats stored centrally.
    return;
}
EInkFix.prototype.render = function(ctx, state, theme, dataStoreFactory) {
   /*EInkFix
   navigation.gnss.methodQuality (text) fix
   navigation.gnss.horizontalDilution (float) fix
   navigation.gnss.type (text) fix
   navigation.gnss.satellites (int) fix
   navigation.gnss.integrity (text) fix
    */

    if ( !(state && state.navigation && state.navigation.gnss) ) {
        return;
    }
    var gnss = state.navigation.gnss;
    var methodQuality = (gnss.methodQuality)?gnss.methodQuality.value:"-";
    var horizontalDilution = (gnss.horizontalDilution)?gnss.horizontalDilution.value:"-";
    var type = (gnss.type)?gnss.type.value:"-";
    var satellites = (gnss.satellites)?gnss.satellites.value:"-";
    var integrity = (gnss.integrity)?gnss.integrity.value:"-";

    // this will need some adjustment
    var dim = this.startDraw(ctx,theme);
    ctx.font =  dim.sz/6+"px arial";
    ctx.textBaseline="bottom";
    ctx.textAlign="left";
    ctx.fillText(methodQuality, dim.w*0.05, dim.sz/4);
    ctx.fillText("sat:"+satellites, dim.w*0.05,2*dim.sz/4);
    ctx.fillText("hdop:"+horizontalDilution, dim.w*0.05,3*dim.sz/4);
    ctx.font =  dim.sz/6+"px arial";
    ctx.fillText(type, dim.w*0.05,dim.sz);


    this.endDraw(ctx, dim);
}

EInkPossition = function(x,y,boxSize) {
    var options = {
        path: "none",
        x: x,
        y: y,
        withStats: false,
        scale: 1,
        precision: 1,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkPossition, EInkTextBox);
EInkPossition.prototype.update = function( state, dataStoreFactory) {
    // no action as there are no stats stored centrally.
    return;
}
EInkPossition.prototype.toLatitude = function(lat) {
    var NS = "N"
    if ( lat < 0 ) {
        lat = -lat;
        NS = "S";
    } 
    var d = Math.floor(lat);
    var m = (60*(lat - d)).toFixed(3);
    return ("00"+d).slice(-2)+"\u00B0"+("00"+m).slice(-6)+"\u2032"+NS;
}
EInkPossition.prototype.toLongitude = function(lon) {
    var EW = "E"
    if ( lon < 0 ) {
        lon = -lon;
        EW = "W";
    } 
    var d =  Math.floor(lon);
    var m = (60*(lon - d)).toFixed(3);
    return ("000"+d).slice(-3)+"\u00B0"+("00"+m).slice(-6)+"\u2032"+EW;
};


EInkPossition.prototype.render = function(ctx, state, theme, dataStoreFactory) {
   /*
   EInkPossition
   navigation.position (lat, lon, deg) position
   navigation.datetime (date)
    */

    var lat = "--\u00B0--.---\u2032N", lon = "---\u00B0--.---\u2032W", ts = "-";

    if ( state && state.navigation && state.navigation.position ) {
        lat = this.toLatitude(state.navigation.position.value.latitude);
        lon = this.toLongitude(state.navigation.position.value.longitude);
    }
    if (state && state.navigation && state.navigation.datetime) {
        ts = new Date(Date.parse(state.navigation.datetime.value));
        ts = ts.toUTCString();
    }
    // this will need some adjustment
    var dim = this.startDraw(ctx,theme);
    ctx.font =  dim.sz/3+"px arial";
    ctx.textBaseline="bottom";
    ctx.textAlign="right";
    ctx.fillText(lat, dim.w*0.95,dim.h*0.2+dim.sz/3);
    ctx.fillText(lon, dim.w*0.95,dim.h*0.2+2*dim.sz/3);
    ctx.font =  (dim.sz/7)+"px arial";
    ctx.fillText(ts, dim.w*0.95, dim.h*0.95);


    this.endDraw(ctx, dim);
}

EInkCurrent = function(options) {
    options.withStats = false;
    EInkTextBox.call(this, options);
}
extend(EInkCurrent, EInkTextBox);
EInkCurrent.prototype.update = function( state, dataStoreFactory) {
    // no action as there are no stats stored centrally.
    return;
}
EInkCurrent.prototype.render = function(ctx, state, theme, dataStoreFactory) {
   /*
    EInkCurrent
    environment.current (drift (m/s), setTrue (rad))
    */

    if ( !(state && state.environment && state.environment.current) ) {
        return;
    }

    var drift = this.formatOutput({ currentValue: state.environment.current.value.drift }, 1.943844,1);
    var set = this.formatOutput({ currentValue: state.environment.current.value.set }, Math.PI/180,1);



    // this will need some adjustment
    var dim = this.startDraw(ctx,theme);
    ctx.font =  dim.sz/2+"px arial";
    ctx.textBaseline="bottom";
    ctx.textAlign="center";
    ctx.fillText(drift, dim.w*0.5,dim.h*0.5);
    ctx.fillText(set, dim.w*0.5,dim.h);

    ctx.font =  (dim.sz/4)+"px arial";
    ctx.textAlign="left";
    ctx.fillText("current", dim.w*0.05, dim.h);
    ctx.textAlign="right";
    ctx.fillText("deg, kn", dim.w*0.95, dim.h);

    this.endDraw(ctx, dim);
}


EInkAttitude = function(options) {
    options.withStats = false;
    options.scale = Math.PI/180;
    options.precision = 1;
    EInkTextBox.call(this, options);
}
extend(EInkAttitude, EInkTextBox);
EInkAttitude.prototype.update = function( state, dataStoreFactory) {
    // no action as there are no stats stored centrally.
    return;
}
EInkAttitude.prototype.render = function(ctx, state, theme, dataStoreFactory) {
   /*
    EInkAttitude
    navigation.attitude (roll, pitch, yaw rad)
    */

    if ( !(state && state.navigation && state.navigation.attitude) ) {
        return;
    }
    var attitude = state.navigation.attitude;
    var roll = this.formatOutput({ currentValue: attitude.value.roll });
    var pitch = this.formatOutput({ currentValue: attitude.value.pitch });
    var yaw = this.formatOutput({ currentValue: attitude.value.yaw });



    // this will need some adjustment
    var dim = this.startDraw(ctx,theme);
    ctx.font =  dim.sz/2+"px arial";
    ctx.textBaseline="bottom";
    ctx.textAlign="center";
    ctx.fillText(roll, dim.w*0.5,dim.h*0.5);
    ctx.fillText(pitch, dim.w*0.5,dim.h);

    ctx.font =  (dim.sz/4)+"px arial";
    ctx.textAlign="left";
    ctx.fillText("roll & pitch", dim.w*0.05, dim.h);
    ctx.textAlign="right";
    ctx.fillText("deg", dim.w*0.95, dim.h);

    this.endDraw(ctx, dim);
}



EInkRelativeAngle = function(path, label, x, y, boxSize, precision ) {
    var options = {
        path: path,
        labels: {
            bl: label,
            br: "deg"
        },
        x: x,
        y: y,
        withStats: true,
        scale: 180/Math.PI,
        precision: (precision==undefined)?0:precision,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkRelativeAngle, EInkTextBox);


EInkSpeed = function(path, label, x, y, boxSize, precision) {
    var options = {
        path: path,
        labels: {
            bl: label,
            br: "kn"
        },
        x: x,
        y: y,
        withStats: true,
        scale: 1.943844,
        precision: (precision==undefined)?0:precision,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkSpeed, EInkTextBox);

EInkDistance = function(path, label, x, y, boxSize, precision) {
    var options = {
        path: path,
        labels: {
            bl: label,
            br: "m"
        },
        x: x,
        y: y,
        withStats: true,
        scale: 1,
        precision: (precision==undefined)?1:precision,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkDistance, EInkTextBox);


EInkBearing = function(path, label, x, y, boxSize, precision) {
    var options = {
        path: path,
        labels: {
            bl: label,
            br: "deg"
        },
        x: x,
        y: y,
        withStats: true,
        scale: 180/Math.PI,
        precision: (precision==undefined)?0:precision,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkBearing, EInkTextBox);

EInkTemperature = function(path, label, x, y, boxSize, precision) {
    var options = {
        path: path,
        labels: {
            bl: label,
            br: "C"
        },
        x: x,
        y: y,
        withStats: true,
        scale: 1,
        precision: (precision==undefined)?0:precision,
        boxSize: boxSize || 100
    }
    EInkTextBox.call(this, options);
}
extend(EInkTemperature, EInkTextBox);


EInkTemperature.prototype.formatOutput = function(data) {
    if ( !this.withStats) {
        this.out = this.toDispay(data.currentValue-273.15, precision);
    } else {
        this.out = this.toDispay(data.currentValue-273.15, precision);
        this.outmax = this.toDispay(data.max-273.15, precision);
        this.outmin = this.toDispay(data.min-273.15, precision);
        this.outmean = this.toDispay(data.mean-273.15, precision);
        this.outstdev = this.toDispay(data.stdev-273.15, precision);            
    }
}

