export class ArenaRewardManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.score = 0;
        this.lastPrediction = null;
        this.tfUnits = [];
        this.setup();
    }

    setup() {
        if (!this.eventManager) return;
        this.eventManager.subscribe('battle_prediction_made', d => {
            this.lastPrediction = d?.prediction || null;
        });
        this.eventManager.subscribe('arena_round_start', d => this.onRoundStart(d));
        this.eventManager.subscribe('arena_round_end', d => this.onRoundEnd(d));
    }

    onRoundStart({ units }) {
        this.tfUnits = (units || []).filter(u => u.tfController);
        const teamCounts = {};
        for (const u of this.tfUnits) {
            teamCounts[u.team] = (teamCounts[u.team] || 0) + 1;
        }
        if (Object.values(teamCounts).every(c => c >= 3)) {
            this.score += 50; // rule 4
        }
        this.updateDisplay();
    }

    onRoundEnd({ winner, bestUnit, worstUnit }) {
        if (winner && this.lastPrediction && winner === this.lastPrediction) {
            this.score += 10; // rule 1
        }
        if (bestUnit?.tfController) {
            this.score += 20; // rule 2
        }
        if (worstUnit?.tfController) {
            this.score -= 5; // rule 3
        }
        const hopeless = this.tfUnits.length > 0 && this.tfUnits.every(u => u.kills === 0 && !u.isAlive());
        if (hopeless) {
            this.score -= 30; // rule 5
        }
        this.updateDisplay();
        this.lastPrediction = null;
        this.tfUnits = [];
    }

    updateDisplay() {
        if (typeof document === 'undefined') return;
        const el = document.getElementById('arena-tf-reward');
        if (el) {
            el.style.display = 'block';
            el.textContent = `잘했어요 점수: ${this.score}`;
        }
    }
}
