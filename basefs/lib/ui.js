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
				secondary_pressed: '#2179A3',
			},
			inactive: {
				main: '#FFFFFF',
				border: '#434343',
				text: '#AAAAAA',
				secondary_hover: '#E5E5E5',
				secondary_pressed: '#E5E5E5',
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
	blink_bool = (uuid, speed = 1000, set_val) => {
		if(set_val){
			if(!blinking[uuid])blinking[uuid] = {};
			
			blinking[uuid].val = set_val;
			
			if(blinking[uuid].interval)clearInterval(blinking[uuid].interval);
			
			blinking[uuid].start_interval();
		};
		
		if(blinking[uuid] != null)return blinking[uuid].val;
		
		if(!blinking[uuid])blinking[uuid] = {};
		
		blinking[uuid].val = 1;
		
		blinking[uuid].start_interval = () => {
			if(blinking[uuid].interval)clearInterval(blinking[uuid].interval);
			
			blinking[uuid].interval = setInterval(() => blinking[uuid].val ^= 1, 1000);
		}
		
		if(!blinking[uuid].interval)blinking[uuid].start_interval();
		
		return blinking[uuid];
	},
	ui = exports,
	is_object = item => item && typeof item == 'object' && !Array.isArray(item),
	merge_deep = (target, ...sources) => {
		if(!sources.length)return target;
		var source = sources.shift();

		if(is_object(target) && is_object(source))for(const key in source)if(is_object(source[key]))!target[key] && Object.assign(target, { [key]: {} }), merge_deep(target[key], source[key]);
		else Object.assign(target, { [key]: source[key] });

		return merge_deep(target, ...sources);
	};

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

ui.fixed_sp = (data, dims) => {
	var data = Object.assign({}, data),
		dims = Object.assign({}, dims),
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
	
	if(dims.inner_height)dims.height = dims.inner_height;
	
	correct.width = proc(data.width, dims.width);
	correct.height = proc(data.height, dims.height);
	
	switch(data.x){
		case ui.align.middle:
			data.x = (dims.width / 2) - (correct.width / 2);
			break;
		case ui.align.right:
			data.x = dims.width - correct.width;
			break;
		case ui.align.left:
			data.x = correct.width;
			break;
	}
	
	switch(data.y){
		case ui.align.middle:
			data.y = (dims.height / 2) - (correct.height / 2);
			break;
		case ui.align.top:
			data.y = correct.height;
			break;
		case ui.align.bottom:
			data.y = dims.height - correct.height;
			break;
	}
	
	correct.x = dims.x + proc(data.x, dims.width) + (data.offset.x || 0);
	correct.y = dims.y + proc(data.y, dims.height) + (data.offset.y || 0);
	
	if(dims.translate && dims.translate.enabled){
		correct.x += dims.translate.x;
		correct.y += dims.translate.y;
	}
	
	correct.width +=  data.offset.width || 0;
	correct.height +=  data.offset.height || 0;
	
	
	return Object.assign(data, correct);
}

ui.last_layer = 0;

/**
* @class
* @param {object} addon Addon options to override options (lazy).
* @param {object} opts Options to override defaults.
* @param {number|string} opts.x x pos on screen (if value is a unit of %, it is relative to its parent) (example: 50%)
* @param {number|string} opts.y y pos on screen (if value is a unit of %, it is relative to its parent) (example: 50%)
* @param {number|string} opts.width width size on screen (if value is a unit of %, it is relative to its parent) (example: 50%)
* @param {number|string} opts.height height size on screen (if value is a unit of %, it is relative to its parent) (example: 50%)
* @param {number} opts.layer automatically set, layer to render an element
* @param {string} opts.cursor cursor when mouse hovers over element
* @param {string} opts.filter filter to apply on the context when rendering (similar to css filter)
* @param {boolean} opts.apply_clip if the renderer should apply a parent elements clip (keep in bounds)
* @param {boolean} opts.apply_translate if the renderer should translate the position on screen (offset but multiple)
* @param {boolean} opts.steal_focus if clicking on the element should take the current focus
* @param {boolean} opts.scroll show a scroll bar and clip (wip)
* @param {boolean} opts.interact if an element should recieve pointer events
* @param {boolean} opts.visible if the element is visible on screen
* @param {boolean} opts.deleted if the element is deleted and should be destroyed by the renderer
* @param {boolean} opts.resizable if the element can be resized
* @param {boolean} opts.toggle_focus if clicking the element should toggle the focus
* @param {object} opts.offset element offsets if the width and height are not numbers
* @param {number} opts.offset.x offset x
* @param {number} opts.offset.y offset y
* @param {number} opts.offset.width offset width
* @param {number} opts.offset.height offset height
* @param {object} opts.translate translate for all the appended elements
* @param {number} opts.translate.x translate x
* @param {number} opts.translate.y translate y
* @param {number} opts.translate.enabled if translating the position should be enabled
* @param {object} opts.resizing resize space for element
* @param {number} opts.resizing.min_width mininum resizable width
* @param {number} opts.resizing.min_height mininum resizable height
* @param {number} opts.resizing.max_width maximum resizable width
* @param {number} opts.resizing.max_height maximum resizable height
* @property {event} keydown when a key is pressed when mouse hovers over element or focused
* @property {event} keyup when a key is lifted when mouse hovers over element or focused
* @property {event} click when the element is clicked
* @property {event} doubleclick when the element is double clicked
* @property {event} drag when the element is being dragged
* @property {event} mousedown when the element is pressed
* @property {event} mouseup when the element is lifted
* @property {event} scroll when the scroll wheel is used
* @property {function} on event emitter on event, varies from: keydown, keyup, click, drag, mousedown, mouseup, scroll, doubleclick
* @property {function} once event emitter once event
* @property {function} off event emitter off event
* @property {function} draw event emitter on event
* @property {function} append add an element to this element, assigns layer to it
* @property {function} draw draws the element, called by renderer
* @property {function} delete_uuid deletes an elements sub elements with specific uuid
* @property {function} not_visible runs when element.visible is false, called by renderer
* @property {function} nested_size full size of element and its sub-elements
* @property {function} assign_object moves all property descriptors of an object into element (getters, setters)
* @property {boolean} mouse_hover if the mouse is hovering over element
* @property {boolean} mouse_left if left mouse button is pressing this element
* @property {boolean} mouse_right if right mouse button is pressing this element
* @property {boolean} mouse_pressed if the left mouse is pressing this button (alt)
* @property {boolean} focused if this element has recieved focus
* @property {string} uuid  unique identifier assigned to element
* @property {array} elements an array of appended elements (see element.append)
* @return {element} base ui element
*/

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
			scroll: false,
			clip: false,
			uuid: ui.gen_uuid(),
			elements: [],
			layer: ui.last_layer++,
			interact: true,
			visible: true,
			deleted: false,
			resizable: false,
			toggle_focus: false,
			filter: '',
			offset: {
				x: 0,
				y: 0,
				width: 0,
				height: 0,
			},
			translate: {
				x: 0,
				y: 0,
				enabled: false,
			},
			resizing: {
				min_width: 200,
				min_height: 200,
				max_width: 600,
				max_height: 600,
			},
		});
		
		this.assign_object(addon);
		
		this.setMaxListeners(50);
		
		this.assign_object(opts);
		
		return this;
	}
	assign_object(obj){
		if(!obj)throw new TypeError(this, ': no object to assign specified!');
		
		Object.defineProperties(this, Object.getOwnPropertyDescriptors(obj));
		
		return this;
	}
	not_visible(){
		
	}
	draw(ctx, dims){
		
	}
	content_height(){
		var height = 0,
			content_height_set = arr => {
				var prev;
				
				arr.filter(element => element.fixed).sort((ele, pele) => ele.fixed.y - pele.fixed.y).forEach(element => {
					height += element.fixed.height;
					
					if(prev)height += prev.fixed.y - element.fixed.y;
					
					content_height_set(element.elements);
					
					prev = element;
				});
			};
		
		content_height_set(this.elements);
		
		return height;
	}
	nested_size(){
		var count = 1,
			add_count = arr => arr.forEach(element => {
				count++;
				
				add_count(element.elements);
			});
		
		add_count(this.elements);
		
		return count;
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
};

/**
* text element
* @class
* @param {object} opts options to override defaults
* @param {string} opts.text text to display
* @param {number} opts.size font size
* @param {string} opts.family font family
* @param {string} opts.family font family
* @param {string} opts.align font alignment (start, end)
* @param {string} opts.color font hex color
* @param {string} opts.baseline font baseline (top, bottom, middle, alphabetic, hanging)
* @param {string} opts.auto_width if the elements width should be set automatically
* @param {string} opts.wrap if the element should be wrapped by width (buggy)
* @property {function} measure gives canvas font measurements
* @return {ui_text} text element
*/

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
	apply_style(ctx){
		ctx.save();
		ctx.fillStyle = this.color;
		ctx.textAlign = this.align;
		ctx.textBaseline = this.baseline;
		ctx.font = (this.weight ? this.weight + ' ' : '') + this.size + 'px ' + this.family;
	}
	measure(ctx, dims){
		this.apply_style(ctx);
		
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

/**
* rectangle to meet all your desires
* @class
* @param {object} opts options to override defaults
* @param {string} opts.color rectangle hex color
* @return {ui_rect} rectangle element
*/

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

/**
* border outline
* @class
* @param {object} opts options to override defaults
* @param {string} opts.color rectangle hex color
* @param {string} opts.size size of border
* @param {string} opts.type either inset, outset, determines if the border is inside a region or outside of it
* @return {ui_border} border element
*/

ui.border = class ui_border extends ui.element {
	constructor(opts){
		super(opts, {
			color: '#FFF',
			size: 2,
			width: '100%',
			height: '100%',
			// prevent this from stealing mouse events
			interact: false,
		});
	}
	draw(ctx, dims){
		ctx.strokeStyle = this.color;
		ctx.lineWidth = this.size;
		
		var fixed = ui.fixed_sp(this, dims),
			off = this.type == 'inset' ? this.size : 0;
		
		ctx.strokeRect(fixed.x + (off / 2), fixed.y + (off / 2), fixed.width - off, fixed.height - off);
	}
}

/**
* image
* @class
* @param {object} opts options to override defaults
* @param {string} opts.path path to image, can be https or absolute path
* @param {string} opts.filter custom filter to apply when image is drawn
* @return {ui_image} image element
*/

ui.image = class ui_image extends ui.element {
	constructor(opts){
		var pathe = Symbol();
		
		super(opts, {
			path: '/usr/share/missing.png',
		});
		
		this.gen();
		
		this.assign_object({
			get path(){
				return this[pathe];
			},
			set path(v){
				this[pathe] = v;
				this.gen();
			},
		});
	}
	gen(){
		this.image = Object.assign(new Image(), {
			src: /^\w+:/.test(this.path) ? this.path : fs.data_uri(this.path),
		});
	}
	draw(ctx, dims){
		var fixed = ui.fixed_sp(this, dims);
		
		ctx.drawImage(this.image, fixed.x, fixed.y, fixed.width, fixed.height);
	}
}

/**
* menu, appended to window automatically
* @class
* @param {object} opts options to override defaults
* @param {string} opts.color color of the bar
* @return {ui_image} image element
*/

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
			
			added.index = 1e10 - 2;
			
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

/**
* window
* @class
* @param {object} opts options to override defaults
* @param {string} opts.show_in_bar determines to show this window in the bar
* @param {string} opts.title title of the window
* @param {string} opts.icon https link or path to window icon
* @param {object} opts.menu an object containing sub objects with functions
* @property {function} show changes visibility of the window
* @property {function} hide changes visibility of the window
* @property {function} bring_front brings the window to the top
* @property {function} focus makes the window gain focus
* @property {function} blur makes the window lose focus
* @property {function} close sets window.deleted to true, closing the window
* @property {object} content ui_rect that all contents should be appended to
* @example
* // returns ui_window with menu
* var window = screen.layers.append(new ui.window({
* 	title: 'test',
* 	x: ui.align.middle,
* 	y: ui.align.middle,
* 	width: 300,
* 	height: 300,
* 	menu: {
* 		File: {
* 			Exit(){
* 				window.close();
* 			},
* 		},
* 		Edit: {
* 			ok(){
* 				alert('ok pressed');
* 			},
* 			ok1(){
* 				alert();
* 			},
* 			ok2(){
* 				alert();
* 			},
* 		},
* 	},
* }))
* @return {ui_window} window element
*/

ui.window = class ui_window extends ui.rect {
	constructor(opts){
		var othis = super(opts);
		
		Object.assign(this, {
			title: 'Placeholder',
			width: 200,
			height: 200,
			buttons: {},
			show_in_bar: true,
			icon: null,
		}, opts);
		
		this.title_bar = this.append(new ui.rect({
			width: '100%',
			height: 32,
			drag: this,
			get color(){
				return othis.active ? colors.window.active.main : colors.window.inactive.main;
			}
		}));
		
		this.title_text = this.title_bar.append(new ui.text({
			x: this.icon ? 32 : 8,
			y: 16,
			size: 14,
			baseline: 'middle',
			height: '100%',
			get text(){
				// dynamic title
				return othis.title;
			},
			interact: false,
			get color(){
				return othis.active ? colors.window.active.text : colors.window.inactive.text;
			},
		}));
		
		this.buttons.close = this.title_bar.append(new ui.rect({
			x: ui.align.right,
			width: 45,
			height: 29,
			offset: {
				x: -1,
				y: 1,
			},
			get color(){
				return othis.buttons.close.mouse_pressed
					? colors.window.primary_pressed
					: othis.buttons.close.mouse_hover
						? colors.window.primary_hover
						: othis.active
							? colors.window.active.main
							: colors.window.inactive.main
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
			get color(){
				return (othis.buttons.close.mouse_pressed || othis.buttons.close.mouse_hover) ? '#FFF' : '#000';
			},
		}));
		
		this.buttons.close.on('mouseup', event => this.deleted = true);
		
		this.buttons.minimize = this.title_bar.append(new ui.rect({
			x: ui.align.right,
			width: 45,
			height: 29,
			offset: {
				x: -45,
				y: 1,
			},
			get color(){
				return othis.buttons.minimize.mouse_pressed
					? colors.window[othis.active ? 'active' : 'inactive'].secondary_pressed
					: othis.buttons.minimize.mouse_hover
						? colors.window[othis.active ? 'active' : 'inactive'].secondary_hover
						: othis.active
							? colors.window.active.main
							: colors.window.inactive.main
			},
		}));
		
		this.buttons.minimize.draw = (ctx, dims) => {
			Reflect.apply(ui.rect.prototype.draw, this.buttons.minimize, [ ctx, dims ]);
			
			var fixede = this.buttons.minimize.fixed;
			if(fixede){
				var fixed = ui.fixed_sp({ offset: {}, x: ui.align.middle, y: ui.align.middle, width: '30%', height: 1 }, fixede);
				
				ctx.fillStyle = '#000';
				ctx.fillRect(fixed.x, fixed.y, fixed.width, fixed.height);
			}
		};
		
		this.buttons.minimize.on('mouseup', event => this.visible = false);
		
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
			get color(){
				return othis.active ? colors.window.active.border : colors.window.inactive.border;
			},
		}));
		
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
	bring_front(){
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
			this.layer = element.layer + element.nested_size() + 1;
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

/**
* button
* @class
* @param {object} opts options to override defaults
* @param {string} opts.text text to display on button
* @param {string} opts.auto_width if the button should have its width automatically set
* @return {ui_button} button element
*/

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
		
		this.width = this.auto_width ? this.text.measure(web.ctx).width + 20 : this.width;
	}
	draw(ctx, dims){
		this.width = this.auto_width ? this.text.measure(ctx).width + 20 : this.width;
		
		return Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
}

/**
* system button
* @class
* @param {object} opts options to override defaults
* @param {string} opts.text text to display on button
* @param {string} opts.auto_width if the button should have its width automatically set
* @return {system_button} system button element
*/

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

/**
* menu button, meant to be used with menu element
* @class
* @param {object} opts options to override defaults
* @param {string} opts.text text to display on button
* @param {string} opts.auto_width if the button should have its width automatically set
* @return {system_button} system button element
*/

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

/**
* input
* @class
* @param {object} opts options to override defaults
* @param {string} opts.placeholder placeholder to show on input bar
* @param {string} opts.value value to show on button, gets set dynamically
* @param {string} opts.submit if the enter key should submit and clear this input
* @property {object} submit (EVENT) when enter is pressed and inputs submit value is true
* @example
* // returns class ui_bar with submit listener
* var url_bar = screen.layers.append(new ui.input({
* 	placeholder: 'Input here',
* 	width: 100,
* 	height: 25,
* 	x: ui.align.middle,
* 	y: ui.align.middle,
* }));
* 
* url_bar.on('submit', event => {
* 	alert(url_bar.value + ' was recieved');
* });
* @return {ui_input} input element
*/

ui.input = class ui_input extends ui.rect {
	constructor(opts){
		var othis = super(opts);
		
		Object.assign(this, {
			width: 100,
			height: 20,
			placeholder: '',
			value: '',
			submit: true,
			cursor: 'text',
		}, opts);
		
		this.cursor_pos = (this.value || '').length;
		
		this.border = this.append(new ui.border({
			size: 1,
			width: '100%',
			height: '100%',
			get color(){
				return othis.focused ? '#2997CC' : '#999999';
			},
		}));
		
		this.text = this.append(new ui.text({
			get text(){
				return othis.value || '';
			},
			get color(){
				return '#232323';
			},
			width: '100%',
			color: '#000',
			y: '50%',
			interact: false,
			offset: {
				x: 7,
			},
		}));
		
		this.on('click', (event, mouse) => {
			this.cursor_pos = this.value.length;
			
			web.ctx.save();
			
			this.text.apply_style(web.ctx);
			
			var prev = 0,
				chars = this.value.split('').map((val, ind) => {
					var ret = { ind: ind, vale: ~~web.ctx.measureText(val).width };
					
					ret.val = prev += ret.vale;
					
					ret.val += ret.vale / 2;
					
					return ret;
				}),
				last = chars[chars.length - 1] || { val: 0, vale: 0 },
				rel = mouse.x - this.fixed.x;
			
			web.ctx.restore();
			
			this.cursor_pos = chars.concat({ ind: chars.length, val: last.val + last.vale }).reduce((prev, curr) => Math.abs(curr.val - rel) < Math.abs(prev.val - rel) ? curr : prev).ind;
			
			blink_bool(this.uuid, 1000, true);
		});
		
		this.text.draw = (ctx, dims) => {
			Reflect.apply(ui.text.prototype.draw, this.text, [ ctx, dims ]);
			
			if(!this.focused || !blink_bool(this.uuid))return;
			
			ctx.fillStyle = '#000';
			ctx.fillRect(this.text.fixed.x + ctx.measureText(this.text.text.slice(0, this.cursor_pos)).width, this.text.fixed.y - (this.fixed.height / 4), 2, 16);
		}
		
		this.on('paste', data => {
			data.event.preventDefault();
			
			this.value = this.value.slice(0, this.cursor_pos) + data.text + this.value.slice(this.cursor_pos);
			
			this.cursor_pos += data.text.length;
		});
		
		web.keyboard.on('keydown', event => {
			if(!this.focused)return;
			
			blink_bool(this.uuid, 1000, true);
			
			switch(event.code){
				case'Backspace':
					var val = (this.value || '');
					
					if(this.cursor_pos - 1 >= 0){
						this.value = val.slice(0, this.cursor_pos - 1) + val.slice(this.cursor_pos);
						this.cursor_pos -= 1;
					}
					
					break;
				case'Enter':
					if(this.submit){
						this.emit('submit', event);
						this.value = '';
						this.focused = false;
					}
					break;
				case'ArrowLeft':
					if(this.cursor_pos - 1 >= 0)this.cursor_pos -= 1;
					break;
				case'ArrowRight':
					if(this.cursor_pos + 1 <= this.value.length)this.cursor_pos += 1;
					break;
				default:
					if(event.ctrlKey && event.code == 'KeyA')return;
					
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

/**
* webview
* @class
* @param {object} opts options to override defaults
* @param {string} opts.src current page to display, changable
* @param {string} opts.window REQUIRED, parent window element that this goes in
* @param {string} opts.silence_warnings silences errors about overall usage of webviews
* @return {ui_webview} webview element
*/

ui.webview = class ui_webview extends ui.rect {
	constructor(opts){
		var src = Symbol();
		
		super(opts, {
			width: 100,
			height: 20,
			src: 'about:blank',
			silence_warnings: false,
		});
		
		if(!this.silence_warnings)console.warn('ui: refrain from using webviews! there are many new technologies that can replace them!');
		
		if(!opts.window && !this.silence_warnings)return console.warn('ui: webview created with no window!');
		
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

/**
* @param {string} xml xml data to parse, needs to be valid and a string
* @param {string} show-in-bar if the xml data should show in a bar
* @example
* // returns ui_window from xml data
* var xml_data = fs.readFileSync('/var/xml/test.xml', 'utf8'),
* 	parsed = ui.parse_xml(xml_data);
* 
* console.log(parsed);
* @return {ui_window} window element
*/

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
			
			switch(node.nodeName){
				case'scroll_box':
					
					element.point_append = element.content;
					
					break;
			}
			
			node.querySelectorAll('*').forEach(node => proc_node(node, element));
			
			append_to.point_append ? append_to.point_append.append(element) : append_to.append(element);
		};
	
	parsed.querySelectorAll('script').forEach(node => new Function('window', node.innerHTML)(win));
	
	contents.forEach(node => proc_node(node, win.content));
	
	
	return win;
};

/**
* @param {string} color hex color
* @return {ui_bar} system bar
*/

ui.bar = class ui_bar extends ui.rect {
	constructor(opts){
		var othis = super(opts);
		
		Object.assign(this, {
			width: '100%',
			height: 30,
			color: '#101010',
		});
		
		this.menu = this.append(new ui.rect({
			width: 100,
			height: 30,
			size: 1,
			toggle_focus: true,
			get color(){
				return this.focused ? '#494949' : this.mouse_hover ? '#287CD5' : 'transparent';
			},
		}));
		
		this.menu.icon = this.menu.append(new ui.image({
			path: '/usr/share/applications.png',
			x: 8,
			y: ui.align.middle,
			width: 16,
			height: 16,
		}));
		
		this.menu.text = this.menu.append(new ui.text({
			text: 'Applications',
			x: '50%',
			y: ui.align.middle,
			height: '50%',
			auto_width: false,
			size: 13,
			align: 'center',
			baseline: 'hanging',
			interact: false,
			offset: {
				x: 8,
			},
		}));
		
		this.menu.border = this.menu.append(new ui.border({
			width: '100%',
			height: '100%',
			type: 'inset',
			size: 2,
			get color(){
				return othis.menu.focused ? '#3E3E3E' : othis.menu.mouse_hover ? '#4890DA' : 'transparent';
			},
		}));
		
		this.menu.border_last = this.menu.append(new ui.border({
			width: '100%',
			height: '100%',
			type: 'inset',
			size: 1,
			get color(){
				return othis.menu.focused ? '#3E3E3E' : othis.menu.mouse_hover ? '#2D557F' : 'transparent';
			},
		}));
		
		this.menu.items = this.menu.append(new ui.rect({
			width: 150,
			get height(){
				return othis.menu.open.length * 30;
			},
			y: '100%', // hanging menu
			color: '#FFF',
			get visible(){
				return othis.menu.focused;
			},
		}));
		
		this.menu.open = [];
		
		this.layer = 1e10;
		
		this.open = [];
	}
	draw(ctx, dims){
		var othis = this;
		
		// WINDOWS OPEN
		this.open.forEach((data, ind, arr) => {
			if(!data.icon){
				data.icon = this.append(new ui.rect({
					get x(){
						var icon_ind = arr.findIndex(ele => ele.icon.uuid == data.icon.uuid),
							prev = arr.find((ele, ind) => ind == icon_ind - 1) || { icon: { x: 0, width: 0 } };
						
						return prev.icon.x + prev.icon.width;
					},
					width: 30,
					height: '100%',
					offset: {
						get x(){
							return (othis.menu.fixed || { width: 0 }).width;
						},
					},
					steal_focus: false,
					get color(){
						return (data.element && !data.element.deleted && data.element.active)
							? this.mouse_hover
								? '#474747'
								: '#333333'
							: this.mouse_hover
								? '#272727'
								: 'transparent';
					},
				}));
				
				data.icon.image = data.icon.append(new ui.image({
					x: ui.align.middle,
					y: ui.align.middle,
					width: '75%',
					height: '75%',
					path: data.icon_path || '/usr/share/missing.png',
					interact: false,
				}));
				
				data.icon.on('click', event => {
					if(data.element && !data.element.deleted)data.element.active ? data.element.hide() : data.element.bring_front();
					else {
						switch(path.extname(data.path)){
							case'.xml':
								data.element = web.screen.layers.append(ui.parse_xml(fs.readFileSync(data.path, 'utf8'), false));
								break;
							case'.js':
								data.element = web.screen.layers.append(require(data.path, { cache: false , args: {
									from_app_menu: false,
								}, }));
								break;
						}
						
						data.element.bring_front();
					};
				});
				
				data.icon.open_indicator = data.icon.append(new ui.rect({
					x: ui.align.middle,
					get width(){
						return (data.element && data.element.visible || data.icon.mouse_hover) ? '100%' : '75%';
					},
					height: 2,
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
		});
		
		// APPLICATIONS MENU
		
		var proc_menus = (item_arr, item_rect) => {
			item_arr.forEach((data, ind, arr) => {
				if(!data.container){
					data.container = item_rect.append(new ui.rect({
						width: '100%',
						height: 30,
						y: ind * 30,
						get color(){
							return this.mouse_pressed ? '#2766A8' : this.mouse_hover ? '#287CD5' : 'transparent';
						},
						steal_focus: !data.contents,
						toggle_focus: true,
					}));
					
					data.container.border = data.container.append(new ui.border({
						size: 1,
						get color(){
							return (data.container.mouse_hover || data.container.mouse_pressed) ? '#3B90E8' : '#828282';
						},
					}));
					
					data.container.image = data.container.append(new ui.image({
						x: 0,
						y: ui.align.middle,
						offset: {
							x: 5,
							y: 5,
							width: -10,
							height: -10,
						},
						width: 30,
						height: '100%',
						path: data.icon_path || '/usr/share/missing.png',
						interact: false,
					}));
					
					data.container.text = data.container.append(new ui.text({
						x: 30,
						y: '50%',
						wrap: false,
						text: data.title,
						interact: false,
						get color(){
							return (data.container.mouse_hover || data.container.mouse_pressed) ? '#FFF' : '#000';
						},
						size: 13,
					}));
					
					if(data.contents){
						data.items = data.container.append(new ui.rect({
							width: '100%',
							x: '100%',
							get height(){
								return data.contents.length * 30;
							},
							y: 0,
							color: '#FFF',
							get visible(){
								return data.container.should_be_focused;
							},
						}));
						
						if(data.contents.length)data.container.tick = data.container.append(new ui.image({
							path: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><path stroke="%23000" d="M.5.866l459 265.004L.5 530.874z"/></svg>`,
							get filter(){
								return (data.container.mouse_hover || data.container.mouse_pressed) ? 'contrast(0) brightness(2)' : '';
							},
							width: 7,
							height: 7,
							x: ui.align.right,
							y: ui.align.middle,
							offset: {
								x: -10,
							},
							interact: false,
						}));
					}
					
					data.container.on('mousedown', event => {
						if(data.contents)proc_menus(data.contents, data.items);
						
						if(data.path)((path.extname(data.path) == '.xml')
						? web.screen.layers.append(ui.parse_xml(fs.readFileSync(data.path, 'utf8'), true))
						: web.screen.layers.append(require(data.path, { cache: false, args: {
							from_app_menu: true,
						} }))).bring_front();
					});
				}
			});
		};
		
		proc_menus(this.menu.open, this.menu.items);
		
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
	}
};

/**
* @description canvas for additional drawing where ui elements are not applicable
* @class
* @param {object} opts options
* @param {string} opts.context context to grab from canvas when created, setting to skip will allow you to call getContext manually
* @param {array} opts.context_opts additional arguments if opts.content is valid when calling getcontext
* @property {CanvasRenderingContext2D} ctx the rendering context made automatically
* @property {HTMLCanvasElement} canavs the canvas created to render on
* @property {event} draw frame to draw stuff on before an image is captured
* @example
* // creates window that draws rectangle relative to cursor
* var window = screen.layers.append(new ui.window({
* 		title: 'canvs demo',
* 		x: ui.align.middle,
* 		y: ui.align.middle,
* 	})),
* 	canvas = window.content.append(new ui.canvas({
* 		width: '100%',
* 		height: '100%',
* 	}));
* 
* canvas.on('draw', () => {
* 	console.log('drawing');
* 	canvas.ctx.fillStyle = 'white';
* 	canvas.ctx.fillRect(web.mouse.x - canvas.fixed.x, web.mouse.y - canvas.fixed.y, 10, 10);
* });
* @property {HTMLCanvasElement} canvas canvas containing raw functions
*/

ui.canvas = class ui_canvas extends ui.element {
	constructor(opts){
		super(opts, {
			context: '2d',
			context_opts: [],
		});
		
		this.canvas = dom_utils.add_ele('canvas', web.screen.container, { style: 'display:none' });
		
		if(this.context != 'skip')this.ctx = this.canvas.getContext(this.context);
	 	
		this.canvas.getContext = new Proxy(this.canvas.getContext, {
			apply: (target, thisArg, [ type, options ]) => {
				if(/^webgl/.test(type) && options)options.preserveDrawingBuffer = true;
				
				var ret = Reflect.apply(target, thisArg, [ type, options ]); 
				
				this.ctx = ret;
				
				return ret;
			}
		});
	}
	draw(ctx, dims){
		// draw rect
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
		
		this.emit('draw', ctx, dims);
		
		// draw canvas onto canvas
		ctx.drawImage(this.canvas, this.fixed.x, this.fixed.y, this.fixed.width, this.fixed.height);
	}
}

/**
* @description context menu for showing items
* @class
* @param {object} opts options
* @param {array} opts.triggers list of elements to check for right clicks on (ui.element(s))
* @param {array} opts.items list of items to append (format is { title: '...', icon: '...', path: '...executable, js, or xml' })
* @property {CanvasRenderingContext2D} ctx the rendering context made automatically
* @property {HTMLCanvasElement} canavs the canvas created to render on
* @property {event} draw frame to draw stuff on before an image is captured
* @example
* var win = web.screen.layers.append(new ui.window({
* 	title: 'demo',
* 	x: ui.align.middle,
* 	y: ui.align.middle,
* }));
* 
* // make sure the menu is ONLY appended to screen.layers
* win.context_menu = screen.layers.append(new ui.context_menu({
* 	triggers: [ win.content, win.title_bar ],
* 	items: [{
* 		title: 'About vibeOS',
* 		icon: '/usr/share/categ/office.png',
* 		path: '/var/xml/about.xml',
* 	}],
* }));
*/

ui.context_menu = class ui_context_menu extends ui.element {
	constructor(opts){
		super(opts, {
			triggers: [],
			width: 250,
			height: 60,
			color: '#EEE',
			items: [],
		});
		
		// above ui bar 
		this.layer = 1e10 + 5;
		
		Object.defineProperties(this, {
			visible: { get: _ => this.focused },
			height: { get: _ => this.items.length * 26 }
		}),
		
		this.triggers.forEach(element => element.on('contextmenu', (event, mouse) => {
			if(!mouse.buttons.right)return;
			
			this.x = mouse.x;
			this.y = mouse.y;
			
			this.focused = true;
		}));
		
		this.border = this.append(new ui.border({
			color: '#A0A0A0',
			size: 1,
			type: 'inset',
		}));
	}
	draw(ctx, dims){
		// draw rect
		Reflect.apply(ui.rect.prototype.draw, this, [ ctx, dims ]);
		
		this.items.filter(item => !item.container).forEach((item, ind, arr) => {
			item.container = this.append(new ui.rect({
				width: '100%',
				height: 26,
				get y(){
					// list up-down
					var con_ind = arr.findIndex(ele => ele.container.uuid == item.container.uuid),
						alt_fixed = { y: 0, height: 0 },
						prev = arr.find((ele, ind) => ind == con_ind - 1) || { container: { y: 0, fixed: alt_fixed } };
					
					return prev.container.y + (prev.container.fixed || alt_fixed).height;
				},
				get color(){
					return this.mouse_hover ? '#FFF' : 'transparent';
				},
				offset: {
					x: 4,
					width: -8,
					y: 4,
					height: -4,
				},
			}));
			
			item.container.text = item.container.append(new ui.text({
				interact: false,
				text: item.title,
				color: '#000',
				x: 35,
				y: '50%',
				wrap: false,
			}));
			
			item.container.icon = item.icon ? item.container.append(new ui.image({
				interact: false,
				width: 16,
				height: 16,
				x: 8,
				y: ui.align.middle,
				path: item.icon,
			})) : null;
			
			item.container.on('click', () => {
				this.focused = false;
				
				if(item.path)((path.extname(item.path) == '.xml')
				? web.screen.layers.append(ui.parse_xml(fs.readFileSync(item.path, 'utf8'), true))
				: web.screen.layers.append(require(item.path, { cache: false, args: { from_app_menu: true } }))).bring_front();
			});
		});
	}
};

ui.scroll_box = class ui_scroll_box extends ui.element {
	constructor(opts){
		var othis = super(opts, {
			clip: true,
			inner_height: 500,
			track_size: 80,
		});
		
		this.movement = (mouse, event) => {
			var rel = mouse.y - this.content.fixed.y,
				new_pos = this.grip.offset.y + mouse.movement.y,
				content_ratio = +this.inner_height / this.fixed.height;
			
			if(new_pos < 0)new_pos = 0;
			if((new_pos + this.grip.fixed.height) > this.fixed.height)new_pos = this.fixed.height - this.grip.fixed.height;
			
			var new_pos_ratio = new_pos * content_ratio;
			
			this.content.translate.y = -(new_pos_ratio);
			this.grip.offset.y = new_pos;
		};
		
		this.bar = this.append(new ui.rect({
			size: 2,
			color: '#F1F1F1',
			width: 17,
			height: '100%',
			x: ui.align.right,
			y: 0,
			offset: {
				x: 1,
				width: 4,
			},
		}));
		
		this.grip = this.bar.append(new ui.rect({
			get color(){
				return this.mouse_pressed ? '#787878' : this.mouse_hover ? '#A8A8A8' : '#C1C1C1';
			},
			width: 13,
			height: 17,
			x: ui.align.middle,
		}));
		
		this.content = this.append(new ui.rect({
			width: '100%',
			height: '100%',
			color: 'transparent',
			offset: {
				get width(){
					return -(othis.grip.fixed || { width: 10 }).width
				},
			},
			translate: {
				enabled: true,
				x: 0,
				y: 0,
				width: 0,
				height: 0,
			},
		}));
		
		this.grip.on('drag', this.movement);
		
		this.on('sub-wheel', event => this.movement(Object.assign({}, web.mouse, {
			movement: {
				x: event.deltaX / 10,
				y: event.deltaY / 10,
			},
		}), event));
	}
	draw(ctx, dims){
		var fixed = ui.fixed_sp(this, dims),
			ratio = this.fixed.height / this.inner_height,
			grip_size = this.track_size * ratio;
		
		this.grip.height = grip_size;
	}
}