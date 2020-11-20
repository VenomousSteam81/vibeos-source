var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js'),
	demo_window = new ui.window({
		x: ui.align.middle,
		y: ui.align.middle,
		width: '600px',
		height: '400px',
		offset: { x: -25, y: -25 },
		icon: '/usr/share/missing.png',
		title: 'cool test',
		visible: true,
	}),
	test_text = demo_window.content.append(new ui.text({
		x: ui.align.middle,
		y: ui.align.middle,
		text: 'small text',
		color: '#000',
		size: 24,
		cursor: 'text',
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

screen.layers.append(
	// require('/var/demos/cats'),
	demo_window,
	ui.parse_xml(fs.readFileSync('/var/xml/license.xml', 'utf8')),
);

// begin rendering
screen.render();

web.bar.open.push({
	icon_path: 'https://github.com/vibeOS/vibeos-legacy/blob/master/tango/apps/32/internet-web-browser.png?raw=true',
	type: 'xml', // xml, programmic
	xml: '/var/xml/webview_demo.xml',
	pinned: true,
});

web.bar.open.push({
	icon_path: '/usr/share/missing.png',
	type: 'programmic', // xml, programmic
	create(){
		console.log('CREATE WINDOW');
		
		return new ui.window({
			show_in_bar: false,
			
		});
	},
	pinned: true,
});