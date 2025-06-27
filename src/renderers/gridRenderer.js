// src/renderers/gridRenderer.js
// Minimal GridRenderer using Canvas2D. This will later be replaced by WebGPU.

export class GridRenderer {
    constructor(canvas, tileSize = 32) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.tileSize = tileSize;
    }

    render(gridManager) {
        const { map, tileTypes } = gridManager.mapManager;
        this.canvas.width = map[0].length * this.tileSize;
        this.canvas.height = map.length * this.tileSize;
        for (let y = 0; y < map.length; y++) {
            for (let x = 0; x < map[y].length; x++) {
                const tile = map[y][x];
                switch (tile) {
                    case tileTypes.WALL:
                        this.ctx.fillStyle = '#222';
                        break;
                    case tileTypes.FLOOR:
                    default:
                        this.ctx.fillStyle = '#666';
                        break;
                }
                this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
            }
        }
    }
}
