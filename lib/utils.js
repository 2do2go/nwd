'use strict';

// useful colors for bash
exports.colors = {
	black: '\x1b[0;30m',
	dkgray: '\x1b[1;30m',
	brick: '\x1b[0;31m',
	red: '\x1b[1;31m',
	green: '\x1b[0;32m',
	lime: '\x1b[1;32m',
	brown: '\x1b[0;33m',
	yellow: '\x1b[1;33m',
	navy: '\x1b[0;34m',
	blue: '\x1b[1;34m',
	violet: '\x1b[0;35m',
	magenta: '\x1b[1;35m',
	teal: '\x1b[0;36m',
	cyan: '\x1b[1;36m',
	ltgray: '\x1b[0;37m',
	white: '\x1b[1;37m',
	reset: '\x1b[0m'
};

exports.extend = function(distanation, source) {
	for (var key in source) {
		distanation[key] = source[key];
	}
	return distanation;
};

// @HARDCODE: special order for F keys
var keyStrokesHash = {
	'NULL': '\uE000',
	'Cancel': '\uE001',
	'Help': '\uE002',
	'Backspace': '\uE003',
	'Tab': '\uE004',
	'Clear': '\uE005',
	'Return': '\uE006',
	'Enter': '\uE007',
	'Shift': '\uE008',
	'Control': '\uE009',
	'Alt': '\uE00A',
	'Pause': '\uE00B',
	'Escape': '\uE00C',
	'Space': '\uE00D',
	'PageUp': '\uE00E',
	'PageDown': '\uE00F',
	'End': '\uE010',
	'Home': '\uE011',
	'LeftArrow': '\uE012',
	'UpArrow': '\uE013',
	'RightArrow': '\uE014',
	'DownArrow': '\uE015',
	'Insert': '\uE016',
	'Delete': '\uE017',
	'Semicolon': '\uE018',
	'Equals': '\uE019',
	'Numpad0': '\uE01A',
	'Numpad1': '\uE01B',
	'Numpad2': '\uE01C',
	'Numpad3': '\uE01D',
	'Numpad4': '\uE01E',
	'Numpad5': '\uE01F',
	'Numpad6': '\uE020',
	'Numpad7': '\uE021',
	'Numpad8': '\uE022',
	'Numpad9': '\uE023',
	'Multiply': '\uE024',
	'Add': '\uE025',
	'Separator': '\uE026',
	'Subtract': '\uE027',
	'Decimal': '\uE028',
	'Divide': '\uE029',
	'F10': '\uE03A',
	'F11': '\uE03B',
	'F12': '\uE03C',
	'F1': '\uE031',
	'F2': '\uE032',
	'F3': '\uE033',
	'F4': '\uE034',
	'F5': '\uE035',
	'F6': '\uE036',
	'F7': '\uE037',
	'F8': '\uE038',
	'F9': '\uE039',
	'Command': '\uE03D'
};

var keyStrokesRegExp = new RegExp(
	'@(' + Object.keys(keyStrokesHash).join('|') + ')'
);

//replace key stroke with it char code in the str
exports.replaceKeyStrokesWithCodes = function(str) {
	if (keyStrokesRegExp.test(str)) {
		for (var key in keyStrokesHash) {
			str = str.replace(new RegExp('@' + key, 'g'), keyStrokesHash[key]);
		}
	}
	return str;
};

// Add some isType methods: isFunction, isString, isNumber, isDate, isRegExp
['Function', 'String', 'Number', 'Date', 'RegExp'].forEach(function(name) {
	exports['is' + name] = function(obj) {
		return toString.call(obj) == '[object ' + name + ']';
	};
});
