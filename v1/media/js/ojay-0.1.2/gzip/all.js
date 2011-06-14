/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
*/
/**
 * Copyright (c) 2007-2008 James Coglan
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Parts of this software are derived from the following open-source projects:
 *
 * - The Prototype framework, (c) 2005-2007 Sam Stephenson
 * - Alex Arnell's Inheritance library, (c) 2006, Alex Arnell
 * - Base, (c) 2006-7, Dean Edwards
 */

Function.prototype.bind = function() {
  if (arguments.length < 2 && arguments[0] === undefined) return this;
  var __method = this, args = Array.from(arguments), object = args.shift();
  return function() {
    return __method.apply(object, args.concat(Array.from(arguments)));
  };
};

Array.from = function(iterable) {
  if (!iterable) return [];
  if (iterable.toArray) return iterable.toArray();
  var length = iterable.length, results = new Array(length);
  while (length--) results[length] = iterable[length];
  return results;
};

Function.prototype.callsSuper = function() {
  return /\bcallSuper\b/.test(this.toString());
};

if (typeof JS == 'undefined') JS = {};

JS.extend = function(object, methods) {
  for (var prop in methods) object[prop] = methods[prop];
};

JS.method = function(name) {
  var cache = this._methodCache = this._methodCache || {};
  if (cache[name] && cache[name].func == this[name])
    return cache[name].bound;
  cache[name] = {func: this[name], bound: this[name].bind(this)};
  return cache[name].bound;
};

JS.Class = function() {
  var args = Array.from(arguments), arg,
      parent = (typeof args[0] == 'function') ? args.shift() : null,
      klass = arguments.callee.create(parent),
      faces = [], I = JS.Interface;
  while (arg = args.shift()) {
    klass.include(arg);
    faces = faces.concat(arg.implement || []);
  }
  if (faces.length && I)
    I.ensure.apply(I, [klass.prototype].concat(faces));
  if (parent && typeof parent.inherited == 'function')
    parent.inherited(klass);
  return klass;
};

JS.extend(JS.Class, {
  
  create: function(parent) {
    var klass = function() {
      this.initialize.apply(this, arguments);
    };
    this.ify(klass);
    if (parent) this.subclass(parent, klass);
    var p = klass.prototype;
    p.klass = p.constructor = klass;
    klass.include(this.INSTANCE_METHODS, false);
    klass.instanceMethod('extend', this.INSTANCE_METHODS.extend, false);
    return klass;
  },
  
  ify: function(klass, noExtend) {
    klass.superclass = klass.superclass || Object;
    klass.subclasses = klass.subclasses || [];
    if (noExtend === false) return klass;
    for (var method in this.CLASS_METHODS) {
      if (this.CLASS_METHODS.hasOwnProperty(method))
        klass[method] = this.CLASS_METHODS[method];
    }
    return klass;
  },
  
  subclass: function(superclass, klass) {
    this.ify(superclass, false);
    klass.superclass = superclass;
    superclass.subclasses.push(klass);
    var bridge = function() {};
    bridge.prototype = superclass.prototype;
    klass.prototype = new bridge();
    klass.extend(superclass);
    return klass;
  },
  
  addMethod: function(object, superObject, name, func) {
    if (JS.MethodChain) JS.MethodChain.addMethods([name]);
    
    if (typeof func != 'function') return (object[name] = func);
    if (!func.callsSuper()) return (object[name] = func);
    
    var method = function() {
      var _super = superObject[name], args = Array.from(arguments), currentSuper = this.callSuper, result;
      if (typeof _super == 'function') this.callSuper = function() {
        var i = arguments.length;
        while (i--) args[i] = arguments[i];
        return _super.apply(this, args);
      };
      result = func.apply(this, arguments);
      currentSuper ? this.callSuper = currentSuper : delete this.callSuper;
      return result;
    };
    method.valueOf = function() { return func; };
    method.toString = function() { return func.toString(); };
    object[name] = method;
  },
  
  INSTANCE_METHODS: {
    initialize: function() {},
    
    method: JS.method,
    
    extend: function(source) {
      for (var method in source) {
        if (source.hasOwnProperty(method))
          JS.Class.addMethod(this, this.klass.prototype, method, source[method]);
      }
      return this;
    },
    
    isA: function(klass) {
      var _class = this.klass;
      while (_class) {
        if (_class === klass) return true;
        _class = _class.superclass;
      }
      return false;
    }
  },
  
  CLASS_METHODS: {
    include: function(source, overwrite) {
      var modules, i, n, inc = source.include, ext = source.extend;
      if (inc) {
        modules = [].concat(inc);
        for (i = 0, n = modules.length; i < n; i++)
          this.include(modules[i], overwrite);
      }
      if (ext) {
        modules = [].concat(ext);
        for (i = 0, n = modules.length; i < n; i++)
          this.extend(modules[i], overwrite);
      }
      for (var method in source) {
        if (!/^(?:included?|extend|implement)$/.test(method))
          this.instanceMethod(method, source[method], overwrite);
      }
      if (typeof source.included == 'function') source.included(this);
      return this;
    },
    
    instanceMethod: function(name, func, overwrite) {
      if (!this.prototype[name] || overwrite !== false)
        JS.Class.addMethod(this.prototype, this.superclass.prototype, name, func);
      return this;
    },
    
    extend: function(source, overwrite) {
      if (typeof source == 'function') source = JS.Class.properties(source);
      for (var method in source) {
        if (source.hasOwnProperty(method))
          this.classMethod(method, source[method], overwrite);
      }
      return this;
    },
    
    classMethod: function(name, func, overwrite) {
      for (var i = 0, n = this.subclasses.length; i < n; i++)
        this.subclasses[i].classMethod(name, func, false);
      if (!this[name] || overwrite !== false)
        JS.Class.addMethod(this, this.superclass, name, func);
      return this;
    },
    
    method: JS.method
  },
  
  properties: function(klass) {
    var properties = {}, prop, K = this.ify(function(){});
    loop: for (var method in klass) {
      for (prop in K) { if (method == prop) continue loop; }
      properties[method] = klass[method];
    }
    return properties;
  }
});

JS.Interface = JS.Class({
  initialize: function(methods) {
    this.test = function(object, returnName) {
      var n = methods.length;
      while (n--) {
        if (typeof object[methods[n]] != 'function')
          return returnName ? methods[n] : false;
      }
      return true;
    };
  },
  
  extend: {
    ensure: function() {
      var args = Array.from(arguments), object = args.shift(), face, result;
      while (face = args.shift()) {
        result = face.test(object, true);
        if (result !== true) throw new Error('object does not implement ' + result + '()');
      }
    }
  }
});

JS.Singleton = function() {
  var klass = JS.Class.apply(JS, arguments), result = new klass();
  klass.instanceMethod('initialize', function() {
    throw new Error('Singleton classes cannot be reinstantiated');
  });
  return result;
};

JS.Module = function(source) {
  return {
    included: function(klass) {
      klass.include(source);
    }
  };
};

/**
 * Copyright (c) 2007-2008 James Coglan
 * http://jsclass.jcoglan.com
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

JS.MethodChain = (function() {
  
  var klass = function(base) {
    var queue = [], baseObject = base || {};
    
    this.____ = function(method, args) {
      queue.push({func: method, args: args});
    };
    
    this.fire = function(base) {
      var object = base || baseObject, method, property;
      loop: for (var i = 0, n = queue.length; i < n; i++) {
        method = queue[i];
        if (object instanceof klass) {
          object.____(method.func, method.args);
          continue;
        }
        switch (typeof method.func) {
          case 'string':    property = object[method.func];       break;
          case 'function':  property = method.func;               break;
          case 'object':    object = method.func; continue loop;  break;
        }
        object = (typeof property == 'function')
            ? property.apply(object, method.args)
            : property;
      }
      return object;
    };
  };
  
  klass.prototype = {
    _: function() {
      var func = arguments[0], args = [];
      if (!/^(?:function|object)$/.test(typeof func)) return this;
      for (var i = 1, n = arguments.length; i < n; i++)
        args.push(arguments[i]);
      this.____(func, args);
      return this;
    },
    
    toFunction: function() {
      var chain = this;
      return function(object) { return chain.fire(object); };
    }
  };
  
  var reserved = (function() {
    var names = [], key;
    for (key in new klass) names.push(key);
    return new RegExp('^(?:' + names.join('|') + ')$');
  })();
  
  klass.addMethods = function(object) {
    var methods = [], property, i, n,
        self = this.prototype;
    
    for (property in object) {
      if (Number(property) != property) methods.push(property);
    }
    if (object instanceof Array) {
      for (i = 0, n = object.length; i < n; i++) {
        if (typeof object[i] == 'string') methods.push(object[i]);
      }
    }
    for (i = 0, n = methods.length; i < n; i++)
      (function(name) {
        if (reserved.test(name)) return;
        self[name] = function() {
          this.____(name, arguments);
          return this;
        };
      })(methods[i]);
    
    if (object.prototype)
      this.addMethods(object.prototype);
  };
  
  klass.inherited = function() {
    throw new Error('MethodChain cannot be subclassed');
  };
  
  return klass;
})();

var it = its = function() { return new JS.MethodChain; };

JS.Class.INSTANCE_METHODS.wait = function(time) {
  var chain = new JS.MethodChain;
  switch (true) {
    case typeof time == 'number' :
      setTimeout(chain.fire.bind(chain, this), time * 1000);
      break;
    case this.forEach && typeof time == 'function' :
      this.forEach(function() {
        setTimeout(chain.fire.bind(chain, arguments[0]), time.apply(this, arguments) * 1000);
      });
      break;
  }
  return chain;
};

/**
 * Copyright (c) 2007-2008 James Coglan
 * http://jsclass.jcoglan.com
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

JS.Observable = (function() {
  
  var methods = {
    addObserver: function(observer, context) {
      this._observers = this._observers || [];
      this._observers.push({block: observer, context: context || null});
    },
    
    removeObserver: function(observer, context) {
      this._observers = this._observers || [];
      context = context || null;
      for (var i = 0, n = this.countObservers(); i < n; i++) {
        if (this._observers[i].block == observer && this._observers[i].context == context) {
          this._observers.splice(i,1);
          return;
        }
      }
    },
    
    removeObservers: function() {
      this._observers = [];
    },
    
    countObservers: function() {
      this._observers = this._observers || [];
      return this._observers.length;
    },
    
    notifyObservers: function() {
      if (!this.isChanged()) return;
      for (var i = 0, n = this.countObservers(), observer; i < n; i++) {
        observer = this._observers[i];
        observer.block.apply(observer.context, arguments);
      }
    },
    
    setChanged: function(state) {
      this._changed = !(state === false);
    },
    
    isChanged: function() {
      if (this._changed === undefined) this._changed = true;
      return !!this._changed;
    }
  };
  
  methods.subscribe   = methods.addObserver;
  methods.unsubscribe = methods.removeObserver;
  
  return JS.Module(methods);
})();

/**
 * <p>Returns an object that wraps a collection of DOM element references by parsing
 * the given query using a CSS selector engine.</p>
 * <p>Aliased as <tt>_()</tt>.</p>
 * @params {String|Array} query A CSS or XPath selector string, or an array of HTMLElements
 * @returns {DomCollection} A collection of DOM nodes matching the query string
 */
var Ojay = function() {
    var elements = [], arg, i, n;
    for (i = 0, n = arguments.length; i < n; i++) {
        arg = arguments[i];
        if (typeof arg == 'string') arg = Ojay.query(arg);
        if (arg.toArray) arg = arg.toArray();
        if (!(arg instanceof Array)) arg = [arg];
        elements = elements.concat(arg);
    }
    return new Ojay.DomCollection(elements.unique());
};

(function(Dom) {
    JS.extend(Ojay, /** @scope Ojay */{
        
        VERSION: '0.1.2',
        
        query: YAHOO.util.Selector.query,
        
        /**
         * <p>Returns an Ojay Collection containing zero or one element that matches the ID. Used
         * for situations where IDs contains dots, slashes, etc.</p>
         * @param {String} id
         * @returns {DomCollection}
         */
        byId: function(id) {
            var element = document.getElementById(id);
            return new this.DomCollection(element ? [element] : []);
        },
        
        /**
         * <p>Changes the alias of the <tt>Ojay()</tt> function to the given <tt>alias</tt>.
         * If the alias is already the name of an existing function, that function will be
         * stored and overridden. The next call to <tt>changeAlias</tt> or <tt>surrenderAlias</tt>
         * will restore the original function.</p>
         * @param {String} alias
         */
        changeAlias: function(alias) {
            this.surrenderAlias();
            this.ALIAS = String(alias);
            this.__alias = (typeof window[this.ALIAS] == 'undefined') ? null : window[this.ALIAS];
            window[this.ALIAS] = this;
        },
        
        /**
         * <p>Gives control of the shorthand function back to whichever script implemented
         * it before Ojay. After using this function, use the <tt>Ojay()</tt> function
         * instead of the shorthand.</p>
         * @returns {Boolean} true if the shorthand function was changed, false otherwise
         */
        surrenderAlias: function() {
            if (this.__alias === null) {
                if (this.ALIAS) delete window[this.ALIAS];
                return false;
            }
            window[this.ALIAS] = this.__alias;
            return true;
        },
        
        /**
         * <p>Tells Ojay to trace calls to the methods you name. Only accepts methods on
         * <tt>Ojay.DomCollection.prototype</tt>.</p>
         * @param {String*} The name(s) of methods you want to log
         */
        log: function() {
            Array.from(arguments).forEach(function(method) {
                this[method] = this[method].traced(method + '()');
            }, Ojay.DomCollection.prototype);
        },
        
        /**
         * <p>Returns an object with width and height properties specifying the size of the
         * document.</p>
         * @returns {Object}
         */
        getDocumentSize: function() {
            return {
                width: Dom.getDocumentWidth(),
                height: Dom.getDocumentHeight()
            };
        },
        
        /**
         * <p>Returns an object with left and top properties specifying the scroll offsets
         * document.</p>
         * @returns {Object}
         */
        getScrollOffsets: function() {
            return {
                left: Dom.getDocumentScrollLeft(),
                top: Dom.getDocumentScrollTop()
            };
        },
        
        /**
         * <p>Returns an object with width and height properties specifying the size of the
         * viewport.</p>
         * @returns {Object}
         */
        getViewportSize: function() {
            return {
                width: Dom.getViewportWidth(),
                height: Dom.getViewportHeight()
            };
        }
    });
})(YAHOO.util.Dom);

Ojay.changeAlias('$');

/**
 * <p>This object contains definitions for <tt>Array</tt> instance methods defined
 * by Mozilla in JavaScript versions 1.6 and 1.8. They are applied to the <tt>Array</tt>
 * prototype as required to bring all browsers up to scratch.</p>
 *
 * <p>Definitions are taken from <a
 * href="http://developer.mozilla.org/en/docs/Core_JavaScript_1.5_Reference:Global_Objects:Array#Methods">Mozilla's
 * implementations</a> (made available under the MIT license).</p>
 */
Ojay.ARRAY_METHODS = {
    
    /**
     * <p>Returns the first index at which a given element can be found in the array, or
     * <tt>-1</tt> if it is not present.</p>
     */
    indexOf: function(elt /*, from*/) {
        var len = this.length;
        
        var from = Number(arguments[1]) || 0;
        from = (from < 0) ? Math.ceil(from) : Math.floor(from);
        if (from < 0) from += len;
        
        for (; from < len; from++) {
            if (from in this && this[from] === elt)
                return from;
        }
        return -1;
    },
    
    /**
     * <p>Returns the last index at which a given element can be found in the array, or
     * <tt>-1</tt> if it is not present. The array is searched backwards,
     * starting at <tt>fromIndex</tt>.</p>
     */
    lastIndexOf: function(elt /*, from*/) {
        var len = this.length;
        
        var from = Number(arguments[1]);
        if (isNaN(from)) {
            from = len - 1;
        }
        else {
          from = (from < 0) ? Math.ceil(from) : Math.floor(from);
          if (from < 0)
                from += len;
          else if (from >= len)
                from = len - 1;
        }
        
        for (; from > -1; from--) {
            if (from in this && this[from] === elt)
                return from;
        }
        return -1;
    },
    
    /**
     * <p><tt>filter</tt> calls a provided callback function once for each element in an
     * array, and constructs a new array of all the values for which <tt>callback</tt>
     * returns a <tt>true</tt> value. <tt>callback</tt> is invoked only for indexes of
     * the array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values. Array elements which do not pass
     * the callback test are simply skipped, and are not included in the new array.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>filter</tt>, it will be
     * used as the <tt>this</tt> for each invocation of the callback. If it is not provided,
     * or is <tt>null</tt>, the global object associated with callback is used instead.</p>
     *
     * <p><tt>filter</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by filter is set before the first invocation of
     * <tt>callback</tt>. Elements which are appended to the array after the call to
     * <tt>filter</tt> begins will not be visited by <tt>callback</tt>. If existing elements
     * of the array are changed, or deleted, their value as passed to <tt>callback</tt> will
     * be the value at the time <tt>filter</tt> visits them; elements that are deleted are
     * not visited.</p>
     */
    filter: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var res = new Array();
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this) {
                var val = this[i]; // in case fun mutates this
                if (fun.call(thisp, val, i, this))
                    res.push(val);
            }
        }
        
        return res;
    },
    
    /**
     * <p><tt>forEach</tt> executes the provided function (<tt>callback</tt>) once for each
     * element present in the array. <tt>callback</tt> is invoked only for indexes of the
     * array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>forEach</tt>, it will be used
     * as the <tt>this</tt> for each invocation of the callback. If it is not provided, or is
     * <tt>null</tt>, the global object associated with <tt>callback</tt> is used instead.</p>
     *
     * <p><tt>forEach</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>forEach</tt> is set before the first
     * invocation of <tt>callback</tt>. Elements which are appended to the array after the call
     * to <tt>forEach</tt> begins will not be visited by <tt>callback</tt>. If existing elements
     * of the array are changed, or deleted, their value as passed to <tt>callback</tt> will be
     * the value at the time <tt>forEach</tt> visits them; elements that are deleted are not
     * visited.</p>
     */
    forEach: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                fun.call(thisp, this[i], i, this);
        }
    },
    
    /**
     * <p><tt>every</tt> executes the provided callback function once for each element
     * present in the array until it finds one where <tt>callback</tt> returns a
     * <tt>false</tt> value. If such an element is found, the <tt>every</tt> method
     * immediately returns <tt>false</tt>. Otherwise, if <tt>callback</tt> returned a
     * <tt>true</tt> value for all elements, <tt>every</tt> will return <tt>true</tt>.
     * <tt>callback</tt> is invoked only for indexes of the array which have assigned
     * values; it is not invoked for indexes which have been deleted or which have never
     * been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element,
     * the index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>every</tt>, it will be
     * used as the <tt>this</tt> for each invocation of the callback. If it is not
     * provided, or is <tt>null</tt>, the global object associated with <tt>callback</tt>
     * is used instead.</p>
     *
     * <p><tt>every</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>every</tt> is set before the first
     * invocation of <tt>callback</tt>. Elements which are appended to the array after
     * the call to <tt>every</tt> begins will not be visited by <tt>callback</tt>. If
     * existing elements of the array are changed, their value as passed to <tt>callback</tt>
     * will be the value at the time <tt>every</tt> visits them; elements that are deleted
     * are not visited. <tt>every</tt> acts like the "for all" quantifier in mathematics.
     * In particular, for an empty array, it returns <tt>true</tt>. (It is vacuously true
     * that all elements of the empty set satisfy any given condition.)</p>
     */
    every: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this && !fun.call(thisp, this[i], i, this))
                return false;
        }
        
        return true;
    },
    
    /**
     * <p><tt>map</tt> calls a provided callback function once for each element in an array,
     * in order, and constructs a new array from the results. <tt>callback</tt> is invoked
     * only for indexes of the array which have assigned values; it is not invoked for
     * indexes which have been deleted or which have never been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>map</tt>, it will be used as
     * the <tt>this</tt> for each invocation of the callback. If it is not provided, or is
     * <tt>null</tt>, the global object associated with <tt>callback</tt> is used instead.</p>
     *
     * <p><tt>map</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>map</tt> is set before the first invocation
     * of <tt>callback</tt>. Elements which are appended to the array after the call to
     * <tt>map</tt> begins will not be visited by <tt>callback</tt>. If existing elements of
     * the array are changed, or deleted, their value as passed to <tt>callback</tt> will be
     * the value at the time <tt>map</tt> visits them; elements that are deleted are not
     * visited.</p>
     */
    map: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var res = new Array(len);
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                res[i] = fun.call(thisp, this[i], i, this);
        }
        
        return res;
    },
    
    /**
     * <p><tt>some</tt> executes the callback function once for each element present in the
     * array until it finds one where <tt>callback</tt> returns a <tt>true</tt> value. If such
     * an element is found, <tt>some</tt> immediately returns <tt>true</tt>. Otherwise,
     * <tt>some</tt> returns <tt>false</tt>. <tt>callback</tt> is invoked only for indexes of
     * the array which have assigned values; it is not invoked for indexes which have been
     * deleted or which have never been assigned values.</p>
     *
     * <p><tt>callback</tt> is invoked with three arguments: the value of the element, the
     * index of the element, and the <tt>Array</tt> object being traversed.</p>
     *
     * <p>If a <tt>thisObject</tt> parameter is provided to <tt>some</tt>, it will be used as
     * the <tt>this</tt> for each invocation of the callback. If it is not provided, or is
     * <tt>null</tt>, the global object associated with <tt>callback</tt> is used instead.</p>
     *
     * <p><tt>some</tt> does not mutate the array on which it is called.</p>
     *
     * <p>The range of elements processed by <tt>some</tt> is set before the first invocation
     * of <tt>callback</tt>. Elements that are appended to the array after the call to
     * <tt>some</tt> begins will not be visited by <tt>callback</tt>. If an existing, unvisited
     * element of the array is changed by <tt>callback</tt>, its value passed to the visiting
     * callback will be the value at the time that <tt>some</tt> visits that element's index;
     * elements that are deleted are not visited.</p>
     */
    some: function(fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this && fun.call(thisp, this[i], i, this))
                return true;
        }
        
        return false;
    },
    
    /**
     * <p>Apply a function simultaneously against two values of the array (from
     * left-to-right) as to reduce it to a single value.</p>
     *
     * <p><tt>reduce</tt> executes the callback function once for each element present in the
     * array, excluding holes in the array, receiving four arguments: the initial value (or
     * value from the previous callback call), the value of the current element, the current
     * index, and the array over which iteration is occurring.</p>
     */
    reduce: function(fun /*, initial*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        // no value to return if no initial value and an empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();
        
        var i = 0;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        }
        else {
            do {
                if (i in this) {
                    rv = this[i++];
                    break;
                }
                
                // if array contains no values, no initial value to return
                if (++i >= len)
                    throw new TypeError();
            } while (true);
        }
        
        for (; i < len; i++) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }
        
        return rv;
    },
    
    /**
     * <p>Apply a function simultaneously against two values of the array (from
     * right-to-left) as to reduce it to a single value.</p>
     *
     * <p><tt>reduceRight</tt> executes the callback function once for each element present in
     * the array, excluding holes in the array, receiving four arguments: the initial value (or
     * value from the previous callback call), the value of the current element, the current
     * index, and the array over which iteration is occurring.</p>
     */
    reduceRight: function(fun /*, initial*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();
        
        // no value to return if no initial value, empty array
        if (len == 0 && arguments.length == 1)
            throw new TypeError();
        
        var i = len - 1;
        if (arguments.length >= 2) {
            var rv = arguments[1];
        }
        else {
            do {
                if (i in this) {
                    rv = this[i--];
                    break;
                }
                
                // if array contains no values, no initial value to return
                if (--i < 0)
                    throw new TypeError();
            } while (true);
        }
        
        for (; i >= 0; i--) {
            if (i in this)
                rv = fun.call(null, rv, this[i], i, this);
        }
        
        return rv;
    },
    
    /**
     * <p>Returns a new array containing all the elements of the original array but with
     * any duplicate entries removed.</p>
     * @returns {Array}
     */
    unique: function() {
        var results = [], i, n, arg;
        for (i = 0, n = this.length; i < n; i++) {
            arg = this[i];
            if (results.indexOf(arg) == -1)
                results.push(arg);
        }
        return results;
    },
    
    /**
     * <p>A shorthand for <tt>array.filter(func).length</tt>.</p>
     */
    count: function(fun, thisp) {
        return this.filter(fun, thisp).length;
    }
};

JS.extend(Array.prototype, Ojay.ARRAY_METHODS);

/**
 * Functional extensions: Copyright (c) 2005-2008 Sam Stephenson / the Prototype team,
 * released under an MIT-style license.
 */
JS.extend(Function.prototype, /** @scope Function.prototype */{
    
    /**
     * <p>Returns a new function that does the same thing as the original function, but has
     * some of its arguments preset. A contrived example:</p>
     *
     * <pre><code>    var add = function(a, b) { return a + b; };
     *     add(3, 5)  // --> 8
     *     
     *     var add12 = add.partial(12);  // 'a' is preset to 12
     *     add12(7)  // --> 19</code></pre>
     *
     * <p>More information <a href="http://prototypejs.org/api/function/curry">in the
     * Prototype documentation</a>. (Prototype calls this method <tt>curry</tt>, though
     * that's not strictly what it does.)</p>
     *
     * @returns {Function}
     */
    partial: function() {
        if (!arguments.length) return this;
        var method = this, args = Array.from(arguments);
        return function() {
            return method.apply(this, args.concat(Array.from(arguments)));
        };
    },
    
    /**
     * <p>Returns a copy of the function that is self-currying, i.e. every time you call it, it
     * returns a curried version of itself until it's got all its required arguments.</p>
     *
     * <pre><code>    var adder = function(a,b,c) {
     *         return a + b + c;
     *     };
     *     
     *     var add = adder.curry();
     *     
     *     add(1)(2)(3)  // --> 6
     *     add(7,8)(23)  // --> 38</code></pre>
     *
     * @param {Number} n The number of required arguments (optional, will be inferred from the argument list)
     */
    curry: function(n) {
        var method = this, n = n || this.length;
        return function() {
            if (arguments.length >= n) return method.apply(this, arguments);
            return method.partial.apply(arguments.callee, arguments);
        };
    },
    
    /**
     * <p>Allows you to 'intercept' calls to existing functions and manipulate their input and
     * output, providing aspect-oriented programming functionality. More information and
     * examples <a href="http://prototypejs.org/api/function/wrap">in the Prototype docs</a>.</p>
     * @param {Function} wrapper The function to wrap around the original function
     * @returns {Function} The wrapped function
     */
    wrap: function(wrapper) {
        var method = this;
        return function() {
            return wrapper.apply(this, [method.bind(this)].concat(Array.from(arguments))); 
        };
    },
    
    /**
     * <p>Returns a version of the function that, rather taking some argument <tt>foo</tt> as
     * its first argument, can be applied as a method of <tt>foo</tt>.</p>
     *
     * <pre><code>    var hexToDec = function(string) {
     *         var number = ... // convert hex string to decimal
     *         return number;
     *     };
     *     
     *     hexToDec('ff')   // --> 255
     *     
     *     String.prototype.hexToDec = hexToDec.methodize();
     *     'ff'.hexToDec()  // --> 255</code></pre>
     *
     * @returns {Function}
     */
    methodize: function() {
        if (this._methodized) return this._methodized;
        var method = this;
        return this._methodized = function() {
            return method.apply(null, [this].concat(Array.from(arguments)));
        };
    },
    
    /**
     * <p>Effectively does the opposite of <tt>methodize</tt>: it converts a function from a
     * method that uses <tt>this</tt> to refer to its operand, into one that takes the operand
     * as its first argument. This is useful for building iterators, amongst other things.</p>
     *
     * <pre><code>    var upper = "".toUpperCase.functionize();
     *     var strings = ['foo', 'bar', 'baz', ... ];
     *     
     *     var caps = strings.map(upper);
     *     // --> ['FOO', 'BAR', 'BAZ', ... ]</code></pre>
     */
    functionize: function() {
        if (this._functionized) return this._functionized;
        var method = this;
        return this._functionized = function() {
            var args = Array.from(arguments);
            return method.apply(args.shift(), args);
        };
    },
    
    /**
     * <p>Returns a function that returns the result of applying the function to its arguments,
     * but that logs its input and output to the Firebug console. Derived from a similar function
     * in Oliver Steele's Functional library.</p>
     *
     * Copyright: Copyright 2007 by Oliver Steele.  All rights reserved.
     * http://osteele.com/sources/javascript/functional/
     */
    traced: function(name) {
        var method = this, name = name || this;
        return function() {
            window.console && console.info(name, 'called on', this, 'with', arguments);
            var result = method.apply(this, arguments);
            window.console && console.info(name, '->', result);
            return result;
        };
    }
});

/**
 * String extensions: Copyright (c) 2005-2008 Sam Stephenson / the Prototype team,
 * released under an MIT-style license.
 */

String.SCRIPT_FRAGMENT = '<script[^>]*>([\\S\\s]*?)<\/script>';

JS.extend(String.prototype, /** @scope String.prototype */{
    
    /**
     * <p>Returns an array containing the content of any <tt>&lt;script&gt;</tt> tags present
     * in the string.</p>
     * @returns {Array}
     */
    extractScripts: function() {
        var matchAll = new RegExp(String.SCRIPT_FRAGMENT, 'img');
        var matchOne = new RegExp(String.SCRIPT_FRAGMENT, 'im');
        return (this.match(matchAll) || []).map(function(scriptTag) {
            return (scriptTag.match(matchOne) || ['', ''])[1];
        });
    },
    
    /**
     * <p>Extracts the content of any <tt>&lt;script&gt;</tt> tags present in the string and
     * <tt>eval</tt>s them. Returns an array containing the return value of each evaluated
     * script.</p>
     */
    evalScripts: function() {
        return this.extractScripts().map(function(script) { return eval(script); });
    },
    
    /**
     * <p>Returns a copy of the string with all &lt;script&gt; tags removed.</p>
     * @returns {String}
     */
    stripScripts: function() {
        return this.replace(new RegExp(String.SCRIPT_FRAGMENT, 'img'), '');
    },
    
    /**
     * <p>Returns a copy of the string with all HTML tags removed.</p>
     * @returns {String}
     */
    stripTags: function() {
        return this.replace(/<\/?[^>]+>/gi, '').trim();
    },
    
    /**
     * <p>Returns a copy of the string with all leading and trailing whitespace removed.</p>
     * @returns {String}
     */
    trim: YAHOO.lang.trim.methodize()
});

/**
 * @overview
 * <p>Ojay adds all the single-number functions in <tt>Math</tt> as methods to <tt>Number</tt>.
 * The following methods can all be called on numbers:</p>
 *
 * <pre><code>abs, acos, asin, atan, ceil, cos, exp, floor, log, pow, round, sin, sqrt, tan</code></pre>
 */
'abs acos asin atan ceil cos exp floor log pow round sin sqrt tan'.split(/\s+/).
        forEach(function(method) {
            Number.prototype[method] = Math[method].methodize();
        });

/**
 * Copyright (c) 2007-2008 James Coglan
 * http://blog.jcoglan.com/reiterate/
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

Function.from = function(iterator) {
  if (iterator.toFunction) return iterator.toFunction();
  if (typeof iterator == 'function') return iterator;
  if (typeof iterator == 'object') return Function.fromObject(iterator);
  return function(x) { return x; };
};

String.prototype.toFunction = function() {
  var properties = this.split('.');
  if (!properties[0]) return function(x) { return x; };
  return function(o) {
    var object, member = o, key;
    for (var i = 0, n = properties.length; i < n; i++) {
      key = properties[i];
      object = member;
      member = object[key];
      if (typeof member == 'function') member = member.apply(object);
    }
    return member;
  };
};

Array.prototype.toFunction = function() {
  var method = this[0], args = this.slice(1);
  if (!method) return function(x) { return x; };
  return function(o) {
    var fn = (typeof method == 'function') ? method : o[method];
    return (typeof fn == 'function') ? fn.apply(o, args) : undefined;
  };
};

Function.fromObject = function(object) {
  var keys = [];
  for (var field in object) { if (object.hasOwnProperty(field)) keys.push(field); }
  if (keys.length === 0) return function(x) { return x; };
  return function(o) {
    var result = true, key, fn, args;
    for (var i = 0, n = keys.length; i < n; i++) {
      key = keys[i];
      fn = o[key]; args = object[key];
      if (typeof fn == 'function' && !(args instanceof Array)) args = [args];
      result = result && ((typeof fn == 'function') ? fn.apply(o, args) : fn == args);
    }
    return result;
  };
};

'filter forEach every map some'.split(/\s+/).forEach(function(method) {
  this[method] = this[method].wrap(function(fn, iterator, thisObject) {
    if (iterator) iterator = Function.from(iterator);
    return fn(iterator, thisObject);
  });
}, Array.prototype);

(function(Event) {
    JS.extend(Ojay, /** @scope Ojay */{
        /**
         * <p>Pre-built callback that stops the default browser reaction to an event.</p>
         * @param {DomCollection} element
         * @param {Event} evnt
         */
        stopDefault: function(element, evnt) {
            Event.preventDefault(evnt);
        },
        
        /**
         * <p>Pre-built callback that stops the event bubbling up the DOM tree.</p>
         * @param {DomCollection} element
         * @param {Event} evnt
         */
        stopPropagate: function(element, evnt) {
            Event.stopPropagation(evnt);
        },
        
        /**
         * <p>Pre-built callback that both stops the default behaviour and prevents bubbling.</p>
         * @param {DomCollection} element
         * @param {Event} evnt
         */
        stopEvent: function(element, evnt) {
            Ojay.stopDefault(element, evnt);
            Ojay.stopPropagate(element, evnt);
        },
        
        _getTarget: function() { return Ojay(Event.getTarget(this)); }
    });
    
    Ojay.stopDefault.method     = Ojay.stopDefault.partial(null).methodize();
    Ojay.stopPropagate.method   = Ojay.stopPropagate.partial(null).methodize();
    Ojay.stopEvent.method       = Ojay.stopEvent.partial(null).methodize();
    
    ['onDOMReady', 'onContentReady', 'onAvailable'].forEach(function(method) {
        Ojay[method] = Event[method].bind(Event);
    });
})(YAHOO.util.Event);

(function(Dom) {
    /**
     * <p>Wraps collections of DOM element references with an API for manipulation of page
     * elements. Includes methods for getting/setting class names and style attributes,
     * traversing the DOM, and setting up event handlers.</p>
     * @constructor
     * @class DomCollection
     */
    Ojay.DomCollection = JS.Class(/** @scope Ojay.DomCollection.prototype */{
        
        /**
         * @param {Array} collection An array of HTMLElement references
         * @returns {DomCollection} A reference to the DomCollection instance
         */
        initialize: function(collection) {
            this.length = 0;
            for (var i = 0, n = collection.length, nodeType, push = [].push; i < n; i++) {
                nodeType = collection[i].nodeType;
                if (nodeType === Ojay.HTML.ELEMENT_NODE ||
                    nodeType === Ojay.HTML.DOCUMENT_NODE ||
                    collection[i] == window)
                    push.call(this, collection[i]);
            }
            this.node = this[0];
            return this;
        },
        
        /**
         * <p>Returns the elements of the collection as a native Array type.</p>
         * @returns {Array}
         */
        toArray: function() {
            var results = [], i, n = this.length;
            for (i = 0; i < n; i++) results.push(this[i]);
            return results;
        },
        
        /**
         * <p> Returns a <tt>DomCollection</tt> wrapping the <tt>n</tt>th element in the current
         * collection.</p>
         * @param {Number} n
         * @returns {DomCollection}
         */
        at: function(n) {
            return new this.klass([this[Number(n).round()]]);
        },
        
        /**
         * <p>Registers event listeners on all the members of the collection. You must supply at
         * least the name of the event to listen for, and you can supply a callback function and
         * (optionally) its scope as well. This method returns a <tt>MethodChain</tt> so you can
         * write more sentence-like code without needing to write explicit callback functions. Some
         * examples:</p>
         *
         * <pre><code>    Ojay('p').on('click').setStyle({textDecoration: 'underline'});
         *     
         *     Ojay('p').on('mouseout').hide().parents().setStyle( ... );
         *     
         *     Ojay('li').on('click')._('h1#title').setStyle({color: '#f00'});</code></pre>
         *
         * <p>When using chaining like this, the method chain is fired only on the element that
         * triggers each event, not on the whole collection you called <tt>on()</tt> on.</p>
         *
         * <p>When using explicit callback functions, the callback receives on <tt>Ojay</tt> object
         * wrapping the element that triggered the event, and the event object as arguments. If you
         * supply your own scope parameter, <tt>this</tt> refers to your supplied object inside the
         * callback.</p>
         *
         * <pre><code>    Ojay('div').on('click', function(element, ev) {
         *         // 'this' does not refer to anything useful
         *     });
         *     
         *     Ojay('p').on('mouseout', function(element, ev) {
         *         // 'this' refers to the object 'someObject'
         *     }, someObject);</code></pre>
         *
         * <p>Even when you supply an explicit function, <tt>on()</tt> returns a <tt>MethodChain</tt>
         * so you can use the chaining feature as well. You can store a reference to this collector
         * so you can modify the event handler at a later time, <em>without actually creating any new
         * handlers</em>:</p>
         *
         * <pre><code>    var chain = Ojay('a.external').on('click');
         *
         *     // somewhere else...
         *     chain.addClass('clicked');</code></pre>
         *
         * <p>Any <tt>a.external</tt> will then gain the class name when it is clicked.</p>
         *
         * <p>There is one final subtlety: if you supply a second argument that is NOT a function, it
         * will be used as the base object for any chain firings. e.g.:</p>
         *
         * <pre><code>    // When these &lt;p&gt;s are clicked, the &lt;h1&gt; changes
         *     Ojay('p.changer').on('click', Ojay('h1')).setStyle({textTransform: 'uppercase'})</code></pre>
         *
         *
         * <p>Ojay gives you easy control of how the browser should respond to events. Inside your
         * callback function, you can prevent the event's default behaviour and stop it bubbling up
         * the DOM like so:</p>
         *
         * <pre><ocde>    Ojay('a').on('click', function(element, ev) {
         *         ev.stopDefault();
         *         // ... your custom behaviour
         *     });</code></pre>
         *
         * <p><tt>stopDefault</tt> stops the browser running the default behaviour for the event, e.g.
         * loading a new page when a link is clicked. The method <tt>stopPropagate</tt> stops the
         * event bubbling, and <tt>stopEvent</tt> does both. If all your callback does is call one
         * of these methods, you can use on of Ojay's pre-stored callbacks instead:</p>
         *
         * <pre><code>    Ojay('a').on('click', Ojay.stopDefault).setStyle({textDecoration: 'underline'});</code></pre>
         *
         * <p>You can use <tt>stopDefault</tt>, <tt>stopPropagate</tt> and <tt>stopEvent</tt> in this
         * manner. Using these is recommended over writing your own callbacks to do this, as creating
         * new identical functions wastes memory.</p>
         *
         * @param {String} eventName The name of the event to listen for
         * @param {Function} callback An optional callback function
         * @param {Object} scope An object to act as the execution scope for the callback (optional)
         * @returns {MethodChain}
         */
        on: function(eventName, callback, scope) {
            var collector = new JS.MethodChain();
            if (callback && typeof callback != 'function') scope = callback;
            YAHOO.util.Event.addListener(this, eventName, function(evnt) {
                var wrapper = Ojay(this);
                evnt.stopDefault   = Ojay.stopDefault.method;
                evnt.stopPropagate = Ojay.stopPropagate.method;
                evnt.stopEvent     = Ojay.stopEvent.method;
                evnt.getTarget     = Ojay._getTarget;
                if (typeof callback == 'function') callback.call(scope || null, wrapper, evnt);
                collector.fire(scope || wrapper);
            });
            return collector;
        },
        
        /**
         * <p>Runs an animation on all the elements in the collection. The method expects you to supply
         * at last an object specifying CSS properties to animate, and the duration of the animation.</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({marginLeft: {to: 200}}, 1.5)</code></pre>
         *
         * <p>Functions can be used for any of these values to apply a different animation to each element
         * in the collection. Each function is passed the element's position in the collection (<tt>i</tt>)
         * and the element itself (<tt>el</tt>), and is evaluated just before the animation begins. <tt>el</tt>
         * is actually a <tt>DomCollection</tt> wrapping a single element. For example, to animate some
         * list elements out by a staggered amount, do:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({
         *        marginLeft: {
         *            to: function(i, el) { return 40 * i; }
         *        }
         *    }, 2.0);</code></pre>
         *
         * <p>The functions can appear at any level of the <tt>parameters</tt> object, so you could write
         * the above as:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate(function(i, el) {
         *        return {
         *            marginLeft: {to: 40 * i}
         *        };
         *    }, 2.0);</code></pre>
         *
         * <p>or</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({
         *        marginLeft: function(i, el) {
         *            return {to: 40 * i};
         *        }
         *    }, 2.0);</code></pre>
         *
         * <p>This allows for highly flexible animation definitions. You can also specify a function as
         * the <tt>duration</tt> parameter, so that each element takes a different time to animate:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({marginLeft: {to: 200}},
         *            function(i) { return 0.5 + 2.0 * (i/5).sin().abs(); });</code></pre>
         *
         * <p>The final parameter, <tt>options</tt>, allows you to specify various optional arguments to
         * control the animation. They are:</p>
         *
         * <p><tt>easing</tt>: The easing function name (from <tt>YAHOO.util.Easing</tt>) to control the
         * flow of the animation. Default is <tt>'easeBoth'</tt>.</p>
         *
         * <p>An example:</p>
         *
         * <pre><code>   Ojay('#some-list li').animate({marginLeft: {to: 40}}, 5.0, {easing: 'elasticOut'});</code></pre>
         *
         * @param {Object|Function} parameters
         * @param {Number|Function} duration
         * @param {Object} options
         * @returns {MethodChain}
         */
        animate: function(parameters, duration, options) {
            var animation = new Ojay.Animation(this, parameters, duration, options);
            animation.run();
            return animation.chain;
        },
        
        /**
         * <p>Adds the given string as a class name to all the elements in the collection and returns
         * a reference to the collection for chaining.</p>
         * @param {String} className A string of space-separated class names
         * @returns {DomCollection}
         */
        addClass: function(className) {
            Dom.addClass(this, String(className));
            return this;
        },
        
        /**
         * <p>Removes the given class name(s) from all the elements in the collection and returns a
         * reference to the collection for chaining.</p>
         * @param {String} className A string of space-separated class names
         * @returns {DomCollection}
         */
        removeClass: function(className) {
            Dom.removeClass(this, String(className));
            return this;
        },
        
        /**
         * <p>Replaces oldClass with newClass for every element in the collection and returns a
         * reference to the collection for chaining.</p>
         * @param {String} oldClass The class name to remove
         * @param {String} newClass The class name to add
         * @returns {DomCollection}
         */
        replaceClass: function(oldClass, newClass) {
            Dom.replaceClass(this, String(oldClass), String(newClass));
            return this;
        },
        
        /**
         * <p>Sets the class name of all the elements in the collection to the given value and
         * returns a reference to the collection for chaining.</p>
         * @param {String} className A string of space-separated class names
         * @returns {DomCollection}
         */
        setClass: function(className) {
            for (var i = 0, n = this.length; i < n; i++)
                this[i].className = String(className);
            return this;
        },
        
        /**
         * <p>Returns true iff the first member of the collection has the given class name.</p>
         * @param {String} className The class name to test for
         * @returns {Boolean}
         */
        hasClass: function(className) {
            if (!this.node) return undefined;
            return Dom.hasClass(this.node, String(className));
        },
        
        /**
         * <p>Returns the value of the named style property for the first element in the collection.</p>
         * @param {String} name The name of the style value to get (camelCased)
         */
        getStyle: function(name) {
            if (!this.node) return undefined;
            return Dom.getStyle(this.node, String(name));
        },
        
        /**
         * <p>Sets the style of all the elements in the collection using a series of key/value pairs.
         * Keys correspond to CSS style property names, and should be camel-cased where they would
         * be hyphentated in style sheets. Returns the <tt>DomCollection</tt> instance for chaining.
         * You need to use a string key for <tt>'float'</tt> as it's a reserved word in JavaScript.</p>
         *
         * <pre><code>    Ojay('p').setStyle({color: '#f00', fontSize: '14px', 'float': 'left'});</code></pre>
         *
         * @param {Object} options A series of key/value pairs
         * @returns {DomCollection} A reference to the DomCollection instance
         */
        setStyle: function(options) {
            var value, isIE = !!YAHOO.env.ua.ie;
            for (var property in options) {
                if (isIE && property == 'opacity') {
                    value = Number(options[property]);
                    if (value === 0) options[property] = 0.01;
                    if (value === 1) {
                        Dom.setStyle(this, 'filter', '');
                        continue;
                    }
                }
                Dom.setStyle(this, property, options[property]);
            }
            return this;
        },
        
        /**
         * <p>Sets the given HTML attributes of all the elements in the collection, and returns the
         * collection for chaining. Remember to use <tt>className</tt> for classes, and <tt>htmlFor</tt>
         * for label attributes.</p>
         *
         * <pre><code>    Ojay('img').setAttributes({src: 'images/tom.png'});</code></pre>
         *
         * @param Object options
         * @returns DomCollection
         */
        setAttributes: function(options) {
            for (var i = 0, n = this.length; i < n; i++) {
                for (var key in options)
                    this[i][key] = options[key];
            }
            return this;
        },
        
        /**
         * <p>Hides every element in the collection and returns the collection.</p>
         * @returns {DomCollection}
         */
        hide: function() {
            this.setStyle({display: 'none'});
            return this;
        },
        
        /**
         * <p>Shows/unhides every element in the collection and returns the collection.</p>
         * @returns {DomCollection}
         */
        show: function() {
            this.setStyle({display: ''});
            return this;
        },
        
        /**
         * <p>If <tt>html</tt> is a string, sets the <tt>innerHTML</tt> of every element in the
         * collection to the given string value. If <tt>html</tt> is an <tt>HTMLElement</tt>, inserts
         * the element into the first item in the collection (inserting DOM nodes multiple times just
         * moves them from place to place).</p>
         * @param {String|HTMLElement} html A string of HTML to fill the elements
         * @returns {DomCollection}
         */
        setContent: function(html) {
            if (!this.node) return this;
            if (html && html.nodeType === Ojay.HTML.ELEMENT_NODE) {
                this.node.innerHTML = '';
                this.node.appendChild(html);
            } else {
                this.toArray().forEach(function(element) {
                    element.innerHTML = String(html);
                });
            }
            return this;
        },
        
        /**
         * <p>Inserts the given <tt>html</tt> (a <tt>String</tt> or an <tt>HTMLElement</tt>) into every
         * element in the collection at the given <tt>position</tt>. <tt>position</tt> can be one of
         * <tt>'top'</tt>, <tt>'bottom'</tt>, <tt>'before'</tt> or <tt>'after'</tt>, and it defaults to
         * <tt>'bottom'</tt>. Returns the <tt>DomCollection</tt> for chaining.</p>
         *
         * <pre><code>    Ojay('#someDiv').insert('&lt;p&gt;Inserted after the DIV&lt;/p&gt;', 'after');
         *     
         *     Ojay('ul li').insert(Ojay.HTML.span({className: 'foo'}, 'Item: '), 'top');</code></pre>
         *
         * @param {String|HTMLElement} html The HTML to insert
         * @param {String} position The position at which to insert it (default is <tt>bottom</tt>)
         * @returns {DomCollection}
         */
        insert: function(html, position) {
            if (position == 'replace') return this.setContent(html);
            var insertion = new Ojay.DomInsertion(this.toArray(), html, position);
            return this;
        },
        
        /**
         * <p>Removes all the elements in the collection from the document, and returns the collection.</p>
         * @returns {DomCollection}
         */
        remove: function() {
            this.toArray().forEach(function(element) {
                if (element.parentNode)
                    element.parentNode.removeChild(element);
            });
            return this;
        },
        
        /**
         * <p>Returns true iff the first element in the collection matches the given CSS or
         * XPath selector.</p>
         * @param {String} selector A CSS or XPath selector string
         * @returns {Boolean}
         */
        matches: function(selector) {
            if (!this.node) return undefined;
            return YAHOO.util.Selector.test(this.node, selector);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> containing the elements of the collection
         * that match the selector if one is given.</p>
         * @param {String} selector An optional CSS or XPath expression
         * @returns {DomCollection}
         */
        query: function(selector, array) {
            var collection = array ? Ojay(array) : this;
            if (!selector) return new this.klass(collection.toArray());
            collection = collection.filter({matches: selector});
            return new this.klass(collection.toArray());
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique parent nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selector are included.</p>
         * @param {String} selector An optional CSS or XPath expression
         * @returns {DomCollection}
         */
        parents: function(selector) {
            var parents = this.map('node.parentNode');
            return this.query(selector, parents.unique());
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique ancestor nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selection are included.</p>
         * @param {String} selector An optional CSS or XPath expression
         * @returns {DomCollection}
         */
        ancestors: function(selector) {
            var ancestors = [];
            this.toArray().forEach(function(element) {
                while ((element.tagName.toLowerCase() != 'body') && (element = element.parentNode)) {
                    if (ancestors.indexOf(element) == -1)
                        ancestors.push(element);
                }
            });
            return this.query(selector, ancestors);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique child nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selection are included.</p>
         * @param {String} selector An optional CSS or XPath expression
         * @returns {DomCollection}
         */
        children: function(selector) {
            var children = [];
            this.toArray().forEach(function(element) {
                var additions = Dom.getChildren(element), arg;
                while (arg = additions.shift()) {
                    if (children.indexOf(arg) == -1)
                        children.push(arg);
                }
            });
            return this.query(selector, children);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique descendant nodes of all the elements
         * in the collection. If a selector string is supplied, only elements that match the
         * selection are included.</p>
         * @param {String} selector An optional CSS or XPath expression
         * @returns {DomCollection}
         */
        descendants: function(selector) {
            selector = selector || '*';
            var descendants = [];
            this.toArray().forEach(function(element) {
                var additions = Ojay.query(selector, element), arg;
                while (arg = additions.shift()) {
                    if (descendants.indexOf(arg) == -1)
                        descendants.push(arg);
                }
            });
            return new this.klass(descendants);
        },
        
        /**
         * <p>Returns a new <tt>DomCollection</tt> of the unique siblings of all the elements in the
         * collection. The returned collection does not include elements present in the original
         * collection. If a selector string is supplied, only elements that match the selection are
         * included.</p>
         * @param {String} selector An optional CSS or XPath expression
         * @returns {DomCollection}
         */
        siblings: function(selector) {
            var these = this.toArray(), siblings = [];
            these.forEach(function(element) {
                var additions = Ojay(element).parents().children(selector).toArray(), arg;
                while (arg = additions.shift()) {
                    if ((these.indexOf(arg) == -1) && (siblings.indexOf(arg) == -1))
                        siblings.push(arg);
                }
            });
            return new this.klass(siblings);
        },
        
        /**
         * <p>Returns a <tt>Region</tt> object representing the rectangle occupied by the the first
         * element in the collection.</p>
         * @returns {Region}
         */
        getRegion: function() {
            if (!this.node) return undefined;
            return new Ojay.Region(Dom.getRegion(this.node));
        },
        
        /**
         * <p>Returns the total width of the region occupied by the element, including padding
         * and borders. Values returned are in pixels.</p>
         * @returns {Number}
         */
        getWidth: function() {
            if (!this.node) return undefined;
            return this.getRegion().getWidth();
        },
        
        /**
         * <p>Returns the total height of the region occupied by the element, including padding
         * and borders. Values returned are in pixels.</p>
         * @returns {Number}
         */
        getHeight: function() {
            if (!this.node) return undefined;
            return this.getRegion().getHeight();
        },
        
        /**
         * <p>Returns the position of the top edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getTop: function() {
            if (!this.node) return undefined;
            return this.getRegion().top;
        },
        
        /**
         * <p>Returns the position of the bottom edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getBottom: function() {
            if (!this.node) return undefined;
            return this.getRegion().bottom;
        },
        
        /**
         * <p>Returns the position of the left edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getLeft: function() {
            if (!this.node) return undefined;
            return this.getRegion().left;
        },
        
        /**
         * <p>Returns the position of the right edge of the first element in the collection relative
         * to the viewport, in pixels.</p>
         * @returns {Number}
         */
        getRight: function() {
            if (!this.node) return undefined;
            return this.getRegion().right;
        },
        
        /**
         * <p>Returns the position of the center of the element as an object with <tt>left</tt> and
         * <tt>top</tt> properties. Values returned are in pixels.</p>
         */
        getCenter: function() {
            if (!this.node) return undefined;
            return this.getRegion().getCenter();
        },
        
        /**
         * <p>Returns true iff the first element in the collection intersects the area of the element
         * given as an argument.</p>
         * @param {String|HTMLElement|DomCollection} element
         * @returns {Boolean}
         */
        areaIntersects: function(element) {
            if (!this.node) return undefined;
            var node = Ojay(element);
            return this.getRegion().intersects(node.getRegion());
        },
        
        /**
         * <p>Returns a <tt>Region</tt> representing the overlapping region of the first element in the
         * collection and the argument.</p>
         * @param {String|HTMLElement|DomCollection} element
         * @returns {Region} or null if there is no overlap
         */
        intersection: function(element) {
            if (!this.node) return undefined;
            var node = Ojay(element);
            var A = this.getRegion(), B = node.getRegion();
            return A.intersects(B) ? A.intersection(B) : null;
        },
        
        /**
         * <p>Returns true iff the first element in the collection completely contains the area of the
         * element given as an argument.</p>
         * @param {String|HTMLElement|DomCollection} element
         * @returns {Boolean}
         */
        areaContains: function(element) {
            if (!this.node) return undefined;
            var node = Ojay(element);
            return this.getRegion().contains(node.getRegion());
        }
    });
})(YAHOO.util.Dom);

(function() {
    for (var method in Ojay.ARRAY_METHODS)
        (function(name) {
            var noConvert = /^(?:indexOf|lastIndexOf|unique)$/.test(name);
            Ojay.DomCollection.instanceMethod(name, function() {
                var array = noConvert
                        ? this.toArray()
                        : [].map.call(this, function(el) { return Ojay(el); });
                var result = array[name].apply(array, arguments);
                if (name == 'filter')
                    result = Ojay(result.map(function(el) { return el.node; }));
                return result;
            });
        })(method);
})();

Ojay.fn = Ojay.DomCollection.prototype;

/**
 * <p>The <tt>DomInsertion</tt> class is used to insert new strings and elements into the DOM.
 * It should not be used as a public API; you should use <tt>DomCollection</tt>'s <tt>insert</tt>
 * method instead. Its implementation is based on <a href="http://prototypejs.org/api/element/insert">that
 * used by Prototype</a>.</p>
 *
 * Document insertion code: Copyright (c) 2005-2008 Sam Stephenson / the Prototype team,
 * released under an MIT-style license.
 *
 * @contructor
 * @class DomInsertion
 */
Ojay.DomInsertion = JS.Class(/** @scope Ojay.DomInsertion.prototype */{
    
    /**
     * @param {Array|HTMLElement} elements A collection of elements to insert into
     * @param {String|HTMLElement} html HTML to insert
     * @param {String} position
     */
    initialize: function(elements, html, position) {
        if (!(elements instanceof Array)) elements = [elements];
        if (!(/^(?:top|bottom|before|after)$/i.test(position))) position = 'bottom';
        
        this._elements = elements.filter(function(el) { return el && el.nodeType === Ojay.HTML.ELEMENT_NODE; });
        this._html = html;
        this._position = position.toLowerCase();
        this._insert();
    },
    
    /**
     * <p>Performs the insertion.</p>
     */
    _insert: function() {
        if (this._elements.length === 0) return;
        if (this._html && this._html.nodeType) this._insertElement();
        if (typeof this._html == 'string') this._insertString();
    },
    
    /**
     * <p>Performs insertion of <tt>HTMLElement</tt>s.</p>
     */
    _insertElement: function() {
        var insert = this.klass._TRANSLATIONS[this._position];
        this._elements.forEach(function(element) {
            insert(element, this._html);
        }, this);
    },
    
    /**
     * <p>Performs insertion of <tt>String</tt>s.</p>
     */
    _insertString: function() {
        var insert = this.klass._TRANSLATIONS[this._position];
        this._elements.forEach(function(element) {
            var tagName = (/^(?:before|after)$/.test(this._position) ? element.parentNode : element).tagName.toUpperCase();
            var childNodes = this._getContentFromElement(tagName);
            if (/^(?:top|after)$/.test(this._position)) childNodes.reverse();
            childNodes.forEach(insert.partial(element));
        }, this);
    },
    
    /**
     * <p>Returns a collection of nodes by creating a new DIV and using <tt>innerHTML</tt>
     * to create the elements. Used when inserting into table elements and SELECT boxes,
     * which don't allow <tt>innerHTML</tt>modifications quite like everything else.</p>
     * @param {String} tagName The name of the tag we're inserting into.
     * @returns {Array} A collection of DOM nodes
     */
    _getContentFromElement: function(tagName) {
        var tag = this.klass._TAGS[tagName];
        var div = Ojay.HTML.div();
        if (tag) {
            div.innerHTML = tag[0] + this._html + tag[1];
            for (var i = 0, n = tag[2]; i < n; i++)
                div = div.firstChild;
        } else div.innerHTML = this._html;
        return Array.from(div.childNodes);
    },
    
    extend: /** @scope Ojay.DomInsertion */{
        
        /**
         * <p>Collection of definitions for how to perform insertions of strings and elements at
         * various positions.</p>
         */
        _TRANSLATIONS: {
            
            top: function(element, html) {
                element.insertBefore(html, element.firstChild);
            },
            
            bottom: function(element, html) {
                element.appendChild(html);
            },
            
            before: function(element, html) {
                element.parentNode.insertBefore(html, element);
            },
            
            after: function(element, html) {
                element.parentNode.insertBefore(html, element.nextSibling);
            }
        },
        
        /**
         * <p>Tags that need special treatment when trying to use <tt>innerHTML</tt>.</p>
         */
        _TAGS: {
            TABLE:  ['<table>',                '</table>',                   1],
            THEAD:  ['<table><tbody>',         '</tbody></table>',           2],
            TBODY:  ['<table><tbody>',         '</tbody></table>',           2],
            TFOOT:  ['<table><tbody>',         '</tbody></table>',           2],
            TR:     ['<table><tbody><tr>',     '</tr></tbody></table>',      3],
            TD:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
            TH:     ['<table><tbody><tr><td>', '</td></tr></tbody></table>', 4],
            SELECT: ['<select>',               '</select>',                  1]
        }
    }
});

/**
 * <p>Sane DOM node creation API, inspired by
 * <a href="http://api.rubyonrails.org/classes/Builder/XmlMarkup.html"><tt>Builder::XmlMarkup</tt></a>
 * in Ruby on Rails.</p>
 *
 * <p>This class lets you use a much nicer syntax for creating DOM nodes, without resorting to
 * <tt>document.createElement</tt> and friends. Essentially, you write JavaScript that mirrors
 * the HTML you're creating. The methods in the class return <tt>HTMLElement</tt> objects rather
 * than strings of HTML.</p>
 *
 * <p>To begin, you create a new <tt>HtmlBuilder</tt>:</p>
 *
 * <pre><code>    var html = new Ojay.HtmlBuilder();</code></pre>
 *
 * <p>Then write your HTML. Use hashes for tag attributes, strings for text nodes, and functions
 * to nest further tags inside the current node. The beauty of this is that you can easily add
 * whatever logic you want inside the functions to customize the HTML generated. A simple example:</p>
 *
 * <pre><code>    var div = html.div({id: 'container'}, function(html) {
 *         html.h1('This is the title');
 *         html.p({className: 'para'}, 'Lorem ipsum dolor sit amet...');
 *         html.ul(function(html) {
 *             ['One', 'Two', 'Three'].forEach(html.method('li'));
 *         });
 *     });</code></pre>
 *
 * <p>Now <tt>div</tt> is an <tt>HTMLElement</tt> object with the following structure:</p>
 *
 * <pre><code>    &lt;div id="container"&gt;
 *         &lt;h1&gt;This is the title&lt;/h1&gt;
 *         &lt;p class="para"&gt;Lorem ipsum dolor sit amet...&lt;/p&gt;
 *         &lt;ul&gt;
 *             &lt;li&gt;One&lt;/li&gt;
 *             &lt;li&gt;Two&lt;/li&gt;
 *             &lt;li&gt;Three&lt;/li&gt;
 *         &lt;/ul&gt;
 *     &lt;/div&gt;</code></pre>
 *
 * <p>If you prefer, there is a pre-initialized instance of <tt>HtmlBuilder</tt> named
 * <tt>Ojay.HTML</tt>. So, you can call <tt>Ojay.HTML.div('DIV content')</tt> and the like.</p>
 *
 * <p>One key advantage of writing HTML out using JavaScript is that you can assign references
 * to elements as they are being created, without needing to add IDs or class names to them for
 * later reference. For example:</p>
 *
 * <pre><code>    var FormController = JS.Class({
 *         
 *         initialize: function(element) {
 *             element = Ojay(element);
 *             var self = this;
 *             var form = Ojay.HTML.form(function(html) {
 *                 html.h3('Enter your email address');
 *                 html.label('Email:');
 *                 self.emailField = html.input({type: 'text'});
 *                 self.button = html.input({type: 'submit', value: 'Go!'});
 *             });
 *             this.form = Ojay(form);
 *             element.setContent(form);
 *             this.registerEventHandlers();
 *         },
 *         
 *         registerEventHandlers: function() {
 *             this.form.on('submit', function(e) {
 *                 alert(this.emailField.value);
 *             }, this);
 *         }
 *     });</code></pre>
 *
 * <p>Note how the <tt>emailField</tt> property is set at the same time that the element is
 * being created. Storing this reference means you don't have to crawl the DOM for the right
 * node later on, so performance is improved. Also, the fact that you don't need to add IDs
 * or class names to the new elements means you've less chance of causing a naming collision
 * with existing page elements, or unintentionally inheriting stylesheet rules.</p>
 *
 * <p>All the tags defined in the HTML 4.01 spec are available in <tt>HtmlBuilder</tt>. You can
 * see which tags are implemented by inspecting the array <tt>Ojay.HtmlBuilder.TAG_NAMES</tt>.</p>
 *
 * @constructor
 * @class HtmlBuilder
 */
Ojay.HtmlBuilder = JS.Class({
    
    initialize: function(node) {
        this.rootNode = node || null;
    },
    
    extend: {
        addTagNames: function() {
            var args = (arguments[0] instanceof Array) ? arguments[0] : arguments;
            for (var i = 0, n = args.length; i < n; i++) (function(builder, name) {
                
                builder.prototype[name] = function() {
                    var node = document.createElement(name), arg, attr, style;
                    for (var j = 0, m = arguments.length; j < m; j++) {
                        arg = arguments[j];
                        switch (typeof arg) {
                            
                            case 'object':
                                for (attr in arg) {
                                    if (Number(attr) == attr) continue;
                                    if (attr == 'style')
                                        for (style in arg[attr]) node.style[style] = arg[attr][style];
                                    else
                                        node[attr] = arg[attr];
                                }
                                break;
                                
                            case 'function': arg(new Ojay.HtmlBuilder(node));
                                break;
                                
                            case 'string': node.appendChild(document.createTextNode(arg));
                                break;
                        }
                    }
                    if (this.rootNode) this.rootNode.appendChild(node);
                    return node;
                };
                
            })(this, args[i]);
        },
        
        /**
         * List of all HTML 4.01 tag names, culled from the <a
         * href="http://www.w3.org/TR/REC-html40/index/elements.html">W3C spec</a>.
         */
        TAG_NAMES: [
            "a", "abbr", "acronym", "address", "applet", "area", "b", "base", "basefont",
            "bdo", "big", "blockquote", "body", "br", "button", "caption", "center", "cite",
            "code", "col", "colgroup", "dd", "del", "dfn", "dir", "div", "dl", "dt", "em",
            "fieldset", "font", "form", "frame", "frameset", "h1", "h2", "h3", "h4", "h5", "h6",
            "head", "hr", "html", "i", "iframe", "img", "input", "ins", "isindex", "kbd",
            "label", "legend", "li", "link", "map", "menu", "meta", "noframes", "noscript",
            "object", "ol", "optgroup", "option", "p", "param", "pre", "q", "s", "samp",
            "script", "select", "small", "span", "strike", "strong", "style", "sub", "sup",
            "table", "tbody", "td", "textarea", "tfoot", "th", "thead", "title", "tr", "tt",
            "u", "ul", "var"
        ]
    }
});

Ojay.HtmlBuilder.addTagNames(Ojay.HtmlBuilder.TAG_NAMES);

/**
 * <p>A pre-initialized instance of <tt>HtmlBuilder</tt>.</p>
 */
Ojay.HTML = new Ojay.HtmlBuilder();

/**
 *<p>Named references to all types of DOM node -- these are defined in Mozilla but not in IE.</p>
 */
JS.extend(Ojay.HTML, /** @scope Ojay.HTML */{
    ELEMENT_NODE:                   1,
    ATTRIBUTE_NODE:                 2,
    TEXT_NODE:                      3,
    CDATA_SECTION_NODE:             4,
    ENTITY_REFERENCE_NODE:          5,
    ENTITY_NODE:                    6,
    PROCESSING_INSTRUCTION_NODE:    7,
    COMMENT_NODE:                   8,
    DOCUMENT_NODE:                  9,
    DOCUMENT_TYPE_NODE:             10,
    DOCUMENT_FRAGMENT_NODE:         11,
    NOTATION_NODE:                  12
});

/**
 * @overview
 * <p>The <tt>Animation</tt> class is used to set up all animations in Ojay. It is entirely
 * for internal consumption, and not to be accessed directly. Use the <tt>animate</tt> method
 * in <tt>DomCollection</tt> instead, and look to that for documentation.</p>
 */
Ojay.Animation = JS.Class(/** @scope Ojay.Animation.prototype */{
    
    /**
     * @param {DomCollection|Array} elements
     * @param {Object|Function} parameters
     * @param {Number|Function} duration
     * @param {Object} options
     */
    initialize: function(elements, parameters, duration, options) {
        this._collection        = Ojay(elements);
        this._parameters        = parameters || {};
        this._duration          = duration || 1.0;
        this._options           = options || {};
        this._easing            = YAHOO.util.Easing[this._options.easing || 'easeBoth'];
        var after = this._options.after, before = this._options.before;
        this._afterCallback     = after ? Function.from(after) : undefined;
        this._beforeCallback    = before ? Function.from(before) : undefined;
        this.chain              = new JS.MethodChain();
    },
    
    /**
     * @param {Number} i
     * @param {HTMLElement|DomCollection} element
     * @param {Object|Function} options
     * @returns {Object}
     */
    _evaluateOptions: function(options, element, i) {
        element = Ojay(element);
        if (typeof options == 'function') options = options(i, element);
        if (typeof options != 'object') return options;
        var results = {};
        for (var field in options) results[field] = arguments.callee(options[field], element, i);
        return results;
    }.curry(),
    
    /**
     * <p>Returns the animation.</p>
     */
    run: function() {
        var paramSets = this._collection.map(this._evaluateOptions(this._parameters));
        var durations = this._collection.map(this._evaluateOptions(this._duration));
        
        var maxDuration = durations.reduce(function(a,b) { return a > b ? a : b; }, -Infinity);
        var callbackAttached = false;
        
        var after = this._afterCallback, before = this._beforeCallback;
        
        this._collection.forEach(function(element, i) {
            var parameters = paramSets[i], duration = durations[i];
            var anim = new YAHOO.util.ColorAnim(element.node, parameters, duration, this._easing);
            anim.onComplete.subscribe(function() {
                if (YAHOO.env.ua.ie && parameters.opacity && parameters.opacity.to == 1)
                    this.chain.setStyle({opacity: 1});
                
                if (after) after(element, i);
                
                if (duration == maxDuration && !callbackAttached) {
                    callbackAttached = true;
                    this.chain.fire(this._collection);
                }
            }.bind(this));
            if (before) before(element, i);
            anim.animate();
        }, this);
    }
});

(function(Region) {
    /**
     * <p>The <tt>Region</tt> class wraps YUI's <tt>Region</tt> class and extends its API. This
     * class is mostly for internal consumption: methods should exist on <tt>DomCollection</tt>
     * for getting the geometric properties of DOM elements.</p>
     * @constructor
     * @class Region
     */
    Ojay.Region = JS.Class(/** @scope Ojay.Region.prototype */{
        
        contains:   Region.prototype.contains,
        getArea:    Region.prototype.getArea,
        _intersect: Region.prototype.intersect,
        _union:     Region.prototype.union,
        
        /**
         * @param {YAHOO.util.Region} region
         */
        initialize: function(region) {
            ['top', 'right', 'bottom', 'left'].forEach(function(property) {
                this[property] = region[property] || 0;
            }, this);
        },
        
        /**
         * @returns {Number} The width of the region in pixels
         */
        getWidth: function() {
            return this.right - this.left;
        },
        
        /**
         * @returns {Number} The height of the region in pixels
         */
        getHeight: function() {
            return this.bottom - this.top;
        },
        
        /**
         * @returns {Number} The length of the region's diagonal
         */
        getDiagonal: function() {
            return Math.sqrt(Math.pow(this.getWidth(), 2) + Math.pow(this.getHeight(), 2));
        },
        
        /**
         * @returns {Object} The center point of the region
         */
        getCenter: function() {
            return {
                left: (this.left + this.right) / 2,
                top: (this.top + this.bottom) / 2
            };
        },
        
        /**
         * @param {Region} region
         * @returns {Region} A new region representing the intersection of this region with the argument
         */
        intersection: function(region) {
            var intersection = this._intersect(region);
            return new Ojay.Region(intersection);
        },
        
        /**
         * <p>Returns <tt>true</tt> iff this region intersects the given region.</p>
         * @param {Region} region
         * @returns {Boolean}
         */
        intersects: function(region) {
            var top = Math.max(this.top, region.top),
                bottom = Math.min(this.bottom, region.bottom),
                left = Math.max(this.left, region.left),
                right = Math.min(this.right, region.right);
            return (top < bottom) && (left < right);
        },
        
        /**
         * @param {Region} region
         * @returns {Region} The smallest region that contains both this and the argument
         */
        union: function(region) {
            var union = this._union(region);
            return new Ojay.Region(union);
        },
        
        extend: /** @scope Ojay.Region */{
            convert: function(object) {
                if (object instanceof Region) return new this(object);
                if (!(object instanceof this)) object = Ojay(object).getRegion();
                if (!object) return undefined;
                else return object;
            }
        }
    });
})(YAHOO.util.Region);

/**
 * <p>The <tt>Sequence</tt> class allows iteration over an array using a timer to
 * skip from member to member. At each timeframe, the sequence object calls a user-
 * defined callback function, passing in the current member (the 'needle') and its
 * position in the list.</p>
 * @constructor
 * @class Ojay.Sequence
 */
Ojay.Sequence = JS.Class(/** @scope Ojay.Sequence.prototype */{
    
    /**
     * @param Array list
     * @param Function callback
     * @param Object context
     */
    initialize: function(list, callback, context) {
        this._list = list;
        this._counter = 0;
        this._callback = Function.from(callback);
        this._context = context || null;
        this._interval = null;
        this._looping = false;
        this._pauseOnComplete = false;
    },
    
    _fireCallback: function() {
        this._callback.call(this._context, this._list[this._counter]);
    },
    
    /**
     * <p>Calls the callback function on the current needle and steps the counter forward by
     * one place. When looping, sets a timeout to call itself again after the specified time.</p>
     * @returns Sequence
     */
    stepForward: function() {
        if (this._looping === null) {
            this._looping = false;
            return this;
        }
        this._fireCallback();
        this._counter++;
        if (this._counter >= this._list.length) {
            this._counter = 0;
            if (this._pauseOnComplete)
                this._looping = this._pauseOnComplete = false;
        }
        if (this._looping) setTimeout(this.method('stepForward'), this._interval);
        return this;
    },
    
    /**
     * <p>Makes the sequence step forward indefinately at timed intervals.</p>
     * @param Number time
     * @returns Sequence
     */
    loop: function(time) {
        this._interval = 1000 * Number(time || 0) || this._interval;
        if (!this._interval || this._looping) return this;
        this._looping = true;
        return this.stepForward();
    },
    
    /**
     * <p>Stops the sequence looping. The needle will be placed after the last called-back needle.</p>
     * @returns Sequence
     */
    pause: function() {
        if (this._looping) this._looping = null;
        return this;
    },
    
    /**
     * <p>Causes the sequence to stop looping when it reaches the end of the list.</p>
     * @returns Sequence
     */
    finish: function() {
        if (this._looping) this._pauseOnComplete = true;
        return this;
    }
});

/**
 * <p>Returns a <tt>Sequence</tt> object that cycles over every member of the array over
 * the given <tt>time</tt> interval. Your <tt>callback</tt> function is called every <tt>time</tt>
 * seconds, being passed each member of the array in turn and its position in the list.</p>
 *
 * <pre><code>    // Cycle over a set of images
 *     var imgs = ['/imgs/one.png', 'imgs/two.png', 'imgs/three.png'];
 *     var element = Ojay('#something');
 *     
 *     var sequence = imgs.sequence(function(imgageSource, i) {
 *         element.setAttributes({src: imageSource});
 *     });
 *     
 *     // Start sequence looping with a time period
 *     sequence.loop(5);
 *     
 *     // Pause the sequence
 *     sequence.pause();
 *     
 *     // Start again where we left off
 *     sequence.loop();
 *     
 *     // Stop when it next gets to the end of the list
 *     sequence.finish();</code></pre>
 *
 * @param Number time
 * @param Function callback
 * @returns Sequence
 */
Array.prototype.sequence = function(callback) {
    return new Ojay.Sequence(this, callback);
};

Ojay.DomCollection.include(/** @scope Ojay.DomCollection.prototype */{
    /**
     * <p>Returns a <tt>Sequence</tt> operating on the members of the collection.
     * See <tt>Array#sequence</tt> for more information.</p>
     * @param Number time
     * @param Function callback
     * @returns Sequence
     */
    sequence: function(callback) {
        return [].map.call(this, function(el) { return Ojay(el); })
                .sequence(callback);
    }
});

JS.MethodChain.addMethods(Ojay);
JS.MethodChain.addMethods(Ojay.HTML);

// Modify MethodChain to allow CSS selectors
JS.MethodChain.prototype._ = JS.MethodChain.prototype._.wrap(function() {
    var args = Array.from(arguments), _ = args.shift();
    if (typeof args[0] == 'string') return _(Ojay, args[0]);
    else return _.apply(this, args);
});

/**
 * @overview
 * <p><tt>Ojay.HTTP</tt> wraps the <tt>YAHOO.util.Connect</tt> module to provide a more succinct
 * API for making Ajax requests. It's called <tt>HTTP</tt> to emphasise what's actually going on
 * in an Ajax call: we're just making an HTTP request. <tt>Ojay.HTTP</tt> makes you use HTTP verbs
 * as methods, to make it clear what's going on to anyone reading the code. A quick example:</p>
 *
 * <pre><code>    Ojay.HTTP.GET('/index.html', {ajaxLayout: true}, {
 *         onSuccess: function(response) {
 *             alert(response.responseText);
 *         }
 *     });</code></pre>
 *
 * <p>This illustrates the basic pattern of making an HTTP request. Start with the verb (<tt>GET</tt>,
 * <tt>POST</tt>, <tt>PUT</tt>, <tt>DELETE</tt> or <tt>HEAD</tt>), then pass in the URL and the
 * parameters you want to send to the server. These parameters will be turned into a query string
 * or a POST message, depending on the verb used. The URL may contain a query string, but its
 * parameters will be overridden by the parameters object:</p>
 *
 * <pre><code>    // Request is: GET /index.html?id=900&ajaxLayout=true
 *     Ojay.HTTP.GET('/index.html?id=45&ajaxLayout=true', {id: 900})</code></pre>
 *
 * <p>You can define callbacks called <tt>onSuccess</tt> (fired on any reponse with a 2xx status
 * code), <tt>onFailure</tt> (fired on any 3xx, 4xx or 5xx response) or status-code-specific
 * callbacks, like <tt>on404</tt>:</p>
 *
 * <pre><code>    Ojay.HTTP.POST('/posts/create', {title: '...'}, {
 *         onSuccess: function(response) {
 *             alert('Post created!');
 *         },
 *         on403: function(response) {
 *             alert('Permission denied!);
 *         }
 *     });</code></pre>
 *
 * <p>The <tt>response</tt> object passed to your callbacks will be an instance of <tt>HTTP.Response</tt>,
 * which wraps the response object returned by YUI. It has convenience methods for manipulating
 * the response and inserting it into the document. Its methods are listed below. You can use the
 * <tt>response</tt> methods to chain after HTTP calls for more sentence-like code:</p>
 *
 * <pre><code>    Ojay.HTTP.GET('/index.html').insertInto('#container').evalScriptTags();</pre></code>
 *
 * <p>It's best to use this chaining for really simple stuff -- just remember the chain is called
 * asynchronously after the HTTP request completes, so any code following a chain like this should
 * not assume that the content has been inserted into the document or that the scripts have been
 * run.</p>
 *
 * <pre><ocde>    Ojay.HTTP.GET('/index.html').insertInto('#container');  // asynchronous insertion
 *     var text = Ojay('#container').node.innerHTML;
 *             // text does NOT contain the HTTP response yet!</code></pre>
 *
 * <p>For anything beyond really simple stuff, it's best to use explicit callback functions.</p>
 *
 * <p><tt>HTTP.Response</tt> methods are available in chains following calls to <tt>on()</tt>,
 * <tt>animate()</tt> and <tt>wait()</tt> on <tt>DomCollection</tt> objects. e.g.:</p>
 *
 * <pre><code>    Ojay('input[type=submit]').on('click')
 *             ._(Ojay.HTTP.POST, '/posts/update/34', ...)
 *             .insertInto('#message');</pre></code>
 *
 * <p>You can even pass functions into the parameters object, and <tt>HTTP</tt> will execute them
 * at the time the request is made:</p>
 *
 * <pre><code>    Ojay('#link').on('click')
 *             ._(Ojay.HTTP.POST, '/images/save_width', {width: Ojay('#foo').method('getWidth')});</code></pre>
 *
 * <p><tt>Ojay('#foo').method('getWidth')</tt> is a function bound to <tt>Ojay('#foo')</tt>; when
 * the POST request is made, it will be executed and the return value will be sent to the server
 * in the <tt>width</tt> parameter.</p>
 */
Ojay.HTTP = {
    
    /**
     * <p>Accepts a <tt>url</tt> and a <tt>parameters</tt> object and returns an object with
     * all the request parameters from both sources.</p>
     * @param {String} url
     * @param {Object} parameters
     * @returns {Object}
     */
    _extractParams: function(url, parameters) {
        var queryParams = String(url).split(/\?+/).slice(1).join('').split(/\&+/);
        var params = queryParams.reduce(function(memo, part) {
            var pair = part.split(/\=/);
            if (pair[0]) memo[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            return memo;
        }, {});
        for (var key in parameters) params[key] = parameters[key];
        return params;
    },
    
    /**
     * <p>Accepts a <tt>parameters</tt> object and returns an encoded query string.</p>
     * @param {Object} parameters
     * @returns {String}
     */
    _serializeParams: function(parameters) {
        var params = this._evaluateParams(parameters || {}), parts = [];
        for (var key in params) parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
        return parts.join('&');
    },
    
    /**
     * <p>Returns a copy of the given object with any functions evaluted.</p>
     * @param {Object} parameters
     * @returns {Object}
     */
    _evaluateParams: function(parameters) {
        var results = {};
        for (var field in parameters) {
            results[field] = (typeof parameters[field] == 'function')
                    ? parameters[field]()
                    : parameters[field];
        }
        return results;
    },
    
    /**
     * <p>Object containing named references to XmlHttpRequest ready states.</p>
     */
    READY_STATE: {
        UNINITIALIZED:  0,
        LOADING:        1,
        LOADED:         2,
        INTERACTIVE:    3,
        COMPLETE:       4
    },
    
    /**
     * <p>List of verbs supported by <tt>Ojay.HTTP</tt>.</p>
     */
    VERBS: 'GET POST PUT DELETE HEAD'.split(/\s+/)
};

Ojay.HTTP.VERBS.forEach(function(verb) {
    Ojay.HTTP[verb] = function(url, parameters, callbacks) {
        var request = new Ojay.HTTP.Request(verb, url, parameters, callbacks);
        request._begin();
        return request.chain;
    };
});

/**
 * <p>The <tt>HTTP.Request</tt> class is used to instantiate Ajax calls to the server. This
 * is for internal consumption -- use <tt>HTTP.GET</tt> et al to make requests.</p>
 * @constructor
 * @class HTTP.Request
 */
Ojay.HTTP.Request = JS.Class(/** @scope Ojay.HTTP.Request.prototype */{
    
    /**
     * @param {String} verb         One of 'GET', 'POST', 'PUT', 'DELETE', or 'HEAD'
     * @param {String} url          The URL to request
     * @param {Object} parameters   Key-value pairs to be used as a query string or POST message
     * @param {Object} callbacks    Object containing callback functions
     */
    initialize: function(verb, url, parameters, callbacks) {
        this._verb          = verb.toUpperCase();
        if (Ojay.HTTP.VERBS.indexOf(this._verb) == -1) return;
        this._url           = url.split(/\?+/)[0];
        this._parameters    = Ojay.HTTP._extractParams(url, parameters);
        this._callbacks     = callbacks || {};
        this.chain          = new JS.MethodChain();
    },
    
    /**
     * <p>Makes the HTTP request and sets up all the callbacks.</p>
     */
    _begin: function() {
        var params      = Ojay.HTTP._serializeParams(this._parameters);
        var url         = (this._verb == 'POST') ? this._url : this._url + (params ? '?' + params : '');
        var postData    = (this._verb == 'POST') ? params : undefined;
        
        YAHOO.util.Connect.asyncRequest(this._verb, url, {
            scope: this,
            
            // Will fire onSuccess, on2xx, and the chain
            success: function(transport) {
                var response = new Ojay.HTTP.Response(transport);
                var success  = this._callbacks.onSuccess;
                var onStatus = this._callbacks['on' + response.status];
                if (typeof success == 'function') {
                    try { success(response); } catch(e) {}
                }
                if (typeof onStatus == 'function') {
                    try { onStatus(response); } catch(e) {}
                }
                this.chain.fire(response);
            },
            
            // Will fire onFailure, on3xx, on4xx, on5xx
            failure: function(transport) {
                var response = new Ojay.HTTP.Response(transport);
                var failure  = this._callbacks.onFailure;
                var onStatus = this._callbacks['on' + response.status];
                if (typeof failure == 'function') {
                    try { failure(response); } catch(e) {}
                }
                if (typeof onStatus == 'function') {
                    try { onStatus(response); } catch(e) {}
                }
            }
            
        }, postData);
    }
});

/**
 * <p>The <tt>HTTP.Response</tt> class is used to wrap XmlHttpRequest transport objects in Ajax
 * callback functions. The argument passed into your Ajax callbacks, and used as the base of chains
 * after <tt>GET</tt>/<tt>POST</tt>/etc calls, will be an object of this class. It contains fields
 * copied straight from the transport object, including <tt>status</tt>, <tt>statusText</tt>,
 * <tt>responseText</tt>, and <tt>responseXML</tt>.</p>
 * class.
 * @constructor
 * @class HTTP.Response
 */
Ojay.HTTP.Response = JS.Class(/** @scope Ojay.HTTP.Response.prototype */{
    
    /**
     * @param {Object} transport An XmlHttpRequest transport object
     */
    initialize: function(transport) {
        'status statusText responseText responseXML'.split(/\s+/).forEach(function(key) {
            this[key] = transport[key];
        }, this);
        this.transport = transport;
    },
    
    /**
     * <p>Inserts the response's body text into the given <tt>elements</tt> at the given
     * <tt>position</tt> (default is <tt>'replace'</tt>). See <tt>DomCollection#insert.</tt>.</p>
     * @param {String|HTMLElement|Array} elements A CSS selector, HTML element reference or array of elements
     * @param {String} position The position at which to insert, defaults to 'replace'
     * @returns {HTTP.Response}
     */
    insertInto: function(elements, position) {
        elements = Ojay(elements);
        elements.insert((this.responseText || '').stripScripts(), position || 'replace');
        return this;
    },
    
    /**
     * @returns {HTTP.Response}
     */
    evalScriptTags: function() {
        if (this.responseText) this.responseText.evalScripts();
        return this;
    }
});

(function() {
    
    var HTTP = Ojay.HTTP;
    
    // Precompiled regexps
    var PATTERNS = {
        JS:     /\.js$/i,
        CSS:    /\.css$/i,
        DOMAIN: /^(https?:\/\/[^\/]+)?/i,
        Q:      /\?+/
    };
    
    var IFRAME_NAME = '__ojay_cross_domain__';
    
    var createIframe = function() {
        Ojay(document.body).insert('<iframe name="' + IFRAME_NAME + '" style="display: none;"></iframe>', 'top');
        createIframe = function() {};
    };
    
    var determineAssetType = function(url) {
        switch (true) {
            case PATTERNS.JS.test(url) :    return 'script';    break;
            case PATTERNS.CSS.test(url) :   return 'css';       break;
            default :                       return 'script';    break;
        }
    };
    
    var isLocal = function(url) {
        var pattern = PATTERNS.DOMAIN,
            host = window.location.href.match(pattern)[0],
            request = url.match(pattern)[0];
        
        return (request == '' || request == host);
    };
    
    JS.extend(HTTP, /** @scope Ojay.HTTP */{
        
        /**
         * <p><tt>Ojay.HTTP.GET</tt> is overloaded to provide support for <tt>YAHOO.util.Get</tt>,
         * which allows loading of new script/css assets into the document, even from other domains.
         * If you try to <tt>GET</tt> a URL from another domain, Ojay automatically uses the <tt>Get</tt>
         * utility to load the asset into the document. For example, to talk to a JSON web service on
         * another domain:</p>
         *
         * <pre><code>    Ojay.HTTP.GET('http://example.com/posts/45.json', {
         *         user: 'your_username',
         *         api_key: '4567rthdtyue566w34',
         *         callback: 'handleJSON'
         *     });
         *     
         *     var handleJSON = function(json) {
         *         // process json object
         *     };</code></pre>
         *
         * <p>If you request a URL on your own domain, Ojay will always make an Ajax request rather
         * than a Get-utility request. If you want to load assets from your own domain or talk to
         * your own web service, use <tt>Ojay.HTTP.load()</tt>.</p>
         *
         * @param {String} url          The URL to request
         * @param {Object} parameters   Key-value pairs to be used as a query string
         * @param {Object} callbacks    Object containing callback functions
         * @returns {MethodChain}
         */
        GET: HTTP.GET.wrap(function(ajax, url, parameters, callbacks) {
            if (isLocal(url) || !YAHOO.util.Get) return ajax(url, parameters, callbacks);
            this.load(url, parameters, callbacks);
        }),
        
        /**
         * <p><tt>Ojay.HTTP.POST</tt> is overloaded to allow POST requests to other domains using
         * hidden forms and iframes. Using the same syntax as for Ajax requests to your own domain,
         * you can send data to any URL to like. An example:</p>
         *
         * <pre><code>    Ojay.HTTP.POST('http://example.com/posts/create', {
         *         user: 'your_username',
         *         api_key: '4567rthdtyue566w34',
         *         title: 'A new blog post',
         *         content: 'Lorem ipsum dolor sit amet...'
         *     });</code></pre>
         *
         * <p>Due to same-origin policy restrictions, you cannot access the response for cross-
         * domain POST requests, so no callbacks may be used.</p>
         *
         * @param {String} url          The URL to request
         * @param {Object} parameters   Key-value pairs to be used as a POST message
         * @param {Object} callbacks    Object containing callback functions
         * @returns {MethodChain}
         */
        POST: HTTP.POST.wrap(function(ajax, url, parameters, callbacks) {
            if (isLocal(url)) return ajax(url, parameters, callbacks);
            this.send(url, parameters);
        }),
        
        /**
         * <p>Uses the YUI Get utility to load assets into the current document. Pass in the URL you
         * want to load, parameters for the query string, and callback functions if you need them.</p>
         *
         * <p>Ojay automatically infers which type of asset (script or stylesheet) you want to load
         * from the URL. If it ends in '.css', Ojay makes a stylesheet request, otherwise it loads
         * a script file.</p>
         *
         * @param {String} url          The URL to request
         * @param {Object} parameters   Key-value pairs to be used as a query string
         * @param {Object} callbacks    Object containing callback functions
         */
        load: function(url, parameters, callbacks) {
            var getUrl = url.split(PATTERNS.Q)[0],
                assetType = determineAssetType(getUrl);
            
            YAHOO.util.Get[assetType](this._buildGetUrl(url, parameters), callbacks || {});
        },
        
        /**
         * <p>Allows cross-domain POST requests by abstracting away the details required to implement
         * such a technique. An invisible form and iframe are injected into the document to send
         * the data you specify to the required URL. There is no way of communicating across frames
         * from different domains, so you cannot use any callbacks to see what happened to your data.</p>
         *
         * @param {String} url          The URL to send data to
         * @param {Object} parameters   Key-value pairs to be used as a POST message
         */
        send: function(url, parameters) {
            var form = this._buildPostForm(url, parameters, true);
            createIframe();
            Ojay(document.body).insert(form.node, 'top');
            form.node.submit();
            form.remove();
        },
        
        _buildGetUrl: function(url, parameters) {
            var getUrl = url.split(PATTERNS.Q)[0],
                params = this._serializeParams(this._extractParams(url, parameters));
            return getUrl + (params ? '?' + params : '');
        },
        
        _buildPostForm: function(url, parameters, postToIframe) {
            var postUrl = url.split(PATTERNS.Q)[0],
                params = this._extractParams(url, parameters);
            
            var attributes = {action: postUrl, method: 'POST'};
            if (postToIframe) attributes.target = IFRAME_NAME;
            
            return Ojay( Ojay.HTML.form(attributes, function(HTML) {
                for (var field in params)
                    HTML.input({ type: 'hidden', name: field, value: String(params[field]) });
            }) ).hide();
        }
    });
    
    HTTP.GET.redirectTo = function(url, parameters) {
        window.location.href = HTTP._buildGetUrl(url, parameters);
    };
    
    HTTP.POST.redirectTo = function(url, parameters) {
        var form = HTTP._buildPostForm(url, parameters, false).node;
        Ojay(document.body).insert(form, 'top');
        form.submit();
    };
    
    JS.MethodChain.addMethods(HTTP);
})();

/**
 * @overview
 * <p>The <tt>Mouse</tt> module, when included in a web page, automatically keeps track
 * of the current mouse position by listening to the document's <tt>mousemove</tt> event. You
 * can grab the current mouse position from anywhere in your code by checking the <tt>left</tt> and
 * <tt>top</tt> properties of <tt>Ojay.Mouse.position</tt>.</p>
 *
 * <p>You can also use <tt>Mouse</tt> to listen for <tt>mouseenter</tt> and <tt>mouseleave</tt>
 * events, which are like <tt>mouseover</tt> and <tt>mouseout</tt> except without the problems
 * caused by missed events and nested elements. When <tt>Mouse</tt> is present on a page,
 * you can register event listeners as follows:</p>
 *
 * <pre><code>    Ojay('p').on('mouseenter', function(element, position) {
 *         // respond to event
 *     }, scope);</code></pre>
 *
 * <p>Within your callback function, <tt>element</tt> refers to the element the mouse entered,
 * and <tt>position</tt> is an object whose <tt>left</tt> and <tt>top</tt> properties represent
 * the position of the mouse at the time of the event. The optional <tt>scope</tt> argument sets
 * the meaning of <tt>this</tt> inside your callback.</p>
 *
 * <p>More generally, you can subscribe to all mouse movement as follows:</p>
 *
 * <pre><code>    Ojay.Mouse.subscribe(function(position) {
 *         // respond to mouse movement with
 *         // position.left and position.top
 *     }, scope);</code></pre>
 *
 * <p>Your callback is fired every time the mouse moves, and it is given the mouse position in
 * the <tt>position</tt> argument. Again, use <tt>scope</tt> to set the meaning of <tt>this</tt>
 * inside the callback.</p>
 */
Ojay.Mouse = JS.Singleton({
    include: JS.Observable,
    
    initialize: function() {
        this.position = {left: null, top: null};
    },
    
    /**
     * <p>Callback used to respond to mousemove events. Calls <tt>notifyObservers</tt> with
     * the current mouse position.</p>
     * @param {Event} e
     */
    updatePosition: function(e) {
        var xy = YAHOO.util.Event.getXY(e);
        this.position = {left: xy[0], top: xy[1]};
        this.notifyObservers(this.position);
    },
    
    /**
     * <p>Provides support for detecting events when the mouse pointer enters or leaves an
     * element, in a way that doesn't cause the problems of mouseover/mouseout. Firstly, the
     * mouse pointer is monitored across the whole document, so you've less chance of missing
     * a mouseout event due to fast movement. Second, this function will not fire a mouse-out
     * event if you mouse over an element nested inside the element you're listening to.</p>
     *
     * @param {String} movement Either 'entering' or 'leaving'
     * @param {Region|HTMLElement|String} element The element to watch for mouse events
     * @param {Function} callback A function to fire
     * @param {Object} scope The scope in which to fire the callback (optional)
     */
    on: function(movement, element, callback, scope) {
        if (!/^(?:entering|leaving)$/.test(movement))
            throw new TypeError('Movement is not recognised');
        
        var isRegion    = (element instanceof Ojay.Region);
        var region      = isRegion ? element : null;
        var element     = isRegion ? null: Ojay(element);
        var wasInside   = false;
        this.addObserver(function(position) {
            var currentRegion = region || element.getRegion();
            var isInside = this.isInside(currentRegion);
            if (movement == 'entering' && !wasInside && isInside)
                callback.call(scope || null, this.position);
            if (movement == 'leaving' && wasInside && !isInside)
                callback.call(scope || null, this.position);
            wasInside = isInside;
        }, this);
    },
    
    /**
     * <p>Returns <tt>true</tt> iff the mouse pointer is currently inside the given region or
     * element. <tt>region</tt> can be an HTML element reference or a CSS selector, in which
     * case the test region will be the area of the first element that matches the selector.
     * Returns <tt>undefined</tt> if no region can be found.</p>
     * @param {Region|HTMLElement|String} region
     * @returns {Boolean}
     */
    isInside: function(region) {
        region = Ojay.Region.convert(region);
        if (!region) return undefined;
        var pos = this.position;
        return pos.left >= region.left && pos.left <= region.right &&
                pos.top >= region.top && pos.top <= region.bottom;
    }
});

YAHOO.util.Event.addListener(document, 'mousemove',
        Ojay.Mouse.method('updatePosition'));

/**
 * <p><tt>DomCollection#on</tt> is wrapped to provide <tt>mouseenter</tt> and <tt>mouseleave</tt>
 * event detection support.</p>
 */
Ojay.DomCollection.include({on: Ojay.DomCollection.prototype.on.wrap(function() {
    var args = Array.from(arguments), original = args.shift();
    var eventName = args[0], callback = args[1], scope = args[2];
    
    if (!/^mouse(enter|leave)$/.test(eventName))
        return original(eventName, callback, scope);
        
    var type = eventName.match(/^mouse(enter|leave)$/)[1].replace(/e?$/, 'ing');
    var collector = new JS.MethodChain();
    if (callback && typeof callback != 'function') scope = callback;
    
    this.forEach(function(element) {
        Ojay.Mouse.on(type, element, function(position) {
            if (typeof callback == 'function') callback.call(scope || null, element, position);
            collector.fire(scope || element);
        });
    });
    
    return collector;
})});

/**
 * @overview
 * <p><tt>Ojay.History</tt> makes it considerably easier to create interface modules that
 * are history-managed using <tt>YAHOO.util.History</tt>. It allows you to create objects
 * that can easily be made into history-managed modules by calling a single function on
 * them. Before we get into the specifics of working with it, let's see an example usage
 * on a web page:</p>
 *
 * <pre><code>    &lt;!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN"
 *       "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd"&gt;
 *     
 *     &lt;html&gt;
 *     &lt;head&gt;
 *         &lt;meta http-equiv="Content-type" content="text/html; charset=utf-8"/&gt;
 *         &lt;title&gt;Ojay History&lt;/title&gt;
 *         &lt;script src="/yui/build/yahoo-dom-event/yahoo-dom-event.js" type="text/javascript"&gt;&lt;/script&gt;
 *         &lt;script src="/yui/build/history/history-beta-min.js" type="text/javascript"&gt;&lt;/script&gt;
 *         &lt;script src="/ojay/ojay.js" type="text/javascript"&gt;&lt;/script&gt;
 *         &lt;script src="/gallery.js" type="text/javascript"&gt;&lt;/script&gt;
 *     &lt;/head&gt;
 *     &lt;body&gt;
 *         &lt;script type="text/javascript"&gt;
 *             var myGallery = new Gallery('galleryDiv');
 *             Ojay.History.manage(myGallery, 'gallery');
 *             Ojay.History.initialize();
 *         &lt;/script&gt;
 *         
 *         &lt;div id="galleryDiv"&gt;
 *             &lt;!-- Gallery markup goes here --&gt;
 *         &lt;/div&gt;
 *         &lt;script type="text/javascript"&gt;
 *             myGallery.setup();
 *         &lt;/script&gt;
 *     &lt;/body&gt;
 *     &lt;/html&gt;</code></pre>
 *
 * <p>This illustrates the basic structure of how to set up an object to be history-managed.
 * At the top of the <tt>body</tt>, you need to create any objects you want to manage, then
 * tell <tt>Ojay.History</tt> to manage them <em>before</em> calling <tt>initialize()</tt>.
 * This poses the problem of how to initialize interface elements before the page has loaded;
 * to work around this, your object should have some means of initializing its DOM requirements
 * at some time later than when it is created. In the example above, <tt>myGallery</tt> calls
 * its <tt>setup()</tt> method after its required DOM nodes are available.</p>
 *
 * <p>Each managed object must be given a unique name for the history manager to refer to it
 * by, and you must supply such a name when calling <tt>Ojay.History.manage</tt>. This name
 * will appear in URLs generated by the history manager for bookmarking purposes.</p>
 *
 * <p>Now, onto the business of how to implement objects that can be history managed. It should
 * go without saying that, if you're creating the kind of interface module that can have
 * history management applied to it, it should be controlled (at least in part) by a single
 * JavaScript object that maintains the module's state, rather than by a disorganised mass
 * of global functions and variables. Also, note that you cannot history-manage classes, it
 * only makes sense to talk about managing objects, or instances of classes. If you have several
 * instances of a particular interface class running on a page, you need to give each instance
 * its own name in the history manager.</p>
 *
 * <p>For an object to be history-managed, the only requirements are that it must have both
 * a <tt>getInitialState</tt> method, and a <tt>changeState</tt> method. There are also some
 * 'rules' about how to use these methods so that they work when converted to history-managing
 * actions.</p>
 *
 * <p><tt>getInitialState</tt> must return an object containing all the fields necessary to
 * specify the state of the object at any time, and their default values. When the object is
 * history-managed, this method will return the bookmarked state of the object from the
 * history manager.</p>
 *
 * <p><tt>changeState</tt> should accept an object as an argument, and modify the managed
 * object's UI according to the argument's properties. Any action which creates a bookmarkable
 * state should be carried out by calling <tt>changeState</tt>. When using history management,
 * <tt>changeState</tt> will be re-routed to create a new entry in the browser's history to
 * record the interface changes that take place. As its name implies, <tt>changeState</tt>
 * should not be used to initialize the object's UI as it will create a new history entry.</p>
 *
 * <p>Any state parameters provided to your <tt>changeState</tt> method by the history manager
 * will be <tt>String</tt>s, so you should cast to other data types if required. The only
 * exceptions to this rule are <tt>Number</tt>s, and the values <tt>true</tt>, <tt>false</tt>,
 * <tt>null</tt> and <tt>undefined</tt>. These will be converted from strings to the correct
 * data type automatically by <tt>Ojay.History</tt>.</p>
 *
 * <p>As an example, the following is an outline implementation of the <tt>Gallery</tt> class
 * used in the example page above.</p>
 *
 * <pre><code>    var Gallery = JS.Class({
 *         
 *         // Store initialization data, do nothing with the DOM
 *         initialize: function(id) {
 *             this.elementID = id;
 *         },
 *         
 *         // Return default state of the module
 *         getInitialState: function() {
 *             return {
 *                 page: 1,
 *                 popupVisible: true,
 *                 popupID: 0
 *             };
 *         },
 *         
 *         // What to do when the state changes: change the UI
 *         changeState: function(state) {
 *             if (state.page !== undefined) this.setPage(state.page);
 *         },
 *         
 *         // Called when DOM elements are ready
 *         setup: function() {
 *             // ... Setup DOM stuff ...
 *             this.registerEventListeners();
 *             // Get initial state and set up the UI
 *             this.state = this.getInitialState();
 *             this.setPage(this.state.page);
 *         },
 *         
 *         // Attach object's methods to DOM events
 *         registerEventListeners: function() {
 *             this.prevControl.on('click', this.decrementPage, this);
 *             this.nextControl.on('click', this.incrementPage, this);
 *         },
 *         
 *         // Change the UI via the changeState() function
 *         decrementPage: function() {
 *             if (this.state.page > 1)
 *                 this.changeState({page: this.state.page - 1});
 *         },
 *         
 *         incrementPage: function() { ... },
 *         
 *         // Change the UI - should only be called through changeState()
 *         setPage: function(n) {
 *             this.state.page = n;  // Ojay casts this to a Number for you
 *             // ... DOM manipulation ...
 *         }
 *     });</code></pre>
 */
Ojay.History = (function(History) {
    
    var CHARACTER_CONVERSIONS = {
        '?':    '--Qq--',
        '=':    '--Ee--',
        '&':    '--Aa--',
        '_':    '--Uu--',
        '/':    '--Ss--'
    },
    
        encode = function(param) {
            var string = decodeURIComponent(String(param));
            for (var conv in CHARACTER_CONVERSIONS)
                string = string.replace(conv, CHARACTER_CONVERSIONS[conv]);
            return encodeURIComponent(string);
        },
        
        decode = function(string) {
            string = decodeURIComponent(String(string));
            for (var conv in CHARACTER_CONVERSIONS)
                string = string.replace(CHARACTER_CONVERSIONS[conv], conv);
            return string;
        },
        
        castValue = function(value) {
            if (typeof value != 'string') return value;
            if ((/^\-?\d+(?:\.\d+)?$/.test(value))) value = Number(value);
            
            var keywords = {'true': true, 'false': false, 'undefined': undefined, 'null': null};
            for (var word in keywords) {
                if (value == word) value = keywords[word];
            }
            return value;
        },
        
        serializeState = function(state) {
            if (!state) return '';
            var parts = [];
            for (var property in state)
                parts.push(encode(property) + '_' + encode(state[property]));
            return parts.join('/');
        },
        
        parseState = function(string) {
            string = String(string).replace(/^\s*(.*?)\s*$/, '$1');
            if (!string) return {};
            var parts = string.split('/'), part, state = {}, value;
            for (var i = 0, n = parts.length; i < n; i++) {
                part = parts[i].split('_');
                value = castValue(decode(part[1]));
                state[decode(part[0])] = value;
            }
            return state;
        };
    
    return {
        /**
         * <p>The interface that objects must implement in order to be history managed.</p>
         */
        INTERFACE: new JS.Interface(['getInitialState', 'changeState']),
        
        /**
         * <p>Adds history management to a given object using <tt>name</tt> as a module
         * identifier. All calls to this must take place before <tt>Ojay.History.initialize()</tt>.</p>
         * @param {Object} object The object to history manage
         * @param {String} name A unique module ID for the history manager to use
         */
        manage: function(object, name) {
            JS.Interface.ensure(object, this.INTERFACE);
            
            var historyID   = String(name);
            var changeState = object.changeState.functionize();
            var objectState = {};
            
            object.getInitialState = object.getInitialState.wrap(function(getDefaultState) {
                objectState = History.getBookmarkedState(historyID);
                if (objectState) objectState = parseState(objectState);
                else objectState = getDefaultState();
                return objectState;
            });
            
            object.changeState = function(state) {
                state = state || {};
                for (var property in state)
                    objectState[property] = state[property];
                state = serializeState(objectState);
                History.navigate(historyID, state);
            };
            
            var init = serializeState(object.getInitialState());
            History.register(historyID, init, function(state) {
                state = parseState(state);
                changeState(object, state);
            });
            
            History.onLoadEvent.subscribe(function() {
                var state = History.getCurrentState(historyID);
                state = parseState(state);
                changeState(object, state);
            });
        },
        
        /**
         * <p>Initializes the Yahoo! History module. Should be called only after all required
         * modules have been registered, in a script tag at the beginning of the body.</p>
         *
         * <p>As of YUI 2.4.0, you need to create some HTML elements on the page for YUI to
         * store history state with. <tt>Ojay.History</tt> does this all for you, but you can
         * configure it using a set of optional arguments:</p>
         *
         * <p><tt>asset</tt> -- The URL of some asset on the same domain as the current page.
         * Can be an HTML page, image, script, anything really. Defaults to <tt>/robots.txt</tt>.</p>
         *
         * <p><tt>inputID</tt> -- The <tt>id</tt> to give to the hidden <tt>input</tt> field.
         * Defaults to <tt>yui-history-field</tt>.</p>
         *
         * <p><tt>iframeID</tt> -- The <tt>id</tt> to give to the hidden <tt>iframe</tt>. Defaults
         * to <tt>yui-history-iframe</tt>.</p>
         *
         * <pre><code>    // A quick example...
         *     Ojay.History.initialize({asset: '/javascripts/ojay.js', inputID: 'foo'});</code></pre>
         *
         * @param {Object} options
         */
        initialize: function(options) {
            options         = options || {};
            var assetSrc    = (options.asset || '/robots.txt').replace(/^http:\/\/[^\/]*/ig, '');
            var inputID     = options.inputID || 'yui-history-field';
            var iframeID    = options.iframeID || 'yui-history-iframe';
            
            var body = Ojay(document.body), input, iframe;
            
            input = Ojay.HTML.input({type: 'hidden', id: inputID});
            body.insert(input, 'top');
            
            iframe = Ojay.HTML.iframe({id: iframeID, src: assetSrc});
            Ojay(iframe).setStyle({position: 'absolute', top: 0, left: 0, width: '1px', height: '1px', visibility: 'hidden'});
            body.insert(iframe, 'top');
            
            History.initialize(inputID, iframeID);
        }
    };
})(YAHOO.util.History);
