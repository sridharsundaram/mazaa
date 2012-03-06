// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements tests for Patch.js
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

var originalHtml;

function setUp() {
  originalHtml = document.body.innerHTML;
}

function tearDown() {
  document.body.innerHTML = originalHtml;
}

function testPatchNode_Insert() {
  var patch = ['/1/1/0', 'INSERT', '<span id="patch">test</span>'];
  var unpatch = patchNode(patch);
  assertEquals('' + ['/1/1/0', 'DELETE', null], '' + unpatch);
  assertNotNull(document.getElementById('patch'));
  patch2 = patchNode(unpatch);
  assertNull(document.getElementById('patch'));
  assertEquals('' + patch, '' + patch2);
}

function testPatchAttribute_Insert() {
  var patch = ['/1/1@attr', 'INSERT', 'test'];
  var unpatch = patchAttribute(patch);
  assertEquals('' + ['/1/1@attr', 'DELETE', null], '' + unpatch);
  assertEquals('Attribute inserted', 'test',
      document.getElementById('MainT').getAttribute('attr'));
  patch2 = patchAttribute(unpatch);
  assertNull(document.getElementById('MainT').getAttribute('attr'));
  assertEquals('' + patch, '' + patch2);
}

function testPatchNode_Delete() {
  var patch = ['/1/1/0/0/0', 'DELETE', null];
  var unpatch = patchNode(patch);
  assertEquals('' + ['/1/1/0/0/0', 'INSERT',
      '<span><span id="maindiv"><b>example</b></span></span>'],
      '' + unpatch);
  patch2 = patchNode(unpatch);
  assertEquals('' + patch, '' + patch2);
}

function testPatchAttribute_Delete() {
  var patch = ['/1/1@template-id', 'DELETE', null];
  var unpatch = patchAttribute(patch);
  assertEquals('' + ['/1/1@template-id', 'INSERT', 'MainT'], '' + unpatch);
  assertNull('Attribute deleted',
      document.getElementById('MainT').getAttribute('template-id'));
  patch2 = patchAttribute(unpatch);
  assertEquals('Attribute inserted back', 'MainT',
          document.getElementById('MainT').getAttribute('template-id'));
  assertEquals('' + patch, '' + patch2);
}

function testPatchNode_Update() {
  var patch = ['/1/1/0/0/0', 'UPDATE', '<b>test</b>'];
  var unpatch = patchNode(patch);
  assertEquals('' + ['/1/1/0/0/0', 'UPDATE',
      '<span id="maindiv"><b>example</b></span>'],
      '' + unpatch);
  patch2 = patchNode(unpatch);
  assertNull(document.getElementById('patch'));
  assertEquals('' + patch, '' + patch2);
}

function testPatchAttribute_Update() {
  var patch = ['/1/1@template-id', 'UPDATE', 'test'];
  var unpatch = patchAttribute(patch);
  assertEquals('' + ['/1/1@template-id', 'UPDATE', 'MainT'], '' + unpatch);
  assertEquals('test',
      document.getElementById('MainT').getAttribute('template-id'));
  patch2 = patchAttribute(unpatch);
  assertEquals('Attribute updated back', 'MainT',
          document.getElementById('MainT').getAttribute('template-id'));
  assertEquals('' + patch, '' + patch2);
}
