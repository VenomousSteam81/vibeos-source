var fs = require('fs'),
	path = require('path'),
	events = require('events'),
	dom_utils = require('/lib/dom-utils.js'),
	colors = exports.colors = {
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
	blink_char = '|', // '⎸'
	blink_string = uuid => {
		if(blinking[uuid] != null)return blinking[uuid];
		
		blinking[uuid] = blink_char;
		
		setInterval(() => blinking[uuid] = blinking[uuid].length ? '' : blink_char, 1000);
		
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
	
	correct.width = proc(data.width, bounds.width);
	correct.height = proc(data.height, bounds.height);
	
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
	
	correct.width +=  data.offset.width || 0;
	correct.height +=  data.offset.height || 0;
	
	
	return Object.assign(data, correct);
}

ui.last_layer = 0;

ui.element = class extends events {
	constructor(opts, addon){
		super();
		
		Object.assign(this, {
			x: 0,
			y: 0,
			width: 0,
			height: 0,
			cursor: 'pointer',
			apply_clip: true,
			apply_translate: true,
			steal_focus: true,
			always_on_top: false,
			scroll: false,
			clip: false,
			uuid: ui.gen_uuid(),
			elements: [],
			// layer out of parent elements
			layer: ui.last_layer++,
			interact: true,
			visible: true,
			deleted: false,
			resizable: false,
			// x-change, y-change are passed to rendering since cant add to any width or height properties if they are 50% or a symbol
			offset: {
				x: 0,
				y: 0,
				width: 0,
				height: 0,
			},
			translate: {
				x: 0,
				y: 0,
			},
			resizing: {
				min_width: 200,
				min_height: 200,
				max_width: 600,
				max_height: 600,
			},
		});
		
		this.setMaxListeners(50);
		
		Object.assign(this, addon);
		
		Object.defineProperties(this, Object.getOwnPropertyDescriptors(opts));
		
		return this;
	}
	not_visible(){
		
	}
	draw(ctx, dims){
		
	}
	append(element){
		var layer = this.elements.length + 1;
		
		this.elements.push(element);
		
		Object.defineProperty(element, 'layer', { get: () => this.layer + layer, set: v => layer = v });
		
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
	draw_scroll(ctx, dims){
		var content_height = () => {
			var tmp = 0,
				content_height_set = arr => arr.filter(element => element.apply_clip).forEach(element => {
					var val = (element.fixed?.y || element.y) + (element.fixed?.height || element.height);
					
					if(val > tmp)tmp = val;
					
					content_height_set(element.elements);
				});
			
			content_height_set(this.elements);
			
			return tmp;
		};
		
		if(!this.scroll_box){
			var drag_handler = mouse => {
				var fixed = this.fixed || this,
					soon_val = this.scroll_button.offset.y + mouse.movement.y,
					full_y = fixed.y + mouse.movement.y,
					full_ey = full_y + fixed.height,
					full_y_height = soon_val + this.scroll_button.fixed?.height;
				
				
				
				if(soon_val <= 0){
					this.translate.y = 0;
					this.scroll_button.offset.y = 0;
					
					return;
				}else if(full_y_height >= fixed.height){
					this.translate.y = 0 - fixed.height;
					this.scroll_button.offset.y = fixed.height - this.scroll_button.fixed?.height;
					
					return;
				}
				
				if(full_y >= mouse.y || full_ey <= mouse.y)return;
				
				this.translate.y -= mouse.movement.y;
				
				this.scroll_button.offset.y += mouse.movement.y;
			};
			
			this.scroll_box = this.append(new ui.element({
				width: '100%',
				height: '100%',
				offset: {
					x: -4,
					y: -4,
					width: 15,
					height: 2,
				},
				apply_clip: false,
				apply_translate: false,
				interact: 'only_contents',
			}));
			
			this.scroll_bar = this.scroll_box.append(new ui.rect({
				size: 2,
				color: '#F1F1F1',
				width: 17,
				height: this.height / content_height,
				x: ui.align.right,
				y: 0,
				offset: {
					x: 1,
					width: 4,
				},
				apply_clip: false,
				apply_translate: false,
			}));
			
				
			this.on('wheel', event => drag_handler(Object.assign({}, web.screen.mouse, {
				movement: {
					x: event.deltaX / 10,
					y: event.deltaY /  10,
				},
			})));
			
			this.scroll_button = this.scroll_bar.append(new ui.rect({
				get color(){
					return this.mouse_pressed ? '#787878' : this.mouse_hover ? '#A8A8A8' : '#C1C1C1';
				},
				width: 13,
				height: 17,
				x: ui.align.middle,
				apply_translate: false,
			}));
			
			this.scroll_button.on('drag', drag_handler);
		}
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
			auto_width: true,
		});
	}
	measure(ctx){
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
		ctx.font = (this.weight ? this.weight + ' ' : '') + this.size + 'px ' + this.family;
		
		var ret = ctx.measureText(this.text);
		
		ret.height = ret.actualBoundingBoxAscent + ret.actualBoundingBoxDescent;
		
		ctx.restore();
		
		return ret;
	}
	draw(ctx, dims){
		ctx.fillStyle = this.color;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
		ctx.font = (this.weight ? this.weight + ' ' : '') + this.size + 'px ' + this.family;
		
		var measured = this.measure(ctx);
		
		this.width = measured.width;
		this.height = measured.height;
		
		var fixed = ui.fixed_sp(this, dims),
			tmp_line = 0,
			lines = this.text.split('\n').flatMap(line => {
				var ret = [],
					width = 0;
				
				line.split(' ').forEach(word => {
					width = width + ctx.measureText(word + ' ').width;
					
					if(width * 1.4 >= dims.width){
						width = 0;
						word = '\n' + word;
					}
					
					ret.push(word);
				});
				
				return ret.join(' ').split('\n');
			}),
			bigg_width = 0;
		
		lines.forEach(line => {
			var measured = ctx.measureText(line);
			
			if(measured.width > bigg_width)bigg_width = measured.width;
			
			ctx.fillText(line, fixed.x, fixed.y + tmp_line);
			
			tmp_line = tmp_line + Number(this.size);
		});
		
		if(this.auto_width)this.width = bigg_width;
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

ui.border = class ui_border extends ui.element {
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
		
		/*Object.entries(menu).forEach(([ key, val ]) => {
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
		});*/
		
		Object.entries(menu).forEach(([ key, val ], ind) => {
			var preev = prev, // assign as variable gets changed
				added = this.append(new ui.menu_button({
					text: key,
					get x(){
						return preev ? prev.width + preev.x : 0;
					},
					y: 0,
					height: '100%',
				}, val));
			
			this.buttons.push(added);
			
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
		
		if(this.show_in_bar)web.bar.open.push({
			element: this,
			icon_path: this.icon,
		});
		
		if(this.resizable){
			this.resize_element = this.append(new ui.rect({
				width: 10,
				height: 10,
				color: '#CCC',
				x: ui.align.right,
				y: ui.align.bottom,
			}));
			
			this.resize_element.on('drag', mouse => {
				
				
				this.offset.width += mouse.movement.x;
				this.offset.height += mouse.movement.y;
				
				if(this.offset.width < this.resizing.min_width)this.offset.width = this.resizing.min_width;
				else if(this.offset.height < this.resizing.min_height)this.offset.height = this.resizing.min_height;
				
				if(this.offset.width > this.resizing.max_width)this.offset.width = this.resizing.max_width;
				else if(this.offset.height > this.resizing.max_height)this.offset.height = this.resizing.max_height;
			});
		}
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
			x: ui.align.middle,
			y: '50%',
			size: 14,
			color: '#000',
			baseline: 'middle',
			width: 50,
			height: '100%',
			text: this.text,
			wrap: false,
			interact: false,
			offset: {
				get x(){
					return this.mouse_pressed ? 1 : 0 ;
				},
			},
		}));
		
		this.width = this.auto_width ? this.text.measure(web.screen.ctx).width + 20 : this.width;
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
			get color(){
				return this.mouse_pressed
					? colors.menu_button.active.main
					: this.mouse_hover
						? colors.menu_button.hover.main
						: colors.menu_button.idle.main;
			},
		});
		
		Object.defineProperties(this, Object.getOwnPropertyDescriptors(opts));
		
		this.offset = {
			height: -2,
			x: 1,
		};
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
			get color(){
				return this.mouse_pressed
					? colors.menu_button.active.border
					: this.mouse_hover
						? colors.menu_button.hover.border
						: colors.menu_button.idle.border;
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
		}));
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
			get color(){
				return 	this.mouse_pressed
					? colors.menu_button.active.main
					: this.mouse_hover
						? colors.menu_button.hover.main
						: colors.menu_button.idle.main
			},
		});
		
		Object.defineProperties(this, Object.getOwnPropertyDescriptors(opts));
		
		this.offset = {
			height: -2,
			x: 1,
		};
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
			get color(){
				return this.mouse_pressed
					? colors.menu_button.active.border
					: this.mouse_hover
						? colors.menu_button.hover.border
						: colors.menu_button.idle.border
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
		}));
		
		this.buttons = [];
		
		var prev;
		
		Object.entries(items).forEach(([ key, val]) => {
			var preev = prev,
				added = this.append(new ui.system_button({
					text: key,
					x: 0,
					get y(){
						return preev ? 20 + preev.y - 4 : 20
					},
					width: '100%',
					height: this.height,
					auto_width: false,
				}, val));
			
			this.buttons.push(added);
			
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
			value: '',
		});
		
		Object.assign(this, {
			submit: true,
		}, opts);
		
		this.cursor = 'text';
		
		this.cursor_pos = this.value.length;
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
		}));
		
		this.text = this.append(new ui.text({
			text: '',
			width: '100%',
			color: '#000',
			y: '50%',
			interact: false,
			offset: {
				x: 7,
			},
		}));
		
		Object.defineProperties(this.text, {
			text: { get: _ => this.value || '' },
			color: { get: _ => this.value ? '#000' : '#767676' },
		});
		
		Object.defineProperty(this.border, 'color', { get: _ => this.focused ? '#0078D7' : '#000' });
		
		this.on('click', () => {
			this.cursor_pos = this.value.length;
		});
		
		this.text.draw = (ctx, dims) => {
			Reflect.apply(ui.text.prototype.draw, this.text, [ ctx, dims ]);
			
			ctx.fillStyle = '#000';
			ctx.fillRect(this.text.fixed.x + ctx.measureText(this.text.text.slice(0, this.cursor_pos)).width, this.text.fixed.y - (this.fixed.height / 4), 2, 16);
		}
		
		window.addEventListener('keydown', event => {
			if(!this.focused)return;
			
			blinking[this.uuid] = blink_char;
			
			switch(event.code){
				case'Backspace':
					var val = (this.value || '');
					
					if(this.cursor_pos - 1 >= 0){
						this.value = val.slice(0, this.cursor_pos - 1) + val.slice(this.cursor_pos);
						this.cursor_pos -= 1;
					}
					
					break;
				case'Enter':
					if(this.submit)this.emit('submit', event), this.value = '';
					break;
				case'ArrowLeft':
					if(this.cursor_pos - 1 >= 0)this.cursor_pos -= 1;
					break;
				case'ArrowRight':
					if(this.cursor_pos + 1 <= this.value.length)this.cursor_pos += 1;
					break;
				default:
					if(event.ctrlKey)switch(event.code){
						case'KeyA':
							console.log('poaste');
							navigator.clipboard.read().then(data => console.log(data)).catch(err => {
								console.log(err);
							});
							break;
						default:
							console.log(event.code);
							break;
					}
					
					if(event.key.length == 1){
						var val = (this.value || ''), ins = event.key;
					
						this.value = val.slice(0, this.cursor_pos) + ins + val.slice(this.cursor_pos);
						
						this.cursor_pos++;
					}
			}
		});
	}
	draw(ctx, dims){
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

ui.webview = class ui_webview extends ui.rect {
	constructor(opts){
		var src = Symbol();
		
		super(opts, {
			width: 100,
			height: 20,
			placeholder: '',
		});
		
		if(!opts.window)return console.warn('ui: webview created with no window!');
		
		Object.assign(this, {
			src: 'about:blank',
		}, opts);
		
		this.iframe = dom_utils.add_ele('iframe', web.screen.container, {
			src: this.src,
			style: 'display: none; position: absolute; border: none;',
		});
		
		this[src] = this.src;
		
		Object.defineProperty(this, 'src', {
			get(){
				return this[src];
			},
			set(v){
				this[src] = v;
				this.iframe.src = this[src];
			}
		});
		
		this.window.on('not_visible', () => this.iframe.style.display = (this.window.active && this.window.visible) ? 'block' : 'none');
	}
	draw(ctx, dims){
		if(!this.window)return;
		
		if(this.window.deleted){
			this.window = null;
			this.iframe.remove();
			
			return;
		}
		
		this.iframe.style.display = (this.window.active && this.window.visible) ? 'block' : 'none';
		
		this.iframe.style['border-bottom-right-radius'] = this.window.resize_element ? '25px' : '0px';
		
		// prevent dragging causing iframe to focus
		this.iframe.style['pointer-events'] = 
			(this.window.resize_element
				? this.window.resize_element.mouse_pressed 
				: false || this.window.title_bar.mouse_pressed) ? 'none' : '';
		
		var fixed = ui.fixed_sp(this, dims);
		
		this.iframe.style.width = fixed.width + 'px';
		this.iframe.style.height = fixed.height + 'px';
		this.iframe.style.top = fixed.y + 'px';
		this.iframe.style.left = fixed.x + 'px';
		
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

ui.parse_xml = (xml, show_in_bar = true) => {
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
			resizable: !!parsed.querySelector('content[resizable]'),
			show_in_bar: show_in_bar,
			title: (parsed.querySelector('meta > title') || {}).textContent || 'Untitled app',
			icon: (parsed.querySelector('meta > icon') || { getAttribute(){} }).getAttribute('src'),
			x: position.x || ui.align.middle,
			y: position.y || ui.align.middle,
			width: size.width || 200,
			height: size.height || 200,
		}),
		contents = parsed.querySelectorAll('content > *'),
		proc_node = (node, append_to) => {
			var attr = Object.fromEntries([...node.attributes].map(attr => [ attr.nodeName, attr.nodeValue ]));
			
			Object.entries(attr).forEach(([ key, val ]) => {
				switch(val){
					case'true':
						attr[key] = true;
						break;
					case'false':
						attr[key] = false;
						break;
				}
			});
			
			attr.window = win;
			
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
		});
		
		this.layer = 1e10;
		
		this.open = [];
	}
	draw(ctx, dims){
		this.open.forEach((data, ind, arr) => {
			if(!data.icon){
				data.icon = this.append(new ui.rect({
					get x(){
						var icon_ind = arr.findIndex(ele => ele.icon.uuid == data.icon.uuid),
							prev = arr.find((ele, ind) => ind == icon_ind - 1) || { icon: { x: 0, width: 0 } };
						
						return prev.icon.x + prev.icon.width;
					},
					width: 40,
					height: 40,
					steal_focus: false,
					get color(){
						return (data.element && !data.element.deleted && data.element.active)
							? this.mouse_hover
								? '#474747'
								: '#333333'
							: this.mouse_hover
								? '#272727'
								: '#101010';
					},
				}));
				
				data.icon.image = data.icon.append(new ui.image({
					x: ui.align.middle,
					y: ui.align.middle,
					width: 30,
					height: 30,
					path: data.icon_path || '/usr/share/missing.png',
					interact: false,
				}));
				
				data.icon.on('click', event => {
					if(data.element && !data.element.deleted)data.element.active ? data.element.hide() : data.element.bring_to_top();
					else {
						switch(path.extname(data.path)){
							case'.xml':
								data.element = web.screen.layers.append(ui.parse_xml(fs.readFileSync(data.path, 'utf8'), false));
								break;
							case'.js':
								data.element = web.screen.layers.append(require(data.path, { cache: false }));
								break;
						}
					};
				});
				
				data.icon.bottom_thing = data.icon.append(new ui.rect({
					width: '100%',
					height: 2,
					y: ui.align.bottom,
					color: '#60B0D5',
					get visible(){
						return !!data.element;
					},
					interact: false,
				}));
			}
			
			if(data.element && data.element.deleted){
				if(!data.pinned)return data.icon.deleted = true, this.open.splice(ind, 1);
				else data.element = null;
			}
		
			Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
		});
	}
};