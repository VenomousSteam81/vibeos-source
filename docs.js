// create documentation

var fs = require('fs'),
	path = require('path'),
	doc = require('documentation'),
	base_fs = path.join(__dirname, 'basefs'),
	output = path.join(base_fs, 'var', 'docs'),
	files = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs.json'), 'utf8'));

Promise.all(files.map(file => new Promise((resolve, reject) => doc.build([ path.join(__dirname, ...file.path) ], {}).then(data => doc.formats.md(data, { markdownToc: true })).then(data => fs.writeFileSync(path.join(output, file.label + '.md'), data) + resolve())))).then(() => {
	console.log('finished writing docs, find output at ' + output);
});