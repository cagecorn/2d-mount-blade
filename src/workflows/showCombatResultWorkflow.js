export class ShowCombatResultWorkflow {
    /**
     * @param {object} context - collection of managers needed to present combat results
     * @param {object} context.combatManager - provides getCombatResults()
     * @param {object} context.uiManager - responsible for drawing result screens
     * @param {object} context.soundManager - plays victory or defeat music cues
     * @param {object} context.mercenaryManager - updates mercenary experience
     */
    constructor(context) {
        this.combatManager = context.combatManager;
        this.uiManager = context.uiManager;
        this.soundManager = context.soundManager;
        this.mercenaryManager = context.mercenaryManager;
    }

    /**
     * Gather the most recent combat results and update all relevant systems.
     * This keeps post-battle logic centralized so other modules can trigger it
     * without duplicating UI or audio calls.
     */
    execute() {
        if (!this.combatManager || typeof this.combatManager.getCombatResults !== 'function') {
            console.error('[ShowCombatResultWorkflow] combatManager.getCombatResults() unavailable');
            return;
        }

        const results = this.combatManager.getCombatResults();
        if (!results) {
            console.warn('[ShowCombatResultWorkflow] No combat results available');
            return;
        }

        // Display results via UI manager if possible
        if (this.uiManager && typeof this.uiManager.showBattleResultScreen === 'function') {
            this.uiManager.showBattleResultScreen(results);
        }

        // Grant experience to mercenaries that participated
        if (this.mercenaryManager && typeof this.mercenaryManager.applyExperienceGain === 'function') {
            this.mercenaryManager.applyExperienceGain(results.exp);
        }

        // Play a simple victory fanfare; caller can adjust audio using results
        if (this.soundManager && typeof this.soundManager.playMusic === 'function') {
            this.soundManager.playMusic('victory_fanfare');
        }

        console.log('[ShowCombatResultWorkflow] executed successfully');
    }
}
