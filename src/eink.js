
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
    this.format = options.format || function(v) { return v };
    this.rangefn = options.range;
    this.x = options.x || 0;
    this.y = options.y || 0;
    this.out = 0;
    this.withStats = (options.withStats===undefined)?true:options.withStats;
    this.scale = options.scale || 1 ;
    this.precision = (options.precision===undefined)?10:Math.pow(10,options.precision);
    this.currentValue = 0.0;
    this.data = undefined;
    if ( this.withStats ) {
        this.outmean = 0;
        this.outstdev = 0;
        this.outmax = 1;
        this.outmin = 0;
    }
}
EInkTextBox.prototype.resolve = function(state) {
    var n = state;
    for (var i = 0; n && i < this.pathElements.length; i++) {
        n = n[this.pathElements[i]];
    }
    return n;
};


EInkTextBox.prototype.toDispay = function(v) {
    return Math.round(v*this.precision)/this.precision;
}

EInkTextBox.prototype.formatOutput = function(data) {
    if ( !this.withStats) {
        this.out = this.toDispay(data.currentValue*this.scale);
    } else {
        this.out = this.toDispay(data.currentValue*this.scale);
        this.outmax = this.toDispay(data.max*this.scale);
        this.outmin = this.toDispay(data.min*this.scale);
        this.outmean = this.toDispay(data.mean*this.scale);
        this.outstdev = this.toDispay(data.stdev*this.scale);            
    }
}




EInkTextBox.prototype.render = function(ctx, state, theme, dataStoreFactory) {
  var d = this.resolve(state);
  if (!d) {
    return;
  }
  var data = dataStoreFactory.getStore(d, this.path);
  data.updateValues(d.value, state);
  this.formatOutput(data);

  var sz = this.boxSize;
  var labels = this.labels;
  var t = this.y*1.3*sz, l = this.x*2.3*sz,  w = sz*2.2, h= sz*1.2;
  ctx.translate(l,t); 
  ctx.font =  sz+"px arial";
  ctx.textBaseline="bottom";
  ctx.textAlign="center";
  ctx.beginPath();
  ctx.fillStyle = theme.background;
  ctx.fillRect(0,0,w,h);
  ctx.strokeRect(0,0,w,h);


  ctx.fillStyle = theme.foreground;
  ctx.strokeStyle = theme.foreground;
  ctx.fillText(this.out, w*0.5,h);
  if ( labels ) {
    ctx.font =  (sz/4)+"px arial";
    ctx.textAlign="left";
    if ( labels.tl  && !this.withStats ) {
        ctx.fillText(labels.tl, w*0.05,sz/4);
    }
    if ( labels.bl ) {
        ctx.fillText(labels.bl, w*0.05,h);
    }
    ctx.textAlign="right";
    if ( labels.tr  && !this.withStats ) {
        ctx.fillText(labels.tr, w*0.95,sz/4);
    }
    if ( labels.br ) {
        ctx.fillText(labels.br, w*0.95,h);
    }
  }
  if ( this.withStats ) {
      ctx.textAlign="left";
      ctx.fillText(this.outmin, w*0.05,sz/4);
      ctx.textAlign="right";
      ctx.fillText(this.outmax, w*0.95,sz/4);
      ctx.font =  (sz/8)+"px arial";
      ctx.textAlign="center";
      ctx.fillText(this.outmean, w*0.5,sz/8);
      ctx.fillText(this.outstdev, w*0.5,sz/4);
  }
  ctx.translate(-l,-t);    
}








