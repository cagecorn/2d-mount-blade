// src/managers/squadManager.js

import { Squad } from '../entities/squad.js';

export class SquadManager {
    constructor(entityManager, eventManager, config = {}) {
        this.entityManager = entityManager;
        this.eventManager = eventManager;
        this.squads = new Map();
        this.nextSquadId = 1;
        this.config = config;
    }

    createSquad(name, leaderId, memberIds = []) {
        const squadId = `squad_${this.nextSquadId++}`;
        const allMemberIds = new Set([leaderId, ...memberIds]);
        const newSquad = new Squad(squadId, name, leaderId, allMemberIds);
        this.squads.set(squadId, newSquad);

        console.log(`Squad created: ${name} with leader ${leaderId}`);
        this.eventManager.publish('squads_updated', { squads: Array.from(this.squads.values()) });
        return newSquad;
    }

    getSquad(squadId) {
        return this.squads.get(squadId);
    }
    
    getAllSquads() {
        return Array.from(this.squads.values());
    }

    // 초기 분대를 생성하는 예시 메서드
    createInitialSquads() {
        const player = this.entityManager.getPlayer();
        if (player) {
            this.createSquad('Player Squad', player.id);
        }
        
        // 여기에 다른 초기 분대 생성 로직을 추가할 수 있습니다.
        // 예: this.createSquad('Enemy Alpha', 'enemy_leader_1');

        // 모든 초기 분대 생성이 끝난 후 한 번에 업데이트 이벤트를 발행할 수 있습니다.
        this.eventManager.publish('squads_updated', { squads: this.getAllSquads() });
    }
}
