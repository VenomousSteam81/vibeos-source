var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js'),
	fs = require('fs'),
	path = require('path'),
	bar_data_path = path.join(require.user.home, 'bar.json'),
	folders = ['Desktop', 'Documents', 'Downloads', 'Music', 'Pictures', 'Videos'],
	app_reg = require('/usr/bin/app-reg.js'),
	user = web.users[require.user.alias] || (web.users[require.user.alias] = {
		app_reg: new app_reg(),
	});

if(!fs.existsSync(require.user.home))fs.mkdirSync(require.user.home);
folders.filter(folder => !fs.existsSync(path.join(require.user.home, folder))).forEach(folder => fs.mkdirSync(path.join(require.user.home, folder)));
if(!fs.existsSync(bar_data_path))fs.writeFileSync(bar_data_path, '[]');

user.bg = user.state.append(new ui.image({
	width: '100%',
	height: '100%',
	path: '/usr/share/wallpaper/default.png',
}));

user.bar = user.state.append(new ui.bar({}));

[{
	icon_path: '/usr/share/categ/development.png',
	path: '/var/apps/explorer.js',
	pinned: true,
},{
	path: '/var/xml/license.xml',
	pinned: true,
}].concat(JSON.parse(fs.readFileSync(bar_data_path, 'utf8'))).forEach(entry => user.bar.open.push(entry));

user.bar.menu.open = [{
	icon_path: '/usr/share/categ/configuration.png',
	title: 'Settings',
	contents: [],
},{
	icon_path: '/usr/share/categ/accessories.png',
	title: 'Accessories',
	contents: [{
		icon_path: '/usr/share/mimes/document.png',
		path: '/var/apps/text.js',
		title: 'Text Editor',
	}],
},{
	icon_path: '/usr/share/categ/graphics.png',
	title: 'Graphics',
	contents: [{
		icon_path: '/usr/share/categ/graphics.png',
		path: '/var/apps/paint.js',
		title: 'webGL Demo',
	}],
},{
	icon_path: '/usr/share/categ/internet.png',
	title: 'Internet',
	contents: [{
		icon_path: '/usr/share/categ/internet.png',
		path: '/var/apps/web.js',
		title: 'Embedded Browser',
	}],
},{
	icon_path: '/usr/share/categ/multimedia.png',
	title: 'Multimedia',
	contents: [],
},{
	icon_path: '/usr/share/categ/office.png',
	title: 'Office',
	contents: [],
},{
	icon_path: '/usr/share/categ/system.png',
	title: 'System',
	contents: [],
},{
	icon_path: '/usr/share/categ/games.png',
	title: 'Games',
	contents: [],
},{
	icon_path: '/usr/share/categ/system.png',
	path: '/var/xml/about.xml',
	title: 'About vibeOS',
	pinned: true,
}];

var desktop = screen.layers.append(new ui.desktop({
	y: user.bar.height,
	open: [{
		title: 'Trash',
		icon: '/usr/share/places/emptytrash.png',
		path: '/var/apps/explorer.js',
		args: {
			flags: {
				folder: '/lost+found/',
			},
		},
		context_menu: null,
	},{
		title: '2048',
		icon: '/usr/share/mimes/archive.png',
		path: '/var/apps/2048.js',
		args: { flags: {} },
		context_menu: null,
	}]
}));

desktop.context_menu = screen.layers.append(new ui.context_menu({
	triggers: [ user.bg, desktop ],
	items: [{
		title: 'browser test',
		icon: '/usr/share/categ/multimedia.png',
		path: '/var/apps/web.js',
	},{
		title: 'About vibeOS',
		icon: '/usr/share/categ/office.png',
		path: '/var/xml/about.xml',
	}],
}));

// ui.template('error', { at: __filename, err: new Error('testing') });