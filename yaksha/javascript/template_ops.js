// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements Template Ops - these are operators used for
 * templates and in particular for reusing DOM in templates. They make
 * reuse of DOM easy and provide a measure of complexity for a template page.
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

// {{ could be replaced by %7B%7B by browser
/**
 * returns string with " escaped with \"
 * Safe to repeatedly escape the same string (does not double-escape)
 */
function escapeQuote(str) {
  return str.replace(/^"/,'\\"').replace(/([^\\])"/g, '$1\\"');
}

/**
 * Constructs an image operator.
 * @param value {String} - value of attribute
 * @param idAttributeOP {IdAttributeOp} - operator for id of this image
 */
function ImageOp(value, idAttributeOp) {
  this.valueOp = new ValueOp(value);
  this.idAttributeOp = idAttributeOp;
}

/**
 * Returns the instantiated src attribute string
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String} - not used, only for inheritance signature
 * @return src="value" attribute string
 */
ImageOp.prototype.instantiate = function(dictionaryContext, idSuffix) {
  var value = this.valueOp.instantiate(dictionaryContext, idSuffix);
  if (ShadowTemplates.criticalImageIds && value) {
    ShadowTemplates.criticalImageIds.push(
        this.idAttributeOp.getValue(dictionaryContext, idSuffix));
  }
  return value ? ' xbl2:src="' + escapeQuote(value) + '"' : '';
}

/**
 * Reinstantiates the image's src in the element.
 * @param element {Element} - whose attribute is to be set
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String} - not used, only for inheritance signature
 */
ImageOp.prototype.reInstantiate =
    function(element, dictionaryContext, idSuffix) {
  var value = this.valueOp.instantiate(dictionaryContext, idSuffix);
  if (value) {
    element.setAttribute('xbl2:src', value);
    if (ShadowTemplates.criticalImageIds) {
      ShadowTemplates.criticalImageIds.push(element.id);
    }
  }
}

ImageOp.prototype.count = 0;

/**
 * Constructs an attribute operator.
 * @param name {String} - name of attribute
 * @param value {String} - value of attribute
 */
function AttributeOp(name, value) {
  this.xbl2 = name.indexOf('xbl2') == 0;
  this.name = this.xbl2 ? name.substr('xbl2:'.length) : name;
  // Match out all variables in attribute value string and compose a ValueOp
  // A single attribute value might have multiple variables.
  // e.g. src="http://{{host}}/{{imagepath}}"
  this.valueOp = new ValueOp(value);
};

/**
 * Returns the instantiated attribute string
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String} - not used, only for inheritance signature
 * @return attribute string
 */
AttributeOp.prototype.instantiate = function(dictionaryContext, idSuffix) {
  var value = this.valueOp.instantiate(dictionaryContext, idSuffix);
  if (this.xbl2) { // Attribute should be skipped if value is undefined
    return value ? (' ' + this.name + '="' + escapeQuote(value) + '"') : '';
  } else if (value) {
    return ' ' + this.name + '="' + escapeQuote(value) + '"';
  } else {
    return ' ' + this.name + '=""';
  }
};

/**
 * Reinstantiates the attribute's value in the element.
 * @param element {Element} - whose attribute is to be set
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String} - not used, only for inheritance signature
 */
AttributeOp.prototype.reInstantiate =
    function(element, dictionaryContext, idSuffix) {
  var value = this.valueOp.instantiate(dictionaryContext, idSuffix);
  if (this.xbl2 && !value) {
    element.removeAttribute(this.name);
  } else if (value) {
    element.setAttribute(this.name, value);
  } else {
    element.setAttribute(this.name, '');
  }
};

AttributeOp.prototype.count = 0;

/**
 * Constructs a variable operator.
 * Variables are restricted to being used inside Value operators.
 * @param name {String} name of variable
 * @param formatter {String} name of registeredd formatter function
 */
function VariableOp(name, formatter) {
  this.name = name;
  this.formatter = formatter;
};

/**
 * Returns the instantiated variable string
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String}
 * @return string corresponding to variable value if defined else empty string
 */
VariableOp.prototype.instantiate = function(dictionaryContext, idSuffix) {
  var value = lookupScopedValue(dictionaryContext, this.name);
  if (this.formatter) {
    value = getBlinkFormatters().evaluate(this.formatter, value);
  }
  // If value is undefined, the xbl2:attribute will be removed.
  if (value != undefined) {
    // Convert value to string.
    return '' + value;
  }
  return '';
};

/**
 * Constructs an ID attribute operator
 * @param id {String} - id of element used as root for generating id's
 *                        along with idSuffix. If an expression,
 *                        the value of the expression will be used.
 */
function IdAttributeOp(id) {
  if (id.match(variableRegex)) { // id is an expression
    this.valueOp = new ValueOp(id);
  }  // if id is not an expression, we will use it as a base
  this.id = id;
};

/**
 * Returns the instantiated id attribute string
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String}
 * @return id attribute string composed of id and the suffix
 */
IdAttributeOp.prototype.instantiate = function(dictionaryContext, idSuffix) {
  var id = this.getValue(dictionaryContext, idSuffix);
  return ' id="' + escapeQuote(id) + '" ';
};

/**
 * Returns constructed id string for non-expression id's.
 * For expression id's, if idsuffix is empty, then
 *               return the value of this idOp evaluated in previous call 
 *               else return value of idOp evaluated in this call.
 * @param idSuffix {String} - suffix to be added to id to make unique
 */
IdAttributeOp.prototype.getValue = function(dictionaryContext, idSuffix) {
  if (this.valueOp) { // Does not work correctly with reuseDom
    var id = this.id;
    this.id = this.valueOp.instantiate(dictionaryContext, idSuffix) || this.id;
    return idSuffix ? this.id : id;
  } 
  return this.id + idSuffix
};

/**
 * Constructs a value operator.
 * @param contentStr {String} - string to be parsed into substrings and
 *                               variables. e.g. "http://{{host}}/{{url|html}}"
 */
function ValueOp(contentStr) {
  this.parts = [];
  var match;
  for (var lastIndex = 0;
       match = variableRegex.exec(contentStr);
       lastIndex = variableRegex.lastIndex) {
    if (lastIndex != match.index) {
      appendStringToArray(this.parts,
                          contentStr.substring(lastIndex, match.index));
    }
    if (match[1]) { // Variable
      this.parts.push(new VariableOp(match[1], match[2]));
    }
  }
  if (lastIndex < contentStr.length) {
    appendStringToArray(this.parts, contentStr.substring(lastIndex));
  }
};

/**
 * returns instantiated string corresponding to this operator.
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String} - not used, only for inheritance signature
 * @return string corresponding to operator as per variables binding.
 */
ValueOp.prototype.instantiate = function(dictionaryContext, idSuffix) {
  var parts = [];
  for (var i = 0; i < this.parts.length; i++) {
    var part = this.parts[i];
    if (typeof part == "string") {
      parts.push(part);
    } else {
      parts.push(part.instantiate(dictionaryContext, idSuffix));
    }
  }
  return parts.length == 0 ? undefined : parts.join('');
};

/**
 * Sets the HTML content of element to the value computed using variables.
 * @param element {Element} - element whose html content is to be set
 * @param dictionaryContext {Array.<String, Object>}
 * @param idSuffix {String} - not used, only for inheritance signature
 */
ValueOp.prototype.reInstantiate =
    function(element, dictionaryContext, idSuffix) {
  var value = this.instantiate(dictionaryContext, idSuffix) || '';
  setInnerHtmlOrTextContent(element, value);
};

ValueOp.prototype.count = 0;

// Compare operations below are used only for testing.

VariableOp.prototype.compare = function(msg, that) {
  assertEquals(msg + ': VariableOp:  name ', this.name, that.name);
  assertEquals(msg + ': VariableOp: formatter ',
               this.formatter, that.formatter);
};

IdAttributeOp.prototype.compare = function(msg, that) {
  if (this.valueOp) {
    this.valueOp.compare(msg + ':IdAttributeOp ', that.valueOp);
  } else {
    assertEquals(msg + ': IdAttributeOp: ', this.id, that.id);
  }
};

AttributeOp.prototype.compare = function(msg, that) {
  assertEquals(msg + ': AttributeOp: name ', this.name, that.name);
  assertEquals(msg + ': AttributeOp: xbl2 ', this.xbl2, that.xbl2);
  this.valueOp.compare(msg + ':AttributeOp ', that.valueOp);
};

ImageOp.prototype.compare = function(msg, that) {
  this.valueOp.compare(msg + ': ImageOp: ', that.valueOp);
  this.idAttributeOp.compare(msg + ': ImageOp: ', that.idAttributeOp);
}

ValueOp.prototype.compare = function(msg, that) {
  compareTemplateOps(msg + ':ValueOp ', this.parts, that.parts);
};

Template.prototype.compare = function(msg, that) {
  assertEquals(msg + ':Template ', this, that);
};

function compareTemplateOps(msg, parts, templateParts) {
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    var templatePart = templateParts[i];
    if (typeof part == "string") {
      assertEquals(msg + ':Index ' + i, part, templatePart);
    } else {
      part.compare(msg + ':Index ' + i, templatePart);
    }
  }
  assertEquals(msg + ': Num parts match', parts.length, templateParts.length);
};


