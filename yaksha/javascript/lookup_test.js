// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview UnitTests for lookup.js
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

function testLookupContext() {
  var dictionary = {'a': 1, 'b': 2};
  var dictionaryContext = [];
  dictionaryContext.push(dictionary);
  assertEquals(undefined, lookupContext(dictionaryContext, null));
  assertEquals(1, lookupContext(dictionaryContext, 'a'));
  assertEquals(undefined, lookupContext(dictionaryContext, 'c'));
  assertEquals(2, lookupContext(dictionaryContext, 'b'));

  // Nested context is correctly matched
  dictionaryContext.push({'a': 10, 'c': 3});
  assertEquals(10, lookupContext(dictionaryContext, 'a'));
  assertEquals(3, lookupContext(dictionaryContext, 'c'));
  assertEquals(2, lookupContext(dictionaryContext, 'b'));
  assertEquals(undefined, lookupContext(dictionaryContext, 'd'));
  // Scoped match is correctly done.
  var nestedDict = [{'id': '2345'}, {'id': '3456'}];
  dictionaryContext =
    [{'Main': {'id':'1234',
               'image':[{'src': 'http://images/complex.jpg'}],
               'nested': nestedDict,
               'maindiv':{'text': 'Inner'},
               'text':'Outer'}
              }];
  assertEquals('1234', lookupContext(dictionaryContext, '/Main/id'));
  assertEquals('Outer', lookupContext(dictionaryContext, '/Main/text'));
  assertEquals('Inner', lookupContext(dictionaryContext, '/Main/maindiv/text'));
  assertEquals(nestedDict, lookupContext(dictionaryContext, '/Main/nested'));
  assertEquals(undefined, lookupContext(dictionaryContext, '/Main/nested/id'));
  assertEquals(undefined, lookupContext(dictionaryContext, '/Main/junk'));
  assertEquals(undefined, lookupContext(dictionaryContext, '/Main/image/src'));

  // Scoped match without leading /
  assertEquals('1234', lookupContext(dictionaryContext, 'Main/id'));
  assertEquals('Inner', lookupContext(dictionaryContext, 'Main/maindiv/text'));
  // push another scope and check
  dictionaryContext.push(lookupContext(dictionaryContext, 'Main'));
  assertEquals('1234', lookupContext(dictionaryContext, 'id'));
  assertEquals('Inner', lookupContext(dictionaryContext, 'maindiv/text'));
  // push one more scope and check
  dictionaryContext.push(lookupContext(dictionaryContext, 'maindiv'));
  assertEquals('Inner', lookupContext(dictionaryContext, 'text'));
}

function testLookupScopedValue() {
  var avalue = [1,2];
  var dictionaryContext =
      [{'a': avalue, 'b': EMPTY_DICTIONARY, 'c': 3, 'e':0, 'f': null}];

  // Integer value
  assertEquals(3, lookupScopedValue(dictionaryContext, 'c'));
  assertEquals(false, lookupScopedValue(dictionaryContext, '!c'));

  // Complex variables
  assertEquals(avalue, lookupScopedValue(dictionaryContext, 'a'));
  assertEquals(false, lookupScopedValue(dictionaryContext, '!a'));
  assertEquals(EMPTY_DICTIONARY, lookupScopedValue(dictionaryContext, 'b'));
  assertEquals(false, lookupScopedValue(dictionaryContext, '!b'));

  // Unmatched variables will return undefined
  assertEquals(undefined, lookupScopedValue(dictionaryContext, 'd'));
  assertEquals(true, lookupScopedValue(dictionaryContext, '!d'));

  // Zero value or false value
  assertEquals(0, lookupScopedValue(dictionaryContext, 'e'));
  assertEquals(true, lookupScopedValue(dictionaryContext, '!e'));
  // null value
  assertEquals(undefined, lookupScopedValue(dictionaryContext, 'f'));
}

function testLookupTemplateDataBinding_dataBindId() {
  var valueA = [1, 2];
  var valueB = {};
  var dictionaryContext =
      [{'a': valueA, 'b': valueB, 'c': 3, 'd': NULL_DATA_BINDING}];

  var element = document.createElement("div");
  // Primitive values of data-binding should return undefined
  element.setAttribute(DATA_BIND_ID, "c");
  assertEquals(undefined, lookupTemplateDataBinding(dictionaryContext, element));

  // Complex variables should return as is
  element.setAttribute(DATA_BIND_ID, "a");
  assertEquals(valueA, lookupTemplateDataBinding(dictionaryContext, element));
  element.setAttribute(DATA_BIND_ID, "b");
  assertEquals(valueB, lookupTemplateDataBinding(dictionaryContext, element));

  // Suppressed binding as NULL_DATA_BINDING should be returned
  element.setAttribute(DATA_BIND_ID, "d");
  assertEquals(NULL_DATA_BINDING,
               lookupTemplateDataBinding(dictionaryContext, element));

  // Unmatched variables will return undefined
  element.setAttribute(DATA_BIND_ID, "unmatched");
  assertEquals(undefined, lookupTemplateDataBinding(dictionaryContext, element));
}

function testLookupTemplateDataBinding_dataExpandIf() {
  var valueA = [1, 2];
  var dictionaryContext =
      [{'a': valueA, 'b': NULL_DATA_BINDING, 'c': false, 'd': true,
        'e': 0, 'f': ''}];

  var element = document.createElement('div');
  assertEquals('If no data-bind-if, undefined', undefined,
               lookupTemplateDataBinding(dictionaryContext, element));
  element.setAttribute(DATA_EXPAND_IF, 'a');
  assertEquals('data-bind-if is object', EMPTY_DICTIONARY,
               lookupTemplateDataBinding(dictionaryContext, element));
  element.setAttribute(DATA_EXPAND_IF, 'b');
  assertEquals('data-bind-if value is NULL_DATA_BINDING, undefined', undefined,
               lookupTemplateDataBinding(dictionaryContext, element));
  element.setAttribute(DATA_EXPAND_IF, 'c');
  assertEquals('data-bind-if value is false, undefined', undefined,
               lookupTemplateDataBinding(dictionaryContext, element));
  element.setAttribute(DATA_EXPAND_IF, 'd');
  assertEquals('data-bind-if value is true', EMPTY_DICTIONARY,
               lookupTemplateDataBinding(dictionaryContext, element));
  element.setAttribute(DATA_EXPAND_IF, 'e');
  assertEquals('data-bind-if value is 0, undefined', undefined,
               lookupTemplateDataBinding(dictionaryContext, element));
  element.setAttribute(DATA_EXPAND_IF, 'f');
  assertEquals('data-bind-if value is "0", undefined', undefined,
               lookupTemplateDataBinding(dictionaryContext, element));
}
