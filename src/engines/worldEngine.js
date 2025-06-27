/**
 * \uC6D0\uB4DC \uD130\uB110\uC81C \uC804\uB7B5 \uAC8C\uC784 \uC5D4\uC9C4
 * \uC6D0\uB4DC\uB9F5 \uD0ED \uD751\uBCF5 \uC5ED\uD560\uC744 \uC2E4\uD589\uD569\uB2C8\uB2E4.
 */
export class WorldEngine {
    constructor(game) {
        this.game = game;
        this.gridManager = game.gridManager;
        this.turnManager = game.turnManager;
        this.monsters = [];
    }

    update() {
        const encounteredEnemy = this.checkForEncounters();
        if (encounteredEnemy) {
            const terrain = this.getTerrainAt(this.game.player.tileX, this.game.player.tileY);
            const encounterContext = { enemyUnit: encounteredEnemy, terrain };
            this.game.setupFormation(encounterContext);
        }
    }

    render(context) {
        // TODO: \uC6D0\uB4DC\uB9F5 \uADF8\uB9AC\uAE30
    }

    checkForEncounters() {
        const player = this.game.player;
        return this.monsters.find(m => !m.isDefeated && Math.abs(m.x - player.x) < 30 && Math.abs(m.y - player.y) < 30) || null;
    }

    getTerrainAt(x, y) {
        return 'plains';
    }
}
