// src/managers/SoundManager.js

/**
 * 사운드 이펙트와 배경 음악(BGM)을 재생하는 매니저
 */
export class SoundManager {
    constructor() {
        console.log("[SoundManager] Initialized.");
    }

    /**
     * 사운드 이펙트를 재생합니다.
     * @param {string} soundName - 'sword_swing', 'fire_cast' 등 사운드 이름
     */
    play(soundName) {
        console.log(`%c[Sound] "${soundName}" 효과음이 재생됩니다.`, 'color: #03A9F4');
    }
}
