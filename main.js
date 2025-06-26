// main.js

import { Game } from './src/game.js';
import { context } from './src/gameContext.js';

let game;

function initializeAudio(event) {
    if (event.type === 'keydown' || event.type === 'click') {
        if (context.audioManager && !context.audioManager.isBgmPlaying) {
            context.audioManager.startBGM();
        }
        document.removeEventListener('keydown', initializeAudio);
        document.removeEventListener('click', initializeAudio);
    }
}

window.onload = () => {
    try {
        game = new Game('gameCanvas'); 
        
        game.init().then(() => {
            console.log("Game initialization complete. Ready for user interaction.");
            document.addEventListener('keydown', initializeAudio);
            document.addEventListener('click', initializeAudio);
        }).catch(error => {
            console.error("Failed to initialize game:", error);
        });

    } catch (error) {
        console.error("Failed to create game object:", error);
    }
};
