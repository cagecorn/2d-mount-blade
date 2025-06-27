// src/engines/grid/TerrainAnalysisEngine.js

/**
 * 지형 데이터를 분석하여 속성 및 이동 비용을 계산하는 전문 엔진
 */
export class TerrainAnalysisEngine {
    constructor() {
        console.log("[TerrainAnalysisEngine] Initialized: 지형 분석 준비 완료.");
    }

    /**
     * 특정 타일 타입의 속성을 반환합니다.
     * @param {string} tileType - 'grass', 'water', 'wall' 등 타일의 종류
     * @returns {{isWalkable: boolean, cost: number}} - 이동 가능 여부와 이동 비용
     */
    getTileProperties(tileType) {
        switch (tileType) {
            case 'grass':
                return { isWalkable: true, cost: 1 };
            case 'sand':
                return { isWalkable: true, cost: 2 }; // 모래는 이동 비용이 더 높음
            case 'water':
                return { isWalkable: false, cost: Infinity };
            case 'wall':
                return { isWalkable: false, cost: Infinity };
            default:
                return { isWalkable: true, cost: 1 };
        }
    }
}
