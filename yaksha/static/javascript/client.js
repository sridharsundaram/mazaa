// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements the Blink Client in javascript.
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

// //////////////////////////////////////////////////////////////////////////
// Flags.
// TODO(ssundaram): Push flags from server or find a better way to do this
// //////////////////////////////////////////////////////////////////////////
/**
 * @define {boolean} If true, debug messages are logged to console.
 */
var FLAGS_log_to_console = false;

var __console_log = null;
if (typeof(console) === 'undefined') {
  console = {};
}
if (console['log']) {
  __console_log = console.log;
}
console.log = function(str) {
  if (FLAGS_log_to_console && __console_log) {
    __console_log.call(console, str);
  }
};

// Reload AppCache.
var reloadAppCache = function() {
  var cache = window.applicationCache;
  if (cache) {
    cache.addEventListener('updateready', function(e) {
      if (cache.status == cache.UPDATEREADY) {
        // We are not reloading the page because this might cause data loss (in
        // case user is filling a form).
        cache.swapCache();
        console.log('Swapped to newer version of appcache');
      }
    }, false);
  }
};
reloadAppCache();

// //////////////////////////////////////////////////////////////////////////
// XHR related variables and methods
// //////////////////////////////////////////////////////////////////////////

/**
 * http://www.w3.org/TR/XMLHttpRequest/
 * The XMLHttpRequest object can be in several states as below:
 */

var XHR_UNSENT = 0;            // Object has been constructed
var XHR_OPENED = 1;            // Headers can be set, request can be sent
var XHR_HEADERS_RECEIVED = 2;  // HTTP headers of response received
var XHR_LOADING = 3;           // Response entity body received
var XHR_DONE = 4;              // Data transfer completed
var XHR_TIMEOUT = 5000;        // Timeout for the XHR request

function makeXMLHttpRequest() {
  try { return new XMLHttpRequest(); } catch (e) {}
  try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {}
  alert('XMLHttpRequest not supported');
  return null;
}

function createXMLHttpRequest() {
  var request = makeXMLHttpRequest();
  if (request == null) return null;

  request.getReadyState = function() { return request.readyState; }
  request.getStatus = function() { return request.status; }
  request.getUrl = function() { return request.url; }
  request.setUrl = function(url) { request.url = url; }
  request.getResponseText = function() { return request.responseText; }
  request.url = '';
  request.onreadystatechange = refresh;

  return request;
}

var xhReq = createXMLHttpRequest();

// //////////////////////////////////////////////////////////////////////////
// Critical Data, Images, NonCritical load methods
// //////////////////////////////////////////////////////////////////////////

// TODO(ssundaram): Add prs, cprc, prc events to CSI dashboard
var DATA_REFRESH_START = 'prs';
var WAITING_FOR_DATA = 'wfd';
var DATA_RECEIVED = 'cdr';
var DATA_LOADED = 'cdl';
var COMPLETED = 'c';
// State Transition Diagram
// DataRefreshStart --> WaitingForData --> DataReceived --> DataLoaded --> Completed
// The start state is this one where the XHR will be dispatched.
var pageLoadState = DATA_REFRESH_START;

// //////////////////////////////////////////////////////////////////////////
// Cookie handling methods
// //////////////////////////////////////////////////////////////////////////

function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = '; expires=' + date.toGMTString();
  }
  else var expires = '';
  document.cookie = name + '=' + value + expires + '; ';
}

function readCookie(name) {
  var nameEQ = name + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name, '', -1);
}


// //////////////////////////////////////////////////////////////////////////
// Page refresh and event handling methods
// //////////////////////////////////////////////////////////////////////////

function setWindowLocation(url, hashFragment) {
  window.location = url + '#' + hashFragment;
}

function changePageLoadState(newState) {
  pageLoadState = newState;
}

function requestRefresh(url) {
  if (xhReq.getUrl() == url) {
    console.log('refreshing');
    refresh();
    return;
  }
  xhReq.abort();
  // TODO(ssundaram): Handle URL better than as part of csiTimings here.
  xhReq.setUrl(url);
  changePageLoadState(DATA_REFRESH_START);
  changePageLoadState(WAITING_FOR_DATA);

  console.log('Sending GET request for ' + url);
  xhReq.open('GET', url, true);
  xhReq.send(null);
}

function refresh() {
  // Improper state
  if (xhReq.getReadyState() != XHR_DONE)
    return;

  // Improper status.
  if (xhReq.getStatus() != 200) return;

  changePageLoadState(DATA_RECEIVED);
  instantiatePage(xhReq.getResponseText());
  changePageLoadState(DATA_LOADED);
}

// //////////////////////////////////////////////////////////////////////////
// Other methods
// //////////////////////////////////////////////////////////////////////////

function doQuizRefresh() {
  getNestedTemplates();
  requestRefresh(window.location.protocol + '//' + window.location.host + '/vocabulary');
}

// //////////////////////////////////////////////////////////////////////////
// Template related methods
// //////////////////////////////////////////////////////////////////////////

var templateManager = new TemplateManager();

/**
 * Instantiate the templates in the HTML page.
 * @param jsonDataStr {String} - json string containing template data
 * @param incremental {boolean} - whether instantiation is incremental
 * @return dictionary of pushed image elements from the template
 */
function instantiatePage(jsonDataStr) {
  if (jsonDataStr == '') {
    return;
  }
  var jsonData = (typeof JSON != 'undefined' && JSON.parse)
      ? JSON.parse(jsonDataStr) : eval('(' + jsonDataStr + ')');
  var words = jsonData['words'];
  shuffle(words, 10);
  templateManager.applyTemplate(jsonData);
}

function createClosure(fn, xhReq, arg) {
  return function() { fn(xhReq, arg); };
}

// TODO(ssundaram): Should move to template.js
function includeNestedTemplate(xhReq, include) {
  if (xhReq.readyState != 4) { return; }
  if (xhReq.status != 200) { return; }
  var div = document.createElement('div');
  div.innerHTML = xhReq.getResponseText();
  include.parentNode.insertBefore(div, include);
  include.parentNode.removeChild(include);
}

function getNestedTemplates() {
  var includes = document.getElementsByTagName('include');
  for (var i = 0; i < includes.length; i++) {
    var url = includes[i].getAttribute('src');
    var xhReq = createXMLHttpRequest();
    xhReq.open('GET', url, true);
    xhReq.onreadystatechange =
        createClosure(includeNestedTemplate, xhReq, includes[i]);
    xhReq.send(null);
    console.log('Sent xhr for ' + url);
  }
}
