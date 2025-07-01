import { dataRecorder } from '../managers/dataRecorder.js';
import { Unit } from './Unit.js';
import { JOBS } from '../data/jobs.js';
import { ITEMS } from '../data/items.js';
import { SKILLS } from '../data/skills.js';
import { MapManager } from '../map.js';
import { ProjectileManager } from '../managers/projectileManager.js';

class ArenaManager {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.roundCount = 0;
        this.combatCalculator = game.combatCalculator;
        this.movementManager = game.movementManager;
        this.motionManager = game.motionManager;
        this.projectileManager = null;
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
                        const wasAlive = target.hp > 0;
                        target.hp = e.data.remainingHp;
                        const attacker = this.game.units.find(u => u.id === e.data.attackerId);
                        if (this.game?.eventManager) {
                            this.game.eventManager.publish('arena_log', {
                                eventType: 'attack',
                                attackerId: e.data.attackerId,
                                defenderId: e.data.defenderId,
                                damage: e.data.damage,
                                message: `${attacker?.id || 'unknown'} -> ${target.id} (${e.data.damage})`
                            });
                        }
                        if (wasAlive && target.hp <= 0) {
                            const killer = attacker;
                            if (killer) killer.kills++;
                            if (this.game?.eventManager) {
                                this.game.eventManager.publish('arena_log', {
                                    eventType: 'unit_death',
                                    unitId: target.id,
                                    message: `${target.id} 사망`
                                });
                            }
                        }
                    }
                }
            };
        }
    }

    start() {
        this.isActive = true;
        if (this.game.gameLoop) this.game.gameLoop.timeScale = 5;
        this.prevMapManager = this.game.mapManager;
        this.game.mapManager = new MapManager();
        // reset camera for arena
        if (this.game.gameState) {
            this.game.gameState.camera = { x: 0, y: 0 };
            this.game.gameState.zoomLevel = 1;
        }
        if (this.game.cameraDrag) {
            this.game.cameraDrag.followPlayer = false;
        }
        if (this.game.pathfindingManager) {
            this.game.pathfindingManager.mapManager = this.game.mapManager;
        }
        if (this.game.motionManager) {
            this.game.motionManager.mapManager = this.game.mapManager;
        }
        if (this.game.movementManager) {
            this.game.movementManager.mapManager = this.game.mapManager;
        }
        this.projectileManager = new ProjectileManager(
            this.game.eventManager,
            this.game.assets,
            this.game.vfxManager,
            this.game.knockbackEngine
        );
        this.game.clearAllUnits();
        if (this.game.uiManager?.hidePanel) {
            this.game.uiManager.hidePanel('squad-management-ui');
        }
        console.log("\u2694\ufe0f \uc544\ub808\ub098\uc5d0 \uc624\uc2e0 \uac83\uc744 \ud658\uc601\ud569\ub2c8\ub2e4! AI \uc790\ub3d9 \ub300\ub825\uc744 \uc2dc\uc791\ud569\ub2c8\ub2e4.");
        this.game.showArenaMap();
        this.nextRound();
    }

    stop() {
        this.isActive = false;
        if (this.game.gameLoop) this.game.gameLoop.timeScale = 1;
        if (this.prevMapManager) {
            this.game.mapManager = this.prevMapManager;
            if (this.game.pathfindingManager) {
                this.game.pathfindingManager.mapManager = this.game.mapManager;
            }
            if (this.game.motionManager) {
                this.game.motionManager.mapManager = this.game.mapManager;
            }
            if (this.game.movementManager) {
                this.game.movementManager.mapManager = this.game.mapManager;
            }
            this.prevMapManager = null;
        }
        this.projectileManager = null;
        this.game.showWorldMap();
        console.log(`\ud83d\udc4b \uc544\ub808\ub098\ub97c \ub5a0\ub0a0\uae4c. \ucd1d ${this.roundCount} \ub77c\uc6b4\ub4dc\uc758 \ub370\uc774\ud130\uac00 \uae30\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`);
    }

    async nextRound() {
        if (!this.isActive) return;
        this.roundCount++;
        console.log(`======== \ub77c\uc6b4\ub4dc ${this.roundCount} \uc2dc\uc791 ========`);
        this.game.clearAllUnits();
        if (this.game?.eventManager) {
            this.game.eventManager.publish('arena_log', {
                eventType: 'round_start',
                round: this.roundCount,
                message: `Round ${this.roundCount} 시작`
            });
        }
        // 1. 양 팀 유닛을 먼저 생성합니다.
        const mapWidth = this.game.mapManager.width * this.game.mapManager.tileSize;
        const buffer = this.game.mapManager.tileSize * 2;
        const mid = mapWidth / 2;
        this.spawnRandomTeam('A', 12, buffer, mid - buffer);
        this.spawnRandomTeam('B', 12, mid + buffer, mapWidth - buffer);

        // ✅ 2. requestAnimationFrame을 제거하고 컨트롤러를 즉시 할당합니다.
        if (this.game.arenaTensorFlowManager) {
            try {
                console.log("TensorFlow 컨트롤러 할당을 시작합니다...");
                await this.game.arenaTensorFlowManager.assignControllers(this.game.units);
                console.log("유닛들에게 AI 컨트롤러를 직접 할당했습니다.");
            } catch (error) {
                console.error("TensorFlow 컨트롤러 할당 중 오류 발생:", error);
            }
        }

        // 3. 나머지 라운드 시작 로직을 실행합니다.
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
        const skillKeys = Object.keys(SKILLS);
        const units = this.game.units;
        const tileSize = this.game.mapManager?.tileSize || 40;
        const spacing = tileSize; // 패치 전보다 넓고 최근 패치보다 좁은 간격

        for (let i = 0; i < count; i++) {
            const jobId = jobKeys[Math.floor(Math.random() * jobKeys.length)];
            const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
                ? crypto.randomUUID()
                : Math.random().toString(36).slice(2);
            const image = this.game.assets?.[jobId] || null;
            const skillId = skillKeys[Math.floor(Math.random() * skillKeys.length)];

            let x, y, attempts = 0;
            const maxAttempts = 30;
            do {
                x = xMin + Math.random() * (xMax - xMin);
                const mapHeight = this.game.mapManager.height * this.game.mapManager.tileSize;
                const yMin = spacing;
                const yMax = mapHeight - spacing;
                y = yMin + Math.random() * (yMax - yMin);
                attempts++;
            } while (
                attempts < maxAttempts &&
                units.some(u => Math.hypot(u.x - x, u.y - y) < spacing)
            );

            const unit = new Unit(
                id,
                teamName,
                jobId,
                { x, y },
                this.game.microItemAIManager,
                image,
                this.game.mapManager?.tileSize ? this.game.mapManager.tileSize / 2 : 20,
                [skillId],
                this.projectileManager,
                this.game.eventManager,
                this.combatCalculator,
                this.movementManager,
                this.motionManager
            );
            unit.skillCooldowns[skillId] = 0;
            unit.onAttack = ({ attacker, defender, damage }) => {
                if (this.combatWorker) {
                    this.combatWorker.postMessage({ type: 'attack', data: { attackerId: attacker.id, defenderId: defender.id, attackPower: damage } });
                }
                if (this.game?.eventManager) {
                    this.game.eventManager.publish('arena_log', {
                        eventType: 'attack',
                        attackerId: attacker.id,
                        defenderId: defender.id,
                        damage,
                        message: `${attacker.id} -> ${defender.id} (${damage})`
                    });
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
        if (this.projectileManager) {
            this.projectileManager.update(this.game.units);
        }
        if (this.combatWorker) {
            this.combatWorker.postMessage({ type: 'updateUnits', data: this.game.units.map(u => ({ id: u.id, hp: u.hp })) });
        }

        const teamA_units = this.game.units.filter(
            u => u.team === 'A' && (typeof u.isAlive === 'function' ? u.isAlive() : u.hp > 0)
        );
        const teamB_units = this.game.units.filter(
            u => u.team === 'B' && (typeof u.isAlive === 'function' ? u.isAlive() : u.hp > 0)
        );
        let winner = null;
        if (teamA_units.length === 0 && teamB_units.length > 0) {
            winner = 'B';
        } else if (teamB_units.length === 0 && teamA_units.length > 0) {
            winner = 'A';
        } else if (teamA_units.length === 0 && teamB_units.length === 0) {
            winner = 'DRAW';
        }
        if (winner) {
            console.log(`\ud83c\udfc6 \ub77c\uc6b4\ub4dc ${this.roundCount} \uc885\ub8cc! \uc2b9\uc790: \ud300 ${winner}`);
            this.recordRoundResult(winner);
            this.nextRound();
        }
    }

    render(contexts, mapManager, assets) {
        if (!this.isActive) return;
        const { camera, zoomLevel } = this.game.gameState;
        for (const key in contexts) {
            const ctx = contexts[key];
            if (ctx.save) {
                ctx.save();
                ctx.scale(zoomLevel, zoomLevel);
                ctx.translate(-camera.x, -camera.y);
            }
        }

        mapManager.render(contexts.mapBase, contexts.mapDecor, assets);
        for (const unit of this.game.units) {
            unit.render(contexts.entity);
        }
        if (this.projectileManager) {
            this.projectileManager.render(contexts.vfx || contexts.entity);
        }

        for (const key in contexts) {
            const ctx = contexts[key];
            if (ctx.restore) ctx.restore();
        }
    }

    recordRoundResult(winner) {
        const matchData = {
            round: this.roundCount,
            winner: `Team ${winner}`,
        };

        const { best, worst, bestReason, worstReason } = this.getBestAndWorstUnits();
        const snapshot = this.game.units.map(u => ({
            id: u.id,
            team: u.team,
            hp: u.hp,
            attackPower: u.attackPower,
            defense: u.defense,
        }));

        dataRecorder.recordMatch(matchData);
        if (this.game?.eventManager) {
            this.game.eventManager.publish('arena_round_end', {
                round: this.roundCount,
                winner,
                bestUnit: best,
                worstUnit: worst,
                bestReason,
                worstReason,
                units: snapshot,
            });
            this.game.eventManager.publish('arena_log', {
                eventType: 'round_end',
                data: matchData,
                message: `Round ${this.roundCount} 종료 - 승자: ${winner}`
            });
        }
    }

    calculateSynergy(unit) {
        const teammates = this.game.units.filter(u => u.team === unit.team && u !== unit);
        const myKeys = [];
        for (const item of Object.values(unit.equipment)) {
            if (item?.synergies) myKeys.push(...item.synergies);
        }
        const unique = [...new Set(myKeys)];
        let score = 0;
        for (const key of unique) {
            if (teammates.some(t => Object.values(t.equipment).some(it => it?.synergies?.includes(key)))) {
                score++;
            }
        }
        return score;
    }

    getBestAndWorstUnits() {
        const alive = this.game.units;
        if (alive.length === 0) return { best: null, worst: null, bestReason: '', worstReason: '' };
        let best = alive[0];
        let worst = alive[0];
        let bestScore = -Infinity;
        let worstScore = Infinity;
        let bestReason = '';
        let worstReason = '';

        for (const u of alive) {
            const synergy = this.calculateSynergy(u);
            const score = u.kills * 10 + synergy;
            if (score > bestScore) {
                bestScore = score;
                best = u;
                bestReason = `kills:${u.kills}, synergy:${synergy}`;
            }
            if (score < worstScore) {
                worstScore = score;
                worst = u;
                worstReason = `kills:${u.kills}, synergy:${synergy}`;
            }
        }

        return { best, worst, bestReason, worstReason };
    }
}

export { ArenaManager };
