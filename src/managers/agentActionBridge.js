// src/managers/agentActionBridge.js
// 강화학습 에이전트가 게임 입력을 제어할 수 있도록 도와주는 가벼운 브리지

export class AgentActionBridge {
    constructor(game) {
        this.game = game;
        this.input = game.inputHandler;
    }

    // 키 입력 전달
    pressKey(key) {
        this.input.simulateKeyPress(key);
    }

    // 마우스 휠 스크롤 전달
    wheel(deltaY) {
        this.input.simulateMouseWheel(deltaY);
    }

    // 캔버스 클릭 좌표 전달
    click(x, y) {
        const ui = this.game.uiManager;
        if (!ui || typeof ui.handleCanvasClick !== 'function') return;
        ui.handleCanvasClick({ clientX: x, clientY: y, preventDefault() {} });
    }
}
