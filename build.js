'use strict';
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	stream = require('stream'),
	browserify = require('browserify'),
	base_fs = path.join(__dirname, 'basefs'),
	app_dir = path.join(__dirname, 'app'),
	dist = path.join(__dirname, 'dist.html'),
	pack_fs = dir => {
		var files = Object.fromEntries(fs.readdirSync(dir).map(sub_dir => {
				var full_dir = path.join(dir, sub_dir),
					stats = fs.statSync(full_dir),
					is_dir = stats.isDirectory(),
					ret = is_dir ? pack_fs(full_dir) : lzutf8.compress(fs.readFileSync(full_dir, 'base64'), { outputEncoding: 'Base64' });
				
				return [ sub_dir, ret ];
			})),
			dir_stats = fs.statSync(dir);
		
		return files;
	},
	lzutf8 = require(path.join(base_fs, 'lib', 'lzutf8.js')),
	terser = require('terser'),
	building = false,
	build = async () => {
		if(building)return;
		
		console.log('building..');
		building = true;
		
		var build_opts = JSON.parse(fs.readFileSync(path.join(__dirname, 'build.json'), 'utf8')),
			br = browserify(),
			chunks = [],
			terser_opts = {
				compress: build_opts.fast ? false : true,
				mangle: true,
				format: {
					comments: false,
					quote_style: 1,
				},
			};
		
		build_opts.bundle.forEach(data => br.require(
			data.mod.constructor == Array ? path.resolve(__dirname, ...data.mod) : data.mod,
			data.options,
		));
		
		var browserify_start = Date.now(),
			chunks = [],
			bundle = await new Promise(resolve => br.bundle().pipe(Object.assign(new stream(), {
				write: chunk => chunks.push(chunk),
				end: () => resolve(Buffer.concat(chunks)),
			})));
		
		console.log('took ' + (Date.now() - browserify_start) + 'ms for browserify');
		
		var terser_start = Date.now();
		
		if(build_opts.minify.enabled)bundle = await new Promise(resolve => terser.minify(bundle.toString('utf8'), terser_opts).then(data => resolve(data.code)));
		
		console.log('took ' + (Date.now() - terser_start) + 'ms for terser');
				
		console.log('packing fs..');
		
		var fs_string = JSON.stringify(pack_fs(base_fs));
		
		fs.writeFileSync(dist, `<!DOCTYPE HTML><html><head><meta charset='utf8'></head><body><script>\n/*  == WEBOS ==\n// BUILT ON ${new Date().toUTCString()}\n// DO NOT DISTRIBUTE!\n*/\n\nvar require,base_fs_data=${fs_string},__webos_version='${build_opts.webos.ver}';${bundle.toString('utf8')};require('./start.js')</script></body></html>`);
		
		building = false;
		console.log('build finished, output found at ' + dist);
	};

build();

fs.watch(base_fs, { recursive: true }, (type, filename) => {
	console.log(type + ' ' + filename);
	
	build();
});

fs.watch(app_dir, { recursive: true }, (type, filename) => {
	console.log(type + ' ' + filename);
	
	build();
});

process.on('uncaughtException', err => console.log(err));