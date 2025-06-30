import { aquariumStageSetupWorkflow } from '../../src/workflows.js';
import { describe, test, assert } from '../helpers.js';

class StubGame {
    constructor() { this.loaded = null; }
    loadMap(id) { this.loaded = id; }
}

class StubAquariumManager {
    constructor() { this.groups = 0; this.bubbles = 0; }
    spawnMonsterGroup() { this.groups++; }
    addTestingFeature(feature) { if (feature.type === 'bubble') this.bubbles++; }
}

describe('Workflows', () => {
    test('aquariumStageSetupWorkflow resets map and spawns features', () => {
        const game = new StubGame();
        const manager = new StubAquariumManager();
        aquariumStageSetupWorkflow({ game, aquariumManager: manager, eventManager: { publish(){} } });
        assert.strictEqual(game.loaded, 'aquarium');
        assert.ok(manager.groups >= 1, 'should spawn at least one monster group');
    });
});

