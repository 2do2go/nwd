'use strict';

var FileServer = require('node-static').Server;
var _ = require('underscore');
var os = require('os');
var http = require('http');
var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;
var WebElement = require('../lib').WebElement;

exports.testTimeout = 16000;

exports.indexUrl = 'github/index.html';
exports.termsOfServiceUrl = 'github/terms-of-service.html';

var browserName = exports.browserName =
	process.env.NODE_TESTUI_BROWSER || 'chrome';

var driverParams = {
	host: process.env.NODE_TESTUI_HOST || '127.0.0.1',
	port: process.env.NODE_TESTUI_PORT || 4444,
	desiredCapabilities: {
		acceptSslCerts: true,
		browserName: browserName
	}
};
exports.driverParams = driverParams;

var staticServerParams = {
	host: _(os.networkInterfaces()).chain().find(function(ni, name) {
			return name !== 'lo';
		}).find(function(ni) {
			return !ni.internal && ni.family === 'IPv4';
		}).value().address,
	port: process.env.NODE_LISTEN_PORT || 8888
};

var staticServer = null;
exports.startStaticServer = function(callback) {
	var fileServer = new FileServer('./test/fixtures');

	staticServer = http.createServer(function(req, res) {
		req.addListener('end', function() {
			fileServer.serve(req, res);
		}).resume();
	});

	staticServer.listen(
		staticServerParams.port,
		staticServerParams.host,
		callback
	);
};

exports.stopStaticServer = function(callback) {
	staticServer.close();
	callback();
};

exports.getFixturePath = function(name) {
	return [
		'http://',
		staticServerParams.host,
		':',
		staticServerParams.port,
		'/',
		name
	].join('');
};

var expectAndDone = exports.expectAndDone = function(assert, done) {
	return function (err, value) {
		if (err) return done(err);
		assert(value);
		done();
	};
};

// expect that callback returns instance of WebDriver and done the test
exports.expectForDriverAndDone = function(done) {
	return expectAndDone(function(value) {
		expect(value).to.be.a(WebDriver);
	}, done);
};

var expectWebElement = function(element) {
	expect(element).to.be.a(WebElement);
	expect(Number(element.id)).to.be.a('number');
	expect(element.driver).to.be.a(WebDriver);
};
exports.expectWebElement = expectWebElement;

exports.expectForElementAndDone = function(element, done) {
	return expectAndDone(function(value) {
		if (element === 'any') {
			expectWebElement(value);
		} else {
			expect(value).equal(element);
		}
	}, done);
};

exports.elementCommand = function(driver, selector, action, after, callback) {
	callback = callback || function(err) {
		if (err) throw err;
	};
	setTimeout(function() {
		var cmd = 'var el = document.querySelector(\'' + selector + '\');';

		if (action === 'show') {
			//HARDCODE: display block
			cmd += 'el.style.display="block";';
		} else if (action === 'hide') {
			cmd += 'el.style.display="none";';
		} else if (action === 'remove') {
			cmd += 'el.parentNode.removeChild(el);';
		} else if (action === 'disable') {
			cmd += 'el.disabled=true;';
		} else if (action === 'enable') {
			cmd += 'el.disabled=false;';
		} else {
			callback(new Error('Unknown action: ' + action));
		}
		driver.execute(cmd, [], false, callback || function() {});
	}, after || 0);
};

