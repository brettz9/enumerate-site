var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/*
Possible todos:
0. Add XSLT to JML-string stylesheet (or even vice versa)
0. IE problem: Add JsonML code to handle name attribute (during element creation)
0. Element-specific: IE object-param handling

Todos inspired by JsonML: https://github.com/mckamey/jsonml/blob/master/jsonml-html.js

0. duplicate attributes?
0. expand ATTR_MAP
0. equivalent of markup, to allow strings to be embedded within an object (e.g., {$value: '<div>id</div>'}); advantage over innerHTML in that it wouldn't need to work as the entire contents (nor destroy any existing content or handlers)
0. More validation?
0. JsonML DOM Level 0 listener
0. Whitespace trimming?

JsonML element-specific:
0. table appending
0. canHaveChildren necessary? (attempts to append to script and img)

Other Todos:
0. Note to self: Integrate research from other jml notes
0. Allow Jamilih to be seeded with an existing element, so as to be able to add/modify attributes and children
0. Allow array as single first argument
0. Settle on whether need to use null as last argument to return array (or fragment) or other way to allow appending? Options object at end instead to indicate whether returning array, fragment, first element, etc.?
0. Allow building of generic XML (pass configuration object)
0. Allow building content internally as a string (though allowing DOM methods, etc.?)
0. Support JsonML empty string element name to represent fragments?
0. Redo browser testing of jml (including ensuring IE7 can work even if test framework can't work)
*/

var win = typeof window !== 'undefined' && window;
var doc = typeof document !== 'undefined' && document;
var XmlSerializer = typeof XMLSerializer !== 'undefined' && XMLSerializer;

// STATIC PROPERTIES

var possibleOptions = ['$plugins', '$map' // Add any other options here
];

var NS_HTML = 'http://www.w3.org/1999/xhtml',
    hyphenForCamelCase = /-([a-z])/g;

var ATTR_MAP = {
    'readonly': 'readOnly'
};

// We define separately from ATTR_DOM for clarity (and parity with JsonML) but no current need
// We don't set attribute esp. for boolean atts as we want to allow setting of `undefined`
//   (e.g., from an empty variable) on templates to have no effect
var BOOL_ATTS = ['checked', 'defaultChecked', 'defaultSelected', 'disabled', 'indeterminate', 'open', // Dialog elements
'readOnly', 'selected'];
var ATTR_DOM = BOOL_ATTS.concat([// From JsonML
'accessKey', // HTMLElement
'async', 'autocapitalize', // HTMLElement
'autofocus', 'contentEditable', // HTMLElement through ElementContentEditable
'defaultValue', 'defer', 'draggable', // HTMLElement
'formnovalidate', 'hidden', // HTMLElement
'innerText', // HTMLElement
'inputMode', // HTMLElement through ElementContentEditable
'ismap', 'multiple', 'novalidate', 'pattern', 'required', 'spellcheck', // HTMLElement
'translate', // HTMLElement
'value', 'willvalidate']);
// Todo: Add more to this as useful for templating
//   to avoid setting through nullish value
var NULLABLES = ['dir', // HTMLElement
'lang', // HTMLElement
'max', 'min', 'title' // HTMLElement
];

var $ = function $(sel) {
    return doc.querySelector(sel);
};
var $$ = function $$(sel) {
    return [].concat(toConsumableArray(doc.querySelectorAll(sel)));
};

/**
* Retrieve the (lower-cased) HTML name of a node
* @static
* @param {Node} node The HTML node
* @returns {String} The lower-cased node name
*/
function _getHTMLNodeName(node) {
    return node.nodeName && node.nodeName.toLowerCase();
}

/**
* Apply styles if this is a style tag
* @static
* @param {Node} node The element to check whether it is a style tag
*/
function _applyAnyStylesheet(node) {
    if (!doc.createStyleSheet) {
        return;
    }
    if (_getHTMLNodeName(node) === 'style') {
        // IE
        var ss = doc.createStyleSheet(); // Create a stylesheet to actually do something useful
        ss.cssText = node.cssText;
        // We continue to add the style tag, however
    }
}

/**
 * Need this function for IE since options weren't otherwise getting added
 * @private
 * @static
 * @param {DOMElement} parent The parent to which to append the element
 * @param {DOMNode} child The element or other node to append to the parent
 */
function _appendNode(parent, child) {
    var parentName = _getHTMLNodeName(parent);
    var childName = _getHTMLNodeName(child);

    if (doc.createStyleSheet) {
        if (parentName === 'script') {
            parent.text = child.nodeValue;
            return;
        }
        if (parentName === 'style') {
            parent.cssText = child.nodeValue; // This will not apply it--just make it available within the DOM cotents
            return;
        }
    }
    if (parentName === 'template') {
        parent.content.appendChild(child);
        return;
    }
    try {
        parent.appendChild(child); // IE9 is now ok with this
    } catch (e) {
        if (parentName === 'select' && childName === 'option') {
            try {
                // Since this is now DOM Level 4 standard behavior (and what IE7+ can handle), we try it first
                parent.add(child);
            } catch (err) {
                // DOM Level 2 did require a second argument, so we try it too just in case the user is using an older version of Firefox, etc.
                parent.add(child, null); // IE7 has a problem with this, but IE8+ is ok
            }
            return;
        }
        throw e;
    }
}

/**
 * Attach event in a cross-browser fashion
 * @static
 * @param {DOMElement} el DOM element to which to attach the event
 * @param {String} type The DOM event (without 'on') to attach to the element
 * @param {Function} handler The event handler to attach to the element
 * @param {Boolean} [capturing] Whether or not the event should be
 *                                                              capturing (W3C-browsers only); default is false; NOT IN USE
 */
function _addEvent(el, type, handler, capturing) {
    el.addEventListener(type, handler, !!capturing);
}

/**
* Creates a text node of the result of resolving an entity or character reference
* @param {'entity'|'decimal'|'hexadecimal'} type Type of reference
* @param {String} prefix Text to prefix immediately after the "&"
* @param {String} arg The body of the reference
* @returns {Text} The text node of the resolved reference
*/
function _createSafeReference(type, prefix, arg) {
    // For security reasons related to innerHTML, we ensure this string only contains potential entity characters
    if (!arg.match(/^\w+$/)) {
        throw new TypeError('Bad ' + type);
    }
    var elContainer = doc.createElement('div');
    // Todo: No workaround for XML?
    elContainer.textContent = '&' + prefix + arg + ';';
    return doc.createTextNode(elContainer.textContent);
}

/**
* @param {String} n0 Whole expression match (including "-")
* @param {String} n1 Lower-case letter match
* @returns {String} Uppercased letter
*/
function _upperCase(n0, n1) {
    return n1.toUpperCase();
}

/**
* @private
* @static
*/
function _getType(item) {
    if (typeof item === 'string') {
        return 'string';
    }
    if ((typeof item === 'undefined' ? 'undefined' : _typeof(item)) === 'object') {
        if (item === null) {
            return 'null';
        }
        if (Array.isArray(item)) {
            return 'array';
        }
        if ('nodeType' in item) {
            if (item.nodeType === 1) {
                return 'element';
            }
            if (item.nodeType === 11) {
                return 'fragment';
            }
        }
        return 'object';
    }
    return undefined;
}

/**
* @private
* @static
*/
function _fragReducer(frag, node) {
    frag.appendChild(node);
    return frag;
}

/**
* @private
* @static
*/
function _replaceDefiner(xmlnsObj) {
    return function (n0) {
        var retStr = xmlnsObj[''] ? ' xmlns="' + xmlnsObj[''] + '"' : n0 || ''; // Preserve XHTML
        for (var ns in xmlnsObj) {
            if (xmlnsObj.hasOwnProperty(ns)) {
                if (ns !== '') {
                    retStr += ' xmlns:' + ns + '="' + xmlnsObj[ns] + '"';
                }
            }
        }
        return retStr;
    };
}

function _optsOrUndefinedJML() {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
    }

    return jml.apply(undefined, toConsumableArray(args[0] === undefined ? args.slice(1) : args));
}

/**
* @private
* @static
*/
function _jmlSingleArg(arg) {
    return jml(arg);
}

/**
* @private
* @static
*/
function _copyOrderedAtts(attArr) {
    var obj = {};
    // Todo: Fix if allow prefixed attributes
    obj[attArr[0]] = attArr[1]; // array of ordered attribute-value arrays
    return obj;
}

/**
* @private
* @static
*/
function _childrenToJML(node) {
    return function (childNodeJML, i) {
        var cn = node.childNodes[i];
        var j = Array.isArray(childNodeJML) ? jml.apply(undefined, toConsumableArray(childNodeJML)) : jml(childNodeJML);
        cn.parentNode.replaceChild(j, cn);
    };
}

/**
* @private
* @static
*/
function _appendJML(node) {
    return function (childJML) {
        node.appendChild(jml.apply(undefined, toConsumableArray(childJML)));
    };
}

/**
* @private
* @static
*/
function _appendJMLOrText(node) {
    return function (childJML) {
        if (typeof childJML === 'string') {
            node.appendChild(doc.createTextNode(childJML));
        } else {
            node.appendChild(jml.apply(undefined, toConsumableArray(childJML)));
        }
    };
}

/**
* @private
* @static
function _DOMfromJMLOrString (childNodeJML) {
    if (typeof childNodeJML === 'string') {
        return doc.createTextNode(childNodeJML);
    }
    return jml(...childNodeJML);
}
*/

/**
 * Creates an XHTML or HTML element (XHTML is preferred, but only in browsers that support);
 * Any element after element can be omitted, and any subsequent type or types added afterwards
 * @requires polyfill: Array.isArray
 * @requires polyfill: Array.prototype.reduce For returning a document fragment
 * @requires polyfill: Element.prototype.dataset For dataset functionality (Will not work in IE <= 7)
 * @param {String} el The element to create (by lower-case name)
 * @param {Object} [atts] Attributes to add with the key as the attribute name and value as the
 *                                               attribute value; important for IE where the input element's type cannot
 *                                               be added later after already added to the page
 * @param {DOMElement[]} [children] The optional children of this element (but raw DOM elements
 *                                                                      required to be specified within arrays since
 *                                                                      could not otherwise be distinguished from siblings being added)
 * @param {DOMElement} [parent] The optional parent to which to attach the element (always the last
 *                                                                  unless followed by null, in which case it is the second-to-last)
 * @param {null} [returning] Can use null to indicate an array of elements should be returned
 * @returns {DOMElement} The newly created (and possibly already appended) element or array of elements
 */
var jml = function jml() {
    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
    }

    var elem = doc.createDocumentFragment();
    function _checkAtts(atts) {
        var att = void 0;
        for (att in atts) {
            if (!atts.hasOwnProperty(att)) {
                continue;
            }
            var attVal = atts[att];
            att = att in ATTR_MAP ? ATTR_MAP[att] : att;
            if (NULLABLES.includes(att)) {
                if (attVal != null) {
                    elem[att] = attVal;
                }
                continue;
            } else if (ATTR_DOM.includes(att)) {
                elem[att] = attVal;
                continue;
            }
            switch (att) {
                /*
                Todos:
                0. JSON mode to prevent event addition
                 0. {$xmlDocument: []} // doc.implementation.createDocument
                 0. Accept array for any attribute with first item as prefix and second as value?
                0. {$: ['xhtml', 'div']} for prefixed elements
                    case '$': // Element with prefix?
                        nodes[nodes.length] = elem = doc.createElementNS(attVal[0], attVal[1]);
                        break;
                */
                case '#':
                    {
                        // Document fragment
                        nodes[nodes.length] = _optsOrUndefinedJML(opts, attVal);
                        break;
                    }case '$shadow':
                    {
                        var open = attVal.open,
                            closed = attVal.closed;
                        var content = attVal.content,
                            template = attVal.template;

                        var shadowRoot = elem.attachShadow({
                            mode: closed || open === false ? 'closed' : 'open'
                        });
                        if (template) {
                            if (Array.isArray(template)) {
                                if (_getType(template[0]) === 'object') {
                                    // Has attributes
                                    template = jml.apply(undefined, ['template'].concat(toConsumableArray(template), [doc.body]));
                                } else {
                                    // Array is for the children
                                    template = jml('template', template, doc.body);
                                }
                            } else if (typeof template === 'string') {
                                template = $(template);
                            }
                            jml(template.content.cloneNode(true), shadowRoot);
                        } else {
                            if (!content) {
                                content = open || closed;
                            }
                            if (content && typeof content !== 'boolean') {
                                if (Array.isArray(content)) {
                                    jml({ '#': content }, shadowRoot);
                                } else {
                                    jml(content, shadowRoot);
                                }
                            }
                        }
                        break;
                    }case 'is':
                    {
                        // Not yet supported in browsers
                        // Handled during element creation
                        break;
                    }case '$custom':
                    {
                        Object.assign(elem, attVal);
                        break;
                    }case '$define':
                    {
                        var _ret = function () {
                            var localName = elem.localName.toLowerCase();
                            // Note: customized built-ins sadly not working yet
                            var customizedBuiltIn = !localName.includes('-');

                            var def = customizedBuiltIn ? elem.getAttribute('is') : localName;
                            if (customElements.get(def)) {
                                return 'break';
                            }
                            var getConstructor = function getConstructor(cb) {
                                var baseClass = options && options.extends ? doc.createElement(options.extends).constructor : customizedBuiltIn ? doc.createElement(localName).constructor : HTMLElement;
                                return cb ? function (_baseClass) {
                                    inherits(_class, _baseClass);

                                    function _class() {
                                        classCallCheck(this, _class);

                                        var _this = possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this));

                                        cb.call(_this);
                                        return _this;
                                    }

                                    return _class;
                                }(baseClass) : function (_baseClass2) {
                                    inherits(_class2, _baseClass2);

                                    function _class2() {
                                        classCallCheck(this, _class2);
                                        return possibleConstructorReturn(this, (_class2.__proto__ || Object.getPrototypeOf(_class2)).apply(this, arguments));
                                    }

                                    return _class2;
                                }(baseClass);
                            };

                            var constructor = void 0,
                                options = void 0,
                                prototype = void 0;
                            if (Array.isArray(attVal)) {
                                if (attVal.length <= 2) {
                                    var _attVal = slicedToArray(attVal, 2);

                                    constructor = _attVal[0];
                                    options = _attVal[1];

                                    if (typeof options === 'string') {
                                        options = { extends: options };
                                    } else if (!options.hasOwnProperty('extends')) {
                                        prototype = options;
                                    }
                                    if ((typeof constructor === 'undefined' ? 'undefined' : _typeof(constructor)) === 'object') {
                                        prototype = constructor;
                                        constructor = getConstructor();
                                    }
                                } else {
                                    var _attVal2 = slicedToArray(attVal, 3);

                                    constructor = _attVal2[0];
                                    prototype = _attVal2[1];
                                    options = _attVal2[2];

                                    if (typeof options === 'string') {
                                        options = { extends: options };
                                    }
                                }
                            } else if (typeof attVal === 'function') {
                                constructor = attVal;
                            } else {
                                prototype = attVal;
                                constructor = getConstructor();
                            }
                            if (!constructor.toString().startsWith('class')) {
                                constructor = getConstructor(constructor);
                            }
                            if (!options && customizedBuiltIn) {
                                options = { extends: localName };
                            }
                            if (prototype) {
                                Object.assign(constructor.prototype, prototype);
                            }
                            customElements.define(def, constructor, customizedBuiltIn ? options : undefined);
                            return 'break';
                        }();

                        if (_ret === 'break') break;
                    }case '$symbol':
                    {
                        var _attVal3 = slicedToArray(attVal, 2),
                            symbol = _attVal3[0],
                            func = _attVal3[1];

                        if (typeof func === 'function') {
                            var funcBound = func.bind(elem);
                            if (typeof symbol === 'string') {
                                elem[Symbol.for(symbol)] = funcBound;
                            } else {
                                elem[symbol] = funcBound;
                            }
                        } else {
                            var obj = func;
                            obj.elem = elem;
                            if (typeof symbol === 'string') {
                                elem[Symbol.for(symbol)] = obj;
                            } else {
                                elem[symbol] = obj;
                            }
                        }
                        break;
                    }case '$data':
                    {
                        setMap(attVal);
                        break;
                    }case '$attribute':
                    {
                        // Attribute node
                        var node = attVal.length === 3 ? doc.createAttributeNS(attVal[0], attVal[1]) : doc.createAttribute(attVal[0]);
                        node.value = attVal[attVal.length - 1];
                        nodes[nodes.length] = node;
                        break;
                    }case '$text':
                    {
                        // Todo: Also allow as jml(['a text node']) (or should that become a fragment)?
                        var _node = doc.createTextNode(attVal);
                        nodes[nodes.length] = _node;
                        break;
                    }case '$document':
                    {
                        // Todo: Conditionally create XML document
                        var _node2 = doc.implementation.createHTMLDocument();
                        if (attVal.childNodes) {
                            attVal.childNodes.forEach(_childrenToJML(_node2));
                            // Remove any extra nodes created by createHTMLDocument().
                            var j = attVal.childNodes.length;
                            while (_node2.childNodes[j]) {
                                var cn = _node2.childNodes[j];
                                cn.parentNode.removeChild(cn);
                                j++;
                            }
                        } else {
                            if (attVal.$DOCTYPE) {
                                var dt = { $DOCTYPE: attVal.$DOCTYPE };
                                var doctype = jml(dt);
                                _node2.firstChild.replaceWith(doctype);
                            }
                            var html = _node2.childNodes[1];
                            var head = html.childNodes[0];
                            var _body = html.childNodes[1];
                            if (attVal.title || attVal.head) {
                                var meta = doc.createElement('meta');
                                meta.setAttribute('charset', 'utf-8');
                                head.appendChild(meta);
                            }
                            if (attVal.title) {
                                _node2.title = attVal.title; // Appends after meta
                            }
                            if (attVal.head) {
                                attVal.head.forEach(_appendJML(head));
                            }
                            if (attVal.body) {
                                attVal.body.forEach(_appendJMLOrText(_body));
                            }
                        }
                        nodes[nodes.length] = _node2;
                        break;
                    }case '$DOCTYPE':
                    {
                        /*
                        // Todo:
                        if (attVal.internalSubset) {
                            node = {};
                        }
                        else
                        */
                        var _node3 = void 0;
                        if (attVal.entities || attVal.notations) {
                            _node3 = {
                                name: attVal.name,
                                nodeName: attVal.name,
                                nodeValue: null,
                                nodeType: 10,
                                entities: attVal.entities.map(_jmlSingleArg),
                                notations: attVal.notations.map(_jmlSingleArg),
                                publicId: attVal.publicId,
                                systemId: attVal.systemId
                                // internalSubset: // Todo
                            };
                        } else {
                            _node3 = doc.implementation.createDocumentType(attVal.name, attVal.publicId || '', attVal.systemId || '');
                        }
                        nodes[nodes.length] = _node3;
                        break;
                    }case '$ENTITY':
                    {
                        /*
                        // Todo: Should we auto-copy another node's properties/methods (like DocumentType) excluding or changing its non-entity node values?
                        const node = {
                            nodeName: attVal.name,
                            nodeValue: null,
                            publicId: attVal.publicId,
                            systemId: attVal.systemId,
                            notationName: attVal.notationName,
                            nodeType: 6,
                            childNodes: attVal.childNodes.map(_DOMfromJMLOrString)
                        };
                        */
                        break;
                    }case '$NOTATION':
                    {
                        // Todo: We could add further properties/methods, but unlikely to be used as is.
                        var _node4 = { nodeName: attVal[0], publicID: attVal[1], systemID: attVal[2], nodeValue: null, nodeType: 12 };
                        nodes[nodes.length] = _node4;
                        break;
                    }case '$on':
                    {
                        // Events
                        for (var p2 in attVal) {
                            if (attVal.hasOwnProperty(p2)) {
                                var val = attVal[p2];
                                if (typeof val === 'function') {
                                    val = [val, false];
                                }
                                if (typeof val[0] === 'function') {
                                    _addEvent(elem, p2, val[0], val[1]); // element, event name, handler, capturing
                                }
                            }
                        }
                        break;
                    }case 'className':case 'class':
                    if (attVal != null) {
                        elem.className = attVal;
                    }
                    break;
                case 'dataset':
                    {
                        var _ret2 = function () {
                            // Map can be keyed with hyphenated or camel-cased properties
                            var recurse = function recurse(attVal, startProp) {
                                var prop = '';
                                var pastInitialProp = startProp !== '';
                                Object.keys(attVal).forEach(function (key) {
                                    var value = attVal[key];
                                    if (pastInitialProp) {
                                        prop = startProp + key.replace(hyphenForCamelCase, _upperCase).replace(/^([a-z])/, _upperCase);
                                    } else {
                                        prop = startProp + key.replace(hyphenForCamelCase, _upperCase);
                                    }
                                    if (value === null || (typeof value === 'undefined' ? 'undefined' : _typeof(value)) !== 'object') {
                                        if (value != null) {
                                            elem.dataset[prop] = value;
                                        }
                                        prop = startProp;
                                        return;
                                    }
                                    recurse(value, prop);
                                });
                            };
                            recurse(attVal, '');
                            return 'break';
                            // Todo: Disable this by default unless configuration explicitly allows (for security)
                        }();

                        break;
                    }

                case 'htmlFor':case 'for':
                    if (elStr === 'label') {
                        if (attVal != null) {
                            elem.htmlFor = attVal;
                        }
                        break;
                    }
                    elem.setAttribute(att, attVal);
                    break;
                case 'xmlns':
                    // Already handled
                    break;
                default:
                    if (att.match(/^on/)) {
                        elem[att] = attVal;
                        // _addEvent(elem, att.slice(2), attVal, false); // This worked, but perhaps the user wishes only one event
                        break;
                    }
                    if (att === 'style') {
                        if (attVal == null) {
                            break;
                        }
                        if ((typeof attVal === 'undefined' ? 'undefined' : _typeof(attVal)) === 'object') {
                            for (var _p in attVal) {
                                if (attVal.hasOwnProperty(_p) && attVal[_p] != null) {
                                    // Todo: Handle aggregate properties like "border"
                                    if (_p === 'float') {
                                        elem.style.cssFloat = attVal[_p];
                                        elem.style.styleFloat = attVal[_p]; // Harmless though we could make conditional on older IE instead
                                    } else {
                                        elem.style[_p.replace(hyphenForCamelCase, _upperCase)] = attVal[_p];
                                    }
                                }
                            }
                            break;
                        }
                        // setAttribute unfortunately erases any existing styles
                        elem.setAttribute(att, attVal);
                        /*
                        // The following reorders which is troublesome for serialization, e.g., as used in our testing
                        if (elem.style.cssText !== undefined) {
                            elem.style.cssText += attVal;
                        } else { // Opera
                            elem.style += attVal;
                        }
                        */
                        break;
                    }
                    var matchingPlugin = opts && opts.$plugins && opts.$plugins.find(function (p) {
                        return p.name === att;
                    });
                    if (matchingPlugin) {
                        matchingPlugin.set({ element: elem, attribute: { name: att, value: attVal } });
                        break;
                    }
                    elem.setAttribute(att, attVal);
                    break;
            }
        }
    }
    var nodes = [];
    var elStr = void 0;
    var opts = void 0;
    var isRoot = false;
    if (_getType(args[0]) === 'object' && Object.keys(args[0]).some(function (key) {
        return possibleOptions.includes(key);
    })) {
        opts = args[0];
        if (opts.state !== 'child') {
            isRoot = true;
            opts.state = 'child';
        }
        if (opts.$map && !opts.$map.root && opts.$map.root !== false) {
            opts.$map = { root: opts.$map };
        }
        if ('$plugins' in opts) {
            if (!Array.isArray(opts.$plugins)) {
                throw new Error('$plugins must be an array');
            }
            opts.$plugins.forEach(function (pluginObj) {
                if (!pluginObj) {
                    throw new TypeError('Plugin must be an object');
                }
                if (!pluginObj.name || !pluginObj.name.startsWith('$_')) {
                    throw new TypeError('Plugin object name must be present and begin with `$_`');
                }
                if (typeof pluginObj.set !== 'function') {
                    throw new TypeError('Plugin object must have a `set` method');
                }
            });
        }
        args = args.slice(1);
    }
    var argc = args.length;
    var defaultMap = opts && opts.$map && opts.$map.root;
    var setMap = function setMap(dataVal) {
        var map = void 0,
            obj = void 0;
        // Boolean indicating use of default map and object
        if (dataVal === true) {
            var _defaultMap = slicedToArray(defaultMap, 2);

            map = _defaultMap[0];
            obj = _defaultMap[1];
        } else if (Array.isArray(dataVal)) {
            // Array of strings mapping to default
            if (typeof dataVal[0] === 'string') {
                dataVal.forEach(function (dVal) {
                    setMap(opts.$map[dVal]);
                });
                // Array of Map and non-map data object
            } else {
                map = dataVal[0] || defaultMap[0];
                obj = dataVal[1] || defaultMap[1];
            }
            // Map
        } else if (/^\[object (?:Weak)?Map\]$/.test([].toString.call(dataVal))) {
            map = dataVal;
            obj = defaultMap[1];
            // Non-map data object
        } else {
            map = defaultMap[0];
            obj = dataVal;
        }
        map.set(elem, obj);
    };
    for (var i = 0; i < argc; i++) {
        var arg = args[i];
        switch (_getType(arg)) {
            case 'null':
                // null always indicates a place-holder (only needed for last argument if want array returned)
                if (i === argc - 1) {
                    _applyAnyStylesheet(nodes[0]); // We have to execute any stylesheets even if not appending or otherwise IE will never apply them
                    // Todo: Fix to allow application of stylesheets of style tags within fragments?
                    return nodes.length <= 1 ? nodes[0] : nodes.reduce(_fragReducer, doc.createDocumentFragment()); // nodes;
                }
                break;
            case 'string':
                // Strings indicate elements
                switch (arg) {
                    case '!':
                        nodes[nodes.length] = doc.createComment(args[++i]);
                        break;
                    case '?':
                        arg = args[++i];
                        var procValue = args[++i];
                        var val = procValue;
                        if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === 'object') {
                            procValue = [];
                            for (var p in val) {
                                if (val.hasOwnProperty(p)) {
                                    procValue.push(p + '=' + '"' +
                                    // https://www.w3.org/TR/xml-stylesheet/#NT-PseudoAttValue
                                    val[p].replace(/"/g, '&quot;') + '"');
                                }
                            }
                            procValue = procValue.join(' ');
                        }
                        // Firefox allows instructions with ">" in this method, but not if placed directly!
                        try {
                            nodes[nodes.length] = doc.createProcessingInstruction(arg, procValue);
                        } catch (e) {
                            // Getting NotSupportedError in IE, so we try to imitate a processing instruction with a comment
                            // innerHTML didn't work
                            // var elContainer = doc.createElement('div');
                            // elContainer.textContent = '<?' + doc.createTextNode(arg + ' ' + procValue).nodeValue + '?>';
                            // nodes[nodes.length] = elContainer.textContent;
                            // Todo: any other way to resolve? Just use XML?
                            nodes[nodes.length] = doc.createComment('?' + arg + ' ' + procValue + '?');
                        }
                        break;
                    // Browsers don't support doc.createEntityReference, so we just use this as a convenience
                    case '&':
                        nodes[nodes.length] = _createSafeReference('entity', '', args[++i]);
                        break;
                    case '#':
                        // // Decimal character reference - ['#', '01234'] // &#01234; // probably easier to use JavaScript Unicode escapes
                        nodes[nodes.length] = _createSafeReference('decimal', arg, String(args[++i]));
                        break;
                    case '#x':
                        // Hex character reference - ['#x', '123a'] // &#x123a; // probably easier to use JavaScript Unicode escapes
                        nodes[nodes.length] = _createSafeReference('hexadecimal', arg, args[++i]);
                        break;
                    case '![':
                        // '![', ['escaped <&> text'] // <![CDATA[escaped <&> text]]>
                        // CDATA valid in XML only, so we'll just treat as text for mutual compatibility
                        // Todo: config (or detection via some kind of doc.documentType property?) of whether in XML
                        try {
                            nodes[nodes.length] = doc.createCDATASection(args[++i]);
                        } catch (e2) {
                            nodes[nodes.length] = doc.createTextNode(args[i]); // i already incremented
                        }
                        break;
                    case '':
                        nodes[nodes.length] = doc.createDocumentFragment();
                        break;
                    default:
                        {
                            // An element
                            elStr = arg;
                            var _atts = args[i + 1];
                            // Todo: Fix this to depend on XML/config, not availability of methods
                            if (_getType(_atts) === 'object' && _atts.is) {
                                var is = _atts.is;

                                if (doc.createElementNS) {
                                    elem = doc.createElementNS(NS_HTML, elStr, { is: is });
                                } else {
                                    elem = doc.createElement(elStr, { is: is });
                                }
                            } else {
                                if (doc.createElementNS) {
                                    elem = doc.createElementNS(NS_HTML, elStr);
                                } else {
                                    elem = doc.createElement(elStr);
                                }
                            }
                            nodes[nodes.length] = elem; // Add to parent
                            break;
                        }
                }
                break;
            case 'object':
                // Non-DOM-element objects indicate attribute-value pairs
                var atts = arg;

                if (atts.xmlns !== undefined) {
                    // We handle this here, as otherwise may lose events, etc.
                    // As namespace of element already set as XHTML, we need to change the namespace
                    // elem.setAttribute('xmlns', atts.xmlns); // Doesn't work
                    // Can't set namespaceURI dynamically, renameNode() is not supported, and setAttribute() doesn't work to change the namespace, so we resort to this hack
                    var replacer = void 0;
                    if (_typeof(atts.xmlns) === 'object') {
                        replacer = _replaceDefiner(atts.xmlns);
                    } else {
                        replacer = ' xmlns="' + atts.xmlns + '"';
                    }
                    // try {
                    // Also fix DOMParser to work with text/html
                    elem = nodes[nodes.length - 1] = new DOMParser().parseFromString(new XmlSerializer().serializeToString(elem)
                    // Mozilla adds XHTML namespace
                    .replace(' xmlns="' + NS_HTML + '"', replacer), 'application/xml').documentElement;
                    // }catch(e) {alert(elem.outerHTML);throw e;}
                }
                var orderedArr = atts.$a ? atts.$a.map(_copyOrderedAtts) : [atts];
                orderedArr.forEach(_checkAtts);
                break;
            case 'fragment':
            case 'element':
                /*
                1) Last element always the parent (put null if don't want parent and want to return array) unless only atts and children (no other elements)
                2) Individual elements (DOM elements or sequences of string[/object/array]) get added to parent first-in, first-added
                */
                if (i === 0) {
                    // Allow wrapping of element
                    elem = arg;
                }
                if (i === argc - 1 || i === argc - 2 && args[i + 1] === null) {
                    // parent
                    var elsl = nodes.length;
                    for (var k = 0; k < elsl; k++) {
                        _appendNode(arg, nodes[k]);
                    }
                    // Todo: Apply stylesheets if any style tags were added elsewhere besides the first element?
                    _applyAnyStylesheet(nodes[0]); // We have to execute any stylesheets even if not appending or otherwise IE will never apply them
                } else {
                    nodes[nodes.length] = arg;
                }
                break;
            case 'array':
                // Arrays or arrays of arrays indicate child nodes
                var child = arg;
                var cl = child.length;
                for (var j = 0; j < cl; j++) {
                    // Go through children array container to handle elements
                    var childContent = child[j];
                    var childContentType = typeof childContent === 'undefined' ? 'undefined' : _typeof(childContent);
                    if (childContent === undefined) {
                        throw String('Parent array:' + JSON.stringify(args) + '; child: ' + child + '; index:' + j);
                    }
                    switch (childContentType) {
                        // Todo: determine whether null or function should have special handling or be converted to text
                        case 'string':case 'number':case 'boolean':
                            _appendNode(elem, doc.createTextNode(childContent));
                            break;
                        default:
                            if (Array.isArray(childContent)) {
                                // Arrays representing child elements
                                _appendNode(elem, _optsOrUndefinedJML.apply(undefined, [opts].concat(toConsumableArray(childContent))));
                            } else if (childContent['#']) {
                                // Fragment
                                _appendNode(elem, _optsOrUndefinedJML(opts, childContent['#']));
                            } else {
                                // Single DOM element children
                                _appendNode(elem, childContent);
                            }
                            break;
                    }
                }
                break;
        }
    }
    var ret = nodes[0] || elem;
    if (opts && isRoot && opts.$map && opts.$map.root) {
        setMap(true);
    }
    return ret;
};

/**
* Converts a DOM object or a string of HTML into a Jamilih object (or string)
* @param {string|HTMLElement} [dom=document.documentElement] Defaults to converting the current document.
* @param {object} [config={stringOutput:false}] Configuration object
* @param {boolean} [config.stringOutput=false] Whether to output the Jamilih object as a string.
* @returns {array|string} Array containing the elements which represent a Jamilih object, or,
                            if `stringOutput` is true, it will be the stringified version of
                            such an object
*/
jml.toJML = function (dom, config) {
    config = config || { stringOutput: false };
    if (typeof dom === 'string') {
        dom = new DOMParser().parseFromString(dom, 'text/html'); // todo: Give option for XML once implemented and change JSDoc to allow for Element
    }

    var ret = [];
    var parent = ret;
    var parentIdx = 0;

    function invalidStateError() {
        // These are probably only necessary if working with text/html
        function DOMException() {
            return this;
        }
        {
            // INVALID_STATE_ERR per section 9.3 XHTML 5: http://www.w3.org/TR/html5/the-xhtml-syntax.html
            // Since we can't instantiate without this (at least in Mozilla), this mimicks at least (good idea?)
            var e = new DOMException();
            e.code = 11;
            throw e;
        }
    }

    function addExternalID(obj, node) {
        if (node.systemId.includes('"') && node.systemId.includes("'")) {
            invalidStateError();
        }
        var publicId = node.publicId;
        var systemId = node.systemId;
        if (systemId) {
            obj.systemId = systemId;
        }
        if (publicId) {
            obj.publicId = publicId;
        }
    }

    function set$$1(val) {
        parent[parentIdx] = val;
        parentIdx++;
    }
    function setChildren() {
        set$$1([]);
        parent = parent[parentIdx - 1];
        parentIdx = 0;
    }
    function setObj(prop1, prop2) {
        parent = parent[parentIdx - 1][prop1];
        parentIdx = 0;
        if (prop2) {
            parent = parent[prop2];
        }
    }

    function parseDOM(node, namespaces) {
        // namespaces = clone(namespaces) || {}; // Ensure we're working with a copy, so different levels in the hierarchy can treat it differently

        /*
        if ((node.prefix && node.prefix.includes(':')) || (node.localName && node.localName.includes(':'))) {
            invalidStateError();
        }
        */

        var type = 'nodeType' in node ? node.nodeType : null;
        namespaces = Object.assign({}, namespaces);

        var xmlChars = /([\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD]|[\uD800-\uDBFF][\uDC00-\uDFFF])*$/; // eslint-disable-line no-control-regex
        if ([2, 3, 4, 7, 8].includes(type) && !xmlChars.test(node.nodeValue)) {
            invalidStateError();
        }

        var children = void 0,
            start = void 0,
            tmpParent = void 0,
            tmpParentIdx = void 0;
        function setTemp() {
            tmpParent = parent;
            tmpParentIdx = parentIdx;
        }
        function resetTemp() {
            parent = tmpParent;
            parentIdx = tmpParentIdx;
            parentIdx++; // Increment index in parent container of this element
        }
        switch (type) {
            case 1:
                // ELEMENT
                setTemp();
                var nodeName = node.nodeName.toLowerCase(); // Todo: for XML, should not lower-case

                setChildren(); // Build child array since elements are, except at the top level, encapsulated in arrays
                set$$1(nodeName);

                start = {};
                var hasNamespaceDeclaration = false;

                if (namespaces[node.prefix || ''] !== node.namespaceURI) {
                    namespaces[node.prefix || ''] = node.namespaceURI;
                    if (node.prefix) {
                        start['xmlns:' + node.prefix] = node.namespaceURI;
                    } else if (node.namespaceURI) {
                        start.xmlns = node.namespaceURI;
                    }
                    hasNamespaceDeclaration = true;
                }
                if (node.attributes.length) {
                    set$$1(Array.from(node.attributes).reduce(function (obj, att) {
                        obj[att.name] = att.value; // Attr.nodeName and Attr.nodeValue are deprecated as of DOM4 as Attr no longer inherits from Node, so we can safely use name and value
                        return obj;
                    }, start));
                } else if (hasNamespaceDeclaration) {
                    set$$1(start);
                }

                children = node.childNodes;
                if (children.length) {
                    setChildren(); // Element children array container
                    Array.from(children).forEach(function (childNode) {
                        parseDOM(childNode, namespaces);
                    });
                }
                resetTemp();
                break;
            case undefined: // Treat as attribute node until this is fixed: https://github.com/tmpvar/jsdom/issues/1641 / https://github.com/tmpvar/jsdom/pull/1822
            case 2:
                // ATTRIBUTE (should only get here if passing in an attribute node)
                set$$1({ $attribute: [node.namespaceURI, node.name, node.value] });
                break;
            case 3:
                // TEXT
                if (config.stripWhitespace && /^\s+$/.test(node.nodeValue)) {
                    return;
                }
                set$$1(node.nodeValue);
                break;
            case 4:
                // CDATA
                if (node.nodeValue.includes(']]' + '>')) {
                    invalidStateError();
                }
                set$$1(['![', node.nodeValue]);
                break;
            case 5:
                // ENTITY REFERENCE (probably not used in browsers since already resolved)
                set$$1(['&', node.nodeName]);
                break;
            case 6:
                // ENTITY (would need to pass in directly)
                setTemp();
                start = {};
                if (node.xmlEncoding || node.xmlVersion) {
                    // an external entity file?
                    start.$ENTITY = { name: node.nodeName, version: node.xmlVersion, encoding: node.xmlEncoding };
                } else {
                    start.$ENTITY = { name: node.nodeName };
                    if (node.publicId || node.systemId) {
                        // External Entity?
                        addExternalID(start.$ENTITY, node);
                        if (node.notationName) {
                            start.$ENTITY.NDATA = node.notationName;
                        }
                    }
                }
                set$$1(start);
                children = node.childNodes;
                if (children.length) {
                    start.$ENTITY.childNodes = [];
                    // Set position to $ENTITY's childNodes array children
                    setObj('$ENTITY', 'childNodes');

                    Array.from(children).forEach(function (childNode) {
                        parseDOM(childNode, namespaces);
                    });
                }
                resetTemp();
                break;
            case 7:
                // PROCESSING INSTRUCTION
                if (/^xml$/i.test(node.target)) {
                    invalidStateError();
                }
                if (node.target.includes('?>')) {
                    invalidStateError();
                }
                if (node.target.includes(':')) {
                    invalidStateError();
                }
                if (node.data.includes('?>')) {
                    invalidStateError();
                }
                set$$1(['?', node.target, node.data]); // Todo: Could give option to attempt to convert value back into object if has pseudo-attributes
                break;
            case 8:
                // COMMENT
                if (node.nodeValue.includes('--') || node.nodeValue.length && node.nodeValue.lastIndexOf('-') === node.nodeValue.length - 1) {
                    invalidStateError();
                }
                set$$1(['!', node.nodeValue]);
                break;
            case 9:
                // DOCUMENT
                setTemp();
                var docObj = { $document: { childNodes: [] } };

                if (config.xmlDeclaration) {
                    docObj.$document.xmlDeclaration = { version: doc.xmlVersion, encoding: doc.xmlEncoding, standAlone: doc.xmlStandalone };
                }

                set$$1(docObj); // doc.implementation.createHTMLDocument

                // Set position to fragment's array children
                setObj('$document', 'childNodes');

                children = node.childNodes;
                if (!children.length) {
                    invalidStateError();
                }
                // set({$xmlDocument: []}); // doc.implementation.createDocument // Todo: use this conditionally

                Array.from(children).forEach(function (childNode) {
                    // Can't just do documentElement as there may be doctype, comments, etc.
                    // No need for setChildren, as we have already built the container array
                    parseDOM(childNode, namespaces);
                });
                resetTemp();
                break;
            case 10:
                // DOCUMENT TYPE
                setTemp();

                // Can create directly by doc.implementation.createDocumentType
                start = { $DOCTYPE: { name: node.name } };
                if (node.internalSubset) {
                    start.internalSubset = node.internalSubset;
                }
                var pubIdChar = /^(\u0020|\u000D|\u000A|[a-zA-Z0-9]|[-'()+,./:=?;!*#@$_%])*$/; // eslint-disable-line no-control-regex
                if (!pubIdChar.test(node.publicId)) {
                    invalidStateError();
                }
                addExternalID(start.$DOCTYPE, node);
                // Fit in internal subset along with entities?: probably don't need as these would only differ if from DTD, and we're not rebuilding the DTD
                set$$1(start); // Auto-generate the internalSubset instead? Avoid entities/notations in favor of array to preserve order?

                var entities = node.entities; // Currently deprecated
                if (entities && entities.length) {
                    start.$DOCTYPE.entities = [];
                    setObj('$DOCTYPE', 'entities');
                    Array.from(entities).forEach(function (entity) {
                        parseDOM(entity, namespaces);
                    });
                    // Reset for notations
                    parent = tmpParent;
                    parentIdx = tmpParentIdx + 1;
                }

                var notations = node.notations; // Currently deprecated
                if (notations && notations.length) {
                    start.$DOCTYPE.notations = [];
                    setObj('$DOCTYPE', 'notations');
                    Array.from(notations).forEach(function (notation) {
                        parseDOM(notation, namespaces);
                    });
                }
                resetTemp();
                break;
            case 11:
                // DOCUMENT FRAGMENT
                setTemp();

                set$$1({ '#': [] });

                // Set position to fragment's array children
                setObj('#');

                children = node.childNodes;
                Array.from(children).forEach(function (childNode) {
                    // No need for setChildren, as we have already built the container array
                    parseDOM(childNode, namespaces);
                });

                resetTemp();
                break;
            case 12:
                // NOTATION
                start = { $NOTATION: { name: node.nodeName } };
                addExternalID(start.$NOTATION, node);
                set$$1(start);
                break;
            default:
                throw new TypeError('Not an XML type');
        }
    }

    parseDOM(dom, {});

    if (config.stringOutput) {
        return JSON.stringify(ret[0]);
    }
    return ret[0];
};
jml.toJMLString = function (dom, config) {
    return jml.toJML(dom, Object.assign(config || {}, { stringOutput: true }));
};
jml.toDOM = function () {
    // Alias for jml()
    return jml.apply(undefined, arguments);
};
jml.toHTML = function () {
    // Todo: Replace this with version of jml() that directly builds a string
    var ret = jml.apply(undefined, arguments);
    // Todo: deal with serialization of properties like 'selected', 'checked', 'value', 'defaultValue', 'for', 'dataset', 'on*', 'style'! (i.e., need to build a string ourselves)
    return ret.outerHTML;
};
jml.toDOMString = function () {
    // Alias for jml.toHTML for parity with jml.toJMLString
    return jml.toHTML.apply(jml, arguments);
};
jml.toXML = function () {
    var ret = jml.apply(undefined, arguments);
    return new XmlSerializer().serializeToString(ret);
};
jml.toXMLDOMString = function () {
    // Alias for jml.toXML for parity with jml.toJMLString
    return jml.toXML.apply(jml, arguments);
};

var JamilihMap = function (_Map) {
    inherits(JamilihMap, _Map);

    function JamilihMap() {
        classCallCheck(this, JamilihMap);
        return possibleConstructorReturn(this, (JamilihMap.__proto__ || Object.getPrototypeOf(JamilihMap)).apply(this, arguments));
    }

    createClass(JamilihMap, [{
        key: 'get',
        value: function get$$1(elem) {
            elem = typeof elem === 'string' ? $(elem) : elem;
            return get(JamilihMap.prototype.__proto__ || Object.getPrototypeOf(JamilihMap.prototype), 'get', this).call(this, elem);
        }
    }, {
        key: 'set',
        value: function set$$1(elem, value) {
            elem = typeof elem === 'string' ? $(elem) : elem;
            return get(JamilihMap.prototype.__proto__ || Object.getPrototypeOf(JamilihMap.prototype), 'set', this).call(this, elem, value);
        }
    }, {
        key: 'invoke',
        value: function invoke(elem, methodName) {
            var _get;

            elem = typeof elem === 'string' ? $(elem) : elem;

            for (var _len3 = arguments.length, args = Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
                args[_key3 - 2] = arguments[_key3];
            }

            return (_get = this.get(elem))[methodName].apply(_get, [elem].concat(args));
        }
    }]);
    return JamilihMap;
}(Map);

var JamilihWeakMap = function (_WeakMap) {
    inherits(JamilihWeakMap, _WeakMap);

    function JamilihWeakMap() {
        classCallCheck(this, JamilihWeakMap);
        return possibleConstructorReturn(this, (JamilihWeakMap.__proto__ || Object.getPrototypeOf(JamilihWeakMap)).apply(this, arguments));
    }

    createClass(JamilihWeakMap, [{
        key: 'get',
        value: function get$$1(elem) {
            elem = typeof elem === 'string' ? $(elem) : elem;
            return get(JamilihWeakMap.prototype.__proto__ || Object.getPrototypeOf(JamilihWeakMap.prototype), 'get', this).call(this, elem);
        }
    }, {
        key: 'set',
        value: function set$$1(elem, value) {
            elem = typeof elem === 'string' ? $(elem) : elem;
            return get(JamilihWeakMap.prototype.__proto__ || Object.getPrototypeOf(JamilihWeakMap.prototype), 'set', this).call(this, elem, value);
        }
    }, {
        key: 'invoke',
        value: function invoke(elem, methodName) {
            var _get2;

            elem = typeof elem === 'string' ? $(elem) : elem;

            for (var _len4 = arguments.length, args = Array(_len4 > 2 ? _len4 - 2 : 0), _key4 = 2; _key4 < _len4; _key4++) {
                args[_key4 - 2] = arguments[_key4];
            }

            return (_get2 = this.get(elem))[methodName].apply(_get2, [elem].concat(args));
        }
    }]);
    return JamilihWeakMap;
}(WeakMap);

jml.Map = JamilihMap;
jml.WeakMap = JamilihWeakMap;

jml.weak = function (obj) {
    var map = new JamilihWeakMap();

    for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
        args[_key5 - 1] = arguments[_key5];
    }

    var elem = jml.apply(undefined, [{ $map: [map, obj] }].concat(args));
    return [map, elem];
};

jml.strong = function (obj) {
    var map = new JamilihMap();

    for (var _len6 = arguments.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
        args[_key6 - 1] = arguments[_key6];
    }

    var elem = jml.apply(undefined, [{ $map: [map, obj] }].concat(args));
    return [map, elem];
};

jml.symbol = jml.sym = jml.for = function (elem, sym) {
    elem = typeof elem === 'string' ? $(elem) : elem;
    return elem[(typeof sym === 'undefined' ? 'undefined' : _typeof(sym)) === 'symbol' ? sym : Symbol.for(sym)];
};

jml.command = function (elem, symOrMap, methodName) {
    elem = typeof elem === 'string' ? $(elem) : elem;
    var func = void 0;

    for (var _len7 = arguments.length, args = Array(_len7 > 3 ? _len7 - 3 : 0), _key7 = 3; _key7 < _len7; _key7++) {
        args[_key7 - 3] = arguments[_key7];
    }

    if (['symbol', 'string'].includes(typeof symOrMap === 'undefined' ? 'undefined' : _typeof(symOrMap))) {
        var _func;

        func = jml.sym(elem, symOrMap);
        if (typeof func === 'function') {
            return func.apply(undefined, [methodName].concat(args)); // Already has `this` bound to `elem`
        }
        return (_func = func)[methodName].apply(_func, args);
    } else {
        var _func3;

        func = symOrMap.get(elem);
        if (typeof func === 'function') {
            var _func2;

            return (_func2 = func).call.apply(_func2, [elem, methodName].concat(args));
        }
        return (_func3 = func)[methodName].apply(_func3, [elem].concat(args));
    }
    // return func[methodName].call(elem, ...args);
};

jml.setWindow = function (wind) {
    win = wind;
};
jml.setDocument = function (docum) {
    doc = docum;
    if (docum && docum.body) {
        body = docum.body;
    }
};
jml.setXMLSerializer = function (xmls) {
    XmlSerializer = xmls;
};

jml.getWindow = function () {
    return win;
};
jml.getDocument = function () {
    return doc;
};
jml.getXMLSerializer = function () {
    return XmlSerializer;
};

var body = doc && doc.body;

var nbsp = '\xA0'; // Very commonly needed in templates

export default jml;
export { jml, $, $$, nbsp, body };
