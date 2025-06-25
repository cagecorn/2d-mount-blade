export class Entity {
    constructor(x, y, size, id, name, faction = 'neutral', hp = 100, speed = 1) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.id = id;
        this.name = name;
        this.faction = faction;
        this.hp = hp;
        this.speed = speed;
        this.ai = null;
    }

    update(dt) {
        if (this.ai && typeof this.ai.update === 'function') {
            this.ai.update(dt);
        }
    }

    draw(ctx) {
        ctx.fillStyle = this.faction === 'player' ? '#0af' : '#f00';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
}
