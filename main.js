// main.js
import { GameInitializer } from './src/core/GameInitializer.js';
import { registerServiceWorker } from './src/utils/swRegister.js';

window.onload = () => {
    registerServiceWorker();
    const canvas = document.getElementById('battleCanvas');
    const context = canvas.getContext('2d');
    const initializer = new GameInitializer(context);
    initializer.start();
};
