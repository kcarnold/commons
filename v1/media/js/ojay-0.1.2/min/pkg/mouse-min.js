/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
*/
Ojay.Mouse=JS.Singleton({include:JS.Observable,initialize:function(){this.position={left:null,top:null}},updatePosition:function(e){var a=YAHOO.util.Event.getXY(e);this.position={left:a[0],top:a[1]};this.notifyObservers(this.position)},on:function(d,e,f,g){if(!/^(?:entering|leaving)$/.test(d))throw new TypeError('Movement is not recognised');var h=(e instanceof Ojay.Region);var i=h?e:null;var e=h?null:Ojay(e);var j=false;this.addObserver(function(a){var b=i||e.getRegion();var c=this.isInside(b);if(d=='entering'&&!j&&c)f.call(g||null,this.position);if(d=='leaving'&&j&&!c)f.call(g||null,this.position);j=c},this)},isInside:function(a){a=Ojay.Region.convert(a);if(!a)return undefined;var b=this.position;return b.left>=a.left&&b.left<=a.right&&b.top>=a.top&&b.top<=a.bottom}});YAHOO.util.Event.addListener(document,'mousemove',Ojay.Mouse.method('updatePosition'));Ojay.DomCollection.include({on:Ojay.DomCollection.prototype.on.wrap(function(){var c=Array.from(arguments),d=c.shift();var e=c[0],f=c[1],g=c[2];if(!/^mouse(enter|leave)$/.test(e))return d(e,f,g);var h=e.match(/^mouse(enter|leave)$/)[1].replace(/e?$/,'ing');var i=new JS.MethodChain();if(f&&typeof f!='function')g=f;this.forEach(function(b){Ojay.Mouse.on(h,b,function(a){if(typeof f=='function')f.call(g||null,b,a);i.fire(g||b)})});return i})});