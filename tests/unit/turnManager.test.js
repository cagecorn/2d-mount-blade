import { TurnManager } from '../../src/managers/turnManager.js';
import { context } from '../../src/gameContext.js';
import { describe, test, assert } from '../helpers.js';

describe('TurnManager', () => {

    test('setupTurnOrder sorts by weight and agility', () => {
        const units = [
            { id: 1, name: 'A', isPlayerControlled: true, getTotalWeight: () => 10, stats: { agility: 5 } },
            { id: 2, name: 'B', isPlayerControlled: true, getTotalWeight: () => 5, stats: { agility: 8 } },
            { id: 3, name: 'C', isPlayerControlled: true, getTotalWeight: () => 5, stats: { agility: 4 } }
        ];

        context.entityManager = { getEntityById: id => units.find(u => u.id === id) };
        context.eventManager = { publish: () => {} };
        context.uiManager = { enablePlayerInput: () => {} };

        const turnManager = new TurnManager();
        turnManager.setupTurnOrder(units);

        assert.deepStrictEqual(turnManager.turnOrder, [2, 3, 1]);
    });

    test('nextTurn cycles to next unit', () => {
        const units = [
            { id: 1, name: 'A', isPlayerControlled: true, getTotalWeight: () => 1, stats: { agility: 5 } },
            { id: 2, name: 'B', isPlayerControlled: true, getTotalWeight: () => 2, stats: { agility: 6 } }
        ];
        context.entityManager = { getEntityById: id => units.find(u => u.id === id) };
        context.eventManager = { publish: () => {} };
        context.uiManager = { enablePlayerInput: () => {} };

        const turnManager = new TurnManager();
        turnManager.setupTurnOrder(units);
        const first = turnManager.turnOrder[turnManager.currentTurnIndex];
        turnManager.nextTurn();
        const second = turnManager.turnOrder[turnManager.currentTurnIndex];
        assert.notStrictEqual(first, second);
    });

});
