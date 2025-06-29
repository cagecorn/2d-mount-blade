// src/workflows.js
import { JOBS } from './data/jobs.js';

// === 몬스터 사망 워크플로우 ('코드 1') ===
export function monsterDeathWorkflow(context) {
    const { eventManager, victim, attacker } = context;

    // 1. "몬스터 사망!" 이벤트를 방송한다.
    eventManager.publish('entity_death', { victim, attacker });

    // 2. "경험치 획득!" 이벤트를 방송한다.
    if (!victim.isFriendly && (attacker.isPlayer || attacker.isFriendly)) {
        const exp = victim.expValue;

        // 실제 경험치를 즉시 적용하여 테스트에서도 검증 가능하도록 한다.
        if (attacker.stats && typeof attacker.stats.addExp === 'function') {
            attacker.stats.addExp(exp);
        }

        eventManager.publish('exp_gained', { player: attacker, exp });
    }
    
    // 3. (미래를 위한 구멍) "아이템 드랍!" 이벤트를 방송한다.
    eventManager.publish('drop_loot', { position: { x: victim.x, y: victim.y }, monsterType: victim.constructor.name });
    
    // 4. 사망한 몬스터를 모든 매니저에서 확실하게 제거한다.
    eventManager.publish('entity_removed', { victimId: victim.id });
}

// === 무기 무장해제 워크플로우 ===
export function disarmWorkflow(context) {
    const {
        eventManager,
        owner,
        weapon,
        itemManager,
        equipmentManager,
        vfxManager,
        attacker,
        target
    } = context;

    if (equipmentManager && typeof equipmentManager.unequip === 'function') {
        equipmentManager.unequip(owner, 'weapon');
    }

    const angle = Math.random() * Math.PI * 2;
    const distance = 100 + Math.random() * 50;
    const endX = owner.x + Math.cos(angle) * distance;
    const endY = owner.y + Math.sin(angle) * distance;

    weapon.x = endX;
    weapon.y = endY;

    if (vfxManager) {
        vfxManager.addEjectAnimation(weapon, { x: owner.x, y: owner.y }, angle, distance);
    } else {
        itemManager.addItem(weapon);
    }

    setTimeout(() => {
        if (itemManager) itemManager.addItem(weapon);
    }, 350);

    eventManager.publish('log', {
        message: `💥 ${owner.constructor.name}의 ${weapon.name}(이)가 튕겨나갔습니다!`,
        color: 'orange'
    });

    // MicroCombatManager already fired the 'weapon_disarmed' event when the
    // durability check failed. Re-emitting the same event here caused a second
    // workflow execution with missing context. Simply perform the visuals and
    // log without publishing the event again.
}

// === 방어구 파괴 워크플로우 ===
export function armorBreakWorkflow(context) {
    const {
        eventManager,
        owner,
        armor,
        equipmentManager,
        vfxManager,
        attacker,
        target
    } = context;

    if (equipmentManager && typeof equipmentManager.unequip === 'function') {
        equipmentManager.unequip(owner, 'armor');
    }

    if (vfxManager) {
        vfxManager.addArmorBreakAnimation(armor, owner);
    }

    eventManager.publish('log', {
        message: `🛡️ ${owner.constructor.name}의 ${armor.name}(이)가 파괴되었습니다!`,
        color: 'red'
    });

    // MicroCombatManager already emitted 'armor_broken' when the armor's
    // durability reached zero. Emitting it again here triggered a recursive
    // workflow with incomplete data, so avoid re-publishing the event.
}

// === 수족관 관람 워크플로우 ===
// 12명씩 양 진영을 무작위 용병으로 채우고 임의의 위치에 배치한다
export function aquariumSpectatorWorkflow(context) {
    const {
        factory,
        mapManager,
        formationManager,
        enemyFormationManager,
        entityManager,
        groupManager,
        metaAIManager,
        assets = {},
        playerGroupId = 'player_party',
        enemyGroupId = 'dungeon_monsters',
        eventManager
    } = context;

    const jobKeys = Object.keys(JOBS);

    const makeMerc = (groupId) => {
        const jobId = jobKeys[Math.floor(Math.random() * jobKeys.length)];
        const pos = mapManager.getRandomFloorPosition() || { x: 0, y: 0 };
        const merc = factory.create('mercenary', {
            x: pos.x,
            y: pos.y,
            tileSize: mapManager.tileSize,
            groupId,
            jobId,
            image: assets[jobId] || assets.mercenary
        });
        entityManager?.addEntity(merc);
        groupManager?.addMember(merc);
        if (metaAIManager) {
            const group = metaAIManager.groups[groupId] || metaAIManager.createGroup(groupId);
            group.addMember(merc);
        }
        return merc;
    };

    const playerUnits = Array.from({ length: 12 }, () => makeMerc(playerGroupId));
    const enemyUnits = Array.from({ length: 12 }, () => makeMerc(enemyGroupId));
    if (entityManager?.mercenaries) entityManager.mercenaries.push(...enemyUnits);

    const allMap = {};
    [...playerUnits, ...enemyUnits].forEach(m => { allMap[m.id] = m; });

    playerUnits.forEach(u => {
        const slot = Math.floor(Math.random() * formationManager.slots.length);
        formationManager.assign(slot, u.id);
    });
    enemyUnits.forEach(u => {
        const slot = Math.floor(Math.random() * enemyFormationManager.slots.length);
        enemyFormationManager.assign(slot, u.id);
    });

    const friendlyOrigin = mapManager.getPlayerStartingPosition();
    const enemyOrigin = {
        x: (mapManager.width - 4) * mapManager.tileSize,
        y: (mapManager.height / 2) * mapManager.tileSize
    };
    formationManager.apply(friendlyOrigin, allMap);
    enemyFormationManager.apply(enemyOrigin, allMap);

    eventManager?.publish('aquarium_spectator_ready', { playerUnits, enemyUnits });
    return { playerUnits, enemyUnits };
}
