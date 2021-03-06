"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getReplacementPrefix = getReplacementPrefix;
exports.shouldFilter = shouldFilter;
exports.filterResultsByPrefix = filterResultsByPrefix;
exports.flowCoordsToAtomCoords = flowCoordsToAtomCoords;
exports.JAVASCRIPT_WORD_REGEX = exports.JAVASCRIPT_WHOLE_STRING_IDENTIFIER_REGEX = exports.JAVASCRIPT_IDENTIFIER_REGEX = void 0;

function _simpleTextBuffer() {
  const data = require("simple-text-buffer");

  _simpleTextBuffer = function () {
    return data;
  };

  return data;
}

function _fuzzaldrinPlus() {
  const data = _interopRequireDefault(require("fuzzaldrin-plus"));

  _fuzzaldrinPlus = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 * 
 * @format
 */
// A simple heuristic for identifier names in JavaScript.
const JAVASCRIPT_IDENTIFIER_REGEX = /[$_a-zA-Z][$_\w]*/g;
exports.JAVASCRIPT_IDENTIFIER_REGEX = JAVASCRIPT_IDENTIFIER_REGEX;
const JAVASCRIPT_WHOLE_STRING_IDENTIFIER_REGEX = /^[$_a-zA-Z][$_\w]*$/;
exports.JAVASCRIPT_WHOLE_STRING_IDENTIFIER_REGEX = JAVASCRIPT_WHOLE_STRING_IDENTIFIER_REGEX;
const identifierOrNumber = '[a-zA-Z0-9_$]+';

function makeStrRegex(delimiter) {
  const d = delimiter; // Each run of four backslashes ends up as just one backslash. We need to escape once for the
  // string literal here, and once for the RegExp compilation.

  return `${d}(\\\\.|[^${d}\\\\])*${d}`;
}

const strRegexes = ['`', "'", '"'].map(makeStrRegex);
const regexStrings = [].concat(strRegexes, [identifierOrNumber]).map(s => `(${s})`);
const JAVASCRIPT_WORD_REGEX = new RegExp(regexStrings.join('|'), 'g');
exports.JAVASCRIPT_WORD_REGEX = JAVASCRIPT_WORD_REGEX;

function getReplacementPrefix(originalPrefix) {
  // Ignore prefix unless it's an identifier (this keeps us from eating leading
  // dots, colons, etc).
  return JAVASCRIPT_WHOLE_STRING_IDENTIFIER_REGEX.test(originalPrefix) ? originalPrefix : '';
}

function shouldFilter(lastRequest, currentRequest, charsSinceLastRequest) {
  const prefixIsIdentifier = JAVASCRIPT_WHOLE_STRING_IDENTIFIER_REGEX.test(currentRequest.prefix);
  const previousPrefixIsDot = /^\s*\.\s*$/.test(lastRequest.prefix);
  const prefixLengthDifference = currentRequest.prefix.length - lastRequest.prefix.length;
  const startsWithPrevious = currentRequest.prefix.startsWith(lastRequest.prefix);
  return prefixIsIdentifier && (previousPrefixIsDot && currentRequest.prefix.length === charsSinceLastRequest || startsWithPrevious && prefixLengthDifference === charsSinceLastRequest);
}

function filterResultsByPrefix(prefix, results) {
  const replacementPrefix = getReplacementPrefix(prefix);
  const resultsWithCurrentPrefix = results.items.map(result => {
    return Object.assign({}, result, {
      replacementPrefix
    });
  });
  let items; // fuzzaldrin-plus filters everything when the query is empty.

  if (replacementPrefix === '') {
    items = resultsWithCurrentPrefix;
  } else {
    items = _fuzzaldrinPlus().default.filter(resultsWithCurrentPrefix, replacementPrefix, {
      key: 'displayText'
    });
  }

  return Object.assign({}, results, {
    items
  });
}

function flowCoordsToAtomCoords(flowCoords) {
  return new (_simpleTextBuffer().Range)([flowCoords.start.line - 1, flowCoords.start.column - 1], [flowCoords.end.line - 1, // Yes, this is inconsistent. Yes, it works as expected in practice.
  flowCoords.end.column]);
}