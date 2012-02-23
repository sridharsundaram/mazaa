// Copyright Mazaa Learn 2012
// @author Sridhar Sundaram

var NUM_COLUMNS = 2;

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

function makeAbsoluteUrl(relativeUrl) {
  return location.protocol + '//' + location.host + "/" + relativeUrl;
}

function createSoundFunction(url) {
  return function() { mazaa.playAudio(url); };
}

Mazaa.prototype.associateImagesWithSounds = function(images, sounds) {
  // Store association table into local storage 
  // TODO(sridhar): merge - do not overwrite
  localStorage["__images"] = JSON.stringify(images);
  localStorage["__sounds"] = JSON.stringify(sounds);
  // Show basic scene for familiarity of user
  var table = document.createElement("table");
  table.id = "scene";
  for (var i = 0; i < images.length; ) {
    var row = document.createElement("tr");
    table.appendChild(row);
    for (var j = 0; j < NUM_COLUMNS; j++, i++) {
      var col = document.createElement("td");
      row.appendChild(col);
      var img = document.createElement("img");
      img.height = img.width = 100;
      img.src = images[i];
      img.onclick = createSoundFunction(makeAbsoluteUrl(sounds[i]));
      col.appendChild(img);
    }
  }
  document.body.appendChild(table);
  // Add game button at the end
  var button = document.createElement("input");
  button.type = "button";
  button.value = "Play Game";
  button.onclick = mazaa.playGame;
  document.body.appendChild(button);
  document.body.appendChild(document.createElement('br'));
}

Mazaa.prototype.playGame = function() {
  var scene = document.getElementById("scene");
  if (scene) {
    scene.parentNode.removeChild(scene);
  }
  var images = JSON.parse(localStorage["__images"]);
  var sounds = JSON.parse(localStorage["__sounds"]);
  var matchIndices = [];
  while (matchIndices.length < 4) {
    var rnd = Math.floor(Math.random() * images.length);
    if (matchIndices.indexOf(rnd) != -1) continue;
    matchIndices.push(rnd);
  }
  var answerIndex = Math.floor(Math.random() * matchIndices.length);
  var testSoundIcon = document.getElementById("testSoundIcon");
  if (!testSoundIcon) {
    testSoundIcon = document.createElement('img');
    testSoundIcon.src = 'sound_icon.jpg';
    testSoundIcon.id = "testSoundIcon";
    testSoundIcon.height = testSoundIcon.width = 50;
    document.body.appendChild(testSoundIcon);
  }
  var testSound = sounds[matchIndices[answerIndex]];
  testSoundIcon.onclick = createSoundFunction(makeAbsoluteUrl(testSound));
  mazaa.playAudio(makeAbsoluteUrl(testSound));
  
  var table = document.createElement("table");
  table.id = "scene";
  for (var i = 0; i < matchIndices.length;) {
    var row = document.createElement("tr");
    table.appendChild(row);
    for (var j = 0; j < NUM_COLUMNS; j++, i++) {
      var col = document.createElement("td");
      row.appendChild(col);
      var img = document.createElement("img");
      img.height = img.width = 100;
      img.src = images[matchIndices[i]];
      if (i == answerIndex) {
        img.onclick = function() {
          mazaa.playAudio(makeAbsoluteUrl('success.mp3'));
          setTimeout(mazaa.playGame, 1000);
        }
      } else {
        img.onclick = 
          createSoundFunction(makeAbsoluteUrl('failure.mp3'));
      }
      col.appendChild(img);
    }
  }
  document.body.appendChild(table);
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
