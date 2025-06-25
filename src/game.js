import { Entity } from './entity.js';
import { MeleeAI, RangedAI } from './simpleAi.js';
import { MetaAIManager, STRATEGY } from './metaAi.js';
import { FormationManager } from './managers/formationManager.js';
import { eventManager } from './managers/eventManager.js';
import { squadManager } from './managers/squadManager.js';
import { uiManager } from './managers/uiManager.js';

const TILE_SIZE = 64;

class Game {
    constructor(canvas = document.getElementById('gameCanvas')) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.entities = {};
        this.player = null;
        this.metaAIManager = new MetaAIManager();
        this.state = 'IDLE';
        this.playerFormationManager = new FormationManager(5, 5, TILE_SIZE);
        this.enemyFormationManager = new FormationManager(5, 5, TILE_SIZE);
    }

    setState(newState) {
        if (this.state === newState) return;
        this.state = newState;
        console.log(`Game state changed to: ${newState}`);
        eventManager.publish('game_state_changed', newState);
    }

    start() {
        this.initPlayer();
        this.initMercenaries();
        this.initEnemySquads();

        squadManager.createSquad('A분대');
        squadManager.createSquad('B분대');
        squadManager.createSquad('C분대');

        const friendlyEntities = Object.values(this.entities).filter(e => e.faction === 'player');
        uiManager.createSquadManagementUI(friendlyEntities, squadManager.getSquads());
        uiManager.createFormationGridUI(squadManager.getSquads());

        this.setState('FORMATION_SETUP');

        const startButton = document.createElement('button');
        startButton.textContent = '전투 시작!';
        startButton.onclick = () => {
            if (this.state === 'FORMATION_SETUP') {
                this.setState('COMBAT');
                this.placeUnitsForCombat();
                startButton.style.display = 'none';
            }
        };
        document.body.appendChild(startButton);

        this.gameLoop();
    }

    placeUnitsForCombat() {
        console.log('Placing units for combat...');
        this.playerFormationManager.apply({ x: 100, y: 300 }, this.entities, squadManager);
        this.enemyFormationManager.apply({ x: 800, y: 300 }, this.entities, squadManager);
    }

    initPlayer() {
        this.player = new Entity(100, 300, 20, 'player', 'Player', 'player', 100, 1);
        this.entities[this.player.id] = this.player;
    }

    initMercenaries() {
        for (let i = 0; i < 10; i++) {
            const mercenary = new Entity(0, 0, 20, `mercenary_${i}`, `용병 ${i}`, 'player', 80, 1);
            this.entities[mercenary.id] = mercenary;
        }
    }

    initEnemySquads() {
        const enemySquad = squadManager.createSquad('적 1분대');
        const enemyGroup = this.metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE, this.player);

        for (let i = 0; i < 20; i++) {
            const monster = new Entity(0, 0, 20, `monster_${i}`, 'Monster', 'enemy', 50, 1);
            monster.ai = new MeleeAI(monster, [this.player]);
            this.entities[monster.id] = monster;
            squadManager.handleAssignMember({ entityId: monster.id, squadId: enemySquad.id });
            enemyGroup.members.push(monster);
        }

        this.enemyFormationManager.handleAssignSquad({ squadId: enemySquad.id, slotIndex: 12 });
    }

    update(dt) {
        if (this.state !== 'COMBAT') return;
        Object.values(this.entities).forEach(ent => ent.update(dt));
        this.metaAIManager.update(dt);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        Object.values(this.entities).forEach(ent => ent.draw(this.ctx));
    }

    gameLoop() {
        let lastTime = 0;
        const animate = (timestamp) => {
            const dt = (timestamp - lastTime) / 1000;
            lastTime = timestamp;
            this.update(dt);
            this.draw();
            requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }
}

