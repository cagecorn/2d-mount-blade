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
        const container = document.getElementById('arena-tf-stats');
        if (!container) return;
        // tfvis.histogram requires a plain array in some environments, passing a
        // Tensor can lead to 'input data must be an array' errors. Use the
        // damages array directly to avoid compatibility issues.
        tfvis.render.histogram(container, damages, { width: 400, height: 300 });
    }
}
