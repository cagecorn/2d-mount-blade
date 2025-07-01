export class GameEngine {
    constructor(context) {
        this.context = context;
        this.updateSystems = [];
        this.drawSystems = [];
        this._lastTime = 0;
        this._loop = this._loop.bind(this);
    }

    addSystem(system) {
        if (typeof system.update === 'function') {
            this.updateSystems.push(system);
        }
        if (typeof system.draw === 'function') {
            this.drawSystems.push(system);
        }
    }

    start() {
        this._lastTime = performance.now();
        requestAnimationFrame(this._loop);
    }

    _loop(currentTime) {
        const deltaTime = (currentTime - this._lastTime) / 1000;
        this._lastTime = currentTime;

        for (const system of this.updateSystems) {
            system.update(deltaTime);
        }

        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
        for (const system of this.drawSystems) {
            system.draw(this.context);
        }

        requestAnimationFrame(this._loop);
    }
}
