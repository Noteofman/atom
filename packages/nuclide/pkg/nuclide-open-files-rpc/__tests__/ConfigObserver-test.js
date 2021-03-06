"use strict";

function _FileCache() {
  const data = require("../lib/FileCache");

  _FileCache = function () {
    return data;
  };

  return data;
}

function _ConfigObserver() {
  const data = require("../lib/ConfigObserver");

  _ConfigObserver = function () {
    return data;
  };

  return data;
}

function _waits_for() {
  const data = _interopRequireDefault(require("../../../jest/waits_for"));

  _waits_for = function () {
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
 * @emails oncall+nuclide
 */
describe('ConfigObserver', () => {
  let cache = null;
  let eventCount = 0;
  let events = null;
  let findNearestFile = null;

  const createOpen = filePath => ({
    kind: 'open',
    fileVersion: {
      notifier: cache,
      filePath,
      version: 1
    },
    contents: 'contents1',
    languageId: 'Babel ES6 JavaScript'
  });

  const createClose = filePath => ({
    kind: 'close',
    fileVersion: {
      notifier: cache,
      filePath,
      version: 1
    }
  });

  beforeEach(() => {
    cache = new (_FileCache().FileCache)();
    const observer = new (_ConfigObserver().ConfigObserver)(cache, ['.php'], path => findNearestFile(path));
    eventCount = 0;
    events = observer.observeConfigs().map(config => Array.from(config)).do(() => {
      eventCount++;
    }).toArray().toPromise();
  });
  it('root project', async () => {
    findNearestFile = path => Promise.resolve(path);

    cache.onDirectoriesChanged(new Set(['/some/path']));
    await (0, _waits_for().default)(() => eventCount >= 2);
    cache.onDirectoriesChanged(new Set());
    await (0, _waits_for().default)(() => eventCount >= 3); // completes the observables.

    cache.dispose(); // observer.dispose();

    expect((await events)).toEqual([[], ['/some/path'], []]);
  });
  it('multiple root projects', async () => {
    findNearestFile = path => Promise.resolve(path);

    cache.onDirectoriesChanged(new Set(['/some/path', '/some/path2']));
    await (0, _waits_for().default)(() => eventCount >= 2);
    cache.onDirectoriesChanged(new Set(['/some/path2']));
    await (0, _waits_for().default)(() => eventCount >= 3);
    cache.onDirectoriesChanged(new Set());
    await (0, _waits_for().default)(() => eventCount >= 4); // completes the observables.

    cache.dispose(); // observer.dispose();

    expect((await events)).toEqual([[], ['/some/path', '/some/path2'], ['/some/path2'], []]);
  });
  it('opening a file in a root project', async () => {
    findNearestFile = path => Promise.resolve('/some/path');

    cache.onDirectoriesChanged(new Set(['/some/path']));
    await (0, _waits_for().default)(() => eventCount >= 2);
    cache.onFileEvent(createOpen('/some/path/file1.php'));
    cache.onFileEvent(createClose('/some/path/file1.php'));
    cache.onDirectoriesChanged(new Set());
    await (0, _waits_for().default)(() => eventCount >= 3); // completes the observables.

    cache.dispose(); // observer.dispose();

    expect((await events)).toEqual([[], ['/some/path'], []]);
  });
  it('opening a file without a project', async () => {
    findNearestFile = path => Promise.resolve('/some/path');

    cache.onFileEvent(createOpen('/some/path/file1.php'));
    await (0, _waits_for().default)(() => eventCount >= 2);
    cache.onFileEvent(createClose('/some/path/file1.php'));
    await (0, _waits_for().default)(() => eventCount >= 3); // completes the observables.

    cache.dispose(); // observer.dispose();

    expect((await events)).toEqual([[], ['/some/path'], []]);
  });
});