// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview UnitTests for formatter.js
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

function setUp() {
  ShadowTemplates = null;
  var templateManager = new TemplateManager({});
}

function testInstantiateTemplate_formatter() {
  var dictionaryContext = [{"Main" : {'type': 'warning'} }];
  var template = ShadowTemplates['MainT'];
  var main = document.createElement('div');
  main.appendChild(template.instantiateDom(dictionaryContext, ''));
  var element = main.getElementsByTagName('span')[1];
  assertEquals('msg orange', element.getAttribute('class'));

  dictionaryContext = [{"Main" : {'type': 'error'} }];
  var main = document.createElement('div');
  main.appendChild(template.instantiateDom(dictionaryContext, ''));
  element = main.getElementsByTagName('span')[1];
  assertEquals('msg red', element.getAttribute('class'));

  dictionaryContext = [{"Main" : {'type': 'ok'} }];
  var main = document.createElement('div');
  main.appendChild(template.instantiateDom(dictionaryContext, ''));
  element = main.getElementsByTagName('span')[1];
  assertEquals('msg green', element.getAttribute('class'));

  dictionaryContext = [{"Main" : {} }];
  var main = document.createElement('div');
  main.appendChild(template.instantiateDom(dictionaryContext, ''));
  element = main.getElementsByTagName('span')[1];
  assertEquals('msg undefined-color', element.getAttribute('class'));
}
