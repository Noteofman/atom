"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.DEFAULT_WATCHMAN_RECONNECT_DELAY_MS = void 0;

function _nuclideUri() {
  const data = _interopRequireDefault(require("../../nuclide-commons/nuclideUri"));

  _nuclideUri = function () {
    return data;
  };

  return data;
}

function _fbWatchman() {
  const data = _interopRequireDefault(require("fb-watchman"));

  _fbWatchman = function () {
    return data;
  };

  return data;
}

function _promise() {
  const data = require("../../nuclide-commons/promise");

  _promise = function () {
    return data;
  };

  return data;
}

function _string() {
  const data = require("../../nuclide-commons/string");

  _string = function () {
    return data;
  };

  return data;
}

function _path() {
  const data = require("./path");

  _path = function () {
    return data;
  };

  return data;
}

function _WatchmanSubscription() {
  const data = _interopRequireDefault(require("./WatchmanSubscription"));

  _WatchmanSubscription = function () {
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
const logger = (0, _log4js().getLogger)('nuclide-watchman-helpers');
const WATCHMAN_SETTLE_TIME_MS = 2500;
const DEFAULT_WATCHMAN_RECONNECT_DELAY_MS = 100;
exports.DEFAULT_WATCHMAN_RECONNECT_DELAY_MS = DEFAULT_WATCHMAN_RECONNECT_DELAY_MS;
const MAXIMUM_WATCHMAN_RECONNECT_DELAY_MS = 30 * 1000;

class WatchmanClient {
  constructor() {
    this._reconnectDelayMs = DEFAULT_WATCHMAN_RECONNECT_DELAY_MS;

    this._initWatchmanClient();

    this._serializedReconnect = (0, _promise().serializeAsyncCall)(async () => {
      logger.info('Calling _reconnectClient from _serializedReconnect in %dms', this._reconnectDelayMs);
      await (0, _promise().sleep)(this._reconnectDelayMs);
      this._reconnectDelayMs *= 2; // exponential backoff

      if (this._reconnectDelayMs > MAXIMUM_WATCHMAN_RECONNECT_DELAY_MS) {
        this._reconnectDelayMs = MAXIMUM_WATCHMAN_RECONNECT_DELAY_MS;
      }

      return this._reconnectClient().catch(error => {
        logger.error('_reconnectClient failed', error);
      });
    });
    this._subscriptions = new Map();
  }

  async dispose() {
    const client = await this._clientPromise;
    client.removeAllListeners(); // disable reconnection

    client.end();
  }

  async _initWatchmanClient() {
    this._clientPromise = this._createClientPromise();
    const client = await this._clientPromise;
    client.on('end', () => {
      logger.info('Watchman client ended');
      client.removeAllListeners();

      this._serializedReconnect();
    });
    client.on('error', error => {
      logger.error('Error while talking to watchman: ', error); // If Watchman encounters an error in the middle of a command, it may never finish!
      // The client must be immediately killed here so that the command fails and
      // `serializeAsyncCall` can be unblocked. Otherwise, we end up in a deadlock.

      client.removeAllListeners();
      client.end(); // Those are errors in deserializing a stream of changes.
      // The only possible recovery here is reconnecting a new client,
      // but the failed to serialize events will be missed.
      // t9353878

      this._serializedReconnect();
    });
    client.on('subscription', this._onSubscriptionResult.bind(this));
  }

  async _createClientPromise() {
    return new (_fbWatchman().default.Client)({
      watchmanBinaryPath: await (0, _path().getWatchmanBinaryPath)()
    });
  }

  async _reconnectClient() {
    logger.error('Watchman client disconnected, reconnecting a new client!');
    await this._initWatchmanClient();
    logger.info('Watchman client re-initialized, restoring subscriptions');
    await this._restoreSubscriptions();
  } // TODO(mbolin): What happens if someone calls watchDirectoryRecursive() while
  // this method is executing?


  async _restoreSubscriptions() {
    const watchSubscriptions = Array.from(this._subscriptions.values());
    const numSubscriptions = watchSubscriptions.length;
    logger.info(`Attempting to restore ${numSubscriptions} Watchman subscriptions.`);
    let numRestored = 0;
    await Promise.all(watchSubscriptions.map(async (subscription, index) => {
      // Note that this call to `watchman watch-project` could fail if the
      // subscription.path has been unmounted/deleted.
      await this._watchProject(subscription.path); // We have already missed the change events from the disconnect time,
      // watchman could have died, so the last clock result is not valid.

      await (0, _promise().sleep)(WATCHMAN_SETTLE_TIME_MS); // Register the subscriptions after the filesystem settles.

      const {
        name,
        options,
        root
      } = subscription;
      subscription.options.since = await this._clock(root);
      logger.info(`Subscribing to ${name}: (${index + 1}/${numSubscriptions})`);
      await this._subscribe(root, name, options);
      ++numRestored;
      logger.info(`Subscribed to ${name}: (${numRestored}/${numSubscriptions}) complete.`);
      this._reconnectDelayMs = DEFAULT_WATCHMAN_RECONNECT_DELAY_MS;
    }));
  }

  _getSubscription(entryPath) {
    return this._subscriptions.get(_nuclideUri().default.normalize(entryPath));
  }

  _setSubscription(entryPath, subscription) {
    this._subscriptions.set(_nuclideUri().default.normalize(entryPath), subscription);
  }

  _deleteSubscription(entryPath) {
    this._subscriptions.delete(_nuclideUri().default.normalize(entryPath));
  }

  _onSubscriptionResult(response) {
    const subscription = this._getSubscription(response.subscription);

    if (subscription == null) {
      logger.error('Subscription not found for response:!', response);
      return;
    }

    if (Array.isArray(response.files)) {
      subscription.emit('change', response.files);
    } else if (response.canceled === true) {
      logger.info(`Watch for ${response.root} was deleted: triggering a reconnect.`); // Ending the client will trigger a reconnect.

      this._clientPromise.then(client => client.end());
    } else {
      // TODO(most): use state messages to decide on when to send updates.
      const stateEnter = response['state-enter'];
      const stateLeave = response['state-leave'];
      const stateMessage = stateEnter != null ? `Entering ${stateEnter}` : `Leaving ${(0, _string().maybeToString)(stateLeave)}`;
      logger.info(`Subscription state: ${stateMessage}`);
    }
  }

  async watchDirectoryRecursive(localDirectoryPath, subscriptionName = localDirectoryPath, subscriptionOptions) {
    const existingSubscription = this._getSubscription(subscriptionName);

    if (existingSubscription) {
      existingSubscription.subscriptionCount++;
      return existingSubscription;
    } else {
      const {
        watch: watchRoot,
        relative_path: relativePath
      } = await this._watchProject(localDirectoryPath);
      const clock = await this._clock(watchRoot);
      const options = Object.assign({}, subscriptionOptions, {
        fields: ['name', 'new', 'exists', 'mode'],
        since: clock
      });

      if (relativePath) {
        options.relative_root = relativePath;
      } // Try this thing out where we always set empty_on_fresh_instance. Eden will be a lot happier
      // if we never ask Watchman to do something that results in a glob(**) near the root.


      options.empty_on_fresh_instance = true; // relativePath is undefined if watchRoot is the same as directoryPath.

      const subscription = new (_WatchmanSubscription().default)(
      /* subscriptionRoot */
      watchRoot,
      /* pathFromSubscriptionRootToSubscriptionPath */
      relativePath,
      /* subscriptionPath */
      localDirectoryPath,
      /* subscriptionName */
      subscriptionName,
      /* subscriptionCount */
      1,
      /* subscriptionOptions */
      options);

      this._setSubscription(subscriptionName, subscription);

      await this._subscribe(watchRoot, subscriptionName, options);
      return subscription;
    }
  }

  hasSubscription(entryPath) {
    return Boolean(this._getSubscription(entryPath));
  }

  async unwatch(entryPath) {
    const subscription = this._getSubscription(entryPath);

    if (subscription == null) {
      logger.error('No watcher entity found with path:', entryPath);
      return;
    }

    if (--subscription.subscriptionCount === 0) {
      await this._unsubscribe(subscription.path, subscription.name);

      this._deleteSubscription(entryPath);
    }
  }
  /**
   * List all (watched) files in the given directory.
   * Paths will be relative.
   */


  async listFiles(entryPath, options = {}) {
    const {
      watch,
      relative_path
    } = await this._watchProject(entryPath);
    const result = await this._command('query', watch, Object.assign({
      expression: ['allof', ['type', 'f'], // all files
      ['exists']],
      // Providing `path` will let watchman use path generator, and will perform
      // a tree walk with respect to the relative_root and path provided.
      // Path generator will do less work unless the root path of the repository
      // is passed in as an entry path.
      path: [''],
      fields: ['name'],
      // names only
      relative_root: relative_path
    }, options));
    return result.files;
  }

  async _watchList() {
    const {
      roots
    } = await this._command('watch-list');
    return roots;
  }

  _unsubscribe(subscriptionPath, subscriptionName) {
    return this._command('unsubscribe', subscriptionPath, subscriptionName);
  }

  async _watch(directoryPath) {
    const response = await this._command('watch', directoryPath);

    if (response.warning) {
      logger.error('watchman warning: ', response.warning);
    }
  }

  async _watchProject(directoryPath) {
    const response = await this._command('watch-project', directoryPath);

    if (response.warning) {
      logger.error('watchman warning: ', response.warning);
    }

    return response;
  }

  async _clock(directoryPath) {
    const {
      clock
    } = await this._command('clock', directoryPath);
    return clock;
  }

  _subscribe(watchRoot, subscriptionName, options) {
    logger.info(`Creating Watchman subscription ${String(subscriptionName)} under ${watchRoot}`, JSON.stringify(options));
    return this._command('subscribe', watchRoot, subscriptionName, options);
  }
  /*
   * Promisify calls to watchman client.
   */


  _command(...args) {
    return new Promise((resolve, reject) => {
      this._clientPromise.then(client => {
        client.command(args, (error, response) => error ? reject(error) : resolve(response));
      }).catch(reject);
    });
  }

}

exports.default = WatchmanClient;