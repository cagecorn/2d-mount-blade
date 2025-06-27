// src/managers/GridManager.js
import { TerrainAnalysisEngine } from '../engines/grid/TerrainAnalysisEngine.js';
import { LineOfSightEngine } from '../engines/grid/LineOfSightEngine.js';

/**
 * 게임의 그리드 데이터를 총괄하고, 관련 엔진들을 지휘하는 매니저.
 * 데이터의 수호자 역할을 합니다.
 */
export class GridManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        // 1. GridManager는 자신의 '작은 엔진'들을 직접 소유하고 생성합니다.
        this.terrainEngine = new TerrainAnalysisEngine();
        this.sightEngine = new LineOfSightEngine(this);
        console.log(`[GridManager] Initialized: ${width}x${height} 그리드 생성.`);
        this._initializeGrid();
    }

    /**
     * 그리드를 초기화하고, 각 타일의 속성을 설정합니다.
     * @private
     */
    _initializeGrid() {
        for (let y = 0; y < this.height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.width; x++) {
                const tileType = 'grass';
                const properties = this.terrainEngine.getTileProperties(tileType);
                this.grid[y][x] = {
                    type: tileType,
                    properties,
                    unitId: null,
                };
            }
        }
    }

    /**
     * 특정 좌표의 타일 정보를 가져옵니다.
     * @param {number} x
     * @param {number} y
     * @returns {object|null} 타일 데이터 또는 맵 밖일 경우 null
     */
    getTile(x, y) {
        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            return this.grid[y][x];
        }
        return null;
    }

    /**
     * 특정 좌표의 시야 확보 여부를 '질문'합니다.
     * @param {{x: number, y: number}} start
     * @param {{x: number, y: number}} end
     * @returns {boolean}
     */
    hasClearLineOfSight(start, end) {
        // 3. 시야 계산은 전적으로 시야 엔진에게 위임합니다.
        return this.sightEngine.hasLineOfSight(start, end);
    }

    // 앞으로 추가될 메서드들...
    // moveUnitTo(unitId, x, y) { ... }
    // getUnitAt(x, y) { ... }
}
