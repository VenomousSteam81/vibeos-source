'use strict';
var path = require('path'),
	mime = require('mime'),
	lzutf8 = require('lzutf8'),
	Buffer = require('buffer').Buffer,
	is_object = item => item && typeof item == 'object' && !Array.isArray(item),
	merge_deep = (target, ...sources) => {
		if(!sources.length)return target;
		var source = sources.shift();

		if(is_object(target) && is_object(source))for(const key in source)if(is_object(source[key]))!target[key] && Object.assign(target, { [key]: {} }), merge_deep(target[key], source[key]);
		else Object.assign(target, { [key]: source[key] });

		return merge_deep(target, ...sources);
	},
	filesys = class {
		constructor(name){
			var dyn = JSON.parse(localStorage.getItem(name) || '{}');
			
			this.dynamic = {};
			this.static = {};
			
			Object.assign(this.dynamic, dyn);
			Object.assign(this.static, dyn);
			
			this.name = name;
		}
		update(){
			localStorage.setItem(this.name, JSON.stringify(this.dynamic));
		}
		walk_file_dynamic(file){
			var arr = path.resolve(file).split('/').filter(file => file),
				depth = this.dynamic;
			
			arr.forEach(val => depth = depth[val] || (depth[val] = {}));
			
			return depth;			
		}
		walk_file(file){
			var arr = path.resolve(file).split('/').filter(file => file),
				depth = this.static;
			
			arr.forEach(val => depth = depth[val] == null ? errors.enoent(file) : depth[val]);
			
			if(depth instanceof Error)throw depth;
			
			return depth;
		}
		mount(mount_point, type, data){
			var parsed = data;
			
			switch(type){
				case'json':
					parsed = JSON.parse(data);
					break
			}
			
			console.log('[FS] Mounting ' + type + ' volume at ' + mount_point);
			
			merge_deep(this.static, this.dynamic, this.dynamic, parsed);
			
			filesystem.update();
			
			return module.exports;
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
		read_dir(file){
			var depth = this.walk_file(file);
			 
			return Object.keys(depth);
		}
		write(file, data, options){
			if(typeof data != 'string' && !(data instanceof Buffer) && !Array.isArray(data))throw errors.invalid_arg_type('data', ['Buffer', 'TypedArray', 'DataView'], typeof data);
			
			if(this.exists(file) && this.stat(file).isDirectory())return errors.eisdir('open', file);
			
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
	filesystem = new filesys('__fs_1.0.0'),
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
	};

module.exports = {
	readFile(file, ...args){
		var options = args.find(arg => typeof arg == 'object') || {},
			callback = args.find(arg => typeof arg == 'function') || {},
			ret; try{ ret = filesystem.read(file, options.encoding) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	readFileSync: filesystem.read.bind(filesystem),
	writeFileSync: filesystem.write.bind(filesystem),
	writeFile(file, data, ...args){
		var options = args.find(arg => typeof arg == 'object') || {},
			callback = args.find(arg => typeof arg == 'function') || {},
			ret; try{ ret = filesystem.write(file, data, options) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	readdirSync: filesystem.read_dir.bind(filesystem),
	readdir(dir, callback){
		var ret; try{ ret = filesystem.read_dir(file) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	existsSync: filesystem.exists.bind(filesystem),
	exists: (file, callback) => callback(null, filesystem.exists(file)),
	statSync: filesystem.stat.bind(filesystem),
	stat(file, callback){
		var ret; try{ ret = filesystem.stat(file) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	unlinkSync: filesystem.unlink.bind(filesystem),
	unlink(file, callback){
		var ret; try{ ret = filesystem.unlink(file) }catch(err){ ret = err };
		
		callback(ret, ret instanceof Error ? null : ret);
	},
	mount: filesystem.mount.bind(filesystem),
	download: filesystem.download.bind(filesystem),
	data_uri: filesystem.data_uri.bind(filesystem),
};