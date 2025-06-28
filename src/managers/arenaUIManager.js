export class ArenaCombatLogManager {
    constructor(eventManager) {
        this.logs = [];
        this.logElement = document.getElementById('arena-log-content');
        eventManager.subscribe('arena_log', data => {
            if (data && data.message) this.add(data.message);
        });
    }

    add(message) {
        this.logs.push(message);
        if (this.logs.length > 30) this.logs.shift();
        this.render();
    }

    clear() {
        this.logs = [];
        this.render();
    }

    render() {
        if (!this.logElement) return;
        const el = this.logElement;
        const atBottom = Math.abs(el.scrollHeight - el.clientHeight - el.scrollTop) < 5;
        el.innerHTML = this.logs.join('<br>');
        if (atBottom) el.scrollTop = el.scrollHeight;
    }
}

export class ArenaUIManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.summaryElement = document.getElementById('arena-round-summary');
        this.logManager = new ArenaCombatLogManager(eventManager);
        eventManager.subscribe('arena_round_end', data => this.displaySummary(data));
    }

    displaySummary(data) {
        if (!this.summaryElement) return;
        const { bestUnit, worstUnit, bestReason, worstReason, round } = data || {};
        const fmt = (u) => u ? `팀 ${u.team} ${u.jobId}` : '없음';
        this.summaryElement.textContent = `Round ${round} - MVP: ${fmt(bestUnit)} (${bestReason}) | 최약체: ${fmt(worstUnit)} (${worstReason})`;
        this.summaryElement.style.display = 'block';
    }

    hideSummary() {
        if (this.summaryElement) this.summaryElement.style.display = 'none';
    }

    onShowWorldMap() {
        this.hideSummary();
        this.logManager.clear();
    }

    onShowBattleMap() {
        if (this.summaryElement) this.summaryElement.style.display = 'block';
    }
}
