var node = web.node = {
	execute: script => new Promise((resolve, reject) => {
		var req = () => fetch('https://code.sololearn.com/RunCode/', {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams(Object.entries({
				code: script,
				language: 'node',
				input: '',
			})),
		}).then(res => res.json()).then(data => (/^Terminated/.test(data.output)) ? console.warn('node: re-executing..') + req() : resolve(data.output)).catch(reject);
		
		req();
	}),
	dns: {
		getServers: () => new Promise((resolve, reject) => node.execute(`console.log(JSON.stringify(require('dns').getServers()))`).then(data => resolve(JSON.parse(data)))),
		lookup(hostname, ...args){
			var options = args.find(arg => typeof arg == 'object') || {},
				callback = args.find(arg => typeof arg == 'function') || (() => {});
			
			node.execute(`require('dns').lookup(${JSON.stringify([ hostname, options ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => callback(...JSON.parse(data)));
		},
		lookupService: (address, port, callback) => node.execute(`require('dns').lookupService(${JSON.stringify([ address, port ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => callback(...JSON.parse(data))),
		reverse: (ip, callback) => node.execute(`require('dns').reverse(${JSON.stringify([ ip ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		setServers: servers => console.warn('setServers not supported!'),
		resolve: (hostname, callback) => node.execute(`require('dns').resolve(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolve4(hostname, ...args){
			var options = args.find(arg => typeof arg == 'object') || {},
				callback = args.find(arg => typeof arg == 'function') || (() => {});
			
			node.execute(`require('dns').resolve4(${JSON.stringify([ hostname, options ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => callback(...JSON.parse(data)));
		},
		resolve6(hostname, ...args){
			var options = args.find(arg => typeof arg == 'object') || {},
				callback = args.find(arg => typeof arg == 'function') || (() => {});
			
			node.execute(`require('dns').resolve4(${JSON.stringify([ hostname, options ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => callback(...JSON.parse(data)));
		},
		resolveAny: (hostname, callback) => node.execute(`require('dns').resolveAny(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveCaa: (hostname, callback) => node.execute(`require('dns').resolveCaa(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveCname: (hostname, callback) => node.execute(`require('dns').resolveCname(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveMx: (hostname, callback) => node.execute(`require('dns').resolveMx(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveNaptr: (hostname, callback) => node.execute(`require('dns').resolveNaptr(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveNs: (hostname, callback) => node.execute(`require('dns').resolveNs(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolvePtr: (hostname, callback) => node.execute(`require('dns').resolvePtr(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveSoa: (hostname, callback) => node.execute(`require('dns').resolveSoa(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveSrv: (hostname, callback) => node.execute(`require('dns').resolveSrv(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		resolveTxt: (hostname, callback) => node.execute(`require('dns').resolveTxt(${JSON.stringify([ hostname ]).slice(1,-1)}, (...args) => console.log(JSON.stringify(args)) && process.exit(0))`).then(data => console.log(data) + callback(...JSON.parse(data))),
		ADDRCONFIG: 1024,
		ALL: 256,
		V4MAPPED: 2048,
		NODATA: 'ENODATA',
		FORMERR: 'EFORMERR',
		SERVFAIL: 'ESERVFAIL',
		NOTFOUND: 'ENOTFOUND',
		NOTIMP: 'ENOTIMP',
		REFUSED: 'EREFUSED',
		BADQUERY: 'EBADQUERY',
		BADNAME: 'EBADNAME',
		BADFAMILY: 'EBADFAMILY',
		BADRESP: 'EBADRESP',
		CONNREFUSED: 'ECONNREFUSED',
		TIMEOUT: 'ETIMEOUT',
		EOF: 'EOF',
		FILE: 'EFILE',
		NOMEM: 'ENOMEM',
		DESTRUCTION: 'EDESTRUCTION',
		BADSTR: 'EBADSTR',
		BADFLAGS: 'EBADFLAGS',
		NONAME: 'ENONAME',
		BADHINTS: 'EBADHINTS',
		NOTINITIALIZED: 'ENOTINITIALIZED',
		LOADIPHLPAPI: 'ELOADIPHLPAPI',
		ADDRGETNETWORKPARAMS: 'EADDRGETNETWORKPARAMS',
		CANCELLED: 'ECANCELLED',
	},
};