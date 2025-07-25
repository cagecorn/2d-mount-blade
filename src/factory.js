// src/factory.js
import { Player, Mercenary, Monster, Item, Pet } from './entities.js';
import { rollOnTable } from './utils/random.js';
import { FAITHS } from './data/faiths.js';
import { ORIGINS } from './data/origins.js';
import { TRAITS } from './data/traits.js';
import { ITEMS } from './data/items.js';
import { ARTIFACTS } from './data/artifacts.js';
import { EMBLEMS } from './data/emblems.js';
import { PREFIXES, SUFFIXES } from './data/affixes.js';
import { JOBS } from './data/jobs.js';
import { SKILLS } from './data/skills.js';
import { MeleeAI, RangedAI, HealerAI, BardAI, SummonerAI, WizardAI, WarriorAI, ArcherAI, FireGodAI } from './ai.js';
import { SupportAI } from './ai/archetypes.js';
import { SupportEngine } from './systems/SupportEngine.js';
import { MBTI_TYPES } from './data/mbti.js';
import { PETS } from './data/pets.js';
import { WeaponStatManager } from './micro/WeaponStatManager.js';
import { SYNERGIES } from './data/synergies.js';

export class CharacterFactory {
    constructor(assets, game = null) {
        if (assets && assets.assets) {
            // called with game instance as first argument
            game = assets;
            assets = game.assets;
        }
        this.assets = assets;
        this.game = game;
        this.itemFactory = new ItemFactory(assets);
        this.supportEngine = game?.supportEngine || new SupportEngine();
    }

    create(type, config) {
        const { x, y, tileSize, groupId } = config;

        // 1. 모든 유닛의 공통 속성을 여기서 랜덤으로 결정
        let mbti = this._rollMBTI();
        if (type === 'mercenary' && config.jobId === 'healer' && !mbti.includes('S')) {
            mbti = 'ISFP';
        }
        const originId = this._rollRandomKey(ORIGINS);
        let faithId = null;
        // unit-features-plan.md에 따라 플레이어는 신앙을 갖지 않음
        if (type !== 'player') {
            faithId = this._rollRandomKey(FAITHS);
        }
        const traits = this._rollMultipleRandomKeys(TRAITS, 2);
        const stars = this._rollStars();

        // 2. 기본 스탯 설정 (직업, 몬스터 종류, 출신 보너스 등)
        const baseStats = { ...(config.baseStats || {}) };
        if (type === 'monster' && baseStats.expValue === undefined) {
            // 기본 몬스터 경험치를 10으로 상향
            baseStats.expValue = 10;
        }
        const originBonus = ORIGINS[originId].stat_bonuses;
        for (const stat in originBonus) {
            baseStats[stat] = (baseStats[stat] || 0) + originBonus[stat];
        }
        baseStats.stars = stars;

        // 3. 최종 설정 객체 생성
        const properties = { mbti, origin: originId, traits };
        if (faithId) properties.faith = faithId;

        const finalConfig = {
            ...config,
            x, y, tileSize, groupId,
            stats: baseStats,
            properties,
        };

        if (type === 'player' || type === 'monster') {
            finalConfig.isCommander = true;
            finalConfig.faction = type === 'player' ? 'player_faction' : 'enemy_faction';
            finalConfig.stats.attackRange = tileSize * 1.5;
        }

        // Reduce vision range for all monsters and mercenaries
        if (type === 'monster' || type === 'mercenary') {
            const baseVision = finalConfig.stats.visionRange ?? 192 * 4;
            finalConfig.stats.visionRange = Math.floor(baseVision / 3);
        }

        // 4. 타입에 맞는 캐릭터 생성 및 반환
        let entity = null;
        switch (type) {
            case 'player':
                entity = new Player(finalConfig);
                entity.consumables = [];
                entity.consumableCapacity = 4;
                entity.skills.push(SKILLS.fireball.id);
                entity.skills.push(SKILLS.iceball.id);
                entity.skills.push(SKILLS.teleport.id);
                break;
            case 'mercenary':
                if (config.jobId && JOBS[config.jobId]) {
                    finalConfig.stats = { ...finalConfig.stats, ...JOBS[config.jobId].stats };
                }
                const merc = new Mercenary(finalConfig);
                // 기본 전투는 근접 AI로 시작하되 직업에 따라 교체된다
                merc.fallbackAI = new MeleeAI();

                if (config.jobId === 'archer') {
                    merc.skills.push(SKILLS.double_strike.id);
                    const bow = this.itemFactory.create('long_bow', 0, 0, tileSize);
                    if (bow) {
                        merc.equipment.weapon = bow;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                    }
                    merc.fallbackAI = new RangedAI();
                    merc.roleAI = new ArcherAI(this.game);
                    merc.defaultRoleAI = merc.roleAI;
                } else if (config.jobId === 'warrior') {
                    merc.skills.push(SKILLS.charge_attack.id);
                    merc.roleAI = new WarriorAI(this.game);
                    merc.defaultRoleAI = merc.roleAI;
                    const weapon = this.itemFactory.create('short_sword', 0, 0, tileSize);
                    if (weapon) {
                        merc.equipment.weapon = weapon;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                    }
                } else if (config.jobId === 'healer') {
                    merc.skills.push(SKILLS.heal.id);
                    merc.skills.push(SKILLS.purify.id);
                    const weapon = this.itemFactory.create('short_sword', 0, 0, tileSize);
                    if (weapon) {
                        merc.equipment.weapon = weapon;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                    }
                    const gameRef = this.game || { supportEngine: this.supportEngine };
                    merc.roleAI = new HealerAI(gameRef);
                    merc.defaultRoleAI = merc.roleAI;
                    merc.fallbackAI = null;
                } else if (config.jobId === 'wizard') {
                    const mageSkill = Math.random() < 0.5 ? SKILLS.fireball.id : SKILLS.iceball.id;
                    merc.skills.push(mageSkill);
                    // ===== 마법사에게 기본 무기 장착 및 AI 수정 =====
                    const weapon = this.itemFactory.create('short_sword', 0, 0, tileSize);
                    if (weapon) {
                        merc.equipment.weapon = weapon;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                    }
                    merc.roleAI = new WizardAI(this.game);
                    merc.defaultRoleAI = merc.roleAI;
                    merc.fallbackAI = null;
                    // ===============================================
                } else if (config.jobId === 'summoner') {
                    merc.skills.push(SKILLS.summon_skeleton.id);
                    merc.properties.maxMinions = 2;
                    // ===== 소환사에게 기본 무기 장착 및 AI 수정 =====
                    const weapon = this.itemFactory.create('short_sword', 0, 0, tileSize);
                    if (weapon) {
                        merc.equipment.weapon = weapon;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                    }
                    merc.roleAI = new SummonerAI(this.game);
                    merc.defaultRoleAI = merc.roleAI;
                    merc.fallbackAI = null;
                    // ===============================================
                } else if (config.jobId === 'bard') {
                    merc.skills.push(SKILLS.guardian_hymn.id);
                    merc.skills.push(SKILLS.courage_hymn.id);
                    const vb = this.itemFactory.create('violin_bow', 0, 0, tileSize);
                    if (vb) {
                        merc.equipment.weapon = vb;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                        if (typeof merc.updateAI === 'function') merc.updateAI();
                    }
                    // Pass the game object so BardAI can access SupportEngine safely
                    const gameRef = this.game || { supportEngine: this.supportEngine };
                    merc.roleAI = new BardAI(gameRef);
                    merc.defaultRoleAI = merc.roleAI;
                    merc.fallbackAI = null; // disable default AI for bards
                } else if (config.jobId === 'fire_god') {
                    merc.skills.push(SKILLS.fire_nova.id);
                    // 불의 신은 무기를 랜덤하게 지급합니다.
                    const weaponIds = ['sword', 'axe', 'mace', 'staff', 'spear', 'estoc', 'scythe', 'whip'];
                    const randId = weaponIds[Math.floor(Math.random() * weaponIds.length)];
                    const weapon = this.itemFactory.create(randId, 0, 0, tileSize);
                    if (weapon) {
                        merc.equipment.weapon = weapon;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                        if (typeof merc.updateAI === 'function') merc.updateAI();
                    }
                    merc.roleAI = new FireGodAI();
                    merc.fallbackAI = new MeleeAI();
                } else {
                    const skillId = Math.random() < 0.5 ? SKILLS.double_strike.id : SKILLS.charge_attack.id;
                    merc.skills.push(skillId);
                }

                if (!merc.equipment.weapon) {
                    const sword = this.itemFactory.create('sword', 0, 0, tileSize);
                    if (sword) {
                        merc.equipment.weapon = sword;
                        if (merc.stats) merc.stats.updateEquipmentStats();
                        if (typeof merc.updateAI === 'function') merc.updateAI();
                    }
                }

                // 기본 방어구 장착
                const mHelmet = this.itemFactory.create('iron_helmet', 0, 0, tileSize);
                const mGloves = this.itemFactory.create('iron_gauntlets', 0, 0, tileSize);
                const mBoots = this.itemFactory.create('iron_boots', 0, 0, tileSize);
                const mArmor = this.itemFactory.create('leather_armor', 0, 0, tileSize);
                if (mHelmet) merc.equipment.helmet = mHelmet;
                if (mGloves) merc.equipment.gloves = mGloves;
                if (mBoots) merc.equipment.boots = mBoots;
                if (mArmor) merc.equipment.armor = mArmor;
                if (merc.stats) merc.stats.updateEquipmentStats();
                if (typeof merc.updateAI === 'function') merc.updateAI();

                entity = merc;
                break;
            case 'monster':
                entity = new Monster(finalConfig);
                break;
            case 'pet':
                const petData = PETS[config.petId] || PETS.fox;
                finalConfig.stats = { ...finalConfig.stats, ...(petData.baseStats || {}) };
                finalConfig.image = finalConfig.image || this.assets[petData.imageKey];
                finalConfig.auraSkill = petData.auraSkill;
                entity = new Pet(finalConfig);
                break;
        }

        if (entity && (type === 'player' || type === 'monster')) {
            entity.isCommander = true;
            entity.faction = type === 'player' ? 'player_faction' : 'enemy_faction';
        }

        return entity;
    }
    
    // === 아래는 다이스를 굴리는 내부 함수들 (구멍만 파기) ===
    _rollMBTI() {
        // MBTI를 무작위로 선택한다
        const idx = Math.floor(Math.random() * MBTI_TYPES.length);
        return MBTI_TYPES[idx];
    }
    _rollRandomKey(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)];
    }

    _rollMultipleRandomKeys(obj, count) {
        const keys = Object.keys(obj);
        const result = [];
        while (result.length < count && keys.length) {
            const idx = Math.floor(Math.random() * keys.length);
            result.push(keys.splice(idx, 1)[0]);
        }
        return result;
    }
    _rollStars() {
        // ... (별 갯수 랜덤 배분 로직) ...
        return { strength: 1, agility: 1, endurance: 1, focus: 1, intelligence: 1 };
    }
}

// === ItemFactory 클래스 새로 추가 ===
export class ItemFactory {
    constructor(assets) {
        this.assets = assets;
    }

    create(itemId, x, y, tileSize) {
        const baseItem = ITEMS[itemId] || ARTIFACTS[itemId] || EMBLEMS[itemId];
        if (!baseItem) return null;

        // 아이템 생성 시 imageKey로부터 올바른 이미지를 불러온다
        const itemImage = this.assets[baseItem.imageKey];
        if (!itemImage) {
            console.warn(`Missing image for item ${itemId} with key ${baseItem.imageKey}`);
        }
        const item = new Item(x, y, tileSize, baseItem.name, itemImage);
        item.baseId = itemId;
        item.type = baseItem.type;
        item.tags = [...baseItem.tags];

        if (baseItem.tier) item.tier = baseItem.tier;
        if (baseItem.durability) item.durability = baseItem.durability;
        if (baseItem.weight) item.weight = baseItem.weight;
        if (baseItem.toughness) item.toughness = baseItem.toughness;
        if (item.type === 'weapon' || item.tags.includes('weapon')) {
            item.weaponStats = new WeaponStatManager(itemId);
        }
        if (baseItem.range) {
            item.range = baseItem.range;
        }
        if (baseItem.stats) {
            item.stats.add(baseItem.stats);
        }
        if (baseItem.cooldown) {
            item.cooldown = baseItem.cooldown;
            item.cooldownRemaining = 0;
        }
        if (baseItem.healAmount) item.healAmount = baseItem.healAmount;
        if (baseItem.effectId) item.effectId = baseItem.effectId;

        if (item.type === 'weapon' || item.type === 'armor') {
            const numSockets = Math.floor(Math.random() * 4); // 0~3개 소켓
            item.sockets = Array(numSockets).fill(null);
            this._applySynergies(item);
        } else {
            item.sockets = [];
        }

        if (Math.random() < 0.5) this._applyAffix(item, PREFIXES, 'prefix');
        if (Math.random() < 0.5) this._applyAffix(item, SUFFIXES, 'suffix');

        if (baseItem.possessionAI) {
            item.possessionAI = baseItem.possessionAI;
        }

        return item;
    }

    _applyAffix(item, affixPool, type) {
        const keys = Object.keys(affixPool);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        const affix = affixPool[randomKey];

        item.name = (type === 'prefix') ? `${affix.name} ${item.name}` : `${item.name} ${affix.name}`;
        if (!item.stats.add) {
            item.stats.add = function(statObj) {
                for (const key in statObj) {
                    this.set(key, (this.get(key) || 0) + statObj[key]);
                }
            };
        }
        item.stats.add(affix.stats);
    }

    _applySynergies(item) {
        const synergyKeys = Object.keys(SYNERGIES);
        const synergyCount = Math.floor(Math.random() * 4); // 0 ~ 3개
        const available = [...synergyKeys];
        for (let i = 0; i < synergyCount; i++) {
            if (available.length === 0) break;
            const idx = Math.floor(Math.random() * available.length);
            const chosen = available.splice(idx, 1)[0];
            item.synergies.push(chosen);
        }
    }

    _createSockets() {
        return [];
    }

    /**
     * 맵 데이터를 기반으로 타일 엔티티를 생성합니다.
     * 현재는 타일 엔티티 시스템이 단순하여 구현을 비워둡니다.
     */
    createMapTiles(mapManager, entityManager) {
        if (!mapManager || !entityManager) return;
        // TODO: 실제 타일 엔티티 생성 로직이 준비되면 여기에 구현합니다.
        console.log('[CharacterFactory] createMapTiles 호출', mapManager.name);
    }
}
