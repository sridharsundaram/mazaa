// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements Google C-templates adapted for Javascript
 * Binds JSON data to HTML templates in javascript.
 * An HTML element may have a data-bind-id specified.
 * This id identifies a JSON data element to bind to which may be an array or
 * a dictionary.
 * A name delimited as {{name}} is substitued by its value in the current scope.
 * Such substitutions can apply a registered formatter function to the value.
 * e.g. {{name | formatter}}
 * Here, formatter must be a function that takes value as its first argument and
 * produces a new output value.
 * The current scope is the nearest parent element data binding which has a
 * value for that name in its dictionary.
 * Data-Bind-Id's may be fully qualified to specify a scope,
 * with "/" as separator and "/" as the root scope (like unix directory system).
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

var DATA_BIND_ID = "data-bind-id";
var DATA_EXPAND_IF = 'data-expand-if';
var EMPTY_DICTIONARY = {};
var NULL_DATA_BINDING = "";
var TEMPLATE_ID = 'template-id';
var END_INSTANCES_MARKER = 'eim_';
var NUM_USED_INSTANCES = 'num_used_instances';
var NUM_INSTANCES = 'num_instances';

// In a data-bound collection, we want to distinguish
// the first element from other elements. This allows us to generate things
// like csv and breadcrumbs.
// We use () in the name to indicate built-in versus json data.
var FIRST = "first()";
var RANDOM = 'random()';

// Regular expressions for matching out template syntax
var reBeginDelimiter = '(?:(?:{{)|(?:%7B%7B))';
var reName = '[ ]*([a-zA-Z_/][-A-Za-z0-9_/]*)[ ]*';
var reFormatterOptional = '(?:(?: *[|] *)' + reName + ')?';
// }} could be replaced by %7D%7D by browser
var reEndDelimiter = '(?:(?:}})|(?:%7D%7D))';
var reVariable = reBeginDelimiter + reName + reFormatterOptional +
                 reEndDelimiter;
//                                  match(1)  match(2)
//                                  variable  formatter
/** Regex used for matching out variables in a string */
var variableRegex = new RegExp(reVariable, 'g');

var getDocument = function() {
  return document;
};

/**
 * Return true iff element corresponds to a template or endInstancesMarker
 * @param element {Element} element is not null and has a tag.
 */
function isTemplate(element) {
  return element.getAttribute &&
      (element.getAttribute(DATA_BIND_ID) != null ||
       element.getAttribute(DATA_EXPAND_IF) != null ||
       element.parentNode == getDocument() /* ROOT template */ );
};

/**
 * Return true iff element corresponds to a template instance.
 * @param element {Element} element is not null and has a tag.
 */
function isTemplateInstance(element) {
  return element.getAttribute &&
             element.getAttribute(TEMPLATE_ID) != null &&
                 !isTemplate(element);
};

/**
 * The text is broken up into parts where each part is either a text substring
 * or a slot where a variable/template/id expansion will come.
 * @param domElement - dom element corresponding to template in document
 */
var Template = function(domElement) {
  this.domElement = domElement;
  this.childrenTemplates = [];
  this.id = domElement.getAttribute(TEMPLATE_ID);
  this.dataBindId = domElement.getAttribute(DATA_BIND_ID);

  // For ROOT template, nothing else needs to be done
  if (domElement == getDocument().documentElement) return;

  for (var parentElement = domElement.parentNode;
       !isTemplate(parentElement);
       parentElement = parentElement.parentNode) {
  }
  this.parentTemplate = parentElement;
  var id = this.parentTemplate.getAttribute(TEMPLATE_ID);
  ShadowTemplates[id].childrenTemplates.push(this);
};

/**
 *  Parse all attributes of element into parts.
 *  Add an IdAttributeOp if any attribute has a variable or element has id.
 */
function parseAttributes(element, attributes, parts) {
  var idOp = null;
  if (element.id) {
    parts.push(idOp = new IdAttributeOp(element.id));
  }
  for (var i = 0; i < attributes.length; i++) {
    var attribute = attributes[i];
    // If not user-specified attribute or id attribute, skip.
    if (!attribute.specified || attribute.nodeName == '_moz-userdefined'
        || attribute.nodeName == 'id' || attribute.nodeName == NUM_INSTANCES
        || attribute.nodeName == NUM_USED_INSTANCES) continue;
    if (attribute.nodeValue.match(reVariable)) {
      if (!element.id) { // Element does not have an id. Generate one.
        element.id = generateNewId();
        parts.push(idOp = new IdAttributeOp(element.id));
      }
      if ('IMG' == element.tagName && attribute.nodeName == 'xbl2:src') {
        parts.push(new ImageOp(attribute.nodeValue, idOp));
      } else {
        parts.push(new AttributeOp(attribute.nodeName, attribute.nodeValue));
      }
    } else {
      appendStringToArray(parts,
          attribute.nodeName + '="' + attribute.nodeValue + '" ');
    }
  }
};

/**
 *  Parse all children of element (recursively) into parts.
 */
function parseChildren(childNodes, parts) {
  for (var i = 0; i < childNodes.length; i++) {
    var child = childNodes[i];
    if (isTemplate(child)) {
      var templateId = child.getAttribute(TEMPLATE_ID);
      parts.push(ShadowTemplates[templateId]);
    } else if (!isTemplateInstance(child) && !isEndInstancesMarker(child)) {
      parseElement(child, parts);
    }
  }
};

/**
 * Returns the HTML corresponding to textnode.
 * If we use textnode contents directlyl, &gt; comes out as '>'.
 * This is a problem because we use innerHTML later to populate when
 * the '>' will create trouble. We could use textContent to populate instead
 * but then we will lose formatting markup.
 * Hence this workaround.
 * @param textNode {Element}
 */
function getHtml(textNode) {
  var d = getDocument().createElement('div');
  d.textContent = textNode.nodeValue;
  return d.innerHTML;
};

/** variable for creating unique id's */
Template.prototype.idCount = 0;

/**
 * Generate a unique id name within this page.
 */
function generateNewId() {
  return '$id_' + Template.prototype.idCount++;
};

var SINGLETON_TAGS = ['AREA', 'BASE', 'BR', 'COL', 'COMMAND', 'EMBED', 'HR',
                      'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE'];
function isSingletonTag(tagName) {
  return SINGLETON_TAGS.indexOf(tagName) != -1;
}

/**
 * Parses out the template - breaking up into pieces for efficiency of
 * instantiation.
 * Each part is either a string, an ID, an attribute or another template.
 */
function parseElement(element, parts) {
  if (element.tagName) {
    appendStringToArray(parts, '<' + element.tagName + ' ');
    parseAttributes(element, element.attributes, parts);
    // If singleton text child with variable and no id, add an id op
    if (element.childNodes.length == 1 /* single child */ &&
        element.firstChild.nodeType == element.TEXT_NODE &&
        !element.id /* does not have id */ &&
        element.textContent.match(reVariable) /* has variable */) {
      element.id = generateNewId();
      parts.push(new IdAttributeOp(element.id));
    }
    appendStringToArray(parts, '>');

    // No children, and no end tag required for singleton tags
    if (isSingletonTag(element.tagName)) return;

    parseChildren(element.childNodes, parts);
    appendStringToArray(parts, '</' + element.tagName + '>');
    return;
  }

  if (element.nodeType != element.TEXT_NODE) return;

  var text = getHtml(element);
  if (text.match(reVariable)) {
    var valueOp = new ValueOp(text);
    // If necessary, insert a span node here
    if (element.previousSibling == element.nextSibling) { // singleton child
      parts.push(valueOp);
    } else {
      var newId = generateNewId();
      var span = getDocument().createElement('xbl2:span');
      span.id = newId;
      element.parentNode.insertBefore(span, element.nextSibling);
      span.appendChild(element);
      appendStringToArray(parts, '<XBL2:SPAN ');
      parts.push(new IdAttributeOp(newId));
      appendStringToArray(parts, '>');
      parts.push(valueOp);
      appendStringToArray(parts, '</XBL2:SPAN>');
    }
  } else {
    appendStringToArray(parts, text);
  }
};

/**
 * Parses out the template - breaking up into pieces for efficiency of
 * instantiation.
 * Each part is either a string, an ID, an attribute or another template.
 */
Template.prototype.parseTemplate = function() {
  // First parse out all children
  for (var i = 0; i < this.childrenTemplates.length; i++) {
    this.childrenTemplates[i].parseTemplate();
  }
  this.template = this.domElement.cloneNode(true);
  this.parentTagName = this.domElement.parentNode.tagName;
  // Convert domElement to endInstancesMarker for the template
  setInnerHtmlOrTextContent(this.domElement, '');
  this.domElement.id = END_INSTANCES_MARKER + this.id;
  this.domElement.style.display = 'none';

  this.template.removeAttribute(DATA_BIND_ID);
  this.template.removeAttribute(DATA_EXPAND_IF);
  this.template.style.display = '';

  this.parts = [];
  parseElement(this.template, this.parts);
};

/**
 * Parses out the root template.
 * This is different from a normal template since it will always have
 * exactly one instance present and therefore always renistantiated.
 */
Template.prototype.parseRootTemplate = function() {
  for (var i = 0; i < this.childrenTemplates.length; i++) {
    this.childrenTemplates[i].parseTemplate();
  }
  this.parts = [];
  // Dont need the strings in the parse.
  var save = appendStringToArray;
  appendStringToArray = function(array, str) {};
  parseElement(this.domElement, this.parts);
  appendStringToArray = save;
};

/**
 * Instantiate this template in the current context with the specified data
 * @param dictionaryContext - stack of dictionaries to be looked up for data
 * @param idSuffix - suffix to make id's unique within template instances
 * @param dataBinding - dataBinding to be used for this template
 * @param parts - the instantiated parts for this template instantiation
 *                instanciated parts are pushed into this array
 */
Template.prototype.instantiateWithBinding =
    function(dictionaryContext, idSuffix, dataBinding, parts) {
  // Suppress re-binding of this data at a descendant by masking it.
  dataBinding[this.dataBindId] = NULL_DATA_BINDING;

  dictionaryContext.push(dataBinding);
  for (var i = 0; i < this.parts.length; i++) {
    var part = this.parts[i];
    if (typeof part == "string") {
      parts.push(part);
    } else if (part instanceof Template) {
      part.instantiate(dictionaryContext, idSuffix, parts, 0, 0);
    } else {
      parts.push(part.instantiate(dictionaryContext, idSuffix));
    }
  }
  dictionaryContext.pop();
};

/**
 * ReInstantiate this template in the current context with the specified data
 * Elements which can change are found using their ID's and their attributes
 * and content set appropriately.
 * @param dictionaryContext - stack of dictionaries to be looked up for data
 * @param idSuffix - suffix to make id's unique within template instances
 * @param dataBinding - dataBinding to be used for this template
 */
Template.prototype.reInstantiateWithBinding =
    function(dictionaryContext, idSuffix, dataBinding) {
  dataBinding[this.dataBindId] = NULL_DATA_BINDING;
  dictionaryContext.push(dataBinding);
  var element = null;
  for (var i = 0; i < this.parts.length; i++) {
    var part = this.parts[i];
    if (part instanceof IdAttributeOp) {
      var id = part.getValue(dictionaryContext, idSuffix);
      element = getDocument().getElementById(id); // ?? what if element is null ??
      // Assign new id value back to the element itself
      // Note that this is dangerous for re-use of the template
      if (part.valueOp && this == ShadowTemplates.ROOT) {
        element.id = part.id;
      }
    } else if (part instanceof Template) {
      // endInstancesMarker will always exist and instantiations will get linked up
      part.instantiateAndBindData(dictionaryContext, idSuffix);
    } else if (typeof part != 'string') {
      part.reInstantiate(element, dictionaryContext, idSuffix);
    }
  }
  dictionaryContext.pop();
};

/**
 * Instantiate the template with the current dictionary context
 * @param dictionaryContext - stack of dictionaries to be looked up for data
 * @param idSuffix - suffix to make id's unique within template instances
 * @param parts - the instantiated parts for this template instantiation
 *                instanciated parts are pushed into this array
 * @param beginInstance - # of the instance at which to begin binding
 */
Template.prototype.instantiate =
    function(dictionaryContext, idSuffix, parts, beginInstance) {
  var dataBinding = lookupTemplateDataBinding(dictionaryContext, this.domElement);
  var numUsedInstances = 0, numInstances = 0;
  if (dataBinding instanceof Array) {
    numInstances = numUsedInstances = dataBinding.length;
    if (beginInstance == 0) {
      randomNumber = Math.floor(Math.random() * dataBinding.length);
    } else {
      randomNumber = -1;
    }
    for (var j = beginInstance; j < numInstances; j++) {
      // Setup in the databinding if this is the first instance of the template
      // so that DATA_EXPAND_IF can use it.
      dataBinding[j][FIRST] = j == 0;
      dataBinding[j][RANDOM] = (j == randomNumber);
      var idSuffixWithCount = idSuffix + '.' + j;
      this.instantiateWithBinding(dictionaryContext,  idSuffixWithCount,
                                  dataBinding[j], parts);
    }
  } else if (dataBinding instanceof Object /* map */) {
    numUsedInstances = numInstances = 1;
    this.instantiateWithBinding(dictionaryContext, idSuffix,
                                dataBinding, parts);
  }
  var endInstancesMarkerId = END_INSTANCES_MARKER + this.id + idSuffix;
  if (!getDocument().getElementById(endInstancesMarkerId)) {
    // EndInstancesMarker needs to be created.
    var tagName = this.domElement.tagName;
    parts.push('<' + tagName +
            ' style="display: none;"' +
            ' id=' + endInstancesMarkerId +
            ' ' + NUM_USED_INSTANCES + '=' + numUsedInstances +
            ' ' + NUM_INSTANCES + '=' + numInstances + '>');
    if (!isSingletonTag(tagName)) {  // End tag required
      parts.push('</' + tagName + '>');
    }
  }
};

/**
 * Show used and hide unused instances of the template present in the DOM.
 * @param endInstancesMarker {Element} - end of instances marker for template
 */
Template.prototype.showOnlyUsedInstances = function(endInstancesMarker) {
  var numUsedInstances =
      parseInt(endInstancesMarker.getAttribute(NUM_USED_INSTANCES) || '0');
  var numInstances =
      parseInt(endInstancesMarker.getAttribute(NUM_INSTANCES) || '0');
  var instance = endInstancesMarker.previousSibling;
  for (var j = numInstances; j > 0; j--) {
    instance.style.display = j > numUsedInstances ? 'none' : '';
    instance = instance.previousSibling;
  }
};

/**
 * ReInstantiate the template with the current dictionary context data
 * creating new instances where required and reusing existing instances
 * where possible.
 * @param dictionaryContext - stack of dictionaries to be looked up for data
 * @param idSuffix - suffix to make id's unique within template instances
 */
Template.prototype.instantiateAndBindData =
    function(dictionaryContext, idSuffix) {
  // endInstancesMarker will always be present by construction
  var endInstancesMarker =
      getDocument().getElementById(END_INSTANCES_MARKER + this.id + idSuffix);
  var numInstances =
      parseInt(endInstancesMarker.getAttribute(NUM_INSTANCES) || '0');

  var dataBinding =
      lookupTemplateDataBinding(dictionaryContext, this.domElement);
  if (dataBinding instanceof Array) {
    var numUsedInstances = 0;
    var j;
    randomNumber = Math.floor(Math.random() * dataBinding.length);
    for (j = 0;
         j < dataBinding.length && j < numInstances;
         j++) {
      // Setup in the databinding if this is the first instance of the template
      // so that DATA_EXPAND_IF can use it.
      dataBinding[j][FIRST] = j == 0;
      dataBinding[j][RANDOM] = j == randomNumber;
      idSuffixWithCount = idSuffix + '.' + j;
      this.reInstantiateWithBinding(dictionaryContext,  idSuffixWithCount,
                                  dataBinding[j]);
    }
    numUsedInstances = j;
    if (numInstances < dataBinding.length) {
      var newInstances = this.instantiateDom(dictionaryContext, idSuffix, j);
      endInstancesMarker.parentNode.insertBefore(newInstances,
                                                 endInstancesMarker);
      numInstances = numUsedInstances = dataBinding.length;
      endInstancesMarker.setAttribute(NUM_INSTANCES, numInstances);
    }
    endInstancesMarker.setAttribute(NUM_USED_INSTANCES, numUsedInstances);

    this.showOnlyUsedInstances(endInstancesMarker);
  } else if (dataBinding instanceof Object /* map */) {
    if (numInstances == 0) { // create this instance
      var newInstances = this.instantiateDom(dictionaryContext, idSuffix);
      endInstancesMarker.parentNode.insertBefore(newInstances,
                                                 endInstancesMarker);
      endInstancesMarker.setAttribute(NUM_INSTANCES, '1');
    } else {
      this.reInstantiateWithBinding(dictionaryContext, idSuffix, dataBinding);
    }
    endInstancesMarker.setAttribute(NUM_USED_INSTANCES, '1');
    this.showOnlyUsedInstances(endInstancesMarker);
  } else {  // no data binding
    endInstancesMarker.setAttribute(NUM_USED_INSTANCES, 0);
    this.showOnlyUsedInstances(endInstancesMarker);
  }
};

/**
 * Create an HTML dom element with tagName and innerHTML as specified and
 * return the nodes corresponding to innerHTML in a document fragment
 * @param tagName
 * @param innerHTML
 * Precondition: innerHTML is consistent with tagName.
 * @returns {Element}
 */
function createInnerHtmlElements(tagName, innerHTML) {
  var element = getDocument().createElement(tagName);
  setInnerHtmlOrTextContent(element, innerHTML);
  // Transfer all instances over to a document fragment
  var docFragment = getDocument().createDocumentFragment();
  while (element.childNodes.length > 0) {
    docFragment.appendChild(element.childNodes[0]);
  }
  return docFragment;
}

/**
 * Create a DOM tree corresponding to instantiation of this template.
 * @param dictionaryContext - stack of dictionaries to be looked up for data
 * @param opt_beginInstance - instance count to begin binding from
 * @return document fragment containing instances of this template
 */
Template.prototype.instantiateDom =
    function(dictionaryContext, idSuffix, opt_beginInstance) {
  // Find parent's tag so that all created dom elements can be instantiated
  // e.g. <tr> cannot be child of <div> node.


  var parts = [];
  var beginInstance = opt_beginInstance || 0;
  this.instantiate(dictionaryContext, idSuffix, parts, beginInstance);

  return createInnerHtmlElements(this.parentTagName, parts.join(''));
};

// {Object.<String,{Template}>}
var ShadowTemplates = null;

/**
 * @param element {Element} element of HTML tree which is not a template
 * @param templates {Array.<Element>} array of template elements
 */
function findTemplates(element, templates) {
  if (!element.tagName) return;

  if (isTemplate(element)) {
    templates.push(element);
  }

  if (isTemplateInstance(element)) return;

  for (var i = 0; i < element.childNodes.length; i++) {
    findTemplates(element.childNodes[i], templates);
  }
}

function compileTemplates() {
  if (ShadowTemplates) return;

  ShadowTemplates = {};
  var templates = [];

  findTemplates(getDocument().documentElement, templates);
  // Because of nested templates, we do the following in two passes.

  // Initialize ShadowTemplates data structure.
  // Assign ID's to all templates without id's.
  // We will use the template id's in instances.
  for (var i = 0; i < templates.length; i++) {
    var template = templates[i];
    // Generate an ID, if necessary
    var templateId =
        template.id && !template.id.match(variableRegex) ? template.id
            : TEMPLATE_ID + '_' + i;
    template.setAttribute(TEMPLATE_ID, templateId);
    ShadowTemplates[templateId] = new Template(template);
  }

  // Root Template initialization
  var docElement = getDocument().documentElement;
  ShadowTemplates.ROOT = ShadowTemplates[docElement.getAttribute(TEMPLATE_ID)];

  // Parse the template contents and remove from the Document,
  //    leaving a place-holder
  ShadowTemplates.ROOT.parseRootTemplate();
};

/**
 * Prepare for template instantiation - compile the templates
 * and bind the critical data passed in.
 * @param jsonData {jsonData} - critical data to be bound.
 */
function TemplateManager(jsonData) {
  compileTemplates();
};

/**
 * Find all image elements and collect in a dictionary
 * ASSUMPTION: Critical images are indicated by having xbl2:src attribute
 * @param criticalImageIds {Array.<String>} Array of critical image id's
 * @return {Object.<String,Array.<Element>>} dictionary mapping from
 *          url --> [image] for each <image xbl2:src=url>
 */
function collectCriticalImages(criticalImageIds) {
  criticalImagesByUrl = {};

  if (!criticalImageIds) return criticalImagesByUrl;

  for (var i = 0; i < criticalImageIds.length; i++) {
    var image = getDocument().getElementById(criticalImageIds[i]);
    var url = image.getAttribute('xbl2:src');
    // The 'xbl2:src' attribute is no longer required, but we will keep it.
    if (url != null) {
      if (criticalImagesByUrl[url] == undefined) {
        criticalImagesByUrl[url] = [];
      }
      criticalImagesByUrl[url].push(image);
    }
  }
  return criticalImagesByUrl;
};

/**
 * Transfer xbl2:src to src for images.
 * @param pushedContentString {String} string corresponding to pushed content
 * @param criticalImages {Object.<string,Array.<Element>>} map from criticalUrl to image elements array.
 */
function inlinePushedImages(criticalImages) {
  for (var url in criticalImages) {
    if (criticalImages.hasOwnProperty(url)) {
      var imageArray = criticalImages[url];
      var src = url;
      for (var i = 0; i < imageArray.length; i++) {
        var image = imageArray[i];
        image.src = src;
      }
      console.log('Processed ' + url);
    }
  }
}

/**
 * @param jsonData - data from server which specifies template dataBindings
 * to be applied to the HTML body of the document
 */
TemplateManager.prototype.applyTemplate = function(jsonData) {
  var dictionaryContext = [];
  ShadowTemplates.criticalImageIds = [];
  this.jsonData = jsonData;
  ShadowTemplates.ROOT.reInstantiateWithBinding(dictionaryContext, '', jsonData);
  inlinePushedImages(collectCriticalImages(ShadowTemplates.criticalImageIds));
};

/**
 * Remove all the Instances that are bound so far, leaving the
 * endInstancesMarker as it is. This doesn't affect any changes to the Root
 * template Variables.
 */
function removeTemplateInstances() {
  if (!ShadowTemplates)
    return;
  var outerTemplates = ShadowTemplates.ROOT.childrenTemplates;
  for (var i = outerTemplates.length - 1; i >= 0; i--) {
    var endInstancesMarker = outerTemplates[i].domElement;
    var numInstances =
        parseInt(endInstancesMarker.getAttribute(NUM_INSTANCES) || 0);
    var instance = endInstancesMarker.previousSibling;
    for (var j = numInstances; j > 0; j--) {
      var previousSibling = instance.previousSibling;
      instance.parentNode.removeChild(instance);
      instance = previousSibling;
    }
    endInstancesMarker.setAttribute(NUM_INSTANCES, 0);
    endInstancesMarker.setAttribute(NUM_USED_INSTANCES, 0);
  }
}
