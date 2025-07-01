import { GameEngine } from './engine.js';
import { MapManager } from './map.js';
import { EntityManager } from './managers/entityManager.js';
import { UIManager } from './managers/uiManager.js';
import { Player } from './entities.js';
import { InputManager } from './inputManager.js';

export function setupAndStartGame(context) {
    const engine = new GameEngine(context);
    const inputManager = new InputManager();
    const mapManager = new MapManager();
    const entityManager = new EntityManager();
    const uiManager = new UIManager();

    const player = new Player({ x: 20, y: 20, tileSize: 32, groupId: 'player' });
    entityManager.addEntity(player);
    if (typeof uiManager.setPlayer === 'function') {
        uiManager.setPlayer(player);
    }

    engine.addSystem(entityManager);
    engine.addSystem(mapManager);
    engine.addSystem(uiManager);

    engine.start();
    console.log('게임 엔진이 시작되었습니다. 각 매니저가 독립적으로 작동합니다.');
}
