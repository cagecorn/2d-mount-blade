// src/managers/formationManager.js

export class FormationManager {
    constructor(eventManager, rows = 5, cols = 5, tileSize = 192, orientation = 'LEFT', rotation = 0) {
        this.eventManager = eventManager;
        this.rows = Math.max(1, Math.floor(Number(rows) || 5));
        this.cols = Math.max(1, Math.floor(Number(cols) || 5));
        this.tileSize = tileSize;
        this.orientation = orientation; // LEFT or RIGHT
        this.rotation = rotation;
        this.slots = Array.from({ length: this.rows * this.cols }, () => new Set());

        this.eventManager.subscribe('formation_assign_request', this.handleAssignment.bind(this));
    }

    handleAssignment({ entityId, squadId, slotIndex }) {
        if (entityId) {
            this.assign(entityId, slotIndex);
        } else if (squadId) {
            // 분대 전체를 할당하는 로직 (필요시 구현)
            console.log(`Squad ${squadId} assignment to slot ${slotIndex} requested.`);
        }
    }
    
    assign(entityId, slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            console.error(`Invalid slot index: ${slotIndex}`);
            return;
        }

        this.remove(entityId); // 기존 위치에서 유닛 제거
        this.slots[slotIndex].add(entityId);
        
        console.log(`Assigned entity ${entityId} to slot ${slotIndex}`);
        this.eventManager.publish('formation_updated', { formationManager: this });
    }

    remove(entityId) {
        for (const slot of this.slots) {
            if (slot.has(entityId)) {
                slot.delete(entityId);
                return;
            }
        }
    }

    getSlotPosition(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            return { x: 0, y: 0 };
        }
        const row = Math.floor(slotIndex / this.cols);
        const col = slotIndex % this.cols;

        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        
        let orientedCol = this.orientation === 'RIGHT' ? (this.cols - 1 - col) : col;

        const relativeX = (orientedCol - centerCol) * this.tileSize;
        const relativeY = (row - centerRow) * this.tileSize;

        const cosR = Math.cos(this.rotation);
        const sinR = Math.sin(this.rotation);
        const rotatedX = relativeX * cosR - relativeY * sinR;
        const rotatedY = relativeX * sinR + relativeY * cosR;

        return { x: rotatedX, y: rotatedY };
    }

    getSlotIndex(entityId) {
        return this.slots.findIndex(slot => slot.has(entityId));
    }
}
