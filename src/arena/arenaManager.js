import { dataRecorder } from '../managers/dataRecorder.js';
import { fluctuationEngine } from '../managers/ai/FluctuationEngine.js';
import { Unit } from './Unit.js';
import { mbtiData } from './mbtiData.js';

class ArenaManager {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.roundCount = 0;
    }

    start() {
        this.isActive = true;
        this.game.clearAllUnits();
        console.log("\u2694\ufe0f \uc544\ub808\ub098\uc5d0 \uc624\uc2e0 \uac83\uc744 \ud658\uc601\ud569\ub2c8\ub2e4! AI \uc790\ub3d9 \ub300\ub825\uc744 \uc2dc\uc791\ud569\ub2c8\ub2e4.");
        this.game.showBattleMap();
        this.game.gameState.currentState = 'ARENA';
        this.nextRound();
    }

    stop() {
        this.isActive = false;
        this.game.showWorldMap();
        this.game.gameState.currentState = 'WORLD';
        console.log(`\ud83d\udc4b \uc544\ub808\ub098\ub97c \ub5a0\ub0a0\uae4c. \ucd1d ${this.roundCount} \ub77c\uc6b4\ub4dc\uc758 \ub370\uc774\ud130\uac00 \uae30\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`);
    }

    nextRound() {
        if (!this.isActive) return;
        this.roundCount++;
        console.log(`======== \ub77c\uc6b4\ub4dc ${this.roundCount} \uc2dc\uc791 ========`);
        this.game.clearAllUnits();
        fluctuationEngine.reset();
        this.spawnRandomTeam('A', 12, 100, 400);
        this.spawnRandomTeam('B', 12, 600, 900);
    }

    spawnRandomTeam(teamName, count, xMin, xMax) {
        const mbtiKeys = Object.keys(mbtiData);
        for (let i = 0; i < count; i++) {
            const randomMbti = mbtiKeys[Math.floor(Math.random() * mbtiKeys.length)];
            const unit = new Unit(
                `${teamName}-${randomMbti}-${i}`,
                teamName,
                randomMbti,
                { x: xMin + Math.random() * (xMax - xMin), y: Math.random() * 600 }
            );
            this.game.addUnit(unit);
        }
    }

    update(deltaTime) {
        if (!this.isActive) return;

        for (const unit of this.game.units) {
            unit.update(deltaTime, this.game.units);
        }

        const teamA_units = this.game.units.filter(u => u.team === 'A' && u.isAlive());
        const teamB_units = this.game.units.filter(u => u.team === 'B' && u.isAlive());
        let winner = null;
        if (teamA_units.length === 0 && teamB_units.length > 0) {
            winner = 'B';
        } else if (teamB_units.length === 0 && teamA_units.length > 0) {
            winner = 'A';
        }
        if (winner) {
            console.log(`\ud83c\udfc6 \ub77c\uc6b4\ub4dc ${this.roundCount} \uc885\ub8cc! \uc2b9\uc790: \ud300 ${winner}`);
            this.recordRoundResult(winner);
            this.nextRound();
        }
    }

    render(ctx) {
        if (!this.isActive) return;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        for (const unit of this.game.units) {
            unit.render(ctx);
        }
    }

    recordRoundResult(winner) {
        const matchData = {
            round: this.roundCount,
            winner: `Team ${winner}`,
            fluctuations: fluctuationEngine.getLog(),
        };
        dataRecorder.recordMatch(matchData);
    }
}

export { ArenaManager };
