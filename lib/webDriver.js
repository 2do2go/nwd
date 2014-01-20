'use strict';

var http = require('http'),
	fs = require('fs'),
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
	params.desiredCapabilities = params.desiredCapabilities || {};
	this.desiredCapabilities = utils.extend({
		browserName: 'firefox',
		version: '',
		javascriptEnabled: true,
		platform: 'ANY'
	}, params.desiredCapabilities);
	this._timeoutTypeHash = {};
};

// A log helper with fancy colors
WebDriver.prototype.log = function(message, content) {
	var currentDate = new Date();
	var dateString = currentDate.toString().match(/\d\d:\d\d:\d\d/)[0];
	if (!content) {
		console.log(
			utils.colors.dkgray + '[' + dateString + ']: ' + utils.colors.reset, message
		);
	}
	else {
		console.log(
			utils.colors.dkgray + '[' + dateString + ']: ' + utils.colors.reset, message,
			'\t', trimStringLength(JSON.stringify(content), 1000, true));
	}
};

function trimStringLength(str, length, markTrimmed) {
	if (str && str.length) {
		if (str.length > length) {
			var oldLength = str.length;
			str = str.substr(0, length);
			if (markTrimmed) {
				str +=
					'...[String trimed to ' + length + ' characters, ' +
					'original length: ' + oldLength + ']';
			}
			return str;
		} else {
			return str;
		}
	}
}

//strip function from https://github.com/Camme/webDriver
// strip the content from unwanted characters
WebDriver.prototype.strip = function(str) {
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

var httpOkStatusHash = {200: 1, 204: 1, 301: 1, 302: 1};

WebDriver.prototype.execCommand = function(params, callback) {
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
	this.log(
		utils.colors.violet + 'COMMAND\t' + utils.colors.reset + requestParams.method,
		('http://' + requestParams.host + ':' + requestParams.port + requestParams.path)
	);
	this.log(utils.colors.brown + 'DATA\t\t ' + utils.colors.reset + stringData);
	var req = request(requestParams, function(err, res) {
		if (err) return callback(err);
		res.data = res.data ? self.strip(res.data.toString()) : '{}';
		try {
			res.data = JSON.parse(res.data);
		} catch(err) {
			return callback(new errors.ProtocolError(
				'Can`t parse json from response of ' + params.path +
				': ' + err.message
			));
		}
		//self.log('Response of protocol command: ' + JSON.stringify(res));
		// if (!httpOkStatusHash[res.statusCode]) {
		// 	throw new Error('Bad http status: ' + res.statusCode);
		// }
		//status 0 - success, error otherwise
		if (res.data && res.data.status) {
			var errorConstructor = errors.getProtocolErrorContructor(res.data.status);
			return callback(new errorConstructor());
		}
		self.log(utils.colors.teal + 'RESULT\t' + utils.colors.reset, res.data);
		// return `res` if it needed, otherwise `res.data.value` or `this` (for
		// chaining)
		callback(null, params.resNeeded ? res : (
			res.data && 'value' in res.data ? res.data.value : self
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
	self.execCommand({
		path: '',
		data: {
			desiredCapabilities: self.desiredCapabilities
		},
		resNeeded: true
	}, function(err, res) {
		if (err) return callback(err);
		var locationParts = res.headers.location.split('/');
		self.sessionId = locationParts[locationParts.length - 1];
		self.sessionBasePath = self.sessionBasePath + '/' + self.sessionId;
		callback(null, self);
	});
};

WebDriver.prototype.deleteSession = function(callback) {
	this.execCommand({path: '', method: 'DELETE'}, callback);
};

WebDriver.prototype.setUrl = function(url, callback) {
	this.execCommand({path: '/url', data: {url: url}}, callback);
};

WebDriver.prototype.getUrl = function(callback) {
	return this.execCommand({path: '/url', method: 'GET'}, callback);
};

WebDriver.prototype.getTitle = function(callback) {
	return this.execCommand({path: '/title', method: 'GET'}, callback);
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

/* global $ */
var jqueryGetElementsInjection = function() {
	(function() {
		//getting elements by jquery `selector` with infinite attempt count
		//with `interval` between attempts, `callback` with finded elements
		//will be called
		var getElements = function(selector, chain, timeout, interval, callback) {
			var elements = null;
			// callback if timeout exceeded
			if (timeout <= 0) {
				return callback([]);
			}
			//waiting for jquery
			if (typeof $ !== 'undefined') {
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
						//exec function
						elements = elements[func].apply(elements, args);
					});
				}
				if (elements && elements.length) {
					callback(elements.get());
				}
			}
			//retry if not elements found
			if (!elements || !elements.length) {
				setTimeout(function() {
					getElements(selector, chain, timeout - interval, interval, callback);
				}, interval);
			}
		};
		//getting script parameters and get elements
		var selector = arguments[0],
			chain = arguments[1],
			timeout = arguments[2],
			interval = arguments[3],
			callback = arguments[4];
		getElements(selector, chain, timeout, interval, callback);
	}).apply(this, arguments);
};
/* global -$ */

//strategy for getting elements via client jquery
var jqueryGetElementIds = function(params, callback) {
	this.execute(
		jqueryGetElementsInjection.toString().split('\n').slice(1, -1).join('\n'),
		[params.selector, params.chain, this.getTimeout('implicit'), 100], true,
		function(err, elements) {
			elements = elements.map(function(element) {
				return element.ELEMENT;
			});
			if (!elements.length) return callback(new NoSuchElementError());
			callback(null, elements);
		}
	);
};

var customStrategyHash = {
	jquery: jqueryGetElementIds
};

//function transform params.parent to params.parent.id
var paramsParentToParentId = function(params) {
	if (params.parent && !(params.parent instanceof WebElement)) {
		throw new Error('Parent should be instanceof WebElement');
	}
	if (params.parent) {
		params.parentId = params.parent.id;
		delete params.parent;
	}
	return params;
};

WebDriver.prototype.get = function(params, callback) {
	var self = this;
	this.getId(params, function(err, id) {
		callback(err, !err && new WebElement(id, self));
	});
};

WebDriver.prototype.getId = function(params, callback) {
	this._getIds(params, true, callback);
};

WebDriver.prototype.getList = function(params, callback) {
	var self = this;
	return this.getIds(params, function(err, ids) {
		callback(err, !err && ids.map(function(id) {
			return new WebElement(id, self);
		}));
	});
};

WebDriver.prototype.getIds = function(params, callback) {
	this._getIds(params, false, callback);
};

// returns single element or list depending on `isSingle`
WebDriver.prototype._getIds = function(params, isSingle, callback) {
	paramsParentToParentId(params)
	params.strategy = params.strategy || 'jquery';
	var customStrategy = customStrategyHash[params.strategy];
	if (customStrategy) {
		return customStrategy.call(this, params, function(err, elements) {
			callback(err, isSingle ? elements[0] : elements);
		});
	} else {
		var plural = isSingle ? '' : 's';
		var parentPath = params.parentId ? (
			'/' + params.parentId + '/element' + plural
		) : plural;
		this.execCommand({
			path: '/element' + parentPath,
			method: 'POST',
			data: {
				using: params.strategy,
				value: sweetenCssSelector(params.selector)
			}
		}, function(err, value) {
			if (err) return callback(err);
			callback(err, isSingle ? value.ELEMENT : value.map(function(item) {
				return item.ELEMENT;
			}));
		});
	}
};

//null to switch to default
WebDriver.prototype.switchFrame = function(frame) {
	this.execCommand({
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
	this.execCommand({
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
	this.execCommand({
		path: '/execute' + (isAsync ? '_async' : ''),
		method: 'POST',
		data: {script: script, args: args || []}
	}, callback);
};

WebDriver.prototype.waitForElement = function(params) {
	var oldTimeout = this.getTimeout('implicit'),
		timeout = params.timeout || oldTimeout,
		start = Date.now(), element, self = this;
	this.setTimeout('implicit', timeout);
	while (!element) {
		try {
			if (Date.now() - start > timeout) {
				throw new TimeoutError(
					'Timeout exceeded while waiting for of element: ' +
					params.selector
				);
			}
			element = new WebElement(this.getId(params), self);
		} catch (err) {
			if (!(err instanceof NoSuchElementError)) {
				this.setTimeout('implicit', oldTimeout);
				throw err;
			}
		}
	}
	this.setTimeout('implicit', oldTimeout);
	return element;
};

WebDriver.prototype.waitForElementDisappear = function(params) {
	var implicitTimeout = this.getTimeout('implicit'),
		timeout = params.timeout || implicitTimeout,
		commandTimeout = timeout / 20,
		start = Date.now(),
		isElementExists = true;
	this.setTimeout('implicit', commandTimeout);
	while (isElementExists) {
		try {
			if (Date.now() - start > timeout) {
				throw new TimeoutError(
					'Timeout exceeded while waiting for disappear of element: ' +
					params.selector
				);
			}
			this.getId(params);
		} catch (err) {
			if (err instanceof NoSuchElementError) {
				isElementExists = false;
			} else {
				throw err;
			}
		}
	}
	this.setTimeout('implicit', implicitTimeout);
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

WebDriver.prototype.waitFor = function(func, error, callback) {
	var self = this;
	var start = Date.now();
	function exec() {
		setTimeout(function() {
			func(function(done) {
				//HARDCODE: hardcoded timeout
				var isTimeoutExceeded =  Date.now() - start > 3000;
				if (done && !isTimeoutExceeded) {
					callback(null, self);
				} else if (!isTimeoutExceeded) {
					exec();
				} else {
					callback(error || new Error('Timeout of `waitFor` exceeded'));
				}
			});
		//HARDCODE: hardcoded interval
		}, 100)
	};
	exec();
};

WebDriver.prototype.getCookie = function(name) {
	return this.execCommand({
		path: name ? '/cookie/' + name : '/cookie',
		method: 'GET'
	});
};

WebDriver.prototype.deleteCookie = function(name, callback) {
	if (typeof name === 'function') {
		callback = name;
		name = null;
	}
	this.execCommand({
		path: name ? '/cookie/' + name : '/cookie',
		method: 'DELETE'
	}, callback);
};

//Send a sequence of key strokes to the active element
WebDriver.prototype.sendKeys = function(value) {
	this.execCommand({
		path: '/keys',
		method: 'POST',
		data: {value: utils.replaceKeyStrokesWithCodes(value).split('')}
	});
	return this;
};

//Make screenshot and save him to target path
WebDriver.prototype.makeScreenshot = function(path) {
	this.execCommand({
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
	this.execCommand({
		path: '/window/current/maximize',
		method: 'POST'
	}, callback);
};

WebDriver.prototype.back = function(callback) {
	this.execCommand({path: '/back', method: 'POST'}, callback);
};

WebDriver.prototype.refresh = function(callback) {
	this.execCommand({path: '/refresh', method: 'POST'}, callback);
};

exports.WebDriver = WebDriver;
