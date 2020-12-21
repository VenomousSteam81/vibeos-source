'use strict';
var path = require('path'),
	mime = require('mime'),
	buffer = require('buffer'),
	natives = { // accessible from scripts
		DOM: document,
		WINDOW: window,
	},
	perms = { // script permissions defined above
		'/lib/dom-utils.js': ['DOM'],
		'/lib/screen.js': ['DOM', 'WINDOW'],
		'/etc/init.d/shell.js': ['DOM'],
		'/var/lib/rasterize-html.js': ['NO-SANDBOX'],
		'/var/apps/web.js': ['DOM'],
	},
	web = {},
	safe_global = [
		"Object","Function","Array","Number","parseFloat","parseInt","Infinity","NaN","undefined","Boolean","String","Symbol","Date","Promise","RegExp","Error","EvalError","RangeError","ReferenceError","SyntaxError","TypeError","URIError","globalThis","JSON","Math","console","Intl","ArrayBuffer","Uint8Array","Int8Array","Uint16Array","Int16Array","Uint32Array","Int32Array","Float32Array","Float64Array","Uint8ClampedArray","BigUint64Array","BigInt64Array","DataView","Map","BigInt","Set","WeakMap","WeakSet","Proxy","Reflect","decodeURI","decodeURIComponent","encodeURI","encodeURIComponent","escape","unescape","eval","isFinite","isNaN","global","process","Buffer","URL","URLSearchParams","TextEncoder","TextDecoder","AbortController","AbortSignal","EventTarget","Event","MessageChannel","MessagePort","MessageEvent","clearInterval","clearTimeout","setInterval","setTimeout","queueMicrotask","clearImmediate","setImmediate","SharedArrayBuffer","Atomics","AggregateError","FinalizationRegistry","WeakRef","WebAssembly",
		'FontFace',
		'Image',
		'Path2D',
		'DOMParser',
		'XMLSerializer',
	];

exports.parse = (code, spath) => {
	return code + '\n//# sourceURL=' + spath;
	// return code.replace(/(?:\(.*?\)|\w+)\s*?=>|function\s*?\S*?\s*?\(/g, 'async $&');
};

exports.cache = {};

/**
* @param {object} fs filesystem to read and search from
* @param {object} base_dir directory that non-absolute paths are resolved from
* @param {object} user user account to assign to output
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

exports.init = (fs, base_dir, user) => {
	var require = (dire, options) => {
		var file = path.resolve(dire);
		
		if(!path.isAbsolute(dire) && exports.cache[dire])return exports.cache[dire];
		
		// add js extension if missing
		if(!path.extname(file))file = file + '.js';
		
		if(!fs.existsSync(file))file = path.join(base_dir, file);
		
		if(!fs.existsSync(file))throw new TypeError('Cannot find module \'' + file + '\'');
		
		if(exports.cache[file])return exports.cache[file];
		
		return require.exec(fs, file, options).init();
	};
	
	require.user = { name: '', home: '' };
	
	/**
	* @param {string} fs filesystem to read/write from
	* @param {string} file filename of script being executed
	* @param {object} options options when processing
	* @param {object} options.cache if the output should be added to cache
	* @param {object} options.args additional args to pass to function
	* @example
	* // returns object
	* console.log(cvrequire.exec(fs.readFileSync('/lib/node/events.js', 'utf8'), 'events'));
	* console.log(crequire.cache); // added to cache
	* @return {function} exec
	*/
	
	require.exec = (fs, file, options = {}) => {
		if(mime.getType(file) == 'application/json')return JSON.parse(fs.readFileSync(file, 'utf8'));
		
		options = Object.assign({
			cache: true,
			args: {},
			func: Function,
		}, options);
		
		var args = Object.assign(perms[file] && perms[file].includes('NO-SANDBOX') ? {} : Object.fromEntries(Object.getOwnPropertyNames(global).filter(key => !key.startsWith('WebGL') && !safe_global.includes(key)).map(key => [ key, undefined ])), {
				module: {
					get exports(){
						return args.exports;
					},
					set exports(v){
						return args.exports = v;
					},
				},
				exports: {},
				require: exports.init(fs, path.dirname(file), require.user),
				Buffer: buffer.Buffer,
				process: Object.assign(process, {
					pid: process.last_pid + 1,
					platform:'linux',
					arch: 'x32',
					cwd:_=> path.dirname(file),
				}),
				__filename: file,
				__dirname: path.dirname(file),
				web: web,
				global: web,
				request_native(label){
					if(!perms[file])throw new TypeError('no native permissions granted!');
					
					if(!perms[file].includes(label))throw new TypeError('permission for ' + JSON.stringify([ label ]).slice(1, -1) + ' not granted!');
					
					return natives[label];
				},
				// proxy later
				fetch: fetch,
			}, options.args),
			script = fs.readFileSync(file, 'utf8');
		
		args.require.user = require.user;
		
		return {
			args: args,
			init(){
				var func = new options.func(Object.keys(args), exports.parse(script, file));
				
				Reflect.apply(func, args.exports, Object.values(args));
				
				return options.cache ? exports.cache[file] = args.exports : args.exports;
			},
		};
	};
	
	return require;
};