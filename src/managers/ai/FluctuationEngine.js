class FluctuationEngine {
    constructor() {
        this.fluctuationLog = [];
        this.enabled = true;
    }

    reset() {
        this.fluctuationLog = [];
    }

    shouldInject(probability) {
        if (!this.enabled) return false;
        return Math.random() < probability;
    }

    injectAndLog({ unit, originalDecision, fluctuationType, allUnits }) {
        if (!this.enabled) return originalDecision;
        let newDecision = { ...originalDecision };
        const timestamp = Date.now();
        switch (fluctuationType) {
            case 'TARGET_CHANGE': {
                const potential = Array.isArray(allUnits)
                    ? allUnits.filter(u => u.id !== unit.id && u.groupId !== unit.groupId)
                    : [];
                if (potential.length > 0) {
                    const randomTarget = potential[Math.floor(Math.random() * potential.length)];
                    newDecision.type = 'attack';
                    newDecision.target = randomTarget;
                }
                break;
            }
            case 'MOVE_TO_RANDOM_POS': {
                const randomX = Math.random() * 800;
                const randomY = Math.random() * 600;
                newDecision.type = 'move';
                newDecision.target = { x: randomX, y: randomY };
                break;
            }
            default:
                break;
        }
        this.fluctuationLog.push({
            timestamp,
            unitId: unit.id,
            fluctuationType,
            originalDecision,
            injectedDecision: newDecision,
        });
        if (typeof console !== 'undefined') {
            console.log(`\uD83C\uDF00 Fluctuation! [${unit.name}] does [${fluctuationType}]`);
        }
        return newDecision;
    }

    getLog() {
        return this.fluctuationLog;
    }
}

export { FluctuationEngine };
export const fluctuationEngine = new FluctuationEngine();
