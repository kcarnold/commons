/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
*/
eval(function(p,a,c,k,e,r){e=function(c){return(c<62?'':e(parseInt(c/62)))+((c=c%62)<36?c.toString(36):String.fromCharCode(c+29))};if('0'.replace(0,e)==0){while(c--)r[e(c)]=k[c];k=[function(e){return r[e]||e}];e=function(){return'\\w'};c=1};while(c--)if(k[c])p=p.replace(new RegExp('\\b'+e(c)+'\\b','g'),k[c]);return p}('6.q=o.Singleton({u:o.Observable,initialize:5(){4.9={l:7,k:7}},v:5(e){3 a=D.A.G.getXY(e);4.9={l:a[0],k:a[1]};4.notifyObservers(4.9)},m:5(d,e,f,g){8(!/^(?:r|w)$/.x(d))throw z TypeError(\'Movement is not recognised\');3 h=(e instanceof 6.E);3 i=h?e:7;3 e=h?7:6(e);3 j=false;4.addObserver(5(a){3 b=i||e.getRegion();3 c=4.B(b);8(d==\'r\'&&!j&&c)f.p(g||7,4.9);8(d==\'w\'&&j&&!c)f.p(g||7,4.9);j=c},4)},B:5(a){a=6.E.convert(a);8(!a)n undefined;3 b=4.9;n b.l>=a.l&&b.l<=a.right&&b.k>=a.k&&b.k<=a.bottom}});D.A.G.addListener(document,\'mousemove\',6.q.method(\'v\'));6.y.u({m:6.y.prototype.m.wrap(5(){3 c=Array.from(arguments),d=c.shift();3 e=c[0],f=c[1],g=c[2];8(!/^F(s|t)$/.x(e))n d(e,f,g);3 h=e.match(/^F(s|t)$/)[1].replace(/e?$/,\'ing\');3 i=z o.MethodChain();8(f&&C f!=\'5\')g=f;4.forEach(5(b){6.q.m(h,b,5(a){8(C f==\'5\')f.p(g||7,b,a);i.fire(g||b)})});n i})});',[],44,'|||var|this|function|Ojay|null|if|position|||||||||||top|left|on|return|JS|call|Mouse|entering|enter|leave|include|updatePosition|leaving|test|DomCollection|new|util|isInside|typeof|YAHOO|Region|mouse|Event'.split('|'),0,{}))