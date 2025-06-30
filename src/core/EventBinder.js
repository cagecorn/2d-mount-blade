export class EventBinder {
  static bindAll(game) {
    game.setupEventListeners(game.assets, game.layerManager?.layers?.mapBase);
  }
}
