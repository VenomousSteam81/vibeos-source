var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js'),
	fs = require('fs'),
	path = require('path'),
	bar_data_path = path.join(user.home, 'bar.json'),
	folders = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'],
	app_man = require('/usr/bin/apps.js');

if(!fs.existsSync(user.home))fs.mkdirSync(user.home);
folders.filter(folder => !fs.existsSync(path.join(user.home, folder))).forEach(folder => fs.mkdirSync(path.join(user.home, folder)));
if(!fs.existsSync(bar_data_path))fs.writeFileSync(bar_data_path, '[]');

user.bg = user.state.append(new ui.image({
	width: '100%',
	height: '100%',
	path: '/usr/share/wallpaper/GardenTilesCT.png',
}));

user.bar = user.state.append(new ui.bar({}));

[{
	icon: '/usr/share/categ/development.png',
	path: '/var/apps/explorer.js',
	pinned: true,
},{
	icon: '/usr/share/mimes/document.png',
	path: '/var/xml/license.xml',
	pinned: true,
}].concat(JSON.parse(fs.readFileSync(bar_data_path, 'utf8'))).forEach(entry => user.bar.open.push(entry));

user.bar.menu.open = [{
	icon: '/usr/share/categ/configuration.png',
	title: 'Settings',
	contents: [],
},{
	icon: '/usr/share/categ/accessories.png',
	title: 'Accessories',
	contents: [],
},{
	icon: '/usr/share/categ/graphics.png',
	title: 'Graphics',
	contents: [],
},{
	icon: '/usr/share/categ/internet.png',
	title: 'Internet',
	contents: [],
},{
	icon: '/usr/share/categ/multimedia.png',
	title: 'Multimedia',
	contents: [],
},{
	icon: '/usr/share/categ/office.png',
	title: 'Office',
	contents: [],
},{
	icon: '/usr/share/categ/system.png',
	title: 'System',
	contents: [
		{
			icon: '/usr/share/mimes/document.png',
			path: '/var/xml/license.xml',
			title: 'vibeOS License'
		}
	],
},{
	icon: '/usr/share/categ/games.png',
	title: 'Games',
	contents: [],
},{
	icon: '/usr/share/new/info.png',
	path: '/var/xml/about.xml',
	title: 'About vibeOS',
	pinned: true,
},{
	icon: '/usr/share/categ/development.png',
	title: 'Development XML',
	contents: [
		{
			icon: '/usr/share/categ/development.png',
			path: '/var/xml/about.xml',
			title: 'about.xml'
		},
		{
			icon: '/usr/share/categ/development.png',
			path: '/var/xml/chatbox.xml',
			title: 'chatbox.xml [WILL CRASH VIBEOS]'
		},
		{
			icon: '/usr/share/categ/development.png',
			path: '/var/xml/test.xml',
			title: 'test.xml [WILL CRASH ON EXIT]'
		},
		{
			icon: '/usr/share/categ/development.png',
			path: '/var/xml/webview_demo.xml',
			title: 'webview_demo.xml [DOES NOT LAUNCH]'
		},
		{
			icon: '/usr/share/categ/development.png',
			path: '/var/xml/reminders.xml',
			title: 'reminders.xml'
		},
		{
			icon: '/usr/share/new/info.png',
			path: '/var/xml/iconviewer.xml',
			title: 'iconviewer.xml'
		},
	],
}];

user.desktop = screen.layers.append(new ui.desktop({
	y: user.bar.height,
	open: []
}));

user.desktop.context_menu = screen.layers.append(new ui.context_menu({
	triggers: [ user.bg, user.desktop ],
	items: [],
}));

user.apps = new app_man();