Function.prototype.bind=function(){if(arguments.length<2&&arguments[0]===undefined)return this;var a=this,b=Array.from(arguments),c=b.shift();return function(){return a.apply(c,b.concat(Array.from(arguments)))}};Array.from=function(a){if(!a)return[];if(a.toArray)return a.toArray();var b=a.length,c=new Array(b);while(b--)c[b]=a[b];return c};Function.prototype.callsSuper=function(){return/\bcallSuper\b/.test(this.toString())};if(typeof JS=='undefined')JS={};JS.extend=function(a,b){for(var c in b)a[c]=b[c]};JS.method=function(a){var b=this._methodCache=this._methodCache||{};if(b[a]&&b[a].func==this[a])return b[a].bound;b[a]={func:this[a],bound:this[a].bind(this)};return b[a].bound};JS.Class=function(){var a=Array.from(arguments),b,c=(typeof a[0]=='function')?a.shift():null,d=arguments.callee.create(c),e=[],I=JS.Interface;while(b=a.shift()){d.include(b);e=e.concat(b.implement||[])}if(e.length&&I)I.ensure.apply(I,[d.prototype].concat(e));if(c&&typeof c.inherited=='function')c.inherited(d);return d};JS.extend(JS.Class,{create:function(a){var b=function(){this.initialize.apply(this,arguments)};this.ify(b);if(a)this.subclass(a,b);var p=b.prototype;p.klass=p.constructor=b;b.include(this.INSTANCE_METHODS,false);b.instanceMethod('extend',this.INSTANCE_METHODS.extend,false);return b},ify:function(a,b){a.superclass=a.superclass||Object;a.subclasses=a.subclasses||[];if(b===false)return a;for(var c in this.CLASS_METHODS){if(this.CLASS_METHODS.hasOwnProperty(c))a[c]=this.CLASS_METHODS[c]}return a},subclass:function(a,b){this.ify(a,false);b.superclass=a;a.subclasses.push(b);var c=function(){};c.prototype=a.prototype;b.prototype=new c();b.extend(a);return b},addMethod:function(e,f,g,h){if(JS.MethodChain)JS.MethodChain.addMethods([g]);if(typeof h!='function')return(e[g]=h);if(!h.callsSuper())return(e[g]=h);var j=function(){var a=f[g],b=Array.from(arguments),c=this.callSuper,d;if(typeof a=='function')this.callSuper=function(){var i=arguments.length;while(i--)b[i]=arguments[i];return a.apply(this,b)};d=h.apply(this,arguments);c?this.callSuper=c:delete this.callSuper;return d};j.valueOf=function(){return h};j.toString=function(){return h.toString()};e[g]=j},INSTANCE_METHODS:{initialize:function(){},method:JS.method,extend:function(a){for(var b in a){if(a.hasOwnProperty(b))JS.Class.addMethod(this,this.klass.prototype,b,a[b])}return this},isA:function(a){var b=this.klass;while(b){if(b===a)return true;b=b.superclass}return false}},CLASS_METHODS:{include:function(a,b){var c,i,n,d=a.include,e=a.extend;if(d){c=[].concat(d);for(i=0,n=c.length;i<n;i++)this.include(c[i],b)}if(e){c=[].concat(e);for(i=0,n=c.length;i<n;i++)this.extend(c[i],b)}for(var f in a){if(!/^(?:included?|extend|implement)$/.test(f))this.instanceMethod(f,a[f],b)}if(typeof a.included=='function')a.included(this);return this},instanceMethod:function(a,b,c){if(!this.prototype[a]||c!==false)JS.Class.addMethod(this.prototype,this.superclass.prototype,a,b);return this},extend:function(a,b){if(typeof a=='function')a=JS.Class.properties(a);for(var c in a){if(a.hasOwnProperty(c))this.classMethod(c,a[c],b)}return this},classMethod:function(a,b,c){for(var i=0,n=this.subclasses.length;i<n;i++)this.subclasses[i].classMethod(a,b,false);if(!this[a]||c!==false)JS.Class.addMethod(this,this.superclass,a,b);return this},method:JS.method},properties:function(a){var b={},c,K=this.ify(function(){});loop:for(var d in a){for(c in K){if(d==c)continue loop}b[d]=a[d]}return b}});JS.Interface=JS.Class({initialize:function(c){this.test=function(a,b){var n=c.length;while(n--){if(typeof a[c[n]]!='function')return b?c[n]:false}return true}},extend:{ensure:function(){var a=Array.from(arguments),b=a.shift(),c,d;while(c=a.shift()){d=c.test(b,true);if(d!==true)throw new Error('object does not implement '+d+'()');}}}});JS.Singleton=function(){var a=JS.Class.apply(JS,arguments),b=new a();a.instanceMethod('initialize',function(){throw new Error('Singleton classes cannot be reinstantiated');});return b};JS.Module=function(b){return{included:function(a){a.include(b)}}};JS.MethodChain=(function(){var h=function(e){var f=[],g=e||{};this.____=function(a,b){f.push({func:a,args:b})};this.fire=function(a){var b=a||g,c,d;loop:for(var i=0,n=f.length;i<n;i++){c=f[i];if(b instanceof h){b.____(c.func,c.args);continue}switch(typeof c.func){case'string':d=b[c.func];break;case'function':d=c.func;break;case'object':b=c.func;continue loop;break}b=(typeof d=='function')?d.apply(b,c.args):d}return b}};h.prototype={_:function(){var a=arguments[0],b=[];if(!/^(?:function|object)$/.test(typeof a))return this;for(var i=1,n=arguments.length;i<n;i++)b.push(arguments[i]);this.____(a,b);return this},toFunction:function(){var b=this;return function(a){return b.fire(a)}}};var j=(function(){var a=[],b;for(b in new h)a.push(b);return new RegExp('^(?:'+a.join('|')+')$')})();h.addMethods=function(b){var c=[],d,i,n,e=this.prototype;for(d in b){if(Number(d)!=d)c.push(d)}if(b instanceof Array){for(i=0,n=b.length;i<n;i++){if(typeof b[i]=='string')c.push(b[i])}}for(i=0,n=c.length;i<n;i++)(function(a){if(j.test(a))return;e[a]=function(){this.____(a,arguments);return this}})(c[i]);if(b.prototype)this.addMethods(b.prototype)};h.inherited=function(){throw new Error('MethodChain cannot be subclassed');};return h})();var it=its=function(){return new JS.MethodChain};JS.Class.INSTANCE_METHODS.wait=function(a){var b=new JS.MethodChain;switch(true){case typeof a=='number':setTimeout(b.fire.bind(b,this),a*1000);break;case this.forEach&&typeof a=='function':this.forEach(function(){setTimeout(b.fire.bind(b,arguments[0]),a.apply(this,arguments)*1000)});break}return b};