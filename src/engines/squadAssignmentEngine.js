/**
 * \uBD84\uB300 \uD3B8\uC131 \uC804\uBB38 \uC5D4\uC9C4
 */
export class SquadAssignmentEngine {
    constructor(squads, unassignedMercs, mercenaryManager) {
        this.squads = squads;
        this.unassignedMercs = unassignedMercs;
        this.mercenaryManager = mercenaryManager;
    }

    assign({ mercId, toSquadId }) {
        for (const squad of Object.values(this.squads)) {
            squad.members.delete(mercId);
        }
        this.unassignedMercs.delete(mercId);

        const merc = this.mercenaryManager.getMercenaries().find(m => m.id === mercId);
        if (!merc) return;

        if (toSquadId && this.squads[toSquadId]) {
            this.squads[toSquadId].members.add(mercId);
            merc.squadId = toSquadId;
            console.log(`[편성 엔진] 용병 ${mercId}를 ${this.squads[toSquadId].name}에 편성.`);
        } else {
            this.unassignedMercs.add(mercId);
            merc.squadId = null;
            console.log(`[편성 엔진] 용병 ${mercId}를 미편성 상태로 변경.`);
        }
    }

    register(merc) {
        if (!merc) return;
        this.unassignedMercs.add(merc.id);
        merc.squadId = null;
    }
}
