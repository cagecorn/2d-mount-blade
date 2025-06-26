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
import { createGridInventory } from './inventory.js';
import { ITEMS } from './data/items.js';
import { ItemFactory } from './factory.js';

export class Game {
    constructor() {
        this.eventManager = new EventManager();
        this.entityManager = new EntityManager(this.eventManager);
        this.squadManager = new SquadManager(this.entityManager, this.eventManager);
        this.formationManager = new FormationManager(this.eventManager, 5, 5, 64, 'LEFT', 0);
        this.uiManager = new UIManager(this.eventManager, this.entityManager);
        this.soundManager = new SoundManager(this.eventManager);
        this.bgmManager = new BgmManager(this.eventManager);
        this.itemFactory = new ItemFactory({});

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
        player.inventory = createGridInventory(6, 6);
        this.entityManager.addEntity(player);

        const weaponIds = Object.keys(ITEMS).filter(id => ITEMS[id].type === 'weapon');
        for (const wId of weaponIds) {
            const weapon = this.itemFactory.create(wId, 0, 0, 32);
            if (weapon) {
                player.inventory.push(weapon);
                this.entityManager.addEntity(weapon);
            }
        }

        this.eventManager.publish('player_inventory_updated', {
            inventory: player.inventory.toArray().filter(Boolean).map(i => i.id)
        });

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
