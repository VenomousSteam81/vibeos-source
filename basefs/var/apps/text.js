// TEXT EDITOR
var ui = require('/lib/ui.js'),
	screen = require('/lib/screen.js'),
	win = new ui.window({
		title: 'Text Editor',
		x: ui.align.middle, 
		y: ui.align.middle,
		offset: { x: 75, y: 0, },
		width: '600px',
		height: '400px',
		icon: '/usr/share/mimes/document.png',
		show_in_bar: show_in_bar,
		menu: {
			File: {
				Exit(){
					win.close();
				},
				Open(){
					
				},
			},
			Edit: {
				Open(){
					
				},
			},
			Help: {
				'About Notepad'(){
					if(!win.help || win.help.deleted)win.help = screen.layers.append(ui.template('about', 'notepad'));
					
					win.help.bring_front();
				},
			},
		},
	}),
	text = {
		open_file(loc){
			win.title = 'Text Editor - ' + loc;
			
			
		}
	};

if(flags.file)text.open_file(flags.file);


module.exports = win;