// https://github.com/67726e/2048-Canvas

var ui = require('/lib/ui.js'),
	win = new ui.window({
		title: '2048', 
		x: ui.align.middle, 
		y: ui.align.middle,
		width: 300,
		height: 500,
		icon: 'https://raw.githubusercontent.com/vibeOS/vibeos-legacy/master/tango/categories/32/applications-graphics.png',
		menu: {
			File: {
				Exit(){
					win.close();
				},
			},
		},
		show_in_bar: show_in_bar,
	}),
	game = {
		bg_color: {
			"2": "#eee4da",
			"4": "#ede0c8",
			"8": "#f2b179",
			"16": "#f59563",
			"32": "#f67c5f",
			"64": "#f65e3b",
			"128": "#edcf72",
			"256": "#edcc61",
			"512": "#edc850",
			"1024": "#edc53f",
			"2048": "#edc22e"
		},
		text_color: {
			"2": "#776e65",
			"4": "#776e65",
			"8": "#f9f6f2",
			"16": "#f9f6f2",
			"32": "#f9f6f2",
			"64": "#f9f6f2",
			"128": "#f9f6f2",
			"256": "#f9f6f2",
			"512": "#f9f6f2",
			"1024": "#f9f6f2",
			"2048": "#f9f6f2"
		},
		con: win.content.append(new ui.rect({
			color: '#BAA',
			width: '80%',
			get height(){
				return this.fixed.width;
			},
			x: ui.align.middle,
			y: ui.align.bottom,
			radius: 6,
			offset: {
				get y(){
					return (win.content.fixed.width - game.con.fixed.width) * -0.5;
				},
			},
		})),
		dirs: {
			ArrowUp: 'up',
			ArrowDown: 'down',
			ArrowLeft: 'left',
			ArrowRight: 'right',
		},
		grid: 4,
		cells: [],
		get_cell(x, y){
			return this.cells.find(cell => cell.grid_x == x && cell.grid_y == y);
		},
		cell: class extends ui.element {
			constructor(x, y){
				super({
					margin: 5,
					radius: 5,
					get x(){
						return ((this.width + this.margin) * this.grid_x) + (this.margin * 2);
					},
					get y(){
						return ((this.height + this.margin) * this.grid_y) + (this.margin * 2);
					},
					get width(){
						return (game.con.fixed.width / game.grid) - (this.margin * 2);
					},
					get height(){
						return (game.con.fixed.height / game.grid) - (this.margin * 2);
					},
					draw(ctx, dims){
						ctx.fillStyle = this.color;
						ctx.fillRect(this.fixed.x, this.fixed.y, this.fixed.width, this.fixed.height);
					},
					get color(){
						return game.bg_color[this.count];
					},
					grid_x: x,
					grid_y: y,
					count: 0,
					get visible(){
						return this.count;
					},
				}, {});
				
				var thise = this;
				
				this.text = this.append(new ui.text({
					x: ui.align.middle,
					y: ui.align.middle,
					get text(){
						return thise.count;
					},
					get color(){
						return game.text_color[thise.count];
					},
				}));
			}
		},
		add_cell(){
			if(game.cells.filter(cell => cell.count) == game.grid)return alert('game over!');
			
			var shuffled = [];
			
			for (var i = game.cells.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var temp = game.cells[i];
				
				shuffled[i] = game.cells[j];
				shuffled[j] = temp;
			}
			
			for(var cell in shuffled){
				if(!shuffled[cell].count){
					shuffled[cell].count = 2;
					break;
				}else continue;
			}
		},
		key(dir){
			game.add_cell();
			
			var change = {
				x: dir == 'left' ? -1 : dir == 'right' ? 1 : 0,
				y: dir == 'up' ? -1 : dir == 'down' ? 1 : 0,
			};
			
			game.cells.forEach(cell => {
				var inc_x = Math.min(Math.max(cell.grid_x + change.x, 0), game.grid - 1),
					inc_y = Math.min(Math.max(cell.grid_y + change.y, 0), game.grid - 1),
					intersect = game.get_cell(inc_x, inc_y);
				
				console.log(intersect, cell);
				
				if(intersect && intersect != cell && intersect.count == cell.count){
					intersect.count *= 2;
					
					cell.count = 0;
				}else if(!intersect){
					cell.grid_x = inc_x;
					cell.grid_y = inc_y;
				}
			});
		},
	};

win.content.on('keydown', event => {
	if(game.dirs[event.code])game.key(game.dirs[event.code]);
});

Array.from(Array(game.grid)).forEach((_, row) => {
	Array.from(Array(game.grid)).forEach((_, ind) => {
		var cell = game.con.append(new game.cell(ind, row));
		
		game.cells.push(cell);
	});
});

game.add_cell();

win.content.color = '#FFE';

module.exports = win;