import { EventManager } from '../../src/managers/eventManager.js';
import DataRecorder from '../../src/managers/dataRecorder.js';
import { describe, test, assert } from '../helpers.js';

function createMockGame() {
    const eventManager = new EventManager();
    const mockMbti = {
        buildInput: () => ({ arraySync: () => [[0, 0, 0, 0, 0]] })
    };
    return {
        eventManager,
        metaAIManager: { mbtiEngine: mockMbti }
    };
}

describe('DataRecorder', () => {
    test('records player actions', async () => {
        const game = createMockGame();
        const recorder = new DataRecorder(game);
        await recorder.init();
        const action = { type: 'attack' };
        const entity = { hp: 10, maxHp: 10 };
        game.eventManager.publish('player_action_recorded', { entity, action });
        assert.strictEqual(recorder.data.length, 1);
        assert.deepStrictEqual(recorder.data[0].output, [1,0,0,0,0,0,0]);
    });

    test('records match result with fluctuations', () => {
        const game = createMockGame();
        const recorder = new DataRecorder(game);
        recorder.fluctuationEngine = { getLog: () => [{ timestamp: 1 }] };
        const result = recorder.recordMatchResult({ matchId: 'm1', winner: 'A', matchDuration: 10 });
        assert.strictEqual(result.fluctuations.length, 1);
        assert.strictEqual(recorder.matchResults.length, 1);
    });
});
