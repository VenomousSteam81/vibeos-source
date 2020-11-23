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
},{
	icon_path: 'https://raw.githubusercontent.com/vibeOS/vibeos-legacy/master/tango/apps/32/internet-web-browser.png',
	path: '/var/apps/web.js',
	pinned: true,
}].concat(JSON.parse(fs.readFileSync(bar_data_path, 'utf8'))).forEach(entry => web.bar.open.push(entry));