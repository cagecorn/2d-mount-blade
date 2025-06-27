import { FormationLayoutEngine } from '../engines/formationLayoutEngine.js';

export class FormationManager {
    constructor(rows = 5, cols = 5, tileSize = 192, orientation = 'LEFT', rotation = 0) {
        this.rows = Math.max(1, Math.floor(Number(rows) || 5));
        this.cols = Math.max(1, Math.floor(Number(cols) || 5));
        this.slots = Array.from({ length: this.rows * this.cols }, () => new Set());
        this.layoutEngine = new FormationLayoutEngine({ rows: this.rows, cols: this.cols, tileSize, orientation, rotation });
    }

    resize(rows, cols) {
        this.rows = Math.max(1, Math.floor(Number(rows) || this.rows));
        this.cols = Math.max(1, Math.floor(Number(cols) || this.cols));
        this.slots = Array.from({ length: this.rows * this.cols }, () => new Set());
        this.layoutEngine = new FormationLayoutEngine({ ...this.layoutEngine, rows: this.rows, cols: this.cols });
    }

    assign(slotIndex, entityId) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) return;
        this.slots.forEach(set => set.delete(entityId));
        this.slots[slotIndex].add(entityId);
    }

    findSlotIndex(entityId) {
        return this.slots.findIndex(set => set.has(entityId));
    }

    getSlotPosition(slotIndex) {
        return this.layoutEngine.getSlotPosition(slotIndex);
    }

    apply(origin, entityMap) {
        this.slots.forEach((set, idx) => {
            if (!set) return;
            const off = this.getSlotPosition(idx);
            set.forEach(id => {
                const ent = entityMap[id];
                if (ent) {
                    ent.x = origin.x + off.x;
                    ent.y = origin.y + off.y;
                }
            });
        });
    }
}

