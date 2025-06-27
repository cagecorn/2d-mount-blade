// src/workers/ai/UtilityAI_Engine.js
import { TargetingEngine } from './TargetingEngine.js';

export class UtilityAI_Engine {
    constructor() {
        this.targetingEngine = new TargetingEngine();
        // Pathfinding 워커는 필요할 때 생성하거나 미리 만들어 둘 수 있습니다.
    }

    /**
     * 현재 상황에서 가장 가치 있는 행동 계획을 수립합니다.
     * @param {object} actor - 행동 주체
     * @param {Array<object>} allUnits - 모든 유닛 정보
     * @param {object} grid - 그리드 데이터 (경로 탐색용)
     * @returns {Promise<object>} - 최종 행동 계획 (Action Plan)
     */
    decideAction(actor, allUnits, grid) {
        return new Promise(resolve => {
            const targetId = this.targetingEngine.findBestTarget(actor, allUnits);
            if (!targetId) {
                resolve({ actorId: actor.id, type: 'IDLE' });
                return;
            }

            const target = allUnits.find(u => u.id === targetId);
            const distance = Math.abs(actor.pos.gridX - target.pos.gridX) + Math.abs(actor.pos.gridY - target.pos.gridY);

            // 공격 범위가 1이라고 가정
            if (distance <= 1) {
                resolve({ actorId: actor.id, type: 'ATTACK', targetId: target.id });
                return;
            }

            // 실제로는 Pathfinding 워커를 호출해야 하지만, 지금은 간단한 경로 생성
            const path = this.generateSimplePath(actor.pos, target.pos);

            resolve({ actorId: actor.id, type: 'MOVE', path: path, targetId: target.id });
        });
    }

    // 임시 경로 생성 함수
    generateSimplePath(start, end) {
        const path = [];
        let current = { gridX: start.gridX, gridY: start.gridY };
        const targetPos = { gridX: end.gridX > start.gridX ? end.gridX - 1 : end.gridX + 1, gridY: end.gridY };

        while (current.gridX !== targetPos.gridX || current.gridY !== targetPos.gridY) {
            if (current.gridX < targetPos.gridX) current.gridX++;
            else if (current.gridX > targetPos.gridX) current.gridX--;
            else if (current.gridY < targetPos.gridY) current.gridY++;
            else if (current.gridY > targetPos.gridY) current.gridY--;
            path.push({ ...current });
            if (path.length > 10) break; // 무한 루프 방지
        }
        return path;
    }
}
