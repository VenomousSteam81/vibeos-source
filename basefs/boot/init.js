var screen = require('/lib/screen.js'),
	ui = require('/lib/ui-class.js'),
	background = new ui.image({ width: '100%', height: '100%', path: '/usr/share/wallpaper/default.png' }),
	demo_window = new ui.window({ x: ui.align.middle, y: ui.align.middle, width: '600px', height: '400px', offset: { x: -25, y: -25 }, icon: '/usr/share/missing.png' }),
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
	cat_window = new ui.window({
		title: 'CAT',
		x: ui.align.middle, 
		y: ui.align.middle,
		offset: { x: 75, y: 0, },
		width: '600px',
		height: '400px',
		icon: '/usr/share/missing.png',
		menu: {
			File: {
				Exit(){
					cat_window.close();
				},
			},
			Test: {
				ok(){
					alert();
				},
				ok1(){
					alert();
				},
				ok2(){
					alert();
				},
				
			},
		},
	}),
	cat_image = cat_window.content.append(new ui.image({
		x: ui.align.middle,
		y: ui.align.middle,
		width: '90%',
		height: '90%',
		path: 'https://cataas.com/cat',
	})),
	cat_text = cat_window.content.append(new ui.text({
		x: ui.align.middle,
		y: ui.align.bottom,
		text: 'cool cat',
		color: '#FFF',
		size: 32,
		family: 'impact',
		weight: 'bold',
		cursor: 'text',
	})),
	cat_reload = cat_window.content.append(new ui.button({
		x: ui.align.middle,
		y: ui.align.bottom,
		offset: {
			y: -75,
		},
		text: 'regen',
	}));

cat_reload.on('mouseup', event => {
	cat_image.path = 'https://cataas.com/cat?' + Date.now();
	cat_image.gen();
});

screen.render_layers.append(background, demo_window, cat_window);

// begin rendering
screen.render();