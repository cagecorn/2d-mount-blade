// src/workers/turn.worker.js
import { UtilityAI_Engine } from './ai/UtilityAI_Engine.js';

console.log("[TurnWorker] 워커 스크립트 로드됨.");
const aiEngine = new UtilityAI_Engine();

// 메인 스레드로부터 메시지를 받았을 때 실행될 함수
self.onmessage = (event) => {
    console.log("[TurnWorker] 메인 스레드로부터 메시지 수신:", event.data);

    const { actor, allUnits } = event.data;

    // AI 엔진을 통해 행동을 결정합니다. (가장 계산이 오래 걸리는 부분)
    const actionPlan = aiEngine.decideAction(actor, allUnits);

    console.log("[TurnWorker] 행동 계획 수립 완료, 메인 스레드로 전송:", actionPlan);

    // 결정된 행동 계획을 메인 스레드로 다시 보냅니다.
    self.postMessage(actionPlan);
};
