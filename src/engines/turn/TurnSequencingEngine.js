// src/engines/turn/TurnSequencingEngine.js

/**
 * 유닛들의 '무게' 스탯을 기반으로 전투의 행동 순서를 결정하는 전문 엔진
 */
export class TurnSequencingEngine {
    constructor() {
        console.log("[TurnSequencingEngine] Initialized: 턴 순서 결정 준비 완료.");
    }

    /**
     * 유닛들의 무게를 계산하여 해당 라운드의 행동 순서 리스트를 반환합니다.
     * @param {Array<Object>} allUnits - 전투에 참여하는 모든 유닛(지휘관)의 배열
     * @returns {Array<string>} - 유닛 ID가 순서대로 정렬된 배열
     */
    calculateTurnOrder(allUnits) {
        console.log("[TurnSequencingEngine] 턴 순서 계산 시작...");

        const unitsWithSpeed = allUnits.map(unit => {
            // 지금은 임시로 무게 값을 0~100 사이 랜덤으로 가정합니다.
            // 나중에 실제 장비 시스템이 구현되면 unit.equipment.getTotalWeight() 등으로 대체됩니다.
            const totalWeight = unit.weight || Math.floor(Math.random() * 101);

            // 속도는 무게에 반비례한다고 가정 (단순 모델)
            // 나중에 민첩(Agility) 등 다른 스탯도 여기에 반영할 수 있습니다.
            const speed = 1000 - totalWeight + (unit.agility || 0);

            console.log(`- ${unit.id}: 무게 ${totalWeight}, 속도 ${speed}`);
            return { unitId: unit.id, speed: speed };
        });

        // 속도가 높은 순(내림차순)으로 정렬
        unitsWithSpeed.sort((a, b) => b.speed - a.speed);

        const turnOrder = unitsWithSpeed.map(u => u.unitId);
        console.log("[TurnSequencingEngine] 턴 순서 계산 완료:", turnOrder);
        return turnOrder;
    }
}
