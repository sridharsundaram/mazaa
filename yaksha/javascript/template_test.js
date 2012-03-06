// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview UnitTests for template.js
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

var originalHtml;
var templateOps = {};
var templateManager;

// TODO(ssundaram): Write better tests for template reinstantiate,
//                     instantiate to cover branch conditions

function setUp() {
  originalHtml = document.body.innerHTML;
  ShadowTemplates = null;
  // Mock out generateNewId for testing
  Template.prototype.idCount = 1;
  templateManager = new TemplateManager({});
  function chooseColor(label) {
    if (label == undefined) return 'undefined-color';
    if (label == 'warning') return 'orange';
    if (label == 'error') return 'red';
    return 'green';
  }
  getBlinkFormatters().register('chooseColor', chooseColor);
}

function tearDown() {
  document.body.innerHTML = originalHtml;
}

function isVisible(element) {
  return element && element.style.display == '';
}

function isHidden(element) {
  return element && element.style.display == 'none';
}

function compressWhiteSpace(text) {
  return text.replace(/\s+/g,' ');
}

// DataBinding is a dictionary with namevalues only - should set name values
function testInstantiateTemplate_nameValues() {
  var template = ShadowTemplates["MainT"];
  var dictionaryContext =
    [{"Main": {"id":"1234",
                "caption":"<b>Caption</b>",
                "src":"http://images/simple.jpg"}
              }];
  var instance = template.instantiateDom(dictionaryContext, '');
  document.body.insertBefore(instance, document.body.childNodes[0]);
  var anchorElement = document.getElementById("anchor");
  assertEquals("http://servlet/#id=1234", anchorElement.href);
  assertEquals("this is the <b>Caption</b>", anchorElement.innerHTML);
}

// DataBinding is a dictionary with nested namevalues -
// should set value with closest enclosing scope
function testInstantiateTemplate_nameValueScope() {
  var template = ShadowTemplates["MainT"];
  var dictionaryContext =
    [{"Main": {"maindiv":[{"text": "Correct"}],
                "text":"Wrong"}
              }];
  var instance = template.instantiateDom(dictionaryContext, '');
  document.body.insertBefore(instance, document.body.childNodes[0]);
  var maindivElement = document.getElementById("maindiv.0");
  assertEquals("<b>example</b><XBL2:SPAN id=\"$id_1.0\">Correct</XBL2:SPAN>",
               maindivElement.innerHTML);
}

// DataBinding is a dictionary with child - should apply to child
function testInstantiateTemplate_children() {
  var template = ShadowTemplates["imageT"];
  var dictionaryContext =
      [{"image": [{"src":"http://images/complex.jpg", "alt":"ALT0"},
                  {"src":"http://images/simple.jpg", "alt":"ALT1"}]}];
  var instance = template.instantiateDom(dictionaryContext, '');
  document.body.insertBefore(instance, document.body.childNodes[0]);
  var imageElement0 = document.getElementById("image.0");
  assertEquals("http://images/complex.jpg",
               imageElement0.getAttribute('xbl2:src'));
  assertEquals("ALT0", imageElement0.alt);
  var imageElement1 = document.getElementById("image.1");
  assertEquals("http://images/simple.jpg",
               imageElement1.getAttribute('xbl2:src'));
  assertEquals("ALT1", imageElement1.alt);
}

// DataBinding is a dictionary with array for element - should apply each once
function testInstantiateTemplate_repeated() {
  var template = ShadowTemplates["MainT"];
  var dictionaryContext =
    [{"Main": {
      "image": [{"src":"http://images/complex.jpg", "alt":"ALT0"},
                {"src":"http://images/simple.jpg", "alt":"ALT1"}],
      "maindiv":[{"text":"This is the first one"},
                 {}]
      }
    }];
  var instance = template.instantiateDom(dictionaryContext, '');
  document.body.insertBefore(instance, document.body.childNodes[0]);
  var maindivElement0 = document.getElementById("maindiv.0");
  assertEquals("<b>example</b><XBL2:SPAN id=\"$id_1.0\">This is the first one" +
               "</XBL2:SPAN>",
               maindivElement0.innerHTML);
  var maindivElement1 = document.getElementById("maindiv.1");
  assertEquals("<b>example</b><XBL2:SPAN id=\"$id_1.1\"></XBL2:SPAN>",
          maindivElement1.innerHTML);

  var imageElement0 = document.getElementById("image.0");
  assertEquals("http://images/complex.jpg",
               imageElement0.getAttribute('xbl2:src'));
  assertEquals("ALT0", imageElement0.alt);
  var imageElement1 = document.getElementById("image.1");
  assertEquals("http://images/simple.jpg",
               imageElement1.getAttribute('xbl2:src'));
  assertEquals("ALT1", imageElement1.alt);

  var image0 = document.getElementById('imageT.0');
  var image1 = document.getElementById('imageT.1');
  assertEquals(image1, image0.nextSibling);
}

// Basic variable replacement occurs correctly.
// xbl2:
function testInstantiateTemplate_variable() {
  var dictionaryContext =
    [{"image": [{"src":"http://images/complex.jpg", "alt":"ALT0", "width": 20}]
    }];

  var element = document.createElement('div');
  element.appendChild(ShadowTemplates['imageT'].
                          instantiateDom(dictionaryContext, ''));
  assertEquals(
      '<XBL2:TEMPLATE id="imageT.0" style="" template-id="imageT"> ' +  // NOLINT
      '<img id="image.0" alt="ALT0" xbl2:src="http://images/complex.jpg" width="20">' +      // NOLINT
      ' </XBL2:TEMPLATE>',
      compressWhiteSpace(element.innerHTML));
  var imgElement = element.getElementsByTagName('img')[0];
  assertEquals("http://images/complex.jpg", imgElement.getAttribute('xbl2:src'));
  assertNull(imgElement.getAttribute('src'));
  assertEquals("20", imgElement.getAttribute('width'));
  assertNull(imgElement.getAttribute('xbl2:width'));
}

function testInstantiateTemplate_criticalImages() {
  var dictionaryContext =
    [{"image": [{"src":"http://images/complex.jpg", "alt":"ALT0", "width": 20}]
    }];

  ShadowTemplates.criticalImageIds = [];
  var element = ShadowTemplates['imageT'].instantiateDom(dictionaryContext, '');
  assertEquals(1, ShadowTemplates.criticalImageIds.length);
  assertEquals('image.0', ShadowTemplates.criticalImageIds[0]);
}

// xbl2:attribute will get removed if attribute value is undefined,
//   for non-src attribute, xbl2: will get removed if attribute value is defined
function testInstantiateTemplate_xbl2AttributeUndefined() {
  var dictionaryContext = [{"image":[{}]}];
  var imageT = document.createElement('div');
  imageT.appendChild(ShadowTemplates['imageT'].
                         instantiateDom(dictionaryContext, ''));
  var element = imageT.getElementsByTagName('img')[0];
  assertNull('no xbl2:src attribute', element.getAttribute('xbl2:src'));
  assertNull('no src attribute', element.getAttribute('src'));
  assertNull('no width attribute', element.getAttribute('width'));
  assertNull('no xbl2:width attribute', element.getAttribute('xbl2:width'));
}

// Template element id's should be removed from the DOM of the document
// after compilation
function testCompileTemplates() {
  compileTemplates();
  assertNotNull(ShadowTemplates['MainT']);
  assertNotNull(ShadowTemplates['imageT']);
  assertNotNull(ShadowTemplates['logT']);
  assertEquals('MainT in DOM is of instance',
      document.getElementById('MainT'),
      document.getElementById(END_INSTANCES_MARKER + 'MainT').previousSibling);
  assertEquals("Main in DOM is of instance",
      document.getElementById('MainT'),
      document.getElementById('Main').parentNode);
  assertEquals(0, ShadowTemplates['MainT'].domElement.childNodes.length);
  assertEquals(0, ShadowTemplates['imageT'].domElement.childNodes.length);
  assertEquals(0, ShadowTemplates['logT'].domElement.childNodes.length);
}

// should remove/hide pre-existing template instances which are not bound
//   when we do a non-incremental binding.
function testApplyTemplate_removeOrHideTemplateInstances() {
  var jsonData =
    {"Main": {
      "image": [{}]
      }
    };

  ShadowTemplates.jsonData = {'Main' : { 'image': [{}]} };
  templateManager.applyTemplate(jsonData, true, templateOps);

  // Should have second image element since we are rebinding now in incremental
  // mode
  var imageT0 = document.getElementById("imageT.0");
  assertTrue('imageT.0 visible', isVisible(imageT0));
  var imageT1 = document.getElementById("imageT.1");
  assertTrue('imageT.1 hidden', isHidden(imageT1));
  // Should not have affected the logT instance
  var logT0 = document.getElementById("logT.0");
  assertTrue('logT0 remains hidden', isHidden(logT0));

  templateManager.applyTemplate(jsonData, false, templateOps);

  var imageT0 = document.getElementById("imageT.0");
  assertTrue('imageT.0 visible', isVisible(imageT0));
  // Should have hidden second image elements
  var imageT1 = document.getElementById("imageT.1");
  assertTrue('imageT.1 hidden', isHidden(imageT1));
  // Should have hidden the logT instance
  var logT0 = document.getElementById("logT.0");
  assertTrue('logT0 hidden', isHidden(logT0));
}

function testMergeJsonData() {
  var jsonData1 = [1];
  var jsonData2 = [2];
  mergeJsonData(jsonData1, jsonData2);
  assertEquals(2, jsonData1[0]);

  jsonData1 = [1];
  jsonData2 = [null, 2];
  mergeJsonData(jsonData1, jsonData2);
  assertEquals('1,2', jsonData1 + '');

  jsonData1 = {'b':[1,2]};
  jsonData2 = {'b':[1,null,3,4,null]};
  mergeJsonData(jsonData1, jsonData2);
  assertEquals('1,2,3,4,', '' + jsonData1['b']); // array comparison

  jsonData1 = { 'a': 1, 'b': [1,2], 'c': { 'x': 'test1' } };
  jsonData2 = { 'd': 2, 'b': [1,null,3,4,null], 'c': { 'x': 'test2' } };
  var expected = { 'a': 1, 'd': 2, 'b': [1,2,3,4], 'c': { 'x': 'test2' } };
  mergeJsonData(jsonData1, jsonData2);
  assertEquals(1, jsonData1['a']);
  assertEquals(2, jsonData1['d']);
  assertEquals('1,2,3,4,', '' + jsonData1['b']); // array comparison
  assertEquals('test2', jsonData1['c']['x']);

  jsonData1 = { 'first': [ {'a': 1} ] };
  jsonData2 = { 'first': [ {'b':2}, {'c':3} ] };
  mergeJsonData(jsonData1, jsonData2);
  assertEquals(2, jsonData1['first'].length);
  assertEquals(1, jsonData1['first'][0]['a']);
  assertEquals(2, jsonData1['first'][0]['b']);
  assertEquals(3, jsonData1['first'][1]['c']);
}

//No DataBinding defined - should just copy and create empty instances
function testApplyTemplate_nop() {
  var dictionaryContext = [{}];
  var expectedHtml = document.body.innerHTML;
  document.body.innerHTML = originalHtml;
  ShadowTemplates = null;
  compileTemplates();
  templateManager.applyTemplate(dictionaryContext, false, templateOps);

  var bodyElementAfterHtml = document.body.innerHTML;
  assertEquals(expectedHtml, bodyElementAfterHtml);
}

// DataBinding is a jsondata dictionary as sent by server
function testApplyTemplate_basic() {
  var jsonData =
    {"Main": {
      "image": [{"src":"http://images/complex.jpg", "alt":"ALT0"},
                {"src":"http://images/simple.jpg", "alt":"ALT1"}],
      "maindiv":[{"text":"This is the first one"},
                 {}]
      }
    };

  var mainEndInstancesMarker =
      document.getElementById(END_INSTANCES_MARKER + 'MainT');
  assertNotNull('Main template instance should exist', mainEndInstancesMarker);

  // Apply the template
  templateManager.applyTemplate(jsonData, false, templateOps);

  mainEndInstancesMarker =
      document.getElementById(END_INSTANCES_MARKER + 'MainT');
  assertNotNull('Main template Instance again be present',
      mainEndInstancesMarker);

  var mainElement0 = document.getElementById("MainT");
  assertNotNull('Main instance should be present', mainElement0);

  // Should have passed through Header and instantiated maindiv twice
  var maindivElement0 = document.getElementById("maindiv.0");
  assertEquals('<b>example</b><xbl2:span id="$id_1.0">This is the first one</xbl2:span>',
               maindivElement0.innerHTML);
  var maindivElement1 = document.getElementById("maindiv.1");
  assertEquals('<b>example</b><XBL2:SPAN id="$id_1.1"></XBL2:SPAN>',
               maindivElement1.innerHTML);
  // Should have instantiated image twice
  var imageElement0 = document.getElementById("image.0");
  assertEquals("ALT0", imageElement0.getAttribute("alt"));
  assertEquals("http://images/complex.jpg",
               imageElement0.getAttribute('xbl2:src'));
  var imageElement1 = document.getElementById("image.1");
  assertEquals("ALT1", imageElement1.getAttribute("alt"));
  assertEquals("http://images/simple.jpg",
               imageElement1.getAttribute('xbl2:src'));
  assertNotNull('Should not have disturbed span',
                document.getElementById("span"));
}

// Unbound template instances are deleted/hidden
function testApplyTemplate_unboundNotVisible() {
  var jsonData = {'Main': {}};
  // Apply the template
  templateManager.applyTemplate(jsonData, false, templateOps);

  // Instance MainT should not have been hidden
  assertTrue("MainT not hidden", isVisible(document.getElementById('MainT')));

  // Instance log0 should be hidden
  assertTrue("logT0 hidden", isHidden(document.getElementById('logT.0')));
}

function testApplyTemplate_instancesInOrder() {
  // Apply the template again with a different jsonData
  var jsonData =
  {'Main': {
    'list': { 'log':[{'text':'This is the first one'},
                     {'text':'This is the second one'}]
      }
    }
  };

  templateManager.applyTemplate(jsonData, false, templateOps);

  // Instances logT.0 and logT.1 should have been created as siblings
  var log0 = document.getElementById("logT.0");
  assertNotNull("log0 created", log0);
  assertEquals(' <li id="log.0"> <a href="#" id="$id_3.0">This is the first one</a> </li>',  // NOLINT
               compressWhiteSpace(log0.innerHTML));
  var log1 = document.getElementById("logT.1");
  assertNotNull("log1 created", log1);
  assertEquals(' <li id="log.1"> <a href="#" id="$id_3.1">This is the second one</a> </li>',  // NOLINT
               compressWhiteSpace(log1.innerHTML));
  assertEquals("Instances in Order", log1, log0.nextSibling);
}

function testApplyTemplate_notFirst() {
  var jsonData =
  {'Main': {
    'list': {'breadcrumbs':[{'crumb':'FirstCrumb'},
                            {'crumb':'SecondCrumb'}]
      }
    }
  };

  templateManager.applyTemplate(jsonData, false, templateOps);

  // 1 Instance of notfirst should have been created and be visible
  var breadcrumbs1 = document.getElementById('breadcrumbs.1');
  assertEquals('&gt;&gt;', breadcrumbs1.innerHTML);
  assertTrue('breadcrumbs 1 visible',
      isVisible(document.getElementById('breadcrumbs.1')));
  assertNull(document.getElementById('breadcrumbs.0'));
  jsonData =
  {'Main': {
    'list': { 'breadcrumbs':[{'crumb':'FirstCrumb'},
                             {'crumb':'SecondCrumb'},
                             {'crumb':'ThirdCrumb'}]
      }
    }
  };

  templateManager.applyTemplate(jsonData, false, templateOps);

  // Two Instances of notfirst should have been created
  assertTrue('breadcrumbs.1 visible',
      isVisible(document.getElementById('breadcrumbs.1')));
  assertTrue('breadcrumbs.2 visible',
      isVisible(document.getElementById('breadcrumbs.2')));

  jsonData =
  {'Main': {
    'list': {'breadcrumbs':[{'crumb':'crumb'}]
      }
    }
  };

  templateManager.applyTemplate(jsonData, false, templateOps);

  // No Instance of notfirst should be visible
  assertNull('breadcrumbs.0 not present',
      document.getElementById('breadcrumbs.0'));
  assertTrue('breadcrumbsT.1 not visible',
      isHidden(document.getElementById('breadcrumbsT.1')));

  templateManager.applyTemplate(jsonData, true, templateOps);
  // One Instance of notfirst should be visible
  assertTrue('breadcrumbs.1 visible',
      isVisible(document.getElementById('breadcrumbs.1')));
}


function testApplyTemplate_random() {
  jsonData =
  { 'rand_template': [
    {'value': 'Crumb'}, {'value': 'Crumb'}, {'value': 'Crumb'},
    {'value': 'Crumb'}, {'value': 'Crumb'}, {'value': 'Crumb'},
    {'value': 'Crumb'}, {'value': 'Crumb'}
    ]
  };

  templateManager.applyTemplate(jsonData, false, templateOps);
  var rval = -1;
  for (i = 0; i < 8; i++) {
    var tempNode = document.getElementById('rand_template.' + i);
    if (tempNode == null) {
      if (rval == -1) rval = i;
      else assertTrue('instance:' + i + ' is also null', false);
    }
  }
  assertTrue(rval != -1);
}

// DataBinding is a jsondata dictionary as sent by server
//    display: none should be removed
function testApplyTemplate_display() {
  var jsonData =
    {"Main": {
      "image": [{"src":"http://images/complex.jpg", "alt":"ALT1"},
                {"src":"http://images/simple.jpg", "alt":"ALT2"}],
      "maindiv":[{"text":"This is the first one"},
                 {}]
      }
    };

  templateManager.applyTemplate(jsonData, false, templateOps);

  var mainElement = document.getElementById("MainT");
  assertTrue(isVisible(mainElement));
}

// DataBinding is a jsondata dictionary as sent by server.
// It is sent in two chunks which need to be applied incrementally.
function testApplyTemplate_incremental() {
  var jsonData1 =
    {"Main": {
      "id": "initialid",
      "caption": "critical load",
      "image": [{"src":"http://images/image0.jpg", "alt":"ALT0"},
                {"src":"http://images/image1.jpg", "alt":"ALT1"}]
      }    };
  var jsonData2 =
    {"Main": {
      "caption": "incremental load",
      "maindiv":[{"text":"This is the first one"},
                 {}],
      "image": [{"width":"100"}, {},
                {"src":"http://images/image2.jpg", "alt":"ALT2"}]
      }
    };
  templateManager.applyTemplate(jsonData1, false, templateOps);
  var main = document.getElementById("Main");
  assertNotNull("Main first apply", main);
  var anchor = document.getElementById('anchor');
  assertEquals('this is the critical load', anchor.textContent);
  assertEquals('http://servlet/#id=initialid', anchor.href);
  var imageElement0 = document.getElementById("image.0");
  assertNotNull("ImageElement0 first apply", imageElement0);
  assertNull(imageElement0.getAttribute('width'));
  var imageElement1 = document.getElementById("image.1");
  assertNotNull("ImageElement1 first apply", imageElement1);
  assertEquals("http://images/image1.jpg",
               imageElement1.getAttribute('xbl2:src'));
  var endInstancesMainDiv =
      document.getElementById(END_INSTANCES_MARKER + 'template-id_3');
  var mainDivT0 = endInstancesMainDiv.previousSibling;
  assertTrue("mainDivT0 first apply", isHidden(mainDivT0));

  // Text element correctly instantiated
  var span = document.getElementById('span');
  assertEquals('Non-incremental apply works', 'text', span.innerHTML);

  // Table element correctly instantiated
  var tables = main.getElementsByTagName('table');
  assertEquals('Non-incremental apply copies table', 1, tables.length);

  templateManager.applyTemplate(jsonData2, true, templateOps);
  assertEquals("100",
               imageElement0.getAttribute('width'));

  assertEquals('this is the incremental load', anchor.textContent);
  assertEquals('previous instantiation preserved',
               'http://servlet/#id=initialid', anchor.href);
  mainDivT0 = endInstancesMainDiv.previousSibling.previousSibling;
  assertTrue("maindivT0 second apply", isVisible(mainDivT0));
  assertTrue("maindivT0 second apply",
             isVisible(endInstancesMainDiv.previousSibling));
  imageElement1 = document.getElementById("image.1");
  assertNotNull("imageElement1 second apply", imageElement1);
  var imageElement2 = document.getElementById("image.2");
  assertNotNull("imageElement2 second apply", imageElement2);
  // Text elements are not duplicated in incremental mode.
  span = document.getElementById('span');
  assertEquals('Incremental apply does not copy span', 'text', span.innerHTML);
  
  // Table element not duplicated in incremental mode
  main0 = document.getElementById("Main");
  tables = main0.getElementsByTagName('table');
  // The table count should be 1 - only one copy
  assertEquals('Incremental apply does not copy table', 1, tables.length);
}

// DataBinding is a jsondata dictionary as sent by server.
// It is sent in three chunks which need to be applied incrementally.
function testApplyTemplate_multiIncremental() {
  var jsonData1 =
    {"Main": {
      "id": "initialid",
      "caption": "critical load",
      "image": [{"src":"http://images/image0.jpg", "alt":"ALT0"},
                {"src":"http://images/image1.jpg", "alt":"ALT1"}]
      }    };

  var jsonData2 =
    {"Main": {
      "caption": "incremental load",
      "image": [{}, {}, {"src":"http://images/image2.jpg", "alt":"ALT2"}]
      }
    };

  var jsonData3 =
  {"Main": {
    "caption": "second incremental load",
    "image": [{}, {}, {}, {"src":"http://images/image3.jpg", "alt":"ALT0"}]
    }    };

  // First apply.
  templateManager.applyTemplate(jsonData1, false, templateOps);
  var anchor = document.getElementById('anchor');
  assertEquals('this is the critical load', anchor.textContent);
  assertEquals('http://servlet/#id=initialid', anchor.href);

  // First incremental.
  templateManager.applyTemplate(jsonData2, true, templateOps);
  assertEquals('this is the incremental load', anchor.textContent);

  // Second incremental.
  templateManager.applyTemplate(jsonData3, true, templateOps);
  assertEquals('this is the second incremental load', anchor.textContent);
  assertEquals('previous instantiation preserved',
               'http://servlet/#id=initialid', anchor.href);
  imageElement1 = document.getElementById("image.1");
  assertNotNull("imageElement1 preserved", imageElement1);
  var imageElement2 = document.getElementById("image.2");
  assertNotNull("imageElement2 preservedy", imageElement2);
  var imageElement3 = document.getElementById("image.3");
  assertNotNull("imageElement3 second apply", imageElement3);
}

function testCollectCriticalImages() {
  var div = document.getElementById('collect');
  var criticalImageIds = ['collectImage2', 'collectImage3', 'collectImage4'];
  var criticalImagesByUrl = collectCriticalImages(criticalImageIds);
  var expectedImages =
      {'http://images/url2.jpg': [document.getElementById('collectImage2'),
                                  document.getElementById('collectImage4')],
       'http://images/url3.jpg': [document.getElementById('collectImage3')]
      };
  var imageCount = 0;
  for (var url in criticalImagesByUrl) {
    if (criticalImagesByUrl.hasOwnProperty(url)) {
      assertEquals(expectedImages[url].length, criticalImagesByUrl[url].length);
      for (var i = 0; i < expectedImages[url].length; i++) {
        assertEquals(expectedImages[url][i], criticalImagesByUrl[url][i]);
        imageCount++;
      }
    }
  }
  assertEquals(3, imageCount);
}

function testParseTemplateNested() {
  var breadcrumbTParts = [
      '<XBL2:TEMPLATE ',
      new IdAttributeOp('breadcrumbsT'),
      'style="" template-id="breadcrumbsT" >\n      ',  // NOLINT
      ShadowTemplates['breadcrumbs'],
      '<XBL2:SPAN ',
      new IdAttributeOp('$id_2'),
      '>',
      new ValueOp('\n      {{value}}\n    '),
      '</XBL2:SPAN></XBL2:TEMPLATE>'
  ];

  var breadcrumbParts = [
      '<XBL2:TEMPLATE ',
      new IdAttributeOp('breadcrumbs'),
      'template-id="breadcrumbs" >&gt;&gt;</XBL2:TEMPLATE>'  // NOLINT
      ];

  compareTemplateOps('breadcrumbT', breadcrumbTParts,
                       ShadowTemplates['breadcrumbsT'].parts);
  compareTemplateOps('breadcrumbs', breadcrumbParts,
                       ShadowTemplates['breadcrumbs'].parts);
}


function testInstantiateTemplate() {
  var template = ShadowTemplates['MainT'];
  // Force the template parts to be different for testing.
  template.parts = [
      '<XBL2:TEMPLATE',
      new IdAttributeOp('MainT'),
      '><xbl2:span',
      new IdAttributeOp('maindiv'),
      new AttributeOp('xbl2:style', '{{text}}'),
      '><b>example</b> main:',
      new VariableOp('main', undefined),
      '</xbl2:span>',
      ShadowTemplates['imageT'],
      '<img',
      new IdAttributeOp('img'),
      new ImageOp('{{url}}', new IdAttributeOp('img')),
      '></XBL2:TEMPLATE>'

  ];
  dictionaryContext =
      [{ 'Main': {'text': 'css',
                  'main': 'Important',
                  'url': 'http://images/test.jpg',
                  'image': [
                             {'alt': 'First', 'width': '22',
                              'src': 'http://images/simple.jpg'
                             },
                             {'alt': 'Second', 'width': '44',
                              'src': 'http://images/complex.jpg'
                   }]
       }}];
  var parts = [];
  template.instantiate(dictionaryContext, '.1', parts, 0, 0);
  var expected = [
      '<XBL2:TEMPLATE',
      ' id="MainT.1" ',
      '><xbl2:span',
      ' id="maindiv.1" ',
      ' style="css"',
      '><b>example</b> main:',
      'Important',
      '</xbl2:span>',
      '<XBL2:TEMPLATE ',
      ' id="imageT.1.0" ',
      'style="" template-id="imageT" >\n          <IMG ',
      ' id="image.1.0" ',
      ' width="22"',
      ' alt="First"',
      ' xbl2:src="http://images/simple.jpg"',
      '>\n        </XBL2:TEMPLATE>',
      '<XBL2:TEMPLATE ',
      ' id="imageT.1.1" ',
      'style="" template-id="imageT" >\n          <IMG ',
      ' id="image.1.1" ',
      ' width="44"',
      ' alt="Second"',
      ' xbl2:src="http://images/complex.jpg"',
      '>\n        </XBL2:TEMPLATE>',
      '<XBL2:TEMPLATE style="display: none;" id=' + END_INSTANCES_MARKER + 'imageT.1' +
          ' num_used_instances=2 num_instances=2>',
      '</XBL2:TEMPLATE>',
      '<img',
      ' id="img.1" ',
      ' xbl2:src="http://images/test.jpg"',
      '></XBL2:TEMPLATE>',
      '<XBL2:TEMPLATE style="display: none;" id=' + END_INSTANCES_MARKER + 'MainT.1' +
          ' num_used_instances=1 num_instances=1>',
      '</XBL2:TEMPLATE>'];
  compareTemplateOps('', expected, parts);
}

function testInstantiateAndBindData_object() {
  var template = ShadowTemplates['breadcrumbsT'];

  dictionaryContext =
      [{'Main': { 'list': {'breadcrumbs': { 'value': 'test'}}}}];
  template.instantiateAndBindData(dictionaryContext, '', false);
  assertEquals(' >> test ',
      compressWhiteSpace(document.getElementById('breadcrumbsT').textContent));
}

function testParseElement_basic() {
  var parts = [];
  var expectedParts = [
    '<XBL2:TEMPLATE ',
    new IdAttributeOp('imageT'),
    'style="" template-id="imageT" >\n          <IMG ',
    new IdAttributeOp('image'),
    new AttributeOp('xbl2:width', '{{width}}'),
    new AttributeOp('alt', '{{alt}}'),
    new ImageOp('{{src}}', new IdAttributeOp('image')),
    '>\n        </XBL2:TEMPLATE>'
  ];
  parseElement(ShadowTemplates['imageT'].template, parts);
  compareTemplateOps('', expectedParts, parts);
}

function testParseElement_idInsertion() {
  var parts = [];
  var expectedParts = [
      '<DIV ',
      new IdAttributeOp('$id_4'),
      '>',
      new ValueOp('this is a {{var}}'),
      '</DIV>'];
  var e = document.createElement('div');
  e.textContent = 'this is a {{var}}';
  parseElement(e, parts);
  compareTemplateOps(e.textContent, expectedParts, parts);
}

function testParseElement_spanInsertion() {
  var parts = [];
  var expectedParts = [
      '<DIV ><XBL2:SPAN ',
      new IdAttributeOp('$id_4'),
      '>',
      new ValueOp('this is a {{var}}'),
      '</XBL2:SPAN><IMG ></DIV>'
  ];
  var e = document.createElement('div');
  e.innerHTML = 'this is a {{var}}<img>';
  parseElement(e, parts);
  compareTemplateOps(e.textContent, expectedParts, parts);
}

function testInstantiateAndBindData_table() {
  var template = ShadowTemplates['table'];
  dictionaryContext =
      [{ 'table': {'row': [{'col': [{'cell':'A'},{'cell':'B'}]},
                           {'col': [{'cell':'1'},{'cell':'2'},{'cell':'3'}]}
                   ]}
       }];
  var parts = [];
  template.instantiateAndBindData(dictionaryContext, '', false);
  var table = document.getElementById('table');
  assertNotNull('Table exists', table);
  assertTrue('Table instantiated', isTemplateInstance(table));
  var rows = table.getElementsByTagName('tr');
  assertEquals('Table has 2 rows + marker', 3, rows.length);
  assertEquals('Second row has 3 cols + marker', 4,
               rows[1].getElementsByTagName('td').length)
  assertEquals('3', document.getElementById('col.1.2').textContent);
}

function testInstantiateAndBindData_select() {
  var template = ShadowTemplates['select'];
  dictionaryContext =
      [{ 'select': {'option': [{'choice':'A'},{'choice':'B'},{'choice':'C'}]}
       }];
  var parts = [];
  template.instantiateAndBindData(dictionaryContext, '', false);
  var select = document.getElementById('select');
  assertNotNull('Select exists', select);
  assertTrue('select instantiated', isTemplateInstance(select));
  var options = select.getElementsByTagName('option');
  assertEquals('Select has 3 options + marker', 4, options.length);
  assertEquals('C', document.getElementById('option.2').textContent);
}

function testInstantiateAndBindData_SingletonTagTemplate() {
  var template = ShadowTemplates['br'];
  dictionaryContext =
      [{ 'br': [{}, {}]
       }];
  var parts = [];
  template.instantiateAndBindData(dictionaryContext, '', false);

  var brDiv = document.getElementById('singleton');
  assertEquals(3, brDiv.childNodes.length);

  // First child is an instantiation
  assertTrue('Instance0 visible', isVisible(brDiv.childNodes[0]));
  assertEquals('BR', brDiv.childNodes[0].tagName);
  assertTrue(isTemplateInstance(brDiv.childNodes[0]));
  
  // Second child is an instantiation
  assertTrue('Instance1 visible', isVisible(brDiv.childNodes[1]));
  assertEquals('BR', brDiv.childNodes[1].tagName);
  assertTrue(isTemplateInstance(brDiv.childNodes[1]));
  
  // Third child is the template dom node and endInstancesMarker
  assertTrue('Template end marker not visible', isHidden(brDiv.childNodes[2]));
  assertEquals('BR', brDiv.childNodes[2].tagName);
  assertFalse(isTemplateInstance(brDiv.childNodes[2]));
  assertEquals(document.getElementById(END_INSTANCES_MARKER + 'br'),
               brDiv.childNodes[2]);
  assertTrue(isTemplate(brDiv.childNodes[2]));
}

function testInstantiateAndBindData_IdTest() {
  var template = ShadowTemplates['template-id_14'];
  dictionaryContext =
      [{ 'idtest': [{id: 'firstId'}, {id: 'secondId'}]
       }];
  var parts = [];
  template.instantiateAndBindData(dictionaryContext, '', false);

  assertNotNull('testfirstId is ok', document.getElementById('testfirstId'));
  assertNotNull('testsecondId is ok', document.getElementById('testsecondId'));
}

function testHeaderTemplate() {
  var jsonData = { 'head': {'msg': 'hello'} };
  templateManager.applyTemplate(jsonData, false, templateOps);
  assertEquals('hi hello', document.getElementById('head').textContent);
}

function testRootInstantiation_withId() {
  var jsonData = { 'mtitle': 'Modified', 'titleid': 'h2' };
  templateManager.applyTemplate(jsonData, false, templateOps);
  assertEquals('Modified', document.getElementById('h2').textContent);

  var jsonData2 = { 'mtitle': 'ModifiedWithId', 'titleid': 'h3' };
  templateManager.applyTemplate(jsonData2, false, templateOps);
  assertEquals('ModifiedWithId', document.getElementById('h3').textContent);
}

function testShowOnlyUsedInstances() {
  var eimMarker = document.getElementById('eim_dummy');
  ShadowTemplates.ROOT.showOnlyUsedInstances(eimMarker);
  for (var i = 0; i < 5; i++) {
    assertTrue(i + ' is visible',
               isVisible(document.getElementById('dummy.' + i)));
  }
  for (var i = 5; i < 11; i++) {
    assertTrue(i + ' is hidden',
               isHidden(document.getElementById('dummy.' + i)));
  }
}

function testHidingNestedInstances() {
  var jsonData = { 'outer': {'inner': {'var': 'hello'} } };
  templateManager.applyTemplate(jsonData, true, templateOps);
  templateManager.applyTemplate({}, false, templateOps);
  templateManager.applyTemplate({'outer': {} }, true, templateOps);
  assertTrue(isHidden(document.getElementById('inner')));
}

function testRemoveTemplateInstances() {
  var jsonData = { 'outer': {'inner': {'var': 'hello'} } };
  templateManager.applyTemplate(jsonData, false, templateOps);
  var endInstancesMarker = document.getElementById('eim_outer');
  assertEquals(1, parseInt(
      endInstancesMarker.getAttribute('num_instances')));
  var instanceNode = document.getElementById('outer');
  assertEquals(instanceNode, endInstancesMarker.previousSibling);
  removeTemplateInstances();
  assertNull(document.getElementById('outer'));
  assertEquals(0, parseInt(
      endInstancesMarker.getAttribute('num_instances')));
}

function testExecuteScripts() {
  executeScripts();
  // varName is defined in scriptNode of html
  assertEquals(varName, 'scriptVar');
  clearScriptNodes();
  assertNull(document.getElementById('scriptDiv_blink'));
}
