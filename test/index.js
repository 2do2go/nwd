'use strict';

var expect = require('expect.js'),
	WebDriver = require('../lib').WebDriver,
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

	it('maximize window', function(done) {
		driver.maximizeWindow(expectForDriverAndDone(done));
	});

	it('navigate to fixture page', function(done) {
		driver.setUrl(getFixturePath('github.html'), expectForDriverAndDone(done));
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

	it('get element using css selector', function(done) {
		driver.getId({
			selector: '[name="user[login]"]',
			strategy: 'css selector'
		}, function(err, id) {
			if (err) return done(err);
			expect(Number(id)).to.be.a('number');
			done();
		});
	});

	it('get non-existing element return error', function(done) {
		driver.getId({
			selector: '[name="non-existing"]',
			strategy: 'css selector'
		}, function(err, id) {
			expect(err).to.be.a(errors.NoSuchElementError);
			done();
		});
	});

	it('get elements using selector', function(done) {
		driver.getIds({
			selector: '.textfield',
			strategy: 'css selector'
		}, function(err, ids) {
			if (err) return done(err);
			expect(ids.length).greaterThan(1);
			ids.forEach(function(id) {
				expect(Number(id)).to.be.a('number');
			});
			done();
		});
	});

	it('get non-existing elements return empty array', function(done) {
		driver.getIds({
			selector: '.non-existing-textfield',
			strategy: 'css selector'
		}, function(err, ids) {
			if (err) return done(err);
			expect(ids).length(0);
			done();
		});
	});

	it('delete session', function(done) {
		driver.deleteSession(expectForDriverAndDone(done));
	});
});
