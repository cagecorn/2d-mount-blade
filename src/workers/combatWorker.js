const units = {};

onmessage = (e) => {
    const { type, data } = e.data;
    if (type === 'init') {
        for (const u of data) {
            units[u.id] = { hp: u.hp };
        }
    } else if (type === 'updateUnits') {
        for (const u of data) {
            units[u.id] = { hp: u.hp };
        }
    } else if (type === 'attack') {
        const { attackerId, defenderId, attackPower } = data;
        const defender = units[defenderId];
        if (defender) {
            defender.hp -= attackPower;
            postMessage({
                type: 'attackResult',
                attackerId,
                defenderId,
                damage: attackPower,
                remainingHp: defender.hp
            });
        }
    }
};
