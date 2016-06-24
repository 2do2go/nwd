'use strict';

var helpers = require('./helpers');
var _ = require('underscore');
var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;

var driver = null;

describe('browser capabilities', function() {
	before(function(done) {
		driver = new WebDriver(helpers.driverParams);
		driver.init(done);
	});

	var currentCapabilities;
	it('get capabilities without error', function(done) {
		driver.getCapabilities(function(err, capabilities) {
			if (err) return done(err);
			currentCapabilities = capabilities;
			done();
		});
	});

	var booleanCapabilities = {
		'internet explorer': [
			'javascriptEnabled', 'takesScreenshot', 'handlesAlerts',
			'cssSelectorsEnabled', 'nativeEvents'
		],
		'firefox': [
			'javascriptEnabled', 'takesScreenshot', 'handlesAlerts',
			'cssSelectorsEnabled', 'nativeEvents',
			'locationContextEnabled', 'applicationCacheEnabled',
			'webStorageEnabled', 'rotatable', 'acceptSslCerts'
		],
		'chrome': [
			'javascriptEnabled',
			'takesScreenshot', 'handlesAlerts', 'databaseEnabled',
			'locationContextEnabled', 'applicationCacheEnabled',
			'browserConnectionEnabled', 'cssSelectorsEnabled',
			'webStorageEnabled', 'rotatable', 'acceptSslCerts',
			'nativeEvents'
		],
		'phantom': [
			'javascriptEnabled',
			'takesScreenshot', 'handlesAlerts', 'databaseEnabled',
			'locationContextEnabled', 'applicationCacheEnabled',
			'browserConnectionEnabled', 'cssSelectorsEnabled',
			'webStorageEnabled', 'rotatable', 'acceptSslCerts',
			'nativeEvents'
		]
	};

	var capabilitiesByTypes = {
		string: ['browserName', 'version', 'platform'],
		'boolean': booleanCapabilities[helpers.browserName]
	};

	_(capabilitiesByTypes).each( function(capabilitiesByType, type) {
		_(capabilitiesByType).each(function(field) {
			it(
				'capabilities should have "' + field + '" of type "' + type + '"',
				function(done) {
					expect(currentCapabilities).have.key(field);
					expect(currentCapabilities[field]).to.be.a(type);
					done();
				}
			);
		});
	});

	after(function(done) {
		driver.deleteSession(done);
	});
});
