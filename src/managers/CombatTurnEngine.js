// src/managers/CombatTurnEngine.js
import { TurnSequencingEngine } from '../engines/turn/TurnSequencingEngine.js';

/**
 * 전투 시 턴의 흐름을 관리하는 엔진.
 * TurnManager가 '전투' 국면에서 사용할 전략입니다.
 */
export class CombatTurnEngine {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.units = [];
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.roundCount = 0;

        // 자신의 전문 엔진을 생성합니다.
        this.sequencingEngine = new TurnSequencingEngine();

        console.log("[CombatTurnEngine] Initialized: 전투 턴 엔진 준비 완료.");
    }

    /**
     * 전투를 시작합니다.
     * @param {Array<Unit>} units - 아군과 적군 유닛 배열
     */
    startCombat(units) {
        this.units = units;
        this.roundCount = 1;
        console.log(`[CombatTurnEngine] 전투 시작! 총 ${this.units.length} 유닛 참여.`);

        // [용맹] 시스템이 작동할 위치 (지금은 주석 처리)
        // this.applyValorShields();

        this.startNewRound();
    }

    /**
     * 새로운 라운드를 시작합니다.
     */
    startNewRound() {
        console.log(`[CombatTurnEngine] --- 라운드 ${this.roundCount} 시작 ---`);
        this.currentTurnIndex = 0;

        // 턴 순서 결정 엔진을 통해 이번 라운드의 턴 순서를 계산합니다.
        this.turnOrder = this.sequencingEngine.calculateTurnOrder(this.units);

        // 첫 턴을 시작합니다.
        this.processNextTurn();
    }

    /**
     * 현재 턴을 처리하고, 다음 턴으로 넘어갑니다.
     */
    async processNextTurn() {
        if (this.currentTurnIndex >= this.turnOrder.length) {
            console.log(`[CombatTurnEngine] --- 라운드 ${this.roundCount} 종료 ---`);
            this.roundCount++;
            // (임시) 3 라운드까지만 진행하고 전투 종료
            if (this.roundCount > 3) {
                 console.log("[CombatTurnEngine] 전투 종료.");
                 this.eventManager.publish('combat_ended');
                 return;
            }
            this.startNewRound();
            return;
        }

        const currentUnitId = this.turnOrder[this.currentTurnIndex];
        console.log(`%c[턴 진행] ${currentUnitId}의 턴입니다.`, 'color: #2196F3; font-weight: bold;');

        // AI Worker에게 행동 결정을 요청할 위치
        // const actionPlan = await this.turnWorker.decideAction(...);
        // await this.executionEngine.execute(actionPlan);

        // 지금은 AI 결정 과정을 건너뛰고 바로 다음 턴으로 넘어갑니다.
        // 1초 후 다음 턴 진행 (연출 시간 임시 구현)
        setTimeout(() => {
            this.currentTurnIndex++;
            this.processNextTurn();
        }, 1000);
    }
}
