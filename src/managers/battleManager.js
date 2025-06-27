// src/managers/battleManager.js

import { MicroEngine } from '../micro/MicroEngine.js';

export class BattleManager {
    constructor(game, eventManager, groupManager, entityManager, factory) {
        this.game = game;
        this.eventManager = eventManager;
        this.groupManager = groupManager;
        this.entityManager = entityManager;
        this.factory = factory;
        this.battleInstance = null;
        this.lastCombatants = null;

        console.log('[BattleManager] Initialized');

        this.eventManager.subscribe('combat_started', ({ attacker, defender }) => {
            this.prepareAndStartBattle(attacker, defender);
        });

        this.eventManager.subscribe('battle_ended', (result) => {
            this.endBattle(result);
        });
    }

    prepareAndStartBattle(attacker, defender) {
        console.log(`[BattleManager] Combat event received between ${attacker.id} and ${defender.id}`);
        this.game.isPaused = true;

        const attackerGroupMembers = this.groupManager.getGroupMembers(attacker.groupId);
        const defenderGroupMembers = this.groupManager.getGroupMembers(defender.groupId);

        if (!attackerGroupMembers || !defenderGroupMembers) {
            console.error('[BattleManager] One or both combatants do not have a valid group.');
            this.game.isPaused = false;
            return;
        }

        this.lastCombatants = { attacker, defender };

        this.game.showBattleMap();

        this.battleInstance = new MicroEngine(
            this.game.getBattleCanvasContext(),
            this.game.assets,
            this.eventManager,
            this.factory,
            attackerGroupMembers,
            defenderGroupMembers
        );
        this.battleInstance.start();
    }

    endBattle(result) {
        console.log('[BattleManager] Battle ended. Result:', result);

        if (this.battleInstance) {
            this.battleInstance.stop();
            this.battleInstance = null;
        }

        // 전투 결과 처리는 BattleResultManager가 담당한다

        this.game.showWorldMap();
        this.game.isPaused = false;
        this.lastCombatants = null;
    }
}
