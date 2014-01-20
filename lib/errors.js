'use strict';

var inherits = require('util').inherits;

var BaseError = exports.BaseError = function(message) {
	Error.captureStackTrace(this, this);
	this.message = message;
};
inherits(BaseError, Error);

var ProtocolError = exports.ProtocolError = function() {
	BaseError.apply(this, arguments);
	this.name = 'ProtocolError';
};
inherits(ProtocolError, BaseError);

var NoSuchElementError = exports.NoSuchElementError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'NoSuchElementError';
	this.message =
		'An element could not be located on the page using the given search ' +
		'parameters.';
	this.status = 7;
};
inherits(NoSuchElementError, ProtocolError);

var NoSuchFrameError = exports.NoSuchFrameError = function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'NoSuchFrameError';
	this.message =
		'A request to switch to a frame could not be satisfied ' +
		'because the frame could not be found.';
	this.status = 8;
};
inherits(NoSuchFrameError, ProtocolError);

var UnknownCommandError = exports.UnknownCommandError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'UnknownCommandError';
	this.message =
		'The requested resource could not be found, or a request ' +
		'was received using an HTTP method that is not supported by the ' +
		'mapped resource.';
	this.status = 9;
};
inherits(UnknownCommandError, ProtocolError);

var StaleElementReferenceError = exports.StaleElementReferenceError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'StaleElementReferenceError';
	this.message =
		'An element command failed because the referenced element ' +
		'is no longer attached to the DOM.';
	this.status = 10;
};
inherits(StaleElementReferenceError, ProtocolError);

var ElementNotVisibleError = exports.ElementNotVisibleError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'ElementNotVisibleError';
	this.message =
		'An element command could not be completed because the ' +
		'element is not visible on the page.';
	this.status = 11;
};
inherits(ElementNotVisibleError, ProtocolError);

var InvalidElementStateError = exports.InvalidElementStateError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidElementStateError';
	this.message =
		'An element command could not be completed because the ' +
		'element is in an invalid state (e.g. attempting to click a ' +
		'disabled element).';
	this.status = 12;
};
inherits(InvalidElementStateError, ProtocolError);

var UnknownError = exports.UnknownError = function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'UnknownError';
	this.message =
		'An unknown server-side error occurred while processing ' +
		'the command.';
	this.status = 13;
};
inherits(UnknownError, ProtocolError);

var ElementIsNotSelectableError = exports.ElementIsNotSelectableError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'ElementIsNotSelectableError';
	this.message =
		'An attempt was made to select an element that cannot be selected.';
	this.status = 15;
};
inherits(ElementIsNotSelectableError, ProtocolError);

var JavaScriptError = exports.JavaScriptError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'JavaScriptError';
	this.message =
		'An error occurred while executing user supplied JavaScript.';
	this.status = 17;
};
inherits(JavaScriptError, ProtocolError);

var XPathLookupError = exports.XPathLookupError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'XPathLookupError';
	this.message =
		'An error occurred while searching for an element by XPath.';
	this.status = 19;
};
inherits(XPathLookupError, ProtocolError);

var NoSuchWindowError = exports.NoSuchWindowError = function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'NoSuchWindowError';
	this.message =
		'A request to switch to a different window could not be ' +
		'satisfied because the window could not be found.';
	this.status = 23;
};
inherits(NoSuchWindowError, ProtocolError);

var InvalidCookieDomainError = exports.InvalidCookieDomainError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidCookieDomainError';
	this.message =
		'An illegal attempt was made to set a cookie under a ' +
		'different domain than the current page.';
	this.status = 24;
};
inherits(InvalidCookieDomainError, ProtocolError);

var UnableToSetCookieError = exports.UnableToSetCookieError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'UnableToSetCookieError';
	this.message =
		'A request to set a cookie\'s value could not be satisfied.';
	this.status = 25;
};
inherits(UnableToSetCookieError, ProtocolError);

var UnexpectedAlertOpenError = exports.UnexpectedAlertOpenError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'UnexpectedAlertOpenError';
	this.message = 'A modal dialog was open, blocking this operation';
	this.status = 26;
};
inherits(UnexpectedAlertOpenError, ProtocolError);

var NoAlertOpenError = exports.NoAlertOpenError = function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'NoAlertOpenError';
	this.message =
		'An attempt was made to operate on a modal dialog when' +
		' one was not open.';
	this.status = 27;
};
inherits(NoAlertOpenError, ProtocolError);

var ScriptTimeoutError = exports.ScriptTimeoutError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'ScriptTimeoutError';
	this.message = 'A script did not complete before its timeout expired.';
	this.status = 28;
};
inherits(ScriptTimeoutError, ProtocolError);

var InvalidElementCoordinatesError = exports.InvalidElementCoordinatesError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidElementCoordinatesError';
	this.message =
		'The coordinates provided to an interactions operation' +
		' are invalid.';
	this.status = 29;
};
inherits(InvalidElementCoordinatesError, ProtocolError);

var IMENotAvailableError = exports.IMENotAvailableError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'IMENotAvailableError';
	this.message = 'IME was not available.';
	this.status = 30;
};
inherits(IMENotAvailableError, ProtocolError);

var IMEEngineActivationFailedError = exports.IMEEngineActivationFailedError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'IMEEngineActivationFailedError';
	this.message = 'An IME engine could not be started.';
	this.status = 31;
};
inherits(IMEEngineActivationFailedError, ProtocolError);

var InvalidSelectorError = exports.InvalidSelectorError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'InvalidSelectorError';
	this.message = 'Argument was an invalid selector (e.g. XPath/CSS).';
	this.status = 32;
};
inherits(InvalidSelectorError, ProtocolError);

var SessionNotCreatedException = exports.SessionNotCreatedException =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'SessionNotCreatedException';
	this.message = 'A new session could not be created.';
	this.status = 33;
};
inherits(SessionNotCreatedException, ProtocolError);

var MoveTargetOutOfBoundsError = exports.MoveTargetOutOfBoundsError =
function(message, status) {
	ProtocolError.apply(this, arguments);
	this.name = 'MoveTargetOutOfBounds';
	this.message = 'Target provided for a move action is out of bounds.';
	this.status = 34;
};
inherits(MoveTargetOutOfBoundsError, ProtocolError);

//driver errors
var TimeoutError = exports.TimeoutError =
function(message) {
	BaseError.apply(this, arguments);
	this.name = 'TimeoutError';
};
inherits(TimeoutError, BaseError);

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
