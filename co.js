'use strict';

var nwd = require('./lib'),
	co = require('co'),
	thunkify = require('thunkify');

var driver = new nwd.WebDriver({
	desiredCapabilities: {
		browserName: 'chrome'
	}
});

driver.init = thunkify(driver.init);
driver.setUrl = thunkify(driver.setUrl);
driver.getUrl = thunkify(driver.getUrl);

//yield (yield driver.init()).setUrl('http://google.com');
co(function *(){
	yield (yield driver.init()).setUrl('http://google.com');
	console.log('>>> url = ', yield driver.getUrl())
})()
