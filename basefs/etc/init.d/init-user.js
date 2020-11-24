var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js'),
	fs = require('fs'),
	path = require('path'),
	bar_data_path = path.join(require.user.home, 'bar.json');

if(!fs.existsSync(require.user.home))fs.mkdirSync(require.user.home);
if(!fs.existsSync(bar_data_path))fs.writeFileSync(bar_data_path, '[]');

[{
	path: '/var/xml/license.xml',
	pinned: true,
}].concat(JSON.parse(fs.readFileSync(bar_data_path, 'utf8'))).forEach(entry => web.bar.open.push(entry));

web.bar.menu.open = [{
	icon_path: '/usr/share/categ/configuration.png',
	title: 'Settings',
	contents: [],
},{
	icon_path: '/usr/share/categ/accessories.png',
	title: 'Accessories',
	contents: [],
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