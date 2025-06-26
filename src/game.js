// src/game.js

import * as Managers from './managers/index.js';
import { AssetLoader } from './assetLoader.js';
import { Player } from './entities.js';
import { context } from './gameContext.js'; // 새로 만든 GameContext를 import

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas element not found!');
            return;
        }
        this.ctx = this.canvas.getContext('2d'); // Canvas 기반으로 전환!
        this.lastTime = 0;
        
        console.log('Game object created.');
    }

    async start() {
        console.log('Starting game...');

        // 1. 에셋 로드
        const assetLoader = new AssetLoader();
        const assets = await assetLoader.load();
        context.assets = assets; // 컨텍스트에 저장
        console.log('Assets loaded.');

        // 2. 플레이어 생성
        context.player = new Player({ name: 'Player' });
        console.log('Player created.');

        // 3. 모든 매니저 생성
        const managers = {
            eventManager: new Managers.EventManager(),
            entityManager: new Managers.EntityManager(),
            tooltipManager: new Managers.TooltipManager(),
            squadManager: new Managers.SquadManager(),
            turnManager: new Managers.TurnManager(),
            // combatManager는 추후 구현 예정
            inputHandler: new Managers.InputHandler(this),
            uiManager: new Managers.UIManager(),
            // 아직 없는 매니저들은 주석 처리, 나중에 추가
            // mapManager: new Managers.MapManager(), 
            // gridRenderer: new Managers.GridRenderer(this.ctx),
        };
        
        // 4. GameContext에 모든 매니저 등록 및 초기화
        context.initialize(managers);
        console.log('GameContext initialized with all managers.');
        
        // 5. 게임 루프 시작
        requestAnimationFrame(this.gameLoop.bind(this));
        console.log('Game loop started.');
    }

    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame(this.gameLoop.bind(this));
    }

    update(deltaTime) {
        // 이제 업데이트 로직은 각 매니저가 담당
        // 예: context.combatManager.update(deltaTime);
        // 예: context.entityManager.update(deltaTime);
    }

    render() {
        // 렌더링도 각 담당자가 처리
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 예: context.mapManager.render(this.ctx);
        // 예: context.entityManager.render(this.ctx);
        // 예: context.uiManager.render(this.ctx);
    }
}

// 게임 시작
window.onload = () => {
    const game = new Game('game-canvas'); // HTML에 <canvas id="game-canvas"></canvas>가 있다고 가정
    game.start();
};
