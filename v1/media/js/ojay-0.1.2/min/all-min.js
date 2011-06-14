/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
*/
Function.prototype.bind=function(){if(arguments.length<2&&arguments[0]===undefined)return this;var a=this,b=Array.from(arguments),c=b.shift();return function(){return a.apply(c,b.concat(Array.from(arguments)))}};Array.from=function(a){if(!a)return[];if(a.toArray)return a.toArray();var b=a.length,c=new Array(b);while(b--)c[b]=a[b];return c};Function.prototype.callsSuper=function(){return/\bcallSuper\b/.test(this.toString())};if(typeof JS=='undefined')JS={};JS.extend=function(a,b){for(var c in b)a[c]=b[c]};JS.method=function(a){var b=this._methodCache=this._methodCache||{};if(b[a]&&b[a].func==this[a])return b[a].bound;b[a]={func:this[a],bound:this[a].bind(this)};return b[a].bound};JS.Class=function(){var a=Array.from(arguments),b,c=(typeof a[0]=='function')?a.shift():null,d=arguments.callee.create(c),e=[],I=JS.Interface;while(b=a.shift()){d.include(b);e=e.concat(b.implement||[])}if(e.length&&I)I.ensure.apply(I,[d.prototype].concat(e));if(c&&typeof c.inherited=='function')c.inherited(d);return d};JS.extend(JS.Class,{create:function(a){var b=function(){this.initialize.apply(this,arguments)};this.ify(b);if(a)this.subclass(a,b);var p=b.prototype;p.klass=p.constructor=b;b.include(this.INSTANCE_METHODS,false);b.instanceMethod('extend',this.INSTANCE_METHODS.extend,false);return b},ify:function(a,b){a.superclass=a.superclass||Object;a.subclasses=a.subclasses||[];if(b===false)return a;for(var c in this.CLASS_METHODS){if(this.CLASS_METHODS.hasOwnProperty(c))a[c]=this.CLASS_METHODS[c]}return a},subclass:function(a,b){this.ify(a,false);b.superclass=a;a.subclasses.push(b);var c=function(){};c.prototype=a.prototype;b.prototype=new c();b.extend(a);return b},addMethod:function(e,f,g,h){if(JS.MethodChain)JS.MethodChain.addMethods([g]);if(typeof h!='function')return(e[g]=h);if(!h.callsSuper())return(e[g]=h);var j=function(){var a=f[g],b=Array.from(arguments),c=this.callSuper,d;if(typeof a=='function')this.callSuper=function(){var i=arguments.length;while(i--)b[i]=arguments[i];return a.apply(this,b)};d=h.apply(this,arguments);c?this.callSuper=c:delete this.callSuper;return d};j.valueOf=function(){return h};j.toString=function(){return h.toString()};e[g]=j},INSTANCE_METHODS:{initialize:function(){},method:JS.method,extend:function(a){for(var b in a){if(a.hasOwnProperty(b))JS.Class.addMethod(this,this.klass.prototype,b,a[b])}return this},isA:function(a){var b=this.klass;while(b){if(b===a)return true;b=b.superclass}return false}},CLASS_METHODS:{include:function(a,b){var c,i,n,d=a.include,e=a.extend;if(d){c=[].concat(d);for(i=0,n=c.length;i<n;i++)this.include(c[i],b)}if(e){c=[].concat(e);for(i=0,n=c.length;i<n;i++)this.extend(c[i],b)}for(var f in a){if(!/^(?:included?|extend|implement)$/.test(f))this.instanceMethod(f,a[f],b)}if(typeof a.included=='function')a.included(this);return this},instanceMethod:function(a,b,c){if(!this.prototype[a]||c!==false)JS.Class.addMethod(this.prototype,this.superclass.prototype,a,b);return this},extend:function(a,b){if(typeof a=='function')a=JS.Class.properties(a);for(var c in a){if(a.hasOwnProperty(c))this.classMethod(c,a[c],b)}return this},classMethod:function(a,b,c){for(var i=0,n=this.subclasses.length;i<n;i++)this.subclasses[i].classMethod(a,b,false);if(!this[a]||c!==false)JS.Class.addMethod(this,this.superclass,a,b);return this},method:JS.method},properties:function(a){var b={},c,K=this.ify(function(){});loop:for(var d in a){for(c in K){if(d==c)continue loop}b[d]=a[d]}return b}});JS.Interface=JS.Class({initialize:function(c){this.test=function(a,b){var n=c.length;while(n--){if(typeof a[c[n]]!='function')return b?c[n]:false}return true}},extend:{ensure:function(){var a=Array.from(arguments),b=a.shift(),c,d;while(c=a.shift()){d=c.test(b,true);if(d!==true)throw new Error('object does not implement '+d+'()');}}}});JS.Singleton=function(){var a=JS.Class.apply(JS,arguments),b=new a();a.instanceMethod('initialize',function(){throw new Error('Singleton classes cannot be reinstantiated');});return b};JS.Module=function(b){return{included:function(a){a.include(b)}}};JS.MethodChain=(function(){var h=function(e){var f=[],g=e||{};this.____=function(a,b){f.push({func:a,args:b})};this.fire=function(a){var b=a||g,c,d;loop:for(var i=0,n=f.length;i<n;i++){c=f[i];if(b instanceof h){b.____(c.func,c.args);continue}switch(typeof c.func){case'string':d=b[c.func];break;case'function':d=c.func;break;case'object':b=c.func;continue loop;break}b=(typeof d=='function')?d.apply(b,c.args):d}return b}};h.prototype={_:function(){var a=arguments[0],b=[];if(!/^(?:function|object)$/.test(typeof a))return this;for(var i=1,n=arguments.length;i<n;i++)b.push(arguments[i]);this.____(a,b);return this},toFunction:function(){var b=this;return function(a){return b.fire(a)}}};var j=(function(){var a=[],b;for(b in new h)a.push(b);return new RegExp('^(?:'+a.join('|')+')$')})();h.addMethods=function(b){var c=[],d,i,n,e=this.prototype;for(d in b){if(Number(d)!=d)c.push(d)}if(b instanceof Array){for(i=0,n=b.length;i<n;i++){if(typeof b[i]=='string')c.push(b[i])}}for(i=0,n=c.length;i<n;i++)(function(a){if(j.test(a))return;e[a]=function(){this.____(a,arguments);return this}})(c[i]);if(b.prototype)this.addMethods(b.prototype)};h.inherited=function(){throw new Error('MethodChain cannot be subclassed');};return h})();var it=its=function(){return new JS.MethodChain};JS.Class.INSTANCE_METHODS.wait=function(a){var b=new JS.MethodChain;switch(true){case typeof a=='number':setTimeout(b.fire.bind(b,this),a*1000);break;case this.forEach&&typeof a=='function':this.forEach(function(){setTimeout(b.fire.bind(b,arguments[0]),a.apply(this,arguments)*1000)});break}return b};
JS.Observable=(function(){var c={addObserver:function(a,b){this._observers=this._observers||[];this._observers.push({block:a,context:b||null})},removeObserver:function(a,b){this._observers=this._observers||[];b=b||null;for(var i=0,n=this.countObservers();i<n;i++){if(this._observers[i].block==a&&this._observers[i].context==b){this._observers.splice(i,1);return}}},removeObservers:function(){this._observers=[]},countObservers:function(){this._observers=this._observers||[];return this._observers.length},notifyObservers:function(){if(!this.isChanged())return;for(var i=0,n=this.countObservers(),a;i<n;i++){a=this._observers[i];a.block.apply(a.context,arguments)}},setChanged:function(a){this._changed=!(a===false)},isChanged:function(){if(this._changed===undefined)this._changed=true;return!!this._changed}};c.subscribe=c.addObserver;c.unsubscribe=c.removeObserver;return JS.Module(c)})();
var Ojay=function(){var a=[],b,i,n;for(i=0,n=arguments.length;i<n;i++){b=arguments[i];if(typeof b=='string')b=Ojay.query(b);if(b.toArray)b=b.toArray();if(!(b instanceof Array))b=[b];a=a.concat(b)}return new Ojay.DomCollection(a.unique())};(function(c){JS.extend(Ojay,{VERSION:'0.1.2',query:YAHOO.util.Selector.query,byId:function(a){var b=document.getElementById(a);return new this.DomCollection(b?[b]:[])},changeAlias:function(a){this.surrenderAlias();this.ALIAS=String(a);this.__alias=(typeof window[this.ALIAS]=='undefined')?null:window[this.ALIAS];window[this.ALIAS]=this},surrenderAlias:function(){if(this.__alias===null){if(this.ALIAS)delete window[this.ALIAS];return false}window[this.ALIAS]=this.__alias;return true},log:function(){Array.from(arguments).forEach(function(a){this[a]=this[a].traced(a+'()')},Ojay.DomCollection.prototype)},getDocumentSize:function(){return{width:c.getDocumentWidth(),height:c.getDocumentHeight()}},getScrollOffsets:function(){return{left:c.getDocumentScrollLeft(),top:c.getDocumentScrollTop()}},getViewportSize:function(){return{width:c.getViewportWidth(),height:c.getViewportHeight()}}})})(YAHOO.util.Dom);Ojay.changeAlias('$');Ojay.ARRAY_METHODS={indexOf:function(a){var b=this.length;var c=Number(arguments[1])||0;c=(c<0)?Math.ceil(c):Math.floor(c);if(c<0)c+=b;for(;c<b;c++){if(c in this&&this[c]===a)return c}return-1},lastIndexOf:function(a){var b=this.length;var c=Number(arguments[1]);if(isNaN(c)){c=b-1}else{c=(c<0)?Math.ceil(c):Math.floor(c);if(c<0)c+=b;else if(c>=b)c=b-1}for(;c>-1;c--){if(c in this&&this[c]===a)return c}return-1},filter:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=new Array();var d=arguments[1];for(var i=0;i<b;i++){if(i in this){var e=this[i];if(a.call(d,e,i,this))c.push(e)}}return c},forEach:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=arguments[1];for(var i=0;i<b;i++){if(i in this)a.call(c,this[i],i,this)}},every:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=arguments[1];for(var i=0;i<b;i++){if(i in this&&!a.call(c,this[i],i,this))return false}return true},map:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=new Array(b);var d=arguments[1];for(var i=0;i<b;i++){if(i in this)c[i]=a.call(d,this[i],i,this)}return c},some:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();var c=arguments[1];for(var i=0;i<b;i++){if(i in this&&a.call(c,this[i],i,this))return true}return false},reduce:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();if(b==0&&arguments.length==1)throw new TypeError();var i=0;if(arguments.length>=2){var c=arguments[1]}else{do{if(i in this){c=this[i++];break}if(++i>=b)throw new TypeError();}while(true)}for(;i<b;i++){if(i in this)c=a.call(null,c,this[i],i,this)}return c},reduceRight:function(a){var b=this.length;if(typeof a!="function")throw new TypeError();if(b==0&&arguments.length==1)throw new TypeError();var i=b-1;if(arguments.length>=2){var c=arguments[1]}else{do{if(i in this){c=this[i--];break}if(--i<0)throw new TypeError();}while(true)}for(;i>=0;i--){if(i in this)c=a.call(null,c,this[i],i,this)}return c},unique:function(){var a=[],i,n,b;for(i=0,n=this.length;i<n;i++){b=this[i];if(a.indexOf(b)==-1)a.push(b)}return a},count:function(a,b){return this.filter(a,b).length}};JS.extend(Array.prototype,Ojay.ARRAY_METHODS);JS.extend(Function.prototype,{partial:function(){if(!arguments.length)return this;var a=this,b=Array.from(arguments);return function(){return a.apply(this,b.concat(Array.from(arguments)))}},curry:function(n){var a=this,n=n||this.length;return function(){if(arguments.length>=n)return a.apply(this,arguments);return a.partial.apply(arguments.callee,arguments)}},wrap:function(a){var b=this;return function(){return a.apply(this,[b.bind(this)].concat(Array.from(arguments)))}},methodize:function(){if(this._0)return this._0;var a=this;return this._0=function(){return a.apply(null,[this].concat(Array.from(arguments)))}},functionize:function(){if(this._1)return this._1;var b=this;return this._1=function(){var a=Array.from(arguments);return b.apply(a.shift(),a)}},traced:function(b){var c=this,b=b||this;return function(){window.console&&console.info(b,'called on',this,'with',arguments);var a=c.apply(this,arguments);window.console&&console.info(b,'->',a);return a}}});String.SCRIPT_FRAGMENT='<script[^>]*>([\\S\\s]*?)<\/script>';JS.extend(String.prototype,{extractScripts:function(){var b=new RegExp(String.SCRIPT_FRAGMENT,'img');var c=new RegExp(String.SCRIPT_FRAGMENT,'im');return(this.match(b)||[]).map(function(a){return(a.match(c)||['',''])[1]})},evalScripts:function(){return this.extractScripts().map(function(a){return eval(a)})},stripScripts:function(){return this.replace(new RegExp(String.SCRIPT_FRAGMENT,'img'),'')},stripTags:function(){return this.replace(/<\/?[^>]+>/gi,'').trim()},trim:YAHOO.lang.trim.methodize()});'abs acos asin atan ceil cos exp floor log pow round sin sqrt tan'.split(/\s+/).forEach(function(a){Number.prototype[a]=Math[a].methodize()});Function.from=function(a){if(a.toFunction)return a.toFunction();if(typeof a=='function')return a;if(typeof a=='object')return Function.fromObject(a);return function(x){return x}};String.prototype.toFunction=function(){var d=this.split('.');if(!d[0])return function(x){return x};return function(o){var a,b=o,c;for(var i=0,n=d.length;i<n;i++){c=d[i];a=b;b=a[c];if(typeof b=='function')b=b.apply(a)}return b}};Array.prototype.toFunction=function(){var b=this[0],c=this.slice(1);if(!b)return function(x){return x};return function(o){var a=(typeof b=='function')?b:o[b];return(typeof a=='function')?a.apply(o,c):undefined}};Function.fromObject=function(e){var f=[];for(var g in e){if(e.hasOwnProperty(g))f.push(g)}if(f.length===0)return function(x){return x};return function(o){var a=true,b,c,d;for(var i=0,n=f.length;i<n;i++){b=f[i];c=o[b];d=e[b];if(typeof c=='function'&&!(d instanceof Array))d=[d];a=a&&((typeof c=='function')?c.apply(o,d):c==d)}return a}};'filter forEach every map some'.split(/\s+/).forEach(function(d){this[d]=this[d].wrap(function(a,b,c){if(b)b=Function.from(b);return a(b,c)})},Array.prototype);(function(c){JS.extend(Ojay,{stopDefault:function(a,b){c.preventDefault(b)},stopPropagate:function(a,b){c.stopPropagation(b)},stopEvent:function(a,b){Ojay.stopDefault(a,b);Ojay.stopPropagate(a,b)},_2:function(){return Ojay(c.getTarget(this))}});Ojay.stopDefault.method=Ojay.stopDefault.partial(null).methodize();Ojay.stopPropagate.method=Ojay.stopPropagate.partial(null).methodize();Ojay.stopEvent.method=Ojay.stopEvent.partial(null).methodize();['onDOMReady','onContentReady','onAvailable'].forEach(function(a){Ojay[a]=c[a].bind(c)})})(YAHOO.util.Event);(function(g){Ojay.DomCollection=JS.Class({initialize:function(a){this.length=0;for(var i=0,n=a.length,b,c=[].push;i<n;i++){b=a[i].nodeType;if(b===Ojay.HTML.ELEMENT_NODE||b===Ojay.HTML.DOCUMENT_NODE||a[i]==window)c.call(this,a[i])}this.node=this[0];return this},toArray:function(){var a=[],i,n=this.length;for(i=0;i<n;i++)a.push(this[i]);return a},at:function(n){return new this.klass([this[Number(n).round()]])},on:function(c,d,e){var f=new JS.MethodChain();if(d&&typeof d!='function')e=d;YAHOO.util.Event.addListener(this,c,function(a){var b=Ojay(this);a.stopDefault=Ojay.stopDefault.method;a.stopPropagate=Ojay.stopPropagate.method;a.stopEvent=Ojay.stopEvent.method;a.getTarget=Ojay._2;if(typeof d=='function')d.call(e||null,b,a);f.fire(e||b)});return f},animate:function(a,b,c){var d=new Ojay.Animation(this,a,b,c);d.run();return d.chain},addClass:function(a){g.addClass(this,String(a));return this},removeClass:function(a){g.removeClass(this,String(a));return this},replaceClass:function(a,b){g.replaceClass(this,String(a),String(b));return this},setClass:function(a){for(var i=0,n=this.length;i<n;i++)this[i].className=String(a);return this},hasClass:function(a){if(!this.node)return undefined;return g.hasClass(this.node,String(a))},getStyle:function(a){if(!this.node)return undefined;return g.getStyle(this.node,String(a))},setStyle:function(a){var b,c=!!YAHOO.env.ua.ie;for(var d in a){if(c&&d=='opacity'){b=Number(a[d]);if(b===0)a[d]=0.01;if(b===1){g.setStyle(this,'filter','');continue}}g.setStyle(this,d,a[d])}return this},setAttributes:function(a){for(var i=0,n=this.length;i<n;i++){for(var b in a)this[i][b]=a[b]}return this},hide:function(){this.setStyle({display:'none'});return this},show:function(){this.setStyle({display:''});return this},setContent:function(b){if(!this.node)return this;if(b&&b.nodeType===Ojay.HTML.ELEMENT_NODE){this.node.innerHTML='';this.node.appendChild(b)}else{this.toArray().forEach(function(a){a.innerHTML=String(b)})}return this},insert:function(a,b){if(b=='replace')return this.setContent(a);var c=new Ojay.DomInsertion(this.toArray(),a,b);return this},remove:function(){this.toArray().forEach(function(a){if(a.parentNode)a.parentNode.removeChild(a)});return this},matches:function(a){if(!this.node)return undefined;return YAHOO.util.Selector.test(this.node,a)},query:function(a,b){var c=b?Ojay(b):this;if(!a)return new this.klass(c.toArray());c=c.filter({matches:a});return new this.klass(c.toArray())},parents:function(a){var b=this.map('node.parentNode');return this.query(a,b.unique())},ancestors:function(b){var c=[];this.toArray().forEach(function(a){while((a.tagName.toLowerCase()!='body')&&(a=a.parentNode)){if(c.indexOf(a)==-1)c.push(a)}});return this.query(b,c)},children:function(d){var e=[];this.toArray().forEach(function(a){var b=g.getChildren(a),c;while(c=b.shift()){if(e.indexOf(c)==-1)e.push(c)}});return this.query(d,e)},descendants:function(d){d=d||'*';var e=[];this.toArray().forEach(function(a){var b=Ojay.query(d,a),c;while(c=b.shift()){if(e.indexOf(c)==-1)e.push(c)}});return new this.klass(e)},siblings:function(d){var e=this.toArray(),f=[];e.forEach(function(a){var b=Ojay(a).parents().children(d).toArray(),c;while(c=b.shift()){if((e.indexOf(c)==-1)&&(f.indexOf(c)==-1))f.push(c)}});return new this.klass(f)},getRegion:function(){if(!this.node)return undefined;return new Ojay.Region(g.getRegion(this.node))},getWidth:function(){if(!this.node)return undefined;return this.getRegion().getWidth()},getHeight:function(){if(!this.node)return undefined;return this.getRegion().getHeight()},getTop:function(){if(!this.node)return undefined;return this.getRegion().top},getBottom:function(){if(!this.node)return undefined;return this.getRegion().bottom},getLeft:function(){if(!this.node)return undefined;return this.getRegion().left},getRight:function(){if(!this.node)return undefined;return this.getRegion().right},getCenter:function(){if(!this.node)return undefined;return this.getRegion().getCenter()},areaIntersects:function(a){if(!this.node)return undefined;var b=Ojay(a);return this.getRegion().intersects(b.getRegion())},intersection:function(a){if(!this.node)return undefined;var b=Ojay(a);var A=this.getRegion(),B=b.getRegion();return A.intersects(B)?A.intersection(B):null},areaContains:function(a){if(!this.node)return undefined;var b=Ojay(a);return this.getRegion().contains(b.getRegion())}})})(YAHOO.util.Dom);(function(){for(var f in Ojay.ARRAY_METHODS)(function(d){var e=/^(?:indexOf|lastIndexOf|unique)$/.test(d);Ojay.DomCollection.instanceMethod(d,function(){var b=e?this.toArray():[].map.call(this,function(a){return Ojay(a)});var c=b[d].apply(b,arguments);if(d=='filter')c=Ojay(c.map(function(el){return el.node}));return c})})(f)})();Ojay.fn=Ojay.DomCollection.prototype;Ojay.DomInsertion=JS.Class({initialize:function(b,c,d){if(!(b instanceof Array))b=[b];if(!(/^(?:top|bottom|before|after)$/i.test(d)))d='bottom';this._3=b.filter(function(a){return a&&a.nodeType===Ojay.HTML.ELEMENT_NODE});this._4=c;this._5=d.toLowerCase();this._6()},_6:function(){if(this._3.length===0)return;if(this._4&&this._4.nodeType)this._7();if(typeof this._4=='string')this._8()},_7:function(){var b=this.klass._9[this._5];this._3.forEach(function(a){b(a,this._4)},this)},_8:function(){var d=this.klass._9[this._5];this._3.forEach(function(a){var b=(/^(?:before|after)$/.test(this._5)?a.parentNode:a).tagName.toUpperCase();var c=this._10(b);if(/^(?:top|after)$/.test(this._5))c.reverse();c.forEach(d.partial(a))},this)},_10:function(a){var b=this.klass._11[a];var c=Ojay.HTML.div();if(b){c.innerHTML=b[0]+this._4+b[1];for(var i=0,n=b[2];i<n;i++)c=c.firstChild}else c.innerHTML=this._4;return Array.from(c.childNodes)},extend:{_9:{top:function(a,b){a.insertBefore(b,a.firstChild)},bottom:function(a,b){a.appendChild(b)},before:function(a,b){a.parentNode.insertBefore(b,a)},after:function(a,b){a.parentNode.insertBefore(b,a.nextSibling)}},_11:{TABLE:['<table>','</table>',1],THEAD:['<table><tbody>','</tbody></table>',2],TBODY:['<table><tbody>','</tbody></table>',2],TFOOT:['<table><tbody>','</tbody></table>',2],TR:['<table><tbody><tr>','</tr></tbody></table>',3],TD:['<table><tbody><tr><td>','</td></tr></tbody></table>',4],TH:['<table><tbody><tr><td>','</td></tr></tbody></table>',4],SELECT:['<select>','</select>',1]}}});Ojay.HtmlBuilder=JS.Class({initialize:function(a){this.rootNode=a||null},extend:{addTagNames:function(){var g=(arguments[0]instanceof Array)?arguments[0]:arguments;for(var i=0,n=g.length;i<n;i++)(function(e,f){e.prototype[f]=function(){var a=document.createElement(f),b,c,d;for(var j=0,m=arguments.length;j<m;j++){b=arguments[j];switch(typeof b){case'object':for(c in b){if(Number(c)==c)continue;if(c=='style')for(d in b[c])a.style[d]=b[c][d];else a[c]=b[c]}break;case'function':b(new Ojay.HtmlBuilder(a));break;case'string':a.appendChild(document.createTextNode(b));break}}if(this.rootNode)this.rootNode.appendChild(a);return a}})(this,g[i])},TAG_NAMES:["a","abbr","acronym","address","applet","area","b","base","basefont","bdo","big","blockquote","body","br","button","caption","center","cite","code","col","colgroup","dd","del","dfn","dir","div","dl","dt","em","fieldset","font","form","frame","frameset","h1","h2","h3","h4","h5","h6","head","hr","html","i","iframe","img","input","ins","isindex","kbd","label","legend","li","link","map","menu","meta","noframes","noscript","object","ol","optgroup","option","p","param","pre","q","s","samp","script","select","small","span","strike","strong","style","sub","sup","table","tbody","td","textarea","tfoot","th","thead","title","tr","tt","u","ul","var"]}});Ojay.HtmlBuilder.addTagNames(Ojay.HtmlBuilder.TAG_NAMES);Ojay.HTML=new Ojay.HtmlBuilder();JS.extend(Ojay.HTML,{ELEMENT_NODE:1,ATTRIBUTE_NODE:2,TEXT_NODE:3,CDATA_SECTION_NODE:4,ENTITY_REFERENCE_NODE:5,ENTITY_NODE:6,PROCESSING_INSTRUCTION_NODE:7,COMMENT_NODE:8,DOCUMENT_NODE:9,DOCUMENT_TYPE_NODE:10,DOCUMENT_FRAGMENT_NODE:11,NOTATION_NODE:12});Ojay.Animation=JS.Class({initialize:function(a,b,c,d){this._12=Ojay(a);this._13=b||{};this._14=c||1.0;this._15=d||{};this._16=YAHOO.util.Easing[this._15.easing||'easeBoth'];var e=this._15.after,f=this._15.before;this._17=e?Function.from(e):undefined;this._18=f?Function.from(f):undefined;this.chain=new JS.MethodChain()},_19:function(a,b,i){b=Ojay(b);if(typeof a=='function')a=a(i,b);if(typeof a!='object')return a;var c={};for(var d in a)c[d]=arguments.callee(a[d],b,i);return c}.curry(),run:function(){var e=this._12.map(this._19(this._13));var f=this._12.map(this._19(this._14));var g=f.reduce(function(a,b){return a>b?a:b},-Infinity);var h=false;var j=this._17,k=this._18;this._12.forEach(function(a,i){var b=e[i],c=f[i];var d=new YAHOO.util.ColorAnim(a.node,b,c,this._16);d.onComplete.subscribe(function(){if(YAHOO.env.ua.ie&&b.opacity&&b.opacity.to==1)this.chain.setStyle({opacity:1});if(j)j(a,i);if(c==g&&!h){h=true;this.chain.fire(this._12)}}.bind(this));if(k)k(a,i);d.animate()},this)}});(function(f){Ojay.Region=JS.Class({contains:f.prototype.contains,getArea:f.prototype.getArea,_20:f.prototype.intersect,_21:f.prototype.union,initialize:function(b){['top','right','bottom','left'].forEach(function(a){this[a]=b[a]||0},this)},getWidth:function(){return this.right-this.left},getHeight:function(){return this.bottom-this.top},getDiagonal:function(){return Math.sqrt(Math.pow(this.getWidth(),2)+Math.pow(this.getHeight(),2))},getCenter:function(){return{left:(this.left+this.right)/2,top:(this.top+this.bottom)/2}},intersection:function(a){var b=this._20(a);return new Ojay.Region(b)},intersects:function(a){var b=Math.max(this.top,a.top),c=Math.min(this.bottom,a.bottom),d=Math.max(this.left,a.left),e=Math.min(this.right,a.right);return(b<c)&&(d<e)},union:function(a){var b=this._21(a);return new Ojay.Region(b)},extend:{convert:function(a){if(a instanceof f)return new this(a);if(!(a instanceof this))a=Ojay(a).getRegion();if(!a)return undefined;else return a}}})})(YAHOO.util.Region);Ojay.Sequence=JS.Class({initialize:function(a,b,c){this._22=a;this._23=0;this._24=Function.from(b);this._25=c||null;this._26=null;this._27=false;this._28=false},_29:function(){this._24.call(this._25,this._22[this._23])},stepForward:function(){if(this._27===null){this._27=false;return this}this._29();this._23++;if(this._23>=this._22.length){this._23=0;if(this._28)this._27=this._28=false}if(this._27)setTimeout(this.method('stepForward'),this._26);return this},loop:function(a){this._26=1000*Number(a||0)||this._26;if(!this._26||this._27)return this;this._27=true;return this.stepForward()},pause:function(){if(this._27)this._27=null;return this},finish:function(){if(this._27)this._28=true;return this}});Array.prototype.sequence=function(a){return new Ojay.Sequence(this,a)};Ojay.DomCollection.include({sequence:function(b){return[].map.call(this,function(a){return Ojay(a)}).sequence(b)}});JS.MethodChain.addMethods(Ojay);JS.MethodChain.addMethods(Ojay.HTML);JS.MethodChain.prototype._=JS.MethodChain.prototype._.wrap(function(){var a=Array.from(arguments),_=a.shift();if(typeof a[0]=='string')return _(Ojay,a[0]);else return _.apply(this,a)});
Ojay.HTTP={_0:function(d,e){var f=String(d).split(/\?+/).slice(1).join('').split(/\&+/);var g=f.reduce(function(a,b){var c=b.split(/\=/);if(c[0])a[decodeURIComponent(c[0])]=decodeURIComponent(c[1]);return a},{});for(var h in e)g[h]=e[h];return g},_1:function(a){var b=this._2(a||{}),c=[];for(var d in b)c.push(encodeURIComponent(d)+'='+encodeURIComponent(b[d]));return c.join('&')},_2:function(a){var b={};for(var c in a){b[c]=(typeof a[c]=='function')?a[c]():a[c]}return b},READY_STATE:{UNINITIALIZED:0,LOADING:1,LOADED:2,INTERACTIVE:3,COMPLETE:4},VERBS:'GET POST PUT DELETE HEAD'.split(/\s+/)};Ojay.HTTP.VERBS.forEach(function(e){Ojay.HTTP[e]=function(a,b,c){var d=new Ojay.HTTP.Request(e,a,b,c);d._3();return d.chain}});Ojay.HTTP.Request=JS.Class({initialize:function(a,b,c,d){this._4=a.toUpperCase();if(Ojay.HTTP.VERBS.indexOf(this._4)==-1)return;this._5=b.split(/\?+/)[0];this._6=Ojay.HTTP._0(b,c);this._7=d||{};this.chain=new JS.MethodChain()},_3:function(){var f=Ojay.HTTP._1(this._6);var g=(this._4=='POST')?this._5:this._5+(f?'?'+f:'');var h=(this._4=='POST')?f:undefined;YAHOO.util.Connect.asyncRequest(this._4,g,{scope:this,success:function(a){var b=new Ojay.HTTP.Response(a);var c=this._7.onSuccess;var d=this._7['on'+b.status];if(typeof c=='function'){try{c(b)}catch(e){}}if(typeof d=='function'){try{d(b)}catch(e){}}this.chain.fire(b)},failure:function(a){var b=new Ojay.HTTP.Response(a);var c=this._7.onFailure;var d=this._7['on'+b.status];if(typeof c=='function'){try{c(b)}catch(e){}}if(typeof d=='function'){try{d(b)}catch(e){}}}},h)}});Ojay.HTTP.Response=JS.Class({initialize:function(b){'status statusText responseText responseXML'.split(/\s+/).forEach(function(a){this[a]=b[a]},this);this.transport=b},insertInto:function(a,b){a=Ojay(a);a.insert((this.responseText||'').stripScripts(),b||'replace');return this},evalScriptTags:function(){if(this.responseText)this.responseText.evalScripts();return this}});(function(){var i=Ojay.HTTP;var j={JS:/\.js$/i,CSS:/\.css$/i,DOMAIN:/^(https?:\/\/[^\/]+)?/i,Q:/\?+/};var k='__ojay_cross_domain__';var l=function(){Ojay(document.body).insert('<iframe name="'+k+'" style="display: none;"></iframe>','top');l=function(){}};var m=function(a){switch(true){case j.JS.test(a):return'script';break;case j.CSS.test(a):return'css';break;default:return'script';break}};var n=function(a){var b=j.DOMAIN,c=window.location.href.match(b)[0],d=a.match(b)[0];return(d==''||d==c)};JS.extend(i,{GET:i.GET.wrap(function(a,b,c,d){if(n(b)||!YAHOO.util.Get)return a(b,c,d);this.load(b,c,d)}),POST:i.POST.wrap(function(a,b,c,d){if(n(b))return a(b,c,d);this.send(b,c)}),load:function(a,b,c){var d=a.split(j.Q)[0],e=m(d);YAHOO.util.Get[e](this._8(a,b),c||{})},send:function(a,b){var c=this._9(a,b,true);l();Ojay(document.body).insert(c.node,'top');c.node.submit();c.remove()},_8:function(a,b){var c=a.split(j.Q)[0],d=this._1(this._0(a,b));return c+(d?'?'+d:'')},_9:function(c,d,e){var f=c.split(j.Q)[0],g=this._0(c,d);var h={action:f,method:'POST'};if(e)h.target=k;return Ojay(Ojay.HTML.form(h,function(a){for(var b in g)a.input({type:'hidden',name:b,value:String(g[b])})})).hide()}});i.GET.redirectTo=function(a,b){window.location.href=i._8(a,b)};i.POST.redirectTo=function(a,b){var c=i._9(a,b,false).node;Ojay(document.body).insert(c,'top');c.submit()};JS.MethodChain.addMethods(i)})();
Ojay.Mouse=JS.Singleton({include:JS.Observable,initialize:function(){this.position={left:null,top:null}},updatePosition:function(e){var a=YAHOO.util.Event.getXY(e);this.position={left:a[0],top:a[1]};this.notifyObservers(this.position)},on:function(d,e,f,g){if(!/^(?:entering|leaving)$/.test(d))throw new TypeError('Movement is not recognised');var h=(e instanceof Ojay.Region);var i=h?e:null;var e=h?null:Ojay(e);var j=false;this.addObserver(function(a){var b=i||e.getRegion();var c=this.isInside(b);if(d=='entering'&&!j&&c)f.call(g||null,this.position);if(d=='leaving'&&j&&!c)f.call(g||null,this.position);j=c},this)},isInside:function(a){a=Ojay.Region.convert(a);if(!a)return undefined;var b=this.position;return b.left>=a.left&&b.left<=a.right&&b.top>=a.top&&b.top<=a.bottom}});YAHOO.util.Event.addListener(document,'mousemove',Ojay.Mouse.method('updatePosition'));Ojay.DomCollection.include({on:Ojay.DomCollection.prototype.on.wrap(function(){var c=Array.from(arguments),d=c.shift();var e=c[0],f=c[1],g=c[2];if(!/^mouse(enter|leave)$/.test(e))return d(e,f,g);var h=e.match(/^mouse(enter|leave)$/)[1].replace(/e?$/,'ing');var i=new JS.MethodChain();if(f&&typeof f!='function')g=f;this.forEach(function(b){Ojay.Mouse.on(h,b,function(a){if(typeof f=='function')f.call(g||null,b,a);i.fire(g||b)})});return i})});
Ojay.History=(function(j){var k={'?':'--Qq--','=':'--Ee--','&':'--Aa--','_':'--Uu--','/':'--Ss--'},l=function(a){var b=decodeURIComponent(String(a));for(var c in k)b=b.replace(c,k[c]);return encodeURIComponent(b)},m=function(a){a=decodeURIComponent(String(a));for(var b in k)a=a.replace(k[b],b);return a},o=function(a){if(typeof a!='string')return a;if((/^\-?\d+(?:\.\d+)?$/.test(a)))a=Number(a);var b={'true':true,'false':false,'undefined':undefined,'null':null};for(var c in b){if(a==c)a=b[c]}return a},p=function(a){if(!a)return'';var b=[];for(var c in a)b.push(l(c)+'_'+l(a[c]));return b.join('/')},q=function(a){a=String(a).replace(/^\s*(.*?)\s*$/,'$1');if(!a)return{};var b=a.split('/'),c,d={},e;for(var i=0,n=b.length;i<n;i++){c=b[i].split('_');e=o(m(c[1]));d[m(c[0])]=e}return d};return{INTERFACE:new JS.Interface(['getInitialState','changeState']),manage:function(c,d){JS.Interface.ensure(c,this.INTERFACE);var e=String(d);var f=c.changeState.functionize();var g={};c.getInitialState=c.getInitialState.wrap(function(a){g=j.getBookmarkedState(e);if(g)g=q(g);else g=a();return g});c.changeState=function(a){a=a||{};for(var b in a)g[b]=a[b];a=p(g);j.navigate(e,a)};var h=p(c.getInitialState());j.register(e,h,function(a){a=q(a);f(c,a)});j.onLoadEvent.subscribe(function(){var a=j.getCurrentState(e);a=q(a);f(c,a)})},initialize:function(a){a=a||{};var b=(a.asset||'/robots.txt').replace(/^http:\/\/[^\/]*/ig,'');var c=a.inputID||'yui-history-field';var d=a.iframeID||'yui-history-iframe';var e=Ojay(document.body),f,g;f=Ojay.HTML.input({type:'hidden',id:c});e.insert(f,'top');g=Ojay.HTML.iframe({id:d,src:b});Ojay(g).setStyle({position:'absolute',top:0,left:0,width:'1px',height:'1px',visibility:'hidden'});e.insert(g,'top');j.initialize(c,d)}}})(YAHOO.util.History);