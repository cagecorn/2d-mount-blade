// src/engines/turn/ActionExecutionEngine.js

/**
 * 결정된 행동 계획을 받아 애니메이션, VFX, 사운드 등
 * 실제 연출을 순차적으로 실행하는 전문 엔진
 */
export class ActionExecutionEngine {
    constructor(vfxManager, soundManager) {
        this.vfxManager = vfxManager;
        this.soundManager = soundManager;
        // 나중에는 애니메이션 매니저도 여기에 추가됩니다.
        // this.animationManager = animationManager;
        console.log("[ActionExecutionEngine] Initialized: 행동 실행 준비 완료.");
    }

    /**
     * AI로부터 받은 액션 플랜을 받아 연출을 실행합니다.
     * @param {object} actionPlan - { actorId, type, skillId, targetId }
     * @param {Map<string, object>} unitMap - ID로 유닛 정보를 찾기 위한 맵
     * @returns {Promise<void>} - 모든 연출이 끝나면 완료되는 Promise
     */
    execute(actionPlan, unitMap) {
        return new Promise(async (resolve) => {
            const actor = unitMap.get(actionPlan.actorId);
            const target = unitMap.get(actionPlan.targetId);

            console.log(`%c[연출 시작] ${actor.id}이(가) ${target.id}에게 ${actionPlan.type} 실행!`, 'color: #4CAF50; font-weight: bold;');

            switch (actionPlan.type) {
                case 'ATTACK':
                    // 1. 공격 사운드 재생
                    this.soundManager.play('sword_swing');
                    // 2. 공격 애니메이션 (지금은 시간 지연으로 대체)
                    await this.wait(300);
                    // 3. 타격 위치에 시각 효과 생성
                    this.vfxManager.createEffect('slash', target.pos);
                    await this.wait(200);
                    break;
                case 'SKILL':
                    // 1. 스킬 시전 사운드 재생
                    this.soundManager.play('magic_cast');
                    // 2. 스킬 이펙트 (예: 파이어볼)
                    this.vfxManager.createEffect('fireball', actor.pos);
                    await this.wait(500);
                    // 3. 타겟 위치에 폭발 효과
                    this.vfxManager.createEffect('explosion', target.pos);
                    break;
                default:
                    console.log(`${actor.id}이(가) 대기합니다.`);
                    break;
            }

            await this.wait(500); // 연출이 끝난 후 잠시 대기
            console.log('%c[연출 종료]', 'color: #F44336; font-weight: bold;');
            
            // 모든 연출이 끝나면 Promise를 완료시켜 다음 턴으로 넘어갈 수 있음을 알림
            resolve();
        });
    }

    /**
     * 지정된 시간(ms)만큼 기다리는 헬퍼 함수
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
