var path = require('path'),
	mime = require('mime'),
	web = {};

exports.cache = {};

/**
* @param {object} fs filesystem to read and search from
* @param {object} base_dir directory that non-absolute paths are resolved from
* @param {object} user user account to assign to output
* @param {object} stack module that is initating
* @property {object} user user account data
* @property {function} exec execute scripts
* @example
* // returns ƒ require(){...}
* 
* var fs = require('fs').mount('/', 'object', base_fs_data),
* 	crequire = require('require'),
* 	cvrequire = crequire.init(fs, '/');
* 
* console.log(cvrequire);
* @return {function} require
*/

exports.init = (fs, base_dir, user, stack = 'main') => {
	var require = (dire, options) => {
		var file = path.resolve(dire);
		
		if(/^[^\.\/\\]/g.test(dire) && exports.cache[dire])return exports.cache[dire];
		
		// add js extension if missing
		if(!path.extname(file))file = file + '.js';
		
		if(!fs.existsSync(file))file = path.join(base_dir, file);
		
		if(!fs.existsSync(file))throw new TypeError('Cannot find module \'' + file + '\' <' + stack + '>');
		
		if(exports.cache[file])return exports.cache[file];
		
		return require.exec(fs.readFileSync(file), file, options);
	};
	
	require.user = { name: '', home: '' };
	
	/**
	* @param {string} script text content of script to execute
	* @param {string} file filename of script being executed (for adding to cache)
	* @param {object} options options when processing
	* @param {object} options.cache if the output should be added to cache
	* @example
	* // returns object
	* console.log(cvrequire.exec(fs.readFileSync('/lib/node/events.js', 'utf8'), 'events'));
	* console.log(crequire.cache); // added to cache
	* @return {function} exec
	*/
	
	require.exec = (script, file, options = { cache: true }) => {
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
				require: exports.init(fs, path.dirname(file), require.user, file),
				Buffer: Buffer,
				__filename: file,
				__dirname: path.dirname(file),
				web: web,
			};
		
		args.require.user = require.user;
		
		new Function(Object.keys(args), script)(...Object.values(args));
		
		return options.cache ? exports.cache[file] = _exports : _exports;
	};
	
	return require;
};