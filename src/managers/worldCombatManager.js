export class WorldCombatManager {
    constructor(game, eventManager, worldEngine) {
        this.game = game;
        this.eventManager = eventManager;
        this.worldEngine = worldEngine;
        this.activeCommander = null;
        if (this.eventManager) {
            this.eventManager.subscribe('start_combat', data => this.onStartCombat(data));
            this.eventManager.subscribe('end_combat', result => this.onEndCombat(result));
        }
        console.log('[WorldCombatManager] Initialized');
    }

    onStartCombat(data) {
        if (!data) return;
        if (this.game.gameState.currentState !== 'WORLD') return;
        this.activeCommander = data.monsterParty || null;
        const origin = { x: this.game.gameState.player.x, y: this.game.gameState.player.y };
        const entityMap = { [this.game.gameState.player.id]: this.game.gameState.player };
        this.game.mercenaryManager.mercenaries.forEach(m => { entityMap[m.id] = m; });
        this.game.formationManager.apply(origin, entityMap);
        if (this.activeCommander) this.activeCommander.isActive = false;
        this.game.gameState.currentState = 'COMBAT';
    }

    onEndCombat(result) {
        this.game.gameState.currentState = 'WORLD';
        if (result?.outcome === 'victory' && this.activeCommander) {
            const idx = this.worldEngine.monsters.indexOf(this.activeCommander);
            if (idx !== -1) {
                this.worldEngine.monsters.splice(idx, 1);
            }
        } else if (this.activeCommander) {
            this.activeCommander.isActive = true;
        }
        this.worldEngine.monsters.forEach(m => m.isActive = true);
        this.activeCommander = null;
    }
}
