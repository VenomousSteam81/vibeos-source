var path = require('path'),
	Buffer = require('buffer').Buffer,
	fs = require('/lib/node/fs.js').mount('/', 'object', base_fs_data),
	init_require = require('/lib/node/require.js'),
	_require = init_require.init(fs, '/');

init_require.cache = {
	fs: fs,
	path: path,
	mime: require('mime'),
	buffer: require('Buffer'),
};

_require.user = {
	alias: 'root',
	home: '/root',
};

_require.exec(fs.readFileSync('/lib/node/events.js', 'utf8'), 'events');
_require('/boot/init.js');