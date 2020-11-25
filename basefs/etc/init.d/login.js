var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js'),
	login_rect = screen.layers.append(new ui.rect({ width: '100%', height: '100%', color: ui.colors.window.active.main })),
	login = {
		time: login_rect.append(new ui.text({
			x: 20,
			y: ui.align.bottom,
			offset: { y: -20 },
			size: 45,
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
			auto_width: false,
			text: 'login',
			offset: {
				y: 50,
			},
		})),
	};

login.login_button.on('click', event => {
	login_rect.deleted = true;
	login_rect.interact = false,
	web.bar.visible = true;
	
	// change this to be dynamic soon
	require.user.alias = 'vibeOS';
	require.user.home = '/home/vibeOS';
	
	require('./init-user.js');
});

web.bar.visible = false;

// begin rendering
screen.render();