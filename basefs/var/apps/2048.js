// https://github.com/67726e/2048-Canvas

var ui = require('/lib/ui.js'),
	win = new ui.window({
		title: '2048', 
		x: ui.align.middle, 
		y: ui.align.middle,
		width: 300,
		height: 400,
		icon: 'https://raw.githubusercontent.com/vibeOS/vibeos-legacy/master/tango/categories/32/applications-graphics.png',
		menu: {
			File: {
				Exit(){
					win.close();
				},
			},
			Game: {
				Reset(){
					// todo
				},
			},
		},
		show_in_bar: show_in_bar,
	}),
	game = {
		color: {
			// BG | TEXT
			2: ["#eee4da", "#776e65"],
			4: ["#ede0c8", "#776e65"],
			8: ["#f2b179", "#f9f6f2"],
			16: ["#f59563", "#f9f6f2"],
			32: ["#f67c5f", "#f9f6f2"],
			64: ["#f65e3b", "#f9f6f2"],
			128: ["#edcf72", "#f9f6f2"],
			256: ["#edcc61", "#f9f6f2"],
			512: ["#edc850", "#f9f6f2"],
			1024: ["#edc53f", "#f9f6f2"],
			2048: ["#edc22e", "#f9f6f2"],
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
					grid_x: x,
					grid_y: y,
					count: 2,
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
						return game.color[thise.count][1];
					},
					weight: 'bold',
				}));
			}
			draw(ctx, dims){
				ctx.fillStyle = game.color[this.count][0];
				
				ctx.fillRect(this.fixed.x, this.fixed.y, this.fixed.width, this.fixed.height);
			}
		},
		over(){
			
		},
		add_cell(){
			var shuffled = [];
			
			for (var i = game.cells.length - 1; i > 0; i--) {
				var j = Math.floor(Math.random() * (i + 1));
				var temp = game.cells[i];
				
				shuffled[i] = game.cells[j];
				shuffled[j] = temp;
			}
			
			var grid_spaces = game.grid_spaces();
			
			if(!grid_spaces.length)return game.over();
			
			var space = grid_spaces[~~(Math.random() * grid_spaces.length)],
				cell = game.con.append(new game.cell(space[0], space[1]));
			
			game.cells.push(cell);
			
			return cell;
		},
		max_cells(){
			return Array.from(Array(this.grid * this.grid)).map((val, ind) => [ ind % 4, ~~(ind / 4) ]);
		},
		grid_spaces(){
			var max_cells = this.max_cells();
			
			return max_cells.filter(([ x, y ]) => !this.get_cell(x, y));
		},
		key(dir){
			var change = {
				x: dir == 'left' ? -1 : dir == 'right' ? 1 : 0,
				y: dir == 'up' ? -1 : dir == 'down' ? 1 : 0,
			};
			
			Array.from(Array(game.grid)).forEach((x, ind) => game.cells.forEach(cell => {
				var inc_x = Math.min(Math.max(cell.grid_x + change.x, 0), game.grid - 1),
					inc_y = Math.min(Math.max(cell.grid_y + change.y, 0), game.grid - 1),
					intersect = game.cells.find(fe => fe.grid_x == inc_x && fe.grid_y == inc_y && fe.count);
				
				if(intersect && intersect != cell && intersect.count == cell.count){
					intersect.count *= 2;
					
					var in_arr = game.cells.findIndex(c => c == cell);
					
					if(in_arr != -1)game.cells.splice(in_arr, 1);
					
					cell.deleted = true;
				}
				
				if(!intersect){
					cell.grid_x = inc_x;
					cell.grid_y = inc_y;
				}
			}));
			
			game.add_cell();
		},
	};

win.content.on('keydown', event => {
	if(game.dirs[event.code])game.key(game.dirs[event.code]);
});

game.add_cell();
game.add_cell();
game.add_cell();


win.content.color = '#FFE';

module.exports = win;