var screen = require('/lib/screen.js'),
	ui = require('/lib/ui.js'),
	login = {
		rect: new ui.rect({ width: '100%', height: '100%', color: ui.colors.window.active.main }),
		pfp: new ui.image({
			path: '/usr/share/logo.png',
			width: 150,
			height: 150,
			x: ui.align.middle,
			y: ui.align.middle,
			offset: {
				y: -75,
			},
			radius: 10,
		}),
		user_label: new ui.text({
			x: ui.align.middle,
			y: ui.align.middle,
			text: 'vibeOS',
			size: 16,
			weight: 'Bold',
			offset: {
				y: 25,
			},
		}),
		login_button: new ui.button({
			x: ui.align.middle,
			y: ui.align.middle,
			height: 25,
			width: 150,
			auto_width: false,
			text: 'login',
			offset: {
				y: 50,
			},
		}),
	};

login.rect.append(login.pfp);
login.rect.append(login.user_label);
login.rect.append(login.login_button);

login.login_button.on('click', event => {
	login.rect.deleted = true;
	login.rect.interact = false,
	web.bar.visible = true;
	// change this to be dynamic soon
	require.user.alias = 'vibeOS';
	require.user.home = '/home/vibeOS';
	
	require('./init-user.js');
});

screen.layers.append(
	login.rect,
);

web.bar.visible = false;

// begin rendering
screen.render();

/*
web.bar.open.push({
	icon_path: 'https://github.com/vibeOS/vibeos-legacy/blob/master/tango/apps/32/internet-web-browser.png?raw=true',
	type: 'xml', // xml, programmic
	xml: '/var/xml/webview_demo.xml',
	pinned: true,
});

web.bar.open.push({
	icon_path: 'https://c.sys32.dev/app/assets/favicon.ico',
	type: 'xml', // xml, programmic
	xml: '/var/xml/chatbox.xml',
	pinned: true,
});

web.bar.open.push({
	icon_path: '/usr/share/missing.png',
	type: 'programmic', // xml, programmic
	create(){
		return new ui.window({
			show_in_bar: false,
			
		});
	},
	pinned: true,
});
*/