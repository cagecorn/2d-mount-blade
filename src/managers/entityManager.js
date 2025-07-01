export class EntityManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.entities = new Map();
        this.player = null;
        this.mercenaries = [];
        this.monsters = [];

        // 맵 로드 전 모든 엔티티를 정리하도록 이벤트에 구독합니다.
        if (eventManager) {
            eventManager.subscribe('before_map_load', () => this.clearAll());
        }
    }

    init(player, mercenaries = [], monsters = []) {
        this.player = player;
        if (player) this.entities.set(player.id, player);

        this.mercenaries = mercenaries;
        for (const m of mercenaries) {
            this.entities.set(m.id, m);
        }

        this.monsters = monsters;
        for (const m of monsters) {
            this.entities.set(m.id, m);
        }
    }

    addEntity(entity) {
        if (!entity) return;
        this.entities.set(entity.id, entity);
    }

    getEntityById(id) {
        return this.entities.get(id) || null;
    }

    findEntityByWeaponId(weaponId) {
        for (const ent of this.entities.values()) {
            if (ent.equipment?.weapon?.id === weaponId) {
                return ent;
            }
        }
        return null;
    }

    getPlayer() {
        return this.player;
    }

    getMercenaries() {
        return this.mercenaries;
    }

    getMonsters() {
        return this.monsters;
    }

    getAllEntities() {
        return Array.from(this.entities.values());
    }

    removeEntityById(id) {
        if (this.entities.has(id)) {
            this.entities.delete(id);
            if (this.eventManager) {
                this.eventManager.publish('entity_removed', { victimId: id });
            }
        }
    }

    /**
     * 모든 엔티티와 내부 상태를 초기화합니다.
     */
    clearAll() {
        this.entities = new Map();
        this.player = null;
        this.mercenaries = [];
        this.monsters = [];
        console.log('[EntityManager] 모든 엔티티가 제거되었습니다.');
    }
}
