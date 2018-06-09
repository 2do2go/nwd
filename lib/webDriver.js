'use strict';

var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	utils = require('./utils'),
	errors = require('./errors'),
	WebElement = require('./webElement').WebElement,
	_ = require('underscore');

function returnSelf(callback, self) {
	return function(err) {
		callback(err, self);
	};
}

/**
 * Driver constructor
 * @class WebDriver
 * @param {String} [params.host] Target selenium host
 * @param {Number} [params.port] Target selenium port
 * @param {Object} [params.desiredCapabilities] Desired capabilities which will
 * passed to the selenium server
 * @param {Object} [params.timeouts] Timeouts object which will be set using
 * `setTimeouts` method
 * @param {Object} [params.defaults] Default values for different methods
 * parameters (e.g. params.defaults.using will be used by `get`, `getList`,
 * `waitForElement`, etc)
 */
function WebDriver(params) {
	params = params || {};
	this.requestParams = {
		host: params.host || '127.0.0.1',
		port: params.port || 4444,
		method: params.method || 'POST'
	};
	this.sessionBasePath = '/wd/hub/session';
	this.desiredCapabilities = utils.extend({
		browserName: 'firefox',
		version: '',
		javascriptEnabled: true,
		platform: 'ANY'
	}, params.desiredCapabilities);
	this.defaults = utils.extend({
		using: 'css selector'
	}, params.defaults);
	this.logMethodCalls = params.logMethodCalls;
	this.timeouts = utils.extend({
		// protocol timeouts
		'page load': 3500,
		script: 1000,
		implicit: 0,
		// extended timeouts
		waitFor: 3000
	}, params.timeouts);
	this._protocolTimeoutsHash = {'page load': 1, script: 1, implicit: 1};

	this._initElement();
}

WebDriver.prototype._initElement = function() {
	var self = this;
	/**
	 * element object combines {@link WebDriver#get} with {@link WebElement}
	 * methods. So you can call any {@link WebElement} method
	 * with selector and params (optionally). Same parameters as for normal
	 * {@link WebElement} method call will be passed to the callback.
	 * Internally {@link WebDriver#get} then target method of {@link WebElement}
	 * will be called therefore if you need to call several methods on same
	 * element it make sense(due performance) to get element and then call it's
	 * methods.
	 *
	 * @example
	 * // driver is an instance of WebDriver
	 * driver.element.sendKeys(
	 *   '[name="user[login]"]',
	 *   'patrik',
	 *   function(err, element) {
	 *     // element is WebElement which was get
	 *   }
	 * );
	 *
	 * @example
	 * // driver is an instance of WebDriver
	 * driver.element.getValue('[name="user[login]"]', function(err, login) {
	 *   // login equals to 'patrik'
	 * });
	 *
	 * @name element
	 * @type {Object}
	 * @instance
	 * @memberOf WebDriver
	 */
	self.element = {};
	Object.keys(WebElement.prototype).forEach(function(method) {
		if (/^_/.test(method)) return;
		self.element[method] = function(selector, params) {
			var getArgs, methodArgs;
			if (utils.isSelectorParams(params)) {
				getArgs = [selector, params];
				methodArgs = Array.prototype.slice.call(arguments, 2);
			} else {
				getArgs = [selector];
				methodArgs = Array.prototype.slice.call(arguments, 1);
			}

			var callback = methodArgs[methodArgs.length - 1];
			getArgs.push(function(err, element) {
				if (err) return callback(err);
				element[method].apply(element, methodArgs);
			});

			self.get.apply(self, getArgs);
		};
	});
};

//strip function from https://github.com/Camme/webDriver
// strip the content from unwanted characters
WebDriver.prototype._strip = function(str) {
	var x = [],
		i = 0,
		il = str.length;

	for (i; i < il; i++) {
		if (str.charCodeAt(i)) {
			x.push(str.charAt(i));
		}
	}
	return x.join('');
};

WebDriver.prototype._cmd = function(params, callback) {
	var self = this,
		stringData = params.data ? JSON.stringify(params.data) : null,
		buferData = stringData ? new Buffer(stringData, 'utf8') : null,
		requestParams = {
			host: this.requestParams.host,
			port: this.requestParams.port,
			path: this.sessionBasePath + params.path,
			method: params.method || this.requestParams.method,
			headers: {
				'Content-Type': 'application/json; charset=UTF-8',
				'Content-Length': buferData ? buferData.length : 0
			},
			data: buferData
		};

	request(requestParams, function(err, res) {
		if (err) return callback(err);
		res.data = res.data ? self._strip(res.data.toString()) : '{}';

		try {
			res.data = JSON.parse(res.data);
		} catch(err) {
			return callback(new errors.ProtocolError(
				'Can`t parse json from response of ' + params.path +
				': ' + err.message + '\n Raw response data: ' + res.data
			));
		}
		//status 0 - success, error otherwise
		if (res.data && res.data.status) {
			var errorConstructor = errors.getProtocolErrorContructor(res.data.status);
			return callback(new errorConstructor());
		}
		// return `res` if it needed, otherwise `res.data.value`
		if (params.path === '/refresh') {
			callback(null, params.resNeeded ? res : res.data.value, true);
		} else {
			callback(null, params.resNeeded ? res : res.data.value);
		}
	});
};

function request(params, callback) {
	var req = http.request(params, function(res) {
		var data = '';
		res.setEncoding('utf8');
		res.on('data', function(chunk) { data += chunk; });
		res.on('end', function() {
			res.data = data;
			callback(null, res);
		});
	});
	req.on('error', function(err) {
		callback(err);
	});
	req.end(params.data ? params.data : null);
}

/**
 * Start driver session and return driver
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.init = function(callback) {
	var self = this;
	self._cmd({
		path: '',
		data: {desiredCapabilities: self.desiredCapabilities},
		resNeeded: true
	}, function(err, res) {
		if (err) return callback(err);
		// ghostdriver returns session id at data
		if (res.data.sessionId) {
			self.sessionId = res.data.sessionId;
		} else if (res.headers && res.headers.location) {
		// chrome, ff and maybe others return session id at location header
			var locationParts = res.headers.location.split('/');
			self.sessionId = locationParts[locationParts.length - 1];
		} else {
			return callback(new Error('Can`t determine session id'));
		}
		self.sessionBasePath = self.sessionBasePath + '/' + self.sessionId;
		self.setTimeouts(self.timeouts, returnSelf(callback, self));
	});
};

/**
 * End current driver session
 * @param {Function} callback(err:Error)
 */
WebDriver.prototype.deleteSession = function(callback) {
	this._cmd({path: '', method: 'DELETE'}, returnSelf(callback, this));
};

/**
 * Navigate to url
 * @param {String} url
 * @param {Function} callback(err:Error)
 */
WebDriver.prototype.setUrl = function(url, callback) {
	this._cmd({path: '/url', data: {url: url}}, returnSelf(callback, this));
};

/**
 * Get url of current page
 * @param {Function} callback(err:Error,url:String)
 */
WebDriver.prototype.getUrl = function(callback) {
	return this._cmd({path: '/url', method: 'GET'}, callback);
};

/**
 * Get title of current page
 * @param {Function} callback(err:Error,title:String)
 */
WebDriver.prototype.getTitle = function(callback) {
	return this._cmd({path: '/title', method: 'GET'}, callback);
};

var sweetenCssSelector = function(value) {
	value = value.replace(
		/:visible/g,
		':not([style*="display:none"]):not([style*="display: none"])'
	);
	value = value.replace(
		/:hidden/g,
		'[style*="display:none"],[style*="display: none"],' +
		'[style*="opacity: 0"],[style*="opacity:0"]'
	);
	return value;
};

var injections = {
	/*jshint ignore:start*/
	getElementsFn: utils.getInjectionSource(function() {
		//getting elements by jquery `selector`
		window.___nwdGetElements = function(selector, parent, chain, cssFilter) {
			cssFilter = cssFilter || {};
			var elements = null;
			var $ = window.___nwdJquery;
			elements = parent ? $(selector, parent) : $(selector);

			if (elements && elements.length && chain) {
				$.each(chain, function(index, object) {
					var func = null, args = null;

					//get function and arguments
					$.each(object, function(key, value) {
						func = key;
						args = value;
						return;
					});

					//wrap arguments into array if needed
					args = $.isArray(args) ? args : [args];

					if (!elements[func]) {
						throw new Error('Unknown jquery method: ' + func);
					}

					elements = elements[func].apply(elements, args);
				});
			}

			if (elements && elements.length && cssFilter) {
				elements = elements.filter(function(index, element) {
					var allFiltersMatch = true;

					for (var prop in cssFilter) {
						if ($(element).css(prop) !== cssFilter[prop]) {
							allFiltersMatch = false;
							break;
						}
					}

					return allFiltersMatch;
				});
			}

			return elements && elements.length ? elements.get() : [];
		};
	}),
	checkJqueryFn: utils.getInjectionSource(function() {
		return typeof window.___nwdJquery === 'function';
	}),
	checkGetElementsFn: utils.getInjectionSource(function() {
		return typeof window.___nwdGetElements === 'function';
	}),
	getElements: utils.getInjectionSource(function() {
		return window.___nwdGetElements.apply(null, arguments);
	}),
	waitForDocumentReady: utils.getInjectionSource(function() {
		var timeout = arguments[0],
			callback = arguments[1];

		var $ = window.___nwdJquery;

		var timeoutHandle = setTimeout(function() {
			callback(false);
		}, timeout);

		$(document).ready(function() {
			clearTimeout(timeoutHandle);
			callback(true);
		});
	}),
	/*jshint ignore:end*/
	jqueryFn: (
		'(function() { ' +
			fs.readFileSync(path.resolve(__dirname, '..', 'injections', 'jquery.js')) +
		' })();'
	)
};

WebDriver.prototype._injectJqueryIfNotExists = function(callback) {
	var self = this;

	this.execute(injections.checkJqueryFn, [], false, function(err, exists) {
		if (err) return callback(err);

		if (exists) {
			callback(null);
		} else {
			self.execute(injections.jqueryFn, [], false, callback);
		}
	});
};

WebDriver.prototype._injectGetElementsIfNotExists = function(callback) {
	var self = this;

	this._injectJqueryIfNotExists(function(err) {
		if (err) return callback(err);

		self.execute(injections.checkGetElementsFn, [], false, function(err, exists) {
			if (err) return callback(err);

			if (exists) {
				callback(null);
			} else {
				self.execute(injections.getElementsFn, [], false, callback);
			}
		});
	});
};

//strategy for getting elements via client jquery
var jqueryGetElementIds = function(selector, params, callback) {
	var self = this;

	this._injectGetElementsIfNotExists(function(err) {
		if (err) return callback(err);

		self.execute(
			injections.getElements,
			[
				selector,
				params.parentId ? {ELEMENT: params.parentId} : null,
				params.chain,
				params.cssFilter
			],
			false,
			function(err, result) {
				if (err) return callback(err);

				var elements = result;

				elements = elements.map(function(element) {
					return element.ELEMENT;
				});

				if (!elements.length) {
					if (params.isSingle) {
						callback(new errors.NoSuchElementError({
							element: selector,
							using: params.using
						}));
					} else {
						callback(null, []);
					}
				} else {
					callback(null, elements);
				}
			}
		);
	});
};

var customStrategyHash = {
	jquery: jqueryGetElementIds
};

/**
 * Get element from current page.
 * Error will be returned if no such element on the page.
 * @param {String} selector Element selector
 * @param {Object} [params]
 * @param {Boolean} [params.noError] If true then null will be passed to
 * callback instead of timeout error.
 * @param {String} [params.using] Strategy for selector (e.g. 'css selector',
 * 'jquery'), this.defaults.using will be used by default.
 * @param {Object[]} [params.chain] Traversing functions chain for jquery
 * strategy e.g. '[{closest: 'span'}, {next: 'div'}]'
 * @param {Object} [params.cssFilter] Object with css properties and values for
 * filter result elements (using jquery.css method) e.g. '{opacity: '1'}'
 * @param {Function} callback(err:Error,element:WebElement)
 */
WebDriver.prototype.get = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	var self = this;
	params.isSingle = true;
	this._getIds(selector, params, function(err, id) {
		callback(err, !err && id && new WebElement(id, self));
	});
};

/**
 * Get elements from current page.
 * Empty array will be returned if no such elements on the page.
 * `selector` and `params` could accept same values as at {@link WebDriver#get}.
 * @param {String} selector
 * @param {Object} [params]
 * @param {Function} callback(err:Error,element:WebElement[])
 */
WebDriver.prototype.getList = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	var self = this;
	params.isSingle = false;
	return this._getIds(selector, params, function(err, ids) {
		callback(err, !err && ids.map(function(id) {
			return new WebElement(id, self);
		}));
	});
};

// returns single element or list depending on `params.isSingle`
WebDriver.prototype._getIds = function(selector, params, callback) {
	params = !utils.isFunction(params) ? params : {};
	callback = utils.isFunction(params) ? params : callback;
	// transform params.parent to params.parent.id
	if (params.parent && !(params.parent instanceof WebElement)) {
		throw new Error('Parent should be instanceof WebElement');
	}
	if (params.parent) {
		params.parentId = params.parent.id;
		delete params.parent;
	}

	params.using = params.using || this.defaults.using;
	var customStrategy = customStrategyHash[params.using];
	if (customStrategy) {
		return customStrategy.call(this, selector, params, function(err, elements) {
			if (err && params.noError && err instanceof errors.NoSuchElementError) {
				return callback(null, null);
			}

			callback(
				parametrizeError(err),
				!err && (params.isSingle ? elements[0] : elements)
			);
		});
	} else {
		var plural = params.isSingle ? '' : 's';
		var parentPath = params.parentId ? (
			'/' + params.parentId + '/element' + plural
		) : plural;
		this._cmd({
			path: '/element' + parentPath,
			method: 'POST',
			data: {
				using: params.using,
				value: sweetenCssSelector(selector)
			}
		}, function(err, value) {
			if (err && params.noError && err instanceof errors.NoSuchElementError) {
				return callback(null, null);
			}

			callback(
				parametrizeError(err),
				!err && (params.isSingle ? value.ELEMENT : value.map(function(item) {
					return item.ELEMENT;
				}))
			);
		});
	}

	function parametrizeError(err) {
		if (!err) return err;
		err.parametrize({element: selector, using: params.using});
		return err;
	}
};

/**
 * Set timeout
 * @param {String} type
 * @param {Number} timeout timeout in ms
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.setTimeout = function(type, timeout, callback) {
	var self = this;
	if (type in this._protocolTimeoutsHash) {
		this._cmd({
			path: '/timeouts',
			method: 'POST',
			data: {type: type, ms: timeout}
		}, function(err) {
			if (err) return callback(err);
			self.timeouts[type] = timeout;
			callback(null, self);
		});
	} else {
		self.timeouts[type] = timeout;
		callback(null, self);
	}
};

/**
 * Set timeouts
 * @param {Object} timeout Object key - timeout type, value - timeout
 * value in ms
 * @param {Function} callback(err:Error)
 */
WebDriver.prototype.setTimeouts = function(timeouts, callback) {
	var count = Object.keys(timeouts).length,
		current = 0;
	function callbackWrapper(err) {
		if (err) return callback(err);
		current++;
		if (current === count) callback();
	}
	for (var type in timeouts) {
		this.setTimeout(type, timeouts[type], callbackWrapper);
	}
};

/**
 * Get timeout by type
 * @param {String} type
 * @param {Function} callback(err:Error,timeout:Number)
 */
WebDriver.prototype.getTimeout = function(type, callback) {
	callback(null, this.timeouts[type]);
};

/**
 * Inject a snippet of JavaScript into the page for execution in the context of
 * the currently selected frame.
 * @param {String} script
 * @param {Any[]} args Script arguments
 * @param {Boolean} isAsync
 * @param {Function} callback(err:Error)
 */
WebDriver.prototype.execute = function(script, args, isAsync, callback) {
	if (utils.isFunction(isAsync)) {
		callback = isAsync;
		isAsync = false;
	}
	if (utils.isFunction(script)) script = utils.getInjectionSource(script);
	this._cmd({
		path: '/execute' + (isAsync ? '_async' : ''),
		method: 'POST',
		data: {script: script, args: args || []}
	}, callback);
};

/**
 * Wait for element appear on current page and return it.
 * `selector` and `params` could accept same values as at `get`.
 * @param {String} selector
 * @param {Object} [params]
 * @param {Function} callback(err:Error,element:WebDriver)
 */
WebDriver.prototype.waitForElement = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	var self = this;
	self.waitFor(
		function(waitCallback) {
			self.get(selector, params, function(err, element) {
				if (err && (err instanceof errors.NoSuchElementError)) err = null;
				waitCallback(err, Boolean(element));
			});
		}, {
			noError: params.noError,
			errorMessage: 'waiting for element ' + selector,
			timeout: params.timeout || self.timeouts.waitForElement
		},
		callback
	);
};

/**
 * Wait until element will not be on page.
 * `selector` and `params` could accept same values as at `get`.
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.waitForElementAbsent =
	function(selector, params, callback) {
		callback = utils.isFunction(params) ? params : callback;
		params = !utils.isFunction(params) ? params : {};
		var self = this;
		this.get(
			selector,
			utils.extend({noError: true}, params),
			function(err, element) {
				if (err) return callback(err);
				if (!element) return callback(null, self);
				element.waitForDisappear(callback);
			}
		);
	};

/**
 * Wait for url change from `oldUrl` to `newUrl`.
 * Query string is not involved in url comparation.
 * @param {String|RegExp} oldUrl Old url (will be ignored if falsy)
 * @param {String|RegExp} newUrl New url (will be ignored if falsy)
 * @param {Object} [params]
 * @param {Boolean} [params.omitQueryString=false]
 * the parameter determines whether the current and expected new URL
 * will be checked without querystring
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.waitForUrlChange =
	function(oldUrl, newUrl, params, callback) {
		if (utils.isFunction(params)) {
			callback = params;
			params = {};
		}

		params = _({
			omitQueryString: false
		}).extend(params);

		var self = this;

		if (!oldUrl && !newUrl) return callback(new Error(
			'Both of new and old url can`t be falsy.'
		));

		if (params.omitQueryString) {
			newUrl = newUrl.replace(/\?.*$/, '');
		}

		self.waitFor(
			function(waitCallback) {
				self.getUrl(function(err, url) {
					if (err) return waitCallback(err);

					if (params.omitQueryString) {
						// remove query string
						url = url.replace(/\?.*$/, '');
					}

					waitCallback(
						null,
						(utils.isRegExp(oldUrl) ? !oldUrl.test(url) : oldUrl !== url) &&
							(!newUrl || (utils.isRegExp(newUrl) ? newUrl.test(url) : newUrl === url))
					);
				});
			}, {
				errorMessage: 'waiting for url change' +
					(oldUrl ? ' from ' + oldUrl : '') +
					(newUrl ? ' to ' + newUrl : ''),
				timeout: self.timeouts.waitForUrlChange
			},
			callback
		);
	};

/**
 * Wait for redirect to `newUrl`.
 * Query string is not involved in url comparation.
 * @param {String|RegExp} newUrl New url
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.waitForRedirect = function(newUrl, callback) {
	this.waitForUrlChange({
		oldUrl: '',
		newUrl: newUrl
	}, callback);
};

/**
 * Wait for document ready (jquery).
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.waitForDocumentReady = function(callback) {
	var self = this;

	this._injectJqueryIfNotExists(function(err) {
		if (err) return callback(err);

		self.execute(
			injections.waitForDocumentReady,
			[self.timeouts.waitFor],
			true,
			function(err, result) {
				if (err) return callback(err);

				if (result === true) {
					callback(null, self);
				} else {
					callback(new Error(
						result === false ?
						'Timeout exceeded while waiting for document ready' :
						('Unexpected result while waiting for document ready: ' + result)
					));
				}
			}
		);
	});
};


/**
 * Wait until waitcb from `func(waitcb)` will be called with `true` or until
 * `params.timeout` (if not set `this.timeouts.waitFor` will be used) expired
 * (in this case error with `params.errorMessage` will be passed to callback,
 * if `params.noError` is not true).
 * Note: co version of the driver has similar method - `yieldUntil`.
 */
WebDriver.prototype.waitFor = function(func, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};

	var self = this,
		timeout = params.timeout || self.timeouts.waitFor,
		delay = 20;

	var executeTimeoutHandle = null,
		waitTimeoutHandle = null;

	//TODO: refactor function that use this variable
	var isWaitingTimeExpired = false;

	var clearTimeouts = function() {
		if (executeTimeoutHandle) {
			clearTimeout(executeTimeoutHandle);
			executeTimeoutHandle = null;
		}

		if (waitTimeoutHandle) {
			clearTimeout(waitTimeoutHandle);
			waitTimeoutHandle = null;
		}
	};

	var execute = function() {
		func(function(err, done) {
			if (isWaitingTimeExpired) {
				return;
			}

			if (err) {
				clearTimeouts();
				return callback(err);
			}

			if (done) {
				clearTimeouts();
				callback(null, self);
			} else {
				executeTimeoutHandle = setTimeout(execute, delay);
			}
		});
	};

	waitTimeoutHandle = setTimeout(function() {
		isWaitingTimeExpired = true;

		callback(params.noError ? null : new Error(
			'Timeout (' + timeout + ' ms) exceeded' +
			(params.errorMessage ? ' while ' + params.errorMessage : '')
		));
	}, timeout);

	execute();
};

WebDriver.prototype.getCookie = function(name) {
	return this._cmd({
		path: name ? '/cookie/' + name : '/cookie',
		method: 'GET'
	});
};

/**
 * Delete all cookies or cookie with given name.
 * @param {String} [name]
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.deleteCookie = function(name, callback) {
	if (typeof name === 'function') {
		callback = name;
		name = null;
	}
	this._cmd({
		path: name ? '/cookie/' + name : '/cookie',
		method: 'DELETE'
	}, returnSelf(callback, this));
};

/**
 * Make screenshot and save it to target path.
 * @param {String} path
 * @param {Function} callback(err:Error)
 */
WebDriver.prototype.makeScreenshot = function(path, callback) {
	this._cmd({
		path: '/screenshot',
		method: 'GET'
	}, function(err, res) {
		if (err) return callback(err);
		//convert base64 to binary
		var data = new Buffer(res, 'base64').toString('binary');
		fs.writeFile(path, data, 'binary', callback);
	});
};

/**
 * Maximize current window.
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.maximizeWindow = function(callback) {
	this._cmd({
		path: '/window/current/maximize',
		method: 'POST'
	}, returnSelf(callback, this));
};

/**
 * Navigate backwards in the browser history, if possible.
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.back = function(callback) {
	this._cmd({path: '/back', method: 'POST'}, returnSelf(callback, this));
};

/**
 * Navigate forwards in the browser history, if possible.
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.forward = function(callback) {
	this._cmd({path: '/forward', method: 'POST'}, returnSelf(callback, this));
};

/**
 * Refresh the current page.
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.refresh = function(callback) {
	this._cmd({path: '/refresh', method: 'POST'}, returnSelf(callback, this));
};

var mouseButtons = {
	left: 0,
	middle: 1,
	right: 2
};

/**
 * Click and hold mouse button (at the coordinates set by the last
 * moveto command). Note that the next mouse-related command that should
 * follow is buttonup . Any other mouse command (such as click or another
 * call to buttondown) will yield undefined behaviour.
 * @param {String} [button] Could be left, middle or right(left used by default)
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.mouseDown = function(button, callback) {
	callback = utils.isFunction(button) ? button : callback;
	button = !utils.isFunction(button) ? button : 'left';
	this._cmd({
		path: '/buttondown',
		method: 'POST',
		data: {button: mouseButtons[button]}
	}, returnSelf(callback, this));
};

/**
 * Releases the mouse button previously held (where the mouse is currently at).
 * Must be called once for every buttondown command issued. See the note in
 * click and buttondown about implications of out-of-order commands.
 * @param {String} [button] Could be left, middle or right(left used by default)
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.mouseUp = function(button, callback) {
	callback = utils.isFunction(button) ? button : callback;
	button = !utils.isFunction(button) ? button : 'left';
	this._cmd({
		path: '/buttonup',
		method: 'POST',
		data: {button: mouseButtons[button]}
	}, returnSelf(callback, this));
};

/**
 * Click any mouse button (at the coordinates set by the last moveto command).
 * Note that calling this command after calling buttondown and before calling
 * button up (or any out-of-order interactions sequence) will yield undefined
 * behaviour).
 * @param {String} [button] Could be left, middle or right(left used by default)
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.click = function(button, callback) {
	callback = utils.isFunction(button) ? button : callback;
	button = !utils.isFunction(button) ? button : 'left';
	this._cmd({
		path: '/click',
		method: 'POST',
		data: {button: mouseButtons[button]}
	}, returnSelf(callback, this));
};

/**
 * Send a sequence of key strokes to the active element.
 * @param {String} value
 * @param {Function} callback(err:Error,driver:WebDriver)
 */
WebDriver.prototype.sendKeys = function(value, callback) {
	this._cmd({
		path: '/keys',
		method: 'POST',
		data: {value: utils.replaceKeyStrokesWithCodes(value).split('')}
	}, returnSelf(callback, this));
};

WebDriver.prototype.getLog = function(type, callback) {
	this._cmd({
		path: '/log',
		method: 'POST',
		data: {type: type}
	}, callback);
};

/**
 * Retrieve the capabilities of the current session
 * @param {Function} callback(err:Error,capabilities:Object)
 */
WebDriver.prototype.getCapabilities = function(callback) {
	this._cmd({path: '', method: 'GET'}, callback);
};

utils.loggify(WebDriver.prototype, 'WebDriver');

exports.WebDriver = WebDriver;
