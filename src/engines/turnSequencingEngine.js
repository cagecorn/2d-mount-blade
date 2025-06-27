/**
 * \u2699\uFE0F \uD130\uB110 \uC21C\uC11C \uACB0\uC815 \uC5D4\uC9C4
 * \uD130\uB110\uC758 \uC21C\uC11C\uB97C \uACB0\uC815\uD569\uB2C8\uB2E4. (\uB2E8\uC21C \uC21C\uC11C, \uBBFC\uCDE8\uC131 \uAE30\uBC18 \uB4F1)
 */
export class TurnSequencingEngine {
    constructor(entities) {
        this.entities = entities;
        this.currentIndex = 0;
    }
    // \uC608\uC2DC: getNextEntity()
    getCurrentEntity() {
        return this.entities[this.currentIndex];
    }
}
