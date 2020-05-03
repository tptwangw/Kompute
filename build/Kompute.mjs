(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.Kompute = global.Kompute || {})));
}(this, (function (exports) { 'use strict';

var Vector3D = function Vector3D(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
};

Vector3D.prototype.set = function (x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
  return this;
};

Vector3D.prototype.copy = function (vect) {
  return this.set(vect.x, vect.y, vect.z);
};

Vector3D.prototype.clone = function () {
  return new Vector3D().copy(this);
};

Vector3D.prototype.multiplyScalar = function (scalar) {
  this.set(this.x * scalar, this.y * scalar, this.z * scalar);
  return this;
};

var VectorPool = function VectorPool(size) {
  this.index = 0;

  this.vectors = [];
  for (var i = 0; i < size; i++) {
    this.vectors.push(new Vector3D());
  }
};

VectorPool.prototype.get = function () {
  var vect = this.vectors[this.index++];
  if (this.index == this.vectors.length) {
    this.index = 0;
  }
  return vect;
};

var vectorPool = new VectorPool(10);

var Box = function Box(centerPosition, size) {
  this.min = new Vector3D();
  this.max = new Vector3D();

  this.setFromCenterAndSize(centerPosition, size);
};

Box.prototype.setFromCenterAndSize = function (center, size) {
  var half = vectorPool.get().copy(size).multiplyScalar(0.5);
  this.min.set(center.x - half.x, center.y - half.y, center.z - half.z);
  this.max.set(center.x + half.x, center.y + half.y, center.z + half.z);
  return this;
};

var Nearby = function Nearby(width, height, depth, binSize) {
  this.limitBox = this.createBox(0, 0, 0, width, height, depth);
  this.binSize = binSize;

  this.bin = new Map();

  this.reusableResultMap = new Map();
};

Nearby.prototype.createBox = function (x, y, z, width, height, depth) {
  var bb = {};

  bb.containsBox = function (box) {
    return this.minX <= box.minX && box.maxX <= this.maxX && this.minY <= box.minY && box.maxY <= this.maxY && this.minZ <= box.minZ && box.maxZ <= this.maxZ;
  };

  bb.setFromCenterAndSize = function (x, y, z, width, height, depth) {
    var halfWidth = width / 2;
    var halfHeight = height / 2;
    var halfDepth = depth / 2;

    this.minX = x - halfWidth;
    this.maxX = x + halfWidth;
    this.minY = y - halfHeight;
    this.maxY = y + halfHeight;
    this.minZ = z - halfDepth;
    this.maxZ = z + halfDepth;
  };

  bb.setFromCenterAndSize(x, y, z, width, height, depth);

  return bb;
};

Nearby.prototype.createObject = function (id, box) {
  var self = this;

  var obj = {
    id: id,
    box: box,
    binInfo: new Map()
  };

  return obj;
};

Nearby.prototype.insert = function (obj) {
  if (!this.limitBox.containsBox(obj.box)) {
    return;
  }

  var BIN_SIZE = this.binSize;

  var box = obj.box;
  var minX = box.minX;
  var minY = box.minY;
  var minZ = box.minZ;
  var maxX = box.maxX;
  var maxY = box.maxY;
  var maxZ = box.maxZ;

  var round = Math.round(minX / BIN_SIZE) * BIN_SIZE;
  var minXLower, minXUpper;
  if (round <= minX) {
    minXLower = round;
    minXUpper = minXLower + BIN_SIZE;
  } else {
    minXUpper = round;
    minXLower = round - BIN_SIZE;
  }

  round = Math.round(maxX / BIN_SIZE) * BIN_SIZE;
  var maxXLower, maxXUpper;
  if (round < maxX) {
    maxXLower = round;
    maxXUpper = maxXLower + BIN_SIZE;
  } else {
    maxXUpper = round;
    maxXLower = round - BIN_SIZE;
  }
  if (minXLower > maxXLower) {
    maxXLower = minXLower;
  }

  round = Math.round(minY / BIN_SIZE) * BIN_SIZE;
  var minYLower, minYUpper;
  if (round <= minY) {
    minYLower = round;
    minYUpper = minYLower + BIN_SIZE;
  } else {
    minYUpper = round;
    minYLower = round - BIN_SIZE;
  }

  round = Math.round(maxY / BIN_SIZE) * BIN_SIZE;
  var maxYLower, maxYUpper;
  if (round < maxY) {
    maxYLower = round;
    maxYUpper = maxYLower + BIN_SIZE;
  } else {
    maxYUpper = round;
    maxYLower = round - BIN_SIZE;
  }
  if (minYLower > maxYLower) {
    maxYLower = minYLower;
  }

  round = Math.round(minZ / BIN_SIZE) * BIN_SIZE;
  var minZLower, minZUpper;
  if (round <= minZ) {
    minZLower = round;
    minZUpper = minZLower + BIN_SIZE;
  } else {
    minZUpper = round;
    minZLower = round - BIN_SIZE;
  }

  round = Math.round(maxZ / BIN_SIZE) * BIN_SIZE;
  var maxZLower, maxZUpper;
  if (round < maxZ) {
    maxZLower = round;
    maxZUpper = maxZLower + BIN_SIZE;
  } else {
    maxZUpper = round;
    maxZLower = round - BIN_SIZE;
  }
  if (minZLower > maxZLower) {
    maxZLower = minZLower;
  }

  for (var x = minXLower; x <= maxXLower; x += BIN_SIZE) {
    for (var y = minYLower; y <= maxYLower; y += BIN_SIZE) {
      for (var z = minZLower; z <= maxZLower; z += BIN_SIZE) {
        if (!this.bin.has(x)) {
          this.bin.set(x, new Map());
        }
        if (!this.bin.get(x).has(y)) {
          this.bin.get(x).set(y, new Map());
        }
        if (!this.bin.get(x).get(y).has(z)) {
          this.bin.get(x).get(y).set(z, new Map());
        }
        this.bin.get(x).get(y).get(z).set(obj, true);

        if (!obj.binInfo.has(x)) {
          obj.binInfo.set(x, new Map());
        }
        if (!obj.binInfo.get(x).has(y)) {
          obj.binInfo.get(x).set(y, new Map());
        }
        obj.binInfo.get(x).get(y).set(z, true);
      }
    }
  }
};

Nearby.prototype.query = function (x, y, z) {
  var BIN_SIZE = this.binSize;

  var rX = Math.round(x / BIN_SIZE) * BIN_SIZE;
  var rY = Math.round(y / BIN_SIZE) * BIN_SIZE;
  var rZ = Math.round(z / BIN_SIZE) * BIN_SIZE;

  var minX, maxX;
  if (rX <= x) {
    minX = rX;
    maxX = rX + BIN_SIZE;
  } else {
    maxX = rX;
    minX = rX - BIN_SIZE;
  }
  var minY, maxY;
  if (rY <= y) {
    minY = rY;
    maxY = rY + BIN_SIZE;
  } else {
    maxY = rY;
    minY = rY - BIN_SIZE;
  }
  var minZ, maxZ;
  if (rZ <= z) {
    minZ = rZ;
    maxZ = rZ + BIN_SIZE;
  } else {
    maxZ = rZ;
    minZ = rZ - BIN_SIZE;
  }

  var result = this.reusableResultMap;
  result.clear();

  for (var xDiff = -BIN_SIZE; xDiff <= BIN_SIZE; xDiff += BIN_SIZE) {
    for (var yDiff = -BIN_SIZE; yDiff <= BIN_SIZE; yDiff += BIN_SIZE) {
      for (var zDiff = -BIN_SIZE; zDiff <= BIN_SIZE; zDiff += BIN_SIZE) {
        var keyX = minX + xDiff;
        var keyY = minY + yDiff;
        var keyZ = minZ + zDiff;
        if (this.bin.has(keyX) && this.bin.get(keyX).has(keyY)) {
          var res = this.bin.get(keyX).get(keyY).get(keyZ);
          if (res) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = res.keys()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var obj = _step.value;

                result.set(obj, true);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                  _iterator.return();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }
          }
        }
      }
    }
  }

  return result;
};

Nearby.prototype.delete = function (obj) {
  var binInfo = obj.binInfo;

  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = binInfo.keys()[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var x = _step2.value;
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = binInfo.get(x).keys()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var y = _step4.value;
          var _iteratorNormalCompletion5 = true;
          var _didIteratorError5 = false;
          var _iteratorError5 = undefined;

          try {
            for (var _iterator5 = binInfo.get(x).get(y).keys()[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
              var z = _step5.value;

              if (this.bin.has(x) && this.bin.get(x).has(y) && this.bin.get(x).get(y).has(z)) {
                this.bin.get(x).get(y).get(z).delete(obj);
                if (this.bin.get(x).get(y).get(z).size == 0) {
                  this.bin.get(x).get(y).delete(z);
                }
                if (this.bin.get(x).get(y).size == 0) {
                  this.bin.get(x).delete(y);
                }
                if (this.bin.get(x).size == 0) {
                  this.bin.delete(x);
                }
              }
            }
          } catch (err) {
            _didIteratorError5 = true;
            _iteratorError5 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion5 && _iterator5.return) {
                _iterator5.return();
              }
            } finally {
              if (_didIteratorError5) {
                throw _iteratorError5;
              }
            }
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2.return) {
        _iterator2.return();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  var _iteratorNormalCompletion3 = true;
  var _didIteratorError3 = false;
  var _iteratorError3 = undefined;

  try {
    for (var _iterator3 = binInfo.keys()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
      var x = _step3.value;

      binInfo.delete(x);
    }
  } catch (err) {
    _didIteratorError3 = true;
    _iteratorError3 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion3 && _iterator3.return) {
        _iterator3.return();
      }
    } finally {
      if (_didIteratorError3) {
        throw _iteratorError3;
      }
    }
  }
};

Nearby.prototype.update = function (obj, x, y, z, width, height, depth) {
  obj.box.setFromCenterAndSize(x, y, z, width, height, depth);

  this.delete(obj);
  this.insert(obj);
};

var World = function World(width, height, depth, binSize) {
  this.nearby = new Nearby(width, height, depth, binSize);

  this.entititesByID = {};
};

World.prototype.getEntityByID = function (entityID) {
  return this.entititesByID[entityID] || null;
};

World.prototype.insertEntity = function (entity) {

  this.entititesByID[entity.id] = entity;

  var center = entity.position;
  var size = entity.size;

  var nearbyBox = this.nearby.createBox(center.x, center.y, center.z, size.x, size.y, size.z);
  var nearbyObj = this.nearby.createObject(entity.id, nearbyBox);
  this.nearby.insert(nearbyObj);

  entity.world = this;
  entity.nearbyObject = nearbyObj;
};

World.prototype.updateEntity = function (entity, position, size) {
  this.nearby.update(entity.nearbyObject, position.x, position.y, position.z, size.x, size.y, size.z);
};

var Entity = function Entity(id, center, size) {
  this.id = id;
  this.size = size;
  this.position = center.clone();

  this.nearbyObject = null;
};

Entity.prototype.setPosition = function (position) {
  this.position.copy(position);

  if (this.world) {
    this.world.updateEntity(this, this.position, this.size);
  }
};

exports.Vector3D = Vector3D;
exports.VectorPool = VectorPool;
exports.Box = Box;
exports.World = World;
exports.Entity = Entity;

Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=Kompute.mjs.map
