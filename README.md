# mapshaper

### Introduction

Mapshaper is a program for simplifying cartographic lines while preserving the topological relationships between adjacent polygons and intersecting polyline paths. It can read and write Shapefile, GeoJSON and [TopoJSON](https://github.com/mbostock/topojson/wiki) files. You can find the current version online at [mapshaper.org](http://www.mapshaper.org).

### Installation

Mapshaper requires [Node.js](http://nodejs.org).

With Node installed, you can install the latest release version from the npm registry. Install with the "-g" flag to make the executable scripts available systemwide.

	npm install -g mapshaper

To install and run the latest development code from github:

	git clone git@github.com:mbloch/mapshaper.git
	cd mapshaper
	npm install
	bin/mapshaper-gui # use the web interface locally
	bin/mapshaper     # use the command line tool

### Interactive tool

The mapshaper distribution includes the script `mapshaper-gui`, which runs mapshaper's web interface locally. You can also visit [mapshaper.org](http://www.mapshaper.org) to use mapshaper online. All processing is done in the browser, so user data stays private.

Browser compatibility: mapshaper works in recent versions of Chrome and Firefox as well as IE 10+. Exporting is not supported in Safari. Firefox seems better able to handle large files (say >200MB) than other browsers without encountering out-of-memory errors.

### Command line tool

The `mapshaper` script runs well in OS X and has also been used successfully on Ubuntu 13.04 and Windows 8.

`$ mapshaper -p 0.1 --repair counties.shp`  Retain 10% of removable vertices using default simplification and remove line intersections.

`$ mapshaper -i 100 states.shp --dp `  Remove features smaller than ~100 meters using Douglas-Peucker simplification.

`$ mapshaper -h` Read a help message.

### Building and testing

You will need to regenerate mapshaper.js if you edit any of the files in the src/ or lib/ directories. Run `$ build` to update mapshaper.js (used by the command line tool); run `$ build gui` to update www/mapshaper.js (used by the web interface).

`$ build [gui] -f` continuously monitors source files and regenerates  mapshaper.js whenever a source file is modified.

Run `$ mocha` in the project directory to run mapshaper's tests.

### License

This software is licensed under the [MPL](http://www.mozilla.org/MPL/2.0/) 2.0

According to Mozilla's [FAQ](http://www.mozilla.org/MPL/2.0/FAQ.html), "The MPL's "file-level" copyleft is designed to encourage contributors to share modifications they make to your code, while still allowing them to combine your code with code under other licenses (open or proprietary) with minimal restrictions."

### Acknowledgements

Thanks to [Shan Carter](https://github.com/shancarter) for help designing mapshaper's web interface :)

And thanks to Mark Harrower for supporting development of the [original MapShaper program](http://mapshaper.com/test/OldMapShaper.swf) at the University of Wisconsin &ndash; Madison.

### Future development

To suggest improvements, add an [issue](https://github.com/mbloch/mapshaper/issues).
