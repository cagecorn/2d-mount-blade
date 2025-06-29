// src/managers/aquariumSpectatorManager.js
import { aquariumSpectatorWorkflow } from '../workflows.js';
import { FormationManager } from './formationManager.js';
import { EnemyFormationManager } from './enemyFormationManager.js';

let nodeFS = null;
if (typeof window === 'undefined') {
    try {
        nodeFS = await import('fs');
    } catch (e) {
        nodeFS = null;
    }
}

export class AquariumSpectatorManager {
    constructor(options) {
        const {
            eventManager,
            mapManager,
            formationManager,
            enemyFormationManager,
            factory,
            entityManager,
            groupManager,
            metaAIManager = null,
            mercenaryManager = null,
            monsterManager = null,
            projectileManager = null,
            vfxManager = null,
            assets = {},
            playerGroupId = 'player_party',
            enemyGroupId = 'dungeon_monsters',
            diaryPath = 'aquarium_spectator_diary.json'
        } = options;
        this.eventManager = eventManager;
        this.mapManager = mapManager;
        this.formationManager = formationManager || new FormationManager(5,5,mapManager.tileSize*2);
        this.enemyFormationManager = enemyFormationManager || new EnemyFormationManager(5,5,mapManager.tileSize*2);
        this.factory = factory;
        this.entityManager = entityManager;
        this.groupManager = groupManager;
        this.mercenaryManager = mercenaryManager;
        this.monsterManager = monsterManager;
        this.metaAIManager = metaAIManager;
        this.projectileManager = projectileManager;
        this.vfxManager = vfxManager;
        this.assets = assets;
        this.playerGroupId = playerGroupId;
        this.enemyGroupId = enemyGroupId;
        this.diaryPath = diaryPath;
        this.battleCount = 0;
        this.diary = [];
        this.currentBattle = null;
        this.fs = nodeFS;
    }

    start() {
        if (this.eventManager) {
            this.eventManager.subscribe('battle_ended', r => this.onBattleEnded(r));
        }
        this.initUI();
        this.startNewBattle();
    }

    initUI() {
        if (typeof document === 'undefined') return;
        this.infoElement = document.getElementById('aquariumSpectatorInfo');
        if (!this.infoElement) {
            this.infoElement = document.createElement('div');
            this.infoElement.id = 'aquariumSpectatorInfo';
            Object.assign(this.infoElement.style, {
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                fontSize: '14px'
            });
            document.body.appendChild(this.infoElement);
        }
        this.updateUI();
    }

    updateUI() {
        if (this.infoElement) {
            this.infoElement.textContent = `Spectator Battle: ${this.battleCount + 1}`;
        }
    }

    startNewBattle() {
        if (this._interval) {
            clearInterval(this._interval);
            this._interval = null;
        }
        this.vfxManager?.clear?.();
        this.projectileManager?.clear?.();
        this.groupManager?.removeGroup(this.playerGroupId);
        this.groupManager?.removeGroup(this.enemyGroupId);
        if (this.entityManager?.entities) {
            for (const id of [...this.entityManager.entities.keys()]) {
                if (id !== this.entityManager.player?.id) {
                    this.entityManager.removeEntityById(id);
                }
            }
        }
        if (this.entityManager) {
            this.entityManager.mercenaries = [];
            this.entityManager.monsters = [];
        }

        const result = aquariumSpectatorWorkflow({
            factory: this.factory,
            mapManager: this.mapManager,
            formationManager: this.formationManager,
            enemyFormationManager: this.enemyFormationManager,
            entityManager: this.entityManager,
            groupManager: this.groupManager,
            metaAIManager: this.metaAIManager,
            assets: this.assets,
            playerGroupId: this.playerGroupId,
            enemyGroupId: this.enemyGroupId,
            eventManager: this.eventManager
        });

        if (this.entityManager) {
            this.entityManager.init(this.entityManager.player, result.playerUnits, result.enemyUnits);
        }
        if (this.mercenaryManager) this.mercenaryManager.mercenaries = result.playerUnits;
        if (this.monsterManager) this.monsterManager.monsters = result.enemyUnits;

        this.currentBattle = result;
        this.updateUI();

        // watch for annihilation since battle_ended may not fire automatically
        if (this._interval) clearInterval(this._interval);
        this._interval = setInterval(() => {
            const playerAlive = (this.currentBattle.playerUnits || []).filter(u => u.hp > 0);
            const enemyAlive = (this.currentBattle.enemyUnits || []).filter(u => u.hp > 0);
            if (playerAlive.length === 0 || enemyAlive.length === 0) {
                clearInterval(this._interval);
                this._interval = null;
                const winner = playerAlive.length > 0 ? 'player' : (enemyAlive.length > 0 ? 'enemy' : 'draw');
                const battleResult = {
                    winner,
                    loser: winner === 'player' ? 'enemy' : (winner === 'enemy' ? 'player' : 'draw'),
                    survivors: { player: playerAlive, enemy: enemyAlive }
                };
                this.eventManager?.publish('battle_ended', battleResult);
            }
        }, 1000);
    }

    onBattleEnded(result) {
        const diff = Math.abs(
            (result.survivors?.player || []).length -
            (result.survivors?.enemy || []).length
        );
        const entry = {
            battleNumber: this.battleCount + 1,
            winner: result.winner,
            difference: diff,
            playerUnits: (this.currentBattle?.playerUnits || []).map(u => ({ id: u.id, jobId: u.jobId })),
            enemyUnits: (this.currentBattle?.enemyUnits || []).map(u => ({ id: u.id, jobId: u.jobId }))
        };
        this.diary.push(entry);
        if (this.fs) {
            try {
                this.fs.writeFileSync(this.diaryPath, JSON.stringify(this.diary, null, 2));
            } catch (e) {
                console.error('[AquariumSpectatorManager] Failed to write diary', e);
            }
        }
        this.battleCount++;
        this.startNewBattle();
    }
}
