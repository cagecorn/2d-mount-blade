// src/workers/ai/UtilityAI_Engine.js
import { TargetingEngine } from './TargetingEngine.js';

/**
 * 여러 엔진의 분석을 종합하여 최적의 행동을 결정하는 AI의 총괄 두뇌 (Worker 내부)
 */
export class UtilityAI_Engine {
    constructor() {
        this.targetingEngine = new TargetingEngine();
    }

    /**
     * 현재 상황에서 가장 가치 있는 행동 계획을 수립합니다.
     * @param {object} actor - 행동 주체
     * @param {Array<object>} allUnits - 모든 유닛 정보
     * @returns {object} - 최종 행동 계획 (Action Plan)
     */
    decideAction(actor, allUnits) {
        // 1. [확률 기반 스킬 사용 결정] (지금은 간단하게 50% 확률로 스킬 또는 공격 결정)
        const useSkill = Math.random() < 0.5;

        // 2. [타겟 결정]
        const targetId = this.targetingEngine.findBestTarget(actor, allUnits);
        if (!targetId) {
            return { actorId: actor.id, type: 'IDLE' }; // 할 게 없으면 대기
        }

        // 3. [최종 행동 계획 수립]
        if (useSkill && actor.skills && actor.skills.length > 0) {
            // 지금은 첫 번째 스킬을 사용한다고 가정
            const skillId = actor.skills[0].id;
            return { actorId: actor.id, type: 'SKILL', skillId: skillId, targetId: targetId };
        } else {
            return { actorId: actor.id, type: 'ATTACK', targetId: targetId };
        }
    }
}
