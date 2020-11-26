var ui = require('/lib/ui.js'),
	cat_window = new ui.window({
		title: 'CAT',
		x: ui.align.middle, 
		y: ui.align.middle,
		offset: { x: 75, y: 0, },
		width: '600px',
		height: '400px',
		icon: '/usr/share/missing.png',
		show_in_bar: show_in_bar,
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

module.exports = cat_window;