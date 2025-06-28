// src/managers/battleMemoryManager.js

export class BattleMemoryManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.worker = null;
        this.currentFeatures = null;
        this.currentPrediction = null;
        this.initWorker();
        this.setupListeners();
    }

    initWorker() {
        try {
            this.worker = new Worker('src/workers/battleMemoryWorker.js', { type: 'module' });
            this.worker.onmessage = (e) => {
                if (e.data.type === 'modelUpdated') {
                    console.log('[BattleMemoryManager] Worker updated prediction model.');
                }
            };
            this.worker.postMessage({ type: 'init' });
        } catch (e) {
            console.warn('[BattleMemoryManager] Failed to start worker', e);
            this.worker = null;
        }
    }

    setupListeners() {
        if (!this.eventManager) return;
        this.eventManager.subscribe('battle_prediction_made', ({ features, prediction }) => {
            this.currentFeatures = features;
            this.currentPrediction = prediction;
        });
        this.eventManager.subscribe('arena_round_end', (data) => this.onRoundEnd(data));
    }

    onRoundEnd({ winner, bestUnit, worstUnit, bestReason, worstReason, units }) {
        if (!this.worker || !this.currentFeatures) return;
        const memory = {
            features: this.currentFeatures,
            prediction: this.currentPrediction,
            winner,
            bestUnit: bestUnit ? { id: bestUnit.id, team: bestUnit.team, reason: bestReason } : null,
            worstUnit: worstUnit ? { id: worstUnit.id, team: worstUnit.team, reason: worstReason } : null,
            units: (units || []).map(u => ({ id: u.id, team: u.team, hp: u.hp, attackPower: u.attackPower, defense: u.defense }))
        };
        this.worker.postMessage({ type: 'saveMemory', data: memory });
        this.worker.postMessage({ type: 'train' });
        this.currentFeatures = null;
        this.currentPrediction = null;
    }
}

