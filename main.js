// main.js

// legacyGame.js에 정의된 Game 클래스를 불러와 실행 진입점을 단순화한다.
import { Game } from './src/legacyGame.js';
import { registerServiceWorker } from './src/utils/swRegister.js';

window.onload = () => {
    registerServiceWorker();
    // Game 인스턴스를 생성하여 초기화 과정을 모두 맡긴다.
    const game = new Game();
    game.start();
};
