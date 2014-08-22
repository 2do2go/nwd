'use strict';

var expect = require('expect.js'),
	WebDriver = require('../lib').WebDriver,
	WebElement = require('../lib').WebElement,
	errors = require('../lib').errors,
	path = require('path'),
	fs = require('fs');

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

function expectForElementAndDone(element, done) {
	return expectAndDone(function(value) {
		if (element === 'any') {
			expectWebElement(value);
		} else {
			expect(value).equal(element);
		}
	}, done);
}

function expectWebElement(element) {
	expect(element).to.be.a(WebElement);
	expect(Number(element.id)).to.be.a('number');
	expect(element.driver).to.be.a(WebDriver);
}

var driver = null;

function elementCommand(selector, action, after, callback) {
	callback = callback || function(err) {
		if (err) throw err;
	};
	setTimeout(function() {
		var cmd, el;
		if (/^#/.test(selector)) {
			el = 'var el = document.getElementById("' + selector.slice(1) + '");';
		} else if (/^\./.test(selector)) {
			el = 'var el = document.getElementsByClassName("' + selector.slice(1) + '")[0];';
		} else {
			return callback(new Error('Unrecognized selector: ' + selector));
		}
		if (action === 'show') {
			//HARDCODE: display block
			cmd = el + 'el.style.display="block";';
		} else if (action === 'hide') {
			cmd = el + 'el.style.display="none";';
		} else if (action === 'remove') {
			cmd = el + 'el.parentNode.removeChild(el);';
		} else if (action === 'disable') {
			cmd = el + 'el.disabled=true;';
		} else if (action === 'enable') {
			cmd = el + 'el.disabled=false;';
		} else {
			callback(new Error('Unknown action: ' + action));
		}
		driver.execute(cmd, [], false, callback || function() {});
	}, after || 0);
}

function itElementCommand(selector, action, after) {
	it(action +' ' + selector, function(done) {
		elementCommand(selector, action, after, done);
	});
}

describe('webdriver', function() {
	this.timeout(10000);

	it('init without errors', function(done) {
		driver = new WebDriver(driverParams);
		driver.init(expectForDriverAndDone(done));
	});

	it('delete cookie', function(done) {
		driver.deleteCookie(expectForDriverAndDone(done));
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

	var defaultScriptTimeout = null;
	it('get default script timeout', function(done) {
		defaultScriptTimeout = driver.getTimeout('script');
		done();
	});

	it('set custom script timeout', function(done) {
		driver.setTimeout('script', 500, done);
	});

	it('get custom script timeout', function(done) {
		expect(driver.getTimeout('script')).equal(500);
		done();
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

	it('wait for document ready (jquery)', function(done) {
		driver.waitForDocumentReady(expectForDriverAndDone(done));
	});

	var jqueryFirstForm = null;
	it('get first form using jquery', function(done) {
		driver.get('form:first', {using: 'jquery'}, function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
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

	it('get same for using jquery methods chaining', function(done) {
		driver.get('#js-command-bar-field', {using: 'jquery', chain: [
			{next: ''},
			{closest: 'form'}
		]}, function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			jqueryFirstForm = element;
			done();
		});
	});

	it(
		'return null and no error when get non-existing element using ' +
		'custom strategy with noError: true',
		function(done) {
			driver.get('[name="non-existing"]', {
				using: 'jquery',
				noError: true
			}, function(err, element) {
				expect(err).not.to.be.ok(err);
				expect(element).to.be(null);
				done();
			});
		}
	);

	it('check form by id', function(done) {
		jqueryFirstForm.getAttr('id', function(err, value) {
			if (err) return done(err);
			expect(value).equal('top_search_form');
			done();
		});
	});

	['css selector', 'jquery'].forEach(function(using) {
		var params = {using: using};
		it('get element using ' + using, function(done) {
			driver.get('[name="user[login]"]', params, function(err, element) {
				if (err) return done(err);
				expectWebElement(element);
				done();
			});
		});

		it('get non-existing element return error', function(done) {
			driver.get('[name="non-existing"]', params, function(err) {
				expect(err).to.be.a(errors.NoSuchElementError);
				done();
			});
		});

		it(
			'return null and no error when get non-existing element using ' +
			using + ' with noError: true',
			function(done) {
				driver.get('[name="non-existing"]', {
					using: using,
					noError: true
				}, function(err, element) {
					expect(err).not.to.be.ok(err);
					expect(element).to.be(null);
					done();
				});
			}
		);

		it('get elements using ' + using, function(done) {
			driver.getList('.textfield', params, function(err, elements) {
				if (err) return done(err);
				expect(elements.length).greaterThan(1);
				elements.forEach(expectWebElement);
				done();
			});
		});

		it('get non-existing elements using ' + using +
			' return empty array',
			function(done) {
			driver.getList('.textfield12345', params, function(err, elements) {
				if (err) return done(err);
				expect(elements).length(0);
				done();
			});
		});
	});

	var formElement = null;
	it('get form element', function(done) {
		driver.get('.js-form-signup-home', function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			formElement = element;
			done();
		});
	});

	['css selector', 'jquery'].forEach(function(using) {
		var params = {using: using};
		it('get child element of form using ' + using, function(done) {
			formElement.get(
				'[name="user[login]"]',
				params,
				function(err, element) {
					if (err) return done(err);
					expectWebElement(element);
					done();
				}
			);
		});

		it('get children elements of form using ' + using, function(done) {
			formElement.getList('input[type=text]', params, function(err, elements) {
				if (err) return done(err);
				expect(elements.length).equal(2);
				elements.forEach(expectWebElement);
				done();
			});
		});

		it('get non-existing children elements using ' + using +
			' of form return empty array',
			function(done) {
				formElement.getList(
					'.textfield12345',
					params,
					function(err, elements) {
						if (err) return done(err);
						expect(elements).length(0);
						done();
					}
				);
			});
	});

	it('set login element via Element.element', function(done) {
		formElement.element.sendKeys('[name="user[login]"]', 'abc', function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			done();
		});
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
			expectWebElement(element);
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

	function itGetEnteredLogin(expected, params) {
		params = params || {};
		it('get entered login using' +
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
		});
	}

	function itClearLoginField() {
		it('clear login field', function(done) {
			loginElement.clear(expectForElementAndDone(loginElement, done));
		});
	}

	it('enter part of login using element method', function(done) {
		loginElement.sendKeys('pat', expectForElementAndDone(loginElement, done));
	});
	itGetEnteredLogin('pat');
	it('keep entering login', function(done) {
		loginElement.sendKeys('rik', expectForElementAndDone(loginElement, done));
	});
	itGetEnteredLogin('patrik');
	it('clear and enter login again', function(done) {
		loginElement.sendKeys('patrik2000', {
			clear: true
		}, expectForElementAndDone(loginElement, done));
	});
	itGetEnteredLogin('patrik2000');
	itClearLoginField();

	it('enter login using driver method', function(done) {
		driver.sendKeys('bob', expectForDriverAndDone(done));
	});
	itGetEnteredLogin('bob', {useDriverElementMethod: true});
	itClearLoginField();

	it('enter login using driver element method', function(done) {
		driver.element.sendKeys(
			'[name="user[login]"]',
			'spanch',
			expectForElementAndDone('any', done)
		);
	});
	itGetEnteredLogin('spanch');

	it('clear amd enter login using driver element method', function(done) {
		driver.element.sendKeys(
			'[name="user[login]"]',
			'spanch2000',
			{clear: true},
			expectForElementAndDone('any', done)
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

	var checkbox = null;
	it('get test checkbox', function(done) {
		driver.get('#test-checkbox', function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
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
		checkbox.click(expectForElementAndDone(checkbox, done));
	});

	it('test checkbox is not selected', function(done) {
		checkbox.isSelected(function(err, selected) {
			if (err) return done(err);
			expect(selected).to.be.a('boolean');
			expect(selected).to.be(false);
			done();
		});
	});

	var searchFormElement = null;
	it('get search form element', function(done) {
		driver.get('#top_search_form', function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			searchFormElement = element;
			done();
		});
	});

	var searchInputElement = null;
	it('get search input element', function(done) {
		driver.get('#js-command-bar-field', function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			searchInputElement = element;
			done();
		});
	});

	it('wait for search input detach (remove element after 50 ms)', function(done) {
		searchInputElement.waitForDetach(function(err) {
			if (err) return done(err);
			done();
		});
		elementCommand('#js-command-bar-field', 'remove', 50);
	});

	it('refresh current page', function(done) {
		driver.refresh(expectForDriverAndDone(done));
	});

	it('get search form element again (after page refresh)', function(done) {
		driver.get('#top_search_form', function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			searchFormElement = element;
			done();
		});
	});

	it('get search input element (should exist after page refresh)', function(done) {
		driver.get('#js-command-bar-field', function(err, element) {
			if (err) return done(err);
			expectWebElement(element);
			searchInputElement = element;
			done();
		});
	});

	function itSearchInputElementEnabled(enabled) {
		it('search input element enabled ' + enabled, function(done) {
			searchInputElement.isEnabled(function(err, isEnabled) {
				if (err) return done(err);
				expect(isEnabled).to.be.a('boolean');
				expect(isEnabled).equal(enabled);
				done();
			});
		});
		it('search input element disabled ' + !enabled, function(done) {
			searchInputElement.isDisabled(function(err, isDisabled) {
				if (err) return done(err);
				expect(isDisabled).to.be.a('boolean');
				expect(isDisabled).equal(!enabled);
				done();
			});
		});
	}

	itSearchInputElementEnabled(true);

	itElementCommand('#js-command-bar-field', 'disable');

	itSearchInputElementEnabled(false);

	itElementCommand('#js-command-bar-field', 'enable');

	itSearchInputElementEnabled(true);

	it('get search form visibility', function(done) {
		searchFormElement.getCssProp('visibility', function(err, visibility) {
			if (err) return callback(err);
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

	it('wait for search for disappear (hide element)', function(done) {
		searchFormElement.waitForDisappear(expectForDriverAndDone(done));
		elementCommand('#top_search_form', 'hide', 100);
	});

	itElementCommand('#top_search_form', 'show');

	it('wait for search for disappear (remove element)', function(done) {
		searchFormElement.waitForDisappear(expectForDriverAndDone(done));
		elementCommand('#top_search_form', 'remove', 100);
	});

	it('wait for new element', function(done) {
		driver.waitForElement('#new-element', expectForDriverAndDone(done));
		setTimeout(function() {
			driver.execute(function() {
				var el = document.createElement('div');
				el.setAttribute('id', 'new-element');
				document.body.appendChild(el);
			}, [], false, function() {});
		}, 100);
	});

	function itGetTextOfHeadingElement(expected, params) {
		params = params || {};
		var label = expected === '' ? 'empty string' : expected;
		it('get text of heading element using' +
			(params.useDriverElementMethod ? ' driver ' : ' ')
			+ 'element method it should be equal to ' + label,
			function(done) {
				if (params.useDriverElementMethod) {
					driver.element.getText('.heading', function(err, text) {
						if (err) return done(err);
						expect(text).equal(expected);
						done();
					});
				} else {
					driver.get('.heading', function(err, headingElement) {
						if (err) return done(err);
						expectWebElement(headingElement);
						headingElement.getText(function(err, text) {
							if (err) return done(err);
							expect(text).equal(expected);
							done();
						});
					});
				}
		});
	}

	itGetTextOfHeadingElement('Build software better, together.');
	itGetTextOfHeadingElement('Build software better, together.', {useDriverElementMethod: true});

	itElementCommand('.heading', 'hide');

	itGetTextOfHeadingElement('');

	itElementCommand('.heading', 'show');

	it('click on term of service link', function(done) {
		driver.get('[href="terms-of-service.html"]', function(err, termsElement) {
			if (err) return done(err);
			expectWebElement(termsElement);
			termsElement.click(expectForElementAndDone(termsElement, done));
		});
	});

	function waitForUrlChangeFromIndexOnTermsOfService() {
		it('wait for url change (on terms of service page url)', function(done) {
			driver.waitForUrlChange(
				getFixturePath('github/index.html'),
				getFixturePath('github/terms-of-service.html'),
				expectForDriverAndDone(done)
			);
		});
	}

	waitForUrlChangeFromIndexOnTermsOfService();

	function goBack() {
		it('go back', function(done) {
			driver.back(expectForDriverAndDone(done));
		});
	}

	goBack();

	function waitForUrlChangeFromTermsOfServiceOnIndex() {
		it('wait for url change (on index page url)', function(done) {
			driver.waitForUrlChange(
				getFixturePath('github/terms-of-service.html'),
				getFixturePath('github/index.html'),
				expectForDriverAndDone(done)
			);
		});
	}

	waitForUrlChangeFromTermsOfServiceOnIndex();

	it('go forward', function(done) {
		driver.forward(expectForDriverAndDone(done));
	});

	waitForUrlChangeFromIndexOnTermsOfService();

	goBack();

	waitForUrlChangeFromTermsOfServiceOnIndex();

	var termsElement = null;
	function getTermsElement() {
		it('get term of service link element', function(done) {
			driver.get('[href="terms-of-service.html"]', function(err, element) {
				if (err) return done(err);
				expectWebElement(element);
				termsElement = element;
				done();
			});
		});
	}


	getTermsElement();

	it('move mouse cursor to it', function(done) {
		termsElement.moveTo(expectForElementAndDone(termsElement, done));
	});
	it('press down left mouse button (via driver)', function(done) {
		driver.mouseDown(expectForDriverAndDone(done));
	});
	it('releases left mouse button (via driver)', function(done) {
		driver.mouseUp(expectForDriverAndDone(done));
	});
	waitForUrlChangeFromIndexOnTermsOfService();
	goBack();
	waitForUrlChangeFromTermsOfServiceOnIndex();


	getTermsElement();
	it('press down left mouse button on it', function(done) {
		termsElement.mouseDown(expectForElementAndDone(termsElement, done));
	});
	it('releases left mouse button on it', function(done) {
		termsElement.mouseUp(expectForElementAndDone(termsElement, done));
	});
	waitForUrlChangeFromIndexOnTermsOfService();
	goBack();
	waitForUrlChangeFromTermsOfServiceOnIndex();


	getTermsElement();
	it('move mouse cursor to it', function(done) {
		termsElement.moveTo(expectForElementAndDone(termsElement, done));
	});
	it('click on it via driver', function(done) {
		driver.click(expectForDriverAndDone(done));
	});
	waitForUrlChangeFromIndexOnTermsOfService();
	goBack();
	waitForUrlChangeFromTermsOfServiceOnIndex();

	it('make screenshot', function(done) {
		//TODO: replace /tmp on os.tmpdir() after node update
		var tmpFile = path.join('/tmp', 'nwd_screenshot_' + Date.now() + '.png');
		driver.makeScreenshot(tmpFile, function(err) {
			if (err) return done(err);
			fs.exists(tmpFile, function(isExists) {
				if (isExists) fs.unlink(tmpFile, done);
			});
		});
	});

	it('delete session', function(done) {
		driver.deleteSession(expectForDriverAndDone(done));
	});
});
