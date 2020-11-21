var path = require('path'),
	Buffer = require('buffer').Buffer,
	fs = window.fs = require('fs').mount('/', 'object', base_fs_data),
	crequire = require('require'),
	cvrequire = crequire.init(fs, '/');

crequire.cache = {
	fs: fs,
	path: path,
	mime: require('mime'),
	buffer: require('Buffer'),
};

cvrequire.user = {
	alias: 'root',
	home: '/root',
};

cvrequire.exec(fs.readFileSync('/lib/node/events.js', 'utf8'), 'events');
cvrequire('/boot/init.js');