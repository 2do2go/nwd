'use strict';

var expect = require('expect.js'),
	WebDriver = require('../lib').WebDriver,
	WebElement = require('../lib').WebElement,
	errors = require('../lib').errors;

var driverParams = {
	host: '127.0.0.1',
	port: 4444,
	desiredCapabilities: {
		acceptSslCerts: true,
		browserName: 'chrome'
	}
};

function getFixturePath(name) {
	return 'file://' + __dirname + '/fixtures/' + name;
}

function expectAndDone(assert, done) {
	return function (err, value) {
		if (err) return done(err);
		assert(value);
		done();
	}
}

// expect that callback returns instance of WebDriver and done the test
function expectForDriverAndDone(done) {
	return expectAndDone(function(value) {
		expect(value).to.be.a(WebDriver);
	}, done);
}

function expectWebElement(element) {
	expect(element).to.be.a(WebElement);
	expect(Number(element.id)).to.be.a('number');
	expect(element.driver).to.be.a(WebDriver);
}

describe('webdriver', function() {
	this.timeout(10000);
	var driver = null;

	it('init without errors', function(done) {
		driver = new WebDriver(driverParams);
		driver.init(expectForDriverAndDone(done));
	});

	it('delete cookie', function(done) {
		driver.deleteCookie(expectForDriverAndDone(done));
	});

	it('refresh current page', function(done) {
		driver.refresh(expectForDriverAndDone(done));
	});

	it('maximize window', function(done) {
		driver.maximizeWindow(expectForDriverAndDone(done));
	});

	it('navigate to fixture page', function(done) {
		driver.setUrl(getFixturePath('github/index.html'), expectForDriverAndDone(done));
	});

	it('return current page url', function(done) {
		driver.getUrl(function(err, url) {
			if (err) return done(err);
			expect(url).equal(getFixturePath('github/index.html'));
			done();
		});
	});

	it('return current page title', function(done) {
		driver.getTitle(function(err, title) {
			if (err) return done(err);
			expect(title).equal('GitHub · Build software better, together.');
			done();
		});
	});

	it('set timeout', function(done) {
		driver.setTimeout('script', 500, done);
	});

	it('get timeout', function(done) {
		driver.getTimeout('script', function(err, timeout) {
			if (err) return done(err);
			expect(timeout).equal(500);
			done();
		});
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

	it('get element using css selector', function(done) {
		driver.get({
			selector: '[name="user[login]"]',
			strategy: 'css selector'
		}, function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			done();
		});
	});

	it('get non-existing element return error', function(done) {
		driver.get({
			selector: '[name="non-existing"]',
			strategy: 'css selector'
		}, function(err, id) {
			expect(err).to.be.a(errors.NoSuchElementError);
			done();
		});
	});

	it('get elements using selector', function(done) {
		driver.getList({
			selector: '.textfield',
			strategy: 'css selector'
		}, function(err, elements) {
			if (err) return done(err);
			expect(elements.length).greaterThan(1);
			elements.forEach(expectWebElement);
			done();
		});
	});

	it('get non-existing elements return empty array', function(done) {
		driver.getList({
			selector: '.non-existing-textfield',
			strategy: 'css selector'
		}, function(err, elements) {
			if (err) return done(err);
			expect(elements).length(0);
			done();
		});
	});

	var formElement = null;
	it('get form element', function(done) {
		driver.get({
			selector: '.js-form-signup-home',
			strategy: 'css selector'
		}, function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			formElement = element;
			done();
		});
	});

	it('get child element of form', function(done) {
		formElement.get({
			selector: '[name="user[login]"]',
			strategy: 'css selector'
		}, function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			done();
		});
	});

	it('get children elements of form', function(done) {
		formElement.getList({
			selector: '.textfield',
			strategy: 'css selector'
		}, function(err, elements) {
			if (err) return done(err);
			expect(elements.length).greaterThan(1);
			elements.forEach(expectWebElement);
			done();
		});
	});

	it('form element is displayed', function(done) {
		formElement.isDisplayed(function(err, isDisplayed) {
			if (err) return done(err);
			expect(isDisplayed).to.be.a('boolean');
			expect(isDisplayed).equal(true);
			done();
		});
	});

	var loginElement = null;
	it('get login element', function(done) {
		driver.get({
			selector: '[name="user[login]"]',
			strategy: 'css selector'
		}, function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
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

	it('get tag name of login element', function(done) {
		loginElement.getTagName(function(err, name) {
			if (err) return done(err);
			expect(name).equal('input');
			done();			
		});
	});

	it('enter login', function(done) {
		loginElement.sendKeys('patrik', expectForDriverAndDone(done));
	});

	it('get entered login', function(done) {
		loginElement.getValue(function(err, login) {
			if (err) return done(err);
			expect(login).equal('patrik');
			done();
		});
	});

	it('clear login field', function(done) {
		loginElement.clear(expectForDriverAndDone(done));
	});

	it('get cleared login', function(done) {
		loginElement.getValue(function(err, login) {
			if (err) return done(err);
			expect(login).equal('');
			done();
		});
	});

	it('get text of heading element', function(done) {
		driver.get({
			selector: '.heading',
			strategy: 'css selector'
		}, function(err, headingElement) {
			if (err) return done(err);
			expectWebElement(headingElement);
			headingElement.getText(function(err, text) {
				if (err) return done(err);
				expect(text).equal('Build software better, together.');
				done();
			});
		});
	});

	it('click on term of service link', function(done) {
		driver.get({
			selector: '[href="terms-of-service.html"]',
			strategy: 'css selector'
		}, function(err, termsElement) {
			if (err) return done(err);
			expectWebElement(termsElement);
			termsElement.click(expectForDriverAndDone(done));
		});
	});

	it('wait for url change', function(done) {
		driver.waitForUrlChange(
			getFixturePath('github/index.html'),
			null,
			expectForDriverAndDone(done)
		);
	});

	it('return current page url (terms of service)', function(done) {
		driver.getUrl(function(err, url) {
			if (err) return done(err);
			expect(url).equal(getFixturePath('github/terms-of-service.html'));
			done();
		});
	});

	it('got to back to index page', function(done) {
		driver.back(expectForDriverAndDone(done));
	});

	it('wait for url change', function(done) {
		driver.waitForUrlChange(
			getFixturePath('github/terms-of-service.html'),
			getFixturePath('github/index.html'),
			expectForDriverAndDone(done)
		);
	});

	it('return current page url (index page)', function(done) {
		driver.getUrl(function(err, url) {
			if (err) return done(err);
			expect(url).equal(getFixturePath('github/index.html'));
			done();
		});
	});

	it('delete session', function(done) {
		driver.deleteSession(expectForDriverAndDone(done));
	});
});
