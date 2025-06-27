// src/managers/gridManager.js
// Turn-based Grid Manager skeleton inspired by ARCHITECTURE_ROADMAP.md

export class TerrainAnalysisEngine {
    constructor(mapManager) {
        this.mapManager = mapManager;
    }

    getTileType(x, y) {
        if (y < 0 || y >= this.mapManager.height) return null;
        if (x < 0 || x >= this.mapManager.width) return null;
        return this.mapManager.map[y][x];
    }

    getMoveCost(x, y) {
        const type = this.getTileType(x, y);
        if (type === this.mapManager.tileTypes.WALL) return Infinity;
        return 1;
    }
}

export class LineOfSightEngine {
    constructor(mapManager) {
        this.mapManager = mapManager;
    }

    hasLineOfSight(sx, sy, ex, ey) {
        let x0 = sx, y0 = sy;
        let x1 = ex, y1 = ey;
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sxStep = x0 < x1 ? 1 : -1;
        const syStep = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            if (this.mapManager.map[y0]?.[x0] === this.mapManager.tileTypes.WALL) {
                return false;
            }
            if (x0 === x1 && y0 === y1) break;
            const e2 = 2 * err;
            if (e2 > -dy) { err -= dy; x0 += sxStep; }
            if (e2 < dx) { err += dx; y0 += syStep; }
        }
        return true;
    }
}

export class GridManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        this.terrainEngine = new TerrainAnalysisEngine(mapManager);
        this.lineEngine = new LineOfSightEngine(mapManager);
    }

    isWalkable(x, y) {
        return this.terrainEngine.getMoveCost(x, y) < Infinity;
    }

    lineOfSight(sx, sy, ex, ey) {
        return this.lineEngine.hasLineOfSight(sx, sy, ex, ey);
    }
}
