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
		show_in_bar: from_app_menu,
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
		add_entry(loc, element, prev){
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
			
			container.on('click', () => {
				if(stats.isDirectory())create_folders(loc);
			});
			
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
			
			/*
			
			var preve = prev, // assign prev to something before change
				data = {
					container: exp.sidebar.content.append(new ui.rect({
						width: '100%',
						height: 25,
						toggle_focus: true,
						offset: {
							width: -1,
						},
						get y(){
							return preve.container.y + (preve.container.fixed || { container: { height: 0 } }).height;
						},
						get color(){
							return this.focused ? '#CDE8FF' : this.mouse_hover ? '#E5F3FF' : 'transparent';
						}
					})),
				};
			
			data.container.is_fs_element = true;
			
			data.border = data.container.append(new ui.border({
				type: 'inset',
				get color(){
					return data.container.focused && data.container.mouse_hover ? '#99D1FF' : 'transparent';
				},
			}));
			
			data.icon = data.container.append(new ui.image({
				width: 16,
				height: 16,
				x: 4,
				y: ui.align.middle,
				interact: false,
				path: file.icon,
			}));
			
			data.text = data.container.append(new ui.text({
				x: 24,
				y: '50%',
				color: '#000',
				text: file.name,
				interact: false,
			}));
			
			data.container.on('click', () => create_folders(file.path));
			
			// TODO: add context menu for container (delete, rename, etc..)
			
			prev = data;*/
		});
	};

create_folders('/');

exp.sidebar.border = exp.sidebar.append(new ui.border({
	color: '#000',
	size: 1,
}));

module.exports = win;