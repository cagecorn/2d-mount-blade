import { AmusementParkManager } from '../managers/amusementParkManager.js';

export class AmusementParkEngine {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.manager = new AmusementParkManager(game);
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.game.gameState.currentState = 'AMUSEMENT_PARK';
        this.manager.start();
    }

    stop() {
        if (!this.isActive) return;
        this.isActive = false;
        this.manager.stop();
        this.game.gameState.currentState = 'WORLD';
    }

    update(dt) {
        if (this.isActive) {
            this.manager.update(dt);
        }
    }

    render() {
        if (this.isActive) {
            this.manager.render(
                this.game.layerManager.contexts,
                this.game.mapManager,
                this.game.assets
            );
        }
    }
}
