/* @requires mapshaper-shapes */

// A collection of paths that can be filtered to exclude paths and points
// that can't be displayed at the current map scale. For drawing paths on-screen.
// TODO: Look into generalizing from Arc paths to SimpleShape and MultiShape
//
function FilteredPathCollection(unfilteredArcs, opts) {
  var defaults = {
        min_path: 0.9,   // min pixel size of a drawn path
        min_segment: 0.6 // min pixel size of a drawn segment
      };

  var _filterBounds,
      _transform,
      _sortedThresholds,
      filteredArcs,
      filteredSegLen,
      arcData,
      getPathWrapper;

  opts = Utils.extend(defaults, opts);
  init();

  function init() {
    // Sort simplification thresholds for all non-endpoint vertices
    // for quick conversion of simplification percentage to threshold value.
    // For large datasets, use every nth point, for faster sorting.
    var size = unfilteredArcs.getPointCount(),
        nth = Math.ceil(size / 5e5);
    _sortedThresholds = unfilteredArcs.getRemovableThresholds(nth);
    Utils.quicksort(_sortedThresholds, false);

    // For large datasets, create a filtered copy of the data for faster rendering
    if (size > 5e5) {
      initFilteredArcs();
    }
  }

  function initFilteredArcs() {
    var filterPct = 0.08;
    var filterZ = _sortedThresholds[Math.floor(filterPct * _sortedThresholds.length)];
    filteredArcs = unfilteredArcs.setRetainedInterval(filterZ).getFilteredCopy();
    unfilteredArcs.setRetainedPct(1); // clear simplification
    var avgXY = filteredArcs.getAverageSegment();
    filteredSegLen = avgXY[0] + avgXY[1]; // crude approximation of avg. segment length
  }

  this.update = function(arcs) {
    unfilteredArcs = arcs;
    init();
  };

  this.setRetainedPct = function(pct) {
    var z = _sortedThresholds[Math.floor(pct * _sortedThresholds.length)];
    this.setRetainedInterval(z);
  };

  this.setRetainedInterval = function(z) {
    unfilteredArcs.setRetainedInterval(z);
    if (filteredArcs) {
      filteredArcs.setRetainedInterval(z);
    }
  };

  this.reset = function() {
    _filterBounds = null;
    _transform = null;
    arcData = unfilteredArcs;
    getPathWrapper = getDrawablePathsIter;
    return this;
  };

  this.filterPaths = function(b) {
    _filterBounds = b;
    return this;
  };

  this.filterPoints = function(b) {
    _filterBounds = b;
    getPathWrapper = getDrawablePointsIter;
    return this;
  };

  this.transform = function(tr) {
    var unitsPerPixel = 1/tr.mx;
    _transform = tr;
    if (_filterBounds) {
      _filterBounds = _filterBounds.clone().transform(tr);
    }
    // Use a filtered version of the arcs at small scales
    if (filteredArcs && unitsPerPixel > filteredSegLen * 1.5) {
      arcData = filteredArcs;
    }

    return this;
  };

  // Wrap path iterator to filter out offscreen points
  //
  function getDrawablePointsIter() {
    var bounds = _filterBounds || error("#getDrawablePointsIter() missing bounds");
    var src = getDrawablePathsIter(),
        wrapped;
    var wrapper = {
      x: 0,
      y: 0,
      node: false,
      hasNext: function() {
        var path = wrapped;
        while (path.hasNext()) {
          if (bounds.containsPoint(path.x, path.y)) {
            this.x = path.x;
            this.y = path.y;
            this.node = path.node;
            return true;
          }
        }
        return false;
      }
    };

    return function(iter) {
      wrapped = iter;
      return wrapper;
    };
  }

  // Wrap vector path iterator to convert geographic coordinates to pixels
  //   and skip over invisible clusters of points (i.e. smaller than a pixel)
  //
  function getDrawablePathsIter() {
    var transform = _transform || error("#getDrawablePathsIter() Missing a Transform object; remember to call .transform()");
    var wrapped,
        _firstPoint,
        _minSeg = opts.min_segment;

    var wrapper = {
      x: 0,
      y: 0,
      hasNext: function() {
        var t = transform, mx = t.mx, my = t.my, bx = t.bx, by = t.by;
        var path = wrapped,
            isFirst = _firstPoint,
            x, y, prevX, prevY,
            i = 0;
        if (!isFirst) {
          prevX = this.x;
          prevY = this.y;
        }
        while (path.hasNext()) {
          i++;
          x = path.x * mx + bx;
          y = path.y * my + by;
          if (isFirst || Math.abs(x - prevX) > _minSeg || Math.abs(y - prevY) > _minSeg) {
            break;
          }
        }
        if (i === 0) return false;
        _firstPoint = false;
        this.x = x;
        this.y = y;
        return true;
      }
    };
    return function(iter) {
      _firstPoint = true;
      wrapped = iter;
      return wrapper;
    };
  }

  // TODO: refactor
  //
  this.forEach = function(cb) {
    var src = arcData;

    var allIn = true,
        filterOnSize = !!(_transform && _filterBounds),
        arc = new Arc(src),
        wrap = getPathWrapper(),
        minPathSize, geoBounds, geoBBox;

    if (filterOnSize) {
      minPathSize = opts.min_path / _transform.mx;
      geoBounds = _filterBounds.clone().transform(_transform.invert());
      geoBBox = geoBounds.toArray();
      allIn = geoBounds.contains(src.getBounds());
    }

    for (var i=0, n=src.size(); i<n; i++) {
      arc.init(i);
      if (filterOnSize && arc.smallerThan(minPathSize)) continue;
      if (!allIn && !arc.inBounds(geoBBox)) continue;
      cb(wrap(arc.getPathIter()));
    }
  };
}