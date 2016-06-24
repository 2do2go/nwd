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

describe('element attributes and properties', function() {
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

	it('get explore link href attr via attr', function(done) {
		driver.get('.explore a', function(err, element) {
			element.attr('href', function(err, href) {
				if (err) return done(err);
				expect(href).to.be('https://github.com/explore');
				done();
			});
		});
	});

	it(
		'get explore link href attr via attr using driver element method',
		function(done) {
			driver.element.attr('.explore a', 'href', function(err, href) {
				if (err) return done(err);
				expect(href).to.be('https://github.com/explore');
				done();
			});
		}
	);

	var jqueryFirstForm = null;
	it('get first form using jquery', function(done) {
		driver.get('form:first', {using: 'jquery'}, function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			jqueryFirstForm = element;
			done();
		});
	});

	it('first form is search form (identified by id)', function(done) {
		jqueryFirstForm.getAttr('id', function(err, value) {
			if (err) return done(err);
			expect(value).equal('top_search_form');
			done();
		});
	});

	it('check form by id', function(done) {
		jqueryFirstForm.getAttr('id', function(err, value) {
			if (err) return done(err);
			expect(value).equal('top_search_form');
			done();
		});
	});

	var loginElement = null;
	it('get login element', function(done) {
		driver.get('[name="user[login]"]', function(err, element) {
			if (err) return done(err);
			loginElement = element;
			done();
		});
	});

	it('get placeholder attribute for login element', function(done) {
		loginElement.getAttr('placeholder', function(err, placeholder) {
			if (err) return done(err);
			expect(placeholder).equal('Pick a username');
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

	function itSearchInputElementEnabled(enabled) {
		it('"search" input element enabled ' + enabled, function(done) {
			searchInputElement.isEnabled(function(err, isEnabled) {
				if (err) return done(err);
				expect(isEnabled).to.be.a('boolean');
				expect(isEnabled).equal(enabled);
				done();
			});
		});

		it('"search" input element disabled ' + !enabled, function(done) {
			searchInputElement.isDisabled(function(err, isDisabled) {
				if (err) return done(err);
				expect(isDisabled).to.be.a('boolean');
				expect(isDisabled).equal(!enabled);
				done();
			});
		});

		it(
			'"search" input element disabled ' + !enabled + ' using `prop`',
			function(done) {
				searchInputElement.prop('disabled', function(err, isDisabled) {
					if (err) return done(err);
					expect(isDisabled).to.be.a('boolean');
					expect(isDisabled).equal(!enabled);
					done();
				});
			}
		);
	}

	itSearchInputElementEnabled(true);

	itElementCommand('#js-command-bar-field', 'disable');

	itSearchInputElementEnabled(false);

	itElementCommand('#js-command-bar-field', 'enable');

	itSearchInputElementEnabled(true);

	var checkbox = null;
	it('get test checkbox', function(done) {
		driver.get('#test-checkbox', function(err, element) {
			if (err) return done(err);
			checkbox = element;
			done();
		});
	});

	it('test checkbox is selected', function(done) {
		checkbox.isSelected(function(err, selected) {
			if (err) return done(err);
			expect(selected).to.be.a('boolean');
			expect(selected).to.be(true);
			done();
		});
	});

	it('click on test checkbox', function(done) {
		checkbox.click(helpers.expectForElementAndDone(checkbox, done));
	});

	it('test checkbox is not selected', function(done) {
		checkbox.isSelected(function(err, selected) {
			if (err) return done(err);
			expect(selected).to.be.a('boolean');
			expect(selected).to.be(false);
			done();
		});
	});

	after(helpers.stopStaticServer);
	after(function(done) {
		driver.deleteSession(done);
	});
});
