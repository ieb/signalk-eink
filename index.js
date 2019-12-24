

/*
 * Copyright 2019 Ian Boston <ieb@tfd.co.uk>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


module.exports = function (app) {
  const logError = app.error || ((err) => {console.error(err)})
  let selfContext = 'vessels.' + app.selfId
  let store = {};

  let unsubscribes = [];

  // stores the sentence indexed by the NMEA0183 ID.
  const storeNMEA0183 = (data) => {
    var recordId = data.substring(3,6);
    store[recordId] = {
      lastUpdate: new Date().getTime(),
      sentence: data
    };
  };

  // sends sentences since the last update.
  const getNMEA0183 = (since, sincems) => {
    if (sincems) {
      sincems = +sincems;
    }
    if ( !sincems && typeof since === 'string') {
      // parse the date header of form Tue, 24 Dec 2019 11:32:09 GMT
      sincems = Date.parse(since);
    }
    if ( !sincems || isNaN(sincems)) {
      sincems = 0;
    }
    var sentences = [];
    // find the sentences with an update
    for (var k in store) {
      if (store[k].lastUpdate > sincems) {
        sentences.push(k);
      } 
    }
    // creates a bloc of data since the last update.
    sentences.sort((a,b) => {
      return store[a].lastUpdate - store[b].lastUpdate;
    });
    var output = [];
    for (var i = 0; i < sentences.length; i++) {
      output.push(store[sentences[i]].sentence);
    };
    return {
      lastUpdate : new Date(store[sentences[sentences.length-1]].lastUpdate).toUTCString(),
      output: output.join("\n")
    }
  }





  return {
    id: 'signalk-eink',
    name: 'NMEA0183 exporter for SignalK eink UI',
    description: 'Signal K server plugin exposes a end point for NMEA0183 to pull from, subscribes to nmea0183out messages',
    schema: {
      type: 'object',
      required: [],
      properties: {
        dummy: {
          type: 'string',
          title: 'Dummy Config not required',
          description:
            'With a blacklist, all numeric values except the ones in the list below will be stored in InfluxDB. With a whitelist, only the values in the list below will be stored.',
          default: 'Black',
          enum: ['White', 'Black']
        }
      }
    },
    start: function (options) {
      app.on('nmea0183out', storeNMEA0183);
      unsubscribes.push(() => {
        app.removeListener('nmea0183out', storeNMEA0183);
      });
    },
    stop: function () {
      unsubscribes.forEach(f => f())
      store = {};
    },
    signalKApiRoutes: function (router) {
      const nmeaHandler = function(req, res, next) {
        var nmea0183Data = getNMEA0183(req.headers['if-modified-since'], req.headers['x-since']);
        res.type("text/plain; charset=utf-8");
        res.append('Last-Modified', nmea0183Data.lastUpdate);
        res.send(nmea0183Data.output);
      }
      router.get('/einknmea', nmeaHandler);
      return router;
    }
  }
}

