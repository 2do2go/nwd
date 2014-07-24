'use strict';

var inherits = require('util').inherits;

var BaseError = exports.BaseError = function() {
};
inherits(BaseError, Error);
BaseError.prototype.parametrize = function(params) {
	var self = this;
	if (params) Object.keys(params).forEach(function(param) {
		self.message = self.message.replace(
			'${' + param + '}', '"' + params[param] + '"'
		);
	});
};

var ProtocolError = exports.ProtocolError = function() {
	BaseError.apply(this, arguments);
	this.name = 'ProtocolError';
	Error.captureStackTrace(this, this.constructor);
};
inherits(ProtocolError, BaseError);

var NoSuchElementError = exports.NoSuchElementError = function(params) {
	ProtocolError.apply(this, arguments);
	this.name = 'NoSuchElementError';
	this.message =
		'An element ${element} could not be located on the page using ${using}';
	this.parametrize(params);
	this.status = 7;
	Error.captureStackTrace(this, this.constructor);
};
inherits(NoSuchElementError, ProtocolError);

var NoSuchFrameError = exports.NoSuchFrameError = function() {
	ProtocolError.apply(this, arguments);
	this.name = 'NoSuchFrameError';
	this.message =
		'A request to switch to a frame could not be satisfied ' +
		'because the frame could not be found.';
	this.status = 8;
	Error.captureStackTrace(this, this.constructor);
};
inherits(NoSuchFrameError, ProtocolError);

var UnknownCommandError = exports.UnknownCommandError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'UnknownCommandError';
	this.message =
		'The requested resource could not be found, or a request ' +
		'was received using an HTTP method that is not supported by the ' +
		'mapped resource.';
	this.status = 9;
	Error.captureStackTrace(this, this.constructor);
};
inherits(UnknownCommandError, ProtocolError);

var StaleElementReferenceError = exports.StaleElementReferenceError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'StaleElementReferenceError';
	this.message =
		'An element command failed because the referenced element ' +
		'is no longer attached to the DOM.';
	this.status = 10;
	Error.captureStackTrace(this, this.constructor);
};
inherits(StaleElementReferenceError, ProtocolError);

var ElementNotVisibleError = exports.ElementNotVisibleError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'ElementNotVisibleError';
	this.message =
		'An element command could not be completed because the ' +
		'element is not visible on the page.';
	this.status = 11;
	Error.captureStackTrace(this, this.constructor);
};
inherits(ElementNotVisibleError, ProtocolError);

var InvalidElementStateError = exports.InvalidElementStateError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidElementStateError';
	this.message =
		'An element command could not be completed because the ' +
		'element is in an invalid state (e.g. attempting to click a ' +
		'disabled element).';
	this.status = 12;
	Error.captureStackTrace(this, this.constructor);
};
inherits(InvalidElementStateError, ProtocolError);

var UnknownError = exports.UnknownError = function() {
	ProtocolError.apply(this, arguments);
	this.name = 'UnknownError';
	this.message =
		'An unknown server-side error occurred while processing ' +
		'the command.';
	this.status = 13;
	Error.captureStackTrace(this, this.constructor);
};
inherits(UnknownError, ProtocolError);

var ElementIsNotSelectableError = exports.ElementIsNotSelectableError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'ElementIsNotSelectableError';
	this.message =
		'An attempt was made to select an element that cannot be selected.';
	this.status = 15;
	Error.captureStackTrace(this, this.constructor);
};
inherits(ElementIsNotSelectableError, ProtocolError);

var JavaScriptError = exports.JavaScriptError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'JavaScriptError';
	this.message =
		'An error occurred while executing user supplied JavaScript.';
	this.status = 17;
	Error.captureStackTrace(this, this.constructor);
};
inherits(JavaScriptError, ProtocolError);

var XPathLookupError = exports.XPathLookupError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'XPathLookupError';
	this.message =
		'An error occurred while searching for an element by XPath.';
	this.status = 19;
	Error.captureStackTrace(this, this.constructor);
};
inherits(XPathLookupError, ProtocolError);

var TimeoutError = exports.TimeoutError = function() {
	ProtocolError.apply(this, arguments);
	this.name = 'TimeoutError';
	this.message = 'An operation did not complete before its timeout expired.';
	this.status = 21;
	Error.captureStackTrace(this, this.constructor);
};
inherits(TimeoutError, ProtocolError);

var NoSuchWindowError = exports.NoSuchWindowError = function() {
	ProtocolError.apply(this, arguments);
	this.name = 'NoSuchWindowError';
	this.message =
		'A request to switch to a different window could not be ' +
		'satisfied because the window could not be found.';
	this.status = 23;
	Error.captureStackTrace(this, this.constructor);
};
inherits(NoSuchWindowError, ProtocolError);

var InvalidCookieDomainError = exports.InvalidCookieDomainError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidCookieDomainError';
	this.message =
		'An illegal attempt was made to set a cookie under a ' +
		'different domain than the current page.';
	this.status = 24;
	Error.captureStackTrace(this, this.constructor);
};
inherits(InvalidCookieDomainError, ProtocolError);

var UnableToSetCookieError = exports.UnableToSetCookieError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'UnableToSetCookieError';
	this.message =
		'A request to set a cookie\'s value could not be satisfied.';
	this.status = 25;
	Error.captureStackTrace(this, this.constructor);
};
inherits(UnableToSetCookieError, ProtocolError);

var UnexpectedAlertOpenError = exports.UnexpectedAlertOpenError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'UnexpectedAlertOpenError';
	this.message = 'A modal dialog was open, blocking this operation';
	this.status = 26;
	Error.captureStackTrace(this, this.constructor);
};
inherits(UnexpectedAlertOpenError, ProtocolError);

var NoAlertOpenError = exports.NoAlertOpenError = function() {
	ProtocolError.apply(this, arguments);
	this.name = 'NoAlertOpenError';
	this.message =
		'An attempt was made to operate on a modal dialog when' +
		' one was not open.';
	this.status = 27;
	Error.captureStackTrace(this, this.constructor);
};
inherits(NoAlertOpenError, ProtocolError);

var ScriptTimeoutError = exports.ScriptTimeoutError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'ScriptTimeoutError';
	this.message = 'A script did not complete before its timeout expired.';
	this.status = 28;
	Error.captureStackTrace(this, this.constructor);
};
inherits(ScriptTimeoutError, ProtocolError);

var InvalidElementCoordinatesError = exports.InvalidElementCoordinatesError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidElementCoordinatesError';
	this.message =
		'The coordinates provided to an interactions operation' +
		' are invalid.';
	this.status = 29;
	Error.captureStackTrace(this, this.constructor);
};
inherits(InvalidElementCoordinatesError, ProtocolError);

var IMENotAvailableError = exports.IMENotAvailableError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'IMENotAvailableError';
	this.message = 'IME was not available.';
	this.status = 30;
	Error.captureStackTrace(this, this.constructor);
};
inherits(IMENotAvailableError, ProtocolError);

var IMEEngineActivationFailedError = exports.IMEEngineActivationFailedError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'IMEEngineActivationFailedError';
	this.message = 'An IME engine could not be started.';
	this.status = 31;
	Error.captureStackTrace(this, this.constructor);
};
inherits(IMEEngineActivationFailedError, ProtocolError);

var InvalidSelectorError = exports.InvalidSelectorError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidSelectorError';
	this.message = 'Argument was an invalid selector (e.g. XPath/CSS).';
	this.status = 32;
	Error.captureStackTrace(this, this.constructor);
};
inherits(InvalidSelectorError, ProtocolError);

var SessionNotCreatedException = exports.SessionNotCreatedException =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'SessionNotCreatedException';
	this.message = 'A new session could not be created.';
	this.status = 33;
	Error.captureStackTrace(this, this.constructor);
};
inherits(SessionNotCreatedException, ProtocolError);

var MoveTargetOutOfBoundsError = exports.MoveTargetOutOfBoundsError =
function() {
	ProtocolError.apply(this, arguments);
	this.name = 'MoveTargetOutOfBounds';
	this.message = 'Target provided for a move action is out of bounds.';
	this.status = 34;
	Error.captureStackTrace(this, this.constructor);
};
inherits(MoveTargetOutOfBoundsError, ProtocolError);


//save all exported protocols errors to hash (to finding them by code later)
var errorCodeContructorHash = {};
for (var key in exports) {
	if (exports[key].prototype instanceof ProtocolError) {
		var errorConstructor = exports[key];
		errorCodeContructorHash[(new errorConstructor()).status] = errorConstructor;
	}
}

//getting constructor of some of protocol errors by status
exports.getProtocolErrorContructor = function(status) {
	var errorConstructor = errorCodeContructorHash[status];
	if (!errorConstructor) {
		throw new ProtocolError('No protocol error found for status: ' + status);
	}
	return errorConstructor;
};
