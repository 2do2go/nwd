'use strict';

var expect = require('expect.js'),
	WebDriver = require('../lib').WebDriver;

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


describe('webdriver', function() {
	this.timeout(8000);
	var driver = null;
	
	it('init without errors', function(done) {
		driver = new WebDriver(driverParams);
		driver.init(done);
	});

	it('delete cookie', function(done) {
		driver.deleteCookie(done);
	});

	it('maximize window', function(done) {
		driver.maximizeWindow(done);
	});

	it('navigate to fixture page', function(done) {
		driver.setUrl(getFixturePath('github.html'), done);
	});

	it('return current page url', function(done) {
		driver.getUrl(function(err, url) {
			if (err) return done(err);
			expect(url).equal(getFixturePath('github.html'));
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
});
