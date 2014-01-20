'use strict';

var replaceKeyStrokesWithCodes = require('./utils').replaceKeyStrokesWithCodes;


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

WebElement.prototype.sendKeys = function(value, callback) {
	//TODO: remove `clear`
	if (value) {
		this.driver.execCommand({
			path: '/element/' + this.id + '/value',
			method: 'POST',
			data: {value: replaceKeyStrokesWithCodes(value).split('')}
		}, callback);
	} else {
		this.clear(callback);
	}
};

WebElement.prototype.clear = function(callback) {
	this.driver.execCommand({
		path: '/element/' + this.id + '/clear',
		method: 'POST'
	}, callback);
};

WebElement.prototype.getValue = function(callback) {
	this.driver.execCommand({
		path: '/element/' + this.id + '/value',
		method: 'GET'
	}, callback);
};

WebElement.prototype.getAttr = function(name, callback) {
	this.driver.execCommand({
		path: '/element/' + this.id + '/attribute/' + name,
		method: 'GET'
	}, callback);
};

//Returns the visible text for the element
WebElement.prototype.getText = function(callback) {
	this.driver.execCommand({
		path: '/element/' + this.id + '/text',
		method: 'GET'
	}, callback);
};

WebElement.prototype.getTagName = function(callback) {
	this.driver.execCommand({
		path: '/element/' + this.id + '/name',
		method: 'GET'
	}, callback);
};

WebElement.prototype.click = function(callback) {
	this.driver.execCommand({
		path: '/element/' + this.id + '/click',
		method: 'POST'
	}, callback);
};

WebElement.prototype.moveTo = function(x, y) {
	this.driver.execCommand({
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
	this.driver.execCommand({
		path: '/buttondown',
		method: 'POST',
		data: {button: mouseButtons[button]}
	});
	return this;
};

WebElement.prototype.mouseUp = function(button) {
	this.moveTo();
	this.driver.execCommand({
		path: '/buttonup',
		method: 'POST',
		data: {button: mouseButtons[button]}
	});
};

WebElement.prototype.get = function(params, callback) {
	params.parent = this;
	this.driver.get(params, callback);
};

WebElement.prototype.getList = function(params, callback) {
	params.parent = this;
	this.driver.getList(params, callback);
};

WebElement.prototype.isDisplayed = function(callback) {
	this.driver.execCommand({
		path: '/element/' + this.id + '/displayed',
		method: 'GET'
	}, callback);
};

exports.WebElement = WebElement;
