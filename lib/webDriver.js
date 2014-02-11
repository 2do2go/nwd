'use strict';

var http = require('http'),
	fs = require('fs'),
	path = require('path'),
	utils = require('./utils'),
	errors = require('./errors'),
	WebElement = require('./webElement').WebElement;

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
	this._timeoutTypeHash = {};
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

WebDriver.prototype.sleep = function(ms) {
	var curr = new Date().getTime();
	ms += curr;
	while (curr < ms) {
		curr = new Date().getTime();
	}
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
	var req = request(requestParams, function(err, res) {
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
		// return `res` if it needed, otherwise `res.data.value` or `this` (for
		// chaining)
		var value = res.data.value;
		callback(null, params.resNeeded ? res : (
			// ghostdriver can return value with null or empty object
			value !== undefined && value !== null && (Array.isArray(value) ||
			!utils.isObject(value) || !utils.isEmptyObject(value))
				? res.data.value : self
		));
	});
};

function request(params, callback) {
	var req = http.request(params, function(res) {
		var data = '';
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

WebDriver.prototype.init = function(callback) {
	var self = this;
	self._cmd({
		path: '',
		data: {
			desiredCapabilities: self.desiredCapabilities
		},
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
		callback(null, self);
	});
};

WebDriver.prototype.deleteSession = function(callback) {
	this._cmd({path: '', method: 'DELETE'}, callback);
};

WebDriver.prototype.setUrl = function(url, callback) {
	this._cmd({path: '/url', data: {url: url}}, callback);
};

WebDriver.prototype.getUrl = function(callback) {
	return this._cmd({path: '/url', method: 'GET'}, callback);
};

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

var jqueryInjection = 'function ___nwdJquery() {' +
	fs.readFileSync(path.resolve(
		__dirname, '..', 'injections', 'jquery.min.js'
	)) + 
'}';

var jqueryGetElementsInjection = utils.getInjectionSource(function() {
	//getting elements by jquery `selector`
	function ___nwdJqGetElements(selector, chain) {
		var elements = null;
		var $ = window.___nwdJquery;
		elements = $(selector);
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
		return elements && elements.length ? elements.get() : [];
	}
});

var jqueryAndGetElementsInjection = jqueryInjection + jqueryGetElementsInjection;

//strategy for getting elements via client jquery
var jqueryGetElementIds = function(selector, params, callback) {
	var self = this;
	function execute(addInjection) {
		self.execute(
			(addInjection || '') + utils.getInjectionSource(function() {
				if (typeof window.___nwdJquery !== 'function') {
					if (typeof ___nwdJquery !== 'function') return 'needJquery';
					___nwdJquery();
					window.___nwdJquery = jQuery.noConflict(true);
				}
				if (typeof window.___nwdJqGetElements !== 'function') {
					if (typeof ___nwdJqGetElements !== 'function') return 'needFunc';
					window.___nwdJqGetElements = ___nwdJqGetElements;
				}
				return ___nwdJqGetElements(arguments[0], arguments[1]);
			}),
			[selector, params.chain],
			false,
			function(err, result) {
				if (err) return callback(err);
				if (typeof result === 'string') {
					execute(result === 'needJquery' ? jqueryAndGetElementsInjection : jqueryGetElementsInjection);
				} else {
					var elements = result;
					elements = elements.map(function(element) {
						return element.ELEMENT;
					});
					if (!elements.length) return callback(new errors.NoSuchElementError());
					callback(null, elements);
				}
			}
		);
	}
	execute();
};

var customStrategyHash = {
	jquery: jqueryGetElementIds
};

/**
 * If `params.noError` is true then null will be passed to `callback` instead of
 * timeout error.
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
			callback(err, !err && (params.isSingle ? elements[0] : elements));
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
			callback(err, !err && (params.isSingle ? value.ELEMENT : value.map(function(item) {
				return item.ELEMENT;
			})));
		});
	}
};

//null to switch to default
WebDriver.prototype.switchFrame = function(frame) {
	this._cmd({
		path: '/frame',
		method: 'POST',
		data: {
			id: frame
		}
	});
	return this;
};

WebDriver.prototype.setTimeout = function(type, timeout, callback) {
	var self = this;
	this._cmd({
		path: '/timeouts',
		method: 'POST',
		data: {type: type, ms: timeout}
	}, function(err) {
		if (err) return callback(err);
		self._timeoutTypeHash[type] = timeout;
		callback();
	});
};

WebDriver.prototype.getTimeout = function(type, callback) {
	callback(null, this._timeoutTypeHash[type]);
};

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
 * Waiting for element which could be getting using `selector` and `params`.
 * If `params.noError` is true then null will be passed to `callback` instead of
 * timeout error.
 */
WebDriver.prototype.waitForElement = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	var self = this;
	self.waitFor(function(waitCallback) {
		function getElement() {
			self.get(selector, params, function(err, element) {
				if (err) {
					if (err instanceof errors.NoSuchElementError) {
						getElement();
					} else {
						return callback(err);	
					}
				} else {
					waitCallback(Boolean(element));
				}
			});
		}
		getElement();
	}, params.noError ? null : new Error(
		'Timeout exceeded while waiting for element ' + selector
	), callback);
};

WebDriver.prototype.waitForElementAbsent = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	var self = this;
	this.get(selector, utils.extend({noError: true}, params), function(err, element) {
		if (err) return callback(err);
		if (!element) return callback(null, self);
		element.waitForDisappear(callback);
	});
};

WebDriver.prototype.waitForUrlChange = function(oldUrl, newUrl, callback) {
	var self = this;
	if (!oldUrl && !newUrl) return callback(new Error(
		'Both of new and old url can`t be falsy.'
	));
	self.waitFor(function(waitCallback) {
		self.getUrl(function(err, url) {
			if (err) return callback(err);
			// remove query string
			url = url.replace(/\?.*$/, '');
			waitCallback(
				(utils.isRegExp(oldUrl) ? !oldUrl.test(url) : oldUrl !== url) &&
				(!newUrl || (utils.isRegExp(newUrl) ? newUrl.test(url) : newUrl === url))
			);
		});
	}, new Error(
		'Timeout exceeded while waiting for url change' +
		(oldUrl ? ' from ' + oldUrl : '') +
		(newUrl ? ' to ' + newUrl : '')
	), callback);
};

WebDriver.prototype.waitForRedirect = function(newUrl, callback) {
	this.waitForUrlChange('', newUrl, callback);
};

WebDriver.prototype.waitForDocumentReady = function(callback) {
	var self = this;
	function execute(addInjection) {
		self.execute(
			(addInjection || '') + utils.getInjectionSource(function() {
				var timeout = arguments[0],
					callback = arguments[1];
				if (typeof window.___nwdJquery !== 'function') {
					if (typeof ___nwdJquery !== 'function') callback('needJquery');
					___nwdJquery();
					window.___nwdJquery = jQuery.noConflict(true);
				}
				var $ = window.___nwdJquery;
				setTimeout(function() {
					callback(false);
				}, timeout)
				$(document).ready(function() {
					callback(true);
				});
			}),
			//HARDCODE: timeout is hardcoded
			[3000],
			true,
			function(err, result) {
				if (err) return callback(err);
				if (result === 'needJquery') {
					execute(jqueryInjection);
				} else {
					if (result === true) {
						callback(null, self);
					} else {
						callback(new Error(
							result === false
								? 'Timeout exceeded while waiting for document ready'
								: 'Unexpected result while waiting for document ready: ' + result 

						));
					}
				}
			}
		);
	}
	execute();
};


WebDriver.prototype.waitFor = function(func, error, callback) {
	var self = this,
		start = Date.now(),
		//HARDCODE: hardcoded timeout
		timeout = 3000,
		delay = timeout / 30,
		isTimeoutExceeded = false,
		isDone = false;
	function execute() {
		setTimeout(function() {
			func(function(done) {
				isDone = done;
				if (done && !isTimeoutExceeded) {
					callback(null, self);
				} else if (!isTimeoutExceeded) {
					execute();
				}
			});
		}, delay);
		setTimeout(function() {
			if (!isDone) {
				isTimeoutExceeded = true;
				callback(error);
			}
		}, timeout);
	};
	execute();
};

WebDriver.prototype.getCookie = function(name) {
	return this._cmd({
		path: name ? '/cookie/' + name : '/cookie',
		method: 'GET'
	});
};

WebDriver.prototype.deleteCookie = function(name, callback) {
	if (typeof name === 'function') {
		callback = name;
		name = null;
	}
	this._cmd({
		path: name ? '/cookie/' + name : '/cookie',
		method: 'DELETE'
	}, callback);
};

//Send a sequence of key strokes to the active element
WebDriver.prototype.sendKeys = function(value) {
	this._cmd({
		path: '/keys',
		method: 'POST',
		data: {value: utils.replaceKeyStrokesWithCodes(value).split('')}
	});
	return this;
};

//Make screenshot and save him to target path
WebDriver.prototype.makeScreenshot = function(path) {
	this._cmd({
		path: '/screenshot',
		method: 'GET'
	}, function(err, res) {
		if (err) return callback(err);
		var data = res.data.value;
		//convert base64 to binary
		data = new Buffer(data, 'base64').toString('binary');
		fs.writeFile(path, data, 'binary', callback);
	});
};

WebDriver.prototype.openConsole = function() {
	this.sendKeys('@F12');
};

WebDriver.prototype.maximizeWindow = function(callback) {
	this._cmd({
		path: '/window/current/maximize',
		method: 'POST'
	}, callback);
};

WebDriver.prototype.back = function(callback) {
	this._cmd({path: '/back', method: 'POST'}, callback);
};

WebDriver.prototype.refresh = function(callback) {
	this._cmd({path: '/refresh', method: 'POST'}, callback);
};

utils.loggify(WebDriver.prototype, 'WebDriver');

exports.WebDriver = WebDriver;
