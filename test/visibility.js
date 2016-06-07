'use strict';

var helpers = require('./helpers');
var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;

var driver = null;

function itElementCommand(selector, action, after) {
	it(action + ' ' + selector, function(done) {
		helpers.elementCommand(driver, selector, action, after, done);
	});
}

describe('visibility methods', function() {
	this.timeout(helpers.testTimeout);

	before(helpers.startStaticServer);
	before(function(done) {
		driver = new WebDriver(helpers.driverParams);
		driver.init(done);
	});

	it('navigate to fixture page', function(done) {
		driver.setUrl(
			helpers.getFixturePath(helpers.indexUrl),
			helpers.expectForDriverAndDone(done)
		);
	});

	it('wait for document ready (inject jquery)', function(done) {
		driver.waitForDocumentReady(helpers.expectForDriverAndDone(done));
	});

	var searchFormElement = null;
	it('get search form element', function(done) {
		driver.get('#top_search_form', function(err, element) {
			if (err) return done(err);
			searchFormElement = element;
			done();
		});
	});

	var searchInputElement = null;
	it('get search input element', function(done) {
		driver.get('#js-command-bar-field', function(err, element) {
			if (err) return done(err);
			searchInputElement = element;
			done();
		});
	});

	itElementCommand('#top_search_form', 'hide');

	it('search form element is not visible', function(done) {
		searchFormElement.isVisible(function(err, isVisible) {
			if (err) return done(err);
			expect(isVisible).equal(false);
			done();
		});
	});
	it('and not displayed', function(done) {
		searchFormElement.isDisplayed(function(err, isDisplayed) {
			if (err) return done(err);
			expect(isDisplayed).equal(false);
			done();
		});
	});

	it('search input element is not visible', function(done) {
		searchInputElement.isVisible(function(err, isVisible) {
			if (err) return done(err);
			expect(isVisible).equal(false);
			done();
		});
	});
	it('and not displayed', function(done) {
		searchInputElement.isDisplayed(function(err, isDisplayed) {
			if (err) return done(err);
			expect(isDisplayed).equal(false);
			done();
		});
	});

	itElementCommand('#top_search_form', 'show');

	it('get search form visibility using selenium method', function(done) {
		searchFormElement.getCssProp('visibility', function(err, visibility) {
			if (err) return done(err);
			expect(visibility).equal('visible');
			done();
		});
	});

	it('get search form visibility using jquery method', function(done) {
		searchFormElement.css('visibility', function(err, visibility) {
			if (err) return done(err);
			expect(visibility).equal('visible');
			done();
		});
	});

	it('search form element is visible', function(done) {
		searchFormElement.isVisible(function(err, isVisible) {
			if (err) return done(err);
			expect(isVisible).equal(true);
			done();
		});
	});
	it('and displayed', function(done) {
		searchFormElement.isDisplayed(function(err, isDisplayed) {
			if (err) return done(err);
			expect(isDisplayed).equal(true);
			done();
		});
	});

	it('search input element is visible', function(done) {
		searchInputElement.isVisible(function(err, isVisible) {
			if (err) return done(err);
			expect(isVisible).equal(true);
			done();
		});
	});

	it('and displayed', function(done) {
		searchInputElement.isDisplayed(function(err, isDisplayed) {
			if (err) return done(err);
			expect(isDisplayed).equal(true);
			done();
		});
	});

	it('wait for search for disappear (hide element)', function(done) {
		searchFormElement.waitForDisappear(helpers.expectForDriverAndDone(done));
		helpers.elementCommand(driver, '#top_search_form', 'hide', 100);
	});

	itElementCommand('#top_search_form', 'show');

	it('wait for search for disappear (remove element)', function(done) {
		searchFormElement.waitForDisappear(helpers.expectForDriverAndDone(done));
		helpers.elementCommand(driver, '#top_search_form', 'remove', 100);
	});

	after(helpers.stopStaticServer);
	after(function(done) {
		driver.deleteSession(done);
	});
});
