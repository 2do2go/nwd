#!/usr/bin/env node

'use strict';

var phantomjs = require('phantomjs');
var childProcess = require('child_process');
var program = require('commander');
var fs = require('fs');

var runTests = function() {
	program['arguments']('[files...]')
		.usage('[files...] [options]')
		.description('Run all or selected tests')
		.parse(process.argv);

	var testFiles = program.args;
	var testArgs = ['--bail', '--async-only', '--reporter', 'spec',
		'--timeout', '16000'];

	var args = testFiles.concat(testArgs);

	return childProcess.spawn(
		'./node_modules/.bin/mocha',
		args,
		{
			stdio: 'inherit'
		}
	);
};

var runPhantom = function(callback) {
	var phantomProc;

	var startRetry = 1;
	var maxStartRetryCount = 5;
	var logFile = fs.createWriteStream('./phantomjs.log');

	phantomProc = childProcess.spawn(phantomjs.path, [
		'--webdriver', '127.0.0.1:4444',
		'--ignore-ssl-errors', 'yes'
	], {
		stdio: [
			'inherit',
			'pipe',
			'pipe'
		]
	});

	phantomProc.stdout.on('data', function(data) {
		logFile.write(data);
		if (/GhostDriver - Main - running on port \d+/.test(data.toString())) {
			callback(phantomProc);
		}
	});

	phantomProc.stderr.on('data', function(data) {
		logFile.write(data);
		data = data.toString();

		// restart phantom on crash, see rid #6786 for details
		if (
			startRetry < maxStartRetryCount &&
			data &&
			(
				data.indexOf('pure virtual method called') !== -1 ||
				data.indexOf('PhantomJS has crashed') !== -1 ||
				data.indexOf('terminate called without an active exception') !== -1
			)
		) {
			runPhantom(callback);
			startRetry++;
		}
	});
};

var browser = process.env.NODE_TESTUI_BROWSER || 'phantom';

if (browser === 'phantom') {
	runPhantom(function(phantomProc) {
		var testsProc = runTests();
		testsProc.on('close', function() {
			phantomProc.kill();
		});
	});
} else {
	runTests();
}
