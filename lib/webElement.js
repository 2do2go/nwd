'use strict';

var utils = require('./utils');


function WebElement(id, driver) {
	//TODO: remove `this.ELEMENT` if it is not required
	this.id = this.ELEMENT = id;
	this.driver = driver;
};

var mouseButtons = {
	left: 0,
	middle: 1,
	right: 2
};

function returnSelf(callback, self) {
	return function(err) {
		callback(err, self);
	};
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

WebElement.prototype.moveTo = function(x, y) {
	this.driver._cmd({
		path: '/moveto',
		method: 'POST',
		data: {
			element: this.id,
			xoffset: x,
			yoffset: y
		}
	});
	return this;
};

WebElement.prototype.mouseDown = function(button) {
	this.moveTo();
	this.driver._cmd({
		path: '/buttondown',
		method: 'POST',
		data: {button: mouseButtons[button]}
	});
	return this;
};

WebElement.prototype.mouseUp = function(button) {
	this.moveTo();
	this.driver._cmd({
		path: '/buttonup',
		method: 'POST',
		data: {button: mouseButtons[button]}
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
	self.driver.waitFor(function(waitCallback) {
		self.isVisible(function(err, isVisible) {
			waitCallback(!isVisible);
		});
	}, new Error(
		'Timeout exceeded while waiting for element ' + self.id + ' disappear'
	), callback);
};

exports.WebElement = WebElement;
