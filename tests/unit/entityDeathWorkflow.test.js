import { EntityDeathWorkflow } from '../../src/workflows/entityDeathWorkflow.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { describe, test, assert } from '../helpers.js';

class StubVfx {
  addDeathAnimation() {}
  addItemPopAnimation() {}
}
class StubItemManager {
  constructor() { this.items = []; }
  addItem(item) { this.items.push(item); }
}

describe('Workflows', () => {
  test('EntityDeathWorkflow awards exp and spawns corpse', () => {
    const eventManager = new EventManager();
    const vfx = new StubVfx();
    const itemManager = new StubItemManager();
    const mapManager = { tileSize: 32 };
    const monsterManager = { monsters: [] };
    const gameState = { player: { } };
    const assets = { corpse: {}};
    const workflow = new EntityDeathWorkflow({ eventManager, vfxManager: vfx, itemManager, mapManager, monsterManager, gameState, assets, findEmptyTile: () => ({x:0,y:0}) });

    const attacker = { isPlayer: true, isFriendly: true, stats: { addExp(exp){ attacker.gained = exp; } } };
    const victim = { id:'m1', unitType:'monster', isFriendly:false, expValue:5, x:0, y:0 };
    monsterManager.monsters.push(victim);

    let victory = false;
    eventManager.subscribe('end_combat', () => { victory = true; });

    workflow.execute(attacker, victim);

    assert.strictEqual(attacker.gained, 5);
    assert.strictEqual(itemManager.items.length, 1);
    assert.ok(victory);
  });
});

