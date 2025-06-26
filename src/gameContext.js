// src/gameContext.js

class GameContext {
    constructor() {
        if (GameContext.instance) {
            return GameContext.instance;
        }
        // 게임의 모든 구성 요소를 여기에 등록합니다.
        this.entityManager = null;
        this.uiManager = null;
        this.squadManager = null;
        this.turnManager = null;
        this.combatManager = null;
        this.inputHandler = null;
        this.audioManager = null; // 오디오 매니저 추가
        this.player = null;
        this.assets = null;
        this.eventManager = null;
        this.tooltipManager = null;
        // ... 다른 매니저들
        GameContext.instance = this;
    }

    initialize(managers) {
        for (const key in managers) {
            if (this.hasOwnProperty(key)) {
                this[key] = managers[key];
            }
        }
    }
}

// 싱글턴 인스턴스를 export
export const context = new GameContext();
