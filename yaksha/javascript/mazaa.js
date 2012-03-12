// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

var NUM_ANSWER_CHOICES = 4;

Mazaa = function() {
};

// android interface is defined internally for Android webview.
if (typeof android == "undefined") {
  Mazaa.prototype.isBrowser = true;
  /**
   * Plays the audio corresponding to url.
   * @param url - url of the audio
   */
  Mazaa.prototype.playAudio = function(url) {
    var e = document.getElementById("audio");
    if (!e) {
        e = document.createElement("audio");
        e.id = "audio";
    }
    e.pause();
    e.src = url;
    e.load();
    e.play();
  }
} else { // Android Webview
  Mazaa.prototype.isBrowser = false;
  Mazaa.prototype.playAudio = function(url) { android.playAudio(url); }
}

Mazaa.prototype.playAudioSequence = function(urlArray) {
  if (urlArray.length == 0) return;
  var e = document.getElementById("audio");
  if (!e) {
      e = document.createElement("audio");
      e.id = "audio";
      e.style.display = "none";
      document.body.appendChild(e);
  }
  
  var url = urlArray.shift();
  e.src = url;
  e.load();
  e.addEventListener('ended', function() { Mazaa.prototype.playAudioSequence(urlArray); });
  e.play();
}

function makeAbsoluteUrl(relativeUrl) {
  return location.protocol + '//' + location.host + "/" + relativeUrl;
}

mazaa = new Mazaa();

// Check if a new app-cache is available on page load.
window.addEventListener('load', function(e) {
  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      // Swap it in and reload the page to get the new hotness.
      window.applicationCache.swapCache();
      if (confirm('The next scene has been downloaded. Play it?')) {
        window.location.reload();
      }
    } else {
      // Manifest didn't change - Nothing new to serve
    }
  }, false);
}, false);
