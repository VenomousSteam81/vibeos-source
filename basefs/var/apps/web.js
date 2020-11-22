var ui = require('/lib/ui.js'),
	browser_win = new ui.window({
		x: ui.align.middle,
		y: ui.align.middle,
		width: 400,
		height: 300,
		show_in_bar: false,
	}),
	browser = {
		add_proto: url => (!/^(?:f|ht)tps?\:\/\//.test(url)) ? 'https://' + url : url,
		win: browser_win,
		nav_rect: browser_win.content.append(new ui.rect({
			width: '100%',
			height: 35,
			get color(){
				return browser_win.title_bar.color;
			},
		})),
		nav: {
			history: {},
			url: '',
		},
	};

browser.nav.url_bar = browser.nav_rect.append(new ui.input({
	placeholder: 'Search or enter web address',
	value: 'https://example.org',
	width: '80%',
	height: 25,
	offset: {
		x: 5,
		width: -10,
	},
	x: '20%',
	y: ui.align.middle,
}));

browser.nav.history_rect = browser.nav_rect.append(new ui.element({
	width: '20%',
	height: 25,
	offset: {
		x: 2,
		width: -5,
	},
	x: 5,
	y: ui.align.middle,
}));

browser.nav.history.back = browser.nav.history_rect.append(new ui.button({
	width: '50%',
	height: '100%',
	y: ui.align.middle,
	offset: {
		width: -2,
	},
	text: '←',
}));

browser.nav.history.forward = browser.nav.history_rect.append(new ui.button({
	width: '50%',
	height: '100%',
	x: '50%',
	y: ui.align.middle,
	offset: {
		width: -2,
		x: 2,
	},
	text: '→',
}));

browser.nav.url_bar.on('submit', () => {
	browser.nav.url = browser.nav.url_bar.value;
	
	console.log(browser);
	browser.rendering.src = browser.add_proto(browser.nav.url);
});

browser.rendering = browser.win.content.append(new ui.webview({
	width: '100%',
	height: '100%',
	y: 35,
	window: browser.win,
	src: 'https://example.org',
	offset: {
		height: -35,
	},
}));

console.log(browser, require.user);

module.exports = browser_win;