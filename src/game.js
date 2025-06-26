// src/game.js

// 모든 매니저를 개별적으로, 직접 import합니다.
import { AssetLoader } from './assetLoader.js';
import { Player } from './entities/player.js';
import { context } from './gameContext.js';
// 주요 매니저는 managers/index.js 에서 한 번에 불러옵니다.
import {
    AudioManager,
    CombatManager,
    EntityManager,
    EventManager,
    InputHandler,
    SquadManager,
    TooltipManager,
    TurnManager,
    UIManager,
    MercenaryManager,
    AspirationManager,
    VFXManager,
    ItemManager,
    EffectManager
} from './managers/index.js';
import { MicroWorldWorker } from './micro/MicroWorldWorker.js';

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
        const eventManager = new EventManager();
        const microWorld = new MicroWorldWorker();
        const vfxManager = new VFXManager(eventManager);
        const effectManager = new EffectManager(eventManager, vfxManager);
        const entityManager = new EntityManager();
        const mercenaryManager = new MercenaryManager(eventManager);
        const managers = {
            eventManager,
            microWorld,
            entityManager,
            audioManager: new AudioManager(),
            tooltipManager: new TooltipManager(),
            mercenaryManager,
            squadManager: new SquadManager(eventManager, mercenaryManager),
            turnManager: new TurnManager(),
            combatManager: new CombatManager(),
            inputHandler: new InputHandler(this.canvas), // canvas를 직접 전달
            uiManager: new UIManager(),
            vfxManager,
            effectManager,
            aspirationManager: new AspirationManager(eventManager, microWorld, effectManager, vfxManager, entityManager),
            itemManager: new ItemManager(),
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
        this.managersList = Object.values(managers);
        for (const mgr of this.managersList) {
            if (typeof mgr.init === 'function') {
                mgr.init(this);
            }
        }

        // UIManager가 TooltipManager를 사용하도록 연결
        if (context.uiManager) {
            context.uiManager.tooltipManager = context.tooltipManager;
        }


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
        // 각 매니저의 update 함수를 호출하여 게임 상태를 갱신합니다.
        for (const mgr of this.managersList) {
            if (typeof mgr.update === 'function') {
                // update(deltaTime, context) 형태를 지원하도록 인자 전달
                try {
                    mgr.update(deltaTime, context);
                } catch (e) {
                    console.warn('Manager update failed:', e);
                }
            }
        }

        // TurnManager는 인자가 특별하므로 별도 처리
        if (context.turnManager && typeof context.turnManager.update === 'function') {
            context.turnManager.update(Array.from(context.entityManager.entities.values()), {
                eventManager: context.eventManager,
                player: context.player
            });
        }
    }

    render() {
        // ✨ 누락되었던 핵심 단계 ✨
        // 화면을 그리고, 그 위에 게임 요소들을 렌더링합니다.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 맵, 엔티티, 효과 등 순서대로 렌더링
        for (const mgr of this.managersList) {
            if (typeof mgr.render === 'function') {
                try {
                    mgr.render(this.ctx);
                } catch (e) {
                    console.warn('Manager render failed:', e);
                }
            }
        }

        // UI는 DOM 기반이므로 여기서 렌더링하지 않음
    }
}
