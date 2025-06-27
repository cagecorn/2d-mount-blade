// src/engines/turn/ActionExecutionEngine.js

/**
 * 결정된 행동(공격, 스킬)을 받아 애니메이션, VFX, 사운드 등
 * 실제 연출을 순차적으로 실행하는 전문 엔진
 */
export class ActionExecutionEngine {
    constructor(animationManager, vfxManager, soundManager) {
        this.animationManager = animationManager;
        this.vfxManager = vfxManager;
        this.soundManager = soundManager;
        console.log("[ActionExecutionEngine] Initialized.");
    }

    /**
     * AI로부터 받은 액션 플랜을 실행합니다.
     * @param {object} actionPlan - { actorId, actionType, skillId, targetId }
     * @returns {Promise<void>} - 모든 연출이 끝나면 resolve되는 Promise
     */
    async execute(actionPlan) {
        console.log(`[ActionExecutionEngine] Executing:`, actionPlan);

        // 1. 애니메이션 재생 (예: 공격 모션)
        // await this.animationManager.play(actionPlan.actorId, 'attack');

        // 2. 사운드 재생
        // this.soundManager.play('sword_swing');

        // 3. 이펙트(VFX) 출력
        // this.vfxManager.createEffect('slash', actionPlan.targetId);

        // 모든 연출이 끝난 후, 실제 데미지 계산은 CombatCalculator에 위임
        // 이 때 eventManager.publish('action_completed', { plan: actionPlan }); 를 호출하여
        // CombatCalculator가 데미지를 계산하도록 할 수 있습니다.

        // 지금은 연출이 즉시 끝난다고 가정
        return Promise.resolve();
    }
}
