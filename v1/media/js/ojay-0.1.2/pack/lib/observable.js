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
