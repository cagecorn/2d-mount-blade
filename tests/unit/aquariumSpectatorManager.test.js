import { AquariumSpectatorManager } from '../../src/managers/aquariumSpectatorManager.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { GroupManager } from '../../src/managers/groupManager.js';
import { FormationManager } from '../../src/managers/formationManager.js';
import { EnemyFormationManager } from '../../src/managers/enemyFormationManager.js';
import { describe, test, assert } from '../helpers.js';

class StubFactory {
    constructor() { this.count = 0; }
    create(type, cfg) {
        return { id: `u${this.count++}`, jobId: cfg.jobId, groupId: cfg.groupId, x: cfg.x, y: cfg.y, tileSize: cfg.tileSize, hp: 10 };
    }
}
class StubMap {
    constructor(){ this.tileSize = 1; this.width = 10; this.height = 10; }
    getRandomFloorPosition(){ return { x:0, y:0 }; }
    getPlayerStartingPosition(){ return { x:0, y:0 }; }
}

describe('AquariumSpectatorManager', () => {
    test('records battle count on battle end', () => {
        const em = new EventManager();
        const gm = new GroupManager(em);
        const map = new StubMap();
        const f = new FormationManager();
        const ef = new EnemyFormationManager();
        const factory = new StubFactory();
        const entityManager = { entities: new Map(), removeEntityById(){}, init(){} };
        const fakeGame = { loadMap(){ /* noop */ } };
        const manager = new AquariumSpectatorManager({
            game: fakeGame,
            eventManager: em,
            mapManager: map,
            formationManager: f,
            enemyFormationManager: ef,
            factory,
            entityManager,
            groupManager: gm
        });
        manager.start();
        em.publish('battle_ended', { winner: 'player', survivors: { player: [], enemy: [] }});
        assert.strictEqual(manager.battleCount, 1);
        assert.strictEqual(manager.diary.length, 1);
    });
});
