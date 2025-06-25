export const STRATEGY = {
    AGGRESSIVE: 'aggressive',
    DEFENSIVE: 'defensive'
};

export class MetaAIManager {
    constructor() {
        this.groups = {};
    }

    createGroup(id, strategy = STRATEGY.AGGRESSIVE, player = null) {
        const group = { id, members: [], strategy, player };
        this.groups[id] = group;
        return group;
    }

    update(dt) {
        Object.values(this.groups).forEach(group => {
            group.members.forEach(ent => {
                if (ent.ai && typeof ent.update === 'function') {
                    ent.update(dt);
                }
            });
        });
    }
}
