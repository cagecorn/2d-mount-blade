// src/managers/VFXManager.js

/**
 * 베기, 폭발 등 시각 효과(VFX)를 생성하고 관리하는 매니저
 */
export class VFXManager {
    constructor() {
        console.log("[VFXManager] Initialized.");
    }

    /**
     * 특정 위치에 시각 효과를 생성합니다.
     * @param {string} effectName - 'slash', 'fireball_explosion' 등 효과 이름
     * @param {object} position - {x, y} 효과가 나타날 위치
     */
    createEffect(effectName, position) {
        console.log(`%c[VFX] "${effectName}" 효과가 (${position.x}, ${position.y}) 위치에 생성됩니다.`, 'color: #FFC107');
    }
}
