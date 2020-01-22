
# GoogleMaps

A wrapper around loading and creation of Google Maps instances in a single page DOM.

Basic abstractions and management for Layers, (Icon)Markers, Polylines and Polygons included.

## Generate the documentation

    $ npm install
    $ ./node_modules/.bin/jsdoc -c jsdoc.conf

Then, navigate to the `doc/es6-google-maps/<version>/` directory with a browser and open `index.html`.

## Usage

### Create global instance of GoogleMaps

To handle loading and instance management there needs to exist exactly one global
instance of the GoogleMaps class.


	import GoogleMaps from 'managed-google-maps';

	let GoogleMaps = new GoogleMaps({apiKey: process.env.GOOGLE_MAPS_API_KEY||''});

### Accessing the Google Maps Api
By using the `GoogleMaps.Api` property, you can get access to the Google Maps Api directly.
	NOTE: Take great care not to confuse Google Maps objects with objects in this package, they are only mixable
with some effort!

### Create map instance
To create a new map instance, call the `createMap()` method on the global `GoogleMaps` instance,
with the appropriate options. Options are the same as for creating a regular Google Map instance.

	let mapInst = GoogleMaps.create({el: document.getElementById('map1'), zoom: 8});

This will return a new `MapInstance`. When ready to show the map (i.e added layers etc),
call `show()`:

	mapInst.show();

### Manipulating map instances
To access the Google Maps `Map` object of a `MapInstance`, use the `Map` property.


### Layers

#### Overview
A map is composed of multiple layers. Each layer can hold a number of map objects, and has a defined
order in which it is rendered. Layers are *owned by the map instance*, and disposed when an instance
is. There can be any number of layers in any map instance, and can each be hidden or visible at any
given time. It is also possible (and useful) to toggle the visibility of individual objects within a
layer.

##### Creating a layer
To create a new layer and add it to a map, simply call `createLayer()` on the map instance.


	let myLayer = mapInst.createLayer();


#### Manipulating layers

The layer does not directly map to a Google Maps object, but has shorthand methods for visibility
and ordering of map objects within it.

##### Add & modify contents of layer
The Layer class returned has methods to manage what and how objects are displayed within it.

		remove(obj) 		- remove an object from the internal list ofw objects
		moveToFront(obj)	- move the object to the front of the internal list
		moveToBack(obj)		- move the object to the back of the internal list
		show([obj|[o1,o2]])	- show all or a specific or a list of objects within the layer.
							  If the object is not already in the internal list, it is added
							  to the end of the list.
		hide([obj|[o1,o2]])	- hide all or a specific object or a list of objects within the layer.
							  If some object does not exist in the layer, an error is thrown

##### Displaying a layer
To actually display a Layer, call `addLayer(layer)` on the map instance object. This will call `show()`
on each object in the layer, which may cause it to be created.


##### Remove
When a layer is never to be used again, call `disposeLayer(layer)` on the map instance to both remove
it from the map and call `dispose()` on the layer (alternatively you can call `dispose()` directly on
the layer instance, but that will NOT remove it from the map instance, you have to ensure that youself!)




### Map Objects
There are several types of objects that can be displayed and interacted with in a Layer<

- a _MapMarker_ typically displays a single icon on a specific geographical position.
- a _Polyline_ displays a segmented line, where each segment is also treated as a separate sub-object.
- a _Polygon_ displays an outlined, enclosed 2D shape, possibly filled, defined by multiple geographical positions.

All subclasses of [BaseMarker](BaseMarker.html) can display any kind of object, a marker, overlay or geometry.


## Classes

- [GoogleMaps](GoogleMaps.html)
- [BaseMarker](BaseMarker.html)
- [InfoWindow](InfoWindow.html)
- [MapLayer](MapLayer.html)
- [MapObject](MapObject.html)
- [MultiPolygon](MultiPolygon.html)
- [Overlay](Overlay.html)
- [TextOverlay](TextOverlay.html)
- [Polygon](Polygon.html)
- [Polyline](Polyline.html)
