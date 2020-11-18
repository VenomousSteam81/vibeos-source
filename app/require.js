var path = require('path'),
	mime = require('mime'),
	web = {};

exports.cache = {};

exports.init = (fs, base_dir, stack = 'main') => {
	var require = dire => {
		var file = path.resolve(dire);
		
		if(/^[^\.\/\\]/g.test(dire) && exports.cache[dire])return exports.cache[dire];
		
		// add js extension if missing
		if(!path.extname(file))file = file + '.js';
		
		if(!fs.existsSync(file))file = path.join(base_dir, file);
		
		if(!fs.existsSync(file))throw new TypeError('Cannot find module \'' + file + '\' <' + stack + '>');
		
		if(exports.cache[file])return exports.cache[file];
		
		return require.exec(fs.readFileSync(file), file);
	};
	
	require.exec = (script, file) => {
		if(mime.getType(file) == 'application/json')return JSON.parse(file);
		
		var _exports = {},
			_module = {
				get exports(){
					return _exports;
				},
				set exports(v){
					_exports = v;
					return true;
				},
			},
			args = {
				module: _module,
				exports: _exports,
				require: exports.init(fs, path.dirname(file), file),
				Buffer: Buffer,
				__filename: file,
				__dirname: path.dirname(file),
				web: web,
			};
		
		new Function(Object.keys(args), script)(...Object.values(args));
		
		return exports.cache[file] = _exports;
	};
	
	return require;
};