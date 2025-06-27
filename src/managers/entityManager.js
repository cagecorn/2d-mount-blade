export class EntityManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.entities = new Map();
        this.player = null;
        this.mercenaries = [];
        this.monsters = [];
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

    /**
     * Render all tracked entities using Y-sorting. Entities with a lower
     * bottom position are drawn first so that taller units naturally overlap
     * those in front.
     *
     * @param {CanvasRenderingContext2D} ctx
     * @param {{x:number,y:number}=} camera - if provided, translation is applied
     */
    renderSorted(ctx, camera = null) {
        const all = Array.from(this.entities.values()).filter(e => e && !e.isDying && !e.isHidden);
        all.sort((a, b) => {
            const ay = (a.y + (a.height || 0));
            const by = (b.y + (b.height || 0));
            return ay === by ? a.id.localeCompare(b.id) : ay - by;
        });

        if (camera) {
            ctx.save();
            ctx.translate(-camera.x, -camera.y);
        }

        for (const ent of all) {
            if (ent.render) ent.render(ctx);
        }

        if (camera) ctx.restore();
    }
}
