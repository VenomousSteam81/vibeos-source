// create documentation

var fs = require('fs'),
	path = require('path'),
	doc = require('documentation'),
	base_fs = path.join(__dirname, 'basefs'),
	app_dir = path.join(__dirname, 'app'),
	output = path.join(base_fs, 'var', 'docs'),
	files = [{
		label: 'ui',
		path: [base_fs, 'lib', 'ui.js'],
	},{
		label: 'require',
		path: [app_dir, 'require.js'],
	}];

Promise.all(files.map(file => new Promise((resolve, reject) => doc.build([ path.join(...file.path) ], {}).then(data => doc.formats.md(data, { markdownToc: true })).then(data => fs.writeFileSync(path.join(output, file.label + '.md'), data) + resolve())))).then(() => {
	console.log('finished writing docs, find output at ' + output);
});