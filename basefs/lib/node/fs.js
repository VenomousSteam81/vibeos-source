'use strict';
var path = require('path'),
	mime = require('mime'),
	lzutf8 = require('lzutf8'),
	Buffer = require('buffer').Buffer,
	proxy = Symbol(),
	fs_name = '__fs_1.0.0',
	dynamic_fs = JSON.parse(localStorage.getItem(fs_name) || '{}'),
	filesys = window.filesys = class FileSystem {
		constructor(name){
			var dyn = JSON.parse(localStorage.getItem(name) || '{}');
			
			this.static = {};
			this.dynamic = {};
			
			this.name = name;
			
			Object.assign(this.static, dyn);
			Object.assign(this.dynamic, dyn);
		}
		update(){
			localStorage.setItem(this.name, JSON.stringify(this.dynamic));
		}
		walk_file_dynamic(file){
			var arr = path.resolve(file).split('/').filter(file => file),
				depth = this.dynamic;
			
			arr.forEach(val => depth = depth[val] || {});
			
			if(depth instanceof Error)throw depth;
			
			return depth;			
		}
		walk_file(file){
			var arr = path.resolve(file).split('/').filter(file => file),
				depth = this.static;
			
			arr.forEach(val => depth = depth[val] || errors.enoent(file));
			
			if(depth instanceof Error)throw depth;
			
			return depth;
		}
		stat(file){
			var depth = this.walk_file(path.resolve(file));
			
			return {
				isDirectory: () => typeof depth == 'object',
				ctimeMs: () => Date.now(),
				atimeMs: () => Date.now(),
				mtimeMs: () => Date.now(),
			};
		}
		exists(file){
			try{
				this.walk_file(file);
				return true;
			}catch(err){}
			
			return false;
		}
		read(file, encoding){
			var depth = this.walk_file(file);
			
			if(this.stat(file).isDirectory())throw errors.eisdir('read', file);
			
			var data = Buffer.from(lzutf8.decompress(depth, { inputEncoding: 'Base64' }), 'base64');
			
			return encoding ? data.toString(encoding) : data
		}
		write(file, data, options){
			if(typeof data != 'string' && !(data instanceof Buffer) && !Array.isArray(data))throw errors.invalid_arg_type('data', ['Buffer', 'TypedArray', 'DataView'], typeof data);
			
			if(fs.existsSync(file) && fs.statSync(file).isDirectory())return errors.eisdir('open', file);
			
			var resolved = path.resolve(file),
				resolved_split = resolved.split('/').filter(file => file),
				dirname = path.dirname(file),
				basename = path.basename(file),
				depth = this.walk_file(dirname),
				depth_dyn = this.walk_file_dynamic(dirname),
				compressed = lzutf8.compress(Buffer.from(data).toString('base64'), { outputEncoding: 'Base64' });
			
			depth[basename] = compressed;
			depth_dyn[basename] = compressed;
			
			this.update();
		}
		unlink(file){
			var resolved = path.resolve(file),
				resolved_split = resolved.split('/').filter(file => file),
				dirname = path.dirname(file),
				basename = path.basename(file),
				depth = this.walk_file(dirname),
				depth_dyn = this.walk_file_dynamic(dirname),
				ret = Reflect.deleteProperty(depth, basename) && Reflect.deleteProperty(depth_dyn, basename);
			
			this.update();
			
			return ret;
		}
		data_uri(file){
			return 'data:' + mime.getType(file) + ';base64,' + this.read(file, 'base64');
		}
		download(file){
			var object_url = URL.createObjectURL(new Blob([ this.read(file) ])),
				link = Object.assign(document.body.appendChild(document.createElement('a')), {
					download: path.basename(file),
					href: object_url,
				});
			
			link.click();
			URL.revokeObjectURL(object_url);
		}
	},
	filesystem = Object.assign({}, dynamic_fs),
	mounted = [],
	update_fs = () => localStorage.setItem(fs_name, JSON.stringify(dynamic_fs)),
	errors = {
		enoent(file){
			return new TypeError('ENOENT: no such file or directory, open \'' + file + '\'');
		},
		enotdir(dir){
			return new TypeError('ENOTDIR: not a directory, scandir \'' + dir + '\'');
		},
		eisdir(operation, file){
			return new TypeError('EISDIR: illegal operation on a directory, ' + operation + ' \'' + file + '\'');
		},
		invalid_arg_type(label, types, recieved){
			return new TypeError('INVALID_ARG_TYPE: The "' + label + '" argument must be of type ' + types.join(', ') + '. Received ' + recieved)
		},
	},
	walk_depth_dynamic = file => {
		var split = file.split('/').filter(file => file),
			depth = dynamic_fs;
		
		for(var i = 0; i < split.length; i++){
			if(!depth[split[i]])depth[split[i]] = {};
			
			if(i + 1 == split.length){
				return depth; // return the folder
			}else depth = depth[split[i]];
		}
		
		return depth;
	},
	walk_depth = file => {
		var resolved_split = file.split('/').filter(file => file),
			depth = filesystem;
		
		for(var i = 0; i < resolved_split.length; i++){
			if(!depth[resolved_split[i]])return errors.enoent(file);
			
			depth = depth[resolved_split[i]];
		}
		
		return depth;
	},
	read_file = (file, encoding) => {
		var resolved = path.resolve(file),
			depth = walk_depth(resolved);
		
		if(depth instanceof Error)return depth;
		
		if(fs.statSync(file).isDirectory())return errors.eisdir('read', file);
		
		var data = Buffer.from(lzutf8.decompress(depth, { inputEncoding: 'Base64' }), 'base64');
		
		return encoding ? data.toString(encoding) : data;
	},
	write_file = (file, data, options = {}) => {
		if(typeof data != 'string' && !(data instanceof Buffer) && !Array.isArray(data))throw new errors.invalid_arg_type('data', ['Buffer', 'TypedArray', 'DataView'], typeof data);
		
		if(fs.existsSync(file) && fs.statSync(file).isDirectory())return errors.eisdir('open', file);
		
		var resolved = path.resolve(file),
			resolved_split = resolved.split('/').filter(file => file),
			depth = filesystem;
		
		for(var i = 0; i < resolved_split.length; i++){
			if(!depth[resolved_split[i]] && i + 1 == resolved_split.length)depth[resolved_split[i]] = {};
			
			if(!depth[resolved_split[i]] && !options.recursive)return errors.enoent(file);
			
			if(i + 1 == resolved_split.length){
				var compressed = lzutf8.compress(Buffer.from(data).toString('base64'), { outputEncoding: 'Base64' });;
				
				walk_depth_dynamic(file)[resolved_split[i]] = compressed;
				
				depth[resolved_split[i]] = compressed
			}else depth = depth[resolved_split[i]];
		}
		
		update_fs();
		
		return true;
	},
	read_dir = dir => {
		if(!fs.statSync(dir).isDirectory())return { error: errors.enotdir(dir) };
		
		var resolved = path.resolve(dir),
			depth = walk_depth(resolved);
		
		if(depth instanceof Error)return depth;
		
		return { data: Object.keys(depth).filter(key => !reserved.includes(key)) };
	},
	stat = file => {
		var resolved = path.resolve(file),
			depth = walk_depth(resolved);
		
		if(depth instanceof Error)return depth;
		
		return {
			isDirectory: () => typeof depth == 'object',
			ctimeMs: () => Date.now(),
			atimeMs: () => Date.now(),
			mtimeMs: () => Date.now(),
		};
	},
	exists = file => {
		var resolved = path.resolve(file),
			depth = walk_depth(resolved);
		
		return (depth instanceof Error) ? false : true;
	},
	unlink = file => {
		var resolved_split = file.split('/').filter(file => file),
			depth = filesystem;
		
		for(var i = 0; i < resolved_split.length; i++){
			if(!depth[resolved_split[i]] && i + 1 == resolved_split.length)return errors.enoent(file);
			
			if(!depth[resolved_split[i]] && !options.recursive)return errors.enoent(file);
			
			if(i + 1 == resolved_split.length){
				Reflect.deleteProperty(walk_depth_dynamic(file), resolved_split[i]);
				Reflect.deleteProperty(depth, resolved_split[i]);
				
				update_fs();
				
				return true;
			}else depth = depth[resolved_split[i]];
		}
	},
	fs = module.exports = {
		mount(mount_point, type, data){
			var // depth = walk_depth_dir(mount_point).data,
				parsed = data;
			
			switch(type){
				case'json':
					parsed = JSON.parse(data);
					break
			}
			
			console.log('[FS] Mounting ' + type + ' volume at ' + mount_point);
			
			mounted[mount_point] = JSON.parse(JSON.stringify(data));
			
			Object.assign(filesystem, parsed);
			
			update_fs();
			
			return fs;
		},
		readFile(file, ...args){
			var options = args.find(arg => typeof arg == 'object') || {},
				callback = args.find(arg => typeof arg == 'function') || {},
				ret = read_file(file, options.encoding);
			
			callback(ret, ret instanceof Error ? null : ret);
		},
		readFileSync(file, encoding){
			var ret = read_file(file, encoding);
			
			if(ret instanceof Error)throw ret;
			
			return ret;
		},
		writeFileSync(file, data, options){
			var ret = write_file(file, data, options);
			
			if(ret instanceof Error)throw ret;
			
			return ret;
		},
		writeFile(file, data, ...args){
			var options = args.find(arg => typeof arg == 'object') || {},
				callback = args.find(arg => typeof arg == 'function') || {},
				ret = write_file(file, data, options);
			
			callback(ret, ret instanceof Error ? null : ret);
		},
		readdirSync(dir, callback){
			var ret = read_dir(dir);
			
			if(ret.error)throw ret.error;
			
			return ret.data;
		},
		readdir(dir, callback){
			var ret = read_dir(dir);
			
			callback(ret.error, ret.data);
		},
		existsSync(file){
			var ret = exists(file);
			
			if(ret instanceof Error)throw ret;
			
			return ret;
		},
		exists(file, callback){
			var ret = exists(file);
			
			callback(ret, ret instanceof Error ? null : ret);
		},
		statSync(file){
			var ret = stat(file);
			
			if(ret instanceof Error)throw ret;
			
			return ret;
		},
		stat(file, callback){
			var ret = stat(file);
			
			callback(ret, ret instanceof Error ? null : ret);
		},
		unlinkSync(file){
			var ret = unlink(file);
			
			if(ret instanceof Error)throw ret;
			
			return ret;
		},
		unlink(file, callback){
			var ret = unlink(file);
			
			callback(ret, ret instanceof Error ? null : ret);
		},
		/* webos extras */
		data_uri(file){
			var ret = read_file(file, 'base64');
			
			if(ret instanceof Error)throw ret;
			
			return 'data:' + mime.getType(file) + ';base64,' + ret;
		},
		download(file){
			var ret = read_file(file);
			
			if(ret instanceof Error)throw ret;
			
			var object_url = URL.createObjectURL(new Blob([ ret ])),
				link = Object.assign(document.body.appendChild(document.createElement('a')), {
					download: path.basename(file),
					href: object_url,
				});
			
			link.click();
			URL.revokeObjectURL(object_url);
			
			return true;
		},
	};