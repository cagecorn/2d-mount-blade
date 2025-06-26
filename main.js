// main.js

import { Game } from './src/game.js';
import { context } from './src/gameContext.js';

let game;

// BGM을 시작하는 함수 (이제 AudioManager를 사용)
function initializeAudio(event) {
    if (event.type === 'keydown' || event.type === 'click') {
        // context를 통해 audioManager에 접근
        if (context.audioManager && !context.audioManager.isBgmPlaying) {
            context.audioManager.startBGM();
        }
        // 이벤트 리스너는 한 번만 실행 후 제거
        document.removeEventListener('keydown', initializeAudio);
        document.removeEventListener('click', initializeAudio);
    }
}

// 게임의 유일한 시작점
window.onload = () => {
    try {
        // Canvas ID 수정: game-canvas -> gameCanvas
        game = new Game('gameCanvas');

        // Game.init()은 비동기이므로 .then()으로 처리
        game.init().then(() => {
            console.log("Game initialization complete. Ready for user interaction.");
            // BGM 재생을 위한 사용자 입력 대기
            document.addEventListener('keydown', initializeAudio);
            document.addEventListener('click', initializeAudio);
        }).catch(error => {
            console.error("Failed to initialize game:", error);
        });

    } catch (error) {
        console.error("Failed to create game object:", error);
    }
};
