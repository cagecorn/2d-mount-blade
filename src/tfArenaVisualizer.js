// These libraries are loaded via <script> tags in index.html.
// Access them from the global window object to avoid module resolution issues
// when running directly in the browser without a bundler.
const tf = (typeof window !== 'undefined') ? window.tf : null;
const tfvis = (typeof window !== 'undefined') ? window.tfvis : null;

export class TFArenaVisualizer {
    constructor(logStorage) {
        this.logStorage = logStorage;
    }

    async renderCharts() {
        if (!this.logStorage || !tf || !tfvis) return;
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
