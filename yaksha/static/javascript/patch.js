// Copyright 2012 Mazaa Learn. All Rights Reserved.

/**
 * @fileoverview Implements Patching based on diff.
 * A patchdata is an array of diff's (insert,update,delete).
 * This is applied to the document and an unpatchData to undo the effects
 * of the patch is generated.
 * @author sridhar.sundaram@gmail.com (Sridhar Sundaram)
 */

/**
 * Patch attribute of node with value and return the corresponding unpatch
 * @param patch {Array.<String, String, String>} patch to be applied
 * Precondition: This is an attribute patch
 * @return unpatch if successful else null
 */
function patchAttribute(patch) {
  var path = patch[0], op = patch[1], value = patch[2];
  var attributePos = path.lastIndexOf('@');
  var attribute = path.substr(attributePos + 1);
  path = path.substr(0, attributePos);

  var node = traverseXPath(getDocument().documentElement, path);

  if (!node || !attribute) return null; // Some kind of xpath or patch error

  switch(op) {
    case 'INSERT':
      var unpatch = [patch[0], 'DELETE', null];
      node.setAttribute(attribute, value);
      return unpatch;

    case 'UPDATE':
      var unpatch = [patch[0], 'UPDATE', node.getAttribute(attribute)];
      node.setAttribute(attribute, value);
      return unpatch;

    case 'DELETE':
      var unpatch = [patch[0], 'INSERT', node.getAttribute(attribute)];
      node.removeAttribute(attribute);
      return unpatch;

    default: throw 'Unknown op';
  }
};

/**
 * Patch node with html and return the corresponding unpatch
 * @param patch {Array.<String, String, String>} patch to be applied
 * Precondition: This is an element patch
 * @return unpatch if successful else null
 */
function patchNode(patch) {
  var insertChildNum;
  var path = patch[0], op = patch[1], html = patch[2];

  if (op == 'INSERT') {
    // Suppose xpath is x/y/z/i
    // We will traverse to x/y/z and insert at child position i.
    var lastPartPos = path.lastIndexOf('/');
    insertChildNum = parseInt(path.substr(lastPartPos + 1));
    path = path.substr(0, lastPartPos);
  }

  var node = traverseXPath(getDocument().documentElement, path);

  // If there is an xpath or patch error, return null
  if (!node) return null;

  switch(op) {
    case 'INSERT':
      var unpatch = [patch[0], 'DELETE', null];
      var child = getNthNonWhitespaceChild(node, insertChildNum);
      var element = createInnerHtmlElements(node.tagName, html);
      node.insertBefore(element, child);
      return unpatch;

    case 'DELETE':
      var unpatch = [patch[0], 'INSERT', outerHTML(node)];
      node.parentNode.removeChild(node);
      return unpatch;

    case 'UPDATE':
      var unpatch = [patch[0], 'UPDATE', node.innerHTML];
      setInnerHtmlOrTextContent(node, html);
      return unpatch;

    default: throw 'Unknown op';
  }
};
