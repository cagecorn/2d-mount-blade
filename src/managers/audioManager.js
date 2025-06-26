// src/managers/audioManager.js

import { context } from '../gameContext.js';

export class AudioManager {
    constructor() {
        this.bgm = null;
        this.isBgmPlaying = false;
    }

    init() {
        this.bgm = context.assets.bgm;
        if (this.bgm) {
            this.bgm.loop = true;
            this.bgm.volume = 0.5;
        }
    }

    startBGM() {
        if (this.bgm && !this.isBgmPlaying) {
            this.bgm.play().then(() => {
                this.isBgmPlaying = true;
                console.log("BGM started.");
            }).catch(e => console.error("BGM play failed:", e));
        }
    }

    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
            this.isBgmPlaying = false;
        }
    }
}
