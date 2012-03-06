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
