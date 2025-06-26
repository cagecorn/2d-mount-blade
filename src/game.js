// src/game.js

// \u수정: 모든 매니저를 개별적으로, 직접 import합니다. 이것이 가장 안정적입니다.
import { AssetLoader } from './assetLoader.js';
import { Player } from './entities/player.js';
import { context } from './gameContext.js';
import { AudioManager } from './managers/audioManager.js';
import { CombatManager } from './managers/combatManager.js';
import { EntityManager } from './managers/entityManager.js';
import { EventManager } from './managers/eventManager.js';
import { InputHandler } from './managers/inputHandler.js';
import { SquadManager } from './managers/squadManager.js';
import { MercenaryManager } from './managers/mercenaryManager.js';
import { TooltipManager } from './managers/tooltipManager.js';
import { TurnManager } from './managers/turnManager.js';
import { UIManager } from './managers/uiManager.js';

export class Game {
    constructor(canvasId = 'entity-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element not found: ${canvasId}`);
        }
        this.ctx = this.canvas.getContext('2d');
        this.camera = {
            zoomIn() {},
            zoomOut() {}
        };
        this.lastTime = 0;
    }

    async init() {
        console.log("Initializing game...");

        // 1. \u에\u셋 로드
        const assetLoader = new AssetLoader();
        context.assets = await assetLoader.loadAssets();
        console.log("Assets loaded.");

        // 2. 플레이어 생성
        context.player = new Player("Player", null);
        console.log("Player created.");

        // 3. 모든 매니저 생성 (수정: 직접 참조)
        const eventManager = new EventManager();
        const mercenaryManager = new MercenaryManager(eventManager);
        const managers = {
            eventManager,
            mercenaryManager,
            entityManager: new EntityManager(),
            audioManager: new AudioManager(),
            tooltipManager: new TooltipManager(),
            squadManager: new SquadManager(eventManager, mercenaryManager),
            turnManager: new TurnManager(),
            combatManager: new CombatManager(),
            inputHandler: new InputHandler(this),
            uiManager: new UIManager(),
        };
        
        // 4. GameContext에 등록 및 초기화
        context.initialize(managers);
        Object.assign(this, managers);
        console.log("GameContext initialized.");
        
        context.audioManager.init();
        
        // 5. 게임 루프 시작
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

    update(deltaTime) {}

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    getPartyMembers() {
        const members = [];
        if (context.player) members.push(context.player);
        if (context.entityManager) {
            members.push(...context.entityManager.mercenaries);
        }
        return members;
    }
}
