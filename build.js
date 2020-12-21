'use strict';
var fs = require('fs'),
	os = require('os'),
	path = require('path'),
	terser = require('terser'),
	files = {
		fs: path.join(__dirname, 'basefs'),
		dist: path.join(__dirname, 'dist.html'),
	},
	lzutf8 = require(path.join(files.fs, 'lib', 'lzutf8.js')),
	compact_stats = s => ({
		a: s.atimeMs, // accessed
		m: s.mtimeMs, // modified
		c: s.ctimeMs, // created
		b: s.birthtimeMs,
		bl: s.blksize,
		bo: s.blocks,
		n: s.nlink,
		mo: s.mode,
		i: s.ino,
		d: s.dev,
	}),
	pack_fs = (dir, files = {}, prefix = '') => { // browse each directory => lzutf8 on files
		fs.readdirSync(dir).forEach(sub_dir => {
			var full_dir = path.join(dir, sub_dir),
				stats = fs.statSync(full_dir),
				is_dir = stats.isDirectory(),
				ind = path.posix.join('/', prefix, sub_dir);
			
			// going to use image converter tool soon
			// if(full_dir.endsWith('.png'))console.warn('vibeOS: .png files take a toll on file size, consider using .webp ( ' + full_dir + ' )');
			
			files[ind] = [ compact_stats(stats) ];
			
			if(!is_dir)files[ind][1] = lzutf8.compress(fs.readFileSync(full_dir, 'base64'), { outputEncoding: 'Base64' });
			
			if(is_dir)pack_fs(full_dir, files, ind);
		});
		
		files[path.posix.join('/', prefix)] = [ compact_stats(fs.statSync(dir)) ];
		
		return files;
	},
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
			bundle_ind = 0,
			bundle_data = data => {
				var plain = (path.extname(data.path) == '.json' ? 'module.exports=' : '') + fs.readFileSync(data.path, 'utf8'),
					out = [],
					name = data.options.expose || data.path;
				
				return out.concat(JSON.stringify([ name ]).slice(1, -1) + '(module,exports,require,global,process){' + plain + '}').join(',');
			};
		
		var bundle = `require=((l,p)=>(f,c,m,e)=>{c=l[f.toLowerCase()];if(!c)throw new Error("Cannot find module '"+f+"'");e={};m={get exports(){return e},set exports(v){return e=v}};c(m,e,require,globalThis,p);return e})({${build_opts.bundle.map(data => bundle_data({ path: path.resolve(__dirname, ...data.path), options: data.options }))}},{argv:[],argv:[],last_pid:0,cwd:_=>'/',kill:_=>close(_),nextTick:_=>requestAnimationFrame(_)});`;
		
		if(build_opts.minify.enabled){
			var terser_start = Date.now();
			
			bundle = await new Promise(resolve => terser.minify(bundle.toString('utf8'), terser_opts).then(data => resolve(data.code)));
			
			console.log('took ' + (Date.now() - terser_start) + 'ms for terser');
		}
		
		var fs_string = JSON.stringify(pack_fs(files.fs));
		
		fs.writeFileSync(files.dist, `<!DOCTYPE HTML><html><head><meta charset='utf8'></head><body><script>\n/*  == WEBOS ==\n// BUILT ON ${new Date().toUTCString()}\n// DO NOT DISTRIBUTE!\n*/\n\ndocument.body.innerHTML='';var a=${fs_string},${bundle}require('webos');\n//# sourceURL=webOS_loader</script></body></html>`);
		
		building = false;
		console.log('build finished, output found at ' + files.dist);
	};

build();

fs.watch(files.fs, { recursive: true }, (type, filename) => {
	if(!filename)return;
	
	console.log(type + ' ' + filename);
	
	build();
});

process.on('uncaughtException', err => console.log(err));