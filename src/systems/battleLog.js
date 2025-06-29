class BattleLog {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.boundLogAttack = this.logAttack.bind(this);
        this.boundLogDeath = this.logDeath.bind(this);

        this.eventManager.subscribe('unit_attack', this.boundLogAttack);
        this.eventManager.subscribe('unit_death', this.boundLogDeath);
    }

    logAttack(data) {
        const { attacker, target, damage } = data;
        this.eventManager.publish('battle_log', {
            message: `${attacker.id}\uAC00 ${target.id}\uB97C \uACF5\uACA9\uD558\uC5EC ${damage}\uC758 \uD53C\uD574\uB97C \uC785\uD588\uC2B5\uB2C8\uB2E4.`
        });
    }

    logDeath(data) {
        const { unit } = data;
        this.eventManager.publish('battle_log', {
            message: `${unit.id}\uAC00 \uC4F0\uB808\uC84C\uC2B5\uB2C8\uB2E4.`
        });
    }

    destroy() {
        this.eventManager.unsubscribe('unit_attack', this.boundLogAttack);
        this.eventManager.unsubscribe('unit_death', this.boundLogDeath);
        console.log('BattleLog \uC2DC\uC2A4\uD15C\uC774 \uD30C\uAD34\uB418\uACE0 \uC774\uBCA4\uD2B8 \uAD6C\uB3C5\uC774 \uCDE8\uC18C\uB418\uC5C8\uC2B5\uB2C8\uB2E4.');
    }
}

export { BattleLog };
