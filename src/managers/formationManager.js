import { eventManager } from './eventManager.js';

class FormationManager {
    constructor(cols, rows, tileSize) {
        this.cols = cols;
        this.rows = rows;
        this.tileSize = tileSize;
        this.slots = new Array(cols * rows).fill(null);

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

    getSlotPosition(index) {
        const x = (index % this.cols) * this.tileSize;
        const y = Math.floor(index / this.cols) * this.tileSize;
        return { x, y };
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
