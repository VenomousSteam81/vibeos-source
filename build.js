'use strict';
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	stream = require('stream'),
	browserify = require('browserify'),
	base_fs = path.join(__dirname, 'basefs'),
	app_dir = path.join(__dirname, 'app'),
	dist = path.join(__dirname, 'dist.html'),
	pack_fs = require(path.join(app_dir, 'pack-fs.js')),
	terser = require('terser'),
	files = {
		build: path.join(__dirname, 'build.json'),
		modules: path.join(app_dir, 'bundled.json'),
	},
	build = async () => {
		console.log('building..');
		
		var build_opts = JSON.parse(fs.readFileSync(files.build)),
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
		
		JSON.parse(fs.readFileSync(files.modules)).forEach(data => br.require(
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