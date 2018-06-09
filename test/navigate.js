'use strict';

var helpers = require('./helpers');
var WebDriver = require('../lib').WebDriver;

var driver = null;

describe('navigates', function() {
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

	it('click on term of service link', function(done) {
		driver.get('[href="terms-of-service.html"]', function(err, termsElement) {
			if (err) return done(err);
			termsElement.click(helpers.expectForElementAndDone(termsElement, done));
		});
	});

	function waitForUrlChangeFromIndexOnTermsOfService() {
		it('wait for url change (on terms of service page url)', function(done) {
			driver.waitForUrlChange(
				helpers.getFixturePath(helpers.indexUrl),
				helpers.getFixturePath(helpers.termsOfServiceUrl),
				helpers.expectForDriverAndDone(done)
			);
		});
	}

	waitForUrlChangeFromIndexOnTermsOfService();

	function goBack() {
		it('go back', function(done) {
			driver.back(helpers.expectForDriverAndDone(done));
		});
	}

	goBack();

	function waitForUrlChangeFromTermsOfServiceOnIndex() {
		it('wait for url change (on index page url)', function(done) {
			driver.waitForUrlChange(
				helpers.getFixturePath(helpers.termsOfServiceUrl),
				helpers.getFixturePath(helpers.indexUrl),
				helpers.expectForDriverAndDone(done)
			);
		});
	}

	waitForUrlChangeFromTermsOfServiceOnIndex();

	it('go forward', function(done) {
		driver.forward(helpers.expectForDriverAndDone(done));
	});

	waitForUrlChangeFromIndexOnTermsOfService();

	goBack();

	waitForUrlChangeFromTermsOfServiceOnIndex();

	var termsElement = null;
	function getTermsElement() {
		it('make terms-of-service link inline-block', function(done) {
			helpers.elementCommand(
				driver,
				'[href="terms-of-service.html"]',
				'show',
				0,
				done
			);
		});

		it('get term of service link element', function(done) {
			driver.get('[href="terms-of-service.html"]', function(err, element) {
				if (err) return done(err);
				termsElement = element;
				done();
			});
		});
	}

	getTermsElement();

	it('move mouse cursor to it', function(done) {
		termsElement.moveTo(helpers.expectForElementAndDone(termsElement, done));
	});
	it('press down left mouse button (via driver)', function(done) {
		driver.mouseDown(helpers.expectForDriverAndDone(done));
	});
	it('releases left mouse button (via driver)', function(done) {
		driver.mouseUp(helpers.expectForDriverAndDone(done));
	});
	waitForUrlChangeFromIndexOnTermsOfService();
	goBack();
	waitForUrlChangeFromTermsOfServiceOnIndex();


	getTermsElement();
	it('press down left mouse button on it', function(done) {
		termsElement.mouseDown(helpers.expectForElementAndDone(termsElement, done));
	});
	it('releases left mouse button on it', function(done) {
		termsElement.mouseUp(helpers.expectForElementAndDone(termsElement, done));
	});
	waitForUrlChangeFromIndexOnTermsOfService();
	goBack();
	waitForUrlChangeFromTermsOfServiceOnIndex();


	getTermsElement();
	it('move mouse cursor to it', function(done) {
		termsElement.moveTo(helpers.expectForElementAndDone(termsElement, done));
	});
	it('click on it via driver', function(done) {
		driver.click(helpers.expectForDriverAndDone(done));
	});
	waitForUrlChangeFromIndexOnTermsOfService();
	goBack();
	waitForUrlChangeFromTermsOfServiceOnIndex();

	it('navigate to terms of service fixture page with qs params', function(done) {
		driver.setUrl(
			helpers.getFixturePath(helpers.termsOfServiceUrl) + '?params1=value1',
			helpers.expectForDriverAndDone(done)
		);
	});

	it(
		'wait for url change (on terms of service page url with qs params) ' +
		'without omit qs params',
		function(done) {
			driver.waitForUrlChange(
				helpers.getFixturePath(helpers.indexUrl),
				helpers.getFixturePath(helpers.termsOfServiceUrl) + '?params1=value1',
				helpers.expectForDriverAndDone(done)
			);
		}
	);

	it('navigate to index fixture page with qs params', function(done) {
		driver.setUrl(
			helpers.getFixturePath(helpers.termsOfServiceUrl) + '?params1=value1',
			helpers.expectForDriverAndDone(done)
		);
	});

	it(
		'wait for url change (on index page url with qs params) with omit qs params',
		function(done) {
			driver.waitForUrlChange(
				helpers.getFixturePath(helpers.indexUrl),
				helpers.getFixturePath(helpers.termsOfServiceUrl),
				{
					omitQueryString: true
				},
				helpers.expectForDriverAndDone(done)
			);
		}
	);

	after(helpers.stopStaticServer);
	after(function(done) {
		driver.deleteSession(done);
	});
});
