#!/usr/bin/env node

'use strict';

var phantomjs = require('phantomjs');
var childProcess = require('child_process');
var program = require('commander');
var fs = require('fs');
var Writable = require('stream').Writable;

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
	var err = new Writable();

	var logFile = fs.createWriteStream('./phantomjs.log');

	err._write = function(chunk, encoding, _callback) {
		logFile.write(chunk);
		chunk = chunk.toString();

		// restart phantom on crash, see rid #6786 for details
		if (
			startRetry < maxStartRetryCount &&
			chunk &&
			(
				chunk.indexOf('pure virtual method called') !== -1 ||
				chunk.indexOf('PhantomJS has crashed') !== -1 ||
				chunk.indexOf('terminate called without an active exception') !== -1
			)
		) {
			runPhantom(callback);
			startRetry++;
		} else {
			_callback(new Error('phantomjs stderr: ' + chunk));
		}
	};

	var out = new Writable();
	out._write = function(chunk, encoding, _callback) {
		logFile.write(chunk);
		if (/GhostDriver - Main - running on port \d+/.test(chunk.toString())) {
			callback(phantomProc);
		}
		_callback();
	};

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

	phantomProc.stdout.pipe(out);
	phantomProc.stderr.pipe(err);
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
