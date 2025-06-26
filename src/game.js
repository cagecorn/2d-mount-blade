// src/game.js

// 모든 매니저를 개별적으로, 직접 import합니다.
import { AssetLoader } from './assetLoader.js';
import { Player } from './entities/player.js';
import { context } from './gameContext.js';
import { AudioManager } from './managers/audioManager.js';
import { CombatManager } from './managers/combatManager.js';
import { EntityManager } from './managers/entityManager.js';
import { EventManager } from './managers/eventManager.js';
import { InputHandler } from './managers/inputHandler.js';
import { SquadManager } from './managers/squadManager.js';
import { TooltipManager } from './managers/tooltipManager.js';
import { TurnManager } from './managers/turnManager.js';
import { UIManager } from './managers/uiManager.js';
import { MercenaryManager } from './managers/mercenaryManager.js';
import { AspirationManager } from './managers/aspirationManager.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error('Canvas element not found!');
        }
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
    }

    async init() {
        console.log("Initializing game...");

        // 1. 에셋 로드
        const assetLoader = new AssetLoader();
        context.assets = await assetLoader.loadAssets();
        console.log("Assets loaded.");

        // 2. 모든 매니저 생성
        const managers = {
            eventManager: new EventManager(),
            entityManager: new EntityManager(),
            audioManager: new AudioManager(),
            tooltipManager: new TooltipManager(),
            squadManager: new SquadManager(),
            turnManager: new TurnManager(),
            combatManager: new CombatManager(),
            inputHandler: new InputHandler(this.canvas), // canvas를 직접 전달
            uiManager: new UIManager(),
            mercenaryManager: new MercenaryManager(),
            aspirationManager: new AspirationManager(),
        };
        
        // 3. GameContext에 등록
        context.initialize(managers);
        console.log("GameContext initialized.");
        
        // 4. 플레이어 생성 및 등록
        // 이제 EventManager가 context에 있으므로 안전하게 전달 가능
        context.player = new Player("Player", context.eventManager);
        context.entityManager.addEntity(context.player); // 엔티티 매니저에도 플레이어 등록
        console.log("Player created and registered.");

        // 5. 각 매니저 초기화 - ✨ 누락되었던 핵심 단계 ✨
        // 매니저들이 다른 매니저에 접근할 수 있도록 context를 주입합니다.
        context.audioManager.init();
        context.entityManager.init();
        context.combatManager.init();
        context.uiManager.init(this); // UIManager는 game 객체를 필요로 할 수 있음
        context.mercenaryManager.init();
        context.aspirationManager.init();
        
        // UIManager가 TooltipManager를 사용하도록 연결
        context.uiManager.tooltipManager = context.tooltipManager;


        console.log("All managers initialized.");

        // 6. 게임 루프 시작
        requestAnimationFrame(this.gameLoop.bind(this));
        console.log("Game loop started.");
    }

    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // ✨ 누락되었던 핵심 단계 ✨
        // 매니저들의 업데이트 함수를 호출하여 게임 상태를 갱신합니다.
        context.entityManager.update(deltaTime);
        context.combatManager.update(deltaTime);
        // 필요에 따라 다른 매니저의 update도 호출
    }

    render() {
        // ✨ 누락되었던 핵심 단계 ✨
        // 화면을 그리고, 그 위에 게임 요소들을 렌더링합니다.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 예시: 맵 렌더링 (구현 시 추가)
        // context.mapManager.render(this.ctx);

        // 엔티티(캐릭터, 적 등) 렌더링
        context.entityManager.render(this.ctx);

        // UI는 DOM 기반이므로 여기서 렌더링하지 않음
    }
}
