// src/managers/CombatCalculator.js

/**
 * 행동의 결과를 받아 실제 데미지, 힐 등을 계산하고 적용하는 전문가
 */
export class CombatCalculator {
    constructor(eventManager) {
        this.eventManager = eventManager;

        // 'execute_action_effect' 이벤트를 구독하여 계산을 수행하도록 설정
        this.eventManager.subscribe('execute_action_effect', (data) => this.handleAction(data));
        
        console.log('[CombatCalculator] Initialized: 전투 계산 준비 완료.');
    }

    /**
     * 행동 계획에 따라 실제 효과를 계산하고 적용합니다.
     * @param {object} data - { actionPlan, unitMap }
     */
    handleAction({ actionPlan, unitMap }) {
        const actor = unitMap.get(actionPlan.actorId);
        const target = unitMap.get(actionPlan.targetId);

        if (!actor || !target) return;

        let damage = 0;
        switch (actionPlan.type) {
            case 'ATTACK':
                // 지금은 단순하게 공격자의 'attack' 스탯을 기본 데미지로 사용합니다.
                damage = actor.stats.attack || actor.attackPower || 10;
                console.log(`[CombatCalculator] ${actor.id}가 ${target.id}에게 기본 공격! 기본 피해량: ${damage}`);
                break;
            case 'SKILL':
                // 스킬의 기본 데미지 + 공격자의 스탯 등을 조합하여 계산합니다.
                damage = (actionPlan.skill?.basePower || 0) + (actor.stats.magic || actor.stats.focus || 0);
                console.log(`[CombatCalculator] ${actor.id}가 ${target.id}에게 스킬 사용! 스킬 피해량: ${damage}`);
                break;
        }

        if (damage > 0) {
            // 실제 데미지를 입히고, 그 결과를 다른 시스템에 방송합니다.
            if (typeof target.takeDamage === 'function') {
                target.takeDamage(damage);
            } else {
                target.hp -= damage;
                if (target.hp < 0) target.hp = 0;
            }

            this.eventManager.publish('unit_damaged', {
                targetId: target.id,
                damage,
                newHp: target.hp
            });
        }
    }
}
