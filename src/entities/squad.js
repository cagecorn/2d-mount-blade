export class Squad {
    constructor(id, name, leaderId, memberIds = new Set()) {
        this.id = id;
        this.name = name;
        this.leaderId = leaderId;
        this.members = memberIds;
    }
}
