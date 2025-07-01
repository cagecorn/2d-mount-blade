import { EventBinder } from './EventBinder.js';
import { MapManager } from '../map.js';
import { ArenaMapManager } from '../arenaMap.js';
import { AquariumMapManager } from '../aquariumMap.js';

export class LegacyGameEngine {
  constructor(game) {
    this.game = game;
  }

  /**
   * 초기 플레이어 및 몬스터를 생성하고 필요한 장비를 장착합니다.
   * 기존 legacyGame.js 의 플레이어/몬스터 설정 로직을 분리한 것입니다.
   */
  initializeUnits(assets) {
    const { mapManager, equipmentManager, itemFactory, monsterManager, groupManager, playerGroup, monsterGroup, formationManager, worldEngine } = this.game;

    // --- 몬스터 생성 ---
    const monsterSquad = [];
    const monsterCount = 15;
    for (let i = 0; i < monsterCount; i++) {
      const monster = this.game.factory.create('monster', {
        x: 0,
        y: 0,
        tileSize: mapManager.tileSize,
        groupId: monsterGroup.id,
        image: assets.monster,
      });
      monster.equipmentRenderManager = this.game.equipmentRenderManager;
      const weaponIds = ['short_sword','long_bow','axe','mace','staff','spear','scythe','whip','dagger','estoc'];
      const wId = weaponIds[Math.floor(Math.random() * weaponIds.length)];
      const weapon = itemFactory.create(wId, 0, 0, mapManager.tileSize);
      if (weapon) equipmentManager.equip(monster, weapon, null);
      const armorParts = ['iron_helmet','iron_gauntlets','iron_boots','leather_armor'];
      armorParts.forEach(p => {
        const item = itemFactory.create(p, 0, 0, mapManager.tileSize);
        if (item) equipmentManager.equip(monster, item, null);
      });
      const consumable = itemFactory.create('potion', 0, 0, mapManager.tileSize);
      if (consumable) monster.consumables.push(consumable);
      monsterManager.addMonster(monster);
      groupManager.addMember(monster);
      monsterSquad.push(monster);
    }

    const hostileMercGroup = this.game.metaAIManager.createGroup('hostile_mercenaries', this.game.metaAIManager.STRATEGY?.AGGRESSIVE || 'AGGRESSIVE');
    const mercSquad = [];
    const jobIds = Object.keys(this.game.JOBS || {});
    for (let i = 0; i < 12; i++) {
      const jobId = jobIds[Math.floor(Math.random() * jobIds.length)];
      const merc = this.game.factory.create('mercenary', {
        jobId,
        x: 0,
        y: 0,
        tileSize: mapManager.tileSize,
        groupId: hostileMercGroup.id,
        image: assets[jobId] || assets.mercenary,
      });
      merc.equipmentRenderManager = this.game.equipmentRenderManager;
      const consumable = itemFactory.create('potion', 0, 0, mapManager.tileSize);
      if (consumable) merc.consumables.push(consumable);
      monsterManager.addMonster(merc);
      groupManager.addMember(merc);
      mercSquad.push(merc);
    }

    if (worldEngine && monsterSquad[0]) {
      monsterSquad[0].troopSize = monsterSquad.length;
      worldEngine.addMonster(monsterSquad[0], 3, 2);
    }
    if (worldEngine && mercSquad[0]) {
      mercSquad[0].troopSize = mercSquad.length;
      worldEngine.addMonster(mercSquad[0], 6, 6);
    }

    // --- 플레이어 생성 ---
    const startPos = { x: mapManager.tileSize * 4, y: (mapManager.height * mapManager.tileSize) / 2 };
    const player = this.game.factory.create('player', {
      x: startPos.x,
      y: startPos.y,
      tileSize: mapManager.tileSize,
      groupId: playerGroup.id,
      image: assets.player,
      baseStats: { strength: 5, agility: 5, endurance: 15, movement: 4 }
    });
    player.ai = null;
    player.equipmentRenderManager = this.game.equipmentRenderManager;
    ['iron_helmet','iron_gauntlets','iron_boots','leather_armor'].forEach(part => {
      const item = itemFactory.create(part, 0, 0, mapManager.tileSize);
      if (item) equipmentManager.equip(player, item, null);
    });

    this.game.gameState = {
      currentState: 'WORLD',
      player,
      inventory: this.game.inventoryManager.getSharedInventory(),
      gold: 1000,
      statPoints: 5,
      camera: { x: 0, y: 0 },
      isGameOver: false,
      zoomLevel: this.game.SETTINGS?.DEFAULT_ZOOM || 1,
      isPaused: false
    };
    this.game.cameraDrag = {
      isDragging: false,
      dragStart: { x: 0, y: 0 },
      cameraStart: { x: 0, y: 0 },
      followPlayer: true
    };
    playerGroup.addMember(player);
    groupManager.addMember(player);
    this.game.player = player;
    worldEngine.setPlayer(player);
  }

  /**
   * 기존 Game.loadMap 메소드를 분리한 것입니다.
   */
  loadMap(mapId) {
    const { eventManager } = this.game;

    console.log(`[Game] 맵 로딩 시작: ${mapId}`);
    eventManager?.publish('before_map_load');

    this.game.mapManager = mapId === 'arena'
      ? new ArenaMapManager()
      : (mapId === 'aquarium' ? new AquariumMapManager() : new MapManager());
    if (this.game.pathfindingManager) this.game.pathfindingManager.mapManager = this.game.mapManager;
    if (this.game.motionManager) this.game.motionManager.mapManager = this.game.mapManager;
    if (this.game.movementManager) this.game.movementManager.mapManager = this.game.mapManager;
    this.game.currentMapId = mapId;

    this.game.entityManager?.clearAll?.();
    this.game.factory?.createMapTiles?.(this.game.mapManager, this.game.entityManager);

    if (mapId === 'arena') {
      this.game.arenaEngine.start();
    } else {
      this.game.arenaEngine.stop();
    }
    console.log(`[Game] 맵 로딩 완료: ${mapId}`);
  }

  /**
   * EventBinder를 통해 게임 이벤트 리스너를 등록합니다.
   */
  bindEvents() {
    EventBinder.bindAll(this.game);
  }
}
