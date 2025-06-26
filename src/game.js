// src/game.js

import * as Managers from './managers/index.js';
import { AssetLoader } from './assetLoader.js';
import { Player } from './entities/player.js';
import { context } from './gameContext.js';
import { InputHandler } from './inputHandler.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            // 이 오류는 이제 main.js에서 처리되지만 안전장치로 둡니다.
            throw new Error('Canvas element not found!');
        }
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
    }

    async init() {
        console.log("Initializing game...");

        // 1. 에셋 로드 (메서드 이름 수정: load -> loadAssets)
        const assetLoader = new AssetLoader();
        context.assets = await assetLoader.loadAssets();
        console.log("Assets loaded.");

        // 2. 플레이어 생성
        context.player = new Player("Player", null);
        console.log("Player created.");

        // 3. 모든 매니저 생성
        const managers = {
            eventManager: new Managers.EventManager(),
            entityManager: new Managers.EntityManager(),
            audioManager: new Managers.AudioManager(), // 새로 추가
            tooltipManager: new Managers.TooltipManager(),
            squadManager: new Managers.SquadManager(),
            turnManager: new Managers.TurnManager(),
            inputHandler: new InputHandler(this),
            uiManager: new Managers.UIManager(),
        };

        // 4. GameContext에 등록 및 초기화
        context.initialize(managers);
        console.log("GameContext initialized.");

        // 오디오 매니저 초기화
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

    update(deltaTime) {
        // 향후 각 매니저의 update 호출
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 향후 각 렌더러의 render 호출
    }
}
