'use strict';

var replaceKeyStrokesWithCodes = require('./utils').replaceKeyStrokesWithCodes;


var WebElement = exports.WebElement = function(id, driver) {
	this.id = this.ELEMENT = id;
	this.driver = driver;
};

var mouseButtons = {
	left: 0,
	middle: 1,
	right: 2
};

WebElement.prototype.sendKeys = function(value) {
	if (value) {
		this.driver.execCommand({
			path: '/element/' + this.id + '/value',
			method: 'POST',
			data: {value: replaceKeyStrokesWithCodes(value).split('')}
		});
	} else {
		this.clear();
	}
	return this;
};

WebElement.prototype.clear = function() {
	this.driver.execCommand({
		path: '/element/' + this.id + '/clear',
		method: 'POST'
	});
	return this;
};

WebElement.prototype.getValue = function() {
	return this.driver.execCommand({
		path: '/element/' + this.id + '/value',
		method: 'GET'
	}).data.value;
};

WebElement.prototype.getAttr = function(name) {
	return this.driver.execCommand({
		path: '/element/' + this.id + '/attribute/' + name,
		method: 'GET'
	}).data.value;
};

//Returns the visible text for the element
WebElement.prototype.getText = function() {
	return this.driver.execCommand({
		path: '/element/' + this.id + '/text',
		method: 'GET'
	}).data.value;
};

WebElement.prototype.getName = function() {
	return this.driver.execCommand({
		path: '/element/' + this.id + '/name',
		method: 'GET'
	}).data.value;
};

WebElement.prototype.click = function() {
	this.driver.execCommand({
		path: '/element/' + this.id + '/click',
		method: 'POST'
	});
	return this;
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

WebElement.prototype.getChild = function(params) {
	params.parent = this;
	return this.driver.get(params);
};

WebElement.prototype.getChildren = function(params) {
	params.parent = this;
	return this.driver.getList(params);
};

WebElement.prototype.isDisplayed = function() {
	return this.driver.execCommand({
		path: '/element/' + this.id + '/displayed',
		method: 'GET'
	}).data.value;
};
