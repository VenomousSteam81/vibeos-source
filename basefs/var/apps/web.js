var ui = require('/lib/ui.js'),
	dom_utils = require('/lib/dom-utils.js'),
	rasterize_html = require('/var/lib/rasterize-html.js'),
	browser_win = new ui.window({
		x: ui.align.middle,
		y: ui.align.middle,
		width: 400,
		height: 300,
		show_in_bar: false,
		title: 'Web Browser',
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
			url: 'https://www.example.org',
		},
		render: async () => {
			var vurl = browser.add_proto(browser.nav.url),
				data = await fetch('https://ldm.sys32.dev/' + vurl).then(res => res.text()),
				buf = dom_utils.add_ele('canvas', document.body, { style: 'display: none' });
			
			// https://cburgmer.github.io/rasterizeHTML.js/
			
			rasterize_html.drawHTML(data, buf, {
				width: browser.win.fixed.width,
				width: browser.win.fixed.height,
			}).then(result => {
				console.log(result.image);
				browser.rendering.image = result.image;
				
				buf.remove();
			});
			
			browser.nav.url_bar.value = vurl;
		},
	};

browser.nav.url_bar = browser.nav_rect.append(new ui.input({
	placeholder: 'Search or enter web address',
	width: '80%',
	height: 25,
	offset: {
		x: 5,
		width: -10,
	},
	value: browser.nav.url,
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
	
	browser.render();
});

browser.rendering = browser.win.content.append(new ui.image({
	width: '100%',
	height: '100%',
	y: 35,
	offset: {
		height: -35,
	},
}));

browser.render();

module.exports = browser_win;