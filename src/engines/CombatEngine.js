import { EFFECTS } from '../data/effects.js';

export class CombatEngine {
    constructor(context) {
        this.context = context;
        this.game = context.game;
    }

    update(deltaTime) {
        const game = this.game;

        game.handleCameraReset();

        const { gameState, mercenaryManager, monsterManager, itemManager, mapManager, inputHandler, effectManager, turnManager, metaAIManager, eventManager, pathfindingManager, microEngine, microItemAIManager } = game;
        if (gameState.isPaused || gameState.isGameOver) return;

        const allEntities = [gameState.player, ...mercenaryManager.mercenaries, ...monsterManager.monsters, ...(game.petManager?.pets || [])];
        gameState.player.applyRegen();
        effectManager.update(allEntities);
        turnManager.update(allEntities, { eventManager, player: gameState.player, parasiteManager: game.parasiteManager });
        itemManager.update();
        game.petManager.update();
        if (game.auraManager) {
            game.auraManager.update(allEntities);
        }
        eventManager.publish('debug', { tag: 'Frame', message: '--- Frame Update Start ---' });
        const player = gameState.player;
        if (player.attackCooldown > 0) player.attackCooldown--;
        let moveX = 0, moveY = 0;
        if (inputHandler.keysPressed['ArrowUp']) moveY -= player.speed;
        if (inputHandler.keysPressed['ArrowDown']) moveY += player.speed;
        if (inputHandler.keysPressed['ArrowLeft']) moveX -= player.speed;
        if (inputHandler.keysPressed['ArrowRight']) moveX += player.speed;
        if (moveX !== 0 || moveY !== 0) {
            const targetX = player.x + moveX;
            const targetY = player.y + moveY;
            const monsterToAttack = monsterManager.getMonsterAt(
                targetX + player.width / 2,
                targetY + player.height / 2
            );
            if (monsterToAttack && player.attackCooldown === 0) {
                game.handleAttack(player, monsterToAttack, null);
                const baseCd = 30;
                player.attackCooldown = Math.max(1, Math.round(baseCd / (player.attackSpeed || 1)));
            } else if (!mapManager.isWallAt(targetX, targetY, player.width, player.height)) {
                player.x = targetX;
                player.y = targetY;
            } else {
                if (!mapManager.isWallAt(targetX, player.y, player.width, player.height)) {
                    player.x = targetX;
                } else if (!mapManager.isWallAt(player.x, targetY, player.width, player.height)) {
                    player.y = targetY;
                }
            }
        }
        const itemToPick = game.itemManager.items.find(item =>
            player.x < item.x + mapManager.tileSize &&
            player.x + player.width > item.x &&
            player.y < item.y + mapManager.tileSize &&
            player.y + player.height > item.y
        );
        if (itemToPick) {
            if (itemToPick.baseId === 'gold' || itemToPick.name === 'gold') {
                gameState.gold += 10;
                game.combatLogManager.add(`골드를 주웠습니다! 현재 골드: ${gameState.gold}`);
            } else if (itemToPick.tags?.includes('consumable')) {
                if (!player.addConsumable(itemToPick)) {
                    const existing = gameState.inventory.find(i => i.baseId === itemToPick.baseId);
                    if (existing) {
                        existing.quantity += 1;
                    } else {
                        gameState.inventory.push(itemToPick);
                    }
                }
                game.combatLogManager.add(`${itemToPick.name}을(를) 획득했습니다.`);
            } else {
                const existing = gameState.inventory.find(i => i.baseId === itemToPick.baseId);
                const invItem = existing || itemToPick;
                if (existing) {
                    existing.quantity += 1;
                } else {
                    gameState.inventory.push(itemToPick);
                }
                game.combatLogManager.add(`${itemToPick.name}을(를) 인벤토리에 추가했습니다.`);
                if (itemToPick.tags.includes('pet') || itemToPick.type === 'pet') {
                    player.addConsumable(invItem);
                    game.petManager.equip(player, invItem, 'fox');
                }
            }
            game.itemManager.removeItem(itemToPick);
        }
        if (game.fogManager) {
            game.fogManager.update(player, mapManager);
        }
        const context = {
            eventManager,
            player,
            mapManager,
            monsterManager,
            mercenaryManager,
            pathfindingManager,
            laneManager: game.laneManager,
            motionManager: game.motionManager,
            movementManager: game.movementManager,
            projectileManager: game.projectileManager,
            itemManager: game.itemManager,
            equipmentManager: game.equipmentManager,
            vfxManager: game.vfxManager,
            knockbackEngine: game.knockbackEngine,
            supportEngine: game.supportEngine,
            assets: game.loader.assets,
            metaAIManager,
            microItemAIManager,
            playerGroup: game.playerGroup,
            monsterGroup: game.monsterGroup,
            speechBubbleManager: game.speechBubbleManager,
            statusEffectsManager: game.statusEffectsManager,
            enemies: metaAIManager.groups['dungeon_monsters']?.members || []
        };
        metaAIManager.update(context);
        if (game.possessionAIManager) game.possessionAIManager.update(context);
        game.itemAIManager.update(context);
        game.projectileManager.update(allEntities);
        game.vfxManager.update();
        game.speechBubbleManager.update();
        const allItems = [
            ...gameState.inventory,
            ...game.itemManager.items,
            ...game.mercenaryManager.mercenaries.flatMap(m => m.consumables || []),
            ...game.monsterManager.monsters.flatMap(m => m.consumables || [])
        ];
        microEngine.update(allItems);
        eventManager.publish('debug', { tag: 'Frame', message: '--- Frame Update End ---' });
    }

    render() {
        const game = this.game;
        const { layerManager, gameState, mapManager, itemManager, monsterManager, mercenaryManager, fogManager, uiManager } = game;
        const assets = game.loader.assets;
        const canvas = layerManager.layers.mapBase;

        if (gameState.isGameOver) return;

        const camera = gameState.camera;
        let zoom = gameState.zoomLevel;

        if (game.cinematicManager.isPlaying) {
            const cameraTarget = game.cinematicManager.targetEntity;
            if (cameraTarget) {
                const targetCameraX = cameraTarget.x - canvas.width / (2 * zoom);
                const targetCameraY = cameraTarget.y - canvas.height / (2 * zoom);
                camera.x += (targetCameraX - camera.x) * 0.08;
                camera.y += (targetCameraY - camera.y) * 0.08;
            }
            const targetZoom = game.cinematicManager.targetZoom;
            zoom += (targetZoom - zoom) * 0.08;
        } else {
            const mapPixelWidth = mapManager.width * mapManager.tileSize;
            const mapPixelHeight = mapManager.height * mapManager.tileSize;
            if (game.cameraDrag.followPlayer) {
                const cameraTarget = gameState.player;
                const targetCameraX = cameraTarget.x - canvas.width / (2 * zoom);
                const targetCameraY = cameraTarget.y - canvas.height / (2 * zoom);
                camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width / zoom));
                camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height / zoom));
            } else {
                camera.x = Math.max(0, Math.min(camera.x, mapPixelWidth - canvas.width / zoom));
                camera.y = Math.max(0, Math.min(camera.y, mapPixelHeight - canvas.height / zoom));
            }
        }
        gameState.zoomLevel = zoom;

        for (const key in layerManager.contexts) {
            const ctx = layerManager.contexts[key];
            if (ctx.save) {
                ctx.save();
                ctx.scale(zoom, zoom);
                ctx.translate(-camera.x, -camera.y);
            }
        }

        const contexts = layerManager.contexts;

        mapManager.render(contexts.mapBase, contexts.mapDecor, assets);
        game.laneRenderManager.render(contexts.mapDecor);
        itemManager.render(contexts.mapDecor);

        const allEntitiesToRender = [
            gameState.player,
            ...(monsterManager?.monsters || []),
            ...(mercenaryManager?.mercenaries || []),
            ...(game.petManager?.pets || [])
        ].filter(e => e && !e.isDying && !e.isHidden);

        allEntitiesToRender.sort((a, b) =>
            a.y === b.y ? a.id.localeCompare(b.id) : a.y - b.y
        );

        const entityCtx = contexts.entity;
        for (const entity of allEntitiesToRender) {
            entity.render(entityCtx);
        }

        if (fogManager) {
            fogManager.render(contexts.vfx, mapManager.tileSize);
        }
        uiManager.renderHpBars(contexts.vfx, gameState.player, monsterManager.monsters, mercenaryManager.mercenaries);
        game.projectileManager.render(contexts.vfx);
        game.vfxManager.render(contexts.vfx);
        game.speechBubbleManager.render(contexts.vfx);
        game.effectIconManager.render(
            contexts.vfx,
            [gameState.player, ...monsterManager.monsters, ...mercenaryManager.mercenaries, ...(game.petManager?.pets || [])],
            EFFECTS
        );
        game.cinematicManager.render(contexts.vfx);

        for (const key in layerManager.contexts) {
            const ctx = layerManager.contexts[key];
            if (ctx.restore) {
                ctx.restore();
            }
        }

        if (game.uiManager && game.gameState.currentState === 'COMBAT') {
            uiManager.updateUI(gameState);
        }
    }
}
