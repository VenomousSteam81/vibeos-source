// TEXT EDITOR
var ui = require('/lib/ui.js'),
	text_win = new ui.window({
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
					text_win.close();
				},
				Open(){
					
				},
			},
			Edit: {
				
			},
		},
	});



module.exports = text_win;