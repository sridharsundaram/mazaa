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

//Reload AppCache.
var reloadAppCache = function() {
  var cache = window.applicationCache;
  if (cache) {
    cache.addEventListener('updateready', function(e) {
      if (cache.status == cache.UPDATEREADY) {
        // We are not reloading the page because this might cause data loss (in
        // case user is filling a form).
        cache.swapCache();
        console.log('Swapped to newer version of appcache');
        if (confirm('The next scene has been downloaded. Play it?')) {
          window.location.reload();
        }
      }
    }, false);
    cache.update();
  }
};

reloadAppCache();
window.addEventListener('load', reloadAppCache);

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
  var jsonDataStr = xhReq.getResponseText();

  changePageLoadState(DATA_RECEIVED);
  if (jsonDataStr != '') {
    var pageJsonData = (typeof JSON != 'undefined' && JSON.parse)
        ? JSON.parse(jsonDataStr) : eval('(' + jsonDataStr + ')');
    xhReq.loadDataCallback(pageJsonData);
  }
  changePageLoadState(DATA_LOADED);
}

////////////////////////////////////////////////////////////////////////////
// Nested Template methods
////////////////////////////////////////////////////////////////////////////

function createClosure(fn, xhReq, arg) {
  return function() {
    fn(xhReq, arg);
  };
}

function includeNestedTemplate(xhReq, include) {
  if (xhReq.readyState != 4) {
    return;
  }
  if (xhReq.status != 200) {
    return;
  }
  var div = document.createElement('div');
  div.innerHTML = xhReq.getResponseText();
  include.parentNode.insertBefore(div, include);
  include.parentNode.removeChild(include);
}

function getNestedTemplates() {
  var includes = document.getElementsByTagName('include');
  for ( var i = 0; i < includes.length; i++) {
    var url = includes[i].getAttribute('src');
    var xhReq = createXMLHttpRequest();
    xhReq.open('GET', url, true);
    xhReq.onreadystatechange = createClosure(includeNestedTemplate, xhReq,
        includes[i]);
    xhReq.send(null);
    console.log('Sent xhr for ' + url);
  }
}

// //////////////////////////////////////////////////////////////////////////
// API methods
// //////////////////////////////////////////////////////////////////////////

var jsonData = null;

/**
 * @param {String} relativeUrl - url from which to fetch data
 * @param {String|function} loadDataCallback - callback method to be invoked after fetch
 * @return - asynchronous. callback is is invoked with jsonData fetched
 */
function fetchAndBindData(relativeUrl, loadDataCallback) {
  jsonData = null;
  getNestedTemplates();
  if (typeof loadDataCallback == "string") {
    xhReq.loadDataCallback = eval(loadDataCallback);
  } else {
    xhReq.loadDataCallback = loadDataCallback;
  }
  requestRefresh(makeAbsoluteUrl(relativeUrl));
}


function jsonDataAvailable() { return jsonData != null; }

function prepareQuestions(tjsonData) {
  jsonData = tjsonData;
  jsonData['qa'] = createQuestions(jsonData['allsounds'], 1, 
                                         NUM_ANSWER_CHOICES);
}

function getChoice(i) {
  if (jsonData) {
    return jsonData['qa'][0].choices[i].choice;
  }
  return '?';
}

function getQuestion() {
  if (jsonData) {
    return jsonData['qa'][0].question;
  }
  return '?';
}

function getAnswer() {
  if (jsonData) {
    return jsonData['qa'][0].answer;
  }
  return '?';
}

//Copyright Mazaa Learn 2012
//@author Sridhar Sundaram

var NUM_ANSWER_CHOICES = 4;

Mazaa = function() {
};

// android interface is defined internally for Android webview.
if (typeof android == "undefined") {
  Mazaa.prototype.isBrowser = true;
  /**
   * Plays the audio corresponding to url.
   * 
   * @param url -
   *          url of the audio
   */
  Mazaa.prototype.playAudio = function(url) {
    var e = document.getElementById("audio");
    if (!e) {
      e = document.createElement("audio");
      e.id = "audio";
      e.style.display = "none";
      document.body.appendChild(e);
    }
    e.pause();
    e.src = url;
    e.load();
    e.play();
  }
} else { // Android Webview
  Mazaa.prototype.isBrowser = false;
  Mazaa.prototype.playAudio = function(url) {
    android.playAudio(url);
  }
}

function makeAbsoluteUrl(relativeUrl) {
  return location.protocol + '//' + location.host + "/" + relativeUrl;
}

mazaa = new Mazaa();

function playAudio(url) {
  mazaa.playAudio(makeAbsoluteUrl(url));
}
// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

/**
 * Swap ith and jth elements of array
 */
function swapArrayItems(array, i, j) {
  var t = array[i];
  array[i] = array[j];
  array[j] = t;
}

/**
 * Shuffles elements of array
 * 
 * @param array
 */
function shuffle(array) {
  for ( var i = 0; i < array.length - 1; i++) {
    var rnd = i + Math.floor(Math.random() * (array.length - i));
    swapArrayItems(array, i, rnd);
  }
}

/**
 * Randomly chooses numChoices indices given range low..high to choose from
 * Precondition: high - low + 1 > numChoices
 * 
 * @param {Integer}
 *          low - low end of range inclusive
 * @param {Integer}
 *          high - high end of range inclusive
 * @param {Integer}
 *          numChoices - number of choices required
 * @param {Integer}
 *          ansIndex - index of answer
 * @return array of choice indices (no duplicates)
 */
function createChoices(low, high, numChoices, ansIndex) {
  var choiceIndices = [ ansIndex ];
  while (choiceIndices.length < numChoices) {
    var rnd = low + Math.floor(Math.random() * (high - low + 1));
    if (choiceIndices.indexOf(rnd) == -1) {
      // TODO(ssundaram): this is inefficient - can be done better.
      choiceIndices.push(rnd);
    }
  }
  return choiceIndices;
}

function QuestionAnswer() {
}

/**
 * Randomly creates numQuestions multiple-choice questions. Given an array of
 * [question, answer] pairs, outputs questions each with question, numChoices
 * choices and answer.
 * 
 * @param {Array.
 *          <Array.<question, answer>>} qaArray - array of qa pairs
 * @param {Integer}
 *          numQuestions - number of questions to be generated
 * @param {Integer}
 *          numAnswerChoices - number of answer choices per question
 * @return {Array.<Object.<question, answer, Array.<choices>>} list of qa
 */
QuestionAnswer.prototype.create = function(id, question, answer, opt_choices) {
  return {
    id : id,
    question : question,
    answer : answer,
    choices : opt_choices
  };
}

QuestionAnswer.prototype.compare = function(that) {
  return this.question == that.question && this.answer == that.answer
      && Array.equals(this.choices, that.choices);
}

var QA = new QuestionAnswer();

function createQuestions(qaArray, numQuestions, numAnswerChoices) {
  var qaList = [];
  for ( var i = 0; i < numQuestions; i++) {
    // Choose the question-answer pair
    var qaIndex = i + Math.floor(Math.random() * (qaArray.length - i));
    // Generate choices - for now, we choose randomly
    var ansChoices = createChoices(0, qaArray.length - 1, numAnswerChoices,
        qaIndex);
    // Set up the choices
    var choices = [];
    for ( var j = 0; j < numAnswerChoices; j++) {
      var choice = qaArray[ansChoices[j]].answer;
      choices.push({
        choice : choice,
        correct : choice == qaArray[qaIndex].answer
      });
    }
    shuffle(choices);
    qaArray[qaIndex].choices = choices;
    qaList.push(qaArray[qaIndex]);
    // Ensure this question-answer pair will not be used for another question.
    swapArrayItems(qaArray, i, qaIndex);
  }

  return qaList;
}
