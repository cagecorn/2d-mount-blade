/**
 * 그리드 및 타일 관련 시각화를 전담하는 렌더러입니다.
 * WebGPU를 최종 목표로 하지만, 초기에는 Canvas 2D API를 사용해 구현합니다.
 */
export class GridRenderer {
    constructor(config) {
        this.mapWidth = config.mapWidth;
        this.mapHeight = config.mapHeight;
        this.tileSize = config.tileSize;
        this.lineColor = config.lineColor || '#000';
        this.lineWidth = config.lineWidth || 6;

        // GridRenderer 내부에 타일 렌더링을 위한 엔진을 둡니다.
        this.tileRenderEngine = new TileRenderEngine();
    }

    /**
     * 지정된 캔버스 컨텍스트에 그리드를 그립니다.
     * @param {CanvasRenderingContext2D} ctx - 그리기 작업을 수행할 2D 컨텍스트
     */
    render(ctx) {
        this.tileRenderEngine.drawGridLines(
            ctx,
            this.mapWidth,
            this.mapHeight,
            this.tileSize,
            this.lineColor,
            this.lineWidth
        );
    }
}

/**
 * \uD83C\uDF08 \uD0C0\uC77C \uB80C\uB354\uB9C1 \uC5D4\uC9C4 (TileRenderEngine)
 * \uAE30\uBCF8\uC801\uC778 \uADF8\uB9AC\uB4DC \uD0C0\uC77C \uACBD\uACC4\uC120\uC744 \uADF8\uB9AC\uB294 \uC5F0\uD569\uC744 \uB2E8\uB2F4\uD569\uB2C8\uB2E4.
 */
class TileRenderEngine {
    /**
     * \uD0C0\uC77C \uACBD\uACC4\uC5D0 \uB530\uB77C \uADF8\uB9AC\uB4DC \uC120\uC744 \uADF8\uB9BD\uB2C8\uB2E4.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} mapWidth - \uD53C\uD06C\uC5B4\uB9AC\uB4DC \uB2E8\uC704\uC758 \uB9F5 \uB108\uBE44
     * @param {number} mapHeight - \uD53C\uD06C\uC5B4\uB9AC\uB4DC \uB2E8\uC704\uC758 \uB9F5 \uB192\uC774
     * @param {number} tileSize - \uD0C0\uC77C \uD558\uB098\uC758 \uD06C\uAE30 (\uD53C\uD06C\uC5B4\uB9AC\uB4DC)
     * @param {string} color - \uC120 \uC0C9\uC0C1
     * @param {number} width - \uC120 \uAD6C\uAE30
     */
    drawGridLines(ctx, mapWidth, mapHeight, tileSize, color, width) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = width;

        // \uC138\uB85C\uC120
        for (let x = 0; x <= mapWidth; x += tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, mapHeight);
            ctx.stroke();
        }

        // \uAC00\uB85C\uC120
        for (let y = 0; y <= mapHeight; y += tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(mapWidth, y);
            ctx.stroke();
        }

        ctx.restore();
    }
}

