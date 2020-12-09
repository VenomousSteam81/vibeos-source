require('/etc/init.d/shell');

setTimeout(() => require('/etc/init.d/login.js'), 500);

web.users = {};

web.node = {
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
};