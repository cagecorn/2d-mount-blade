import { MapManager } from './map.js';

export class ArenaMapManager extends MapManager {
    constructor(seed) {
        super(seed);
    }

    // Generate a mostly open space surrounded by walls
    _generateMaze() {
        const width = 20;
        const height = 20;
        this.width = width;
        this.height = height;
        const map = Array.from({ length: height }, () => Array(width).fill(this.tileTypes.FLOOR));

        // Add boundary walls
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
                    map[y][x] = this.tileTypes.WALL;
                }
            }
        }
        return map;
    }
}
