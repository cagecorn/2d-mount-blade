// src/managers/battleManager.js

import { MicroEngine } from '../micro/MicroEngine.js';
import { EventManager } from './eventManager.js';
import { CharacterFactory } from '../factory.js';

export class BattleManager {
    constructor(game, eventManager, groupManager, entityManager, factory) {
        this.game = game;
        const valid = (em) => em && typeof em.subscribe === 'function' && typeof em.publish === 'function';
        if (valid(eventManager)) {
            this.eventManager = eventManager;
        } else if (valid(game?.eventManager)) {
            console.warn('[BattleManager] Provided eventManager is invalid; falling back to game.eventManager');
            this.eventManager = game.eventManager;
        } else {
            console.warn('[BattleManager] Provided eventManager is invalid; using a new instance');
            this.eventManager = new EventManager();
        }
        this.groupManager = groupManager;
        this.entityManager = entityManager;
        this.factory = factory;
        this.battleInstance = null;
        this.lastCombatants = null;

        console.log('[BattleManager] Initialized');

        this.eventManager.subscribe('combat_started', ({ attacker, defender }) => {
            this.prepareAndStartBattle(attacker, defender);
        });
    }

    /**
     * Create an isolated battle unit instance from a world entity.
     * The clone keeps the same id so the result manager can
     * match survivors back to the original world units.
     * @param {Entity} original
     * @returns {Entity}
     */
    createBattleUnitInstance(original) {
        if (!original) return null;

        let type = 'monster';
        if (original.isPlayer) type = 'player';
        else if (original.unitType === 'human' && original.isFriendly) type = 'mercenary';
        else if (original.unitType === 'pet') type = 'pet';

        const savable = original.stats?.getSavableState ? original.stats.getSavableState() : null;
        const baseStats = savable?.baseStats || {};

        const unit = this.factory instanceof CharacterFactory
            ? this.factory.create(type, {
                x: original.x,
                y: original.y,
                tileSize: original.tileSize,
                groupId: original.groupId,
                jobId: original.jobId,
                baseStats
            })
            : { ...original };

        // keep same id for result mapping
        unit.id = original.id;
        unit.hp = original.hp;
        unit.mp = original.mp;
        unit.attackCooldown = original.attackCooldown;
        unit.skillCooldowns = { ...original.skillCooldowns };
        unit.skills = Array.isArray(original.skills) ? [...original.skills] : [];
        unit.effects = Array.isArray(original.effects) ? original.effects.map(e => ({ ...e })) : [];

        unit.equipment = {};
        for (const slot in original.equipment) {
            const item = original.equipment[slot];
            if (!item) { unit.equipment[slot] = null; continue; }
            const battleItem = this.factory.itemFactory?.create(
                item.baseId || item.id,
                item.x,
                item.y,
                item.tileSize || original.tileSize
            );
            if (battleItem) {
                battleItem.durability = item.durability;
                battleItem.cooldownRemaining = item.cooldownRemaining;
                if (item.weaponStats) {
                    battleItem.weaponStats = new battleItem.weaponStats.constructor(item.baseId || item.id);
                    battleItem.weaponStats.level = item.weaponStats.level;
                    battleItem.weaponStats.exp = item.weaponStats.exp;
                    battleItem.weaponStats.expNeeded = item.weaponStats.expNeeded;
                    battleItem.weaponStats.cooldown = item.weaponStats.cooldown;
                    battleItem.weaponStats.skills = [...item.weaponStats.skills];
                }
            }
            unit.equipment[slot] = battleItem;
        }

        if (unit.stats && typeof unit.stats.updateEquipmentStats === 'function') {
            unit.stats.updateEquipmentStats();
        }

        if (typeof unit.assignRoleAI === 'function') {
            unit.assignRoleAI();
            unit.ai = unit.roleAI;
        }

        return unit;
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

        const battleAttackerUnits = attackerGroupMembers.map(u => this.createBattleUnitInstance(u));
        const battleDefenderUnits = defenderGroupMembers.map(u => this.createBattleUnitInstance(u));

        this.battleInstance = new MicroEngine(
            this.game.getBattleCanvasContext(),
            this.game.assets,
            this.eventManager,
            this.factory,
            battleAttackerUnits,
            battleDefenderUnits
        );
        this.battleInstance.start();
    }

    // cleanup battle instance after result processing
    cleanupBattle() {
        if (this.battleInstance) {
            this.battleInstance.stop();
            this.battleInstance = null;
            console.log('[BattleManager] 전투 인스턴스를 정리했습니다.');
        }
        this.lastCombatants = null;
    }

    /* endBattle(result) {
        console.log('[BattleManager] Battle ended. Result:', result);
        if (this.battleInstance) {
            this.battleInstance.stop();
            this.battleInstance = null;
        }
        this.game.showWorldMap();
        this.game.isPaused = false;
        this.lastCombatants = null;
    } */
}
