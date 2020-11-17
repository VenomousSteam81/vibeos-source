var screen = require('/lib/screen.js'),
	ui = require('/lib/ui-class.js'),
	background = new ui.image({ width: '100%', height: '100%', path: '/usr/share/wallpaper/default.png' }),
	demo_window = new ui.window({ x: ui.align.middle, y: ui.align.middle, width: '600px', height: '400px', icon: '/usr/share/missing.png' }),
	test_text = demo_window.content.append(new ui.text({
		x: ui.align.middle,
		y: ui.align.middle,
		text: 'small text',
		color: '#000',
		size: 24,
	})),
	test_text_2 = demo_window.content.append(new ui.text({
		x: ui.align.middle,
		y: 50,
		text: 'a',
		color: '#00F',
		size: 32,
		weight: 'bold',
	})),
	ademo_window = new ui.window({ x: ui.align.middle, y: ui.align.middle, offset: { x: 75, y: 75, }, width: '600px', height: '400px', icon: '/usr/share/missing.png' }),
	atest_text = ademo_window.content.append(new ui.text({
		x: ui.align.middle,
		y: ui.align.middle,
		text: 'm',
		color: '#F00',
		size: 32,
		weight: 'bold',
	})),
	atest_text_2 = ademo_window.content.append(new ui.text({
		x: ui.align.middle,
		y: 50,
		text: 'awesome',
		color: '#00F',
		size: 32,
		weight: 'bold',
	}));

/*Object.defineProperty(test_rect_dragbar, 'color', {
	get(){
		return this.mouse_pressed ? '#0F0' : this.mouse_hover ? '#F00' : '#00F'
	},
});*/

screen.render_layers.append(background, demo_window, ademo_window);

// begin rendering
screen.render();