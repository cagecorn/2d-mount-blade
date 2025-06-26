// src/gameContext.js

/**
 * 게임의 모든 핵심 매니저와 상태를 담는 중앙 컨텍스트입니다.
 * '싱글턴' 패턴을 사용하여 게임 내 어디서든 동일한 인스턴스에 접근할 수 있습니다.
 */
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
        this.mapManager = null; // 맵 데이터 관리
        this.gridRenderer = null; // 전투 그리드 렌더링 담당
        this.player = null;
        this.assets = null;

        // 추가될 다른 매니저들...
        this.eventManager = null;
        this.tooltipManager = null;
        this.aspirationManager = null;
        this.formationManager = null;
        this.mercenaryManager = null;
        this.pathfindingManager = null;


        GameContext.instance = this;
    }

    // 초기화 메서드
    initialize(managers) {
        for (const key in managers) {
            if (this.hasOwnProperty(key)) {
                this[key] = managers[key];
            }
        }
    }

    // 다른 곳에서 쉽게 접근할 수 있도록 static getter 제공
    static getInstance() {
        if (!GameContext.instance) {
            GameContext.instance = new GameContext();
        }
        return GameContext.instance;
    }
}

// 싱글턴 인스턴스를 바로 export하여 다른 파일에서 import하여 사용합니다.
export const context = new GameContext();
