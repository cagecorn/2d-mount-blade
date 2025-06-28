class Unit {
    constructor(id, team, mbti, position = { x: 0, y: 0 }) {
        this.id = id;
        this.team = team;
        this.mbti = mbti;
        this.x = position.x;
        this.y = position.y;
        this.radius = 20;
        this.hp = 100;
        this.speed = 40; // px per second
        this.attackRange = 25;
        this.attackCooldown = 0;
    }

    isAlive() {
        return this.hp > 0;
    }

    update(deltaTime, units) {
        if (!this.isAlive()) return;

        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
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
            nearest.hp -= 10;
            this.attackCooldown = 1; // 1 second cooldown
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
        ctx.fillText(Math.max(0, Math.floor(this.hp)), this.x, this.y);
        ctx.restore();
    }
}

export { Unit };
