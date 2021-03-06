"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function _passesGK() {
  const data = _interopRequireDefault(require("../commons-node/passesGK"));

  _passesGK = function () {
    return data;
  };

  return data;
}

function _promise() {
  const data = require("../../modules/nuclide-commons/promise");

  _promise = function () {
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
 *  strict-local
 * @format
 */
function track(request, responsePromise) {
  return responsePromise.then(response => response == null ? null : {
    request,
    response
  });
}

class AutocompleteCacher {
  constructor( // If getSuggestions returns null or undefined, it means that we should not filter that result
  // to serve later queries, even if shouldFilter returns true. If there are truly no results, it
  getSuggestions, config) {
    this._getSuggestions = async request => {
      const results = await getSuggestions(request);
      return config.updateFirstResults == null || results == null ? results : config.updateFirstResults(request, results);
    };

    this._config = config;

    this._setEnabled();
  }

  async _setEnabled() {
    const gk = this._config.gatekeeper;

    if (gk == null) {
      this._enabled = true;
    } else {
      this._enabled = false;
      this._enabled = await (0, _passesGK().default)(gk);
    }
  }

  getSuggestions(request) {
    if (!this._enabled) {
      return this._getSuggestions(request);
    }

    const session = this._session;

    if (session != null && this._canMaybeFilterResults(session, request)) {
      const state = session.firstResultPromise.getState();

      if (state.kind === 'fulfilled' && state.value != null) {
        // Maybe an earlier request had already resolved to not-null so we can use
        // it right now, synchronously?
        const firstResult = state.value;

        const result = this._config.updateResults(firstResult.request, request, firstResult.response);

        if (result != null) {
          this._session = Object.assign({}, this._session, {
            lastRequest: request
          });
          return Promise.resolve(result);
        }
      } // If it hasn't already resolved, or if it had resolved to not-null,
      // or if the updateResults function decided synchronously that it wasn't
      // able to do anything, then in all cases we'll send an additional request
      // speculatively right now (to reduce overall latency) and defer the
      // decision about whether to use the existing response or
      // the speculative one.


      const resultFromLanguageService = this._getSuggestions(request);

      const result = this._filterSuggestionsIfPossible(request, session, resultFromLanguageService);

      this._session = {
        firstResultPromise: new (_promise().PromiseWithState)(getNewFirstResult(session.firstResultPromise.getPromise(), track(request, resultFromLanguageService))),
        lastRequest: request
      };
      return result;
    } else {
      const result = this._getSuggestions(request);

      this._session = {
        firstResultPromise: new (_promise().PromiseWithState)(track(request, result)),
        originalRequest: request,
        lastRequest: request
      };
      return result;
    }
  }

  async _filterSuggestionsIfPossible(request, session, resultFromLanguageService) {
    const firstResult = await session.firstResultPromise.getPromise();

    if (firstResult != null) {
      const updated = this._config.updateResults(firstResult.request, request, firstResult.response);

      if (updated != null) {
        return updated;
      }
    }

    return resultFromLanguageService;
  } // This doesn't guarantee we can filter results -- if the previous result turns out to be null, we
  // may still have to use the results from the language service.


  _canMaybeFilterResults(session, currentRequest) {
    const {
      lastRequest
    } = session;
    const shouldFilter = this._config.shouldFilter != null ? this._config.shouldFilter : defaultShouldFilter;
    const charsSinceLastRequest = currentRequest.bufferPosition.column - lastRequest.bufferPosition.column;
    return lastRequest.bufferPosition.row === currentRequest.bufferPosition.row && charsSinceLastRequest > 0 && shouldFilter(lastRequest, currentRequest, charsSinceLastRequest);
  }

}

exports.default = AutocompleteCacher;

async function getNewFirstResult(firstResultPromise, resultFromLanguageService) {
  const firstResult = await firstResultPromise;

  if (firstResult != null) {
    return firstResult;
  } else {
    return resultFromLanguageService;
  }
}

const IDENTIFIER_REGEX = /^[a-zA-Z_]+$/;

function defaultShouldFilter(lastRequest, currentRequest, charsSinceLastRequest) {
  // This function's goal is to check whether the currentRequest represents
  // additional typing to do further filtering, or whether it represents an
  // entirely new autocomplete request.
  // It does this by checking the request.prefix that AutocompletePlus had
  // computed for the previous request vs the currentRequest. How
  // AutocompletePlus computes this prefix is via a 'word regex' to see what
  // word the caret is on, and take the portion of it to the left of the caret.
  // Its word regex is roughly [a-zA-Z0-9_-]+. If the currentRequest.prefix
  // is strictly longer than the lastRequest.prefix, by the right number
  // of characters, then we should continue to do further filtering.
  // NOTE: the prefix computed by AutocompletePlus is not necessarily the
  // replacementPrefix that will be used if the user accepts a suggestion.
  // And it's not necessarily appropriate for the language (e.g. flow
  // disallows hyphens, and php allows $). But that doesn't matter. We're merely
  // using it as a convenient consistent source of a good enough word regex.
  // We do further filtering to only accept [a-zA-Z_], so no numerals or
  // hyphens. This makes us very conservative. When we're too conservative
  // (e.g. always failing to cache for identifiers that have numerals or
  // hyphens), the only bad effect is more autocomplete requests to the
  // language server than is strictly necessary.
  return currentRequest.prefix.startsWith(lastRequest.prefix) && currentRequest.prefix.length === lastRequest.prefix.length + charsSinceLastRequest && IDENTIFIER_REGEX.test(currentRequest.prefix);
}