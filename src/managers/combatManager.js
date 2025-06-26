export class CombatManager {
    constructor(eventManager = null, uiManager = null, aspirationManager = null) {
        this.eventManager = eventManager;
        this.uiManager = uiManager;
        this.aspirationManager = aspirationManager;
        this.isInCombat = false;
        this.player = null;
        this.enemy = null;
        this.turn = 0;
        this.combatLog = [];
    }

    addToLog(message) {
        if (!this.combatLog) this.combatLog = [];
        this.combatLog.push(message);
        this.eventManager?.publish?.('log', { message });
    }

    processTurn() {
        // Placeholder for turn processing logic
        this.turn += 1;
    }

    startCombat(player, enemy) {
        if (this.isInCombat) return;

        console.log(`Combat started between ${player.name} and ${enemy.name}`);
        this.isInCombat = true;
        this.player = player;
        this.enemy = enemy;
        this.turn = 0;
        this.combatLog = [];

        // 전투에 참여하는 모든 캐릭터의 열망 상태를 확인합니다.
        // 이 코드가 누락되어 열망 효과가 발동하지 않았습니다.
        if (this.aspirationManager) {
            this.aspirationManager.checkAspiration(this.player);
            this.aspirationManager.checkAspiration(this.enemy);
        }

        this.eventManager?.publish?.('combatStarted', { player, enemy });
        if (this.uiManager && typeof this.uiManager.showCombatUI === 'function') {
            this.uiManager.showCombatUI(player, enemy);
        }
        this.addToLog(`${player.name} vs ${enemy.name}: Combat has begun!`);

        this.processTurn();
    }
}
