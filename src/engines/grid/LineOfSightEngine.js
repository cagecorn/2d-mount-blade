// src/engines/grid/LineOfSightEngine.js

/**
 * 두 지점 간의 시야(Line of Sight)를 계산하는 전문 엔진
 */
export class LineOfSightEngine {
    constructor(gridManager) {
        // 나중에 시야 계산 시 그리드 정보를 참조해야 하므로 gridManager를 받습니다.
        this.gridManager = gridManager;
        console.log("[LineOfSightEngine] Initialized: 시야 계산 준비 완료.");
    }

    /**
     * 두 지점 사이에 시야가 확보되는지 확인합니다. (장애물 여부 체크)
     * @param {{x: number, y: number}} start - 시작 타일 좌표
     * @param {{x: number, y: number}} end - 종료 타일 좌표
     * @returns {boolean} - 시야 확보 여부
     */
    hasLineOfSight(start, end) {
        // 지금은 간단하게 항상 true를 반환하지만,
        // 나중에는 두 지점 사이의 모든 타일을 검사하여 'wall' 같은 장애물이 있는지
        // 확인하는 '브레젠험 알고리즘(Bresenham\'s line algorithm)' 등을 구현하게 됩니다.
        // const tilesInBetween = this.gridManager.getTilesOnLine(start, end);
        // for (const tile of tilesInBetween) {
        //   if (!tile.properties.isWalkable) return false;
        // }
        return true;
    }
}
