var fs = require('fs');

module.exports = class {
	constructor(user){
		this.user = user;
		
		this.file = path.join(require.user.home, 'apps.json');
		
		this.reg = fs.existsSync(this.file) ? this.read_reg() : [];
	}
	read_reg(){
		return JSON.parse(fs.readFileSync(this.file, 'utf8'));
	}
	write_reg(){
		return fs.writeFileSync(this.file, JSON.stringify(this.reg));
	}
	register(path, name, desc, category){
		
	}
	unregister(path){
		
	}
}