import { ArenaManager } from '../arena/arenaManager.js';

/**
 * \uC544\uB808\uB098 \uAC8C\uC784 \uBAA8\uB4DC\uC758 \uBAA8\uB450\uB97C \uCD1D\uAD04\uD558\uB294 \uCD5C\uC0C1\uC704 \uC5D4\uC9C4\uC785\uB2C8\uB2E4.
 * \uAC8C\uC784 \uC0C1\uD0DC \uAD00\uB9AC, \uC5C5\uB370\uC774\uD2B8 \uBC0F \uB80C\uB354\uB9C1 \uD638\uCD9C\uC744 \uB2F4\uB2F9\uD569\uB2C8\uB2E4.
 */
export class ArenaEngine {
    constructor(game) {
        this.game = game;
        this.isActive = false;

        // ArenaEngine\uC740 ArenaManager\uB97C \uC18C\uC720\uD558\uACE0 \uAD00\uB9AC\uD569\uB2C8\uB2E4.
        this.arenaManager = new ArenaManager(this.game);
    }

    /**
     * ArenaEngine\uC744 \uC2DC\uC791\uD558\uACE0 \uAC8C\uC784 \uC0C1\uD0DC\uB97C 'ARENA'\uB85C \uBCC0\uACBD\uD569\uB2C8\uB2E4.
     */
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.game.gameState.currentState = 'ARENA';
        console.log("\uD83D\uDE80 Arena Engine\uC774 \uC2DC\uC791\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");

        // \uc2e4\uc81c \uc544\ub808\ub098 \uACbd\uae30 \ud654\ub294 ArenaManager\uc5d0 \uc704\uc784\ud569\ub2c8\ub2e4.
        this.arenaManager.start();
    }

    /**
     * ArenaEngine\uC744 \uC911\uC9C0\uD558\uACE0 \uAC8C\uC784 \uC0C1\uD0DC\uB97C 'WORLD'\uB85C \ub418\ub2c8\uB2E4.
     */
    stop() {
        if (!this.isActive) return;
        this.isActive = false;

        // ArenaManager\ub97c \uba3c\uc800 \uc911\uc9c0\uc2dc\ud0b5\ub2c8\ub2e4.
        this.arenaManager.stop();
        this.game.gameState.currentState = 'WORLD';
        console.log("\uD83D\uDED1 Arena Engine\uC774 \uC911\uC9C0\uB418\uC5C8\uC2B5\uB2C8\uB2E4.");
    }

    /**
     * \uC544\ub808\ub098 \uc0c1\ud0dc\uc77c \ub54c \ub9e4 \ud504\ub808\uc784 \ud638\uce38\ub420 \uc5c5\ub370\uc774\ud2b8 \ub85c\uc9c1\uc785\ub2c8\uB2E4.
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (!this.isActive) return;

        // ArenaEngine\uc740 \ud544\uc694\ud55c \ud558\uc704 \uc5d4\uc9c4\ub4e4\uc744 \uc21c\uc11c\ub300\ub85c \uc5c5\ub370\uc774\ud2b8\ud569\ub2c8\uB2E4.
        // 1. \uc804\ud22c \uacc4\uc0b0\uc740 CombatEngine\uc5d0 \uc704\uc784
        this.game.combatEngine.update(deltaTime);
        // 2. \ub77c\uc6b4\ub4dc \uad00\ub9ac \ub4f1 \uacbd\uae30 \ud654\ub294 ArenaManager\uc5d0 \uc704\uc784
        this.arenaManager.update(deltaTime);
    }

    /**
     * \uC544\ub808\ub098 \uc0c1\ud0dc\uc77c \ub54c \ub9e4 \ud504\ub808\uc784 \ud638\uce38\ub420 \ub80c\ub354\ub9c1 \ub85c\uc9c1\uc785\ub2c8\uB2E4.
     */
    render() {
        if (!this.isActive) return;

        // \ub80c\ub354\ub9c1\uc740 ArenaManager\ub97c \ud1b5\ud574 \ucc98\ub9ac\ud569\ub2c8\uB2E4.
        this.arenaManager.render(
            this.game.layerManager.contexts,
            this.game.mapManager,
            this.game.assets
        );
    }
}
