'use strict';

var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;
var path = require('path');
var helpers = require('./helpers');
var os = require('os');
var fs = require('fs');

var driver = null;

describe('driver', function() {
	this.timeout(helpers.testTimeout);

	before(helpers.startStaticServer);

	it('init without errors', function(done) {
		driver = new WebDriver(helpers.driverParams);
		driver.init(helpers.expectForDriverAndDone(done));
	});

	it('delete cookie', function(done) {
		driver.deleteCookie(helpers.expectForDriverAndDone(done));
	});

	it('maximize window', function(done) {
		driver.maximizeWindow(helpers.expectForDriverAndDone(done));
	});

	it('navigate to fixture page', function(done) {
		driver.setUrl(
			helpers.getFixturePath(helpers.indexUrl),
			helpers.expectForDriverAndDone(done)
		);
	});

	it('return current page title', function(done) {
		driver.getTitle(function(err, title) {
			if (err) return done(err);
			expect(title).equal('GitHub · Build software better, together.');
			done();
		});
	});

	it('make screenshot', function(done) {
		var tmpFile = path.join(
			os.tmpdir(),
			'nwd_screenshot_' + Date.now() + '.png'
		);
		driver.makeScreenshot(tmpFile, function(err) {
			if (err) return done(err);
			fs.exists(tmpFile, function(isExists) {
				if (isExists) fs.unlink(tmpFile, done);
			});
		});
	});

	var searchInputElement = null;
	it('get search input element', function(done) {
		driver.get('#js-command-bar-field', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			searchInputElement = element;
			done();
		});
	});

	it(
		'wait for search input detach(remove element after 50 ms)',
		function(done) {
			searchInputElement.waitForDetach(function(err) {
				if (err) return done(err);
				done();
			});
			helpers.elementCommand(driver, '#js-command-bar-field', 'remove', 50);
		}
	);

	it('refresh current page', function(done) {
		driver.refresh(helpers.expectForDriverAndDone(done));
	});

	it('wait for document ready (jquery)', function(done) {
		driver.waitForDocumentReady(helpers.expectForDriverAndDone(done));
	});

	it('get search input element(should exist after refresh)', function(done) {
		driver.get('#js-command-bar-field', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			searchInputElement = element;
			done();
		});
	});

	if (helpers.browserName != 'internet explorer') {
		it('get log', function(done) {
			driver.getLog('browser', function(err, log) {
				if (err) return done(err);
				expect(log).to.be.an('array');
				done();
			});
		});
	}

	it('delete session', function(done) {
		driver.deleteSession(helpers.expectForDriverAndDone(done));
	});

	after(helpers.stopStaticServer);
});
