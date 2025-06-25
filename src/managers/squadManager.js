import { eventManager } from './eventManager.js';

class SquadManager {
    constructor(maxSquads = 10) {
        this.squads = new Map();
        this.maxSquads = maxSquads;
        this.nextSquadId = 0;

        eventManager.subscribe('squad_assign_request', this.handleAssignMember.bind(this));
    }

    createSquad(squadName) {
        if (this.squads.size >= this.maxSquads) {
            console.warn('최대 분대 수를 초과했습니다.');
            return null;
        }
        const squadId = `squad_${this.nextSquadId++}`;
        const newSquad = {
            id: squadId,
            name: squadName || `분대 ${this.nextSquadId}`,
            members: new Set()
        };
        this.squads.set(squadId, newSquad);
        console.log(`${squadId} (${newSquad.name}) 분대가 생성되었습니다.`);
        eventManager.publish('squad_data_changed', { squads: this.getSquads() });
        return newSquad;
    }

    disbandSquad(squadId) {
        if (this.squads.has(squadId)) {
            this.squads.delete(squadId);
            console.log(`${squadId} 분대가 해체되었습니다.`);
            eventManager.publish('squad_data_changed', { squads: this.getSquads() });
            return true;
        }
        return false;
    }

    handleAssignMember({ entityId, squadId }) {
        this.squads.forEach(squad => {
            if (squad.members.has(entityId)) {
                squad.members.delete(entityId);
            }
        });

        if (squadId && this.squads.has(squadId)) {
            const squad = this.squads.get(squadId);
            squad.members.add(entityId);
            console.log(`${entityId}을(를) ${squadId}에 할당했습니다.`);
        } else {
            console.log(`${entityId}을(를) 모든 분대에서 제외했습니다.`);
        }

        eventManager.publish('squad_data_changed', { squads: this.getSquads() });
    }

    getSquad(squadId) {
        return this.squads.get(squadId);
    }

    getSquads() {
        return Array.from(this.squads.values());
    }

    getSquadForMerc(mercId) {
        for (const squad of this.squads.values()) {
            if (squad.members.has(mercId)) return squad;
        }
        return null;
    }

    handleSquadAssignment({ mercId, toSquadId }) {
        this.handleAssignMember({ entityId: mercId, squadId: toSquadId });
    }
}

export const squadManager = new SquadManager();
