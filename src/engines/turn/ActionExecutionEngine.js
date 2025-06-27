// src/engines/turn/ActionExecutionEngine.js

const TILE_SIZE = 32; // GridManager와 동일한 타일 크기

export class ActionExecutionEngine {
    constructor(game, eventManager, vfxManager, soundManager) {
        this.game = game;
        this.eventManager = eventManager;
        this.vfxManager = vfxManager;
        this.soundManager = soundManager;
        console.log("[ActionExecutionEngine] Initialized: 행동 실행 준비 완료.");
    }

    execute(actionPlan, unitMap) {
        return new Promise(async (resolve) => {
            const actor = unitMap.get(actionPlan.actorId);
            console.log('%c[연출 시작]', 'color: #4CAF50; font-weight: bold;', actionPlan);

            switch (actionPlan.type) {
                case 'MOVE': {
                    await this.moveUnitAlongPath(actor, actionPlan.path);
                    const target = unitMap.get(actionPlan.targetId);
                    await this.performAttack(actor, target);
                    break;
                }
                case 'ATTACK': {
                    const target = unitMap.get(actionPlan.targetId);
                    await this.performAttack(actor, target);
                    break;
                }
                // 다른 행동 타입은 추후 추가
            }

            console.log('%c[연출 종료]', 'color: #F44336; font-weight: bold;');
            this.eventManager.publish('execute_action_effect', { actionPlan, unitMap });
            resolve();
        });
    }

    async moveUnitAlongPath(unit, path) {
        console.log(`${unit.id}이(가) 경로를 따라 이동합니다.`);
        for (const step of path) {
            const targetScreenPos = {
                x: (step.gridX * TILE_SIZE) + (TILE_SIZE / 2),
                y: (step.gridY * TILE_SIZE) + TILE_SIZE,
            };
            await this.animateMovement(unit, targetScreenPos, 200);
            unit.pos.gridX = step.gridX;
            unit.pos.gridY = step.gridY;
        }
    }

    async performAttack(actor, target) {
        this.soundManager.play('sword_swing');
        await this.wait(300);
        this.vfxManager.createEffect('slash', target.pos);
        await this.wait(200);
    }

    animateMovement(objectToMove, targetPos, duration) {
        const game = this.game;
        return new Promise(resolve => {
            const startPos = { ...objectToMove.pos };
            const startTime = performance.now();

            const tick = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                objectToMove.pos.x = startPos.x + (targetPos.x - startPos.x) * progress;
                objectToMove.pos.y = startPos.y + (targetPos.y - startPos.y) * progress;

                if (game && typeof game.render === 'function') {
                    game.render();
                }

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    resolve();
                }
            };
            requestAnimationFrame(tick);
        });
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
