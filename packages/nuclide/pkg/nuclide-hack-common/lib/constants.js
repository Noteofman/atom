"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HACK_WORD_REGEX = exports.HACK_FILE_EXTENSIONS = exports.HACK_CONFIG_FILE_NAME = exports.HACK_GRAMMARS = void 0;

/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the license found in the LICENSE file in
 * the root directory of this source tree.
 *
 *  strict
 * @format
 */
const HACK_GRAMMARS = ['text.html.hack', 'text.html.php'];
exports.HACK_GRAMMARS = HACK_GRAMMARS;
const HACK_CONFIG_FILE_NAME = '.hhconfig'; // From hack/src/utils/findUtils.ml

exports.HACK_CONFIG_FILE_NAME = HACK_CONFIG_FILE_NAME;
const HACK_FILE_EXTENSIONS = ['.php', // normal php file
'.hh', // Hack extension some open source code is starting to use
'.phpt', // our php template files
'.hhi', // interface files only visible to the type checker
'.xhp']; // Note: this regex is used only by the legacy hack service.
// LSP doesn't use it.

exports.HACK_FILE_EXTENSIONS = HACK_FILE_EXTENSIONS;
const HACK_WORD_REGEX = /[a-zA-Z0-9_$]+/g;
exports.HACK_WORD_REGEX = HACK_WORD_REGEX;