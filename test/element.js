'use strict';

var helpers = require('./helpers');
var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;
var errors = require('../lib').errors;

var driver = null;

function itElementCommand(selector, action, after) {
	it(action + ' ' + selector, function(done) {
		helpers.elementCommand(driver, selector, action, after, done);
	});
}

describe('element', function() {
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

	it('get same for using jquery methods chaining', function(done) {
		driver.get('#js-command-bar-field', {using: 'jquery', chain: [
			{next: ''},
			{closest: 'form'}
		]}, function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			jqueryFirstForm = element;
			done();
		});
	});

	function itGetTextOfHeadingElement(expected, params) {
		params = params || {};
		var methodName = params.useJqueryTextMethod ? 'text' : 'getText';
		var label = 'get text of heading element using .' + methodName + '() ';
		if (params.useDriverElementMethod) {
			label += 'driver ';
		}
		label += 'element method it should be equal to ' +
			(expected === '' ? 'empty string' : '"' + expected + '"');

		it(label, function(done) {
			if (params.useDriverElementMethod) {
				driver.element[methodName]('.heading', function(err, text) {
					if (err) return done(err);
					expect(text).equal(expected);
					done();
				});
			} else {
				driver.get('.heading', function(err, headingElement) {
					if (err) return done(err);
					helpers.expectWebElement(headingElement);
					headingElement[methodName](function(err, text) {
						if (err) return done(err);
						expect(text).equal(expected);
						done();
					});
				});
			}
		});
	}

	itGetTextOfHeadingElement('Build software better, together.');
	itGetTextOfHeadingElement('Build software better, together.', {
		useDriverElementMethod: true
	});

	itGetTextOfHeadingElement('Build software better, together.', {
		useJqueryTextMethod: true
	});
	itGetTextOfHeadingElement('Build software better, together.', {
		useJqueryTextMethod: true,
		useDriverElementMethod: true
	});

	itElementCommand('.heading', 'hide');

	itGetTextOfHeadingElement('');
	itGetTextOfHeadingElement('Build software better, together.', {
		useJqueryTextMethod: true
	});

	itElementCommand('.heading', 'show');

	var formElement = null;
	it('get form element', function(done) {
		driver.get('.js-form-signup-home', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			formElement = element;
			done();
		});
	});

	it('set login element via Element.element', function(done) {
		formElement.element.sendKeys(
			'[name="user[login]"]',
			'abc',
			function(err, element) {
				if (err) return done(err);
				helpers.expectWebElement(element);
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

	['css selector', 'jquery'].forEach(function(using) {
		var params = {using: using};
		it('get element using ' + using, function(done) {
			driver.get('[name="user[login]"]', params, function(err, element) {
				if (err) return done(err);
				helpers.expectWebElement(element);
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
				elements.forEach(helpers.expectWebElement);
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

	it('get explore link href attr via attr', function(done) {
		driver.get('.explore a', function(err, element) {
			element.attr('href', function(err, href) {
				if (err) return done(err);
				expect(href).to.be('https://github.com/explore');
				done();
			});
		});
	});

	it('get explore link href attr via attr using driver element method',
	   function(done) {
		   driver.element.attr('.explore a', 'href', function(err, href) {
			   if (err) return done(err);
			   expect(href).to.be('https://github.com/explore');
			   done();
		   });
	   }
	  );

	it('get form element', function(done) {
		driver.get('.js-form-signup-home', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
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
					helpers.expectWebElement(element);
					done();
				}
			);
		});

		it('get children elements of form using ' + using, function(done) {
			formElement.getList('input[type=text]', params, function(err, elements) {
				if (err) return done(err);
				//ie don't work with input[type=password], he transform it to text type
				if (helpers.browserName != 'internet explorer') {
					expect(elements.length).equal(2);
				} else {
					expect(elements.length).equal(3);
				}
				elements.forEach(helpers.expectWebElement);
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

	it('get form element', function(done) {
		driver.get('.js-form-signup-home', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			formElement = element;
			done();
		});
	});

	it('wait for new element', function(done) {
		driver.waitForElement('#new-element', helpers.expectForDriverAndDone(done));
		setTimeout(function() {
			driver.execute(function() {
				/*jshint ignore:start*/
			var el = document.createElement('div');
			el.setAttribute('id', 'new-element');
			document.body.appendChild(el);
				/*jshint ignore:end*/
			}, [], false, function() {});
		}, 100);
	});

	it('wait for new element inside form', function(done) {
		formElement.waitForElement(
			'#new-element2',
			helpers.expectForDriverAndDone(done)
		);
		setTimeout(function() {
			driver.execute(function() {
				/*jshint ignore:start*/
			var el = document.createElement('div');
			el.setAttribute('id', 'new-element2');
			arguments[0].appendChild(el);
				/*jshint ignore:end*/
			}, [{ELEMENT: formElement.id}], false, function() {});
		}, 100);
	});

	it(
		'wait for new element inside form should fail if element appear ' +
			'outside form',
			function(done) {
				formElement.waitForElement(
					'#new-element3',
					{timeout: 200},
					function(err) {
						expect(err).to.be.an(Error);
						expect(err.message).equal(
							'Timeout (200 ms) exceeded while waiting for ' +
								'element #new-element3'
						);
						done();
					}
				);
				setTimeout(function() {
					driver.execute(function() {
						/*jshint ignore:start*/
					var el = document.createElement('div');
					el.setAttribute('id', 'new-element3');
					document.body.appendChild(el);
						/*jshint ignore:end*/
					}, [], false, function() {});
				}, 100);
			}
	);

	var loginElement = null;
	it('get login element', function(done) {
		driver.get('[name="user[login]"]', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
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

	var checkbox = null;
	it('get test checkbox', function(done) {
		driver.get('#test-checkbox', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
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


	var searchFormElement = null;
	it('get search form element', function(done) {
		driver.get('#top_search_form', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			searchFormElement = element;
			done();
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

	it('get search form element again (after page refresh)', function(done) {
		driver.get('#top_search_form', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			searchFormElement = element;
			done();
		});
	});

	it('get search input element(should exist after refresh)', function(done) {
		driver.get('#js-command-bar-field', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
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
		it('search input element disabled ' + !enabled + ' using `prop`',
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
