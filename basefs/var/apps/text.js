// TEXT EDITOR
var fs = require('fs'),
	ui = require('/lib/ui.js'),
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
	margin = 6,
	text = {
		scroll: win.content.append(new ui.scroll_box({
			width: '100%',
			height: '100%',
			get inner_height(){
				return text.elem.height;
			},
		})),
		elem: new ui.text({
			text: '',
			color: '#000',
			offset: {
				width: margin * -2,
				height: margin * -2,
				x: margin,
				y: margin,
			},
			wrap: true,
			cursor: 'text',
		}),
		open_file(loc){
			win.title = 'Text Editor - ' + loc;
			
			var utf8 = fs.readFileSync(loc, 'utf8');
			
			text.elem.text = utf8;
		}
	};

text.scroll.content.append(text.elem);

if(flags.file)text.open_file(flags.file);


module.exports = win;