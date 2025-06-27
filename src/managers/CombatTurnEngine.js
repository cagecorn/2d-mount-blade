// src/managers/CombatTurnEngine.js
import { TurnSequencingEngine } from '../engines/turn/TurnSequencingEngine.js';
import { ActionExecutionEngine } from '../engines/turn/ActionExecutionEngine.js';

/**
 * 전투 시 턴의 흐름을 관리하는 엔진.
 * TurnManager가 '전투' 국면에서 사용할 전략입니다.
 */
export class CombatTurnEngine {
    constructor(eventManager, turnWorker) {
        this.eventManager = eventManager;
        this.turnWorker = turnWorker; // AI 계산을 요청할 워커
        this.units = []; // 전투 참여 유닛 목록
        this.turnOrder = []; // 이번 라운드의 턴 순서
        this.currentTurnIndex = 0;

        // 전문 엔진들을 생성
        this.sequencingEngine = new TurnSequencingEngine();
        // this.executionEngine = new ActionExecutionEngine(...);

        console.log("[CombatTurnEngine] Initialized.");
    }

    /**
     * 전투를 시작합니다.
     * @param {Array<Unit>} units - 아군과 적군 유닛 배열
     */
    startCombat(units) {
        this.units = units;
        console.log("[CombatTurnEngine] Combat started.");

        // 1. [용맹] 스탯에 따라 모든 유닛의 보호막을 계산하고 적용합니다.
        // this.units.forEach(unit => unit.applyValorShield());

        // 2. [무게]를 기반으로 첫 라운드의 턴 순서를 결정합니다.
        this.turnOrder = this.sequencingEngine.calculateTurnOrder(this.units);

        // 3. 첫 턴을 시작합니다.
        this.startNextTurn();
    }

    /**
     * 다음 유닛의 턴을 시작합니다.
     */
    async startNextTurn() {
        if (this.currentTurnIndex >= this.turnOrder.length) {
            // 모든 유닛이 행동했다면 라운드 종료
            console.log("[CombatTurnEngine] Round ended.");
            // 다음 라운드 준비...
            return;
        }

        const currentUnitId = this.turnOrder[this.currentTurnIndex];
        const currentUnit = this.units.find(u => u.id === currentUnitId);
        console.log(`[CombatTurnEngine] It's ${currentUnit.name}'s turn.`);

        // AI Worker에게 행동 결정을 요청합니다.
        // const actionPlan = await this.turnWorker.decideAction(currentUnit, this.units);

        // Worker로부터 받은 행동 계획을 실행 엔진에게 넘겨 연출합니다.
        // await this.executionEngine.execute(actionPlan);

        // 턴 종료
        this.currentTurnIndex++;
        this.startNextTurn();
    }
}
