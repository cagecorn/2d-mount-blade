export class GroupManager {
    constructor(eventManager = null, getEntityById = null) {
        this.eventManager = eventManager;
        this.getEntityById = getEntityById;
        this.groups = {};
        console.log('[GroupManager] Initialized');
        if (this.eventManager) {
            this.eventManager.subscribe('entity_removed', ({ victimId }) => {
                this.removeMemberFromAll(victimId);
            });
        }
    }

    addMember(entity) {
        if (!entity || !entity.groupId) return;
        const groupId = entity.groupId;
        if (!this.groups[groupId]) this.groups[groupId] = [];
        if (!this.groups[groupId].includes(entity.id)) {
            this.groups[groupId].push(entity.id);
        }
    }

    removeMember(entity) {
        if (!entity || !entity.groupId) return;
        const groupId = entity.groupId;
        if (this.groups[groupId]) {
            this.groups[groupId] = this.groups[groupId].filter(id => id !== entity.id);
        }
    }

    removeMemberFromAll(entityId) {
        for (const groupId of Object.keys(this.groups)) {
            this.groups[groupId] = this.groups[groupId].filter(id => id !== entityId);
        }
    }

    getGroupMembers(groupId) {
        const ids = this.groups[groupId] || [];
        if (this.getEntityById) {
            return ids.map(id => this.getEntityById(id)).filter(Boolean);
        }
        return ids;
    }
}
