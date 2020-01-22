/*! es6-google-maps 0.8.10 14-03-2018 */

(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.GoogleMaps = f()}})(function(){var define,module,exports;return (function(){function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s}return e})()({1:[function(require,module,exports){
    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.
    
    function EventEmitter() {
      this._events = this._events || {};
      this._maxListeners = this._maxListeners || undefined;
    }
    module.exports = EventEmitter;
    
    // Backwards-compat with node 0.10.x
    EventEmitter.EventEmitter = EventEmitter;
    
    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;
    
    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;
    
    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function(n) {
      if (!isNumber(n) || n < 0 || isNaN(n))
        throw TypeError('n must be a positive number');
      this._maxListeners = n;
      return this;
    };
    
    EventEmitter.prototype.emit = function(type) {
      var er, handler, len, args, i, listeners;
    
      if (!this._events)
        this._events = {};
    
      // If there is no 'error' event listener then throw.
      if (type === 'error') {
        if (!this._events.error ||
            (isObject(this._events.error) && !this._events.error.length)) {
          er = arguments[1];
          if (er instanceof Error) {
            throw er; // Unhandled 'error' event
          } else {
            // At least give some kind of context to the user
            var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
            err.context = er;
            throw err;
          }
        }
      }
    
      handler = this._events[type];
    
      if (isUndefined(handler))
        return false;
    
      if (isFunction(handler)) {
        switch (arguments.length) {
          // fast cases
          case 1:
            handler.call(this);
            break;
          case 2:
            handler.call(this, arguments[1]);
            break;
          case 3:
            handler.call(this, arguments[1], arguments[2]);
            break;
          // slower
          default:
            args = Array.prototype.slice.call(arguments, 1);
            handler.apply(this, args);
        }
      } else if (isObject(handler)) {
        args = Array.prototype.slice.call(arguments, 1);
        listeners = handler.slice();
        len = listeners.length;
        for (i = 0; i < len; i++)
          listeners[i].apply(this, args);
      }
    
      return true;
    };
    
    EventEmitter.prototype.addListener = function(type, listener) {
      var m;
    
      if (!isFunction(listener))
        throw TypeError('listener must be a function');
    
      if (!this._events)
        this._events = {};
    
      // To avoid recursion in the case that type === "newListener"! Before
      // adding it to the listeners, first emit "newListener".
      if (this._events.newListener)
        this.emit('newListener', type,
                  isFunction(listener.listener) ?
                  listener.listener : listener);
    
      if (!this._events[type])
        // Optimize the case of one listener. Don't need the extra array object.
        this._events[type] = listener;
      else if (isObject(this._events[type]))
        // If we've already got an array, just append.
        this._events[type].push(listener);
      else
        // Adding the second element, need to change to array.
        this._events[type] = [this._events[type], listener];
    
      // Check for listener leak
      if (isObject(this._events[type]) && !this._events[type].warned) {
        if (!isUndefined(this._maxListeners)) {
          m = this._maxListeners;
        } else {
          m = EventEmitter.defaultMaxListeners;
        }
    
        if (m && m > 0 && this._events[type].length > m) {
          this._events[type].warned = true;
          console.error('(node) warning: possible EventEmitter memory ' +
                        'leak detected. %d listeners added. ' +
                        'Use emitter.setMaxListeners() to increase limit.',
                        this._events[type].length);
          if (typeof console.trace === 'function') {
            // not supported in IE 10
            console.trace();
          }
        }
      }
    
      return this;
    };
    
    EventEmitter.prototype.on = EventEmitter.prototype.addListener;
    
    EventEmitter.prototype.once = function(type, listener) {
      if (!isFunction(listener))
        throw TypeError('listener must be a function');
    
      var fired = false;
    
      function g() {
        this.removeListener(type, g);
    
        if (!fired) {
          fired = true;
          listener.apply(this, arguments);
        }
      }
    
      g.listener = listener;
      this.on(type, g);
    
      return this;
    };
    
    // emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener = function(type, listener) {
      var list, position, length, i;
    
      if (!isFunction(listener))
        throw TypeError('listener must be a function');
    
      if (!this._events || !this._events[type])
        return this;
    
      list = this._events[type];
      length = list.length;
      position = -1;
    
      if (list === listener ||
          (isFunction(list.listener) && list.listener === listener)) {
        delete this._events[type];
        if (this._events.removeListener)
          this.emit('removeListener', type, listener);
    
      } else if (isObject(list)) {
        for (i = length; i-- > 0;) {
          if (list[i] === listener ||
              (list[i].listener && list[i].listener === listener)) {
            position = i;
            break;
          }
        }
    
        if (position < 0)
          return this;
    
        if (list.length === 1) {
          list.length = 0;
          delete this._events[type];
        } else {
          list.splice(position, 1);
        }
    
        if (this._events.removeListener)
          this.emit('removeListener', type, listener);
      }
    
      return this;
    };
    
    EventEmitter.prototype.removeAllListeners = function(type) {
      var key, listeners;
    
      if (!this._events)
        return this;
    
      // not listening for removeListener, no need to emit
      if (!this._events.removeListener) {
        if (arguments.length === 0)
          this._events = {};
        else if (this._events[type])
          delete this._events[type];
        return this;
      }
    
      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        for (key in this._events) {
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = {};
        return this;
      }
    
      listeners = this._events[type];
    
      if (isFunction(listeners)) {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        while (listeners.length)
          this.removeListener(type, listeners[listeners.length - 1]);
      }
      delete this._events[type];
    
      return this;
    };
    
    EventEmitter.prototype.listeners = function(type) {
      var ret;
      if (!this._events || !this._events[type])
        ret = [];
      else if (isFunction(this._events[type]))
        ret = [this._events[type]];
      else
        ret = this._events[type].slice();
      return ret;
    };
    
    EventEmitter.prototype.listenerCount = function(type) {
      if (this._events) {
        var evlistener = this._events[type];
    
        if (isFunction(evlistener))
          return 1;
        else if (evlistener)
          return evlistener.length;
      }
      return 0;
    };
    
    EventEmitter.listenerCount = function(emitter, type) {
      return emitter.listenerCount(type);
    };
    
    function isFunction(arg) {
      return typeof arg === 'function';
    }
    
    function isNumber(arg) {
      return typeof arg === 'number';
    }
    
    function isObject(arg) {
      return typeof arg === 'object' && arg !== null;
    }
    
    function isUndefined(arg) {
      return arg === void 0;
    }
    
    },{}],2:[function(require,module,exports){
    (function (global){
    /**
     * Npm version of markerClusterer works great with browserify and google maps for commonjs
     * https://www.npmjs.com/package/googlemaps
     * Difference from the original - adds a commonjs format and replaces window with global and some unit test
     * The original functionality it's not modified for docs and original source check
     * https://github.com/googlemaps/js-marker-clusterer
     */
    
    /**
     * @name MarkerClusterer for Google Maps v3
     * @version version 1.0
     * @author Luke Mahe
     * @fileoverview
     * The library creates and manages per-zoom-level clusters for large amounts of
     * markers.
     * <br/>
     * This is a v3 implementation of the
     * <a href="http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer/"
     * >v2 MarkerClusterer</a>.
     */
    
    /**
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *     http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    
    
    /**
     * A Marker Clusterer that clusters markers.
     *
     * @param {google.maps.Map} map The Google map to attach to.
     * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
     *   the cluster.
     * @param {Object=} opt_options support the following options:
     *     'gridSize': (number) The grid size of a cluster in pixels.
     *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
     *                cluster.
     *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
     *                    cluster is to zoom into it.
     *     'averageCenter': (boolean) Wether the center of each cluster should be
     *                      the average of all markers in the cluster.
     *     'minimumClusterSize': (number) The minimum number of markers to be in a
     *                           cluster before the markers are hidden and a count
     *                           is shown.
     *     'styles': (object) An object that has style properties:
     *       'url': (string) The image url.
     *       'height': (number) The image height.
     *       'width': (number) The image width.
     *       'anchor': (Array) The anchor position of the label text.
     *       'textColor': (string) The text color.
     *       'textSize': (number) The text size.
     *       'backgroundPosition': (string) The position of the backgound x, y.
     * @constructor
     * @extends google.maps.OverlayView
     */
    function MarkerClusterer(map, opt_markers, opt_options) {
      // MarkerClusterer implements google.maps.OverlayView interface. We use the
      // extend function to extend MarkerClusterer with google.maps.OverlayView
      // because it might not always be available when the code is defined so we
      // look for it at the last possible moment. If it doesn't exist now then
      // there is no point going ahead :)
      this.extend(MarkerClusterer, google.maps.OverlayView);
      this.map_ = map;
    
      /**
       * @type {Array.<google.maps.Marker>}
       * @private
       */
      this.markers_ = [];
    
      /**
       *  @type {Array.<Cluster>}
       */
      this.clusters_ = [];
    
      this.sizes = [53, 56, 66, 78, 90];
    
      /**
       * @private
       */
      this.styles_ = [];
    
      /**
       * @type {boolean}
       * @private
       */
      this.ready_ = false;
    
      var options = opt_options || {};
    
      /**
       * @type {number}
       * @private
       */
      this.gridSize_ = options['gridSize'] || 60;
    
      /**
       * @private
       */
      this.minClusterSize_ = options['minimumClusterSize'] || 2;
    
    
      /**
       * @type {?number}
       * @private
       */
      this.maxZoom_ = options['maxZoom'] || null;
    
      this.styles_ = options['styles'] || [];
    
      /**
       * @type {string}
       * @private
       */
      this.imagePath_ = options['imagePath'] ||
          this.MARKER_CLUSTER_IMAGE_PATH_;
    
      /**
       * @type {string}
       * @private
       */
      this.imageExtension_ = options['imageExtension'] ||
          this.MARKER_CLUSTER_IMAGE_EXTENSION_;
    
      /**
       * @type {boolean}
       * @private
       */
      this.zoomOnClick_ = true;
    
      if (options['zoomOnClick'] != undefined) {
        this.zoomOnClick_ = options['zoomOnClick'];
      }
    
      /**
       * @type {boolean}
       * @private
       */
      this.averageCenter_ = false;
    
      if (options['averageCenter'] != undefined) {
        this.averageCenter_ = options['averageCenter'];
      }
    
      this.setupStyles_();
    
      this.setMap(map);
    
      /**
       * @type {number}
       * @private
       */
      this.prevZoom_ = this.map_.getZoom();
    
      // Add the map event listeners
      var that = this;
      google.maps.event.addListener(this.map_, 'zoom_changed', function() {
        var zoom = that.map_.getZoom();
    
        if (that.prevZoom_ != zoom) {
          that.prevZoom_ = zoom;
          that.resetViewport();
        }
      });
    
      google.maps.event.addListener(this.map_, 'idle', function() {
        that.redraw();
      });
    
      // Finally, add the markers
      if (opt_markers && opt_markers.length) {
        this.addMarkers(opt_markers, false);
      }
    }
    
    
    /**
     * The marker cluster image path.
     *
     * @type {string}
     * @private
     */
    MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ =
        'http://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/' +
        'images/m';
    
    
    /**
     * The marker cluster image path.
     *
     * @type {string}
     * @private
     */
    MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';
    
    
    /**
     * Extends a objects prototype by anothers.
     *
     * @param {Object} obj1 The object to be extended.
     * @param {Object} obj2 The object to extend with.
     * @return {Object} The new extended object.
     * @ignore
     */
    MarkerClusterer.prototype.extend = function(obj1, obj2) {
      return (function(object) {
        for (var property in object.prototype) {
          this.prototype[property] = object.prototype[property];
        }
        return this;
      }).apply(obj1, [obj2]);
    };
    
    
    /**
     * Implementaion of the interface method.
     * @ignore
     */
    MarkerClusterer.prototype.onAdd = function() {
      this.setReady_(true);
    };
    
    /**
     * Implementaion of the interface method.
     * @ignore
     */
    MarkerClusterer.prototype.draw = function() {};
    
    /**
     * Sets up the styles object.
     *
     * @private
     */
    MarkerClusterer.prototype.setupStyles_ = function() {
      if (this.styles_.length) {
        return;
      }
    
      for (var i = 0, size; size = this.sizes[i]; i++) {
        this.styles_.push({
          url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
          height: size,
          width: size
        });
      }
    };
    
    /**
     *  Fit the map to the bounds of the markers in the clusterer.
     */
    MarkerClusterer.prototype.fitMapToMarkers = function() {
      var markers = this.getMarkers();
      var bounds = new google.maps.LatLngBounds();
      for (var i = 0, marker; marker = markers[i]; i++) {
        bounds.extend(marker.getPosition());
      }
    
      this.map_.fitBounds(bounds);
    };
    
    
    /**
     *  Sets the styles.
     *
     *  @param {Object} styles The style to set.
     */
    MarkerClusterer.prototype.setStyles = function(styles) {
      this.styles_ = styles;
    };
    
    
    /**
     *  Gets the styles.
     *
     *  @return {Object} The styles object.
     */
    MarkerClusterer.prototype.getStyles = function() {
      return this.styles_;
    };
    
    
    /**
     * Whether zoom on click is set.
     *
     * @return {boolean} True if zoomOnClick_ is set.
     */
    MarkerClusterer.prototype.isZoomOnClick = function() {
      return this.zoomOnClick_;
    };
    
    /**
     * Whether average center is set.
     *
     * @return {boolean} True if averageCenter_ is set.
     */
    MarkerClusterer.prototype.isAverageCenter = function() {
      return this.averageCenter_;
    };
    
    
    /**
     *  Returns the array of markers in the clusterer.
     *
     *  @return {Array.<google.maps.Marker>} The markers.
     */
    MarkerClusterer.prototype.getMarkers = function() {
      return this.markers_;
    };
    
    
    /**
     *  Returns the number of markers in the clusterer
     *
     *  @return {Number} The number of markers.
     */
    MarkerClusterer.prototype.getTotalMarkers = function() {
      return this.markers_.length;
    };
    
    
    /**
     *  Sets the max zoom for the clusterer.
     *
     *  @param {number} maxZoom The max zoom level.
     */
    MarkerClusterer.prototype.setMaxZoom = function(maxZoom) {
      this.maxZoom_ = maxZoom;
    };
    
    
    /**
     *  Gets the max zoom for the clusterer.
     *
     *  @return {number} The max zoom level.
     */
    MarkerClusterer.prototype.getMaxZoom = function() {
      return this.maxZoom_;
    };
    
    
    /**
     *  The function for calculating the cluster icon image.
     *
     *  @param {Array.<google.maps.Marker>} markers The markers in the clusterer.
     *  @param {number} numStyles The number of styles available.
     *  @return {Object} A object properties: 'text' (string) and 'index' (number).
     *  @private
     */
    MarkerClusterer.prototype.calculator_ = function(markers, numStyles) {
      var index = 0;
      var count = markers.length;
      var dv = count;
      while (dv !== 0) {
        dv = parseInt(dv / 10, 10);
        index++;
      }
    
      index = Math.min(index, numStyles);
      return {
        text: count,
        index: index
      };
    };
    
    
    /**
     * Set the calculator function.
     *
     * @param {function(Array, number)} calculator The function to set as the
     *     calculator. The function should return a object properties:
     *     'text' (string) and 'index' (number).
     *
     */
    MarkerClusterer.prototype.setCalculator = function(calculator) {
      this.calculator_ = calculator;
    };
    
    
    /**
     * Get the calculator function.
     *
     * @return {function(Array, number)} the calculator function.
     */
    MarkerClusterer.prototype.getCalculator = function() {
      return this.calculator_;
    };
    
    
    /**
     * Add an array of markers to the clusterer.
     *
     * @param {Array.<google.maps.Marker>} markers The markers to add.
     * @param {boolean=} opt_nodraw Whether to redraw the clusters.
     */
    MarkerClusterer.prototype.addMarkers = function(markers, opt_nodraw) {
      for (var i = 0, marker; marker = markers[i]; i++) {
        this.pushMarkerTo_(marker);
      }
      if (!opt_nodraw) {
        this.redraw();
      }
    };
    
    
    /**
     * Pushes a marker to the clusterer.
     *
     * @param {google.maps.Marker} marker The marker to add.
     * @private
     */
    MarkerClusterer.prototype.pushMarkerTo_ = function(marker) {
      marker.isAdded = false;
      if (marker['draggable']) {
        // If the marker is draggable add a listener so we update the clusters on
        // the drag end.
        var that = this;
        google.maps.event.addListener(marker, 'dragend', function() {
          marker.isAdded = false;
          that.repaint();
        });
      }
      this.markers_.push(marker);
    };
    
    
    /**
     * Adds a marker to the clusterer and redraws if needed.
     *
     * @param {google.maps.Marker} marker The marker to add.
     * @param {boolean=} opt_nodraw Whether to redraw the clusters.
     */
    MarkerClusterer.prototype.addMarker = function(marker, opt_nodraw) {
      this.pushMarkerTo_(marker);
      if (!opt_nodraw) {
        this.redraw();
      }
    };
    
    
    /**
     * Removes a marker and returns true if removed, false if not
     *
     * @param {google.maps.Marker} marker The marker to remove
     * @return {boolean} Whether the marker was removed or not
     * @private
     */
    MarkerClusterer.prototype.removeMarker_ = function(marker) {
      var index = -1;
      if (this.markers_.indexOf) {
        index = this.markers_.indexOf(marker);
      } else {
        for (var i = 0, m; m = this.markers_[i]; i++) {
          if (m == marker) {
            index = i;
            break;
          }
        }
      }
    
      if (index == -1) {
        // Marker is not in our list of markers.
        return false;
      }
    
      marker.setMap(null);
    
      this.markers_.splice(index, 1);
    
      return true;
    };
    
    
    /**
     * Remove a marker from the cluster.
     *
     * @param {google.maps.Marker} marker The marker to remove.
     * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
     * @return {boolean} True if the marker was removed.
     */
    MarkerClusterer.prototype.removeMarker = function(marker, opt_nodraw) {
      var removed = this.removeMarker_(marker);
    
      if (!opt_nodraw && removed) {
        this.resetViewport();
        this.redraw();
        return true;
      } else {
       return false;
      }
    };
    
    
    /**
     * Removes an array of markers from the cluster.
     *
     * @param {Array.<google.maps.Marker>} markers The markers to remove.
     * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
     */
    MarkerClusterer.prototype.removeMarkers = function(markers, opt_nodraw) {
      var removed = false;
    
      for (var i = 0, marker; marker = markers[i]; i++) {
        var r = this.removeMarker_(marker);
        removed = removed || r;
      }
    
      if (!opt_nodraw && removed) {
        this.resetViewport();
        this.redraw();
        return true;
      }
    };
    
    
    /**
     * Sets the clusterer's ready state.
     *
     * @param {boolean} ready The state.
     * @private
     */
    MarkerClusterer.prototype.setReady_ = function(ready) {
      if (!this.ready_) {
        this.ready_ = ready;
        this.createClusters_();
      }
    };
    
    
    /**
     * Returns the number of clusters in the clusterer.
     *
     * @return {number} The number of clusters.
     */
    MarkerClusterer.prototype.getTotalClusters = function() {
      return this.clusters_.length;
    };
    
    
    /**
     * Returns the google map that the clusterer is associated with.
     *
     * @return {google.maps.Map} The map.
     */
    MarkerClusterer.prototype.getMap = function() {
      return this.map_;
    };
    
    
    /**
     * Sets the google map that the clusterer is associated with.
     *
     * @param {google.maps.Map} map The map.
     */
    MarkerClusterer.prototype.setMap = function(map) {
      this.map_ = map;
    };
    
    
    /**
     * Returns the size of the grid.
     *
     * @return {number} The grid size.
     */
    MarkerClusterer.prototype.getGridSize = function() {
      return this.gridSize_;
    };
    
    
    /**
     * Sets the size of the grid.
     *
     * @param {number} size The grid size.
     */
    MarkerClusterer.prototype.setGridSize = function(size) {
      this.gridSize_ = size;
    };
    
    
    /**
     * Returns the min cluster size.
     *
     * @return {number} The grid size.
     */
    MarkerClusterer.prototype.getMinClusterSize = function() {
      return this.minClusterSize_;
    };
    
    /**
     * Sets the min cluster size.
     *
     * @param {number} size The grid size.
     */
    MarkerClusterer.prototype.setMinClusterSize = function(size) {
      this.minClusterSize_ = size;
    };
    
    
    /**
     * Extends a bounds object by the grid size.
     *
     * @param {google.maps.LatLngBounds} bounds The bounds to extend.
     * @return {google.maps.LatLngBounds} The extended bounds.
     */
    MarkerClusterer.prototype.getExtendedBounds = function(bounds) {
      var projection = this.getProjection();
    
      // Turn the bounds into latlng.
      var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
          bounds.getNorthEast().lng());
      var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
          bounds.getSouthWest().lng());
    
      // Convert the points to pixels and the extend out by the grid size.
      var trPix = projection.fromLatLngToDivPixel(tr);
      trPix.x += this.gridSize_;
      trPix.y -= this.gridSize_;
    
      var blPix = projection.fromLatLngToDivPixel(bl);
      blPix.x -= this.gridSize_;
      blPix.y += this.gridSize_;
    
      // Convert the pixel points back to LatLng
      var ne = projection.fromDivPixelToLatLng(trPix);
      var sw = projection.fromDivPixelToLatLng(blPix);
    
      // Extend the bounds to contain the new bounds.
      bounds.extend(ne);
      bounds.extend(sw);
    
      return bounds;
    };
    
    
    /**
     * Determins if a marker is contained in a bounds.
     *
     * @param {google.maps.Marker} marker The marker to check.
     * @param {google.maps.LatLngBounds} bounds The bounds to check against.
     * @return {boolean} True if the marker is in the bounds.
     * @private
     */
    MarkerClusterer.prototype.isMarkerInBounds_ = function(marker, bounds) {
      return bounds.contains(marker.getPosition());
    };
    
    
    /**
     * Clears all clusters and markers from the clusterer.
     */
    MarkerClusterer.prototype.clearMarkers = function() {
      this.resetViewport(true);
    
      // Set the markers a empty array.
      this.markers_ = [];
    };
    
    
    /**
     * Clears all existing clusters and recreates them.
     * @param {boolean} opt_hide To also hide the marker.
     */
    MarkerClusterer.prototype.resetViewport = function(opt_hide) {
      // Remove all the clusters
      for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
        cluster.remove();
      }
    
      // Reset the markers to not be added and to be invisible.
      for (var i = 0, marker; marker = this.markers_[i]; i++) {
        marker.isAdded = false;
        if (opt_hide) {
          marker.setMap(null);
        }
      }
    
      this.clusters_ = [];
    };
    
    /**
     *
     */
    MarkerClusterer.prototype.repaint = function() {
      var oldClusters = this.clusters_.slice();
      this.clusters_.length = 0;
      this.resetViewport();
      this.redraw();
    
      // Remove the old clusters.
      // Do it in a timeout so the other clusters have been drawn first.
      window.setTimeout(function() {
        for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
          cluster.remove();
        }
      }, 0);
    };
    
    
    /**
     * Redraws the clusters.
     */
    MarkerClusterer.prototype.redraw = function() {
      this.createClusters_();
    };
    
    
    /**
     * Calculates the distance between two latlng locations in km.
     * @see http://www.movable-type.co.uk/scripts/latlong.html
     *
     * @param {google.maps.LatLng} p1 The first lat lng point.
     * @param {google.maps.LatLng} p2 The second lat lng point.
     * @return {number} The distance between the two points in km.
     * @private
    */
    MarkerClusterer.prototype.distanceBetweenPoints_ = function(p1, p2) {
      if (!p1 || !p2) {
        return 0;
      }
    
      var R = 6371; // Radius of the Earth in km
      var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
      var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c;
      return d;
    };
    
    
    /**
     * Add a marker to a cluster, or creates a new cluster.
     *
     * @param {google.maps.Marker} marker The marker to add.
     * @private
     */
    MarkerClusterer.prototype.addToClosestCluster_ = function(marker) {
      var distance = 40000; // Some large number
      var clusterToAddTo = null;
      var pos = marker.getPosition();
      for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
        var center = cluster.getCenter();
        if (center) {
          var d = this.distanceBetweenPoints_(center, marker.getPosition());
          if (d < distance) {
            distance = d;
            clusterToAddTo = cluster;
          }
        }
      }
    
      if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
        clusterToAddTo.addMarker(marker);
      } else {
        var cluster = new Cluster(this);
        cluster.addMarker(marker);
        this.clusters_.push(cluster);
      }
    };
    
    
    /**
     * Creates the clusters.
     *
     * @private
     */
    MarkerClusterer.prototype.createClusters_ = function() {
      if (!this.ready_) {
        return;
      }
    
      // Get our current map view bounds.
      // Create a new bounds object so we don't affect the map.
      var mapBounds = new google.maps.LatLngBounds(this.map_.getBounds().getSouthWest(),
          this.map_.getBounds().getNorthEast());
      var bounds = this.getExtendedBounds(mapBounds);
    
      for (var i = 0, marker; marker = this.markers_[i]; i++) {
        if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
          this.addToClosestCluster_(marker);
        }
      }
    };
    
    
    /**
     * A cluster that contains markers.
     *
     * @param {MarkerClusterer} markerClusterer The markerclusterer that this
     *     cluster is associated with.
     * @constructor
     * @ignore
     */
    function Cluster(markerClusterer) {
      this.markerClusterer_ = markerClusterer;
      this.map_ = markerClusterer.getMap();
      this.gridSize_ = markerClusterer.getGridSize();
      this.minClusterSize_ = markerClusterer.getMinClusterSize();
      this.averageCenter_ = markerClusterer.isAverageCenter();
      this.center_ = null;
      this.markers_ = [];
      this.bounds_ = null;
      this.clusterIcon_ = new ClusterIcon(this, markerClusterer.getStyles(),
          markerClusterer.getGridSize());
    }
    
    /**
     * Determins if a marker is already added to the cluster.
     *
     * @param {google.maps.Marker} marker The marker to check.
     * @return {boolean} True if the marker is already added.
     */
    Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
      if (this.markers_.indexOf) {
        return this.markers_.indexOf(marker) != -1;
      } else {
        for (var i = 0, m; m = this.markers_[i]; i++) {
          if (m == marker) {
            return true;
          }
        }
      }
      return false;
    };
    
    
    /**
     * Add a marker the cluster.
     *
     * @param {google.maps.Marker} marker The marker to add.
     * @return {boolean} True if the marker was added.
     */
    Cluster.prototype.addMarker = function(marker) {
      if (this.isMarkerAlreadyAdded(marker)) {
        return false;
      }
    
      if (!this.center_) {
        this.center_ = marker.getPosition();
        this.calculateBounds_();
      } else {
        if (this.averageCenter_) {
          var l = this.markers_.length + 1;
          var lat = (this.center_.lat() * (l-1) + marker.getPosition().lat()) / l;
          var lng = (this.center_.lng() * (l-1) + marker.getPosition().lng()) / l;
          this.center_ = new google.maps.LatLng(lat, lng);
          this.calculateBounds_();
        }
      }
    
      marker.isAdded = true;
      this.markers_.push(marker);
    
      var len = this.markers_.length;
      if (len < this.minClusterSize_ && marker.getMap() != this.map_) {
        // Min cluster size not reached so show the marker.
        marker.setMap(this.map_);
      }
    
      if (len == this.minClusterSize_) {
        // Hide the markers that were showing.
        for (var i = 0; i < len; i++) {
          this.markers_[i].setMap(null);
        }
      }
    
      if (len >= this.minClusterSize_) {
        marker.setMap(null);
      }
    
      this.updateIcon();
      return true;
    };
    
    
    /**
     * Returns the marker clusterer that the cluster is associated with.
     *
     * @return {MarkerClusterer} The associated marker clusterer.
     */
    Cluster.prototype.getMarkerClusterer = function() {
      return this.markerClusterer_;
    };
    
    
    /**
     * Returns the bounds of the cluster.
     *
     * @return {google.maps.LatLngBounds} the cluster bounds.
     */
    Cluster.prototype.getBounds = function() {
      var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
      var markers = this.getMarkers();
      for (var i = 0, marker; marker = markers[i]; i++) {
        bounds.extend(marker.getPosition());
      }
      return bounds;
    };
    
    
    /**
     * Removes the cluster
     */
    Cluster.prototype.remove = function() {
      this.clusterIcon_.remove();
      this.markers_.length = 0;
      delete this.markers_;
    };
    
    
    /**
     * Returns the center of the cluster.
     *
     * @return {number} The cluster center.
     */
    Cluster.prototype.getSize = function() {
      return this.markers_.length;
    };
    
    
    /**
     * Returns the center of the cluster.
     *
     * @return {Array.<google.maps.Marker>} The cluster center.
     */
    Cluster.prototype.getMarkers = function() {
      return this.markers_;
    };
    
    
    /**
     * Returns the center of the cluster.
     *
     * @return {google.maps.LatLng} The cluster center.
     */
    Cluster.prototype.getCenter = function() {
      return this.center_;
    };
    
    
    /**
     * Calculated the extended bounds of the cluster with the grid.
     *
     * @private
     */
    Cluster.prototype.calculateBounds_ = function() {
      var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
      this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
    };
    
    
    /**
     * Determines if a marker lies in the clusters bounds.
     *
     * @param {google.maps.Marker} marker The marker to check.
     * @return {boolean} True if the marker lies in the bounds.
     */
    Cluster.prototype.isMarkerInClusterBounds = function(marker) {
      return this.bounds_.contains(marker.getPosition());
    };
    
    
    /**
     * Returns the map that the cluster is associated with.
     *
     * @return {google.maps.Map} The map.
     */
    Cluster.prototype.getMap = function() {
      return this.map_;
    };
    
    
    /**
     * Updates the cluster icon
     */
    Cluster.prototype.updateIcon = function() {
      var zoom = this.map_.getZoom();
      var mz = this.markerClusterer_.getMaxZoom();
    
      if (mz && zoom > mz) {
        // The zoom is greater than our max zoom so show all the markers in cluster.
        for (var i = 0, marker; marker = this.markers_[i]; i++) {
          marker.setMap(this.map_);
        }
        return;
      }
    
      if (this.markers_.length < this.minClusterSize_) {
        // Min cluster size not yet reached.
        this.clusterIcon_.hide();
        return;
      }
    
      var numStyles = this.markerClusterer_.getStyles().length;
      var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
      this.clusterIcon_.setCenter(this.center_);
      this.clusterIcon_.setSums(sums);
      this.clusterIcon_.show();
    };
    
    
    /**
     * A cluster icon
     *
     * @param {Cluster} cluster The cluster to be associated with.
     * @param {Object} styles An object that has style properties:
     *     'url': (string) The image url.
     *     'height': (number) The image height.
     *     'width': (number) The image width.
     *     'anchor': (Array) The anchor position of the label text.
     *     'textColor': (string) The text color.
     *     'textSize': (number) The text size.
     *     'backgroundPosition: (string) The background postition x, y.
     * @param {number=} opt_padding Optional padding to apply to the cluster icon.
     * @constructor
     * @extends google.maps.OverlayView
     * @ignore
     */
    function ClusterIcon(cluster, styles, opt_padding) {
      cluster.getMarkerClusterer().extend(ClusterIcon, google.maps.OverlayView);
    
      this.styles_ = styles;
      this.padding_ = opt_padding || 0;
      this.cluster_ = cluster;
      this.center_ = null;
      this.map_ = cluster.getMap();
      this.div_ = null;
      this.sums_ = null;
      this.visible_ = false;
    
      this.setMap(this.map_);
    }
    
    
    /**
     * Triggers the clusterclick event and zoom's if the option is set.
     */
    ClusterIcon.prototype.triggerClusterClick = function() {
      var markerClusterer = this.cluster_.getMarkerClusterer();
    
      // Trigger the clusterclick event.
      google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_);
    
      if (markerClusterer.isZoomOnClick()) {
        // Zoom into the cluster.
        this.map_.fitBounds(this.cluster_.getBounds());
      }
    };
    
    
    /**
     * Adding the cluster icon to the dom.
     * @ignore
     */
    ClusterIcon.prototype.onAdd = function() {
      this.div_ = document.createElement('DIV');
      if (this.visible_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.cssText = this.createCss(pos);
        this.div_.innerHTML = this.sums_.text;
      }
    
      var panes = this.getPanes();
      panes.overlayMouseTarget.appendChild(this.div_);
    
      var that = this;
      google.maps.event.addDomListener(this.div_, 'click', function() {
        that.triggerClusterClick();
      });
    };
    
    
    /**
     * Returns the position to place the div dending on the latlng.
     *
     * @param {google.maps.LatLng} latlng The position in latlng.
     * @return {google.maps.Point} The position in pixels.
     * @private
     */
    ClusterIcon.prototype.getPosFromLatLng_ = function(latlng) {
      var pos = this.getProjection().fromLatLngToDivPixel(latlng);
      pos.x -= parseInt(this.width_ / 2, 10);
      pos.y -= parseInt(this.height_ / 2, 10);
      return pos;
    };
    
    
    /**
     * Draw the icon.
     * @ignore
     */
    ClusterIcon.prototype.draw = function() {
      if (this.visible_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.top = pos.y + 'px';
        this.div_.style.left = pos.x + 'px';
      }
    };
    
    
    /**
     * Hide the icon.
     */
    ClusterIcon.prototype.hide = function() {
      if (this.div_) {
        this.div_.style.display = 'none';
      }
      this.visible_ = false;
    };
    
    
    /**
     * Position and show the icon.
     */
    ClusterIcon.prototype.show = function() {
      if (this.div_) {
        var pos = this.getPosFromLatLng_(this.center_);
        this.div_.style.cssText = this.createCss(pos);
        this.div_.style.display = '';
      }
      this.visible_ = true;
    };
    
    
    /**
     * Remove the icon from the map
     */
    ClusterIcon.prototype.remove = function() {
      this.setMap(null);
    };
    
    
    /**
     * Implementation of the onRemove interface.
     * @ignore
     */
    ClusterIcon.prototype.onRemove = function() {
      if (this.div_ && this.div_.parentNode) {
        this.hide();
        this.div_.parentNode.removeChild(this.div_);
        this.div_ = null;
      }
    };
    
    
    /**
     * Set the sums of the icon.
     *
     * @param {Object} sums The sums containing:
     *   'text': (string) The text to display in the icon.
     *   'index': (number) The style index of the icon.
     */
    ClusterIcon.prototype.setSums = function(sums) {
      this.sums_ = sums;
      this.text_ = sums.text;
      this.index_ = sums.index;
      if (this.div_) {
        this.div_.innerHTML = sums.text;
      }
    
      this.useStyle();
    };
    
    
    /**
     * Sets the icon to the the styles.
     */
    ClusterIcon.prototype.useStyle = function() {
      var index = Math.max(0, this.sums_.index - 1);
      index = Math.min(this.styles_.length - 1, index);
      var style = this.styles_[index];
      this.url_ = style['url'];
      this.height_ = style['height'];
      this.width_ = style['width'];
      this.textColor_ = style['textColor'];
      this.anchor_ = style['anchor'];
      this.textSize_ = style['textSize'];
      this.backgroundPosition_ = style['backgroundPosition'];
    };
    
    
    /**
     * Sets the center of the icon.
     *
     * @param {google.maps.LatLng} center The latlng to set as the center.
     */
    ClusterIcon.prototype.setCenter = function(center) {
      this.center_ = center;
    };
    
    
    /**
     * Create the css text based on the position of the icon.
     *
     * @param {google.maps.Point} pos The position.
     * @return {string} The css style text.
     */
    ClusterIcon.prototype.createCss = function(pos) {
      var style = [];
      style.push('background-image:url(' + this.url_ + ');');
      var backgroundPosition = this.backgroundPosition_ ? this.backgroundPosition_ : '0 0';
      style.push('background-position:' + backgroundPosition + ';');
    
      if (typeof this.anchor_ === 'object') {
        if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
            this.anchor_[0] < this.height_) {
          style.push('height:' + (this.height_ - this.anchor_[0]) +
              'px; padding-top:' + this.anchor_[0] + 'px;');
        } else {
          style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
              'px;');
        }
        if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
            this.anchor_[1] < this.width_) {
          style.push('width:' + (this.width_ - this.anchor_[1]) +
              'px; padding-left:' + this.anchor_[1] + 'px;');
        } else {
          style.push('width:' + this.width_ + 'px; text-align:center;');
        }
      } else {
        style.push('height:' + this.height_ + 'px; line-height:' +
            this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
      }
    
      var txtColor = this.textColor_ ? this.textColor_ : 'black';
      var txtSize = this.textSize_ ? this.textSize_ : 11;
    
      style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
          pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
          txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
      return style.join('');
    };
    
    
    // Export Symbols for Closure
    // If you are not going to compile with closure then you can remove the
    // code below.
    global['MarkerClusterer'] = MarkerClusterer;
    MarkerClusterer.prototype['addMarker'] = MarkerClusterer.prototype.addMarker;
    MarkerClusterer.prototype['addMarkers'] = MarkerClusterer.prototype.addMarkers;
    MarkerClusterer.prototype['clearMarkers'] =
        MarkerClusterer.prototype.clearMarkers;
    MarkerClusterer.prototype['fitMapToMarkers'] =
        MarkerClusterer.prototype.fitMapToMarkers;
    MarkerClusterer.prototype['getCalculator'] =
        MarkerClusterer.prototype.getCalculator;
    MarkerClusterer.prototype['getGridSize'] =
        MarkerClusterer.prototype.getGridSize;
    MarkerClusterer.prototype['getExtendedBounds'] =
        MarkerClusterer.prototype.getExtendedBounds;
    MarkerClusterer.prototype['getMap'] = MarkerClusterer.prototype.getMap;
    MarkerClusterer.prototype['getMarkers'] = MarkerClusterer.prototype.getMarkers;
    MarkerClusterer.prototype['getMaxZoom'] = MarkerClusterer.prototype.getMaxZoom;
    MarkerClusterer.prototype['getStyles'] = MarkerClusterer.prototype.getStyles;
    MarkerClusterer.prototype['getTotalClusters'] =
        MarkerClusterer.prototype.getTotalClusters;
    MarkerClusterer.prototype['getTotalMarkers'] =
        MarkerClusterer.prototype.getTotalMarkers;
    MarkerClusterer.prototype['redraw'] = MarkerClusterer.prototype.redraw;
    MarkerClusterer.prototype['removeMarker'] =
        MarkerClusterer.prototype.removeMarker;
    MarkerClusterer.prototype['removeMarkers'] =
        MarkerClusterer.prototype.removeMarkers;
    MarkerClusterer.prototype['resetViewport'] =
        MarkerClusterer.prototype.resetViewport;
    MarkerClusterer.prototype['repaint'] =
        MarkerClusterer.prototype.repaint;
    MarkerClusterer.prototype['setCalculator'] =
        MarkerClusterer.prototype.setCalculator;
    MarkerClusterer.prototype['setGridSize'] =
        MarkerClusterer.prototype.setGridSize;
    MarkerClusterer.prototype['setMaxZoom'] =
        MarkerClusterer.prototype.setMaxZoom;
    MarkerClusterer.prototype['onAdd'] = MarkerClusterer.prototype.onAdd;
    MarkerClusterer.prototype['draw'] = MarkerClusterer.prototype.draw;
    
    Cluster.prototype['getCenter'] = Cluster.prototype.getCenter;
    Cluster.prototype['getSize'] = Cluster.prototype.getSize;
    Cluster.prototype['getMarkers'] = Cluster.prototype.getMarkers;
    
    ClusterIcon.prototype['onAdd'] = ClusterIcon.prototype.onAdd;
    ClusterIcon.prototype['draw'] = ClusterIcon.prototype.draw;
    ClusterIcon.prototype['onRemove'] = ClusterIcon.prototype.onRemove;
    
    
    module.exports = MarkerClusterer;
    
    }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{}],3:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
    
    var _MapObject2 = require('./MapObject');
    
    var _MapObject3 = _interopRequireDefault(_MapObject2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * BaseMarker#show
     *
     * @event BaseMarker#show
     * @type {object}
     */
    
    /**
     * BaseMarker#hide
     *
     * @event BaseMarker#hide
     * @type {object}
     */
    
    /**
     * Base Marker class
     * @class BaseMarker
     * @extends MapObject
     * @fires BaseMarker#show
     * @fires BaseMarker#hide
     */
    var BaseMarker = function (_MapObject) {
        _inherits(BaseMarker, _MapObject);
    
        function BaseMarker() {
            _classCallCheck(this, BaseMarker);
    
            return _possibleConstructorReturn(this, (BaseMarker.__proto__ || Object.getPrototypeOf(BaseMarker)).apply(this, arguments));
        }
    
        _createClass(BaseMarker, [{
            key: 'dispose',
            value: function dispose() {
                _get(BaseMarker.prototype.__proto__ || Object.getPrototypeOf(BaseMarker.prototype), 'dispose', this).call(this);
                this.hide();
                delete this._marker;
                this._marker = false;
            }
        }, {
            key: 'show',
            value: function show() {
                if (!this._isShown) {
                    //Marker.getMap()) {
                    if (this._isShown === undefined) {
                        this.Marker.setMap(this.Map.Map);
                    }
                    this.Marker.setVisible(true);
                    this._isShown = true;
                    this.emit('show');
                }
                return this;
            }
        }, {
            key: 'hide',
            value: function hide() {
                if (this._isShown) {
                    this._isShown = false;
                    this.Marker.setVisible(false);
                    this.emit('hide');
                }
                return this;
            }
        }, {
            key: 'onClick',
            value: function onClick(e) {
                this.emit('click', e);
            }
        }, {
            key: 'onDragEnd',
            value: function onDragEnd() {
                this.emit('dragend', this.Position);
                this.emit('move', this.Position);
            }
        }, {
            key: 'Marker',
    
    
            /**
             * @override
             */
            get: function get() {
                if (this._marker) {
                    return this._marker;
                }
                if (this._marker === false) {
                    throw new Error('Marker has been destroyed');
                }
                try {
                    this._marker = new this.Api.Marker(this.Options);
                    this._isShown = !!this._marker.getMap();
                    this.addEventListener(this._marker, 'click', this.onClick.bind(this));
                    this.addEventListener(this._marker, 'dragend', this.onDragEnd.bind(this));
                    this.ZIndex = this.Options.zIndex || 0;
                } catch (e) {
                    console.warn('Could not create Marker', e);
                    this._marker = false;
                }
                return this._marker;
            }
        }, {
            key: 'ZIndex',
            get: function get() {
                return this.Marker.getZIndex();
            },
            set: function set(val) {
                this.Marker.setZIndex(val);
            }
        }, {
            key: 'Clickable',
            set: function set(value) {
                this.Marker.setClickable(value);
            },
            get: function get() {
                return this.Marker.getClickable();
            }
        }, {
            key: 'Draggable',
            set: function set(value) {
                this.Marker.setDraggable(value);
            },
            get: function get() {
                return this.Marker.getDraggable();
            }
        }, {
            key: 'Position',
            set: function set(value) {
                this.Marker.setPosition(value);
            },
            get: function get() {
                return this.Marker.getPosition();
            }
        }]);
    
        return BaseMarker;
    }(_MapObject3.default);
    
    exports.default = BaseMarker;
    
    },{"./MapObject":9}],4:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _events = require('events');
    
    var _events2 = _interopRequireDefault(_events);
    
    var _MapInstance = require('./MapInstance');
    
    var _MapInstance2 = _interopRequireDefault(_MapInstance);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    // Maximum time to wait for the Google Maps API to load, in milliseconds
    var LOAD_TIMEOUT = 120000;
    
    /**
     * @class GoogleMaps
     * @extends EventEmitter
     */
    
    var GoogleMaps = function (_EventEmitter) {
        _inherits(GoogleMaps, _EventEmitter);
    
        /**
         * Construct a new ManagedGoogleMap. Multiple map instances CAN exist in the same DOM,
         * if proper care is taken to scoping. This class abstracts the loading, creation
         * and high-level interface to attach and remove google map instances in the DOM.
         *
         * @param options {Object} Options with  optional key 'apiKey' that should be set to your Google Maps API key
         *                              optional key 'root', or defaults to 'window'
         * @param options.apiKey {string} Google Maps API key
         * @param options.root {Object} Root object (defaults to 'window')
         *
         * NOTE! 'root' needs mocking of setTimeout, clearTimeout, document.createElement and document.querySelectorAll
         *       Objects returned from createElement must have setAttribute method mocked,
         *       and querySelectorAll must have appendChild method mocked.
         */
        function GoogleMaps(options) {
            _classCallCheck(this, GoogleMaps);
    
            var _this = _possibleConstructorReturn(this, (GoogleMaps.__proto__ || Object.getPrototypeOf(GoogleMaps)).call(this, options));
    
            _this.options = options;
            _this.root = _this.options.root || (typeof window === 'undefined' ? {} : window);
            _this.timeoutTimer = false;
            _this.mapsApi = _this.root.google ? _this.root.google.maps : undefined;
            if (_this.mapsApi) {
                return _possibleConstructorReturn(_this);
            }
            // Allow for creator to subscribe before loading
            _this.root.setTimeout(_this._load.bind(_this), 1);
            return _this;
        }
    
        /*
         * Returns true when the Google Maps API is ready
         * @public
         * @member
         * @instance
         */
    
    
        _createClass(GoogleMaps, [{
            key: 'create',
    
    
            /**
             * Create a new Google Maps map instance
             * @public
             * @member
             * @instance
             * @param options {Object} Passed as options to @MapInstance
             */
            value: function create(options) {
                if (!this.Ready) {
                    throw new Error('Maps not ready');
                }
                return new _MapInstance2.default(this.mapsApi, options);
            }
    
            /**
             * Destroy a MapInstance, freeing all it's resources (including layers and their objects)
             * @public
             * @member
             * @instance
             */
    
        }, {
            key: 'destroy',
            value: function destroy(instance) {
                instance.dispose();
            }
    
            /**
             * Ensures that the Google Maps API is loaded
             * Emits 'ready' when ready, 'error' on error
             * @private
             * @member
             * @instance
             */
    
        }, {
            key: '_load',
            value: function _load() {
                var _this2 = this;
    
                if (this.timeoutTimer) {
                    throw new Error('Only call load once, then wait for "ready" or "error" events');
                }
                this.timeoutTimer = this.root.setTimeout(function () {
                    if (!_this2.mapsApi && _this2.timeoutTimer !== false) {
                        _this2.emit('error', 'timeout');
                    }
                    _this2.timeoutTimer = false;
                }, LOAD_TIMEOUT);
    
                this._injectScript().then(function () {
                    _this2._ready = true;
                    _this2.emit('ready', _this2.mapsApi);
                }).catch(function (e) {
                    _this2.emit('error', e);
                });
            }
        }, {
            key: '_injectScript',
            value: function _injectScript() {
                var _this3 = this;
    
                return new Promise(function (resolve, reject) {
                    var callback = "_gmapsLoaded";
                    _this3.root._gmapsLoaded = function () {
                        _this3.root.clearTimeout(_this3.timeoutTimer);
                        _this3.timeoutTimer = false;
                        _this3.mapsApi = _this3.root.google.maps;
                        if (_this3.mapsApi) {
                            return resolve();
                        }
                        reject('failed to load maps API');
                    };
                    var lib_str = '';
                    if (_this3.options.libraries && _this3.options.libraries.length > 0) {
                        lib_str = 'libraries=' + _this3.options.libraries.join(',');
                    }
                    var el = _this3.root.document.createElement('script');
                    var url = 'https://maps.googleapis.com/maps/api/js?';
    
                    var params = [];
                    if (_this3.options.client) {
                        params.push("client=" + _this3.options.client);
                    }
                    if (_this3.options.apiKey || _this3.options.key) {
                        var key = _this3.options.apiKey || _this3.options.key;
                        params.push("key=" + key);
                    }
                    if (lib_str) {
                        params.push(lib_str);
                    }
                    params.push("callback=" + callback);
    
                    el.setAttribute('src', url + params.join('&'));
                    el.setAttribute('async', '');
                    el.setAttribute('defer', '');
                    _this3.root.document.querySelectorAll('body')[0].appendChild(el);
                });
            }
        }, {
            key: 'Ready',
            get: function get() {
                return !!this.mapsApi;
            }
        }]);
    
        return GoogleMaps;
    }(_events2.default);
    
    exports.default = GoogleMaps;
    
    },{"./MapInstance":7,"events":1}],5:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _BaseMarker2 = require("./BaseMarker");
    
    var _BaseMarker3 = _interopRequireDefault(_BaseMarker2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * @class IconMarker - Icon marker
     * @extends BaseMarker
     *
     */
    var IconMarker = function (_BaseMarker) {
        _inherits(IconMarker, _BaseMarker);
    
        function IconMarker() {
            _classCallCheck(this, IconMarker);
    
            return _possibleConstructorReturn(this, (IconMarker.__proto__ || Object.getPrototypeOf(IconMarker)).apply(this, arguments));
        }
    
        _createClass(IconMarker, [{
            key: "Icon",
            set: function set(icon) {
                return this.Marker.setIcon(icon);
            },
            get: function get() {
                return this.Marker.getIcon();
            }
        }]);
    
        return IconMarker;
    }(_BaseMarker3.default);
    
    exports.default = IconMarker;
    
    },{"./BaseMarker":3}],6:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _BaseMarker2 = require('./BaseMarker');
    
    var _BaseMarker3 = _interopRequireDefault(_BaseMarker2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * @class InfoWindow
     * @extends BaseMarker
     * @param options Object @see https://developers.google.com/maps/documentation/javascript/3.exp/reference#InfoWindowOptions
     */
    var InfoWindow = function (_BaseMarker) {
        _inherits(InfoWindow, _BaseMarker);
    
        function InfoWindow() {
            _classCallCheck(this, InfoWindow);
    
            return _possibleConstructorReturn(this, (InfoWindow.__proto__ || Object.getPrototypeOf(InfoWindow)).apply(this, arguments));
        }
    
        _createClass(InfoWindow, [{
            key: 'show',
            value: function show() {
                this.Marker.open(this.Map.Map);
                return this;
            }
        }, {
            key: 'hide',
            value: function hide() {
                this.Marker.close();
                return this;
            }
        }, {
            key: 'onCloseClick',
            value: function onCloseClick() {
                this.emit('close');
            }
        }, {
            key: 'Marker',
            get: function get() {
                if (this._marker) {
                    return this._marker;
                }
                if (this._marker === false) {
                    throw new Error('Marker has been destroyed');
                }
                this._marker = new this.Api.InfoWindow(this.Options);
                this.addEventListener(this._marker, 'closeclick', this.onCloseClick.bind(this));
                this.ZIndex = this.Options.zIndex || 0;
                return this._marker;
            }
        }, {
            key: 'Content',
            get: function get() {
                return this.Marker.getContent();
            },
            set: function set(content) {
                this.Marker.setContent(content);
                return this;
            }
        }]);
    
        return InfoWindow;
    }(_BaseMarker3.default);
    
    exports.default = InfoWindow;
    
    },{"./BaseMarker":3}],7:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _MapObject2 = require('./MapObject');
    
    var _MapObject3 = _interopRequireDefault(_MapObject2);
    
    var _MapLayer = require('./MapLayer');
    
    var _MapLayer2 = _interopRequireDefault(_MapLayer);
    
    var _WMSLayer = require('./WMSLayer');
    
    var _WMSLayer2 = _interopRequireDefault(_WMSLayer);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    var MapInstance = function (_MapObject) {
        _inherits(MapInstance, _MapObject);
    
        function MapInstance(api, options) {
            _classCallCheck(this, MapInstance);
    
            var _this = _possibleConstructorReturn(this, (MapInstance.__proto__ || Object.getPrototypeOf(MapInstance)).call(this, null, options));
    
            _this._api = api;
            _this._layers = [];
            return _this;
        }
    
        _createClass(MapInstance, [{
            key: 'disposeLayer',
    
    
            /**
             * Dispose of a layer
             * @arg layer
             * @return this
             */
            value: function disposeLayer(layer) {
                var i = this._layers.indexOf(layer);
                if (i !== -1) {
                    this._layers.splice(i, 1);
                }
                layer.dispose();
                return this;
            }
    
            /**
             * Create and return a new Layer within this MapInstance.
             * The new Layer is added to the internal list of layers.
             * @arg options Object Layer options, see @MapLayer
             * @return MapLayer instance
             */
    
        }, {
            key: 'createLayer',
            value: function createLayer() {
                var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    
                var l = null;
                if (options.type && options.type.toLowerCase() === 'wms') {
                    l = new _WMSLayer2.default(this, options);
                } else {
                    l = new _MapLayer2.default(this, options);
                }
                this.addLayer(l);
                return l;
            }
    
            /**
             * Add a layer to this MapInstance.
             * @arg layer MapLayer instance
             * @return this
             */
    
        }, {
            key: 'addLayer',
            value: function addLayer(layer) {
                if (this !== layer.Map) {
                    throw new Error("Layer belongs to other MapInstance");
                }
                this._layers.push(layer);
                this.emit('layer:added', layer);
                return this;
            }
    
            /**
             * Remove a Layer from this MapInstance. This will dispose the layer completely,
             * including any objects currently in it.
             * @arg layer MapLayer object
             */
    
        }, {
            key: 'removeLayer',
            value: function removeLayer(layer) {
                var i = this._layers.indexOf(layer);
                if (i === -1) {
                    throw new Error('Layer is not a part of this map instance');
                }
                this.emit('layer:removed', this._layers.splice(i, 1));
                return this;
            }
        }, {
            key: 'dispose',
            value: function dispose() {
                var _this2 = this;
    
                this._layers.forEach(function (layer) {
                    _this2.disposeLayer(layer);
                });
                this.Options.el.innerHTML = '';
                this._layers = [];
                this._map = null;
                this._api = null;
            }
        }, {
            key: 'Api',
            get: function get() {
                return this._api;
            }
        }, {
            key: 'Layers',
            get: function get() {
                return this._layers;
            }
        }, {
            key: 'Map',
            get: function get() {
                if (!this._map) {
                    if (!this.Api) {
                        throw new Error('Map instance has no Api reference, is it disposed?');
                    }
                    this._map = new this.Api.Map(this.Options.el, this.Options);
                }
                return this._map;
            }
        }, {
            key: 'Options',
            get: function get() {
                return this._options;
            }
        }]);
    
        return MapInstance;
    }(_MapObject3.default);
    
    exports.default = MapInstance;
    
    },{"./MapLayer":8,"./MapObject":9,"./WMSLayer":15}],8:[function(require,module,exports){
    (function (global){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
    
    var _MapObject2 = require('./MapObject');
    
    var _MapObject3 = _interopRequireDefault(_MapObject2);
    
    var _InfoWindow = require('./InfoWindow');
    
    var _InfoWindow2 = _interopRequireDefault(_InfoWindow);
    
    var _IconMarker = require('./IconMarker');
    
    var _IconMarker2 = _interopRequireDefault(_IconMarker);
    
    var _TextOverlay = require('./TextOverlay');
    
    var _TextOverlay2 = _interopRequireDefault(_TextOverlay);
    
    var _Polyline = require('./Polyline');
    
    var _Polyline2 = _interopRequireDefault(_Polyline);
    
    var _Polygon = require('./Polygon');
    
    var _Polygon2 = _interopRequireDefault(_Polygon);
    
    var _MultiPolygon = require('./MultiPolygon');
    
    var _MultiPolygon2 = _interopRequireDefault(_MultiPolygon);
    
    var _nodeJsMarkerClusterer = require('node-js-marker-clusterer');
    
    var _nodeJsMarkerClusterer2 = _interopRequireDefault(_nodeJsMarkerClusterer);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    global.GoogleMaps_MapLayerZIndexOffset = 0;
    global.GoogleMaps_MapLayerZIndexRange = 75000; // Max # objects in a layer
    
    /**
     * @class MapLayer
     * @extends MapObject
     * @property {number} ZIndex - Z-index of this layer in respect to others on the map
     * @property {MapInstance} Map - MapInstance that owns this MapLayer
     * @property {object} Options - Options passed on layer creation, or updated with setOption
     * @param map MapInstance MapInstance object
     * @param options {object} options
     * @param options.cluster {object}   Applies clustering to the layer. Adds all markers to a cluster with specified options.
     * 
     * @param options.cluster.gridSize (number) The grid size of a cluster in pixels.
     * @param options.cluster.maxZoom (number) The maximum zoom level that a marker can be part of a cluster.
     * @param options.cluster.zoomOnClick (boolean) Whether the default behaviour of clicking on a cluster is to zoom into it.
     * @param options.cluster.averageCenter (boolean) Wether the center of each cluster should be the average of all markers in the cluster.
     * @param options.cluster.minimumClusterSize (number) The minimum number of markers to be in a cluster before the markers are hidden and a count is shown.
     * @param options.cluster.styles {object} An object with styling properties:
     * @param options.cluster.styles.url {string} Image url.
     * @param options.cluster.styles.height {number} Image height.
     * @param options.cluster.styles.width {number} Image width.
     * @param options.cluster.styles.anchor {Array} Anchor position of the label text.
     * @param options.cluster.styles.textColor {string} Text color.
     * @param options.cluster.styles.textSize {number} Text size.
     * @param options.cluster.styles.iconAnchor {Array} Anchor position of icon; [x, y].
     * @param options.cluster.styles.backgroundPosition {string} Position of the backgound; [x, y].
     */
    
    var MapLayer = function (_MapObject) {
        _inherits(MapLayer, _MapObject);
    
        function MapLayer(map, options) {
            _classCallCheck(this, MapLayer);
    
            var _this = _possibleConstructorReturn(this, (MapLayer.__proto__ || Object.getPrototypeOf(MapLayer)).call(this, map, options));
    
            _this._map = map;
            _this._objects = [];
            if (_this.Options.zIndex) {
                _this.ZIndex = _this.Options.zIndex;
            } else {
                _this.ZIndex = global.GoogleMaps_MapLayerZIndexOffset;
                global.GoogleMaps_MapLayerZIndexOffset += global.GoogleMaps_MapLayerZIndexRange;
            }
            return _this;
        }
    
        _createClass(MapLayer, [{
            key: '_indexOf',
            value: function _indexOf(obj) {
                return this.Objects.indexOf(obj);
            }
            /**
             * Create a new object within this layer.
             * @arg type String type of object to create
             * @arg options Object with type specific options, see @BaseMarker @Polyline @Polygon
             */
    
        }, {
            key: 'create',
            value: function create(type, options) {
                var obj = null;
                options.zIndex = this.ZIndex + this.Objects.length + 1;
                try {
                    switch (type.toLowerCase()) {
                        case "infowindow":
                            obj = new _InfoWindow2.default(this, options);
                            break;
    
                        case "marker":
                        case "mapmarker":
                            obj = new _IconMarker2.default(this, options);
                            break;
    
                        case "multipoly":
                        case "multipolygon":
                            obj = new _MultiPolygon2.default(this, options);
                            break;
                        // case "geojson"
                        // case "kml" ...
    
    
                        case "line":
                        case "polyline":
                        case "poly-line":
                            obj = new _Polyline2.default(this, options);
                            break;
    
                        case "poly":
                        case "polygon":
                            obj = new _Polygon2.default(this, options);
                            break;
    
                        case "text":
                            obj = new _TextOverlay2.default(this, options);
                            break;
    
                        default:
                            throw new Error("No such MapObject type " + type);
                    }
                    if (obj) {
                        this.emit('created:' + type, obj);
                        this._add(obj);
                    }
                } catch (e) {
                    console.warn('MapLayer.create(%s, options) failed', type, options, e, e.stack);
                }
                return obj;
            }
        }, {
            key: '_resolveMultiArg',
            value: function _resolveMultiArg(arg) {
                return arg ? (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' ? arg : [arg] : this.Objects;
            }
    
            /**
             * Show one, multiple, or all objects within this layer.
             * @arg arg Mixed single object, list of objects or falsy to show all
             * @return this
             */
    
        }, {
            key: 'show',
            value: function show(arg) {
                arg = this._resolveMultiArg(arg);
                arg.forEach(function (o) {
                    if (!(o instanceof _IconMarker2.default)) {
                        o.show();
                    }
                });
                return this;
            }
    
            /**
             * Hide one, multiple, or all objects within this layer.
             * @arg arg Mixed single object, list of objects or falsy to show all
             * @return this
             */
    
        }, {
            key: 'hide',
            value: function hide(arg) {
                arg = this._resolveMultiArg(arg);
                arg.forEach(function (o) {
                    if (!(o instanceof _IconMarker2.default)) {
                        o.hide();
                    }
                });
                return this;
            }
    
            // Since create() adds new objects to map layer, we do not need 'add' as a public method
    
        }, {
            key: '_add',
            value: function _add(obj) {
                this.Objects.push(obj);
                if (obj instanceof _IconMarker2.default) {
                    this.Cluster.addMarker(obj.Marker);
                }
                return this;
            }
    
            // Re-set all objects zIndex
    
        }, {
            key: '_reindex_objects',
            value: function _reindex_objects(zi) {
                this.Objects.forEach(function (o) {
                    o.ZIndex = zi++;
                });
                return zi;
            }
        }, {
            key: 'remove',
            value: function remove(obj) {
                var i = this._indexOf(obj);
                if (i === -1) {
                    throw new Error('Object is not part of layer');
                }
                obj.hide();
    
                if (obj instanceof _IconMarker2.default) {
                    this.Cluster.removeMarker(obj.Marker);
                }
    
                this.emit('remove', this.Objects.splice(i, 1));
                return this;
            }
        }, {
            key: 'moveToFront',
            value: function moveToFront(obj) {
                var i = this._indexOf(obj);
                if (i === -1) {
                    throw new Error('Object is not part of layer');
                }
                if (i !== 0) {
                    var itm = this.Objects.splice(i, 1);
                    itm.ZIndex = this.ZIndex + 1;
                    this._reindex_objects(itm.ZIndex + 1);
                    this.Objects.unshift(itm);
                    this.emit('promoted', itm);
                }
                return this;
            }
        }, {
            key: 'moveToBack',
            value: function moveToBack(obj) {
                var i = this._indexOf(obj);
                if (i === -1) {
                    throw new Error('Object is not part of layer');
                }
                if (i !== this.Objects.length - 1) {
                    var itm = this.Objects.splice(i, 1);
                    this.Objects.push(itm);
                    this._reindex_objects(this.ZIndex + 1);
                    this.emit('demoted', itm);
                }
                return this;
            }
        }, {
            key: 'dispose',
            value: function dispose() {
                this.Objects.forEach(function (o) {
                    o.dispose();
                });
                _get(MapLayer.prototype.__proto__ || Object.getPrototypeOf(MapLayer.prototype), 'dispose', this).call(this);
            }
        }, {
            key: 'Cluster',
            get: function get() {
                if (!this._cluster) {
                    this._cluster = new _nodeJsMarkerClusterer2.default(this.Map.Map, this.Options.cluster || {});
                }
                return this._cluster;
            }
        }, {
            key: 'ZIndex',
            get: function get() {
                return this._zindex;
            },
            set: function set(zv) {
                this._zindex = zv;
                this._reindex_objects(zv);
            }
        }, {
            key: 'Map',
            get: function get() {
                return this._map;
            }
        }, {
            key: 'Options',
            get: function get() {
                return this._options;
            }
        }, {
            key: 'Objects',
            get: function get() {
                return this._objects;
            }
        }]);
    
        return MapLayer;
    }(_MapObject3.default);
    
    exports.default = MapLayer;
    
    }).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
    },{"./IconMarker":5,"./InfoWindow":6,"./MapObject":9,"./MultiPolygon":10,"./Polygon":12,"./Polyline":13,"./TextOverlay":14,"node-js-marker-clusterer":2}],9:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _events = require('events');
    
    var _events2 = _interopRequireDefault(_events);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    var objIdCounter = 1;
    
    /**
     * Internal object used to keep track of GMaps event listeners.
     * @class MapObject#ListenerEntry 
     * @private
     *
     * @type {object}
     * @property {listener} listener GMaps Event Listeneer
     * @property {callback} listener GMaps Event Listeneer
     */
    
    /**
     * MapObject#listener:added
     *
     * @event MapObject#listener:added
     * @type {object}
     * @property {MapObject#ListenerEntry} listener entry
     */
    
    /**
     * MapObject#listener:removed
     *
     * @event MapObject#listener:removed
     * @type {object}
     * @property {MapObject#ListenerEntry} listener Listener entry
     */
    
    /**
     * MapObject#set:options
     *
     * @event MapObject#set:options
     * @type {object}
     * @property {Object} options New options
     */
    
    /**
     * Base class for all map objects (layers, markers, polylines etc)
     * @class MapObject
     * @protected
     * @extends EventEmitter
     * @param parent {MapInstance|MapLayer} Parent object
     * @param options {object} Object with options
     * @property {object} Options - Options passed on layer creation, or updated with setOption
     * @property {object} Parent - Parent object passed to constructor
     * @property {object} Api - The google.maps object
     * @property {object} Map - Access to the parent's Map property
     * @fires MapObject#listener:added
     * @fires MapObject#listener:removed
     * @fires MapObject#set:options
     */
    
    var MapObject = function (_EventEmitter) {
        _inherits(MapObject, _EventEmitter);
    
        function MapObject(parent) {
            var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    
            _classCallCheck(this, MapObject);
    
            var _this = _possibleConstructorReturn(this, (MapObject.__proto__ || Object.getPrototypeOf(MapObject)).call(this));
    
            _this._id = objIdCounter++;
            _this._parent = parent;
            _this._options = options || {};
            _this._listeners = [];
            return _this;
        }
    
        _createClass(MapObject, [{
            key: 'addEventListener',
    
    
            /**
             * Add an event listener to a GMaps object.
             * This is NOT the method to use to listen to MapObject events,
             * see documentation for `events#EventEmitter`
             **/
            value: function addEventListener(obj, evt, callback) {
                var l = this.Api.event.addListener(obj, evt, callback);
                var le = { obj: obj, evt: evt, listener: l, callback: callback };
                this._listeners.push(le);
                this.emit('listener:added', le);
                return l;
            }
    
            /**
             * Remove an event listener for a GMaps object event.
             * This is NOT the method to use to stop listening to MapObject events,
             * see documentation for `events#EventEmitter`
             **/
    
        }, {
            key: 'removeEventListener',
            value: function removeEventListener(obj, evt, listener, callback) {
                var ls = this._listeners.filter(function (li) {
                    return (evt && li.evt === evt || !evt) && (obj && li.obj === obj || !obj) && (listener && li.listener === listener || !listener) && (callback && li.callback === callback || !callback);
                });
                for (var i = 0; i < ls.length; i++) {
                    var j = this._listeners.indexOf(ls[i]);
                    if (j === -1) {
                        throw new Error('Listener to be removed could not be found in listeners list.');
                    }
                    var le = this._listeners.splice(j, 1);
                    this.Api.event.removeListener(le.listener);
                    this.emit('listener:removed', le);
                }
            }
    
            // Internal method to clean up lingering GMaps event listeners when disposed
    
        }, {
            key: '_stopListening',
            value: function _stopListening() {
                var _this2 = this;
    
                this._listeners.filter(function (l) {
                    _this2.Api.event.removeListener(l.listener);
                });
                this._listeners = [];
    
                // Remove all EventEmitter listeners
                this.removeAllListeners();
            }
    
            // Called by owner to dispose of this MapObject
    
        }, {
            key: 'dispose',
            value: function dispose() {
                this._stopListening();
            }
        }, {
            key: 'Id',
            get: function get() {
                return this._id;
            }
        }, {
            key: 'Options',
            set: function set(newOptions) {
                this._options = newOptions;
                this.emit('set:options', newOptions);
            },
            get: function get() {
                return this._options;
            }
        }, {
            key: 'Parent',
            get: function get() {
                return this._parent;
            }
        }, {
            key: 'Api',
            get: function get() {
                return this.Map.Api;
            }
        }, {
            key: 'Map',
            get: function get() {
                return this.Parent.Map;
            }
        }]);
    
        return MapObject;
    }(_events2.default);
    
    exports.default = MapObject;
    
    },{"events":1}],10:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Polygon2 = require('./Polygon');
    
    var _Polygon3 = _interopRequireDefault(_Polygon2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * @class MultiPolygon 
     * @extends Polygon
     */
    var MultiPolygon = function (_Polygon) {
        _inherits(MultiPolygon, _Polygon);
    
        function MultiPolygon() {
            _classCallCheck(this, MultiPolygon);
    
            return _possibleConstructorReturn(this, (MultiPolygon.__proto__ || Object.getPrototypeOf(MultiPolygon)).apply(this, arguments));
        }
    
        _createClass(MultiPolygon, [{
            key: 'Marker',
    
    
            /**
             * Overrides the Marker accessor to return a Polygon
             * This allows all methods and accessors on Polyline to work properly.
             **/
            get: function get() {
                if (this._marker) {
                    return this._marker;
                }
                if (this._marker === false) {
                    throw new Error('Marker has been destroyed');
                }
                this._marker = new this.Api.Data.MultiPolygon(this.Options);
                this.addEventListener(this._marker, 'click', this.onClick.bind(this));
                return this._marker;
            }
        }, {
            key: 'Polyline',
            get: function get() {
                return this.Marker;
            }
        }, {
            key: 'Polygon',
            get: function get() {
                return this.Marker;
            }
        }, {
            key: 'MultiPolygon',
            get: function get() {
                return this.Marker;
            }
        }, {
            key: 'Path',
            set: function set() {
                //jshint unused:false
                throw new Error('MultiPolygons have multiple paths');
            },
            get: function get() {
                throw new Error('MultiPolygons have multiple paths');
            }
        }, {
            key: 'Paths',
            get: function get() {
                return this.MultiPolygon.getPaths();
            },
            set: function set(paths) {
                return this.MultiPolygon.setPaths(paths);
            }
        }]);
    
        return MultiPolygon;
    }(_Polygon3.default);
    
    exports.default = MultiPolygon;
    
    },{"./Polygon":12}],11:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
    
    var _MapObject2 = require('./MapObject');
    
    var _MapObject3 = _interopRequireDefault(_MapObject2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * Base Overlay class
     * @class Overlay
     * @extends MapObject
     *
     */
    var Overlay = function (_MapObject) {
        _inherits(Overlay, _MapObject);
    
        function Overlay() {
            _classCallCheck(this, Overlay);
    
            return _possibleConstructorReturn(this, (Overlay.__proto__ || Object.getPrototypeOf(Overlay)).apply(this, arguments));
        }
    
        _createClass(Overlay, [{
            key: '_onOverlayDraw',
            value: function _onOverlayDraw() {
                if (this._drawTimer) {
                    return;
                }
    
                this._drawTimer = window.setTimeout(this._doDraw.bind(this), 200);
            }
        }, {
            key: '_doDraw',
            value: function _doDraw() {
                this._drawTimer = false;
                var div = this.Element;
                div.style.display = 'block'; // or offsetWidth/offsetHeight won't work
                div.style.position = 'absolute';
    
                var _overlayProjection = this._marker ? this._marker.getProjection() : null;
                if (!_overlayProjection) {
                    return;
                }
                var position = _overlayProjection.fromLatLngToDivPixel(this.Options.position);
    
                var w = parseInt(div.offsetWidth, 10);
                var h = parseInt(div.offsetHeight, 10);
                div.style.left = Math.floor(position.x - w / 2) + 'px';
                div.style.top = Math.floor(position.y - h / 2) + 'px';
    
                if (!this._isShown) {
                    // could have been hidden again by now..
                    div.style.display = 'none';
                }
            }
        }, {
            key: '_onOverlayShow',
            value: function _onOverlayShow() {
                if (!this._isShown) {
                    this._isShown = true;
                    this.Element.style.visibility = 'visible';
                }
            }
        }, {
            key: '_onOverlayHide',
            value: function _onOverlayHide() {
                if (this._isShown) {
                    this._isShown = false;
                    this.Element.style.visibility = 'hidden';
                }
            }
        }, {
            key: '_onOverlayToggle',
            value: function _onOverlayToggle() {
                if (this._div) {
                    if (this._div.style.visibility === 'hidden') {
                        return this._onOverlayShow();
                    }
                    this._onOverlayHide();
                }
            }
        }, {
            key: '_onOverlayAdd',
            value: function _onOverlayAdd() {
    
                var panes = this._marker.getPanes();
                var pane = panes[this.Options.pane || 'overlayLayer'];
                if (!pane) {
                    pane = panes.overlayLayer;
                }
                if (!pane) {
                    throw new Error('No pane to attach to');
                }
    
                pane.appendChild(this.Element);
            }
        }, {
            key: '_onOverlayRemove',
            value: function _onOverlayRemove() {
                if (this._div) {
                    this._div.parentNode.removeChild(this._div);
                }
                this._div = null;
            }
        }, {
            key: 'dispose',
            value: function dispose() {
                _get(Overlay.prototype.__proto__ || Object.getPrototypeOf(Overlay.prototype), 'dispose', this).call(this);
                this.hide();
                delete this._marker;
                this._marker = false;
            }
        }, {
            key: 'show',
            value: function show() {
                if (!this._isShown) {
                    if (this._isShown === undefined) {
                        this.Overlay.setMap(this.Map.Map);
                    } else {
                        this.Element.style.display = 'block';
                    }
                    this._isShown = true;
                    //            this.emit('show');
                }
                return this;
            }
        }, {
            key: 'hide',
            value: function hide() {
                if (this._isShown) {
                    this._isShown = false;
                    this.Element.style.display = 'none';
                    //            this.emit('hide');
                }
                return this;
            }
        }, {
            key: 'Marker',
            get: function get() {
                if (this._marker) {
                    return this._marker;
                }
                if (this._marker === false) {
                    throw new Error('Marker has been destroyed');
                }
    
                var customOverlay = function customOverlay() {};
                customOverlay.prototype = new this.Api.OverlayView();
                customOverlay.prototype.toggle = this._onOverlayToggle.bind(this);
                customOverlay.prototype.draw = this._onOverlayDraw.bind(this);
                customOverlay.prototype.show = this._onOverlayShow.bind(this);
                customOverlay.prototype.hide = this._onOverlayHide.bind(this);
                customOverlay.prototype.onAdd = this._onOverlayAdd.bind(this);
                customOverlay.prototype.onRemove = this._onOverlayRemove.bind(this);
                this._marker = new customOverlay();
                this.ZIndex = this.Options.zIndex || 0;
                return this._marker;
            }
        }, {
            key: 'Position',
            set: function set(value) {
                this.Options.position = value;
            },
            get: function get() {
                return this.Options.position;
            }
        }, {
            key: 'Overlay',
            get: function get() {
                return this.Marker;
            }
        }, {
            key: 'Element',
            get: function get() {
                var _this2 = this;
    
                if (!this._div) {
                    this._div = document.createElement('div');
                    Object.keys(this.Options.attributes || {}).filter(function (a) {
                        _this2._div.setAttribute(a, _this2.Options.attributes[a]);
                    });
                }
                return this._div;
            }
        }]);
    
        return Overlay;
    }(_MapObject3.default);
    
    exports.default = Overlay;
    
    },{"./MapObject":9}],12:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _Polyline2 = require('./Polyline');
    
    var _Polyline3 = _interopRequireDefault(_Polyline2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * @class Polygon
     * @extends Polyline
     */
    var Polygon = function (_Polyline) {
        _inherits(Polygon, _Polyline);
    
        function Polygon() {
            _classCallCheck(this, Polygon);
    
            return _possibleConstructorReturn(this, (Polygon.__proto__ || Object.getPrototypeOf(Polygon)).apply(this, arguments));
        }
    
        _createClass(Polygon, [{
            key: 'Marker',
    
    
            /**
             * Override the Marker accessor to return a Polygon
             * This allows all methods and accessors on Polyline to work properly.
             **/
            get: function get() {
                if (this._marker) {
                    return this._marker;
                }
                if (this._marker === false) {
                    throw new Error('Marker has been destroyed');
                }
                try {
                    this._marker = new this.Api.Polygon(this.Options);
                    this.addEventListener(this._marker, 'click', this.onClick.bind(this));
                } catch (e) {
                    console.warn('Could not create Polygon', e);
                    this._marker = false;
                }
    
                return this._marker;
            }
        }, {
            key: 'Polyline',
            get: function get() {
                return this.Marker;
            }
        }, {
            key: 'Polygon',
            get: function get() {
                return this.Marker;
            }
    
            // get Path and set Path are inherited
    
        }, {
            key: 'Paths',
            get: function get() {
                return this.Polygon ? this.Polygon.getPaths() || [] : [];
            },
            set: function set(paths) {
                var _this2 = this;
    
                if (!this.Polygon) {
                    return;
                }
    
                //        this._bounds = false;
                //        return this.Polygon ? this.Polygon.setPaths(paths) : undefined;
                //        this.Polygon.setPaths(paths);
    
                if (!this._mvcArrays) {
                    this._mvcArrays = new this.Api.MVCArray();
                }
    
                // LatLng without nowrap option, allowing optimization
                //        let _baseXb = new this.Api.LatLng()
                var LatLng = function LatLng(a, b) {
                    //            Ub(a);
                    //            b = a.lng;
                    //            a = a.lat;
                    this.lat = function () {
                        return a;
                    };
    
                    this.lng = function () {
                        return b;
                    };
                };
                LatLng.prototype = this.Api.LatLng.prototype;
    
                var toLatLng = function toLatLng(p) {
                    return new LatLng(p.lat, p.lng);
                };
    
                paths.forEach(function (p, i) {
                    if (_this2._mvcArrays.getLength() <= i) {
                        _this2._mvcArrays.setAt(i, new _this2.Api.MVCArray(p.map(toLatLng)));
                    } else {
                        var a = _this2._mvcArrays.getAt(i).getArray();
                        a.slice(a.length); // zero size
                        p.map(toLatLng).forEach(function (ll) {
                            a.push(ll);
                        });
                    }
                });
                while (this._mvcArrays.getLength() > paths.length) {
                    this._mvcArrays.removeAt(this._mvcArrays.getLength() - 1);
                }
                this._bounds = false;
                this.Polygon.setPaths(this._mvcArrays);
            }
        }, {
            key: 'Bounds',
            get: function get() {
                var bounds = this._bounds;
                if (!bounds) {
                    bounds = new this.Api.LatLngBounds();
                    this.Paths.forEach(function (path) {
                        path.forEach(function (c) {
                            bounds.extend(c);
                        });
                    });
                    this._bounds = bounds;
                }
                return bounds;
            }
        }]);
    
        return Polygon;
    }(_Polyline3.default);
    
    exports.default = Polygon;
    
    },{"./Polyline":13}],13:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _BaseMarker2 = require('./BaseMarker');
    
    var _BaseMarker3 = _interopRequireDefault(_BaseMarker2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * @class Polyline
     * @extends BaseMarker
     */
    var Polyline = function (_BaseMarker) {
        _inherits(Polyline, _BaseMarker);
    
        function Polyline() {
            _classCallCheck(this, Polyline);
    
            return _possibleConstructorReturn(this, (Polyline.__proto__ || Object.getPrototypeOf(Polyline)).apply(this, arguments));
        }
    
        _createClass(Polyline, [{
            key: 'onClick',
            value: function onClick(e) {
                this.emit('click', e);
            }
        }, {
            key: 'Marker',
    
    
            /**
             * Override the Marker accessor to return a Polyline
             **/
            get: function get() {
                if (this._marker) {
                    return this._marker;
                }
                if (this._marker === false) {
                    throw new Error('Marker has been destroyed');
                }
                try {
                    this._marker = new this.Api.Polyline(this.Options);
                    this.addEventListener(this._marker, 'click', this.onClick.bind(this));
                } catch (e) {
                    console.warn('Could not create Polyline', e);
                    this._marker = false;
                }
    
                return this._marker;
            }
        }, {
            key: 'Polyline',
            get: function get() {
                return this.Marker;
            }
    
            /**
             * @override
             */
    
        }, {
            key: 'ZIndex',
            set: function set(val) {
                this._zindex = val;
                this.Marker.setOptions({ zIndex: val });
            },
            get: function get() {
                return this._zindex;
            }
        }, {
            key: 'Path',
            get: function get() {
                return this.Marker ? this.Marker.getPath() : [];
            },
            set: function set(path) {
                this._bounds = false;
                return this.Marker ? this.Marker.setPath(path) : undefined;
            }
        }, {
            key: 'Editable',
            set: function set(value) {
                return this.Marker ? this.Marker.setEditable(value) : undefined;
            },
            get: function get() {
                return this.Marker ? this.Marker.getEditable() : undefined;
            }
        }, {
            key: 'Bounds',
            get: function get() {
                var _this2 = this;
    
                if (!this._bounds) {
                    this._bounds = new this.Api.LatLngBounds();
                    this.Path.forEach(function (c) {
                        _this2._bounds.extend(c);
                    });
                }
                return this._bounds;
            }
        }, {
            key: 'Center',
            get: function get() {
                return this.Bounds.getCenter();
            }
        }]);
    
        return Polyline;
    }(_BaseMarker3.default);
    
    exports.default = Polyline;
    
    },{"./BaseMarker":3}],14:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };
    
    var _Overlay2 = require('./Overlay');
    
    var _Overlay3 = _interopRequireDefault(_Overlay2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    /**
     * @class TextOverlay
     * @extends Overlay
     */
    var TextOverlay = function (_Overlay) {
        _inherits(TextOverlay, _Overlay);
    
        /**
         * @param options Object
         * @param options.text string
         * @param options.className string
         * @param options.position object lat-lng literal or gmaps LatLng object
         */
        function TextOverlay(parent, options) {
            _classCallCheck(this, TextOverlay);
    
            var _this = _possibleConstructorReturn(this, (TextOverlay.__proto__ || Object.getPrototypeOf(TextOverlay)).call(this, parent, options));
    
            if (typeof _this.Options.text === 'undefined') {
                throw new Error('text not specified in options');
            }
            if (typeof _this.Options.position === 'undefined') {
                throw new Error('position not specified in options');
            }
            return _this;
        }
    
        _createClass(TextOverlay, [{
            key: 'show',
            value: function show() {
                if (!this._txtEl) {
                    this._txtEl = document.createElement('span');
                    this._txtEl.innerHTML = this.Options.text;
                    if (this.Options.className) {
                        this._txtEl.setAttribute('class', this.Options.className);
                    }
                    this.Element.appendChild(this._txtEl);
                }
                _get(TextOverlay.prototype.__proto__ || Object.getPrototypeOf(TextOverlay.prototype), 'show', this).call(this);
            }
        }, {
            key: 'Text',
            get: function get() {
                return this.Options.Text;
            },
            set: function set(newText) {
                this.Options.text = newText;
                if (this._txtEl) {
                    this._txtEl.innerHTML = newText;
                }
            }
        }]);
    
        return TextOverlay;
    }(_Overlay3.default);
    
    exports.default = TextOverlay;
    
    },{"./Overlay":11}],15:[function(require,module,exports){
    "use strict";
    
    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    
    var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();
    
    var _MapObject2 = require("./MapObject");
    
    var _MapObject3 = _interopRequireDefault(_MapObject2);
    
    function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
    
    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
    
    function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }
    
    function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }
    
    var WMSLayer = function (_MapObject) {
        _inherits(WMSLayer, _MapObject);
    
        function WMSLayer() {
            var _ref;
    
            _classCallCheck(this, WMSLayer);
    
            for (var _len = arguments.length, rest = Array(_len), _key = 0; _key < _len; _key++) {
                rest[_key] = arguments[_key];
            }
    
            var _this = _possibleConstructorReturn(this, (_ref = WMSLayer.__proto__ || Object.getPrototypeOf(WMSLayer)).call.apply(_ref, [this].concat(rest)));
    
            _this._mapType = new _this.Api.ImageMapType({
                getTileUrl: function getTileUrl(coord, zoom) {
                    var proj = _this.Map.Map.getProjection();
                    var zfactor = Math.pow(2, zoom);
    
                    // get coordinates
                    var top = proj.fromPointToLatLng(new _this.Api.Point(coord.x * 256 / zfactor, coord.y * 256 / zfactor));
                    var bot = proj.fromPointToLatLng(new _this.Api.Point((coord.x + 1) * 256 / zfactor, (coord.y + 1) * 256 / zfactor));
    
                    //corrections for the slight shift of the SLP (mapserver)
                    var deltaX = 0; //0.0013;
                    var deltaY = 0; //0.00058;
    
                    //create the Bounding box string
                    var bbox = top.lng() + deltaX + "," + (bot.lat() + deltaY) + "," + (bot.lng() + deltaX) + "," + (top.lat() + deltaY);
    
                    //base WMS URL
                    var url = _this._getUrl();
                    url += "&BBOX=" + bbox; // set bounding box
                    return url; // return URL for the tile
                },
    
                tileSize: new _this.Api.Size(256, 256),
                isPng: true,
                projection: _this.Options.projection || false,
                name: _this.Options.name || 'wmsLayer',
                alt: _this.Options.alt || false,
                maxZoom: _this.Options.maxZoom || 19
            });
            return _this;
        }
    
        _createClass(WMSLayer, [{
            key: "_getUrl",
            value: function _getUrl() {
                return this.Options.url + (this.Options.url.indexOf('?') === -1 ? '?' : '&') + "REQUEST=GetMap" + //WMS operation
                "&STYLES=default" + "&SERVICE=WMS" + //WMS service
                "&VERSION=1.3.0" + //WMS version
                "&LAYERS=" + this.Options.layers + //WMS layers
                "&FORMAT=image/png" + //WMS format
                "&BGCOLOR=0xFFFFFF" + "&TRANSPARENT=TRUE" + "&CRS=" + (this.Options.crs || "EPSG:4326") + //set WGS84
                "&WIDTH=256" + "&HEIGHT=256";
            }
        }, {
            key: "moveToFront",
            value: function moveToFront() {
                throw new Error('Cannot moveToFront');
            }
        }, {
            key: "moveToBack",
            value: function moveToBack() {
                throw new Error('Cannot moveToBack');
            }
        }, {
            key: "setOpacity",
            value: function setOpacity(opacity) {
                this._mapType.setOpacity(opacity);
            }
        }, {
            key: "show",
            value: function show() {
                this.Map.Map.overlayMapTypes.push(this._mapType);
            }
        }, {
            key: "hide",
            value: function hide() {
                var _this2 = this;
    
                this.Map.Map.overlayMapTypes.forEach(function (omt, i) {
                    if (omt === _this2._mapType) {
                        _this2.Map.Map.overlayMapTypes.removeAt(i);
                    }
                });
            }
        }, {
            key: "MapType",
            get: function get() {
                return this._mapType;
            }
        }, {
            key: "Api",
            get: function get() {
                return this.Parent.Api;
            }
        }, {
            key: "Map",
            get: function get() {
                return this.Parent;
            }
        }]);
    
        return WMSLayer;
    }(_MapObject3.default);
    
    exports.default = WMSLayer;
    
    },{"./MapObject":9}]},{},[4])(4)
    });
    