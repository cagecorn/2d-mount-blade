import tfLoader from '../utils/tf-loader.js';

export class TensorFlowController {
    constructor(tf = null) {
        this.tf = tf;
    }

    async init() {
        if (!this.tf) {
            await tfLoader.init();
            this.tf = tfLoader.getTf();
        }
    }

    decideAction(unit, units, hint = null) {
        const enemies = units.filter(u => u.team !== unit.team && u.isAlive());
        if (enemies.length === 0) return { type: 'idle' };
        let nearest = enemies[0];
        let minD = Infinity;
        for (const e of enemies) {
            const d = Math.hypot(e.x - unit.x, e.y - unit.y);
            if (d < minD) { minD = d; nearest = e; }
        }
        if (minD <= unit.attackRange) {
            return { type: 'attack', target: nearest };
        }
        const dirX = (nearest.x - unit.x) / minD;
        const dirY = (nearest.y - unit.y) / minD;
        const baseAction = { type: 'move', dx: dirX * unit.speed, dy: dirY * unit.speed };
        if (hint && hint.type && hint.type !== 'idle') {
            // follow hint when our base action is idle-like
            return hint;
        }
        return baseAction;
    }
}
