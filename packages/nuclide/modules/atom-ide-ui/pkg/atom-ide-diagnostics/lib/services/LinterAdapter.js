"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.linterMessageToDiagnosticMessage = linterMessageToDiagnosticMessage;
exports.linterMessageV2ToDiagnosticMessage = linterMessageV2ToDiagnosticMessage;
exports.linterMessagesToDiagnosticUpdate = linterMessagesToDiagnosticUpdate;
exports.LinterAdapter = void 0;

var _atom = require("atom");

function _projects() {
  const data = require("../../../../../nuclide-commons-atom/projects");

  _projects = function () {
    return data;
  };

  return data;
}

var _RxMin = require("rxjs/bundles/Rx.min.js");

function _textEvent() {
  const data = require("../../../../../nuclide-commons-atom/text-event");

  _textEvent = function () {
    return data;
  };

  return data;
}

function _log4js() {
  const data = require("log4js");

  _log4js = function () {
    return data;
  };

  return data;
}

function _event() {
  const data = require("../../../../../nuclide-commons/event");

  _event = function () {
    return data;
  };

  return data;
}

function _nuclideUri() {
  const data = _interopRequireDefault(require("../../../../../nuclide-commons/nuclideUri"));

  _nuclideUri = function () {
    return data;
  };

  return data;
}

function _UniversalDisposable() {
  const data = _interopRequireDefault(require("../../../../../nuclide-commons/UniversalDisposable"));

  _UniversalDisposable = function () {
    return data;
  };

  return data;
}

function _paneItem() {
  const data = require("../../../../../nuclide-commons-atom/pane-item");

  _paneItem = function () {
    return data;
  };

  return data;
}

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @format
 */
const PENDING_PANE_LINT_DEBOUNCE = 10000; // defer linting pending panes for 10s
// Exported for testing.

function linterMessageToDiagnosticMessage(msg, providerName, currentPath) {
  // The types are slightly different, so we need to copy to make Flow happy. Basically, a Trace
  // does not need a filePath property, but a LinterTrace does. Trace is a subtype of LinterTrace,
  // so copying works but aliasing does not. For a detailed explanation see
  // https://github.com/facebook/flow/issues/908
  const trace = msg.trace ? msg.trace.map(convertLinterTrace) : undefined;
  const type = convertLinterType(msg.type);
  const {
    fix
  } = msg;
  return {
    providerName: msg.name != null ? msg.name : providerName,
    type,
    filePath: getFilePath(msg.filePath, currentPath),
    text: msg.text,
    html: msg.html,
    range: msg.range && _atom.Range.fromObject(msg.range),
    trace,
    fix: fix == null ? undefined : {
      oldRange: _atom.Range.fromObject(fix.range),
      oldText: fix.oldText,
      newText: fix.newText
    }
  };
} // They're almost the same.. except that we always want a real range.


function convertLinterTrace(trace) {
  return {
    type: trace.type,
    text: trace.text,
    html: trace.html,
    filePath: trace.filePath,
    range: trace.range != null ? _atom.Range.fromObject(trace.range) : undefined
  };
}

function getFilePath(filePath, currentPath) {
  // Model project-level diagnostics with the project root as the path.
  if (filePath != null) {
    return filePath;
  }

  if (currentPath != null) {
    const rootPath = (0, _projects().getAtomProjectRootPath)(currentPath);

    if (rootPath != null) {
      return _nuclideUri().default.ensureTrailingSeparator(rootPath);
    }
  } // It's unclear what to do in the remaining cases.
  // We'll just use the root filesystem directory.


  return _nuclideUri().default.ensureTrailingSeparator('');
} // Be flexible in accepting various linter types/severities.


function convertLinterType(type) {
  switch (type) {
    case 'Error':
    case 'error':
      return 'Error';

    case 'Warning':
    case 'warning':
      return 'Warning';

    case 'Info':
    case 'info':
      return 'Info';
  }

  return 'Error';
} // Version 2 only handles file-level diagnostics.


function linterMessageV2ToDiagnosticMessage(msg, providerName) {
  let trace;

  if (msg.trace != null) {
    trace = msg.trace.map(convertLinterTrace);
  } else if (msg.reference != null) {
    const point = msg.reference.position != null ? _atom.Point.fromObject(msg.reference.position) : null;
    trace = [{
      type: 'Trace',
      text: 'Reference',
      filePath: msg.reference.file,
      range: point ? new _atom.Range(point, point) : undefined
    }];
  }

  let fix;
  const actions = [];
  const {
    solutions
  } = msg;

  if (solutions != null && solutions.length > 0) {
    const sortedSolutions = Array.from(solutions).sort((a, b) => (a.priority || 0) - (b.priority || 0));
    sortedSolutions.forEach((solution, i) => {
      if (solution.replaceWith !== undefined) {
        // TODO: support multiple fixes.
        if (fix == null) {
          fix = {
            oldRange: _atom.Range.fromObject(solution.position),
            oldText: solution.currentText,
            newText: solution.replaceWith,
            title: solution.title
          };
        }
      } else {
        actions.push({
          title: solution.title != null ? solution.title : `Solution ${i + 1}`,
          apply: solution.apply.bind(solution)
        });
      }
    });
  }

  return {
    // flowlint-next-line sketchy-null-string:off
    providerName: msg.linterName || providerName,
    type: convertLinterType(msg.severity),
    filePath: msg.location.file,
    text: msg.excerpt,
    description: msg.description,
    kind: msg.kind,
    range: _atom.Range.fromObject(msg.location.position),
    trace,
    fix,
    actions
  };
}

function linterMessagesToDiagnosticUpdate(currentPath, msgs, providerName) {
  const filePathToMessages = new Map(); // flowlint-next-line sketchy-null-string:off

  if (currentPath) {
    // Make sure we invalidate the messages for the current path. We may want to
    // figure out which other paths we want to invalidate if it turns out that
    // linters regularly return messages for other files.
    filePathToMessages.set(currentPath, []);
  }

  for (const msg of msgs) {
    const diagnosticMessage = msg.type === undefined ? linterMessageV2ToDiagnosticMessage(msg, providerName) : linterMessageToDiagnosticMessage(msg, providerName, currentPath);
    const path = diagnosticMessage.filePath;
    let messages = filePathToMessages.get(path);

    if (messages == null) {
      messages = [];
      filePathToMessages.set(path, messages);
    }

    messages.push(diagnosticMessage);
  }

  return filePathToMessages;
}
/**
 * Provides an adapter between Atom linters (defined by the LinterProvider
 * type), and Nuclide Diagnostic Providers.
 *
 * The constructor takes a LinterProvider as an argument, and the resulting
 * LinterAdapter is a valid DiagnosticProvider.
 */


class LinterAdapter {
  constructor(provider, busyReporter) {
    this._provider = provider;
    this._updates = new _RxMin.Subject();
    this._invalidations = new _RxMin.Subject();
    this._disposables = new (_UniversalDisposable().default)((0, _textEvent().observeTextEditorEvents)(this._provider.grammarScopes[0] === '*' ? 'all' : this._provider.grammarScopes, this._provider.lintsOnChange || this._provider.lintOnFly ? 'changes' : 'saves') // Group text editor events by their underlying text buffer.
    // Each grouped stream lasts until the buffer gets destroyed.
    .groupBy(editor => editor.getBuffer(), editor => editor, grouped => (0, _event().observableFromSubscribeFunction)(cb => grouped.key.onDidDestroy(cb)).take(1)).mergeMap(bufferObservable => // Run the linter on each buffer event.
    _RxMin.Observable.concat(bufferObservable, // When the buffer gets destroyed, immediately stop linting and invalidate.
    _RxMin.Observable.of(null)) // switchMap ensures that earlier lints are overridden by later ones.
    .switchMap(editor => {
      if (editor == null) {
        return _RxMin.Observable.of(null);
      }

      const path = editor.getPath();
      const basename = path == null ? '(untitled)' : _nuclideUri().default.basename(path);
      const startLinting = (0, _paneItem().isPending)(editor) ? (0, _paneItem().observePendingStateEnd)(editor).timeoutWith(PENDING_PANE_LINT_DEBOUNCE, _RxMin.Observable.of(null)) : _RxMin.Observable.of(null);
      return startLinting.switchMap(() => _RxMin.Observable.using(() => new (_UniversalDisposable().default)(busyReporter(`${this._provider.name}: running on "${basename}"`)), () => this._runLint(editor)));
    }) // Track the previous update so we can invalidate its results.
    // (Prevents dangling diagnostics when a linter affects multiple files).
    .scan((acc, update) => ({
      update,
      lastUpdate: acc.update
    }), {
      update: null,
      lastUpdate: null
    })).subscribe(({
      update,
      lastUpdate
    }) => this._processUpdate(update, lastUpdate)));
  }

  _runLint(editor) {
    return _RxMin.Observable.defer(() => {
      const lintPromise = this._provider.lint(editor);

      if (lintPromise == null) {
        return _RxMin.Observable.empty();
      }

      return Promise.resolve(lintPromise).catch(error => {
        // Prevent errors from blowing up the entire stream.
        (0, _log4js().getLogger)('atom-ide-diagnostics').error(`Error in linter provider ${this._provider.name}:`, error);
        return null;
      });
    }).switchMap(linterMessages => {
      if (linterMessages == null) {
        return _RxMin.Observable.empty();
      }

      const update = linterMessagesToDiagnosticUpdate(editor.getPath(), linterMessages, this._provider.name);
      return _RxMin.Observable.of(update);
    });
  }

  _processUpdate(update, lastUpdate) {
    if (lastUpdate != null) {
      let filesToInvalidate = Array.from(lastUpdate.keys());

      if (update != null) {
        // Only invalidate files which will not have their messages explicitly
        // set by this update.
        filesToInvalidate = filesToInvalidate.filter(file => !update.has(file));
      }

      if (filesToInvalidate.length !== 0) {
        this._invalidations.next({
          scope: 'file',
          filePaths: filesToInvalidate
        });
      }
    }

    if (update != null) {
      this._updates.next(update);
    }
  }

  dispose() {
    this._disposables.dispose();

    this._updates.complete();

    this._invalidations.complete();
  }

  getUpdates() {
    return this._updates.asObservable();
  }

  getInvalidations() {
    return this._invalidations.asObservable();
  }

}

exports.LinterAdapter = LinterAdapter;