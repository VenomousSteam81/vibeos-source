'use strict';
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	stream = require('stream'),
	base_fs = path.join(__dirname, 'basefs'),
	dist = path.join(__dirname, 'dist.html'),
	compact_stats = file_stats => ({
		a: file_stats.atimeMs, // accessed
		m: file_stats.mtimeMs, // modified
		c: file_stats.ctimeMs, // created
		b: file_stats.birthtimeMs,
		bl: file_stats.blksize,
		bo: file_stats.blocks,
		n: file_stats.nlink,
		mo: file_stats.mode,
		i: file_stats.ino,
		d: file_stats.dev,
	}),
	pack_fs = (dir, files = {}, prefix = '') => { // browse each directory => lzutf8 on files
		fs.readdirSync(dir).forEach(sub_dir => {
			var full_dir = path.join(dir, sub_dir),
				file_stats = fs.statSync(full_dir),
				is_dir = file_stats.isDirectory(),
				ind = path.posix.join('/', prefix, sub_dir);
			
			files[ind] = [ is_dir ? null : lzutf8.compress(fs.readFileSync(full_dir, 'base64'), { outputEncoding: 'Base64' }), compact_stats(file_stats) ];
			
			if(is_dir)pack_fs(full_dir, files, ind);
		});
		
		files[path.posix.join('/', prefix)] = [ null, compact_stats(fs.statSync(dir)) ];
		
		return files;
	},
	lzutf8 = require(path.join(base_fs, 'lib', 'lzutf8.js')),
	terser = require('terser'),
	building = false,
	require_reg = /(^|[^a-zA-Z_])require\(([`'"])([\s\S]*?)\2\)/g,
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
			bundle_ind = 0,
			bundle_data = data => {
				var plain = (path.extname(data.path) == '.json' ? 'module.exports=' : '') + fs.readFileSync(data.path, 'utf8'),
					out = [],
					name = data.options.expose || data.path;
				
				/*plain = plain.replace(require_reg, (match, start, quote, module) => {
					if(path.isAbsolute(module) || /^[^\.]/.test(module))return match;
					
					bundle_ind++;
					
					var pathe = path.resolve(data.path, module),
						ret = start + 'require(' + quote + bundle_ind + quote + ')';
					
					try{out.push(bundle_data({
						path: pathe,
						options: { expose: bundle_ind },
					}))}catch(err){ console.error(pathe + '\n', err) };
					
					return ret;
				});*/
				
				return out.concat(JSON.stringify([ name ]).slice(1, -1) + ':{m:{x:{},get exports(){return this.x},set exports(v){return this.x=v}},e(module,exports,require,global,process){' + plain + '}}').join(',');
			};
		
		
		
		var bundle = 'var md={' + build_opts.bundle.map(data => bundle_data({ path: path.resolve(__dirname, ...data.path), options: data.options })) + '},require=(fn,c)=>{c=md[fn.toLowerCase()];if(!c)throw new Error("Cannot find module \'"+fn+"\'");c.e(c.m,c.m.x,require,globalThis,{cwd:_=>"/"});return c.m.x};';
		
		if(build_opts.minify.enabled){
			var terser_start = Date.now();
			
			bundle = await new Promise(resolve => terser.minify(bundle.toString('utf8'), terser_opts).then(data => resolve(data.code)));
			
			console.log('took ' + (Date.now() - terser_start) + 'ms for terser');
		}
		
		var fs_string = JSON.stringify(pack_fs(base_fs));
		
		fs.writeFileSync(dist, `<!DOCTYPE HTML><html><head><meta charset='utf8'></head><body><script>\n/*  == WEBOS ==\n// BUILT ON ${new Date().toUTCString()}\n// DO NOT DISTRIBUTE!\n*/\n\nvar require,base_fs_data=${fs_string},__webos_version='${build_opts.webos.ver}';${bundle.toString('utf8')};require('webos');\n//# sourceURL=webOS\x00loader</script></body></html>`);
		
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