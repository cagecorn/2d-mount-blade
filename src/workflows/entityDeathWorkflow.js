import { Item } from '../entities.js';

export class EntityDeathWorkflow {
    constructor(context) {
        this.eventManager = context.eventManager;
        this.vfxManager = context.vfxManager;
        this.itemManager = context.itemManager;
        this.monsterManager = context.monsterManager;
        this.mapManager = context.mapManager;
        this.gameState = context.gameState;
        this.assets = context.assets || {};
        this.findEmptyTile = context.findEmptyTile;
        this.rng = context.rng || Math.random;
    }

    /**
     * Execute death handling for an entity.
     * @param {object} attacker
     * @param {object} victim
     */
    execute(attacker, victim) {
        const { eventManager, vfxManager, itemManager, mapManager, assets,
                monsterManager, gameState } = this;
        if (!victim) return;

        victim.isDying = true;
        if (vfxManager && typeof vfxManager.addDeathAnimation === 'function') {
            vfxManager.addDeathAnimation(victim, 'explode');
        }

        eventManager?.publish('log', { message: `${victim.constructor.name}\uAC00 \uC4F0\uB7EC\uC9C4\uB2E4`, color: 'red' });

        if (victim.unitType === 'monster') {
            eventManager?.publish('monster_defeated', { monster: victim, attacker });
            // drop loot from victim inventory
            const dropPool = [];
            if (Array.isArray(victim.consumables)) dropPool.push(...victim.consumables);
            if (victim.equipment) {
                for (const slot in victim.equipment) {
                    const it = victim.equipment[slot];
                    if (it) dropPool.push(it);
                }
            }
            const dropCount = Math.min(dropPool.length, Math.floor(this.rng() * 6));
            for (let i = 0; i < dropCount; i++) {
                const idx = Math.floor(this.rng() * dropPool.length);
                const item = dropPool.splice(idx, 1)[0];
                const startPos = { x: victim.x, y: victim.y };
                const endPos = this.findEmptyTile ? (this.findEmptyTile(victim.x, victim.y) || startPos) : startPos;
                item.x = endPos.x;
                item.y = endPos.y;
                itemManager?.addItem(item);
                if (vfxManager && typeof vfxManager.addItemPopAnimation === 'function') {
                    vfxManager.addItemPopAnimation(item, startPos, endPos);
                }
            }
        }

        if (!victim.isFriendly && (attacker?.isPlayer || attacker?.isFriendly)) {
            if (attacker.isPlayer) {
                eventManager?.publish('exp_gained', { player: attacker, exp: victim.expValue });
            } else if (attacker.isFriendly) {
                const sharedExp = victim.expValue / 2;
                eventManager?.publish('exp_gained', { player: attacker, exp: sharedExp });
                eventManager?.publish('exp_gained', { player: gameState.player, exp: sharedExp });
            }
        }

        if (victim.unitType === 'monster' && assets.corpse) {
            const corpse = new Item(
                victim.x,
                victim.y,
                mapManager.tileSize,
                'corpse',
                assets.corpse
            );
            corpse.bobbingSpeed = 0;
            corpse.bobbingAmount = 0;
            corpse.baseY = victim.y;
            itemManager?.addItem(corpse);
        }

        if (victim.unitType === 'monster' && monsterManager) {
            const remaining = monsterManager.monsters.filter(m => m.hp > 0 && !m.isDying && m !== victim);
            if (remaining.length === 0) {
                eventManager?.publish('log', { message: 'victory', color: 'green' });
                eventManager?.publish('end_combat', { outcome: 'victory' });
            }
        }
    }
}

