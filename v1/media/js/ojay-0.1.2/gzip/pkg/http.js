/*
Copyright (c) 2007-2008 the OTHER media Limited
Licensed under the BSD license, http://ojay.othermedia.org/license.html
*/
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
