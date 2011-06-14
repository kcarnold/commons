// OpenMind Commons - Scripting
//  Author: Kenneth Arnold <kcarnold@media>

//function $(x) { return document.getElementById(x); }

var loginVisible = false;
function loginClicked() {
    loginVisible = !loginVisible;
    $('#login').node.className = (loginVisible ? 'visible' : 'hidden');
    return false; // prevent the default action
}

var YUC = YAHOO.util.Connect;
var JSON = YAHOO.lang.JSON;
var YEvent = YAHOO.util.Event;

var mark_spam_url = '/json/mark_spam/';
function mark_spam(id) {
    $('#pred_'+id).className = 'assertion_disabled';
    var callbacks = {
		success: function(o) {},
		failure: function(){alert('Problem marking '+id+' as spam.')}
    }
    url = mark_spam_url;
    var transaction = YUC.asyncRequest('POST', url,
						      callback,
						      'assertion_id='+id);
}

/** Rating buttons */
var user_logged_in = true; // we'll find out otherwise in the init.
var rating_buttons = new Object();

var rate_url = '/json/rate/';
function rate(pred, value) {
	go_json('POST', rate_url, function(){}, null, 'assertion_id='+pred+'&rating_value='+value);
}

function click_button(id, tag) {
	if (!user_logged_in) {
		alert(gettext('You must be logged in to rate.\n\nClick Login or Sign Up in the top bar.'));
		return;
	}

	var parts = id.match(/^rate_(\d+)$/);
	var pred_id = parts[1], which = tag;
	var set_id = 'rate_'+pred_id;
	var set = rating_buttons[set_id];
	
	var cur = set.get_current();
	if (cur == which) {
		// clicked an enabled rating. unrate.
		set.toggle(null);
		rate(pred_id, 'none');
	} else {
		// rating changed.
		set.toggle(which);
		rate(pred_id, which);
	}
}

var classes = {
	Good: 'rate_up',
	Bad: 'rate_down',
	Fix: 'rate_fix'
};

function active(tag) { return classes[tag]+'_act'; }
function inact(tag) { return classes[tag]+'_inact'; }

function over_button(id, tag) {
	if( tag == null ) return;
	$.byId(id + '_' + tag).node.className = active(tag);
}
function out_button(id, tag) {
	if( tag == null ) return;
	if( tag == rating_buttons[id]._current ) return;
	$.byId(id + '_' + tag).node.className = inact(tag);
}
function clickHandler(id, tag) { return function(e) { click_button(id, tag); }; }
function overHandler(id, tag) {	return function(e) { over_button(id, tag); }; }
function outHandler(id, tag) { return function(e) { out_button(id, tag); }; }

function make_buttons(container, id) {
	var set = rating_buttons[id];
	if (set == null) {
		rating_buttons[id] = set = new ButtonSet(id);
	}

	function make_button(id, tag) {
		var el=document.createElement('img');
		el.setAttribute('src', '/media/images/blank.gif');
		var btn_id = id+'_'+tag;
		el.setAttribute('alt', tag);
		el.setAttribute('title', 'Rate as '+tag);
		el.className = inact(tag);
		el.setAttribute('id', btn_id);
		var o_el = $(el);
		o_el.on('click', clickHandler(id, tag));
		o_el.on('mouseover', overHandler(id, tag));
		o_el.on('mouseout', outHandler(id, tag));
		container.appendChild(el);
	}

	// Make new buttons
	make_button(id, 'Good');
	make_button(id, 'Bad');
	//make_button(id, 'Fix');
}

function ButtonSet(id) {
	this.id = id;
}
ButtonSet.prototype.toggle = function(tag) {
	var last = this._current;
	this._current = tag;
	over_button(this.id, tag);
	out_button(this.id, last);
};
ButtonSet.prototype.get_current = function() {
	return this._current;
};


function init_ratings() {
	var spans = YAHOO.util.Selector.query('.rate');
	for (var i=0; i<spans.length; i++) {
		var span = spans[i];
		var id = span.id;
		// create the buttons
		make_buttons(span, id);

		// set the current one active as specified by data (a comment).
		var data = span.firstChild.data;
		var cur;
		switch(data) {
		case 'none': cur = null; break;
		case 'Good':
		case 'Bad':
		case 'Fix':
			cur = data;
			break;
		case 'need_login':
			user_logged_in = false;
		default:
			cur = null;
		}
		rating_buttons[id].toggle(cur);
	}
}

init_ratings();

function get_json(url, handler, error_handler) {
	go_json('GET', url, handler, error_handler);
}
function go_json(method, url, handler, error_handler, postdata) {
    YUC.asyncRequest(method, url, {
	success: function (o) {
	    try {
		response = JSON.parse(o.responseText);
	    } catch (x) {
		if (console)
		    console.error('JSON parse error while parsing "%s"', o.responseText);
		return;
	    }
	    
	    if (response.result == 'ok') return handler(response);
	    else if (error_handler) error_handler(response.text);
	    else console.error('server indicated failure: %o', response);
	},

	failure: function (o) {
        if (!error_handler) return;
	    try {
		// Try parsing the error as JSON.
		error_handler(JSON.parse(o.responseText).text);
	    } catch (x) {
		if (o.responseText)
		    error_handler(o.responseText);
		else 
		    error_handler(o.statusText);
	    }
	}
		}, postdata);
}

function load_similarities(concept) {
	// Query for similar concepts.
	get_json('../../concepts/near/'+encodeURIComponent(concept)+'/',
			 function (json) {
				 var sims = response.similar;

				 // Get the logs of all the scores. (and min and max)
				 var scores = new Array();
				 var best = Number.MIN_VALUE, worst = Number.MAX_VALUE;
				 for (i=0; i<sims.length; i++) {
					 var score = Math.log(sims[i].score);
					 if (score > best) best = score;
					 if (score < worst) worst = score;
					 scores[i] = score;
				 }
				 var sizes = new Array();
				 for (i=0; i<sims.length; i++)
					 sizes[i] = (8 + 16*(scores[i]-worst)/(best-worst)).toFixed(0);
				 
				 $('#similar').insert(section_heading(gettext('Similar concepts')));
				 var span = document.createElement('span');
				 for (i=0; i<sims.length; i++) {
					 if (i != 0)
						 span.appendChild(document.createTextNode(', '));
					 var link = document.createElement('a');
					 link.setAttribute('href', '../'+encodeURIComponent(sims[i].text));
					 link.style.fontSize = String(sizes[i])+'pt';
					 link.appendChild(document.createTextNode(sims[i].text));
					 span.appendChild(link);
				 }
				 $('#similar').insert(span);
			 });
}

function section_heading(text) {
	return $.HTML.div({'className': 'viewheading'}, function(A) {
			A.div({'className': 'lefthead'}, text);
		});
}


function hidden_input(name, value) {
	return $.HTML.input({type: 'hidden', name: name, value: value});
}

function load_questions(concept) {
    // Query for similar concepts.
    get_json('../../predicted/'+encodeURIComponent(concept)+'/',
	function (json) {
	    var res = response.predictions;
	    var questions = $('#questions');
	    
	    questions.insert(section_heading(gettext('Open Mind wants to know...')));

	    for (var i=0; i<res.length; i++) {
		var form = $.HTML.form({});
		questions.insert(form);
		form = $(form);
		var r = res[i];
		var html = r.frame.replace(/\{(\d+)\}/g, function(str, idx) {
			var concept;
			if (idx=='1') concept=r.left;
			else concept=r.right;
			return '<input type="text" name="text'+idx+'" value="'+concept+'" size="15"></input>';
		    });
		html += ' ';
		form.insert(html);
		form.insert($.HTML.span({className: 'status'}));
		form.insert(hidden_input('activity', 'pycommons/question'));
		form.insert(hidden_input('frame_id', r.frame_id));
		form.insert(hidden_input('rating', 'Good'));
		var good_btn = $.HTML.button({type: 'button'});
		form.insert(good_btn);
		good_btn = $(good_btn);
		good_btn.insert('+');
		good_btn.on('click', question_onclick(form, 'Good'));

		var bad_btn = $.HTML.button({type: 'button'});
		form.insert(bad_btn);
		bad_btn = $(bad_btn);
		bad_btn.insert('-');
		bad_btn.on('click', question_onclick(form, 'Bad'));
	    }
	});
}

function load_partial_questions(concept) {
    // Like load_questions, but one of the concepts is going to be blank.
    get_json('../../predicted_partial/'+encodeURIComponent(concept)+'/',
	function (json) {
	    var res = response.predictions;
	    var questions = $('#partial_questions');
	    
	    questions.insert(section_heading(gettext('Open Mind wants to know...')));

	    for (var i=0; i<res.length; i++) {
		var form = $.HTML.form({});
		questions.insert(form);
		form = $(form);
		var r = res[i];
		var html = r.frame.replace(/\{(\d+)\}/g, function(str, idx) {
		    var concept;
		    if (idx=='1') concept=r.left;
		    else concept=r.right;
		    return '<input type="text" name="text'+idx+'" value="'+concept+'" size="15"></input>';
		});
		html += ' ';
		form.insert(html);
		form.insert($.HTML.span({className: 'status'}));
		form.insert(hidden_input('activity', 'pycommons/question'));
		form.insert(hidden_input('frame_id', r.frame_id));
		form.insert(hidden_input('rating', 'Good'));
		var good_btn = $.HTML.button({type: 'button'});
		form.insert(good_btn);
		good_btn = $(good_btn);
		good_btn.insert('+');
		good_btn.on('click', question_onclick(form, 'Good'));

		var bad_btn = $.HTML.button({type: 'button'});
		form.insert(bad_btn);
		bad_btn = $(bad_btn);
		bad_btn.insert('-');
		bad_btn.on('click', question_onclick(form, 'Bad'));
	    }
	});
}


function question_onclick(form, rating) {
	return function() {
		form.children('button').hide();
		form.children('[name=rating]').node.value = rating;
		YUC.setForm(form.node);
		go_json('POST', '/json/add/', function(json) {
				form.children('.status').setContent('Knowledge accepted.');
			}, function(error_text) {
				form.children('.status').setContent('Error: '+error_text);
			});
		return false;
	}
}


function load_concept_data(concept) {
	load_similarities(concept);
	load_questions(concept);
}
