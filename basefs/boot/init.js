var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js'),
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
	test_input = demo_window.content.append(new ui.input({
		x: ui.align.middle,
		y: ui.align.bottom,
		placeholder: 'enter text here',
		width: 160,
		height: 25,
		offset: {
			y: -75,
		},
	}));

screen.render_layers.append(
	require('/var/demos/cats.js'),
	ui.parse_xml(fs.readFileSync('/var/xml/license.xml', 'utf8')),
	background,
);

// begin rendering
screen.render();