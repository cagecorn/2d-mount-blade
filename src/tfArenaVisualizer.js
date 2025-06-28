import * as tf from '@tensorflow/tfjs';
import * as tfvis from '@tensorflow/tfjs-vis';

export class TFArenaVisualizer {
    constructor(logStorage) {
        this.logStorage = logStorage;
    }

    async renderCharts() {
        if (!this.logStorage) return;
        const logs = await this.logStorage.getAllLogs();
        const damages = logs.filter(l => l.eventType === 'attack').map(l => l.damage);
        if (damages.length === 0) return;
        const tensor = tf.tensor1d(damages);
        const container = document.getElementById('arena-tf-stats');
        if (!container) return;
        tfvis.render.histogram(container, tensor, { width: 400, height: 300 });
        tensor.dispose();
    }
}
