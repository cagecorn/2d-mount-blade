// src/game.js

import { EventManager } from './managers/eventManager.js';
import { EntityManager } from './managers/entityManager.js';
import { SquadManager } from './managers/squadManager.js';
import { FormationManager } from './managers/formationManager.js';
import { UIManager } from './managers/uiManager.js';
import { BgmManager } from './managers/bgmManager.js';
import { SoundManager } from './managers/soundManager.js';
import { Player } from './entities/player.js';
import { Mercenary } from './entities/mercenary.js';
import { LayerManager } from './managers/layerManager.js';
import { MapManager } from './map.js';
import { AssetLoader } from './assetLoader.js';
import { GameLoop } from './gameLoop.js';
import { SETTINGS } from '../config/gameSettings.js';

export class Game {
    constructor() {
        this.eventManager = new EventManager();
        this.entityManager = new EntityManager(this.eventManager);
        this.squadManager = new SquadManager(this.entityManager, this.eventManager);
        this.formationManager = new FormationManager(this.eventManager, 5, 5, 64, 'LEFT', 0);
        this.uiManager = new UIManager(this.eventManager, this.entityManager);
        this.soundManager = new SoundManager(this.eventManager);
        this.bgmManager = new BgmManager(this.eventManager);

        this.assetLoader = new AssetLoader();
        this.mapManager = new MapManager();
        this.layerManager = new LayerManager(SETTINGS.ENABLE_WEBGL_RENDERER);
        this.gameLoop = new GameLoop(() => this.update(), () => this.render());

        console.log("Game and managers initialized.");
    }

    start() {
        console.log("Starting game...");
        this._loadAssets(() => {
            this.createInitialEntities();
            this.squadManager.createInitialSquads();

            // 초기 포메이션 상태 발행
            this.eventManager.publish('formation_updated', { formationManager: this.formationManager });

            console.log("Game started. Initial data published.");
            this.gameLoop.start();
        });
    }

    _loadAssets(onReady) {
        this.assetLoader.loadImage('wall', 'assets/wall.png');
        this.assetLoader.loadImage('floor', 'assets/floor.png');
        this.assetLoader.loadImage('player', 'assets/player.png');
        this.assetLoader.loadImage('monster', 'assets/monster.png');
        this.assetLoader.loadImage('world-tile', 'assets/images/world-tile.png');
        this.assetLoader.loadImage('sea-tile', 'assets/images/sea-tile.png');
        this.assetLoader.onReady(onReady);
    }

    update() {
        // Future game logic will go here
    }

    render() {
        const ctxBase = this.layerManager.contexts.mapBase;
        const ctxDecor = this.layerManager.contexts.mapDecor;
        this.layerManager.clear('mapBase');
        this.layerManager.clear('mapDecor');
        this.mapManager.render(
            ctxBase,
            ctxDecor,
            this.assetLoader.assets
        );
    }

    createInitialEntities() {
        // 플레이어 생성
        const player = new Player({ id: 'player', name: 'Player' });
        this.entityManager.addEntity(player);

        // 용병 생성
        for (let i = 1; i <= 5; i++) {
            const merc = new Mercenary({ id: `merc_${i}`, name: `Mercenary ${i}` });
            this.entityManager.addEntity(merc);
        }
        
        // 초기 엔티티 목록 발행
        this.eventManager.publish('entities_updated', { entities: this.entityManager.getAllEntities() });
    }

    startBGM() {
        if (this.bgmManager && !this.bgmManager.isInitialized) {
            this.bgmManager.start();
        }
    }
}

// Game initialization is handled externally (e.g., in main.js)
