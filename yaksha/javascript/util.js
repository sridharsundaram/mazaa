// Copyright 2011 Google Inc. All Rights Reserved.

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
