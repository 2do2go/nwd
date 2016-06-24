
'use strict';

var helpers = require('./helpers');
var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;

var driver = null;

describe('change input methods', function() {
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

	var formElement = null;
	it('get form element', function(done) {
		driver.get('.js-form-signup-home', function(err, element) {
			if (err) return done(err);
			formElement = element;
			done();
		});
	});

	it('set login element via Element.element', function(done) {
		formElement.element.sendKeys(
			'[name="user[login]"]',
			'abc',
			function(err) {
				if (err) return done(err);
				done();
			}
		);
	});

	it('check login element value', function(done) {
		formElement.element.getValue('[name="user[login]"]', function(err, value) {
			if (err) return done(err);
			expect(value).to.be('abc');
			done();
		});
	});

	it('clear login element value', function(done) {
		formElement.element.clear('[name="user[login]"]', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			done();
		});
	});

	it('check login element value', function(done) {
		formElement.element.getValue('[name="user[login]"]', function(err, value) {
			if (err) return done(err);
			expect(value).to.be('');
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

	function itGetEnteredLogin(expected, params) {
		params = params || {};
		it(
			'get entered login using' +
				(params.useDriverElementMethod ? ' driver ' : ' ') + 'element method',
			function(done) {
				function expectAndDone(err, login) {
					if (err) return done(err);
					expect(login).equal(expected);
					done();
				}
				if (params.useDriverElementMethod) {
					driver.element.getValue('[name="user[login]"]', expectAndDone);
				} else {
					loginElement.getValue(expectAndDone);
				}
			}
		);
	}

	function itClearLoginField() {
		it('clear login field', function(done) {
			loginElement.clear(helpers.expectForElementAndDone(loginElement, done));
		});
	}

	it('enter part of login using element method', function(done) {
		loginElement.sendKeys(
			'pat',
			helpers.expectForElementAndDone(loginElement, done)
		);
	});
	itGetEnteredLogin('pat');
	it('keep entering login', function(done) {
		loginElement.sendKeys(
			'rik',
			helpers.expectForElementAndDone(loginElement, done)
		);
	});
	itGetEnteredLogin('patrik');
	it('clear and enter login again', function(done) {
		loginElement.sendKeys('patrik2000', {
			clear: true
		}, helpers.expectForElementAndDone(loginElement, done));
	});
	itGetEnteredLogin('patrik2000');
	itClearLoginField();

	it('enter login using driver method', function(done) {
		driver.sendKeys('bob', helpers.expectForDriverAndDone(done));
	});
	itGetEnteredLogin('bob', {useDriverElementMethod: true});
	itClearLoginField();

	it('enter login using driver element method', function(done) {
		driver.element.sendKeys(
			'[name="user[login]"]',
			'spanch',
			helpers.expectForElementAndDone('any', done)
		);
	});
	itGetEnteredLogin('spanch');

	it('clear and enter login using driver element method', function(done) {
		driver.element.sendKeys(
			'[name="user[login]"]',
			'spanch2000',
			{clear: true},
			helpers.expectForElementAndDone('any', done)
		);
	});
	itGetEnteredLogin('spanch2000');
	itClearLoginField();

	it('get cleared login', function(done) {
		loginElement.getValue(function(err, login) {
			if (err) return done(err);
			expect(login).equal('');
			done();
		});
	});

	after(helpers.stopStaticServer);
	after(function(done) {
		driver.deleteSession(done);
	});
});
