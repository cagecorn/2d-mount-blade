// src/engines/rendering/TileRenderEngine.js
/**
 * 기본 그리드 타일을 렌더링하는 전문 엔진
 */
export class TileRenderEngine {
    constructor(context) {
        this.ctx = context;
        console.log("[TileRenderEngine] Initialized.");
    }

    /**
     * GridManager로부터 받은 데이터를 기반으로 모든 타일을 그립니다.
     * @param {GridManager} gridManager - 그리드 데이터 제공자
     */
    render(gridManager) {
        const TILE_SIZE = 32; // 타일 크기 (나중에 설정으로 뺄 수 있음)
        this.ctx.strokeStyle = '#555'; // 타일 테두리 색상

        for (let y = 0; y < gridManager.height; y++) {
            for (let x = 0; x < gridManager.width; x++) {
                const tile = gridManager.getTile(x, y);
                if (tile) {
                    // 지금은 간단하게 지형 타입에 따라 색상을 칠합니다.
                    switch (tile.type) {
                        case 'grass':
                            this.ctx.fillStyle = '#8BC34A';
                            break;
                        case 'sand':
                            this.ctx.fillStyle = '#FFD54F';
                            break;
                        default:
                            this.ctx.fillStyle = '#CCC';
                    }
                    this.ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                    this.ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
                }
            }
        }
    }
}
