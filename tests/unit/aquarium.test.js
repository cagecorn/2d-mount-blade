import { AquariumMapManager } from '../../src/aquariumMap.js';
import { AquariumManager, AquariumInspector } from '../../src/managers/aquariumManager.js';
import { CharacterFactory } from '../../src/factory.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { MonsterManager } from '../../src/managers/monsterManager.js';
import { ItemManager } from '../../src/managers/itemManager.js';
import { VFXManager } from '../../src/managers/vfxManager.js';
import { adjustMonsterStatsForAquarium } from '../../src/utils/aquariumUtils.js';
import { StatManager } from '../../src/stats.js';
import { describe, test, assert } from '../helpers.js';

const assets = { monster:{} };

describe('Aquarium', () => {
    test('Aquarium map loads static layout', () => {
        const m = new AquariumMapManager();
        assert.strictEqual(m.width, 20);
        assert.strictEqual(m.height, 10);
        const obstacleCount = m.countTiles(m.tileTypes.OBSTACLE);
        assert.ok(obstacleCount > 0, 'map should contain obstacles');
    });

    test('Manager adds feature and inspector passes', () => {
        const eventManager = new EventManager();
        const monsterManager = new MonsterManager(0, new AquariumMapManager(), assets, eventManager, new CharacterFactory(assets));
        const itemManager = new ItemManager(0, monsterManager.mapManager, assets);
        const factory = new CharacterFactory(assets);
        const vfx = new VFXManager(eventManager);
        const aquariumManager = new AquariumManager(eventManager, monsterManager, itemManager, monsterManager.mapManager, factory, { create(){return null;} }, vfx, null);
        aquariumManager.addTestingFeature({ type:'monster', image:{} });
        const inspector = new AquariumInspector(aquariumManager);
        assert.ok(inspector.run(), 'inspection fails');
        assert.strictEqual(monsterManager.monsters.length, 1);
    });

    test('Bubble feature spawns emitter', () => {
        const eventManager = new EventManager();
        const monsterManager = new MonsterManager(0, new AquariumMapManager(), assets, eventManager, new CharacterFactory(assets));
        const itemManager = new ItemManager(0, monsterManager.mapManager, assets);
        const factory = new CharacterFactory(assets);
        const vfx = new VFXManager(eventManager);
        const aquariumManager = new AquariumManager(eventManager, monsterManager, itemManager, monsterManager.mapManager, factory, { create(){return null;} }, vfx, null);
        aquariumManager.addTestingFeature({ type: 'bubble' });
        assert.strictEqual(vfx.emitters.length, 1);
    });

    test('Monster stats adjusted for aquarium', () => {
        const base = { strength: 5, endurance: 3 };
        const adjusted = adjustMonsterStatsForAquarium(base);
        const dummy = { hp: 0, mp: 0 };
        const stats = new StatManager(dummy, adjusted);
        assert.strictEqual(stats.get('maxHp'), (10 + base.endurance * 5) * 2);
        assert.ok(Math.abs(stats.get('attackPower')) < 0.001);
    });

    test('Map provides floor starting position', () => {
        const m = new AquariumMapManager();
        const pos = m.getPlayerStartingPosition();
        const tileX = Math.floor(pos.x / m.tileSize);
        const tileY = Math.floor(pos.y / m.tileSize);
        assert.strictEqual(m.map[tileY][tileX], m.tileTypes.FLOOR);
    });
});
