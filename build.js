'use strict';
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	stream = require('stream'),
	browserify = require('browserify'),
	base_fs = path.join(__dirname, 'basefs'),
	app_dir = path.join(__dirname, 'app'),
	dist = path.join(__dirname, 'dist.html'),
	bundle = path.join(app_dir, 'bundled.json'),
	pack_fs = require(path.join(app_dir, 'pack-fs.js')),
	terser = require('terser'),
	terser_config = {
		compress: {},
		format: {
			comments: false,
		},
	},
	build = () => {
		console.log('building..');
		
		var br = browserify(),
			chunks = [];
		
		JSON.parse(fs.readFileSync(bundle)).forEach(data => br.require(
			data.mod.constructor == Array ? path.resolve(__dirname, ...data.mod) : data.mod,
			data.options,
		));
		
		br.bundle().pipe(Object.assign(new stream(), {
			write: chunk => chunks.push(chunk),
			end: async () => {
				var buf = Buffer.concat(chunks),
					bundle = await new Promise(resolve => terser.minify(
						buf.toString('utf8')
					, terser_config).then(data => resolve(data.code)));
				
				console.log('packing fs..');
				
				var fs_string = JSON.stringify(pack_fs(base_fs));
				
				fs.writeFileSync(dist, `<!DOCTYPE HTML><html><head><meta charset='utf8'></head><body><script>\n/*  == WEBOS ==\n// BUILT ON ${new Date().toUTCString()}\n// DO NOT DISTRIBUTE!\n*/\n\nvar require,base_fs_data=${fs_string};${bundle};require('./start.js')</script></body></html>`);
				
				console.log('build finished, output found at ' + dist);
				
			}
		}));
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