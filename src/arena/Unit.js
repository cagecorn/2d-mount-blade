import { JOBS } from '../data/jobs.js';
import { StatManager } from '../stats.js';

class Unit {
    constructor(id, team, jobId, position = { x: 0, y: 0 }, microItemAIManager = null) {
        this.id = id;
        this.team = team;
        this.jobId = jobId;
        this.x = position.x;
        this.y = position.y;
        this.radius = 20;

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
        this.microItemAIManager = microItemAIManager;
        this.skillCooldowns = {};
    }

    isAlive() {
        return this.hp > 0;
    }

    update(deltaTime, units) {
        if (!this.isAlive()) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
        for (const k of Object.keys(this.skillCooldowns)) {
            if (this.skillCooldowns[k] > 0) this.skillCooldowns[k] -= deltaTime;
        }

        const enemies = units.filter(u => u.team !== this.team && u.isAlive());
        if (enemies.length === 0) return;

        const weapon = this.equipment?.weapon;
        let weaponAction = null;
        if (weapon && this.microItemAIManager) {
            const weaponAI = this.microItemAIManager.getWeaponAI(weapon);
            if (weaponAI) {
                weaponAction = weaponAI.decideAction(this, weapon, { enemies });
            }
        }

        if (this.tfController) {
            const action = this.tfController.decideAction(this, units, weaponAction);
            if (action && action.type !== 'idle') {
                this.executeAction(action, deltaTime);
                return;
            }
        }

        if (weaponAction && weaponAction.type !== 'idle') {
            this.executeAction(weaponAction, deltaTime);
            return;
        }

        const enemies = units.filter(u => u.team !== this.team && u.isAlive());
        if (enemies.length === 0) return;

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
            this.x += dirX * this.speed * deltaTime;
            this.y += dirY * this.speed * deltaTime;
        } else if (this.attackCooldown <= 0) {
            this.executeAction({ type: 'attack', target: nearest }, deltaTime);
        }
    }

    executeAction(action, deltaTime) {
        if (!action) return;
        if (action.type === 'move' && action.target) {
            const dx = action.target.x - this.x;
            const dy = action.target.y - this.y;
            const dist = Math.hypot(dx, dy) || 1;
            this.x += (dx / dist) * this.speed * deltaTime;
            this.y += (dy / dist) * this.speed * deltaTime;
        } else if (action.type === 'attack' && action.target && this.attackCooldown <= 0) {
            const target = action.target;
            if (!target.isAlive()) return;
            if (this.onAttack) {
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
            if (this.onAttack) {
                this.onAttack({ attacker: this, defender: target, damage: this.attackPower });
            } else {
                const prevHp = target.hp;
                target.hp -= this.attackPower;
                if (prevHp > 0 && target.hp <= 0) this.kills++;
            }
            this.attackCooldown = 1;
            if (action.skillId) this.skillCooldowns[action.skillId] = 30;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.fillStyle = this.team === 'A' ? 'red' : 'blue';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const job = JOBS[this.jobId]?.name || this.jobId;
        const prefix = this.tfController ? '[TF] ' : '';
        const text = `${prefix}${job} ${Math.max(0, Math.floor(this.hp))} K:${this.kills}`;
        ctx.fillText(text, this.x, this.y);
        ctx.restore();
    }
}

export { Unit };
