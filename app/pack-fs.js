var path = require('path'),
	fs = require('fs'),
	lzutf8 = require(path.join(__dirname, 'lzutf8.js')),
	get_files = dir => {
		var files = Object.fromEntries(fs.readdirSync(dir).map(sub_dir => {
				var full_dir = path.join(dir, sub_dir),
					stats = fs.statSync(full_dir),
					is_dir = stats.isDirectory(),
					ret = is_dir ? get_files(full_dir) : lzutf8.compress(fs.readFileSync(full_dir, 'base64'), { outputEncoding: 'Base64' });
				
				return [ sub_dir, ret ];
			})),
			dir_stats = fs.statSync(dir);
		
		return Object.assign(files, {
			'.s': {
				d: true,
				c: dir_stats.ctimeMs,
				a: dir_stats.atimeMs,
				m: dir_stats.mtimeMs,
			},
		});
	};

module.exports = get_files;