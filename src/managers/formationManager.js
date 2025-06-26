export class FormationManager {
    constructor(rows = 5, cols = 5, tileSize = 192, orientation = 'LEFT', rotation = 0) {
        // sanitize parameters to avoid invalid array length errors
        this.rows = Math.max(1, Math.floor(Number(rows) || 5));
        this.cols = Math.max(1, Math.floor(Number(cols) || 5));
        this.tileSize = tileSize;
        this.orientation = orientation; // LEFT or RIGHT
        this.rotation = rotation; // radian angle to rotate grid positions
        this.slots = Array.from({ length: this.rows * this.cols }, () => new Set());
    }

    resize(rows, cols) {
        this.rows = Math.max(1, Math.floor(Number(rows) || this.rows));
        this.cols = Math.max(1, Math.floor(Number(cols) || this.cols));
        this.slots = Array.from({ length: this.rows * this.cols }, () => new Set());
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
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            return { x: 0, y: 0 };
        }
        const row = Math.floor(slotIndex / this.cols);
        const col = slotIndex % this.cols;

        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        const orientationMultiplier = this.orientation === 'RIGHT' ? -1 : 1;

        const relativeX = (col - centerCol) * this.tileSize * orientationMultiplier;
        const relativeY = (row - centerRow) * this.tileSize;
        const cos = Math.cos(this.rotation);
        const sin = Math.sin(this.rotation);
        const rotatedX = relativeX * cos - relativeY * sin;
        const rotatedY = relativeX * sin + relativeY * cos;

        return { x: rotatedX, y: rotatedY };
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

