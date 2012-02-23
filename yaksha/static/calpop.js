/*------------------------------------------------------------------------------
  Copyright(c) 2005 Google Inc. All rights reserved.

    CalendarPopup Class - A popup calendar for selecting a single date .
    Required Files - calpop.js (this file), calpop.css, calpop.html

    Author: nmoon@google.com (Nathan Moon)
    Modified by: dzen@google.com (Daniel Zen)

------------------------------------------------------------------------------*/

/*------------------------------------------------------------------------------
  CalendarPopup Class
    beginDate = YYYYMMDD formated begin date
    EndDate   = YYYYMMDD formated end date
    monthString = the array of string months (for localization)
------------------------------------------------------------------------------*/
function CalendarPopup (formField,beginDate,endDate,onColor,offColor) {
  this._formField=formField;
  this._timer=0;
  this._width=0;
  this._height=0;
  this._onColor="#9BBDDE";
  this._offColor="#CDDEEE";
  this._monthString=new Array("Jan","Feb","Mar","Apr","May",
    "Jun","Jul","Aug","Sep","Oct","Nov","Dec");

  this.hasEndLimit = false;
  this.endLimitDate = new Date();
  this.hasBeginLimit = false;
  this.beginLimitDate = new Date();
  this.calBeginDate = new Date();
  this.popBeginDate = new Date();

  if (beginDate && beginDate.length == 8) {
    var myYear = beginDate.substring(0,4);
    var myMonth = (1*beginDate.substring(4,6))-1;
    var myDay = beginDate.substring(6,8);
    this.calBeginDate = new Date(myYear,myMonth,myDay);
    this.popBeginDate = new Date(myYear,myMonth,myDay);
  }
  if (endDate && endDate.length == 8) {
    var myYear = endDate.substring(0,4);
    var myMonth = (1*endDate.substring(4,6))-1;
    var myDay = endDate.substring(6,8);
  }
  if (window.monthNameAbbreviations) this._monthString = window.monthNameAbbreviations;
  if (onColor) this._onColor = "#9BBDDE";
  if (offColor) this._offColor = "#CDDEEE";
}

/*------------------------------------------------------------------------------
  CalendarPopup open calendar method
------------------------------------------------------------------------------*/
CalendarPopup.prototype.open = function(beginDate, endDate) {
  var myE1=null,myE2=this._formField;
  var myClass = this;
  var startX = 0;
  var startY = 0;

  if (beginDate && beginDate.length == 8) {
    var myYear = beginDate.substring(0,4);
    var myMonth = (1*beginDate.substring(4,6))-1;
    var myDay = beginDate.substring(6,8);
    this.calBeginDate = new Date(myYear,myMonth,myDay);
    this.popBeginDate = new Date(myYear,myMonth,myDay);
  }
  if (endDate && endDate.length == 8) {
    var myYear = endDate.substring(0,4);
    var myMonth = (1*endDate.substring(4,6))-1;
    var myDay = endDate.substring(6,8);
  }

  this.build();


  if ((myE1 = document.getElementById("gcal_pop")) == null) return;
//  if ((myE2 = document.getElementById("gcal_crange2")) == null) return;

  for(var p = myE2; p && p.tagName!='BODY'; p = p.offsetParent) {
    startX += p.offsetLeft;
    startY += p.offsetTop;
  }
  if (myE2) startY += myE2.offsetHeight;

  myE1.style.position = "absolute";
  myE1.style.left = (startX)+"px";
  myE1.style.top = (startY)+"px";
  myE1.style.display = "block";
}

/*------------------------------------------------------------------------------
  CalendarPopup build method - actually build the calendar
------------------------------------------------------------------------------*/
CalendarPopup.prototype.build = function() {
  var myE=null;
  var id = "";
  var popDate=null;
  var startDate=null;
  var isIE5 = (navigator.appVersion.indexOf("MSIE 5") != -1) ? true : false;

  popDate = this.popBeginDate;
  startDate = this.calBeginDate;
  id    = "pb";

  var pYM = popDate.getYearMonth();
  var sYM = startDate.getYearMonth();
  var elYM = this.endLimitDate.getYearMonth();
  var blYM = this.beginLimitDate.getYearMonth();
  var pYMD = popDate.getYearMonthDay();
  var sYMD = startDate.getYearMonthDay();
  var elYMD = this.endLimitDate.getYearMonthDay();
  var blYMD = this.beginLimitDate.getYearMonthDay();

  /*----------------------------------------------------------------------------
    CalendarPopup build method
  ----------------------------------------------------------------------------*/
  if ((myE = document.getElementById("gcal_pop"))   != null)
    myE.style.borderColor = this._offColor;
  if ((myE = document.getElementById("gcalpb_yr"))  != null)
    myE.style.backgroundColor = this._onColor;
  if ((myE = document.getElementById("gcalpb_dow")) != null)
    myE.style.backgroundColor = this._offColor;
  if ((myE = document.getElementById("gcalpe_yr"))  != null)
    myE.style.backgroundColor = this._onColor;
  if ((myE = document.getElementById("gcalpe_dow")) != null)
    myE.style.backgroundColor = this._offColor;
  if ((myE = document.getElementById("gcal_np"))    != null)
    myE.style.backgroundColor = this._offColor;
  if ((myE = document.getElementById("gcal_np2"))   != null)
    myE.style.backgroundColor = this._offColor;

  /*----------------------------------------------------------------------------
    Set the year month
  ----------------------------------------------------------------------------*/
  if ((myE = document.getElementById("gcal"+id+"_yearmonth")) == null) return;
  myE.innerHTML = this._monthString[popDate.getMonth()]+" "
    +popDate.getFullYear();

  if (this.hasEndLimit && pYM >= elYM) {
    if ((myE=document.getElementById("gcal"+id+"_rarrow")) != null)
      myE.src = "right_grey_arrow.gif";
    if (!isIE5) myE.style.cursor = "auto";
  } else {
    if ((myE=document.getElementById("gcal"+id+"_rarrow")) != null)
      myE.src = "right_arrow.gif";
    if (!isIE5) myE.style.cursor = "pointer";
  }
  if (this.hasBeginLimit && pYM <= blYM) {
    if ((myE=document.getElementById("gcal"+id+"_larrow")) != null)
      myE.src = "left_grey_arrow.gif";
    if (!isIE5) myE.style.cursor = "auto";
    } else {
    if ((myE=document.getElementById("gcal"+id+"_larrow")) != null) {
      myE.src = "left_arrow.gif";
      if (!isIE5) myE.style.cursor = "pointer";
    }
  }

  /*----------------------------------------------------------------------------
    Set the Day
  ----------------------------------------------------------------------------*/
  var myDate = new Date(popDate.getFullYear(),popDate.getMonth(),1);
  var ef1=0;
  var dow = myDate.getDay();
  while (dow > 0) {
    myDate.setDate(myDate.getDate()-1);
    dow--;
  }

  for (var ii=1;ii<=42;ii++) {
    if ((myE=document.getElementById("gcal"+id+"_day_"+ii)) == null) continue;
    if (myDate.getMonth() != popDate.getMonth()) myE.innerHTML = "";
    else myE.innerHTML = myDate.getDate();

    var myYMD = myDate.getYearMonthDay();

    if (myYMD == sYMD && myDate.getMonth() == popDate.getMonth()) {
      myE.style.backgroundColor = this._onColor;
      myE.style.color          = "";
      myE.style.textDecoration = "";
      if (!isIE5) myE.style.cursor = "pointer";
    } else if ((this.hasEndLimit && myYMD > elYMD) ||
               (this.hasBeginLimit && myYMD < blYMD)) {
      myE.style.backgroundColor = "";
      myE.style.color          = "#999999";
      myE.style.textDecoration = "line-through";
      if (!isIE5) myE.style.cursor = "auto";
    } else {
      myE.style.backgroundColor = "";
      myE.style.color          = "";
      myE.style.textDecoration = "";
      if (!isIE5) {
        if (myDate.getMonth() != popDate.getMonth()) myE.style.cursor = "auto";
          else myE.style.cursor = "pointer";
      }
    }

    myDate.setDate(myDate.getDate()+1);
    if (myDate.getMonth() > popDate.getMonth()
      && (popDate.getFullYear() == myDate.getFullYear())) ef1=1;
    if (popDate.getFullYear() < myDate.getFullYear()) ef1=1;
    if (ef1 && myDate.getDay() == 0) break;
  }

  for (var yy=1;yy<=6;yy++) {
    if ((myE=document.getElementById("gcal"+id+"_week_"+yy)) != null)
    if (yy < ii/6)  myE.style.display = "";
    else myE.style.display = "none";
  }
}

/*------------------------------------------------------------------------------
  CalendarPopup toggle methods - toggle the year month
------------------------------------------------------------------------------*/
CalendarPopup.prototype.toggleYearMonth = function(cmd) {

  var myDate;
  myDate = this.popBeginDate;

  var elYM = this.endLimitDate.getYearMonth();
  var blYM = this.beginLimitDate.getYearMonth();
  var sYM = myDate.getYearMonth();
  var myMonth = myDate.getMonth();
  if (cmd == 1) {
    if (this.hasEndLimit && sYM >= elYM) return;
    myMonth++;
    if (myMonth > 11) {
      myDate.setYear(myDate.getFullYear()+1);
      myDate.setMonth(0);
    } else {
      myDate.setMonth(myMonth);
    }
  } else if (cmd == -1) {
    if (this.hasBeginLimit && sYM <= blYM) return;
    myMonth--;
    if (myMonth < 0) {
      myDate.setYear(myDate.getFullYear()-1);
      myDate.setMonth(11);
    } else {
      myDate.setMonth(myMonth);
    }
  }
  this.build();
}

/*------------------------------------------------------------------------------
  CalendarPopup toggle methods - toggle the day, check the other calendar
------------------------------------------------------------------------------*/
CalendarPopup.prototype.toggleDay = function(day) {
  var startDate=null;
  var popDate=null;
  var myE=null;
  var id="";

  id = "pb";
  startDate = this.calBeginDate;
  popDate = this.popBeginDate;

  if ((myE=document.getElementById("gcal"+id+"_day_"+day)) == null) return;
  var cday = 1*gcalStripTag(myE.innerHTML);
  var myYMD = (100*popDate.getYearMonth())+cday;
  var elYMD = this.endLimitDate.getYearMonthDay();
  var blYMD = this.beginLimitDate.getYearMonthDay();
  if ((this.hasEndLimit && myYMD > elYMD) ||
      (this.hasBeginLimit && myYMD < blYMD)) return;

  startDate.setYear(popDate.getFullYear());
  startDate.setMonth(popDate.getMonth());
  startDate.setDate(cday);

  var mbYMD = this.calBeginDate.getYearMonthDay();
  var pbYMD = this.popBeginDate.getYearMonthDay();

  this.build();
  this.applyDate();
}

/*------------------------------------------------------------------------------
  CalendarPopup Apply Date - This should be re-referenced by the user
------------------------------------------------------------------------------*/
CalendarPopup.prototype.applyDate = function() {
  CalendarPopup.close();
}

/*------------------------------------------------------------------------------
  CalendarPopup static close method (there is only one gcal_pop div on a page)
------------------------------------------------------------------------------*/
CalendarPopup.close = function() {
  if ((myE = document.getElementById("gcal_pop")) != null) {
    myE.style.display = "none";
  }
}
/*------------------------------------------------------------------------------
  CalendarPopup static initializer
------------------------------------------------------------------------------*/
CalendarPopup.register = function(field) {
  field.cal = new CalendarPopup(field);
  field.onclick = function(event){curCal=this.cal;curCal.open();stopBubble(event);}
  field.onfocus = function(){curCal=this.cal;curCal.open();this.select();}
  curCal = field.cal;
  // This is the default applyDate functionality, but can be overriden -zen
  field.cal.applyDate = function() { field.value=field.cal.calBeginDate.getMDYFormatted();CalendarPopup.close(); };
}
/*------------------------------------------------------------------------------
  function to strip out html tags
------------------------------------------------------------------------------*/
function gcalStripTag(html) {
  var idx1=0,idx2=0;
  var myHTML=html;
  if (!myHTML) return "";

  if ((idx1=myHTML.indexOf(">")) == -1) return myHTML;
  if ((idx2=myHTML.indexOf("<",idx1+1)) == -1) return myHTML;
  myHTML = myHTML.substring(idx1+1,idx2);

  return myHTML;
}

/*------------------------------------------------------------------------------
  Extend the date object to return the YYYYMMDD
------------------------------------------------------------------------------*/
Date.prototype.getYearMonthDay = function() {
  return 100*((100*this.getFullYear())+(this.getMonth()+1))+this.getDate();
}
Date.prototype.getYearMonth = function() {
  return (100*this.getFullYear())+(this.getMonth()+1);
}
Date.prototype.getMDYFormatted = function() {
  twoDigit = function(num) { return num<10 ? "0"+num : num; };
  return twoDigit(this.getMonth()+1)+"/"+twoDigit(this.getDate())+"/"+this.getFullYear();
}
Date.prototype.getDMYFormatted = function() {
  twoDigit = function(num) { return num<10 ? "0"+num : num; };
  return twoDigit(this.getDate())+"/"+twoDigit(this.getMonth()+1)+"/"+this.getFullYear();
}

function getEventObj(e){if(!e)e=window.event;return e;}
function stopBubble(e){ e=getEventObj(e);e.cancelBubble=true;if(e.stopPropagation)e.stopPropagation(); }

