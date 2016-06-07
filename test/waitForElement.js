'use strict';

var helpers = require('./helpers');
var expect = require('expect.js');
var WebDriver = require('../lib').WebDriver;

var driver = null;

describe('`waitForElement` method', function() {
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

	var formElement = null;
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

	after(helpers.stopStaticServer);
	after(function(done) {
		driver.deleteSession(done);
	});
});
