'use strict';

var utils = require('./utils');


function WebElement(id, driver) {
	//TODO: remove `this.ELEMENT` if it is not required
	this.id = this.ELEMENT = id;
	this.driver = driver;
	this.logMethodCalls = this.driver.logMethodCalls;
};

function returnSelf(callback, self) {
	return function(err) {
		callback(err, self);
	};
}

// returns index of first function from `args`
function indexOfFunctionInArgs(args) {
	var index = 0;
	while (index < args.length && !utils.isFunction(args[index])) index++;
	return utils.isFunction(args[index]) ? index : -1;
}

// replace first function from `args` on `returnSelf`
function repalceArgsCallbackOnReturnSelf(args, self) {
	var index = indexOfFunctionInArgs(args);
	if (index !== -1) args[index] = returnSelf(args[index], self);
	return args;
}

WebElement.prototype.sendKeys = function(value, callback) {
	//TODO: remove `clear`
	if (value) {
		this.driver._cmd({
			path: '/element/' + this.id + '/value',
			method: 'POST',
			data: {value: utils.replaceKeyStrokesWithCodes(value).split('')}
		}, returnSelf(callback, this));
	} else {
		this.clear(callback);
	}
};

WebElement.prototype.clear = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/clear',
		method: 'POST'
	}, returnSelf(callback, this));
};

WebElement.prototype.getValue = function(callback) {
	this.getAttr('value', callback);
};

WebElement.prototype.getAttr = function(name, callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/attribute/' + name,
		method: 'GET'
	}, callback);
};

//Returns the visible text for the element
WebElement.prototype.getText = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/text',
		method: 'GET'
	}, callback);
};

WebElement.prototype.getTagName = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/name',
		method: 'GET'
	}, callback);
};

WebElement.prototype.click = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/click',
		method: 'POST'
	}, returnSelf(callback, this));
};

WebElement.prototype.moveTo = function(offset, callback) {
	callback = utils.isFunction(offset) ? offset : callback;
	offset = !utils.isFunction(offset) ? offset : {};
	this.driver._cmd({
		path: '/moveto',
		method: 'POST',
		data: {
			element: this.id,
			xoffset: offset.x,
			yoffset: offset.y
		}
	}, returnSelf(callback, this));
};

WebElement.prototype.mouseDown = function() {
	var self = this,
		args = repalceArgsCallbackOnReturnSelf(arguments, this);
	this.moveTo(function(err) {
		if (err) return callback(err);
		self.driver.mouseDown.apply(self.driver, args);
	});
};

WebElement.prototype.mouseUp = function() {
	var self = this,
		args = repalceArgsCallbackOnReturnSelf(arguments, this);
	this.moveTo(function(err) {
		if (err) return callback(err);
		self.driver.mouseUp.apply(self.driver, args);
	});
};

WebElement.prototype.get = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	params.parent = this;
	this.driver.get(selector, params, callback);
};

WebElement.prototype.getList = function(selector, params, callback) {
	callback = utils.isFunction(params) ? params : callback;
	params = !utils.isFunction(params) ? params : {};
	params.parent = this;
	this.driver.getList(selector, params, callback);
};

WebElement.prototype.isDisplayed = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/displayed',
		method: 'GET'
	}, callback);
};

WebElement.prototype.describe = function(callback) {
	this.driver._cmd({
		path: '/element/' + this.id,
		method: 'GET'
	}, callback);
};

WebElement.prototype.getCssProp = function(propName, callback) {
	this.driver._cmd({
		path: '/element/' + this.id + '/css/' + propName,
		method: 'GET'
	}, callback);
};

var isVisibleInjection = utils.getInjectionSource(function() {
	function ___nwdIsVisible(element) {
		if (!element) return false;
		return (
			element.style.display !== 'none'
				? (element.offsetWidth > 0 || element.offsetHeight > 0)
				: false
		);
	}
});

WebElement.prototype.isVisible = function(callback) {;
	var self = this;
	function execute(withFunc) {
		self.driver.execute(
			(withFunc ? isVisibleInjection : '') + utils.getInjectionSource(function() {
				if (typeof window.___nwdIsVisible !== 'function') {
					if (typeof ___nwdIsVisible !== 'function') return 'needFunc';
					window.___nwdIsVisible = ___nwdIsVisible;
				}
				return ___nwdIsVisible(arguments[0]);
			}),
			[{ELEMENT: self.id}],
			false,
			function(err, result) {
				if (err) return callback(err);
				result === 'needFunc' ? execute(true) : callback(null, result);
			}
		);
	}
	execute();
};

WebElement.prototype.waitForDisappear = function(callback) {
	var self = this;
	self.driver.waitFor(
		function(waitCallback) {
			self.isVisible(function(err, isVisible) {
				waitCallback(!isVisible);
			});
		}, {
			errorMessage: 'waiting for element ' + self.id + ' disappear',
			timeout: self.driver.timeouts.waitForElementDisappear
		},
		callback
	);
};

utils.loggify(WebElement.prototype, 'WebElement');

exports.WebElement = WebElement;
