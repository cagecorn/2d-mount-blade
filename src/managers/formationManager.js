import { eventManager } from './eventManager.js';

class FormationManager {
    constructor(cols = 5, rows = 5, tileSize = 64, orientation = 'LEFT') {
        this.cols = Math.max(1, Math.floor(cols));
        this.rows = Math.max(1, Math.floor(rows));
        this.tileSize = tileSize;
        this.orientation = orientation; // LEFT or RIGHT
        this.slots = new Array(this.cols * this.rows).fill(null);

        eventManager.subscribe('formation_assign_request', this.handleAssignSquad.bind(this));
    }

    handleAssignSquad({ squadId, slotIndex }) {
        const existingIndex = this.slots.findIndex(s => s && s.id === squadId);
        if (existingIndex > -1) {
            this.slots[existingIndex] = null;
        }
        this.slots[slotIndex] = { id: squadId };
        console.log(`${squadId} 분대를 슬롯 ${slotIndex}에 배치 요청`);
        eventManager.publish('formation_data_changed', { slots: this.slots });
    }

    assign(slotIndex, squadId) {
        this.handleAssignSquad({ squadId, slotIndex });
    }

    getSlotPosition(slotIndex) {
        if (slotIndex < 0 || slotIndex >= this.slots.length) {
            return { x: 0, y: 0 };
        }
        const row = Math.floor(slotIndex / this.cols);
        const col = slotIndex % this.cols;

        const centerRow = Math.floor(this.rows / 2);
        const centerCol = Math.floor(this.cols / 2);
        const orientationMult = this.orientation === 'RIGHT' ? -1 : 1;

        const relativeX = (col - centerCol) * this.tileSize * orientationMult;
        const relativeY = (row - centerRow) * this.tileSize;
        return { x: relativeX, y: relativeY };
    }

    apply(origin, entityMap, squadManager) {
        this.slots.forEach((squadData, idx) => {
            if (!squadData) return;
            const squad = squadManager.getSquad(squadData.id);
            if (!squad || !squad.members) return;
            const basePos = this.getSlotPosition(idx);
            squad.members.forEach(entityId => {
                const ent = entityMap[entityId];
                if (ent) {
                    const randomOffsetX = (Math.random() - 0.5) * this.tileSize * 0.8;
                    const randomOffsetY = (Math.random() - 0.5) * this.tileSize * 0.8;
                    ent.x = origin.x + basePos.x + randomOffsetX;
                    ent.y = origin.y + basePos.y + randomOffsetY;
                }
            });
        });
    }
}

export { FormationManager };
