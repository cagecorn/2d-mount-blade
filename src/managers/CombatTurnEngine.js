// src/managers/CombatTurnEngine.js
import { TurnSequencingEngine } from '../engines/turn/TurnSequencingEngine.js';
import { ActionExecutionEngine } from '../engines/turn/ActionExecutionEngine.js';

/**
 * 전투 시 턴의 흐름을 관리하는 엔진.
 * TurnManager가 '전투' 국면에서 사용할 전략입니다.
 */
export class CombatTurnEngine {
    constructor(eventManager, worker, vfxManager, soundManager) {
        this.eventManager = eventManager;
        this.worker = worker;
        this.unitMap = new Map(); // ID로 유닛을 빠르게 찾기 위한 Map
        this.units = [];
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.roundCount = 0;

        this.sequencingEngine = new TurnSequencingEngine();
        // ★★★ 행동 실행 엔진을 생성하고 주입받은 매니저들을 넘겨줍니다. ★★★
        this.executionEngine = new ActionExecutionEngine(eventManager, vfxManager, soundManager);

        // 워커로부터 수신한 행동 계획을 처리합니다.
        this.worker.onmessage = (event) => {
            const actionPlan = event.data;
            console.log("[CombatTurnEngine] 워커로부터 행동 계획 수신:", actionPlan);
            this.executeAction(actionPlan);
        };

        console.log("[CombatTurnEngine] Initialized.");
    }

    /**
     * Web Worker에 전달할 수 있도록 유닛 정보를 직렬화합니다.
     * 이미지 등 DOM 객체는 제외합니다.
     * @param {object} unit
     * @returns {object}
     */
    serializeUnit(unit) {
        return {
            id: unit.id,
            team: unit.team,
            x: unit.x,
            y: unit.y,
            width: unit.width,
            height: unit.height,
            pos: { x: unit.x + unit.width / 2, y: unit.y + unit.height },
            skills: Array.isArray(unit.skills)
                ? unit.skills.map(s => ({ id: s.id }))
                : []
        };
    }

    /**
     * 전투를 시작합니다.
     * @param {Array<Unit>} units - 아군과 적군 유닛 배열
     */
    startCombat(units) {
        this.units = units;
        // 유닛 배열을 Map으로 변환하여 검색 속도를 높입니다.
        this.unitMap = new Map(units.map(u => [u.id, u]));
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
        // HTMLImageElement 등 전송 불가능한 데이터는 제외합니다.
        const actorData = this.serializeUnit(currentUnit);
        const unitsData = this.units.map(u => this.serializeUnit(u));
        this.worker.postMessage({
            actor: actorData,
            allUnits: unitsData
        });
    }

    /**
     * 워커가 결정한 행동 계획을 받아 실제 연출을 실행합니다.
     * @param {object} actionPlan
     */
    async executeAction(actionPlan) {
        // ★★★ 이제 모든 연출은 ActionExecutionEngine이 책임집니다. ★★★
        await this.executionEngine.execute(actionPlan, this.unitMap);
        
        // 연출이 모두 끝나면 다음 턴으로 넘어갑니다.
        this.currentTurnIndex++;
        this.processNextTurn();
    }
}
