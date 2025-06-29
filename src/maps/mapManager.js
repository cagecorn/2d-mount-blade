// ArenaEngine \uc0ac\uc6a9\uc744 \uc704\ud574 ArenaManager \uc778\ud130\ud398\uc774\uc2a4\ub97c \uc81c\uac70\ud569\ub2c8\uB2E4.
import { FishManager } from '../fish/fishManager.js';
import { BattleLog } from '../systems/battleLog.js';

export class MapManager {
    constructor(game) {
        this.game = game;
        this.maps = {
            'arena': { name: '아레나', key: 'arena', width: 1000, height: 600, tilemap: 'assets/maps/arena.json' },
            'aquarium': { name: '수족관', key: 'aquarium', width: 1200, height: 800, tilemap: 'assets/maps/aquarium.json' },
        };
        this.currentMapKey = null;
    }

    async loadMap(mapKey) {
        if (!this.maps[mapKey]) {
            console.error(`맵을 찾을 수 없습니다: ${mapKey}`);
            return;
        }

        console.log("이전 맵의 시스템을 정리합니다.");
        if (this.game.battleLog) {
            this.game.battleLog.destroy();
            this.game.battleLog = null;
        }
        if (this.game.arenaEngine && this.game.arenaEngine.isActive) {
            this.game.arenaEngine.stop();
        }
        if (this.game.fishManager) {
            this.game.fishManager.stop();
            this.game.fishManager = null;
        }

        this.currentMapKey = mapKey;
        const mapConfig = this.maps[mapKey];

        await this.game.assetManager.loadTilemap(mapKey, mapConfig.tilemap);
        this.game.world.setWorldSize(mapConfig.width, mapConfig.height);
        this.game.tilemapManager.createMap(mapKey);

        if (this.game.systemManager) {
            this.game.systemManager.clearSystems();
        }

        this.game.clearAllUnits();

        if (mapKey === 'arena') {
            // ArenaEngine\uc744 \uc2dc\uc791\ud569\ub2c8\ub2e4.
            this.game.arenaEngine.start();
        } else if (mapKey === 'aquarium') {
            this.setupAquariumSystems();
            this.game.gameState.currentState = 'WORLD';
        }

        if (this.game.eventManager) {
            this.game.eventManager.publish('map_loaded', { mapKey: mapKey });
        }

        console.log(`${mapConfig.name} 맵 로드 완료.`);
    }

    setupArenaSystems() {
        // \uc774 \ud568\uc218\uc758 \ub0b4\uc6a9\uc740 loadMap \ub0b4\ub85c \ud569\uce58\ub418\uc5c8\uc73c\ubbc0\ub85c \ubd88\uc73c\uc2dc\uc9c0 \uc54a\uc74c\ub2e4.
    }

    setupAquariumSystems() {
        console.log("수족관 시스템 설정 중...");
        this.game.fishManager = new FishManager(this.game, this.game.world.width, this.game.world.height);
        this.game.battleLog = new BattleLog(this.game.eventManager);
        this.game.fishManager.start();
    }
}
