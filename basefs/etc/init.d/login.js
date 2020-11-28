'use strict';
var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js');

// set state of rendering stuff
screen.state = 'login';

var login_rect = screen.layers.append(new ui.rect({ width: '100%', height: '100%', color: ui.colors.window.active.main })),
	login = {
		time: login_rect.append(new ui.text({
			x: 20,
			y: ui.align.bottom,
			offset: { y: -40 },
			size: 45,
			cursor: 'text',
			family: 'Verdana',
			get text(){
				var now = new Date(),
					hour = (now.getHours() + '') % 12;
				
				return (hour == 0 ? 12 : hour) + ':' + (now.getMinutes() + '').padStart(2, 0) + ' ' + (hour < 12 ? 'PM' : 'AM');
			},
		})),
		pfp: login_rect.append(new ui.image({
			path: '/usr/share/logo.png',
			width: 150,
			height: 150,
			x: ui.align.middle,
			y: ui.align.middle,
			offset: {
				y: -75,
			},
			radius: 10,
		})),
		user_label: login_rect.append(new ui.text({
			x: ui.align.middle,
			y: ui.align.middle,
			text: 'vibeOS',
			size: 16,
			weight: 'Bold',
			offset: {
				y: 25,
			},
		})),
		login_button: login_rect.append(new ui.button({
			x: ui.align.middle,
			y: ui.align.middle,
			height: 25,
			width: 150,
			text: 'login',
			offset: {
				y: 60,
			},
		})),
	};

login.login_button.on('click', event => {
	web.bar.visible = true;
	
	// change this to be dynamic soon
	require.user.alias = 'vibeOS';
	require.user.home = '/home/vibeOS';
	
	screen.state = require.user.alias;
	require('./init-user.js');
});

web.bar.visible = false;

// begin rendering
screen.render();