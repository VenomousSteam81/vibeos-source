var ui = require('/lib/ui.js'),
	bg = new ui.image({
		width: '100%',
		height: '100%',
		path: '/usr/share/wallpaper/default.png',
		steal_focus: false,
	});

bg.context_menu = bg.append(new ui.context_menu({
	triggers: [ bg ],
	items: [{
		title: 'browser test',
		icon: '/usr/share/categ/multimedia.png',
		path: '/var/apps/web.js',
	},{
		title: 'About vibeOS',
		icon: '/usr/share/categ/office.png',
		path: '/var/xml/about.xml',
	},],
	width: 250,
}));

module.exports = bg;