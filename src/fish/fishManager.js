export class FishManager {
    constructor(game, width, height) {
        this.game = game;
        this.width = width;
        this.height = height;
    }

    start() {
        console.log('FishManager started');
    }

    stop() {
        console.log('FishManager stopped');
    }
}
