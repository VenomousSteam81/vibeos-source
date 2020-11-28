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
					if(win.help && !win.help.deleted)win.help.bring_front();
					else win.help = screen.layers.append(ui.parse_xml(`<?xml version='1.0' encoding='utf8'?>
<app>
	<meta>
		<title>TEST FROM BAR</title>
		<icon src='https://github.com/vibeOS/vibeos-legacy/blob/master/tango/apps/32/internet-web-browser.png?raw=true'></icon>
		<position x='ui.align.middle' y='ui.align.middle'></position>
		<size width='400' height='400'></size>
	</meta>
	<content>
		<text>hi</text>
	</content>
</app>
					`, false));
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