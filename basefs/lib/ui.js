var fs = require('fs'),
	events = require('events'),
	dom_utils = require('/lib/dom-utils.js'),
	colors = {
		window: {
			primary_hover: '#E81123',
			primary_pressed: '#9B4666',
			active: {
				main: '#2997CC',
				border: '#3C9ECD',
				text: '#000000',
				secondary_hover: '#2588B7',
			},
			inactive: {
				main: '#FFFFFF',
				border: '#434343',
				text: '#AAAAAA',
				secondary_hover: '#E5E5E5',
			},
		},
		menu: {
			main: '#FFFFFF',
			border: '#F0F0F0',
		},
		menu_button: {
			idle: {
				main: '#FFFFFF',
				border: '#FFFFFF',
			},
			hover: {
				main: '#E5F3FF',
				border: '#CCE8FF',
			},
			active: {
				main: '#CCE8FF',
				border: '#91C9F7',
			},
		},
		button: {
			idle: {
				border: '#ADADAD',
				main: '#E1E1E1',
			},
			hover: {
				border: '#0078D7',
				main: '#E5F1FB',
			},
			active: {
				border: '#005499',
				main: '#CCE4F7',
			},
		},
	},
	blinking = {},
	blink_string = uuid => {
		if(blinking[uuid] != null)return blinking[uuid];
		
		blinking[uuid] = '|';
		
		setInterval(() => blinking[uuid] = blinking[uuid].length ? '' : '⎸', 1000);
		
		return blinking[uuid];
	},
	ui = exports;

ui.align = {
	left: Symbol(),
	right: Symbol(),
	top: Symbol(),
	bottom: Symbol(),
	middle: Symbol(),
};

ui.gen_uuid = () => [...Array(4)].map(() => {
	var d0 = Math.random() * 0xffffffff | 0;
	return ('' + (d0 & 0xff).toString(16)).padStart(2, 0) + ('' + (d0 >> 8 & 0xff).toString(16)).padStart(2, 0) + ('' + (d0 >> 16 & 0xff).toString(16)).padStart(2, 0) + ('' + (d0 >> 24 & 0xff).toString(16)).padStart(2, 0)
}).join('-').toUpperCase();

ui.percentage = (perc, full) => (perc * full) / 100;

ui.fixed_sp = (data, bounds) => {
	var data = Object.assign({}, data),
		correct = {
			width: 0,
			height: 0,
			x: 0,
			y: 0,
		},
		proc = (val, cor) => {
			var type = ((val || 0) + '').replace(/[^a-z%]/gi, '') || 'px', // get exact type (%, px, rem, etc..)
				actu = Number((val + '').replace(/[a-z%]/gi, '')), // remote types or characters
				ret = actu;
			
			switch(type){
				case'%':
					
					ret = ui.percentage(actu, cor);
					
					break;
			}
			
			return ret;
		};
	
	Object.entries(ui.align).forEach(([ key, val ]) => {
		if(data.x == 'ui.align.' + key)data.x = val;
		if(data.y == 'ui.align.' + key)data.y = val;
		
	});
	
	correct.width = proc(data.width, bounds.width) + (data.offset.width || 0);
	correct.height = proc(data.height, bounds.height) + (data.offset.height || 0);
	
	switch(data.x){
		case ui.align.middle:
			data.x = (bounds.width / 2) - (correct.width / 2);
			break;
		case ui.align.right:
			data.x = bounds.width - correct.width;
			break;
		case ui.align.left:
			data.x = correct.width;
			break;
	}
	
	switch(data.y){
		case ui.align.middle:
			data.y = (bounds.height / 2) - (correct.height / 2);
			break;
		case ui.align.top:
			data.y = correct.height;
			break;
		case ui.align.bottom:
			data.y = bounds.height - correct.height;
			break;
	}
	
	correct.x = bounds.x + proc(data.x, bounds.width) + (data.offset.x || 0);
	correct.y = bounds.y + proc(data.y, bounds.height) + (data.offset.y || 0);
	
	return correct;
}

ui.last_layer = 0;

ui.element = class extends events {
	constructor(opts, addon){
		super();
		
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
		
		this.cursor = 'pointer';
		
		this.steal_focus = true;
		this.always_on_top = false;
		
		this.uuid = ui.gen_uuid();
		
		this.elements = [];
		// layer out of parent elements
		this.layer = ui.last_layer++;
		
		this.interact = true;
		this.visible = true;
		
		this.deleted = false;
		
		// x-change, y-change are passed to rendering since cant add to any width or height properties if they are 50% or a symbol
		this.offset = {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
		};
		
		Object.assign(this, addon);
		
		Object.defineProperties(this, Object.getOwnPropertyDescriptors(opts));
		
		return this;
	}
	append(element){
		var layer = this.elements.length + 1;
		
		this.elements.push(element);
		
		Object.defineProperty(element, 'layer', { get: () => this.layer + layer });
		
		return element;
	}
	includes(element){
		var seen = new Set(),
			in_arr = arr => arr.some(val => {
				if(seen.has(val))return;
				
				seen.add(val);
				return val.uuid == element.uuid || in_arr(val.elements);
			});
			
		return this.uuid == element.uuid || in_arr(this.elements);
	}
	delete_uuid(uuid){
		var ind = this.elements.findIndex(ele => ele.uuid == uuid);
		
		if(ind)return this.elements.splice(ind, 1);
	}
};

ui.text = class ui_text extends ui.element {
	constructor(opts){
		super(opts, {
			size: 16,
			family: 'Calibri',
			text: 'Placeholder',
			align: 'start',
			color: '#FFF',
			baseline: 'middle',
		});
	}
	measure(ctx){
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
		ctx.font = (this.weight ? this.weight + ' ' : '') + this.size + 'px ' + this.family;
		
		var ret = ctx.measureText(this.text);
		
		ctx.restore();
		
		return ret;
	}
	draw(ctx, dims){
		ctx.fillStyle = this.color;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
		ctx.font = (this.weight ? this.weight + ' ' : '') + this.size + 'px ' + this.family;
		
		var measured = ctx.measureText(this.text);
		
		this.width = measured.width;
		this.height = this.size;
		
		var fixed = ui.fixed_sp(this, dims);
		
		ctx.fillText(this.text, fixed.x, fixed.y);
	}
}

ui.rect = class ui_rect extends ui.element {
	constructor(opts){
		super(opts, {
			color: '#FFF',
		});
	}
	draw(ctx, dims){
		ctx.fillStyle = this.color;
		
		var fixed = ui.fixed_sp(this, dims);
		
		ctx.fillRect(fixed.x, fixed.y, fixed.width, fixed.height);
	}
}

ui.border = class ui_rect extends ui.element {
	constructor(opts){
		super(opts, {
			color: '#FFF',
			size: 2,
			// prevent this from stealing mouse events
			interact: false,
		});
	}
	draw(ctx, dims){
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.size;
		
		var fixed = ui.fixed_sp(this, dims);
		
		ctx.strokeRect(fixed.x, fixed.y, fixed.width, fixed.height);
	}
}

ui.image = class ui_image extends ui.element {
	constructor(opts){
		super(opts, {
			path: '/usr/share/missing.png',
		});
		
		this.gen();
	}
	gen(){
		this.image = Object.assign(new Image(), {
			src: /^\w+:\/{2}/.test(this.path) ? this.path : fs.data_uri(this.path),
		});
	}
	draw(ctx, dims){
		var fixed = ui.fixed_sp(this, dims);
		
		ctx.drawImage(this.image, fixed.x, fixed.y, fixed.width, fixed.height);
	}
}

ui.menu = class ui_menu extends ui.rect {
	constructor(opts, menu){
		super(opts, {
			x: ui.align.middle,
			width: '100%',
			height: 20,
			color: colors.menu.main,
		});
		
		this.border = this.append(new ui.border({
			width: '100%',
			height: '100%',
			color: colors.menu.border,
		}));
		
		this.y = 32; // this.window.title_bar.height
		
		this.buttons = [];
		
		var prev;
		
		Object.entries(menu).forEach(([ key, val ]) => {
			var preve = prev,
				added = this.append(new ui.menu_button({
					text: key,
					x: 0,
					y: 0,
					height: this.height,
				}, val));
			
			this.buttons.push(added);
			
			if(preve)Object.defineProperty(added, 'x', { get: _ => preve.width + preve.x });
			
			prev = added;
		});
	}
	draw(ctx, dims){
		ctx.fillStyle = this.color; // this.window.title_bar.color;
		
		var fixed = ui.fixed_sp(this, dims);
		
		ctx.fillRect(fixed.x, fixed.y, fixed.width, fixed.height);
	}
}

ui.window = class ui_window extends ui.rect {
	constructor(opts){
		var othis = super(opts);
		
		Object.assign(this, {
			title: 'Placeholder',
			width: 200,
			height: 200,
			buttons: {},
			show_in_bar: true,
		}, opts);
		
		this.title_bar = this.append(new ui.rect({
			width: '100%',
			height: 32,
			drag: this,
		}));
		
		this.title_text = this.title_bar.append(new ui.text({
			x: this.icon ? 32 : 8,
			y: 16,
			size: 14,
			baseline: 'middle',
			height: '100%',
			text: this.title,
			interact: false,
		}));
		
		this.buttons.close = this.title_bar.append(new ui.rect({
			x: ui.align.right,
			y: 0,
			width: 45,
			height: 29,
			offset: {
				x: -1,
				y: 1,
			},
		}));
		
		this.buttons.close.text = this.buttons.close.append(new ui.text({
			x: ui.align.middle,
			y: 15,
			size: 14,
			baseline: 'middle',
			width: '100%',
			height: '100%',
			text: '✕',
			interact: false,
		}));
		
		this.buttons.close.on('mouseup', event => {
			this.deleted = true;
			// setting deleted to true will allow element to be picked up by renderer for deletion
		});
		
		Object.defineProperty(this.buttons.close, 'color', { get: () => this.buttons.close.mouse_pressed
			? colors.window.primary_pressed
			: this.buttons.close.mouse_hover
				? colors.window.primary_hover
				: this.active
					? colors.window.active.main
					: colors.window.inactive.main
		});
		
		Object.defineProperty(this.buttons.close.text, 'color', { get: _ => (this.buttons.close.mouse_pressed || this.buttons.close.mouse_hover) ? '#FFF' : '#000' });
		
		Object.defineProperty(this.title_bar, 'color', { get: () => this.active ? colors.window.active.main : colors.window.inactive.main });
		
		Object.defineProperty(this.title_text, 'color', { get: () => this.active ? colors.window.active.text : colors.window.inactive.text });
		
		if(this.icon)this.title_image = this.title_bar.append(new ui.image({
			path: this.icon,
			width: 16,
			height: 16,
			x: 8,
			y: ui.align.middle,
		}));
		
		this.content = this.append(new ui.rect({
			y: 32,
			color: '#fff',
			width: '100%',
			height: '100%',
			offset: {
				x: 0,
				y: 0,
				width: 0,
				height: -32,
			},
		}));
		
		if(opts.menu)this.content.offset.height -= 20, this.content.offset.y += 20, this.menu = this.append(new ui.menu({
			width: '100%',
			height: 20,
			window: this,
		}, opts.menu));
		
		this.border = this.append(new ui.border({
			size: 2,
			width: '100%',
			height: '100%',
		}));
		
		Object.defineProperty(this.border, 'color', { get: () => this.active ? colors.window.active.border : colors.window.inactive.border });
		
		web.bar.open.set(this, null);
	}
	bring_to_top(){
		var all_elements = [],
			add_elements = (arr, dims) => arr.filter(element => element.visible && element.interact).forEach(element => {
				var fixed = ui.fixed_sp(element, dims);
				
				element.fixed = fixed;
				
				all_elements.push(element);
				
				add_elements(element.elements, fixed);
			});
		
		add_elements(web.screen.layers, web.screen.dims);
		
		all_elements = all_elements.sort((ele, pele) => pele.layer - ele.layer);
		
		all_elements.filter(element => element instanceof ui.window && element.uuid != this.uuid).sort((ele, pele) => ele.layer - pele.layer).forEach(element => {
			element.active = false;
			this.layer = element.layer + element.elements.length + 1;
		});
		
		this.show();
		this.focus();
	}
	show(){
		this.visible = true;
	}
	hide(){
		this.visible = false;
		this.active = false;
	}
	focus(){
		this.active = true;
	}
	blur(){
		this.active = false;
	}
	close(){
		this.deleted = true;
	}
}

ui.button = class ui_button extends ui.rect {
	constructor(opts){
		super({
			height: 22,
			get color(){
				return this.mouse_pressed
					? colors.button.active.main
					: this.mouse_hover
						? colors.button.hover.main
						: colors.button.idle.main
			},
			auto_width: true, // determine width automatically
			cursor: 'link',
		});
		
		Object.assign(this, opts);
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
			get color(){
				return this.mouse_pressed
					? colors.button.active.border
					: this.mouse_hover
						? colors.button.hover.border
						: colors.button.idle.border;
			},
		}));
		
		this.text = this.append(new ui.text({
			x: this.icon ? 32 : 8,
			y: '50%',
			size: 14,
			color: '#000',
			baseline: 'middle',
			width: 50,
			height: '100%',
			text: this.text,
			interact: false,
			offset: {
				get x(){
					return this.mouse_pressed ? 1 : 0 ;
				},
			},
		}));
	}
	draw(ctx, dims){
		this.width = this.auto_width ? this.text.measure(ctx).width + 20 : this.width;
		
		return Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

ui.system_button = class ui_button extends ui.rect {
	constructor(opts){
		super({
			height: 22,
			color: '#E1E1E1',
			auto_width: true, // determine width automatically
			cursor: 'link',
		});
		
		Object.assign(this, opts);
		
		this.offset = {
			height: -2,
			x: 1,
		};
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
		}));
		
		this.text = this.append(new ui.text({
			x: this.icon ? 32 : 8,
			y: '50%',
			size: 14,
			color: '#000',
			baseline: 'middle',
			width: 50,
			height: '100%',
			text: this.text,
			interact: false,
		}));
		
		Object.defineProperty(this, 'color', { get: _ => 
			this.mouse_pressed
			? colors.menu_button.active.main
			: this.mouse_hover
				? colors.menu_button.hover.main
				: colors.menu_button.idle.main });
		
		Object.defineProperty(this.border, 'color',  { get: _ => this.mouse_pressed
			? colors.menu_button.active.border
			: this.mouse_hover
				? colors.menu_button.hover.border
				: colors.menu_button.idle.border });
	}
	draw(ctx, dims){
		this.width = this.auto_width ? this.text.measure(ctx).width + 20 : this.width;
		
		return Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

ui.menu_button = class ui_button extends ui.rect {
	constructor(opts, items){
		super({
			height: 22,
			color: '#E1E1E1',
			auto_width: true, // determine width automatically
			cursor: 'link',
		});
		
		Object.assign(this, opts);
		
		this.offset = {
			height: -2,
			x: 1,
		};
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
		}));
		
		this.text = this.append(new ui.text({
			x: this.icon ? 32 : 8,
			y: '50%',
			size: 14,
			color: '#000',
			baseline: 'middle',
			width: 50,
			height: '100%',
			text: this.text,
			interact: false,
		}));
		
		Object.defineProperty(this, 'color', { get: _ => 
			this.mouse_pressed
			? colors.menu_button.active.main
			: this.mouse_hover
				? colors.menu_button.hover.main
				: colors.menu_button.idle.main });
		
		Object.defineProperty(this.border, 'color',  { get: _ => this.mouse_pressed
			? colors.menu_button.active.border
			: this.mouse_hover
				? colors.menu_button.hover.border
				: colors.menu_button.idle.border });
		
		this.buttons = [];
		
		var prev;
		
		Object.entries(items).forEach(([ key, val]) => {
			var preve = prev,
				added = this.append(new ui.system_button({
					text: key,
					x: 0,
					y: 20,
					width: '100%',
					height: this.height,
					auto_width: false,
				}, val));
			
			this.buttons.push(added);
			
			if(preve)Object.defineProperty(added, 'y', { get: _ => preve.height + preve.y - 2 });
			
			added.on('mouseup', () => {
				val();
				
				this.toggle = 0;
				this.buttons.forEach(button => button.visible = false);
			});
			
			prev = added;
		});
		
		this.buttons.forEach(button => button.visible = false);
		
		this.on('mousedown', event => {
			this.toggle ^= 1;
			
			this.buttons.forEach(button => button.visible = this.toggle);
		});
	}
	draw(ctx, dims){
		if(!this.focused && this.toggle){
			this.toggle = 0;
			this.buttons.forEach(button => button.visible = false);
		}
		
		this.width = this.auto_width ? this.text.measure(ctx).width + 20 : this.width;
		
		return Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

ui.input = class ui_input extends ui.rect {
	constructor(opts){
		super(opts, {
			width: 100,
			height: 20,
			placeholder: '',
		});
		
		Object.assign(this, {
			submit: true,
		}, opts);
		
		this.cursor = 'text';
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
		}));
		
		this.text = this.append(new ui.text({
			text: 'xd',
			width: '100%',
			color: '#000',
			y: '50%',
			interact: false,
			offset: {
				x: 7,
			},
		}));
		
		this.value = '';
		
		Object.defineProperties(this.text, {
			text: { get: _ => this.focused ? (this.value || '') + blink_string(this.uuid) : this.value ? this.value : this.placeholder },
			color: { get: _ => this.value ? '#000' : '#767676' },
		});
		
		Object.defineProperty(this.border, 'color', { get: _ => this.focused ? '#0078D7' : '#000' });
		
		window.addEventListener('keydown', event => {
			if(!this.focused)return;
			
			blinking[this.uuid] = '⎸';
			
			switch(event.code){
				case'Backspace':
					this.value = this.value.slice(0, -1);
					break;
				case'Enter':
					if(this.submit)this.emit('submit', event), this.value = '';
					break;
				default:
					if(event.key.length == 1)this.value += event.key;
			}
		});
	}
	draw(ctx, dims){
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

ui.webview = class ui_webview extends ui.rect {
	constructor(opts){
		super(opts, {
			width: 100,
			height: 20,
			placeholder: '',
		});
		
		Object.assign(this, {
			url: 'about:blank',
		}, opts);
		
		this.iframe = dom_utils.add_ele('iframe', document.body, {
			src: this.url,
			style: 'display: block; position: absolute;',
		});
	}
	draw(ctx, dims){
		this.iframe.style.width = this.width;
		this.iframe.style.height = this.height;
		this.iframe.style.top = this.y;
		this.iframe.style.left = this.x;
		
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

ui.parse_xml = xml => {
	var dom_parser = new DOMParser(),
		parsed = dom_parser.parseFromString(xml, 'application/xml'),
		position = parsed.querySelector('meta > position'),
		size = parsed.querySelector('meta > size');
	
	if(position)position = {
		x: position.getAttribute('x'),
		y: position.getAttribute('y'),
	};
	
	if(size)size = {
		width: size.getAttribute('width'),
		height: size.getAttribute('height'),
	}
	
	var win = new ui.window({
			title: (parsed.querySelector('meta > title') || {}).textContent || 'Untitled app',
			icon: (parsed.querySelector('meta > icon') || { getAttribute(){} }).getAttribute('src'),
			x: position.x || ui.align.middle,
			y: position.y || ui.align.middle,
			width: size.width || 200,
			width: size.height || 200,
		}),
		contents = parsed.querySelectorAll('content > *'),
		proc_node = (node, append_to) => {
			var attr = Object.fromEntries([...node.attributes].map(attr => [ attr.nodeName, attr.nodeValue ]));
			
			attr.offset = {};
			if(attr.offset_x)attr.offset.x = +attr.offset_x;
			if(attr.offset_y)attr.offset.y = +attr.offset_y;
			if(attr.offset_width)attr.offset.width = +attr.offset_width;
			if(attr.offset_height)attr.offset.height = +attr.offset_height;
			
			switch(node.nodeName){
				case'text':
				case'button':
					
					attr.text = node.innerHTML;
					
					break;
			}
			
			var element = new ui[node.nodeName](attr);
			
			Object.entries(attr).filter(([ key, val ]) => key.startsWith('on')).forEach(([ key, val ]) => {
				var func = new Function('window', val);
				
				element.on(key.substr(2), event => func.apply(element, [ win ]));
			});
			
			node.querySelectorAll('*').forEach(node => proc_node(node, element));
			
			append_to.append(element);
		};
	
	parsed.querySelectorAll('script').forEach(node => new Function('window', node.innerHTML)(win));
	
	contents.forEach(node => proc_node(node, win.content));
	
	
	return win;
};

ui.bar = class extends ui.rect {
	constructor(opts){
		super(opts);
		
		Object.assign(this, {
			width: '100%',
			height: 40,
			color: '#101010',
			y: ui.align.bottom,
			always_on_top: true,
		});
		
		this.open = new Map();
	}
	draw(ctx, dims){
		this.open.forEach((icon, element, map) => {
			if(!element.show_in_bar)return;
			
			if(!icon){
				icon = this.append(new ui.rect({
					get x(){
						var vals = [...map.values()],
							icon_ind = vals.findIndex(ele => ele.uuid == icon.uuid),
							prev = vals.find((ele, ind) => ind == icon_ind - 1) || { x: 0, width: 0 };
						
						return prev.x + prev.width;
					},
					width: 40,
					height: 40,
					steal_focus: false,
				}));
				
				icon.image = icon.append(new ui.image({
					x: ui.align.middle,
					y: ui.align.middle,
					width: 30,
					height: 30,
					path: element.icon,
					interact: false,
				}));
				
				icon.on('click', event => {
					element.active ? element.hide() : element.bring_to_top();
				});
				
				icon.bottom_thing = icon.append(new ui.rect({
					width: '100%',
					height: 2,
					y: ui.align.bottom,
					color: '#60B0D5',
					visible: false,
					interact: false,
				}));
				
				this.open.set(element, icon);
			}
			
			icon.color = element.active ? '#333333' : '#101010';
			icon.bottom_thing.visible = element.active;
			
			if(element.deleted)return icon.deleted = true, this.open.delete(element);
		});
		
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
};