import { GridManager } from '../../src/managers/gridManager.js';
import { describe, test, assert } from '../helpers.js';

describe('Managers', () => {
  test('isWalkable returns false on walls', () => {
    const mapManager = {
      map: [[0,1]],
      width: 2,
      height: 1,
      tileSize: 1,
      tileTypes: { FLOOR:0, WALL:1 }
    };
    const gm = new GridManager(mapManager);
    assert.strictEqual(gm.isWalkable(1,0), false);
  });

  test('lineOfSight passes when clear', () => {
    const mm = {
      map: [ [0,0], [0,0] ],
      width: 2,
      height: 2,
      tileSize: 1,
      tileTypes: { FLOOR:0, WALL:1 }
    };
    const gm = new GridManager(mm);
    assert.ok(gm.lineOfSight(0,0,1,1));
  });

  test('lineOfSight blocked by wall', () => {
    const mm = {
      map: [ [0,1], [0,0] ],
      width: 2,
      height: 2,
      tileSize: 1,
      tileTypes: { FLOOR:0, WALL:1 }
    };
    const gm = new GridManager(mm);
    assert.strictEqual(gm.lineOfSight(0,0,1,0), false);
  });
});
