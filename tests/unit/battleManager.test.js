import { BattleManager } from '../../src/managers/battleManager.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { describe, test, assert } from '../helpers.js';

describe('BattleManager', () => {
    test('uses provided eventManager when valid', () => {
        const game = {};
        const em = new EventManager();
        const bm = new BattleManager(game, em, {}, {}, {});
        assert.strictEqual(bm.eventManager, em);
    });

    test('falls back to game.eventManager when provided eventManager is invalid', () => {
        const game = { eventManager: new EventManager() };
        const bm = new BattleManager(game, null, {}, {}, {});
        assert.strictEqual(bm.eventManager, game.eventManager);
    });

    test('creates new instance when both provided and game eventManager are invalid', () => {
        const game = {};
        const bm = new BattleManager(game, null, {}, {}, {});
        assert.ok(bm.eventManager instanceof EventManager, 'should create its own EventManager');
    });
});
