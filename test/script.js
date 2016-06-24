'use strict';

var helpers = require('./helpers');
var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;

var driver = null;

describe('script', function() {
	before(function(done) {
		driver = new WebDriver(helpers.driverParams);
		driver.init(done);
	});

	var defaultScriptTimeout = null;
	it('get default script timeout', function(done) {
		driver.getTimeout('script', function(err, timeout) {
			if (err) done(err);
			expect(timeout).to.be.a('number');
			defaultScriptTimeout = timeout;
			done();
		});
	});

	it('set custom script timeout', function(done) {
		driver.setTimeout('script', 500, done);
	});

	it('get custom script timeout', function(done) {
		driver.getTimeout('script', function(err, timeout) {
			if (err) done(err);
			expect(timeout).equal(500);
			done();
		});
	});

	it('set default script timeout', function(done) {
		driver.setTimeout('script', defaultScriptTimeout, done);
	});

	it('execute sync js on page', function(done) {
		driver.execute(
			'var a = arguments[0];' +
				'var b = arguments[1];' +
				'return a + b;',
				[1, 3],
				false,
				function(err, result) {
					if (err) done(err);
					expect(result).equal(4);
					done();
				}
		);
	});

	it('execute async js on page', function(done) {
		driver.execute(
			'var a = arguments[0];' +
				'var b = arguments[1];' +
				'var callback = arguments[2];' +
				'setTimeout(function() {' +
				'callback(a + b);' +
				'}, 100);',
				[1, 3],
				true,
				function(err, result) {
					if (err) done(err);
					expect(result).equal(4);
					done();
				}
		);
	});

	after(function(done) {
		driver.deleteSession(done);
	});
});
