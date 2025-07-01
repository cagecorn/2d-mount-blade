// src/aquariumMap.js
// Simple aquarium map that loads from predefined data
import { MapManager } from './map.js';
import { aquariumMapData } from './aquariumMapData.js';

export class AquariumMapManager extends MapManager {
    constructor(seed) {
        super(seed);
    }

    // override to use static map layout
    _generateMaze() {
        this.height = aquariumMapData.length;
        this.width = aquariumMapData[0].length;
        return aquariumMapData.map(row => row.slice());
    }
}
