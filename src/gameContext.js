// src/gameContext.js

class GameContext {
    constructor() {
        if (GameContext.instance) {
            return GameContext.instance;
        }
        this.entityManager = null;
        this.uiManager = null;
        this.squadManager = null;
        // 용병 관련 매니저를 저장합니다.
        this.mercenaryManager = null;
        this.turnManager = null;
        this.combatManager = null;
        this.inputHandler = null;
        this.audioManager = null;
        this.vfxManager = null;
        this.itemManager = null;
        this.player = null;
        this.assets = null;
        this.eventManager = null;
        this.tooltipManager = null;
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

export const context = new GameContext();
