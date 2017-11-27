export function getMultipliedLayers(layers) {
  let result = [];
  for (let layer in layers) {
    if (layers.hasOwnProperty(layer)) {
      result.push(`${layers[layer]}*2.5`);
    }
  }
  return result.join(",");
}

export function b64DecodeUnicode(str) {
    if (str.includes("=")) {
      str = str.replace(/=/g, "") //remove all '='
    }
    try {
      atob(str)
    }catch(e) {
      return ''
    }
    return decodeURIComponent(atob(str).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

export function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
  }

export function getPolyfill() {
  if (!Array.prototype.includes) {
    Object.defineProperty(Array.prototype, "includes", {
      value: function(searchElement, fromIndex) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If len is 0, return false.
        if (len === 0) {
          return false;
        }

        // 4. Let n be ? ToInteger(fromIndex).
        //    (If fromIndex is undefined, this step produces the value 0.)
        var n = fromIndex | 0;

        // 5. If n ≥ 0, then
        //  a. Let k be n.
        // 6. Else n < 0,
        //  a. Let k be len + n.
        //  b. If k < 0, let k be 0.
        var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

        function sameValueZero(x, y) {
          return x === y ||
            (typeof x === "number" &&
              typeof y === "number" &&
              isNaN(x) &&
              isNaN(y));
        }

        // 7. Repeat, while k < len
        while (k < len) {
          // a. Let elementK be the result of ? Get(O, ! ToString(k)).
          // b. If SameValueZero(searchElement, elementK) is true, return true.
          // c. Increase k by 1.
          if (sameValueZero(o[k], searchElement)) {
            return true;
          }
          k++;
        }

        // 8. Return false
        return false;
      }
    });
  }

  if (!Array.prototype.map) {
    Array.prototype.map = function(callback /*, thisArg*/) {
      var T, A, k;

      if (this == null) {
        throw new TypeError("this is null or not defined");
      }

      // 1. Let O be the result of calling ToObject passing the |this|
      //    value as the argument.
      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get internal
      //    method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0;

      // 4. If IsCallable(callback) is false, throw a TypeError exception.
      // See: http://es5.github.com/#x9.11
      if (typeof callback !== "function") {
        throw new TypeError(callback + " is not a function");
      }

      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
      if (arguments.length > 1) {
        T = arguments[1];
      }

      // 6. Let A be a new array created as if by the expression new Array(len)
      //    where Array is the standard built-in constructor with that name and
      //    len is the value of len.
      A = new Array(len);

      // 7. Let k be 0
      k = 0;

      // 8. Repeat, while k < len
      while (k < len) {
        var kValue, mappedValue;
        if (k in O) {
          // i. Let kValue be the result of calling the Get internal
          //    method of O with argument Pk.
          kValue = O[k];

          // ii. Let mappedValue be the result of calling the Call internal
          //     method of callback with T as the this value and argument
          //     list containing kValue, k, and O.
          mappedValue = callback.call(T, kValue, k, O);

          // For best browser support, use the following:
          A[k] = mappedValue;
        }
        // d. Increase k by 1.
        k++;
      }

      // 9. return A
      return A;
    };
  }

  if (!String.prototype.includes) {
    String.prototype.includes = function(search, start) {
      "use strict";
      if (typeof start !== "number") {
        start = 0;
      }

      if (start + search.length > this.length) {
        return false;
      } else {
        return this.indexOf(search, start) !== -1;
      }
    };
  }
}
