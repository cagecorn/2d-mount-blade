/**
 * \uBD80\uB300 \uC815\uBE44 \uD30C\uD2B8 \uACFC\uC815.\n * \uC804\uD22C \uC2DC\uC791 \uC804 \uC5F0\uC7A5\uC5D0\uC11C \uC720\uB2DB\uC744 \uBC30\uCE58\uD558\uACE0 \uC9C4\uD615\uC744 \uAD6C\uD569\uB2C8\uB2E4.\n */
export class FormationEngine {
    constructor(game) {
        this.game = game;
        this.inputHandler = game.inputHandler;
        this.uiManager = game.uiManager;
        this.battleContext = null;
    }

    /**
     * WorldEngine\uC5D0\uC11C \uC804\uD22C \uC0C1\uD0DC \uC815\uBCF4\uB97C \uBC1B\uC544 \uC2DC\uC791\uD569\uB2C8\uB2E4.
     * @param {object} context - { enemyUnit: object, terrain: string, ... }
     */
    start(context) {
        console.log('\uBD80\uB300 \uC815\uBE44 \uC2DC\uC791!', context);
        this.battleContext = context;
        // TODO: UI \uBCF4\uC6B8 \uB54C \uC801\uC6A9\uD560 \uB9CC\uD55C \uCF54\uB4DC \uC774\uB2C8 UIManager \uB610\uB294 game.js \uB97C \uC0AC\uC6A9\n        this.uiManager.showPanel?.('squad-management-ui');
    }

    update(deltaTime) {
        if (!this.battleContext) return;
        // \uBD80\uB300 \uC815\uBE44 \uD654\uBA74\uC758 UI \uC0AC\uC6A9\uC790 \uC0B0\uD638\uC791 \uCCB4\uD06C
        if (this.uiManager.isCombatStartButtonPressed?.()) {
            this.battleContext.playerFormation = this.uiManager.getCurrentFormation?.();
            this.game.startCombat(this.battleContext);
            this.battleContext = null;
        }
    }

    render(context) {
        if (!this.battleContext) return;
        // TODO: \uC720\uB2DB \uBC30\uCE58 \uC2DC\uAC04 \uD654\uBA74 \uADF8\uB9AC\uAE30. \uC774\uC81C UIManager \uC81C\uACF5 \uB514\uD3F4\uD2B8 \uC774\uB85C \uB0A8\uACA8 \uB458 \uC218 \uC788\uB2E4.
    }
}
