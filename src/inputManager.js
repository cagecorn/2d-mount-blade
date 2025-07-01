export class InputManager {
    constructor() {
        this.keys = {};
        this.player = null;
        window.addEventListener('keydown', e => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    isPressed(key) {
        return this.keys[key] || false;
    }

    setPlayer(player) {
        this.player = player;
    }

    update(deltaTime) {
        if (!this.player) return;
        const speed = 100;
        if (this.isPressed('arrowup') || this.isPressed('w')) {
            this.player.y -= speed * deltaTime;
        }
        if (this.isPressed('arrowdown') || this.isPressed('s')) {
            this.player.y += speed * deltaTime;
        }
        if (this.isPressed('arrowleft') || this.isPressed('a')) {
            this.player.x -= speed * deltaTime;
        }
        if (this.isPressed('arrowright') || this.isPressed('d')) {
            this.player.x += speed * deltaTime;
        }
    }
}
