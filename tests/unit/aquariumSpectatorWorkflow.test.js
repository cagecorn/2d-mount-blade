import { aquariumSpectatorWorkflow } from '../../src/workflows.js';
import { CharacterFactory } from '../../src/factory.js';
import { AquariumMapManager } from '../../src/aquariumMap.js';
import { FormationManager } from '../../src/managers/formationManager.js';
import { EnemyFormationManager } from '../../src/managers/enemyFormationManager.js';
import { GroupManager } from '../../src/managers/groupManager.js';
import { EventManager } from '../../src/managers/eventManager.js';
import { describe, test, assert } from '../helpers.js';

const assets = {};

describe('Workflows', () => {
  test('aquariumSpectatorWorkflow spawns 12 vs 12', () => {
    const map = new AquariumMapManager();
    const factory = new CharacterFactory(assets);
    const formation = new FormationManager(5, 5, map.tileSize);
    const enemyFormation = new EnemyFormationManager(5, 5, map.tileSize);
    const groupManager = new GroupManager();
    const ctx = {
      factory,
      mapManager: map,
      formationManager: formation,
      enemyFormationManager: enemyFormation,
      entityManager: { addEntity() {} },
      groupManager,
      assets,
      eventManager: new EventManager()
    };

    const result = aquariumSpectatorWorkflow(ctx);
    assert.strictEqual(result.playerUnits.length, 12);
    assert.strictEqual(result.enemyUnits.length, 12);
  });
});
