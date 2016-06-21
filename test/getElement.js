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

describe('`get` method', function() {
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

	var loginElement = null;
	it('get login element', function(done) {
		driver.get('[name="user[login]"]', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			loginElement = element;
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

	var searchFormElement = null;
	it('get search form element', function(done) {
		driver.get('#top_search_form', function(err, element) {
			if (err) return done(err);
			helpers.expectWebElement(element);
			searchFormElement = element;
			done();
		});
	});

	after(helpers.stopStaticServer);
	after(function(done) {
		driver.deleteSession(done);
	});
});
