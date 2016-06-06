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
		.option('-l, --server-log', 'enable server logging to console')
		.option(
			'-r, --related-services <json>',
			'set related services config',
			JSON.parse
		)
		.option('-n, --node <path>', 'set node binary to use')
		.option('--harmony', 'enable harmony features')
		.option('--max-spawns <count>', 'max spawns count to run in parallel')
		.option('--tests-explorer <path>', 'script that returns test paths')
		.option('-R, --reporter <name>', 'specify the reporter to use')
		.option('-O, --reporter-options <k=v,k2=v2,...>', 'reporter-specific options')
		.option('-b, --bail', 'bail after first test failure')
		.option('-g, --grep <pattern>', 'only run tests matching <pattern>')
		.option('-f, --fgrep <string>', 'only run tests containing <string>')
		.option('-i, --invert', 'inverts --grep and --fgrep matches')
		.option('-t, --timeout <ms>', 'set test-case timeout in milliseconds [2000]')
		.option('--async-only', 'force all tests to take a callback (async)')
		.option('--slow <ms>', '"slow" test threshold in milliseconds [75]')
		.option('--colors', 'force enabling of colors')
		.option('--no-colors', 'force disabling of colors')
		.option('--recursive', 'include sub directories')
		.option('--reporters', 'display available reporters')
		.parse(process.argv);

	var opts = program.opts(),
		testFiles = program.args;

	var testArgs = [];

	if (opts.reporter) testArgs.push('--reporter', opts.reporter);
	if (opts.reporterOptions) {
		testArgs.push('--reporter-options', opts.reporterOptions);
	}
	if (opts.bail) testArgs.push('--bail');
	if (opts.grep) testArgs.push('--grep', opts.grep);
	if (opts.fgrep) testArgs.push('--fgrep', opts.fgrep);
	if (opts.invert) testArgs.push('--invert');
	if (opts.timeout) testArgs.push('--timeout', opts.timeout);
	if (opts.asyncOnly) testArgs.push('--async-only');
	if (opts.slow) testArgs.push('--slow', opts.slow);
	if (opts.colors !== undefined && opts.colors) testArgs.push('--colors');
	if (opts.colors !== undefined && !opts.colors) testArgs.push('--no-colors');
	if (opts.recursive) testArgs.push('--recursive');
	if (opts.reporters) testArgs.push('--reporters');

	var args = testFiles.concat(testArgs);

	return childProcess.spawn(
		'./node_modules/.bin/mocha',
		args,
		{
			stdio: ['ignore', process.stdout, process.stderr]
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

var phantomProc = (!process.env.NODE_TESTUI_BROWSER ||
	process.env.NODE_TESTUI_BROWSER === 'phantom') ?
	runPhantom() :
	null;

var testsProc = runTests();
testsProc.on('close', function() {
	if (phantomProc) {
		phantomProc.kill();
	}
});
