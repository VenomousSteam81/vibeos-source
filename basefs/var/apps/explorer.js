'use strict';
var ui = require('/lib/ui.js'),
	fs = require('fs'),
	path = require('path'),
	win = new ui.window({
		title: 'Explorer',
		x: ui.align.middle, 
		y: ui.align.middle,
		offset: { x: 75, y: 0, },
		width: 600,
		height: 300,
		icon: '/usr/share/categ/development.png',
		show_in_bar: show_in_bar,
		menu: {
			File: {
				Exit(){
					win.close();
				},
			},
		},
	}),
	exp = {
		sidebar: win.content.append(new ui.scroll_box({
			width: '30%',
			height: '100%',
			clip: true,
			inner_height: 400,
		})),
		contents: win.content.append(new ui.scroll_box({
			x: '30%',
			width: '70%',
			height: '100%',
			inner_height: 600,
		})),
		folders: {},
		add_entry(loc, element, prev){ // add context menu soon!
			var stats = fs.statSync(loc),
				container = element.append(new ui.rect({
					width: '100%',
					height: 22,
					get color(){
						return this.focused ? '#CCE8FF' : this.mouse_hover ? '#E5F3FF' : 'transparent';
					},
					get y(){
						return prev.container.y + (prev.container.fixed || { container: { height: 0 } }).height;
					},
				})),
				data = {
					container: container,
					border: container.append(new ui.border({
						type: 'inset',
					})),
					icon: container.append(new ui.image({
						width: 16,
						height: 16,
						x: 4,
						y: ui.align.middle,
						interact: false,
						path: stats.isDirectory() ? '/usr/share/places/folder.png' : '/usr/share/mimes/exec.png',
					})),
					text: container.append(new ui.text({
						x: 24,
						y: '50%',
						color: '#000',
						text: path.basename(loc),
						interact: false,
					})),
				};
			
			container.on('doubleclick', () => stats.isDirectory() ? create_folders(loc) : ui.open_app('/var/apps/text.js', { flags: { file: loc } }, true));
			
			return data;
		},
	},
	create_contents = dir => {
		exp.contents.content.elements.forEach(ele => ele.deleted = true);
		
		var prev = { container: { y: 0, fixed: { height: 0 } } };
		
		fs.readdirSync(dir).slice(2).sort(file => fs.statSync(path.join(dir, file)).isDirectory() ? -10 : 10).forEach(file => {
			var val = exp.add_entry(path.join(dir, file), exp.contents.content, prev);
			
			val.border.assign_object({
				get color(){
					return val.container.focused ? '#99D1FF' : 'transparent';
				},
			});
			
			prev = val;
		});
	},
	create_folders = (dir, element) => {
		exp.sidebar.set_scroll(0);
		exp.contents.set_scroll(0);
		exp.sidebar.content.elements.forEach(ele => ele.deleted = true);
		
		create_contents(dir);
		
		win.title = dir;
		
		var prev = { container: { y: 0, fixed: { height: 0 } } };
		
		[{
			icon: '/usr/share/places/folder-home.png',
			name: 'Home',
			path: require.user.home,
		},{
			icon: '/usr/share/places/folder-desktop.png',
			name: 'Desktop',
			path: path.join(require.user.home, 'Desktop'),
		}].concat(fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isDirectory()).slice(1).map(file => ({
			icon: '/usr/share/places/folder.png',
			name: file,
			path: path.join(dir, file),
		}))).forEach(file => {
			var val = exp.add_entry(file.path, exp.sidebar.content, prev);
			
			val.container.assign_object({
				get color(){
					return this.focused ? '#CDE8FF' : this.mouse_hover ? '#E5F3FF' : 'transparent';
				}
			});
			
			val.icon.path = file.icon;
			
			val.text.text = file.name;
			
			prev = val;
		});
	};

create_folders(flags.folder || '/');

exp.sidebar.border = exp.sidebar.append(new ui.border({
	color: '#000',
	size: 1,
}));

module.exports = win;