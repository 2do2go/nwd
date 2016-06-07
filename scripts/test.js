#!/usr/bin/env node

'use strict';

var phantomjs = require('phantomjs');
var childProcess = require('child_process');
var program = require('commander');
var fs = require('fs');
var out = fs.openSync('./phantomjs.log', 'a');
var err = fs.openSync('./phantomjs.log', 'a');


var runTests = function() {
	program['arguments']('[files...]')
		.usage('[files...] [options]')
		.description('Run all or selected tests')
		.parse(process.argv);

	var testFiles = program.args;
	var testArgs = ['--bail', '--async-only', '--reporter', 'spec'];

	var args = testFiles.concat(testArgs);

	return childProcess.spawn(
		'./node_modules/.bin/mocha',
		args,
		{
			stdio: [process.stdin, process.stdout, process.stderr]
		}
	);
};

var runPhantom = function() {
	return childProcess.spawn(phantomjs.path, [
		'--webdriver', '127.0.0.1:4444',
		'--ignore-ssl-errors', 'yes'
	], {
		stdio: ['ignore', out, err]
	});
};

var browser = process.env.NODE_TESTUI_BROWSER || 'phantom';

var phantomProc;
if (browser === 'phantom') {
	phantomProc = runPhantom();
}

var testsProc = runTests();
testsProc.on('close', function() {
	if (phantomProc) {
		phantomProc.kill();
	}
});
