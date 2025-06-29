import { ArenaManager } from '../arena/arenaManager.js';
import { FormationManager } from './formationManager.js';
import { AquariumSpectatorManager } from './aquariumSpectatorManager.js';
import { ProjectileManager } from './projectileManager.js';

// Combines Arena combat with Aquarium spectator visuals
export class AmusementParkManager extends ArenaManager {
    constructor(game) {
        super(game);
        this.spectatorManager = null;
        this.infoElement = null;
    }

    start() {
        this.isActive = true;
        if (this.game.gameLoop) this.game.gameLoop.timeScale = 5;
        // keep current map (aquarium) without replacing
        if (this.game.gameState) {
            this.game.gameState.camera = { x: 0, y: 0 };
            this.game.gameState.zoomLevel = 1;
        }
        if (this.game.cameraDrag) {
            this.game.cameraDrag.followPlayer = false;
        }
        if (this.game.pathfindingManager) {
            this.game.pathfindingManager.mapManager = this.game.mapManager;
        }
        if (this.game.motionManager) {
            this.game.motionManager.mapManager = this.game.mapManager;
        }
        if (this.game.movementManager) {
            this.game.movementManager.mapManager = this.game.mapManager;
        }
        this.projectileManager = new ProjectileManager(
            this.game.eventManager,
            this.game.assets,
            this.game.vfxManager,
            this.game.knockbackEngine
        );
        this.game.clearAllUnits();
        if (this.game.uiManager?.hidePanel) {
            this.game.uiManager.hidePanel('squad-management-ui');
        }
        this.spectatorManager = new AquariumSpectatorManager({
            eventManager: this.game.eventManager,
            mapManager: this.game.mapManager,
            formationManager: this.game.formationManager,
            enemyFormationManager: new FormationManager(5,5,this.game.mapManager.tileSize*2),
            factory: this.game.factory,
            entityManager: this.game.entityManager,
            groupManager: this.game.groupManager,
            metaAIManager: this.game.metaAIManager,
            mercenaryManager: this.game.mercenaryManager,
            monsterManager: this.game.monsterManager,
            projectileManager: this.projectileManager,
            vfxManager: this.game.vfxManager,
            assets: this.game.assets,
            playerGroupId: this.game.playerGroup?.id || 'player_party',
            enemyGroupId: this.game.monsterGroup?.id || 'dungeon_monsters'
        });
        this.spectatorManager.initUI();
        this._initSpectatorUI();
        console.log('🎡 놀이동산 전투를 시작합니다!');
        this.game.showArenaMap();
        this.nextRound();
    }

    _initSpectatorUI() {
        if (typeof document === 'undefined') return;
        this.infoElement = document.getElementById('amusement-info');
        if (!this.infoElement) {
            this.infoElement = document.createElement('div');
            this.infoElement.id = 'amusement-info';
            Object.assign(this.infoElement.style, {
                position: 'absolute',
                top: '40px',
                right: '10px',
                padding: '4px 8px',
                background: 'rgba(0,0,0,0.5)',
                color: 'white',
                fontSize: '14px'
            });
            document.body.appendChild(this.infoElement);
        }
        this.updateSpectatorUI(1);
        this.game.eventManager?.subscribe('arena_round_end', d => {
            this.updateSpectatorUI(d.round + 1);
        });
    }

    updateSpectatorUI(round) {
        if (this.infoElement) {
            this.infoElement.textContent = `Amusement Round: ${round}`;
        }
    }

    stop() {
        super.stop();
        if (this.infoElement) {
            this.infoElement.remove();
            this.infoElement = null;
        }
        if (this.spectatorManager && this.spectatorManager._interval) {
            clearInterval(this.spectatorManager._interval);
        }
        this.spectatorManager = null;
    }
}
