// src/workers/ai/TargetingEngine.js

/**
 * 행동의 대상을 결정하는 전문 엔진 (Worker 내부에서 사용)
 */
export class TargetingEngine {
    constructor() {}

    /**
     * 가장 합리적인 공격 대상을 찾습니다.
     * @param {object} actor - 행동을 취하는 유닛
     * @param {Array<object>} allUnits - 모든 유닛의 정보
     * @returns {string|null} - 대상 유닛의 ID
     */
    findBestTarget(actor, allUnits) {
        // 지금은 가장 간단한 로직: 가장 가까운 적을 찾습니다.
        // actor와 다른 진영(team)에 속한 유닛만 필터링합니다.
        const enemies = allUnits.filter(u => u.team !== actor.team);
        // 적이 없을 경우 null을 반환하여 호출 측이 안전하게 처리하도록 합니다.
        if (enemies.length === 0) return null;

        let closestEnemy = null;
        let minDistance = Infinity;

        // 맨해튼 거리 계산으로 가장 가까운 적을 찾습니다.
        for (const enemy of enemies) {
            const distance = Math.abs(actor.pos.x - enemy.pos.x) + Math.abs(actor.pos.y - enemy.pos.y);
            if (Number.isFinite(distance) && distance < minDistance) {
                minDistance = distance;
                closestEnemy = enemy;
            }
        }

        // 유효한 대상을 찾지 못하면 null을 반환합니다.
        return closestEnemy ? closestEnemy.id : null;
    }
}
