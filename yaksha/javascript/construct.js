// Copyrite Maza Learn 2012
// @Author Rishi Chandra

// Global Variables : Can be removed in integration
var subjectArray = ["Man","He", "Boy", "Woman", "Girl", "doctor"];
var verbArray = ["Likes", "Is-Watching", "Is-Cleaning", "Is-Writing", "Walks-To", "Is-Buying" ];
var objectArray = ["Movies", "Football", "The-Kitchen", "A-Novel", "The-Hospital", "Shoes"];
var audfilesArray = ["Man", "He", "Boy", "Woman", "Girl", "doctor", "Likes", "Is-Watching", "Is-Cleaning", "Is-Writing", "Walks-To", "Is-Buying", "Movies", "Football", "The-Kitchen", "A-Novel", "The-Hospital", "Shoes"];
var solution = [0,0,0];
var lastPlayed = "";

// Change the default and make it drop-able
function allowDrop(ev){
	ev.preventDefault();
}

// onDragStart will call this event
function drag(ev){
	ev.dataTransfer.setData("Text",ev.target.id);
}

// onDrop will call this and append the DOM
function drop(ev){
	var data=ev.dataTransfer.getData("Text");
	ev.target.appendChild(document.getElementById(data));
	ev.preventDefault();
	var e = document.getElementById('audiotag1');
	e.src="dropped.mp3";
	e.play();
	playSolution();
}

Mazaa = function () { };

Mazaa.prototype.playAudioSequence = function (urlArray) {
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
    e.addEventListener('ended', function () { Mazaa.prototype.playAudioSequence(urlArray); });
    e.play();
};



// Hindi will be audio mp3 files, played with HTML5 audio tag [does not work in Firefox]
function speakTextInHindi() {
	document.getElementById('audiotag1').play();
}

// Can Use a TTS default voice, can be changed to some other accent also, works in both Firefox and Chrome
// Using Micrisoft Anna offline recorded.
function speakText(element){
    var data = element.getAttribute("id");
    //	speak(data, { pitch: 30, speed: 120 });
    var aud = document.getElementById("aud-" + data);
    aud.load();
    aud.play();
    lastPlayed = data;
}


// Random number generation for naming images, files 
function getNumber(n) {
	var randomnumber=Math.floor(Math.random()*n);
	return randomnumber ;	
}

// This lays out the 3 x 3 matrix of images [with sound]
function makeTable() {
    var sArr = [0, 0, 0];
    var vArr = [0, 0, 0];
    var oArr = [0, 0, 0];

	var tb = document.createElement("table");

	for (var i = 0 ; i <3; i++){
		var rw = document.createElement("tr");
		for (var j =0; j <3; j++){

			var cl = document.createElement("td");
			cl.style.width = cl.style.height = "120px";
			var img = document.createElement("img");
			img.height = img.width = 100;
			// Currently random, but can change to meaningful combinations later
			if (j == 0) { var d = getNumber(6); img.id = subjectArray[d]; img.src = "" + subjectArray[d] + ".jpg";sArr[i] =  d;}
			if (j == 1) { var d = getNumber(6); img.id = verbArray[d]; img.src = "" + verbArray[d] + ".jpg"; vArr[i] =  d; }
			if (j == 2) { var d = getNumber(6); img.id = objectArray[d]; img.src = "" + objectArray[d] + ".jpg"; oArr[i] = d; }
			img.draggable="true";
			img.ondragstart=drag;
			var fn = function(){speakText(this);};
			img.onclick=fn;
			cl.appendChild(img);
			rw.appendChild(cl);
		}
		tb.appendChild(rw);
	}
	document.body.appendChild(tb);
	solution[0] = sArr[getNumber(3)];
	solution[1] = vArr[getNumber(3)];
	solution[2] = oArr[getNumber(3)];

	//Load all audio files
    
	for (var i = 0; i < 18; i++) {
	    var aud = document.createElement("audio");
	    aud.id = "aud-" + audfilesArray[i];
	    aud.src = "" + audfilesArray[i] + ".mp3";
	    aud.preload = "auto";

	    document.body.appendChild(aud);
	}
    
	startCountDown(30, 1000, myFunction);
	play();

	if (sessionStorage.score){
    		//do nothing;
	}
	else{
	        sessionStorage.score=0;
   	}
    var h = document.createElement("a");
    h.href = "practice-construction.html";
    h.innerHTML = "PRACTICE";
    document.body.appendChild(h);
    
}
function play() {

    var data1 = document.getElementById(subjectArray[solution[0]]).getAttribute("id");
    var aud1 = document.getElementById("aud-" + data1);
    var data2 = document.getElementById(verbArray[solution[1]]).getAttribute("id");
    var aud2 = document.getElementById("aud-" + data2);
    var data3 = document.getElementById(objectArray[solution[2]]).getAttribute("id");
    var aud3 = document.getElementById("aud-" + data3);

    var mazaa = new Mazaa();
    mazaa.playAudioSequence([aud1.src, aud2.src, aud3.src]);

}
// To play the assembled solution
function playSolution() {

    var cN1 = document.getElementById('div1').getElementsByTagName('img');
    var data1 = cN1.item(0).getAttribute("id");
    if (data1 = "") return;
    var aud1 = document.getElementById("aud-" + data1);

    var cN2 = document.getElementById('div2').getElementsByTagName('img');
    var data2 = cN2.item(0).getAttribute("id");
    if (data2 = "") return;
    var aud2 = document.getElementById("aud-" + data2);

    var cN3 = document.getElementById('div3').getElementsByTagName('img');
    var data3 = cN3.item(0).getAttribute("id");
    if (data3 = "") return;
    var aud3 = document.getElementById("aud-" + data3);

//    var mazaa = new Mazaa();
//    mazaa.playAudioSequence([aud1.src, aud2.src, aud3.src]);

    if (isItCorrect(cN1.item(0), cN2.item(0), cN3.item(0)) == 1) {
        var e = document.getElementById('audiotag1');
        e.src = "success.mp3";
        e.play();
        sessionStorage.score = Number(sessionStorage.score) + 15;
    }
    else {
        var e = document.getElementById('audiotag1');
        e.src = "failure.mp3";
        e.play();
        sessionStorage.score = Number(sessionStorage.score) - 5;
    }
    var t = setTimeout("reLoad()", 3000);
}
function reLoad(){
	window.location.reload();
}

function isItCorrect(e1,e2,e3) {
    var d1 = e1.getAttribute("id");
    var d2 = e2.getAttribute("id");
    var d3 = e3.getAttribute("id");
    if (d1 == subjectArray[solution[0]] && d2 == verbArray[solution[1]] && d3 == objectArray[solution[2]]) {
        return 1;
    }
    else {
        return 0;
    }
}

function startCountDown(i, p, f) {
    // store parameters
    var pause = p;
    var fn = f;
    // get the countdown obj
    var countDownObj = document.getElementById("countDown");
    countDownObj.count = function (i) {
        // write out count
        this.innerHTML = "Time Left : " +  i + "  ....................................  Score: " + sessionStorage.score;
        if (i == 0) {
            // execute function
            fn();
            // stop
            return;
        }
        setTimeout(function () {
            // repeat
            countDownObj.count(i - 1);
        },pause);
    }
    // set it going
    countDownObj.count(i);
}

function myFunction() {
    alert("Time Up [-10]");
    sessionStorage.score = Number(sessionStorage.score) - 10;
    reLoad();
}

function wait(ms) {
    var dt = new Date();
    dt.setTime(dt.getTime() + ms);
    while (new Date().getTime() < dt.getTime());
}

function makeTableForPractice() {

    var sArr = [0, 0, 0, 0, 0, 0];
    var vArr = [0, 0, 0, 0, 0, 0];
    var oArr = [0, 0, 0, 0, 0, 0];

    var tb = document.createElement("table");

    for (var i = 0; i < 7; i++) {
        var rw = document.createElement("tr");
        for (var j = 0; j < 3; j++) {

            var cl = document.createElement("td");
            cl.style.width = cl.style.height = "120px";
            var img = document.createElement("img");
            img.height = img.width = 100;
            // Currently random, but can change to meaningful combinations later
            if (j == 0) { var d = getNumber(6); img.id = subjectArray[d]; img.src = "" + subjectArray[d] + ".jpg"; sArr[i] = d; }
            if (j == 1) { var d = getNumber(6); img.id = verbArray[d]; img.src = "" + verbArray[d] + ".jpg"; vArr[i] = d; }
            if (j == 2) { var d = getNumber(6); img.id = objectArray[d]; img.src = "" + objectArray[d] + ".jpg"; oArr[i] = d; }
            img.draggable = "true";
            img.ondragstart = drag;
            var fn = function () { speakText(this); };
            img.onclick = fn;
            cl.appendChild(img);
            rw.appendChild(cl);
        }
        tb.appendChild(rw);
    }
    document.body.appendChild(tb);
    solution[0] = sArr[getNumber(6)];
    solution[1] = vArr[getNumber(6)];
    solution[2] = oArr[getNumber(6)];

    var h = document.createElement("a");
    h.href = "construction.html";
    h.innerHTML = "PLAY GAME";
    document.body.appendChild(h);

    //Load all audio files

    for (var i = 0; i < 18; i++) {
        var aud = document.createElement("audio");
        aud.id = "aud-" + audfilesArray[i];
        aud.src = "" + audfilesArray[i] + ".mp3";
        aud.preload = "auto";

        document.body.appendChild(aud);
    }

    play();

}

function playH() {
    var e = document.getElementById('audiotag1');
    e.src = "" + lastPlayed + "-h.mp3";
    e.play();
    aud.load();
    aud.play();
}
