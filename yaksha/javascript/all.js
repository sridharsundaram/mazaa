// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements the lookup functions for looking up the context
 * dictionaries.
 * An HTML element may have a data-bind-id/data-expand-if specified.
 * This id identifies a JSON data element to bind to which may be an array or
 * a dictionary.
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

/**
 * @param stack of dictionaries to be looked up for id
 * @param id key for lookup in dictionary
 * @return value for key looked up in stack of dictionaries in LIFO order
 *
 * This function needs to be in sync with LookupContext defined in
 * http://s1/?fileprint=//depot/google3/net/blink/publisher/json_data_processor.cc
 *
 * If you make any changes here, please change the corresponding code there.
 */
function lookupContext(dictionaryContext, id) {
  if (id == null) return undefined;

  // Check if the absolute id is present in top level dictionary. If not, we
  // will do a scoped match.
  if (id.indexOf('/') != -1 && dictionaryContext[0][id] != undefined)
    return dictionaryContext[0][id];

  // if id has a / in it, do a scoped match.
  if (id.indexOf('/') != -1) {
    var scopes = id.split('/');
    var dataBinding, i;
    if (scopes[0] == '') { // first char is /, do an absolute match
      dataBinding = dictionaryContext[0];
      i = 1;
    } else { // first char is not /, do a relative match
      dataBinding = dictionaryContext[dictionaryContext.length - 1];
      i = 0;
    }
    for (; i < scopes.length; i++) {
      if (dataBinding == undefined || dataBinding instanceof Array) {
        return undefined;
      }
      dataBinding = dataBinding[scopes[i]];
    }
    return dataBinding;
  }

  for (var i = dictionaryContext.length - 1; i >= 0; i--) {
    if (dictionaryContext[i][id] != undefined) {
      return dictionaryContext[i][id];
    }
  }
  return undefined;
};

/**
 * @param dictionaryContext stack of dictionaries to be looked up for dataBindId
 * @param name key for lookup in dictionary
 * @return string value for key looked up in stack of dictionaries in LIFO order
 */
function lookupScopedValue(dictionaryContext, name) {
  var value;
  if (name.charAt(0) == '!') { // Negative or NOT operator
    value = !lookupContext(dictionaryContext, name.substr(1));
  } else {
    value = lookupContext(dictionaryContext, name);
  }
  return value;
};

/**
 * @param dictionaryContext stack of dictionaries to be looked up
 * @param element {Element} xbl2 template element with data-bind-id
 *                          whose data-binding is to be looked up
 * @return binding value for key looked up in dictionaries in LIFO order
 *         must be map or array or NULL_DATA_BINDING else undefined is returned
 */
function lookupTemplateDataBinding(dictionaryContext, element) {
  var dataBindId = element.getAttribute(DATA_BIND_ID);

  if (dataBindId == null) { // maybe a data-expand-if
    var field = element.getAttribute(DATA_EXPAND_IF);
    if (field == null) return undefined;
    var value = lookupScopedValue(dictionaryContext, field);
    return value ? EMPTY_DICTIONARY : undefined;
  }

  var value = lookupContext(dictionaryContext, dataBindId);
  // Only an array, an object or empty string are allowed for data bindings
  if (value instanceof Object || value instanceof Array ||
          value == NULL_DATA_BINDING) {
    return value;
  }
  return undefined;
};

//Copyright 2012 Mazaa Learn. All Rights Reserved.

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

//Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements Template Ops - these are operators used for
 * templates and in particular for reusing DOM in templates. They make
 * reuse of DOM easy and provide a measure of complexity for a template page.
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

// {{ could be replaced by %7B%7B by browser
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


//Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements the Blink Client in javascript.
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

// //////////////////////////////////////////////////////////////////////////
// Flags.
// TODO(ssundaram): Push flags from server or find a better way to do this
// //////////////////////////////////////////////////////////////////////////
/**
 * @define {boolean} If true, debug messages are logged to console.
 */
var FLAGS_log_to_console = false;

var __console_log = null;
if (typeof(console) === 'undefined') {
  console = {};
}
if (console['log']) {
  __console_log = console.log;
}
console.log = function(str) {
  if (FLAGS_log_to_console && __console_log) {
    __console_log.call(console, str);
  }
};

// Reload AppCache.
var reloadAppCache = function() {
  var cache = window.applicationCache;
  if (cache) {
    cache.addEventListener('updateready', function(e) {
      if (cache.status == cache.UPDATEREADY) {
        // We are not reloading the page because this might cause data loss (in
        // case user is filling a form).
        cache.swapCache();
        console.log('Swapped to newer version of appcache');
      }
    }, false);
  }
};
reloadAppCache();

// //////////////////////////////////////////////////////////////////////////
// XHR related variables and methods
// //////////////////////////////////////////////////////////////////////////

/**
 * http://www.w3.org/TR/XMLHttpRequest/
 * The XMLHttpRequest object can be in several states as below:
 */

var XHR_UNSENT = 0;            // Object has been constructed
var XHR_OPENED = 1;            // Headers can be set, request can be sent
var XHR_HEADERS_RECEIVED = 2;  // HTTP headers of response received
var XHR_LOADING = 3;           // Response entity body received
var XHR_DONE = 4;              // Data transfer completed
var XHR_TIMEOUT = 5000;        // Timeout for the XHR request

function makeXMLHttpRequest() {
  try { return new XMLHttpRequest(); } catch (e) {}
  try { return new ActiveXObject('Msxml2.XMLHTTP'); } catch (e) {}
  alert('XMLHttpRequest not supported');
  return null;
}

function createXMLHttpRequest() {
  var request = makeXMLHttpRequest();
  if (request == null) return null;

  request.getReadyState = function() { return request.readyState; }
  request.getStatus = function() { return request.status; }
  request.getUrl = function() { return request.url; }
  request.setUrl = function(url) { request.url = url; }
  request.getResponseText = function() { return request.responseText; }
  request.url = '';
  request.onreadystatechange = refresh;

  return request;
}

var xhReq = createXMLHttpRequest();

// TODO(ssundaram): Add prs, cprc, prc events to CSI dashboard
var DATA_REFRESH_START = 'prs';
var WAITING_FOR_DATA = 'wfd';
var DATA_RECEIVED = 'cdr';
var DATA_LOADED = 'cdl';
var COMPLETED = 'c';
// State Transition Diagram
// DataRefreshStart --> WaitingForData --> DataReceived --> DataLoaded --> Completed
// The start state is this one where the XHR will be dispatched.
var pageLoadState = DATA_REFRESH_START;

// //////////////////////////////////////////////////////////////////////////
// Cookie handling methods
// //////////////////////////////////////////////////////////////////////////

function createCookie(name, value, days) {
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    var expires = '; expires=' + date.toGMTString();
  }
  else var expires = '';
  document.cookie = name + '=' + value + expires + '; ';
}

function readCookie(name) {
  var nameEQ = name + '=';
  var ca = document.cookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function eraseCookie(name) {
  createCookie(name, '', -1);
}


// //////////////////////////////////////////////////////////////////////////
// Page refresh and event handling methods
// //////////////////////////////////////////////////////////////////////////

function setWindowLocation(url, hashFragment) {
  window.location = url + '#' + hashFragment;
}

function changePageLoadState(newState) {
  pageLoadState = newState;
}

function requestRefresh(url) {
  if (xhReq.getUrl() == url) {
    console.log('refreshing');
    refresh();
    return;
  }
  xhReq.abort();
  // TODO(ssundaram): Handle URL better than as part of csiTimings here.
  xhReq.setUrl(url);
  changePageLoadState(DATA_REFRESH_START);
  changePageLoadState(WAITING_FOR_DATA);

  console.log('Sending GET request for ' + url);
  xhReq.open('GET', url, true);
  xhReq.send(null);
}

function refresh() {
  // Improper state
  if (xhReq.getReadyState() != XHR_DONE)
    return;

  // Improper status.
  if (xhReq.getStatus() != 200) return;

  changePageLoadState(DATA_RECEIVED);
  loadPageData(xhReq.getResponseText());
  changePageLoadState(DATA_LOADED);
}

// //////////////////////////////////////////////////////////////////////////
// Other methods
// //////////////////////////////////////////////////////////////////////////

function prepareQuestions(jsonData) {
  templateManager.jsonData['wordList'] = createQuestions(jsonData['words'], 1, 
                                         NUM_ANSWER_CHOICES);
}

function getChoice(i) {
  if (templateManager.jsonData) {
    return templateManager.jsonData['wordList'][0].choices[i].choice;
  }
  return '' + i;
}

function fetchAndBindData(relativeUrl, loadDataCallback) {
  getNestedTemplates();
  if (typeof loadDataCallback == "string") {
    xhReq.loadDataCallback = eval(loadDataCallback);
  } else {
    xhReq.loadDataCallback = loadDataCallback;
  }
  requestRefresh(window.location.protocol + '//' + window.location.host + 
                 relativeUrl);
}

// //////////////////////////////////////////////////////////////////////////
// Template related methods
// //////////////////////////////////////////////////////////////////////////

var templateManager = new TemplateManager();

/**
 * Instantiate the templates in the HTML page.
 * @param jsonDataStr {String} - json string containing template data
 * @param incremental {boolean} - whether instantiation is incremental
 * @return dictionary of pushed image elements from the template
 */
function loadPageData(jsonDataStr) {
  if (jsonDataStr == '') {
    return;
  }
  templateManager.jsonData = (typeof JSON != 'undefined' && JSON.parse)
      ? JSON.parse(jsonDataStr) : eval('(' + jsonDataStr + ')');
  xhReq.loadDataCallback(templateManager.jsonData);
}

function createClosure(fn, xhReq, arg) {
  return function() { fn(xhReq, arg); };
}

// TODO(ssundaram): Should move to template.js
function includeNestedTemplate(xhReq, include) {
  if (xhReq.readyState != 4) { return; }
  if (xhReq.status != 200) { return; }
  var div = document.createElement('div');
  div.innerHTML = xhReq.getResponseText();
  include.parentNode.insertBefore(div, include);
  include.parentNode.removeChild(include);
}

function getNestedTemplates() {
  var includes = document.getElementsByTagName('include');
  for (var i = 0; i < includes.length; i++) {
    var url = includes[i].getAttribute('src');
    var xhReq = createXMLHttpRequest();
    xhReq.open('GET', url, true);
    xhReq.onreadystatechange =
        createClosure(includeNestedTemplate, xhReq, includes[i]);
    xhReq.send(null);
    console.log('Sent xhr for ' + url);
  }
}

//Copyright 2011 Google Inc. All Rights Reserved.

/**
 * @fileoverview Utility functions.
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

var ORIGINAL_SCRIPT_NODE = '_original_script_node';

/**
 * @param {Node} node The node to test.
 * @return {Boolean} True iff node is a whitespace node.
 */
function isWhitespaceNode(node) {
 return node.nodeType == node.TEXT_NODE && !node.nodeValue.trim();
}

/**
 * Returns next significant non-whitespace sibling including node itself
 * @param node
 */
function nextNonWhitespaceSibling(node) {
  while (node && isWhitespaceNode(node)) {
    node = node.nextSibling;
  }
  return node;
}

/**
 * Return outerHTML for a node.
 */
function outerHTML(node) {
  if (!node) return null;
  var outerHTML = node.outerHTML;
  if (outerHTML) return outerHTML;
  var e = getDocument().createElement(node.parentNode.tagName);
  e.appendChild(node.cloneNode(true));
  return e.innerHTML;
}

/**
 * Return the nth child of node ignoring all whitespace nodes.
 * If such a child does not exist, return null.
 * @param node {Node}
 * @param n {Number}
 */
function getNthNonWhitespaceChild(node, n) {
  var child = null;
  for (child = nextNonWhitespaceSibling(node.firstChild);
       child && n;
       child = nextNonWhitespaceSibling(child.nextSibling), n--);
  return child;
}

/**
 * Surrounds the given string with / at beginning and end if its not
 * already present.
 * @param {String} str The string to surround with /.
 * @return {String} The string surrounded with /.
 */
function surroundWithSlash(str, marker) {
  if (str.indexOf('/') != 0)
    str = '/' + str;
  if (str.lastIndexOf('/') != (str.length - 1))
    str = str + '/';
  return str;
}

/**
 * Computes the abbreviated xpath of this node from the root node.
 * @param {Node} node The node.
 * @param {Node} startNode The root node to compute path relative to.
 * @return {String} The abbreviated xpath of the node.
 */
function computeXPath(startNode, node) {
  var path = '';
  for (var parentNode = node.parentNode; node != startNode && parentNode;
       node = node.parentNode, parentNode = node.parentNode) {
    var childNumber = 0;
    for (var n = parentNode.firstChild; n && n != node; n = n.nextSibling) {
      if (!isWhitespaceNode(n)) childNumber++;
    }
    CHECK(n == node);
    path = path ? childNumber + '/' + path : childNumber + '';
  }
  return path;
}

/**
 * Traverse the abbreviated xpath from node and
 * return the element targeted by it.
 * @param node - xpath traversal starts here.
 * @param xpath - abbreviated xpath with numbers indicating child number
 * PRECONDITION: xpath from node MUST exist.
 *               xpath must be valid, start with / and not end with /
 *               e.g. /1/2/1@width
 * @returns {Element} corresponding to xpath from node.
 */
function traverseXPath(startNode, xpath) {
  if (xpath[0] == '/') {
    startNode = startNode.ownerDocument.documentElement;
    xpath = xpath.substring(1);
  }
  var childNumbers = xpath.split('/');
  var node = startNode;
  for (var i = 0; i < childNumbers.length && node; i++) {
    // Abbreviated xpath uses convention of not counting whitespace text nodes
    // to enable cross-browser functioning.
    var childNum = parseInt(childNumbers[i]);
    node = getNthNonWhitespaceChild(node, childNum);
  }
  if (!node) {
    console.log('Could not find xpath node: ' + xpath + ': ' + i);
  }
  return node;
}
/**
 * Append provided item str to array if last element in array is not a string
 * else if last element is a string, concatenate to that element.
 * @param array {Array} - array of strings and operators
 * @param str {String}
 */
function appendStringToArray(array, str) {
  if (typeof array[array.length - 1] == 'string') {
    array[array.length - 1] = array[array.length - 1] + str;
  } else {
    array.push(str);
  }
};

/**
 * Return true iff element corresponds to a template instances end marker.
 * @param element {Element} element is not null and has a tag.
 */
function isEndInstancesMarker(element) {
  return element.getAttribute &&
             (element.getAttribute(NUM_INSTANCES) != null ||
             element.getAttribute(NUM_USED_INSTANCES) != null);
};

function createEndInstancesMarker(templateDomElement, nextNode) {
  var id = END_INSTANCES_MARKER + templateDomElement.getAttribute(TEMPLATE_ID);
  if (document.getElementById(id)) return;

  var endInstancesMarker =
        getDocument().createElement(templateDomElement.tagName);
  endInstancesMarker.id = id;
  endInstancesMarker.style.display = 'none';
  endInstancesMarker.setAttribute(NUM_INSTANCES, '0');
  endInstancesMarker.setAttribute(NUM_USED_INSTANCES, '0');

  templateDomElement.parentNode.insertBefore(endInstancesMarker, nextNode);
}

function setInnerHtmlOrTextContent(element, text) {
  try {
    if (element.nodeType == element.TEXT_NODE ||
        element.tagName == 'TITLE') {
      element.textContent = text;
    } else {
      element.innerHTML = text;
    }
  } catch (e) {
    console.log('Exception in ' + element.tagName);
    console.log(e);
    throw e;
  }
}

//Copyright Mazaa Learn 2012
//@author Sridhar Sundaram

/**
* Swap ith and jth elements of array
*/
function swapArrayItems(array, i, j) {
var t = array[i];
array[i] = array[j];
array[j] = t;  
}

/**
* Shuffles elements of array
* @param array
*/
function shuffle(array) {
for (var i = 0; i < array.length - 1; i++) {
 var rnd = i + Math.floor(Math.random() * (array.length - i));
 swapArrayItems(array, i, rnd);
}
}

/**
* Randomly chooses numChoices indices given range low..high to choose from
* Precondition: high - low + 1 > numChoices 
* @param {Integer} low - low end of range inclusive
* @param {Integer} high - high end of range inclusive
* @param {Integer} numChoices - number of choices required
* @param {Integer} ansIndex - index of answer
* @return array of choice indices (no duplicates)
*/
function createChoices(low, high, numChoices, ansIndex) {
var choiceIndices = [ansIndex];
while (choiceIndices.length < numChoices) {
 var rnd = low + Math.floor(Math.random() * (high - low + 1));
 if (choiceIndices.indexOf(rnd) == -1) { 
   // TODO(ssundaram): this is inefficient - can be done better. 
   choiceIndices.push(rnd);
 }
}
return choiceIndices;
}

function QuestionAnswer() {
}

/**
* Randomly creates numQuestions multiple-choice questions.
* Given an array of [question, answer] pairs, outputs questions each with 
* question, numChoices choices and answer.
* @param {Array.<Array.<question, answer>>} qaArray - array of qa pairs
* @param {Integer} numQuestions - number of questions to be generated
* @param {Integer} numAnswerChoices - number of answer choices per question
* @return {Array.<Object.<question, answer, Array.<choices>>} list of qa  
*/
QuestionAnswer.prototype.create = function(id, question, answer, opt_choices) {
return { id: id, question: question, answer: answer, choices: opt_choices};
}

QuestionAnswer.prototype.compare = function(that) {
return this.question == that.question &&
      this.answer == that.answer &&
      Array.equals(this.choices, that.choices);
}

var QA = new QuestionAnswer();

function createQuestions(qaArray, numQuestions, numAnswerChoices) {
var qaList = [];
for (var i = 0; i < numQuestions; i++) {
 // Choose the question-answer pair
 var qaIndex = i + Math.floor(Math.random() * (qaArray.length - i));
 // Generate choices - for now, we choose randomly
 var ansChoices = createChoices(0, qaArray.length - 1, numAnswerChoices,
                                qaIndex);
 // Set up the choices
 var choices = [];
 for (var j = 0; j < numAnswerChoices; j++) {
   var choice = qaArray[ansChoices[j]].answer;
   choices.push({ choice: choice, 
                  correct: choice == qaArray[qaIndex].answer });
 }
 shuffle(choices);
 qaArray[qaIndex].choices = choices; 
 qaList.push(qaArray[qaIndex]);
 // Ensure this question-answer pair will not be used for another question.
 swapArrayItems(qaArray, i, qaIndex);
}

return qaList;
}
//Copyright Mazaa Learn 2012
//@author Sridhar Sundaram

var NUM_ANSWER_CHOICES = 4;

Mazaa = function() {
};

// android interface is defined internally for Android webview.
if (typeof android == "undefined") {
  Mazaa.prototype.isBrowser = true;
  /**
   * Plays the audio corresponding to url.
   * 
   * @param url -
   *          url of the audio
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
  Mazaa.prototype.playAudio = function(url) {
    android.playAudio(url);
  }
}

function makeAbsoluteUrl(relativeUrl) {
  return location.protocol + '//' + location.host + "/" + relativeUrl;
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
