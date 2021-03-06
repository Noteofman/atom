"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ensureInvalidations = ensureInvalidations;
exports.ServerLanguageService = void 0;

function _nuclideOpenFilesRpc() {
  const data = require("../../nuclide-open-files-rpc");

  _nuclideOpenFilesRpc = function () {
    return data;
  };

  return data;
}

var _RxMin = require("rxjs/bundles/Rx.min.js");

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
class ServerLanguageService {
  constructor(fileNotifier, service) {
    if (!(fileNotifier instanceof _nuclideOpenFilesRpc().FileCache)) {
      throw new Error("Invariant violation: \"fileNotifier instanceof FileCache\"");
    }

    this._fileCache = fileNotifier;
    this._service = service;
  }

  getSingleFileLanguageService() {
    return this._service;
  }

  async getDiagnostics(fileVersion) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.getDiagnostics(filePath, buffer);
  }

  observeDiagnostics() {
    return this._service.observeDiagnostics().publish();
  }

  async getAutocompleteSuggestions(fileVersion, position, request) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      // TODO: this should return null so the empty list doesn't get cached
      return {
        isIncomplete: false,
        items: []
      };
    }

    return this._service.getAutocompleteSuggestions(filePath, buffer, position, request.activatedManually, request.prefix);
  }

  async resolveAutocompleteSuggestion(suggestion) {
    return this._service.resolveAutocompleteSuggestion(suggestion);
  }

  async getDefinition(fileVersion, position) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.getDefinition(filePath, buffer, position);
  }

  findReferences(fileVersion, position) {
    const filePath = fileVersion.filePath;
    return _RxMin.Observable.fromPromise((0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion)).concatMap(buffer => {
      if (buffer == null) {
        return _RxMin.Observable.of(null);
      }

      return this._service.findReferences(filePath, buffer, position);
    }).publish();
  }

  rename(fileVersion, position, newName) {
    const filePath = fileVersion.filePath;
    return _RxMin.Observable.fromPromise((0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion)).concatMap(buffer => {
      if (buffer == null) {
        return _RxMin.Observable.of(null);
      }

      return this._service.rename(filePath, buffer, position, newName);
    }).publish();
  }

  getCoverage(filePath) {
    return this._service.getCoverage(filePath);
  }

  onToggleCoverage(set) {
    return this._service.onToggleCoverage(set);
  }

  async getAdditionalLogFiles() {
    // TODO (if it's ever needed): push this request to the this._service
    return [];
  }

  async getCodeActions(fileVersion, range, diagnostics) {
    const {
      filePath
    } = fileVersion;
    return this._service.getCodeActions(filePath, range, diagnostics);
  }

  async getOutline(fileVersion) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.getOutline(filePath, buffer);
  }

  async getCodeLens(fileVersion) {
    return null;
  }

  async resolveCodeLens(filePath, codeLens) {
    return null;
  }

  async typeHint(fileVersion, position) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.typeHint(filePath, buffer, position);
  }

  async highlight(fileVersion, position) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return [];
    }

    return this._service.highlight(filePath, buffer, position);
  }

  async formatSource(fileVersion, range, options) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.formatSource(filePath, buffer, range, options);
  }

  async formatEntireFile(fileVersion, range, options) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.formatEntireFile(filePath, buffer, range, options);
  }

  async formatAtPosition(fileVersion, position, triggerCharacter, options) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.formatAtPosition(filePath, buffer, position, triggerCharacter, options);
  }

  async signatureHelp(fileVersion, position) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.signatureHelp(filePath, buffer, position);
  }

  supportsSymbolSearch(directories) {
    return Promise.resolve(false); // A single-file language service by definition cannot offer
    // "project-wide symbol search". If you want your language to offer
    // symbols, you'll have to implement LanguageService directly.
  }

  symbolSearch(query, directories) {
    return Promise.resolve(null);
  }

  getProjectRoot(fileUri) {
    return this._service.getProjectRoot(fileUri);
  }

  async isFileInProject(fileUri) {
    return this._service.isFileInProject(fileUri);
  }

  async getExpandedSelectionRange(fileVersion, currentSelection) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.getExpandedSelectionRange(filePath, buffer, currentSelection);
  }

  async getCollapsedSelectionRange(fileVersion, currentSelection, originalCursorPosition) {
    const filePath = fileVersion.filePath;
    const buffer = await (0, _nuclideOpenFilesRpc().getBufferAtVersion)(fileVersion);

    if (buffer == null) {
      return null;
    }

    return this._service.getCollapsedSelectionRange(filePath, buffer, currentSelection, originalCursorPosition);
  }

  observeStatus(fileVersion) {
    return _RxMin.Observable.of({
      kind: 'null'
    }).publish();
  }

  onWillSave(fileVersion) {
    return _RxMin.Observable.empty().publish();
  }

  async clickStatus(fileVersion, id, button) {}

  async sendLspRequest(filePath, method, params) {}

  async sendLspNotification(filePath, method, params) {}

  observeLspNotifications(notificationMethod) {
    return _RxMin.Observable.empty().publish();
  }

  dispose() {
    this._service.dispose();
  }

} // Assert that ServerLanguageService satisifes the LanguageService interface:


exports.ServerLanguageService = ServerLanguageService;
null;

function ensureInvalidations(logger, diagnostics) {
  const filesWithErrors = new Set();
  const trackedDiagnostics = diagnostics.do(diagnosticMap => {
    for (const [filePath, messages] of diagnosticMap) {
      if (messages.length === 0) {
        logger.trace(`Removing ${filePath} from files with errors`);
        filesWithErrors.delete(filePath);
      } else {
        logger.trace(`Adding ${filePath} to files with errors`);
        filesWithErrors.add(filePath);
      }
    }
  });

  const fileInvalidations = _RxMin.Observable.defer(() => {
    logger.debug('Clearing errors after stream closed');
    return _RxMin.Observable.of(new Map(Array.from(filesWithErrors).map(file => {
      logger.debug(`Clearing errors for ${file} after connection closed`);
      return [file, []];
    })));
  });

  return trackedDiagnostics.concat(fileInvalidations);
}