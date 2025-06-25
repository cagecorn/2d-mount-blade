export class MeleeAI {
    constructor(owner, targets = []) {
        this.owner = owner;
        this.targets = targets;
    }

    update(dt) {
        if (!this.targets.length) return;
        let nearest = null;
        let dist = Infinity;
        this.targets.forEach(t => {
            const d = Math.hypot(t.x - this.owner.x, t.y - this.owner.y);
            if (d < dist) {
                dist = d;
                nearest = t;
            }
        });
        if (nearest) {
            const angle = Math.atan2(nearest.y - this.owner.y, nearest.x - this.owner.x);
            this.owner.x += Math.cos(angle) * this.owner.speed * dt * 60;
            this.owner.y += Math.sin(angle) * this.owner.speed * dt * 60;
        }
    }
}

export class RangedAI extends MeleeAI {
    update(dt) {
        if (!this.targets.length) return;
        let nearest = null;
        let dist = Infinity;
        this.targets.forEach(t => {
            const d = Math.hypot(t.x - this.owner.x, t.y - this.owner.y);
            if (d < dist) {
                dist = d;
                nearest = t;
            }
        });
        if (!nearest) return;
        const desired = 200;
        if (dist < desired) {
            const angle = Math.atan2(this.owner.y - nearest.y, this.owner.x - nearest.x);
            this.owner.x += Math.cos(angle) * this.owner.speed * dt * 60;
            this.owner.y += Math.sin(angle) * this.owner.speed * dt * 60;
        } else if (dist > desired + 10) {
            const angle = Math.atan2(nearest.y - this.owner.y, nearest.x - this.owner.x);
            this.owner.x += Math.cos(angle) * this.owner.speed * dt * 60;
            this.owner.y += Math.sin(angle) * this.owner.speed * dt * 60;
        }
    }
}
