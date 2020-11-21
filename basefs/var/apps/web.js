var ui = require('/lib/ui.js'),
	browser = new ui.window({
		x: ui.align.middle,
		y: ui.align.middle,
		width: 400,
		height: 300,
		show_in_bar: false,
	});

console.log(browser);

module.exports = browser;