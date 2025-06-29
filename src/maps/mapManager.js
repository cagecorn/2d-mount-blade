import { ArenaManager } from '../arena/arenaManager.js';
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
        // ArenaManager가 존재하면 비활성화하고 제거
        if (this.game.arenaManager) {
            this.game.arenaManager.stop();
            this.game.arenaManager = null;
            console.log('ArenaManager가 정리되었습니다.');
        }
        // BattleLog가 존재하면 파괴하고 제거
        if (this.game.battleLog) {
            this.game.battleLog.destroy();
            this.game.battleLog = null;
            console.log('BattleLog가 정리되었습니다.');
        }
        // FishManager가 존재하면 중지하고 제거
        if (this.game.fishManager) {
            this.game.fishManager.stop();
            this.game.fishManager = null;
            console.log('FishManager가 정리되었습니다.');
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
            this.setupArenaSystems();
            // 아레나 매니저가 스스로 게임 상태를 변경하고 시작하므로 여기서 start()를 호출합니다.
            if (this.game.arenaManager) this.game.arenaManager.start();
        } else if (mapKey === 'aquarium') {
            this.setupAquariumSystems();
            this.game.gameState.currentState = 'WORLD'; // 수족관은 월드 상태로 간주
        }

        if (this.game.eventManager) {
            this.game.eventManager.publish('map_loaded', { mapKey: mapKey });
        }

        console.log(`${mapConfig.name} 맵 로드 완료.`);
    }

    setupArenaSystems() {
        console.log("아레나 시스템 설정 중...");
        if (!this.game.arenaManager) {
            this.game.arenaManager = new ArenaManager(this.game);
        }
        if (this.game.arenaTensorFlowManager) {
            console.log('Arena TensorFlow Manager가 이미 활성화되어 있습니다.');
        } else {
            // 필요하다면 여기서 생성
        }
    }

    setupAquariumSystems() {
        console.log("수족관 시스템 설정 중...");
        this.game.fishManager = new FishManager(this.game, this.game.world.width, this.game.world.height);
        this.game.battleLog = new BattleLog(this.game.eventManager);
        this.game.fishManager.start();
    }
}
