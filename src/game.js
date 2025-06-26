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

        // 2. 핵심 관리자 우선 생성 및 등록
        const eventManager = new EventManager();
        const entityManager = new EntityManager();
        context.initialize({ eventManager, entityManager });
        console.log("Core managers initialized.");

        // 스탯 변경 이벤트가 발생하면 즉시 재계산
        eventManager.subscribe('stats_changed', ({ entity }) => {
            if (entity?.stats && typeof entity.stats.recalculate === 'function') {
                entity.stats.recalculate();
            }
        });

        // 3. 플레이어 생성 및 등록
        const player = new Player({ x: 0, y: 0, tileSize: 32, groupId: 'player_party' });
        context.player = player;
        context.entityManager.addEntity(player);
        console.log("Player created and registered.");

        // 4. 나머지 관리자들 생성 및 등록
        const microWorld = new MicroWorldWorker();
        const vfxManager = new VFXManager(eventManager);
        const effectManager = new EffectManager(eventManager, vfxManager);
        const mercenaryManager = new MercenaryManager(eventManager);
        const managers = {
            microWorld,
            vfxManager,
            effectManager,
            audioManager: new AudioManager(),
            tooltipManager: new TooltipManager(),
            mercenaryManager,
            squadManager: new SquadManager(eventManager, mercenaryManager),
            turnManager: new TurnManager(),
            combatManager: new CombatManager(),
            inputHandler: new InputHandler(this),
            uiManager: new UIManager(),
            aspirationManager: new AspirationManager(eventManager, microWorld, effectManager, vfxManager, entityManager),
            itemManager: new ItemManager(),
        };
        context.initialize(managers);
        console.log("Remaining managers created.");

        // 5. 모든 관리자 초기화
        this.managersList = Object.values(context);
        for (const mgr of this.managersList) {
            if (mgr && typeof mgr.init === 'function') {
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
        // 1. 입력 처리
        context.inputHandler?.update?.(deltaTime);

        // 2. 엔티티 기본 상태 업데이트
        context.entityManager?.update?.(deltaTime, context);

        // 3. 턴 기반 로직
        if (context.turnManager) {
            context.turnManager.update(
                Array.from(context.entityManager.entities.values()),
                { eventManager: context.eventManager, player: context.player }
            );
        }

        // 4. AI 업데이트
        context.metaAIManager?.update?.(context);

        // 5. 전투 및 투사체
        context.combatManager?.update?.(deltaTime, context);
        context.projectileManager?.update?.(Array.from(context.entityManager.entities.values()));

        // 6. 효과 및 시각 효과
        context.effectManager?.update?.(deltaTime, context);
        context.vfxManager?.update?.(deltaTime);

        // 7. UI 업데이트
        context.uiManager?.update?.(this);
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
