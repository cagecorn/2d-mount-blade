import { describe, test, assert } from '../helpers.js';
import { TargetingEngine } from '../../src/workers/ai/TargetingEngine.js';

describe('TargetingEngine', () => {
    test('returns null when no enemies', () => {
        const engine = new TargetingEngine();
        const actor = { team: 1, pos: { x: 0, y: 0 } };
        const allUnits = [actor];
        const result = engine.findBestTarget(actor, allUnits);
        assert.strictEqual(result, null);
    });

    test('returns closest enemy id', () => {
        const engine = new TargetingEngine();
        const actor = { id: 'a', team: 1, pos: { x: 0, y: 0 } };
        const enemy1 = { id: 'e1', team: 2, pos: { x: 5, y: 0 } };
        const enemy2 = { id: 'e2', team: 2, pos: { x: 2, y: 0 } };
        const allUnits = [actor, enemy1, enemy2];
        const result = engine.findBestTarget(actor, allUnits);
        assert.strictEqual(result, 'e2');
    });
});
