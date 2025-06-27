// src/engines/turn/TurnSequencingEngine.js

/**
 * 유닛들의 '무게' 스탯을 기반으로 전투의 행동 순서를 결정하는 전문 엔진
 */
export class TurnSequencingEngine {
    constructor() {
        console.log("[TurnSequencingEngine] Initialized.");
    }

    /**
     * 모든 유닛의 무게를 계산하여 해당 라운드의 행동 순서 리스트를 반환합니다.
     * @param {Array<Unit>} allUnits - 전투에 참여하는 모든 유닛(지휘관)의 배열
     * @returns {Array<string>} - 유닛 ID가 순서대로 정렬된 배열
     */
    calculateTurnOrder(allUnits) {
        // 유닛의 장비 무게, 기본 스탯 등을 종합하여 '행동 속도'를 계산
        const unitsWithSpeed = allUnits.map(unit => {
            // 지금은 무게만 보지만, 나중엔 민첩성 등 다른 스탯도 반영 가능
            const totalWeight = unit.equipment.getTotalWeight();
            // 속도는 무게에 반비례한다고 가정
            const speed = 1000 - totalWeight;
            return { unitId: unit.id, speed: speed };
        });

        // 속도가 높은 순(내림차순)으로 정렬
        unitsWithSpeed.sort((a, b) => b.speed - a.speed);

        console.log("[TurnSequencingEngine] Turn order calculated:", unitsWithSpeed.map(u => u.unitId));
        return unitsWithSpeed.map(u => u.unitId);
    }
}
