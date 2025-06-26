const now = () => (typeof performance !== 'undefined' && performance.now)
    ? performance.now()
    : Date.now();

const rAF = (typeof window !== 'undefined' && window.requestAnimationFrame)
    ? window.requestAnimationFrame.bind(window)
    : (cb) => setTimeout(() => cb(now()), 1000 / 60);

export class GameLoop {
    constructor(update, render) {
        this.update = update;
        this.render = render;
        this.isRunning = false;
        this.lastTime = 0;
        this.timeScale = 1.0;
    }

    start() {
        this.isRunning = true;
        this.lastTime = now();
        this.loop(this.lastTime);
    }

    stop() {
        this.isRunning = false;
    }

    loop = (currentTime) => {
        if (!this.isRunning) return;

        const deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;

        this.update(deltaTime * this.timeScale);
        this.render();

        rAF(this.loop);
    }
}
