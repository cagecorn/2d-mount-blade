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
        // IDB의 getAll() 결과는 TypedArray가 될 수 있어 tfjs-vis가 인식하지
        // 못하는 경우가 있다. 명시적으로 Array로 변환해 숫자 배열을 보장한다.
        const damages = Array.from(
            logs.filter(l => l.eventType === 'attack').map(l => Number(l.damage))
        );
        if (damages.length === 0) return;
        const container = document.getElementById('arena-tf-stats');
        if (!container) return;
        // tfvis.histogram은 순수 Array만 허용한다. TypedArray나 Tensor가 전달
        // 되면 "input data must be an array" 오류가 발생한다. 따라서 Number로
        // 변환된 배열을 전달한다.
        tfvis.render.histogram(container, damages, { width: 400, height: 300 });
    }
}
