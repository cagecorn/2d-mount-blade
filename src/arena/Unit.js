import { JOBS } from '../data/jobs.js';
import { SKILLS } from '../data/skills.js';
import { StatManager } from '../stats.js';
import { isImageLoaded } from '../utils/imageUtils.js';
import { MeleeAI, RangedAI, HealerAI, WizardAI } from '../ai.js';
import { DecisionEngine } from '../ai/engines/DecisionEngine.js';

class Unit {
    constructor(
        id,
        team,
        jobId,
        position = { x: 0, y: 0 },
        microItemAIManager = null,
        image = null,
        radius = 20,
        skills = [],
        projectileManager = null,
        eventManager = null,
        combatCalculator = null,
        movementManager = null,
        motionManager = null
    ) {
        this.id = id;
        this.team = team;
        this.jobId = jobId;
        this.x = position.x;
        this.y = position.y;
        // radius determines both the body circle and dotted sprite size
        this.radius = radius;
        this.image = image;

        this.kills = 0;
        this.equipment = {};

        const baseStats = JOBS[jobId]?.stats || {};
        // StatManager를 활용해 게임과 동일한 방식으로 스탯을 계산한다
        this.stats = new StatManager(this, baseStats);

        this.hp = this.stats.get('maxHp');
        this.speed = this.stats.get('movementSpeed') * 10; // 간단한 픽셀 환산
        this.attackRange = this.stats.get('attackRange') / 8; // 공격 사거리 축소
        this.attackPower = this.stats.get('attackPower');
        this.attackCooldown = 0;
        this.onAttack = null; // optional callback for attack handling
        this.tfController = null;
        this.projectileManager = projectileManager;
        this.microItemAIManager = microItemAIManager;
        this.eventManager = eventManager;
        this.combatCalculator = combatCalculator;
        this.movementManager = movementManager;
        this.motionManager = motionManager;
        this.decisionEngine = new DecisionEngine(eventManager);
        this.skillCooldowns = {};
        this.skills = skills;
        this.mp = 100;
        this.displayText = '';
        this.textTimer = 0;
        this.tileSize = this.radius * 2;
        this.roleAI = null;
        this.assignRoleAI();

        if (this.eventManager) {
            this._damageHandler = (data) => {
                if (data.attacker === this) {
                    this.eventManager.publish('arena_log', {
                        eventType: 'attack',
                        attackerId: data.attacker.id,
                        defenderId: data.defender.id,
                        damage: data.damage,
                        message: `${data.attacker.id} -> ${data.defender.id} (${data.damage})`
                    });
                }
            };
            this.eventManager.subscribe('damage_calculated', this._damageHandler);
        }
    }

    assignRoleAI() {
        const skillTags = this.skills
            .map(id => SKILLS[id]?.tags || [])
            .flat();

        if (this.jobId === 'wizard') {
            this.roleAI = new WizardAI();
        } else if (
            this.jobId === 'healer' ||
            skillTags.includes('healing')
        ) {
            this.roleAI = new HealerAI();
        } else if (
            this.jobId === 'archer' ||
            skillTags.includes('ranged')
        ) {
            this.roleAI = new RangedAI();
        } else {
            this.roleAI = new MeleeAI();
        }
        this.ai = this.roleAI;
    }

    getSkillAction(enemies) {
        if (!Array.isArray(this.skills)) return null;
        let nearest = null;
        let minDist = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minDist) { minDist = d; nearest = e; }
        }

        for (const id of this.skills) {
            const skill = SKILLS[id];
            if (!skill) continue;
            if ((this.skillCooldowns[id] || 0) > 0) continue;

            if (skill.tags?.includes('attack')) {
                const range = (skill.range || this.attackRange) / 8;
                if (nearest && minDist <= range) {
                    return { type: 'skill', skillId: id, target: nearest };
                }
            }

            if (skill.id === 'heal') {
                if (this.hp < this.stats.get('maxHp')) {
                    return { type: 'skill', skillId: id, target: this };
                }
            }
        }
        return null;
    }

    isAlive() {
        return this.hp > 0;
    }

    takeDamage(amount) {
        this.hp = Math.max(0, this.hp - amount);
    }

    update(deltaTime, units) {
        if (!this.isAlive()) return;

        this.currentUnits = units;

        if (this.textTimer > 0) this.textTimer -= deltaTime;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        for (const k of Object.keys(this.skillCooldowns)) {
            if (this.skillCooldowns[k] > 0) this.skillCooldowns[k] -= deltaTime;
        }

        const enemies = units.filter(u => u.team !== this.team && u.isAlive());
        if (enemies.length === 0) return;
        const allies = units.filter(u => u.team === this.team && u.isAlive() && u !== this);
        const context = {
            player: allies[0] || this,
            allies,
            enemies,
            mapManager: { tileSize: this.tileSize, isWallAt: () => false },
        };

        const weapon = this.equipment?.weapon;
        let weaponAction = null;
        if (weapon && this.microItemAIManager) {
            const weaponAI = this.microItemAIManager.getWeaponAI(weapon);
            if (weaponAI) {
                weaponAction = weaponAI.decideAction(this, weapon, { enemies });
            }
        }

        let aiAction = null;
        if (this.roleAI && typeof this.roleAI.decideAction === 'function') {
            aiAction = this.roleAI.decideAction(this, context);
        }

        if (this.tfController) {
            const hint = aiAction || weaponAction || this.getSkillAction(enemies);
            const action = this.tfController.decideAction(this, units, hint);
            if (action && action.type !== 'idle') {
                this.executeAction(action, deltaTime);
                return;
            }
        }

        let action = null;
        if (aiAction && aiAction.type !== 'idle') {
            action = aiAction;
        } else {
            const skillAction = this.getSkillAction(enemies);
            if (skillAction) {
                action = skillAction;
            } else if (weaponAction && weaponAction.type !== 'idle') {
                action = weaponAction;
            } else {
                let nearest = enemies[0];
                let minDist = Number.MAX_VALUE;
                for (const e of enemies) {
                    const dx = e.x - this.x;
                    const dy = e.y - this.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = e;
                    }
                }
                if (minDist > this.attackRange) {
                    const dirX = (nearest.x - this.x) / minDist;
                    const dirY = (nearest.y - this.y) / minDist;
                    action = { type: 'move', target: { x: this.x + dirX * this.speed * deltaTime, y: this.y + dirY * this.speed * deltaTime } };
                } else if (this.attackCooldown <= 0) {
                    action = { type: 'attack', target: nearest };
                }
            }
        }

        if (action) {
            if (this.decisionEngine) {
                const mbtiEngine = this.decisionEngine.mbtiEngine;
                if (mbtiEngine?.influenceAction) {
                    action = mbtiEngine.influenceAction(this, action, context);
                }
                if (this.decisionEngine.mistakeEngine?.getFinalAction) {
                    action = this.decisionEngine.mistakeEngine.getFinalAction(this, action, context, mbtiEngine);
                }
            }
            this.executeAction(action, deltaTime);
        }
    }

    executeAction(action, deltaTime) {
        if (!action) return;
        if (action.type === 'move') {
            if (action.target && this.movementManager) {
                const context = {
                    player: this,
                    mercenaryManager: { mercenaries: [] },
                    monsterManager: { monsters: this.currentUnits?.filter(u => u !== this) || [] }
                };
                this.movementManager.moveEntityTowards(this, action.target, context);
            } else if (action.target) {
                const dx = action.target.x - this.x;
                const dy = action.target.y - this.y;
                const dist = Math.hypot(dx, dy) || 1;
                this.x += (dx / dist) * this.speed * deltaTime;
                this.y += (dy / dist) * this.speed * deltaTime;
            } else if (typeof action.dx === 'number' && typeof action.dy === 'number') {
                this.x += action.dx * deltaTime;
                this.y += action.dy * deltaTime;
            }
        } else if (action.type === 'attack' && action.target && this.attackCooldown <= 0) {
            const target = action.target;
            if (!target.isAlive()) return;
            if (this.projectileManager && this.jobId === 'archer') {
                this.projectileManager.create(this, target, { projectile: 'arrow', damage: this.attackPower });
            }
            if (this.combatCalculator) {
                this.combatCalculator.handleAttack({ attacker: this, defender: target, skill: null });
            } else if (this.onAttack) {
                this.onAttack({ attacker: this, defender: target, damage: this.attackPower });
            } else {
                const prevHp = target.hp;
                target.hp -= this.attackPower;
                if (prevHp > 0 && target.hp <= 0) this.kills++;
            }
            this.attackCooldown = 1;
        } else if (action.type === 'weapon_skill' && action.target && this.attackCooldown <= 0) {
            const target = action.target;
            if (!target.isAlive()) return;
            if (this.combatCalculator) {
                this.combatCalculator.handleAttack({ attacker: this, defender: target, skill: null });
            } else if (this.onAttack) {
                this.onAttack({ attacker: this, defender: target, damage: this.attackPower });
            } else {
                const prevHp = target.hp;
                target.hp -= this.attackPower;
                if (prevHp > 0 && target.hp <= 0) this.kills++;
            }
            this.attackCooldown = 1;
            if (action.skillId) this.skillCooldowns[action.skillId] = 30;
        } else if (action.type === 'skill') {
            const skill = SKILLS[action.skillId];
            if (!skill) return;
            this.skillCooldowns[action.skillId] = skill.cooldown || 30;
            this.displayText = skill.name;
            this.textTimer = 60;
            const target = action.target || this;
            if (skill.tags?.includes('attack') && target) {
                if (skill.projectile && this.projectileManager) {
                    this.projectileManager.create(this, target, skill);
                } else {
                    const prevHp = target.hp;
                    target.hp -= skill.damage || this.attackPower;
                    if (prevHp > 0 && target.hp <= 0) this.kills++;
                }
            } else if (skill.id === 'heal') {
                const amount = skill.healAmount || 10;
                target.hp = Math.min(target.hp + amount, target.stats?.get?.('maxHp') || target.hp + amount);
            }
        }
    }

    render(ctx) {
        ctx.save();
        if (isImageLoaded(this.image)) {
            ctx.drawImage(
                this.image,
                this.x - this.radius,
                this.y - this.radius,
                this.radius * 2,
                this.radius * 2
            );
        } else {
            ctx.fillStyle = this.team === 'A' ? 'red' : 'blue';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const job = JOBS[this.jobId]?.name || this.jobId;
        const prefix = this.tfController ? '[TF] ' : '';
        const text = `${prefix}${job} ${Math.max(0, Math.floor(this.hp))} K:${this.kills}`;
        ctx.fillText(text, this.x, this.y);
        if (this.textTimer > 0 && this.displayText) {
            ctx.fillStyle = 'yellow';
            ctx.fillText(this.displayText, this.x, this.y - this.radius - 10);
        }
        ctx.restore();
    }
}

export { Unit };
