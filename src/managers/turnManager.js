// src/managers/turnManager.js

import { context } from '../gameContext.js';

export class TurnManager {
    constructor() {
        this.turnOrder = []; // 전투에 참여하는 유닛 ID의 순서
        this.currentTurnIndex = -1;
    }

    /**
     * 전투 시작 시 호출되어 모든 유닛으로 턴 순서를 계산합니다.
     * @param {Array<Character>} units - 전투에 참여하는 모든 유닛 객체 배열
     */
    setupTurnOrder(units) {
        // '무게' 시스템 적용: 무게가 가벼울수록, 민첩성이 높을수록 우선
        // 무게(weight)는 아이템에서, 민첩성(agility)은 캐릭터 스탯에서 가져온다고 가정
        const sortedUnits = units.sort((a, b) => {
            const weightA = a.getTotalWeight(); // 캐릭터의 총 무게를 가져오는 함수 (구현 필요)
            const weightB = b.getTotalWeight();
            
            if (weightA !== weightB) {
                return weightA - weightB; // 무게가 낮은 순서
            } else {
                return b.stats.agility - a.stats.agility; // 민첩성이 높은 순서
            }
        });

        this.turnOrder = sortedUnits.map(unit => unit.id);
        this.currentTurnIndex = 0;
        console.log('Turn order calculated:', this.turnOrder);
        this.startTurn();
    }

    startTurn() {
        if (this.currentTurnIndex === -1 || this.turnOrder.length === 0) {
            console.log('Combat ended or no units left.');
            context.eventManager.publish('combatEnded');
            return;
        }

        const currentUnitId = this.turnOrder[this.currentTurnIndex];
        const currentUnit = context.entityManager.getEntityById(currentUnitId);

        if (currentUnit) {
            console.log(`--- Turn ${this.currentTurnIndex + 1}: ${currentUnit.name}'s turn ---`);
            context.eventManager.publish('turnStarted', currentUnit);

            // AI라면 행동 결정, 플레이어라면 입력 대기
            if (currentUnit.isPlayerControlled) {
                // UI를 활성화하여 플레이어의 입력을 기다립니다.
                context.uiManager.enablePlayerInput(currentUnit);
            } else {
                // AI의 행동을 비동기적으로 처리합니다.
                this.handleAiTurn(currentUnit);
            }
        }
    }
    
    async handleAiTurn(aiUnit) {
        // AI가 행동을 결정하고 실행하는 데 시간이 걸리는 것을 시뮬레이션
        // (예: 애니메이션 재생)
        await new Promise(resolve => setTimeout(resolve, 500)); // 0.5초 대기
        
        console.log(`${aiUnit.name} performs an action.`);
        // const action = context.aiManager.decideAction(aiUnit);
        // context.combatManager.executeAction(action);
        
        this.nextTurn();
    }

    nextTurn() {
        const currentUnitId = this.turnOrder[this.currentTurnIndex];
        context.eventManager.publish('turnEnded', context.entityManager.getEntityById(currentUnitId));

        this.currentTurnIndex++;
        if (this.currentTurnIndex >= this.turnOrder.length) {
            this.currentTurnIndex = 0; // 한 라운드가 끝나면 처음으로
        }
        
        this.startTurn();
    }

    removeUnit(unitId) {
        this.turnOrder = this.turnOrder.filter(id => id !== unitId);
    }
}
