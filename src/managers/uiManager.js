// src/managers/uiManager.js

export class UIManager {
    constructor(eventManager, entityManager) {
        this.eventManager = eventManager;
        this.entityManager = entityManager;
        this.squads = [];
        this.formationManager = null;

        this.eventManager.subscribe('squads_updated', this.handleSquadsUpdate.bind(this));
        this.eventManager.subscribe('formation_updated', this.handleFormationUpdate.bind(this));
    }

    handleSquadsUpdate({ squads }) {
        this.squads = squads;
        this.renderSquadList();
    }

    handleFormationUpdate({ formationManager }) {
        this.formationManager = formationManager;
        this.renderFormationGrid();
    }

    renderSquadList() {
        const squadList = document.getElementById('squad-list');
        if (!squadList) return;
        squadList.innerHTML = '';

        this.squads.forEach(squad => {
            const squadEl = document.createElement('div');
            squadEl.className = 'squad-item';
            squadEl.textContent = squad.name;
            squadEl.draggable = true;
            squadEl.dataset.squadId = squad.id;

            squadEl.addEventListener('dragstart', e => {
                // 분대 전체를 드래그할 때의 로직 (현재는 리더만 대표로)
                const leaderId = squad.leaderId;
                e.dataTransfer.setData('text/plain', `entity:${leaderId}`);
            });

            squadList.appendChild(squadEl);
        });
    }

    renderFormationGrid() {
        const grid = document.getElementById('formation-grid');
        if (!grid || !this.formationManager) return;
        grid.innerHTML = '';

        const { rows, cols, slots } = this.formationManager;

        for (let i = 0; i < rows * cols; i++) {
            const cell = document.createElement('div');
            cell.className = 'formation-cell';
            cell.dataset.index = i;

            const entityIds = Array.from(slots[i] || []);
            if (entityIds.length > 0) {
                entityIds.forEach(id => {
                    const entity = this.entityManager.getEntity(id);
                    if (entity) {
                        const portrait = this.createPortrait(entity);
                        cell.appendChild(portrait);
                    }
                });
            } else {
                cell.textContent = i + 1; // 빈 슬롯 번호 표시
            }

            this.addDropHandler(cell);
            grid.appendChild(cell);
        }
    }

    createPortrait(entity) {
        const portrait = document.createElement('div');
        portrait.className = 'merc-portrait';
        portrait.textContent = entity.name.substring(0, 1) || 'U'; // 이름 첫 글자
        portrait.title = entity.name;
        portrait.draggable = true;
        portrait.dataset.entityId = entity.id;

        portrait.addEventListener('dragstart', e => {
            e.stopPropagation();
            e.dataTransfer.setData('text/plain', `entity:${entity.id}`);
        });

        return portrait;
    }
    
    addDropHandler(cell) {
        cell.addEventListener('dragover', e => e.preventDefault());
        cell.addEventListener('drop', e => {
            e.preventDefault();
            const data = e.dataTransfer.getData('text/plain');
            const targetIndex = parseInt(cell.dataset.index, 10);

            if (data.startsWith('entity:')) {
                const entityId = data.split(':')[1];
                this.eventManager.publish('formation_assign_request', { entityId, slotIndex: targetIndex });
            }
        });
    }
}
