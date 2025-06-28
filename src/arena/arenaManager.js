import { dataRecorder } from '../managers/dataRecorder.js';
import { fluctuationEngine } from '../managers/ai/FluctuationEngine.js';
import { Unit } from './Unit.js';
import { JOBS } from '../data/jobs.js';
import { WebGPUArenaRenderer } from '../renderers/webgpuArenaRenderer.js';

class ArenaManager {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.roundCount = 0;
        this.webgpuRenderer = new WebGPUArenaRenderer(this.game.battleCanvas);
        this.webgpuRenderer.init();
        try {
            this.combatWorker = new Worker('src/workers/combatWorker.js', { type: 'module' });
        } catch (e) {
            this.combatWorker = null;
        }
        if (this.combatWorker) {
            this.combatWorker.onmessage = (e) => {
                if (e.data.type === 'attackResult') {
                    const target = this.game.units.find(u => u.id === e.data.defenderId);
                    if (target) {
                        target.hp = e.data.remainingHp;
                    }
                }
            };
        }
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
        if (this.game?.eventManager) {
            const snapshot = this.game.units.map(u => ({
                id: u.id,
                team: u.team,
                hp: u.hp,
                attackPower: u.attackPower,
                defense: u.defense,
            }));
            this.game.eventManager.publish('arena_round_start', {
                round: this.roundCount,
                units: snapshot,
            });
        }
        if (this.combatWorker) {
            this.combatWorker.postMessage({ type: 'init', data: this.game.units.map(u => ({ id: u.id, hp: u.hp })) });
        }
    }

    spawnRandomTeam(teamName, count, xMin, xMax) {
        const jobKeys = Object.keys(JOBS).filter(j => j !== 'fire_god');
        for (let i = 0; i < count; i++) {
            const jobId = jobKeys[Math.floor(Math.random() * jobKeys.length)];
            const unit = new Unit(
                `${teamName}-${jobId}-${i}`,
                teamName,
                jobId,
                { x: xMin + Math.random() * (xMax - xMin), y: Math.random() * 600 }
            );
            unit.onAttack = ({ attacker, defender, damage }) => {
                if (this.combatWorker) {
                    this.combatWorker.postMessage({ type: 'attack', data: { attackerId: attacker.id, defenderId: defender.id, attackPower: damage } });
                }
            };
            this.game.addUnit(unit);
        }
    }

    update(deltaTime) {
        if (!this.isActive) return;

        for (const unit of this.game.units) {
            unit.update(deltaTime, this.game.units);
        }
        if (this.combatWorker) {
            this.combatWorker.postMessage({ type: 'updateUnits', data: this.game.units.map(u => ({ id: u.id, hp: u.hp })) });
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
        if (this.webgpuRenderer && this.webgpuRenderer.device) {
            this.webgpuRenderer.render(this.game.units);
            return;
        }
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
        if (this.game?.eventManager) {
            this.game.eventManager.publish('arena_round_end', { round: this.roundCount, winner });
            this.game.eventManager.publish('arena_log', { eventType: 'round_end', data: matchData });
        }
    }
}

export { ArenaManager };
