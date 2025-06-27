// src/renderers/GridRenderer.js
import { TileRenderEngine } from '../engines/rendering/TileRenderEngine.js';
// import { EffectRenderEngine } from '../engines/rendering/EffectRenderEngine.js';
// import { DebugOverlayEngine } from '../engines/rendering/DebugOverlayEngine.js';

/**
 * 그리드와 관련된 모든 시각적 요소를 렌더링하는 매니저.
 * 여러 렌더링 엔진을 지휘합니다.
 */
export class GridRenderer {
    constructor(context, eventManager) {
        this.ctx = context;
        this.eventManager = eventManager;

        // 렌더러가 자신의 전문 엔진들을 생성합니다.
        this.tileRenderEngine = new TileRenderEngine(this.ctx);
        // this.effectRenderEngine = new EffectRenderEngine(this.ctx);
        // this.debugOverlayEngine = new DebugOverlayEngine(this.ctx);
        
        console.log("[GridRenderer] Initialized.");

        // 예시: 그리드 데이터가 변경되었다는 이벤트를 받으면 다시 그리도록 설정
        // this.eventManager.subscribe('grid_updated', () => this.needsRedraw = true);
    }

    /**
     * 그리드와 관련된 모든 것을 그립니다. 게임 루프의 render 단계에서 호출됩니다.
     * @param {GridManager} gridManager
     * @param {Camera} camera
     */
    render(gridManager, camera) {
        this.ctx.save();
        this.ctx.translate(-camera.x, -camera.y);

        // 정해진 순서대로 각 전문 엔진의 render 함수를 호출
        this.tileRenderEngine.render(gridManager);
        // this.effectRenderEngine.render(gridManager);
        // this.debugOverlayEngine.render(gridManager);

        this.ctx.restore();
    }
}
