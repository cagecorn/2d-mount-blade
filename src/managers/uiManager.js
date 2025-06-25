import { eventManager } from './eventManager.js';

class UIManager {
    constructor() {
        this.squadManagementUI = document.getElementById('squad-management');
        this.formationGridUI = document.getElementById('formation-grid');
        this.allEntities = [];

        eventManager.subscribe('squad_data_changed', ({ squads }) => {
            this.renderSquadUI(squads);
        });

        eventManager.subscribe('formation_data_changed', ({ slots }) => {
            this.renderFormationUI(slots);
        });

        eventManager.subscribe('game_state_changed', this.handleGameStateChange.bind(this));
    }

    handleGameStateChange(state) {
        if (!this.squadManagementUI || !this.formationGridUI) return;
        this.squadManagementUI.style.display = state === 'FORMATION_SETUP' ? 'block' : 'none';
        this.formationGridUI.style.display = state === 'FORMATION_SETUP' ? 'grid' : 'none';
    }

    createSquadManagementUI(entities, squads) {
        this.allEntities = entities;
        if (!this.squadManagementUI) return;
        this.squadManagementUI.innerHTML = '<h2>분대 편성</h2>';

        const unassignedContainer = this.createDroppableContainer('unassigned', '미할당');
        this.squadManagementUI.appendChild(unassignedContainer);

        squads.forEach(squad => {
            const squadContainer = this.createDroppableContainer(squad.id, squad.name, 'squad-container');
            this.squadManagementUI.appendChild(squadContainer);
        });

        this.renderSquadUI(squads);
    }

    renderSquadUI(squads) {
        const allEntities = this.allEntities || [];
        document.querySelectorAll('.squad-container, #unassigned-container').forEach(c => {
            c.innerHTML = `<h3>${c.dataset.name}</h3>`;
        });

        allEntities.forEach(entity => {
            const entityEl = this.createDraggableEntity(entity);
            let parentId = 'unassigned-container';
            for (const squad of squads) {
                if (squad.members.has(entity.id)) {
                    parentId = `${squad.id}-container`;
                    break;
                }
            }
            const parent = document.getElementById(parentId);
            if (parent) parent.appendChild(entityEl);
        });
    }

    createFormationGridUI(squads) {
        if (!this.formationGridUI) return;
        this.formationGridUI.innerHTML = '<h2>진형 배치</h2>';
        this.formationGridUI.style.display = 'grid';

        for (let i = 0; i < 25; i++) {
            const cell = this.createDroppableContainer(`slot_${i}`, `Slot ${i}`, 'formation-cell');
            cell.dataset.slotIndex = i;
            this.formationGridUI.appendChild(cell);
        }

        const squadListContainer = document.createElement('div');
        squadListContainer.id = 'formation-squad-list';
        squadListContainer.innerHTML = '<h3>배치할 분대</h3>';
        this.squadManagementUI.appendChild(squadListContainer);

        squads.forEach(squad => {
            if (squad.members.size > 0) {
                const squadEl = this.createDraggableSquad(squad);
                squadListContainer.appendChild(squadEl);
            }
        });
    }

    renderFormationUI(slots) {
        if (!this.formationGridUI) return;
        document.querySelectorAll('.formation-cell').forEach(cell => (cell.innerHTML = ''));
        slots.forEach((squad, index) => {
            if (squad) {
                const cell = document.querySelector(`[data-slot-index='${index}']`);
                if (cell) {
                    const squadEl = this.createDraggableSquad(squad);
                    squadEl.dataset.isPlaced = true;
                    cell.appendChild(squadEl);
                }
            }
        });
    }

    createDraggableEntity(entity) {
        const el = document.createElement('div');
        el.className = 'draggable-entity';
        el.textContent = `${entity.name} (ID: ${entity.id})`;
        el.draggable = true;
        el.dataset.entityId = entity.id;

        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', entity.id);
            e.target.classList.add('dragging');
        });
        el.addEventListener('dragend', e => {
            e.target.classList.remove('dragging');
        });
        return el;
    }

    createDraggableSquad(squad) {
        const el = document.createElement('div');
        el.className = 'draggable-squad';
        el.textContent = squad.name;
        el.draggable = true;
        el.dataset.squadId = squad.id;

        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('squad-id', squad.id);
            e.target.classList.add('dragging');
        });
        el.addEventListener('dragend', e => {
            e.target.classList.remove('dragging');
        });
        return el;
    }

    createDroppableContainer(id, name, className = '') {
        const container = document.createElement('div');
        container.id = `${id}-container`;
        container.className = `droppable ${className}`.trim();
        container.dataset.id = id;
        container.dataset.name = name;
        container.innerHTML = `<h3>${name}</h3>`;

        container.addEventListener('dragover', e => {
            e.preventDefault();
            e.currentTarget.classList.add('dragover');
        });
        container.addEventListener('dragleave', e => {
            e.currentTarget.classList.remove('dragover');
        });
        container.addEventListener('drop', e => {
            e.preventDefault();
            e.currentTarget.classList.remove('dragover');
            const entityId = e.dataTransfer.getData('text/plain');
            const squadIdForFormation = e.dataTransfer.getData('squad-id');
            if (entityId) {
                const targetSquadId = e.currentTarget.dataset.id === 'unassigned' ? null : e.currentTarget.dataset.id;
                eventManager.publish('squad_assign_request', { entityId, squadId: targetSquadId });
            } else if (squadIdForFormation) {
                const slotIndex = parseInt(e.currentTarget.dataset.slotIndex, 10);
                if (!isNaN(slotIndex)) {
                    eventManager.publish('formation_assign_request', { squadId: squadIdForFormation, slotIndex });
                }
            }
        });
        return container;
    }
}

export const uiManager = new UIManager();
