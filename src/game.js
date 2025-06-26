// src/game.js

import { EventManager } from './managers/eventManager.js';
import { EntityManager } from './managers/entityManager.js';
import { SquadManager } from './managers/squadManager.js';
import { FormationManager } from './managers/formationManager.js';
import { UIManager } from './managers/uiManager.js';
import { Player } from './entities/player.js';
import { Mercenary } from './entities/mercenary.js';

export class Game {
    constructor() {
        this.eventManager = new EventManager();
        this.entityManager = new EntityManager(this.eventManager);
        this.squadManager = new SquadManager(this.entityManager, this.eventManager);
        this.formationManager = new FormationManager(this.eventManager, 5, 5, 64, 'LEFT', 0);
        this.uiManager = new UIManager(this.eventManager, this.entityManager);
        
        console.log("Game and managers initialized.");
    }

    start() {
        console.log("Starting game...");
        this.createInitialEntities();
        this.squadManager.createInitialSquads();

        // 초기 포메이션 상태 발행
        this.eventManager.publish('formation_updated', { formationManager: this.formationManager });
        
        console.log("Game started. Initial data published.");
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
}

// Game initialization is handled externally (e.g., in main.js)
