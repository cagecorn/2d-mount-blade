import tfLoader from '../utils/tf-loader.js';

export class BattlePredictionManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.currentPrediction = null;
        this.stats = { total: 0, correct: 0 };
        this.model = null;
        this.tf = null;
        this.trainingFeatures = [];
        this.trainingLabels = [];
        this.lastFeatures = null;
        this.init();
    }

    async init() {
        await tfLoader.init();
        this.tf = tfLoader.getTf();
        if (!this.tf) return;

        this.model = this.tf.sequential();
        this.model.add(this.tf.layers.dense({ units: 16, activation: 'relu', inputShape: [3] }));
        this.model.add(this.tf.layers.dense({ units: 1, activation: 'sigmoid' }));
        this.model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });

        this.setupListeners();
    }

    setupListeners() {
        if (!this.eventManager) return;
        this.eventManager.subscribe('arena_round_start', (d) => this.onRoundStart(d));
        this.eventManager.subscribe('arena_round_end', (d) => this.onRoundEnd(d));
    }

    extractFeatures(units) {
        const sum = (arr, prop) => arr.reduce((acc, u) => acc + (u[prop] || 0), 0);
        const teamA = units.filter(u => u.team === 'A');
        const teamB = units.filter(u => u.team === 'B');
        const hpDiff = sum(teamA, 'hp') - sum(teamB, 'hp');
        const atkDiff = sum(teamA, 'attackPower') - sum(teamB, 'attackPower');
        const defDiff = sum(teamA, 'defense') - sum(teamB, 'defense');
        return [hpDiff, atkDiff, defDiff];
    }

    async onRoundStart({ units }) {
        if (!this.tf || !units) return;
        const feat = this.extractFeatures(units);
        this.lastFeatures = feat;
        const input = this.tf.tensor2d([feat]);
        const predTensor = this.model.predict(input);
        const predVal = (await predTensor.data())[0];
        this.currentPrediction = predVal >= 0.5 ? 'A' : 'B';
        input.dispose();
        predTensor.dispose();
        this.updateDisplay();
    }

    async onRoundEnd({ winner }) {
        if (!this.tf || !winner || !this.lastFeatures) return;
        this.stats.total++;
        if (winner === this.currentPrediction) this.stats.correct++;
        this.trainingFeatures.push(this.lastFeatures);
        this.trainingLabels.push(winner === 'A' ? 1 : 0);
        await this.trainModel();
        this.updateDisplay();
        this.currentPrediction = null;
        this.lastFeatures = null;
    }

    async trainModel() {
        if (this.trainingFeatures.length < 5) return;
        const xs = this.tf.tensor2d(this.trainingFeatures);
        const ys = this.tf.tensor2d(this.trainingLabels, [this.trainingLabels.length, 1]);
        await this.model.fit(xs, ys, { epochs: 5, batchSize: 8 });
        xs.dispose();
        ys.dispose();
    }

    updateDisplay() {
        const container = document.getElementById('arena-tf-stats');
        if (!container) return;
        container.style.display = 'block';
        const acc = this.stats.total ? ((this.stats.correct / this.stats.total) * 100).toFixed(1) : 'N/A';
        const predText = this.currentPrediction ? `예상 승자: 팀 ${this.currentPrediction}` : '';
        container.textContent = `${predText} | 정확도: ${acc}% (${this.stats.correct}/${this.stats.total})`;
    }
}

