// src/game.js

import { SETTINGS } from '../config/gameSettings.js';
import { GameLoop } from './gameLoop.js';
import { InputHandler } from './inputHandler.js';
import { AgentActionBridge } from './managers/agentActionBridge.js';
import { CharacterFactory, ItemFactory } from './factory.js';
import { EventManager } from './managers/eventManager.js';
import { CombatLogManager, SystemLogManager } from './managers/logManager.js';
import { CombatCalculator } from './combat.js';
import { TagManager } from './managers/tagManager.js';
import { WorldEngine } from './worldEngine.js';
import { MapManager, Map } from './map.js';
import { mapData } from '../mapData.js';
import { AquariumManager, AquariumInspector } from './managers/aquariumManager.js';
import * as Managers from './managers/index.js'; // managers/index.js에서 모든 매니저를 한 번에 불러옴
import { ReputationManager } from './managers/ReputationManager.js';
import { AssetLoader } from './assetLoader.js';
import { MetaAIManager, STRATEGY } from './managers/ai-managers.js';
import { SaveLoadManager } from './managers/saveLoadManager.js';
import { LayerManager } from './managers/layerManager.js';
// 기존 인벤토리 함수는 InventoryManager에서 대체합니다.
import { InventoryManager } from './managers/inventoryManager.js';
import { PathfindingManager } from './managers/pathfindingManager.js';
import { MovementManager } from './managers/movementManager.js';
import { WorldMapAIManager } from './managers/worldMapAIManager.js';
import { FogManager } from './managers/fogManager.js';
import { NarrativeManager } from './managers/narrativeManager.js';
import { TurnManager } from './managers/turnManager.js';
import { EntityManager } from './managers/entityManager.js';
import { KnockbackEngine } from './systems/KnockbackEngine.js';
import { SupportEngine } from './systems/SupportEngine.js';
import { SKILLS } from './data/skills.js';
import { EFFECTS } from './data/effects.js';
import { ITEMS } from './data/items.js';
import { rollOnTable } from './utils/random.js';
import { getMonsterLootTable } from './data/tables.js';
import { MicroEngine } from './micro/MicroEngine.js';
import { MicroCombatManager } from './micro/MicroCombatManager.js';
import { ArenaEngine } from './engines/arenaEngine.js';
import { MicroItemAIManager } from './managers/microItemAIManager.js';
import { BattleManager } from './managers/battleManager.js';
import { BattleResultManager } from './managers/battleResultManager.js';

import { StatusEffectsManager } from './managers/statusEffectsManager.js';
import { disarmWorkflow, armorBreakWorkflow } from './workflows.js';
import { PossessionAIManager } from './managers/possessionAIManager.js';
import { AquariumSpectatorManager } from './managers/aquariumSpectatorManager.js';
import { Ghost } from './entities.js';
import { TankerGhostAI, RangedGhostAI, SupporterGhostAI, CCGhostAI } from './ai.js';
import { EMBLEMS } from './data/emblems.js';
import { adjustMonsterStatsForAquarium } from './utils/aquariumUtils.js';
import DataRecorder from './managers/dataRecorder.js';
import GuidelineLoader from './managers/guidelineLoader.js';
import { AspirationManager } from './managers/aspirationManager.js';
import { MicroWorldWorker } from './micro/MicroWorldWorker.js';
import { CinematicManager } from './managers/cinematicManager.js';
import { ItemTracker } from './managers/itemTracker.js';
import { findEntitiesInRadius } from './utils/entityUtils.js';
import { LaneManager } from './managers/laneManager.js';
import { LaneRenderManager } from './managers/laneRenderManager.js';
import { LanePusherAI } from './ai/archetypes.js';
import { LaneAssignmentManager } from './managers/laneAssignmentManager.js';
import { FormationManager } from './managers/formationManager.js';
import { TooltipManager } from './managers/tooltipManager.js';
import { CombatEngine } from "./engines/CombatEngine.js";
import { MovementEngine } from './engines/movementEngine.js';
import { GridRenderer } from './renderers/gridRenderer.js';
import { GroupManager } from './managers/groupManager.js';
import { CommanderManager } from './managers/commanderManager.js';
import { WorldmapRenderManager } from './rendering/worldMapRenderManager.js';
import { ArenaLogStorage } from './logging/arenaLogStorage.js';
import { TFArenaVisualizer } from './tfArenaVisualizer.js';
import { BattlePredictionManager } from './managers/battlePredictionManager.js';
import { BattleMemoryManager } from './managers/battleMemoryManager.js';
import { JOBS } from './data/jobs.js';
import { ArenaUIManager } from './managers/arenaUIManager.js';
import { ArenaTensorFlowManager } from './managers/arenaTensorFlowManager.js';
import { ArenaRewardManager } from './managers/arenaRewardManager.js';
import { WorkflowManager } from './managers/workflowManager.js';
import { ShowCombatResultWorkflow } from './workflows/showCombatResultWorkflow.js';
import { EntityDeathWorkflow } from './workflows/entityDeathWorkflow.js';

import { GameInitializer } from "./core/GameInitializer.js";
import { CameraController } from "./core/CameraController.js";
import { LegacyGameEngine } from "./core/LegacyGameEngine.js";
export class Game {
    constructor() {
        this.loader = new AssetLoader();
        this.gameState = { currentState: 'LOADING' };
        this.battleCanvas = document.getElementById('battleCanvas');
        this.battleCtx = this.battleCanvas.getContext('2d');
        this.aquarium = document.getElementById('aquarium');
        this.isPaused = false;
        this.units = [];
        // ArenaEngine will be created after core managers are ready
        this.arenaEngine = null;
        // shared context placeholder
        this.engineContext = null;
        this.currentMapId = null;
        this.gameEngine = new LegacyGameEngine(this);
    }

    start() {
        // GameInitializer는 Game 인스턴스를 받아 초기화 과정을 진행한다.
        this.initializer = new GameInitializer(this);
        this.initializer.start();
    }

    init(assets) {
        this.assets = assets;
        console.log('게임 초기화 중, 로드된 에셋:', this.assets);
        // 기존 맵 데이터를 사용하여 단순 맵을 생성합니다.
        this.map = new Map(this, this.assets.tileset, mapData, 32);
        // 설정에 따라 WebGL 레이어를 활성화한다
        this.layerManager = new LayerManager(SETTINGS.ENABLE_WEBGL_RENDERER);
        const canvas = this.layerManager.layers.mapBase;

        // === 1. 모든 매니저 및 시스템 생성 ===
        this.eventManager = new EventManager();
        this.arenaLogStorage = new ArenaLogStorage(this.eventManager);
        this.tfArenaVisualizer = new TFArenaVisualizer(this.arenaLogStorage);
        this.battlePredictionManager = new BattlePredictionManager(this.eventManager);
        this.battleMemoryManager = new BattleMemoryManager(this.eventManager);
        this.arenaUIManager = new ArenaUIManager(this.eventManager);
        this.arenaTensorFlowManager = new ArenaTensorFlowManager(this.eventManager);
        this.arenaRewardManager = new ArenaRewardManager(this.eventManager);
        this.tooltipManager = new TooltipManager();
        this.entityManager = new EntityManager(this.eventManager);
        this.groupManager = new GroupManager(this.eventManager, this.entityManager.getEntityById.bind(this.entityManager));
        // CommanderManager 초기화
        this.commanderManager = new CommanderManager(this.groupManager);
        // 전투 후 결과 처리를 담당하는 매니저
        this.battleResultManager = new BattleResultManager(
            this,
            this.eventManager,
            this.groupManager,
            this.entityManager
        );
        // InputHandler를 생성할 때 game 객체(this)를 전달합니다.
        this.inputHandler = new InputHandler(this);
        this.agentBridge = new AgentActionBridge(this);
        if (typeof window !== 'undefined') {
            window.agentBridge = this.agentBridge;
        }
        this.combatLogManager = new CombatLogManager(this.eventManager);
        
        this.statusEffectsManager = new StatusEffectsManager(this.eventManager);
        this.tagManager = new TagManager();
        this.combatCalculator = new CombatCalculator(this.eventManager, this.tagManager);
        // 기본 맵 매니저를 생성합니다.
        this.mapManager = new MapManager();
        // MovementEngine은 맵의 타일 크기를 기반으로 동작합니다.
        this.movementEngine = new MovementEngine({ tileSize: this.mapManager.tileSize });

        const mapPixelWidth = this.mapManager.width * this.mapManager.tileSize;
        const mapPixelHeight = this.mapManager.height * this.mapManager.tileSize;
        const laneCenters = this.mapManager.getLaneCenters ? this.mapManager.getLaneCenters() : null;
        this.laneManager = new LaneManager(mapPixelWidth, mapPixelHeight, laneCenters);
        this.laneRenderManager = new LaneRenderManager(this.laneManager, SETTINGS.ENABLE_AQUARIUM_LANES);
        const formationSpacing = this.mapManager.tileSize * 2.5;
        const formationAngle = -Math.PI / 4; // align grid with battlefield orientation
        this.formationManager = new FormationManager(5, 5, formationSpacing, 'LEFT', formationAngle);
        this.eventManager.subscribe('formation_assign_request', d => {
            if (d.squadId) {
                const squad = this.squadManager.getSquad(d.squadId);
                if (squad) {
                    squad.members.forEach(id => this.formationManager.assign(d.slotIndex, id));
                }
            } else {
                this.formationManager.assign(d.slotIndex, d.entityId);
            }
            this.uiManager?.createSquadManagementUI();
        });
        this.saveLoadManager = new SaveLoadManager();
        // TurnManager \uC124\uC815: \uBAA8\uB4E0 \uC0DD\uCCB4\uAC00 \uC5C6\uB294 \uCD08\uAE30
        // \uB370\uC774\uD130\uC640 movementEngine\uB9CC \uC804\uB2EC\uD569\uB2C8\uB2E4.
        this.turnManager = new TurnManager([], this.movementEngine);
        this.narrativeManager = new NarrativeManager();
        this.supportEngine = new SupportEngine();
        this.factory = new CharacterFactory(assets, this);
        this.inventoryManager = new InventoryManager({
            eventManager: this.eventManager,
            entityManager: this.entityManager,
        });

        // 핵심 매니저들을 묶은 공유 컨텍스트 생성
        this.engineContext = {
            game: this,
            eventManager: this.eventManager,
            assets,
            unitFactory: this.factory,
            groupManager: this.groupManager,
            entityManager: this.entityManager,
            mapManager: this.mapManager,
            movementEngine: this.movementEngine,
            worldMapRenderManager: null, // placeholder, set below
        };

        // 월드맵 로직을 담당하는 엔진
        this.worldMapRenderManager = new WorldmapRenderManager(this.groupManager);
        this.engineContext.worldMapRenderManager = this.worldMapRenderManager;
        this.worldEngine = new WorldEngine(this.engineContext);
        this.engineContext.worldEngine = this.worldEngine;
        this.combatEngine = new CombatEngine(this.engineContext);
        this.engineContext.combatEngine = this.combatEngine;
        this.battleManager = new BattleManager(this, this.eventManager, this.groupManager, this.entityManager, this.factory);

        // Workflow system to coordinate high level flows like combat result display
        this.workflowManager = new WorkflowManager(this.engineContext);
        this.engineContext.workflowManager = this.workflowManager;
        this.workflowManager.register('d3', ShowCombatResultWorkflow);
        this.workflowManager.register('entity_death', EntityDeathWorkflow);

        // --- GridRenderer 인스턴스 생성 ---
        // 초기 맵 정보를 바탕으로 GridRenderer를 초기화합니다.
        this.gridRenderer = new GridRenderer({
            mapWidth: this.mapManager.width * this.mapManager.tileSize,
            mapHeight: this.mapManager.height * this.mapManager.tileSize,
            tileSize: this.mapManager.tileSize,
            lineColor: '#000',
            lineWidth: 6
        });

        // --- 매니저 생성 부분 수정 ---
        this.managers = {};
        // ItemManager를 먼저 생성합니다.
        this.itemTracker = new ItemTracker();
        this.itemManager = new Managers.ItemManager(0, this.mapManager, assets, this.itemTracker);
        this.managers.ItemManager = this.itemManager;

        // VFXManager는 ItemManager와 EventManager가 모두 필요합니다.
        this.managers.VFXManager = new Managers.VFXManager(this.eventManager, this.itemManager);
        if (this.engineContext) {
            this.engineContext.itemManager = this.itemManager;
            this.engineContext.vfxManager = this.managers.VFXManager;
        }

        const otherManagerNames = Object.keys(Managers).filter(
            name =>
                name !== 'VFXManager' &&
                name !== 'ItemManager' &&
                name !== 'AuraManager' &&
                name !== 'ItemAIManager' &&
                name !== 'EffectManager' &&
                name !== 'SkillManager' &&
                name !== 'ProjectileManager' &&
                name !== 'SquadManager' &&
                name !== 'DataRecorder' &&
                name !== 'AquariumSpectatorManager' &&
                name !== 'WorldCombatManager'
        );
        for (const managerName of otherManagerNames) {
            if (managerName === 'UIManager') {
                this.managers[managerName] = new Managers.UIManager(
                    this.eventManager,
                    (id) => this.entityManager?.getEntityById(id),
                    this.tooltipManager,
                    this.commanderManager,
                    this.entityManager
                );
            } else {
                this.managers[managerName] = new Managers[managerName](this.eventManager, assets, this.factory);
            }
        }

        this.managers.EffectManager = new Managers.EffectManager(
            this.eventManager,
            this.managers.VFXManager
        );

        this.monsterManager = this.managers.MonsterManager;
        this.mercenaryManager = this.managers.MercenaryManager;
        this.itemManager = this.managers.ItemManager;
        this.equipmentManager = this.managers.EquipmentManager;
        this.uiManager = this.managers.UIManager;
        this.vfxManager = this.managers.VFXManager;
        this.vfxManager.game = this;
        this.soundManager = this.managers.SoundManager;
        this.bgmManager = this.managers.BgmManager;
        this.effectManager = this.managers.EffectManager;
        if (this.engineContext) {
            this.engineContext.monsterManager = this.monsterManager;
            this.engineContext.mercenaryManager = this.mercenaryManager;
            this.engineContext.vfxManager = this.vfxManager;
            this.engineContext.itemManager = this.itemManager;
        }
        this.auraManager = new Managers.AuraManager(this.effectManager, this.eventManager, this.vfxManager);
        this.microItemAIManager = new Managers.MicroItemAIManager();
        this.microEngine = new MicroEngine(this.eventManager);
        this.microCombatManager = new MicroCombatManager(this.eventManager);
        this.synergyManager = new Managers.SynergyManager(this.eventManager);
        this.uiManager.setSynergyManager(this.synergyManager);
        this.speechBubbleManager = this.managers.SpeechBubbleManager;
        this.equipmentRenderManager = this.managers.EquipmentRenderManager;
        this.mercenaryManager.equipmentRenderManager = this.equipmentRenderManager;
        this.traitManager = this.managers.TraitManager;
        this.mercenaryManager.setTraitManager(this.traitManager);
        this.monsterManager.setTraitManager(this.traitManager);
        this.parasiteManager = this.managers.ParasiteManager;
        this.microWorld = new MicroWorldWorker();

        // 매니저 간 의존성 연결
        this.equipmentManager.setTagManager(this.tagManager);

        this.itemFactory = new ItemFactory(assets);
        // ItemManager handles loot drop events.
        this.itemManager.initEvents(this.eventManager, this.itemFactory, this.vfxManager, this.entityManager);
        // 게임 시작 시 무기 아이템들을 한 개씩 고용 인벤토리에 배치합니다.
        const weaponIds = Object.keys(ITEMS).filter(id => ITEMS[id].type === 'weapon');
        weaponIds.forEach(id => {
            const weapon = this.itemFactory.create(id, 0, 0, this.mapManager.tileSize);
            if (weapon) this.inventoryManager.getSharedInventory().push(weapon);
        });
        this.pathfindingManager = new PathfindingManager(this.mapManager);
        this.motionManager = new Managers.MotionManager(this.mapManager, this.pathfindingManager);
        this.knockbackEngine = new KnockbackEngine(this.motionManager, this.vfxManager);
        this.projectileManager = new Managers.ProjectileManager(
            this.eventManager,
            assets,
            this.vfxManager,
            this.knockbackEngine
        );
        this.managers.ProjectileManager = this.projectileManager;
        this.itemAIManager = new Managers.ItemAIManager(
            this.eventManager,
            this.projectileManager,
            this.vfxManager
        );
        this.itemAIManager.setEffectManager(this.effectManager);
        this.movementManager = new MovementManager(this.mapManager);
        this.worldMapAIManager = new WorldMapAIManager(
            this.entityManager,
            this.movementManager,
            this.eventManager
        );
        this.fogManager = new FogManager(this.mapManager.width, this.mapManager.height);
        this.particleDecoratorManager = new Managers.ParticleDecoratorManager();
        this.particleDecoratorManager.setManagers(this.vfxManager, this.mapManager);
        this.particleDecoratorManager.init();
        this.effectIconManager = new Managers.EffectIconManager(this.eventManager, assets);
        // UIManager가 mercenaryManager에 접근할 수 있도록 설정
        this.uiManager.mercenaryManager = this.mercenaryManager;
        this.mercenaryManager.setUIManager(this.uiManager);
        this.uiManager.particleDecoratorManager = this.particleDecoratorManager;
        this.uiManager.vfxManager = this.vfxManager;
        this.uiManager.eventManager = this.eventManager;
        // UIManager가 Game 인스턴스에 접근할 수 있도록 참조를 전달
        this.uiManager.game = this;
        this.uiManager.getSharedInventory = () => this.inventoryManager.getSharedInventory();
        this.uiManager.formationManager = this.formationManager;
        this.squadManager = new Managers.SquadManager(this.eventManager, this.mercenaryManager);
        this.uiManager.squadManager = this.squadManager;
        this.uiManager.createSquadManagementUI?.();
        this.laneAssignmentManager = new LaneAssignmentManager({
            laneManager: this.laneManager,
            squadManager: this.squadManager,
            eventManager: this.eventManager
        });
        this.metaAIManager = new MetaAIManager(this.eventManager, this.squadManager);
        this.monsterManager.setMetaAIManager(this.metaAIManager);
        // 공유 컨텍스트에 AI 매니저 추가
        if (this.engineContext) {
            this.engineContext.aiManager = this.metaAIManager;
        }
        if (SETTINGS.ENABLE_REPUTATION_SYSTEM) {
            this.reputationManager = new ReputationManager(this.eventManager);
            this.reputationManager.mercenaryManager = this.mercenaryManager;
            this.reputationManager.mbtiEngine = this.metaAIManager.mbtiEngine;
            this.reputationManager.loadReputationModel();
        } else {
            this.reputationManager = null;
        }
        this.cinematicManager = new CinematicManager(this);
        this.dataRecorder = new DataRecorder(this);
        this.dataRecorder.init();
        this.arenaLogStorage.init();
        this.eventManager.subscribe('arena_log', () => this.tfArenaVisualizer.renderCharts());
        this.guidelineLoader = new GuidelineLoader(SETTINGS.GUIDELINE_REPO_URL);
        this.guidelineLoader.load();
        if (SETTINGS.ENABLE_POSSESSION_SYSTEM) {
            this.possessionAIManager = new PossessionAIManager(this.eventManager);
        } else {
            this.possessionAIManager = null;
        }
        this.itemFactory.emblems = EMBLEMS;

        // 모든 매니저가 준비된 후 ArenaEngine 생성
        this.arenaEngine = new ArenaEngine(this.engineContext);

        this.skillManager = new Managers.SkillManager(
            this.eventManager,
            this.vfxManager,
            this.projectileManager,
            this.motionManager,
            this.factory,
            this.metaAIManager,
            this.knockbackEngine,
            assets
        );
        this.managers.SkillManager = this.skillManager;

        const ghostAIs = {
            tanker: new TankerGhostAI(),
            ranged: new RangedGhostAI(),
            supporter: new SupporterGhostAI(),
            cc: new CCGhostAI()
        };
        if (this.possessionAIManager) {
            const ghostTypes = Object.keys(ghostAIs);
            const numGhosts = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < numGhosts; i++) {
                const randomType = ghostTypes[Math.floor(Math.random() * ghostTypes.length)];
                this.possessionAIManager.addGhost(new Ghost(randomType, ghostAIs[randomType]));
            }
        }
        this.petManager = new Managers.PetManager(this.eventManager, this.factory, this.metaAIManager, this.auraManager, this.vfxManager);
        this.managers.PetManager = this.petManager;
        this.skillManager.setManagers(
            this.effectManager,
            this.factory,
            this.metaAIManager,
            this.monsterManager,
            this.mercenaryManager,
            this.gameState
        );
        this.aquariumManager = new AquariumManager(
            this.eventManager,
            this.monsterManager,
            this.itemManager,
            this.mapManager,
            this.factory,
            this.itemFactory,
            this.vfxManager,
            this.traitManager
        );
        this.aquariumInspector = new AquariumInspector(this.aquariumManager);

        for (let i = 0; i < 20; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            if (pos) {
                const rand = Math.random();
                let itemName = 'potion';
                if (rand < 0.6) itemName = 'gold';
                else if (rand < 0.7) itemName = 'fox_charm';
                const item = this.itemFactory.create(itemName, pos.x, pos.y, this.mapManager.tileSize);
                if (item) this.itemManager.addItem(item);
            }
        }

        // === 그룹 생성 및 유닛 초기화 ===
        this.playerGroup = this.metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
        this.monsterGroup = this.metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);
        this.gameEngine.initializeUnits(assets);
        this.entityManager.init(this.gameState.player, this.mercenaryManager.mercenaries, this.monsterManager.monsters);
        this.equipmentManager.entityManager = this.entityManager;
        this.aspirationManager = new AspirationManager(this.eventManager, this.microWorld, this.effectManager, this.vfxManager, this.entityManager);

        // === 4. 용병 고용 로직 ===
        const hireBtn = document.getElementById('hire-mercenary');
        if (hireBtn) {
            hireBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'warrior',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.groupManager.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const archerBtn = document.getElementById('hire-archer');
        if (archerBtn) {
            archerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'archer',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.groupManager.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const healerBtn = document.getElementById('hire-healer');
        if (healerBtn) {
            healerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'healer',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.groupManager.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const wizardBtn = document.getElementById('hire-wizard');
        if (wizardBtn) {
            wizardBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'wizard',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.groupManager.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const bardBtn = document.getElementById('hire-bard');
        if (bardBtn) {
            bardBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'bard',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.groupManager.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const summonerBtn = document.getElementById('hire-summoner');
        if (summonerBtn) {
            summonerBtn.onclick = () => {
                if (this.gameState.gold >= 50) {
                    this.gameState.gold -= 50;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'summoner',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.groupManager.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const fireGodBtn = document.getElementById('hire-fire-god');
        if (fireGodBtn) {
            fireGodBtn.onclick = () => {
                if (this.gameState.gold >= 100) {
                    this.gameState.gold -= 100;
                    const newMerc = this.mercenaryManager.hireMercenary(
                        'fire_god',
                        this.gameState.player.x,
                        this.gameState.player.y,
                        this.mapManager.tileSize,
                        'player_party'
                    );

                    if (newMerc) {
                        this.laneAssignmentManager.assignMercenaryToLane(newMerc);
                        this.entityManager.addEntity(newMerc);
                        this.playerGroup.addMember(newMerc);
                        this.groupManager.addMember(newMerc);
                        this.eventManager.publish('mercenary_hired', { mercenary: newMerc });
                    }
                } else {
                    this.eventManager.publish('log', { message: `골드가 부족합니다.` });
                }
            };
        }

        const saveBtn = document.getElementById('save-game-btn');
        if (saveBtn) {
            saveBtn.onclick = () => {
                const saveData = this.saveLoadManager.gatherSaveData(this.gameState, this.monsterManager, this.mercenaryManager);
                console.log("--- GAME STATE SAVED (SNAPSHOT) ---");
                console.log(saveData);
                this.eventManager.publish('log', { message: '게임 상태 스냅샷이 콘솔에 저장되었습니다.' });
            };
        }

        const autoBtn = document.getElementById('toggle-autobattle-btn');
        if (autoBtn) {
            autoBtn.onclick = () => {
                const player = this.gameState.player;
                player.autoBattle = !player.autoBattle;
                if (typeof player.updateAI === 'function') player.updateAI();
                autoBtn.textContent = `자동 전투: ${player.autoBattle ? 'ON' : 'OFF'}`;
            };
        }

        const arenaBtn = document.getElementById('enter-arena-btn');
        if (arenaBtn) {
            arenaBtn.onclick = () => {
                this.loadMap('aquarium');
            };
        }

        const randomLoopBtn = document.getElementById('random-loop-btn');
        if (randomLoopBtn && this.spectatorManager) {
            randomLoopBtn.onclick = () => {
                this.spectatorManager.startNextStage();
            };
        }

        // === 메뉴 버튼 이벤트 리스너 수정 ===
        const playerInfoBtn = document.querySelector('.menu-btn[data-panel-id="character-sheet-panel"]');
        if (playerInfoBtn) {
            playerInfoBtn.onclick = () => {
                this.uiManager.displayCharacterSheet(this.gameState.player);
                this.gameState.isPaused = true;
            };
        }
        document.querySelectorAll('.menu-btn').forEach(button => {
            if (button.dataset.panelId !== 'character-sheet-panel') {
                button.onclick = () => {
                    const panelId = button.dataset.panelId;
                    this.uiManager.showPanel(panelId);
                    this.gameState.isPaused = true;
                };
            }
        });

        this.gameEngine.bindEvents();
        this.showWorldMap();
        this.gameLoop = new GameLoop(this.update, this.render);
        this.gameLoop.start();
    }

    setupEventListeners(assets, canvas) {
        const { eventManager, combatCalculator, monsterManager, mercenaryManager, mapManager, metaAIManager, pathfindingManager } = this;
        const gameState = this.gameState;

        // 월드맵과 전투 상태 전환 이벤트 처리
        eventManager.subscribe('start_combat', (data) => {
            if (gameState.currentState !== 'WORLD') return;
            console.log(`전투 시작! 상대 부대 규모: ${data.monsterParty.troopSize}`);
            const origin = { x: gameState.player.x, y: gameState.player.y };
            const entityMap = { [gameState.player.id]: gameState.player };
            this.mercenaryManager.mercenaries.forEach(m => { entityMap[m.id] = m; });
            this.formationManager.apply(origin, entityMap);
            this.pendingMonsterParty = data.monsterParty;
            gameState.currentState = 'COMBAT';
            this.worldEngine.monsters.forEach(m => m.isActive = false);
            // 전투에 돌입하면 수족관 맵을 로드하여 전투 전용 환경을 구성한다.
            this.loadMap('aquarium');
        });

        // 부대 편성 UI에서 전투 시작을 누르면 맵을 다시 한번 확실히 로드한다.
        eventManager.subscribe('formation_confirmed', () => {
            if (gameState.currentState === 'COMBAT') {
                this.loadMap('aquarium');
            }
        });

        eventManager.subscribe('end_combat', (result) => {
            console.log(`전투 종료! 결과: ${result.outcome}`);
            gameState.currentState = 'WORLD';
            if (result.outcome === 'victory') {
                this.worldEngine.monsters = this.worldEngine.monsters.filter(m => m.isActive === false);
                alert('Victory!');
            }
            this.worldEngine.monsters.forEach(m => m.isActive = true);
        });

        // 공격 이벤트 처리
        eventManager.subscribe('entity_attack', (data) => {
            this.microCombatManager.resolveAttack(data.attacker, data.defender);
            combatCalculator.handleAttack(data, { knockbackEngine: this.knockbackEngine });

            const { attacker, defender, skill } = data;
            if (!skill || !skill.projectile) {
                const img = assets['strike-effect'];
                if (img) {
                    this.vfxManager.addSpriteEffect(
                        img,
                        defender.x + defender.width / 2,
                        defender.y + defender.height / 2,
                        {
                            width: defender.width,
                            height: defender.height,
                            blendMode: 'screen'
                        }
                    );
                    this.vfxManager.addParticleBurst(
                        defender.x + defender.width / 2,
                        defender.y + defender.height / 2,
                        { color: 'rgba(200,0,0,0.9)', count: 12 }
                    );
                }
            }
        });

        // 'charge_hit' 이벤트 리스너 추가
        eventManager.subscribe('charge_hit', (data) => {
            const { attacker, defender } = data;
            if (!defender || defender.hp <= 0) return;

            // 1. 피해를 입힙니다.
            this.handleAttack(attacker, defender, { name: '돌진' });
            
            // 2. 에어본 효과를 적용합니다.
            this.effectManager.addEffect(defender, 'airborne');

            this.eventManager.publish('log', { message: `\uD83D\uDCA8 ${defender.constructor.name}를 공중에 띄웠습니다!`, color: 'lightblue' });
        });

        // 기존의 knockback_request 이벤트는 KnockbackEngine으로 대체되었습니다.

        // 피해량 계산 완료 이벤트를 받아 실제 피해 적용
        eventManager.subscribe('damage_calculated', (data) => {
            data.defender.takeDamage(data.damage);
            eventManager.publish('entity_damaged', { attacker: data.attacker, defender: data.defender, damage: data.damage });
            if (data.defender.hp <= 0) {
                eventManager.publish('entity_death', { attacker: data.attacker, victim: data.defender });
            }
        });

        eventManager.subscribe('entity_damaged', (data) => {
            this.vfxManager.flashEntity(data.defender);

            // 수면 상태인지 확인
            const sleepEffect = data.defender.effects.find(e => e.id === 'sleep');
            if (sleepEffect) {
                const hitsToWake = sleepEffect.wakeUpOnHit || 1;
                sleepEffect.hitsTaken = (sleepEffect.hitsTaken || 0) + 1;

                if (sleepEffect.hitsTaken >= hitsToWake) {
                    this.effectManager.removeEffect(data.defender, sleepEffect);
                    this.eventManager.publish('log', { message: `\uD83D\uDCA4 ${data.defender.constructor.name}\uC774(가) 공격을 받고 깨어났습니다!`, color: 'yellow' });
                }
            }
        });

        // 평판 시스템을 위한 몬스터 처치 이벤트
        eventManager.subscribe('monster_defeated', (data) => {
            if (!this.reputationManager) return;
            const action = {
                type: 'combat',
                outcome: 'victory',
                enemy: data.monster.type
            };
            this.reputationManager.handleGameEvent(action);
        });

        // 죽음 이벤트가 발생하면 경험치 획득 및 애니메이션을 시작
        eventManager.subscribe('entity_death', ({ attacker, victim }) => {
            this.workflowManager.trigger('entity_death', attacker, victim);
        });

        // 게임오버 이벤트 구독 추가
        eventManager.subscribe('game_over', () => {
            gameState.isGameOver = true;
            alert("게임 오버!");
            this.combatLogManager.add('%c게임 오버!');
        });

        eventManager.subscribe('exp_gained', (data) => {
            const { player, exp } = data;
            player.stats.addExp(exp);
        });

        eventManager.subscribe('player_levelup_bonus', (data) => {
            this.gameState.statPoints += data.statPoints;
        });


        eventManager.subscribe('weapon_disarmed', (data) => {
            if (data.weapon) {
                const context = {
                    eventManager: this.eventManager,
                    itemManager: this.itemManager,
                    equipmentManager: this.equipmentManager,
                    vfxManager: this.vfxManager,
                    mapManager: this.mapManager,
                    ...data
                };
                disarmWorkflow(context);
            }
        });

        eventManager.subscribe('armor_broken', (data) => {
            if (data.armor) {
                const context = {
                    eventManager: this.eventManager,
                    equipmentManager: this.equipmentManager,
                    vfxManager: this.vfxManager,
                    ...data
                };
                armorBreakWorkflow(context);
            }
        });

        // 미시세계 판정 결과 텍스트 및 추가 연출
        eventManager.subscribe('micro_world_event', ({ type, entity }) => {
            if (!entity) return;
            if (type === 'disarm') {
                this.vfxManager.showEventText('[무장해제!]');
            } else if (type === 'armor_break') {
                this.vfxManager.showEventText('[방어구 파괴!]');
            }
        });

        // 스킬 사용 로직은 SkillManager로 이동되었습니다.


        // AI가 성격 특성을 발동했을 때 텍스트 팝업으로 표시
        eventManager.subscribe('ai_mbti_trait_triggered', (data) => {
            if (this.vfxManager) {
                const text = data.tfUsed ? `${data.trait}(tf)` : data.trait;
                this.vfxManager.addTextPopup(text, data.entity);
            }
        });

        // 스탯 변경 이벤트 구독 (효과 적용/해제 시 스탯 재계산)
        eventManager.subscribe('stats_changed', (data) => {
            data.entity.stats.recalculate();
        });

        // 인벤토리 업데이트 시 UI를 새로 고칩니다.

        eventManager.subscribe('key_pressed', (data) => {
            const key = data.key;
            if (gameState.isPaused || gameState.isGameOver) return;

            if (['1', '2', '3', '4'].includes(key)) {
                const skillIndex = parseInt(key) - 1;
                const player = gameState.player;
                const skillId = player.skills[skillIndex];

                if (skillId && (player.skillCooldowns[skillId] || 0) <= 0) {
                    const skillData = SKILLS[skillId];
                    if (player.mp >= skillData.manaCost) {
                        player.mp -= skillData.manaCost;
                        player.skillCooldowns[skillId] = skillData.cooldown;
                        eventManager.publish('skill_used', { caster: player, skill: skillData, target: null });
                    } else {
                        eventManager.publish('log', { message: '마나가 부족합니다.' });
                    }
                }
            }
        });

        eventManager.subscribe('mouse_wheel', (data) => {
            if (gameState.isPaused || gameState.isGameOver) return;
            const step = 0.1;
            if (data.direction < 0) {
                gameState.zoomLevel = Math.min(2, gameState.zoomLevel + step);
            } else if (data.direction > 0) {
                gameState.zoomLevel = Math.max(0.25, gameState.zoomLevel - step);
            }
        });

        this.uiManager.init({
            onStatUp: this.handleStatUp,
            onItemUse: (itemIndex) => {
                const item = gameState.inventory[itemIndex];
                if (!item) return;

                if (item.baseId === 'potion' || item.name === 'potion') {
                    const playerChar = gameState.player;
                    playerChar.hp = Math.min(playerChar.maxHp, playerChar.hp + 5);
                    this.particleDecoratorManager.playHealingEffect(playerChar);
                    if (item.quantity > 1) {
                        item.quantity -= 1;
                    } else {
                        gameState.inventory.splice(itemIndex, 1);
                    }
                } else if (item.tags.includes('pet') || item.type === 'pet') {
                    this.petManager.equip(gameState.player, item, 'fox');
                } else {
                    const slot = this.inventoryManager.engine.getPreferredSlot(item);
                    if (slot) {
                        this.inventoryManager.engine.moveItem(
                            { entity: gameState.player, slot: 'inventory', index: itemIndex },
                            { entity: gameState.player, slot, index: 0 }
                        );
                    }
                }
                this.uiManager.renderInventory(gameState);
            },
            onConsumableUse: (itemIndex) => {
                const item = gameState.player.consumables[itemIndex];
                if (!item) return;

                if (item.baseId === 'potion' || item.tags?.includes('healing_item')) {
                    const playerChar = gameState.player;
                    playerChar.hp = Math.min(playerChar.maxHp, playerChar.hp + 5);
                    this.particleDecoratorManager.playHealingEffect(playerChar);
                    gameState.player.consumables.splice(itemIndex, 1);
                } else if (item.tags.includes('buff_item')) {
                    this.effectManager.addEffect(gameState.player, item.effectId);
                    gameState.player.consumables.splice(itemIndex, 1);
                } else if (item.tags.includes('pet') || item.type === 'pet') {
                    this.petManager.equip(gameState.player, item, 'fox');
                } else {
                    gameState.player.consumables.splice(itemIndex, 1);
                }
                this.uiManager.updateUI(gameState);
            },
            onEquipItem: (entity, item) => {
                const fromIdx = gameState.inventory.indexOf(item);
                if (fromIdx === -1) return;
                const slot = this.inventoryManager.engine.getPreferredSlot(item);
                if (!slot) return;
                this.inventoryManager.engine.moveItem(
                    { entity: gameState.player, slot: 'inventory', index: fromIdx },
                    { entity, slot, index: 0 }
                );
                this.uiManager.renderInventory(gameState);
                const panel = this.uiManager.openCharacterSheets.get(entity.id);
                if (panel) this.uiManager.renderCharacterSheet(entity, panel);
            }
        });

        // 닫기 버튼 공통 로직 수정
        document.querySelectorAll('.close-btn').forEach(button => {
            button.onclick = () => {
                const panel = button.closest('.modal-panel');
                if (panel) panel.classList.add('hidden');
                this.gameState.isPaused = false;
            };
        });

        // === 캔버스 클릭 이벤트 추가 (가장 상단 weather-canvas에 연결) ===
        this.layerManager.layers.weather.addEventListener('click', (event) => {
            if (gameState.isGameOver) return;

            const rect = this.layerManager.layers.weather.getBoundingClientRect();
            const scale = gameState.zoomLevel;
            const worldX = (event.clientX - rect.left) / scale + gameState.camera.x;
            const worldY = (event.clientY - rect.top) / scale + gameState.camera.y;

            const clickedMerc = [...mercenaryManager.mercenaries].reverse().find(merc =>
                worldX >= merc.x && worldX <= merc.x + merc.width &&
                worldY >= merc.y && worldY <= merc.y + merc.height
            );

            if (clickedMerc) {
                if (this.mercenaryManager.showMercenaryDetail) {
                    this.mercenaryManager.showMercenaryDetail(clickedMerc);
                    this.gameState.isPaused = true;
                }
                return; // 용병을 클릭했으면 더 이상 진행 안 함
            }

            const clickedMonster = [...monsterManager.monsters].reverse().find(mon =>
                worldX >= mon.x && worldX <= mon.x + mon.width &&
                worldY >= mon.y && worldY <= mon.y + mon.height
            );

            if (clickedMonster) {
                if (this.uiManager.displayCharacterSheet) {
                    this.uiManager.displayCharacterSheet(clickedMonster);
                    this.gameState.isPaused = true;
                }
                return;
            }
        });

        const weatherLayer = this.layerManager.layers.weather;
        weatherLayer.addEventListener('mousedown', (e) => {
            if (this.gameState.currentState === 'WORLD') {
                this.worldEngine.startDrag(e.clientX, e.clientY);
            } else if (this.gameState.currentState === 'COMBAT' || this.gameState.currentState === 'ARENA') {
                this.cameraController.startDragCamera(e.clientX, e.clientY);
            }
        });
        weatherLayer.addEventListener('mousemove', (e) => {
            if (this.gameState.currentState === 'WORLD') {
                this.worldEngine.drag(e.clientX, e.clientY);
            } else if (this.gameState.currentState === 'COMBAT' || this.gameState.currentState === 'ARENA') {
                this.cameraController.dragCamera(e.clientX, e.clientY);
            }
        });
        ['mouseup', 'mouseleave'].forEach(ev => {
            weatherLayer.addEventListener(ev, () => {
                if (this.gameState.currentState === 'WORLD') {
                    this.worldEngine.endDrag();
                } else if (this.gameState.currentState === 'COMBAT' || this.gameState.currentState === 'ARENA') {
                    this.cameraController.endDragCamera();
                }
            });
        });
    }

    findNearestEnemy(caster, enemies, range = Infinity) {
        let nearest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            const dx = enemy.x - caster.x;
            const dy = enemy.y - caster.y;
            const dist = Math.hypot(dx, dy);
            if (dist < minDist && dist <= range) {
                minDist = dist;
                nearest = enemy;
            }
        }
        return nearest;
    }

    update = (deltaTime) => {
        if (this.gameState.currentState === 'WORLD') {
            this.worldEngine.update(deltaTime);
            if (this.worldMapAIManager) {
                this.worldMapAIManager.update(deltaTime);
            }
            return;
        } else if (this.gameState.currentState !== 'COMBAT' && this.gameState.currentState !== 'ARENA') {
            return;
        }

        if (this.gameState.currentState === 'COMBAT') {
            this.combatEngine.update(deltaTime);
        } else if (this.gameState.currentState === 'ARENA') {
            this.arenaEngine.update(deltaTime);
        }
    }
    render = () => {
        this.layerManager.clear();
        if (this.gameState.currentState === "WORLD") {
            this.worldEngine.render(
                this.layerManager.contexts.mapBase,
                this.layerManager.contexts.mapDecor,
                this.layerManager.contexts.entity
            );
        } else if (this.gameState.currentState === "COMBAT") {
            this.combatEngine.render();
        } else if (this.gameState.currentState === "ARENA") {
            this.arenaEngine.render();
        }
        if (this.uiManager) this.uiManager.updateUI(this.gameState);
    }

    handleAttack(attacker, defender, skill = null) {
        this.eventManager.publish('entity_attack', { attacker, defender, skill });
    }



    /**
     * 지정된 좌표 인근의 비어 있는 임의 타일을 찾는다.
     * @param {number} centerX
     * @param {number} centerY
     * @returns {{x:number,y:number}|null}
     */
    findRandomEmptyAdjacentTile(centerX, centerY) {
        const tileSize = this.mapManager.tileSize;
        const baseX = Math.floor(centerX / tileSize);
        const baseY = Math.floor(centerY / tileSize);
        const dirs = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 },                   { x: 1, y: 0 },
            { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
        ];
        dirs.sort(() => Math.random() - 0.5);

        const entities = [
            this.gameState.player,
            ...this.mercenaryManager.mercenaries,
            ...this.monsterManager.monsters,
        ];

        for (const d of dirs) {
            const tileX = baseX + d.x;
            const tileY = baseY + d.y;
            const worldX = tileX * tileSize;
            const worldY = tileY * tileSize;
            if (this.mapManager.isWallAt(worldX, worldY)) continue;

            const occupied = entities.some(e => {
                const ex = Math.floor(e.x / tileSize);
                const ey = Math.floor(e.y / tileSize);
                return ex === tileX && ey === tileY;
            });
            if (!occupied) {
                return { x: worldX, y: worldY };
            }
        }
        return null;
    }

    handleStatUp = (stat) => {
        if (this.gameState.statPoints > 0) {
            this.gameState.statPoints--;
            this.gameState.player.stats.allocatePoint(stat);
            this.gameState.player.stats.recalculate();
        }
    }

    startBGM() {
        if (this.bgmManager && !this.bgmManager.isInitialized) {
            this.bgmManager.start();
        }
    }

    getBattleCanvasContext() {
        return this.battleCtx;
    }

    showWorldMap() {
        const container = document.getElementById('canvas-container');
        container.style.display = 'block';
        this.battleCanvas.style.display = 'none';
        this.aquarium.style.display = 'none';
        this.arenaUIManager?.onShowWorldMap();
    }

    showBattleMap() {
        const container = document.getElementById('canvas-container');
        container.style.display = 'none';
        this.battleCanvas.style.display = 'block';
        this.aquarium.style.display = 'none';
        this.arenaUIManager?.onShowBattleMap();
    }

    showArenaMap() {
        const container = document.getElementById('canvas-container');
        container.style.display = 'block';
        this.battleCanvas.style.display = 'none';
        this.aquarium.style.display = 'none';
        this.arenaUIManager?.onShowBattleMap();
    }

    /**
     * 현재 플레이어 파티에 속한 모든 멤버를 반환한다.
     * 그룹 매니저가 초기화된 경우 그룹 정보를 사용하고,
     * 그렇지 않은 경우 EntityManager의 플레이어와 용병 리스트를 조합한다.
     * @returns {Array<object>} 파티 멤버 리스트
     */
    getPartyMembers() {
        if (this.groupManager && this.playerGroup) {
            return this.groupManager
                .getGroupMembers(this.playerGroup.id)
                .filter(Boolean);
        }

        const members = [];
        const player = this.entityManager?.getPlayer?.();
        if (player) members.push(player);
        const mercs = this.entityManager?.getMercenaries?.() || [];
        members.push(...mercs);
        return members;
    }

    clearAllUnits() {
        this.units = [];
    }

    addUnit(unit) {
        this.units.push(unit);
    }

    loadMap(mapId) {
        this.gameEngine.loadMap(mapId);
    }
}
