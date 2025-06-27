// src/managers/CombatTurnEngine.js
import { TurnSequencingEngine } from '../engines/turn/TurnSequencingEngine.js';

/**
 * 전투 시 턴의 흐름을 관리하는 엔진.
 * TurnManager가 '전투' 국면에서 사용할 전략입니다.
 */
export class CombatTurnEngine {
    constructor(eventManager, worker) {
        this.eventManager = eventManager;
        this.worker = worker;
        this.units = [];
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.roundCount = 0;

        // 자신의 전문 엔진을 생성합니다.
        this.sequencingEngine = new TurnSequencingEngine();

        // 워커로부터 수신한 행동 계획을 처리합니다.
        this.worker.onmessage = (event) => {
            const actionPlan = event.data;
            console.log("[CombatTurnEngine] 워커로부터 행동 계획 수신:", actionPlan);
            this.executeAction(actionPlan);
        };

        console.log("[CombatTurnEngine] Initialized.");
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
    processNextTurn() {
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
        const currentUnit = this.units.find(u => u.id === currentUnitId);
        console.log(`%c[턴 진행] ${currentUnit.id}의 턴입니다. AI에게 결정을 요청합니다...`, 'color: #2196F3; font-weight: bold;');

        // 워커에게 현재 상태를 전송하여 행동 결정을 요청합니다.
        this.worker.postMessage({
            actor: currentUnit,
            allUnits: this.units
        });
    }

    /**
     * 워커가 결정한 행동 계획을 받아 실제 연출을 실행합니다.
     * @param {object} actionPlan
     */
    async executeAction(actionPlan) {
        console.log(`[연출 시작] ${actionPlan.actorId}이(가) ${actionPlan.targetId}에게 ${actionPlan.type} 실행!`);

        setTimeout(() => {
            console.log("[연출 종료]");
            this.currentTurnIndex++;
            this.processNextTurn();
        }, 1000);
    }
}
