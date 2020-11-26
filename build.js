'use strict';
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	stream = require('stream'),
	base_fs = path.join(__dirname, 'basefs'),
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
			terser_opts = {
				compress: build_opts.fast ? false : true,
				mangle: true,
				format: {
					comments: false,
					quote_style: 1,
				},
			},
			bundle = 'var md={' + build_opts.bundle.map(data => {
				data.path = path.resolve(__dirname, ...data.path);
				
				var plain = (path.extname(data.path) == '.json' ? 'module.exports=' : '') + fs.readFileSync(data.path, 'utf8');
				
				return JSON.stringify([ data.options.expose ]).slice(1, -1) + '(module,exports,require,global,process){' + plain + '}';
			}).join(',') + '},gp={cwd:_=>"/"},require=fn=>{var xp={},mo={get exports(){return xp},set exports(v){return xp=v}};md[fn.toLowerCase()](mo,xp,require,globalThis,gp);return xp};';
		
		if(build_opts.minify.enabled){
			var terser_start = Date.now();
			
			bundle = await new Promise(resolve => terser.minify(bundle.toString('utf8'), terser_opts).then(data => resolve(data.code)));
			
			console.log('took ' + (Date.now() - terser_start) + 'ms for terser');
		}
		
		var fs_string = JSON.stringify(pack_fs(base_fs));
		
		fs.writeFileSync(dist, `<!DOCTYPE HTML><html><head><meta charset='utf8'></head><body><script>\n/*  == WEBOS ==\n// BUILT ON ${new Date().toUTCString()}\n// DO NOT DISTRIBUTE!\n*/\n\nvar require,base_fs_data=${fs_string},__webos_version='${build_opts.webos.ver}';${bundle.toString('utf8')};require('webos')</script></body></html>`);
		
		building = false;
		console.log('build finished, output found at ' + dist);
	};

build();

fs.watch(base_fs, { recursive: true }, (type, filename) => {
	if(!filename)return;
	
	console.log(type + ' ' + filename);
	
	build();
});

process.on('uncaughtException', err => console.log(err));