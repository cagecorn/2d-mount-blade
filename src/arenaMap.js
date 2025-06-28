import { MapManager } from './map.js';

export class ArenaMapManager extends MapManager {
    constructor(seed) {
        super(seed);
        this.name = 'arena';
        this.map = this._generateEmptyMap();
    }

    _generateEmptyMap() {
        return Array.from({ length: this.height }, () =>
            Array(this.width).fill(this.tileTypes.FLOOR)
        );
    }
}
