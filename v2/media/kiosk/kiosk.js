var activityCount = 0;
var TIMEOUT = 250000;  // Give a timeout of 250 sec ~ 4 min
function refreshIfActivityCountIs(n) {
    if( activityCount == n ) {
	window.location.href="http://new-caledonia.media.mit.edu:81/site_media/kiosk/kiosk.html";
    }
}
function on_activity(e){
    activityCount += 1;
    setTimeout("refreshIfActivityCountIs(" + activityCount + ")", TIMEOUT);
}
YAHOO.util.Event.addListener(document, "mousedown", on_activity );
YAHOO.util.Event.addListener(document, "keydown", on_activity );
YAHOO.util.Event.addListener(document, "mousemove", on_activity );
setTimeout("refreshIfActivityCountIs(0)", TIMEOUT);