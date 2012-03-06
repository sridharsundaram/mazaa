// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview UnitTests for template_ops.js
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

function chooseColor(label) {
  if (label == undefined) return 'undefined-color';
  if (label == 'warning') return 'orange';
  if (label == 'error') return 'red';
  return 'green';
}

getBlinkFormatters().register('chooseColor', chooseColor);

function testRegexBeginDelimiter() {
  assertNotNull('{{'.match(reBeginDelimiter));
  assertNotNull('%7B%7B'.match(reBeginDelimiter));
  assertNull('%7B{'.match(reBeginDelimiter));
}

function testRegexEndDelimiter() {
  assertNotNull('}}'.match(reEndDelimiter));
  assertNotNull('%7D%7D'.match(reEndDelimiter));
  assertNull('}%7D'.match(reBeginDelimiter));
}

function testRegexName() {
  assertEquals('abcABC', 'abcABC'.match(reName)[0]);
  assertEquals('abc-123', 'abc-123'.match(reName)[0]);
  assertEquals('_abc_123', '_abc_123'.match(reName)[0]);
  assertEquals('abc_123', '1abc_123'.match(reName)[0]);
  assertEquals('abc_123', '-abc_123'.match(reName)[0]);
  assertEquals('a/b', 'a/b'.match(reName)[0]);
  assertEquals('/a/b', '/a/b'.match(reName)[0]);
}

function testRegexFormatterOptional() {
  assertEquals('formatter', '|formatter'.match(reFormatterOptional)[1]);
  assertEquals('formatter', '  |  formatter'.match(reFormatterOptional)[1]);
  assertEquals('f', ' | f'.match(reFormatterOptional)[1]);
  // Optional match below
  assertEquals('', '  formatter'.match(reFormatterOptional)[0]);
  assertEquals('', ' | 12formatter'.match(reFormatterOptional)[0]);
}


function testRegexVariable() {
  var match = '{{ var | formatter }}'.match(reVariable);
  assertEquals('var', match[1]);
  assertEquals('formatter', match[2]);

  match = '{{var}}'.match(reVariable);
  assertEquals('var', match[1]);
  assertEquals(undefined, match[2]);
}


function testAttributeOp() {
  var v = new AttributeOp('xbl2:src', '{{url}}');
  assertEquals('src', v.name);
  compareTemplateOps('AttributeOp: ', new ValueOp('{{url}}'), v.valueOp);


  assertEquals(' src="src1"', v.instantiate([{'url':'src1'}], ''));
  assertEquals('', v.instantiate([{}], ''));


  var u = new AttributeOp('xbl2:style', '{{css | chooseColor}}');
  assertEquals('style', u.name);
  compareTemplateOps('', new ValueOp('{{css | chooseColor}}'), u.valueOp);
  assertEquals(' style="red"', u.instantiate([{'css': 'error'}], ''));
  assertEquals(' style="green"', u.instantiate([{'css': ''}], ''));
  assertEquals(' style="undefined-color"', u.instantiate([{}], ''));

  var w = new AttributeOp('style', '{{css}}');
  assertEquals('style', w.name);
  compareTemplateOps('', new ValueOp('{{css}}'), w.valueOp);
  assertEquals(' style="error"', w.instantiate([{'css': 'error'}], ''));
  assertEquals(' style=""', w.instantiate([{}], ''));
  
  var x = new AttributeOp('title', '{{quote}}');
  assertEquals('title', x.name);
  assertEquals(' title="\\\""', x.instantiate([{'quote': '"'}], ''));
}

function testImageOp() {
  var v = new ImageOp('{{url}}', new IdAttributeOp('test'));
  compareTemplateOps('ImageOp: ', new ValueOp('{{url}}'), v.valueOp);
  assertEquals('test', v.idAttributeOp.id);

  var u = new ImageOp('{{url}}', new IdAttributeOp('test'));
  var dictionaryContext = [{url: '".jpg'}];
  ShadowTemplates = {};
  assertEquals(' xbl2:src="\\\".jpg"', u.instantiate(dictionaryContext, ''));
}

function testIdAttributeOp() {
  var dictionaryContext = [{suffix: '.2'}];
  var i1 = new IdAttributeOp('base');
  assertEquals('base.1', i1.getValue(dictionaryContext, '.1'));
  assertEquals(' id="base.1" ', i1.instantiate(dictionaryContext, '.1'));

  var i2 = new IdAttributeOp('id{{suffix}}');
  assertEquals('id{{suffix}}', i2.getValue(dictionaryContext, ''));
  assertEquals('id.2', i2.getValue(dictionaryContext, '.1'));
  assertEquals(' id="id.2" ', i2.instantiate(dictionaryContext, '.1'));

  
  var i3 = new IdAttributeOp('base{{quote}}');
  dictionaryContext = [{quote: '"'}];
  assertEquals('base"', i3.getValue(dictionaryContext, '.1'));
  assertEquals(' id="base\\\"" ', i3.instantiate(dictionaryContext, '.1'));
}

function testAttributeOp_reInstantiate() {
  var w = new AttributeOp('attr', '{{css}}');
  var d = document.createElement('div');

  var dictionaryContext = [{'css':'color:red'}];
  var idSuffix = '';
  w.reInstantiate(d, dictionaryContext, idSuffix);
  assertEquals('color:red', d.getAttribute('attr'));

  w.reInstantiate(d, [{}], '');
  assertEquals('', d.getAttribute('attr'));

  var v = new AttributeOp('xbl2:src', '{{url}}');
  v.reInstantiate(d, [{}], '');
  assertEquals(null, d.getAttribute('src'));
  assertEquals(null, d.getAttribute('xbl2:src'));

  v.reInstantiate(d, [{'url':'http://images/simple.jpg'}], '');
  assertEquals('http://images/simple.jpg', d.getAttribute('src'));
  assertEquals(null, d.getAttribute('xbl2:src'));

}

function testVariableOp() {
  var v = new VariableOp('url', undefined);
  assertEquals('url', v.name);
  assertEquals(undefined, v.formatter);
  assertEquals('1,2', v.instantiate([{'url':[1,2]}], ''));
  assertEquals('', v.instantiate([{}], ''));

  var u = new VariableOp('css', 'chooseColor');
  assertEquals('css', u.name);
  assertEquals('chooseColor', u.formatter);
  assertEquals('orange', u.instantiate([{'css': 'warning'}], ''));
  assertEquals('undefined-color', u.instantiate([{}], ''));
};

function testValueOp() {
  var valueOp = new ValueOp('this is {{p1 | f1}} and {{p2}}');
  var expectedParts = [
      'this is ',
      new VariableOp('p1', 'f1'),
      ' and ',
      new VariableOp('p2', undefined)
  ];
  compareTemplateOps('', expectedParts, valueOp.parts);

  valueOp = new ValueOp('this is {{p1}} and {{p2}}');
  dictionaryContext =  [{ 'p1': 'part1', 'p2': 'part2'}];
  var expected = 'this is part1 and part2';
  assertEquals(expected, valueOp.instantiate(dictionaryContext, '.1'));
}

function testValueOp_reInstantiate() {
  var valueOp = new ValueOp('this is {{p1}} and {{p2}}');
  var d = document.createElement('div');
  var dictionaryContext = [{'p1': 'part1', 'p2': 'part2'}];
  var idSuffix = '';
  valueOp.reInstantiate(d, dictionaryContext, idSuffix);
  assertEquals('this is part1 and part2', d.textContent);


  valueOp.reInstantiate(d, [{}], idSuffix);
  assertEquals('this is  and ', d.textContent);
}
