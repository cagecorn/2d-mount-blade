import { GridRenderer } from './renderers/gridRenderer.js';
import { MovementEngine } from './engines/movementEngine.js';
import { WorldTurnManager } from './managers/worldTurnManager.js';
import { WalkManager } from './managers/walkManager.js';
import { WorldmapRenderManager } from './rendering/worldMapRenderManager.js';

export class WorldEngine {
    constructor(context) {
        this.context = context;
        this.game = context.game;
        this.assets = context.assets;
        this.movementEngine = context.movementEngine || new MovementEngine({ tileSize: this.game.mapManager?.tileSize || 192 });
        this.renderManager = context.worldMapRenderManager || new WorldmapRenderManager();
        this.worldMapImage = this.assets['world-tile'];
        // 전투 맵과 동일한 타일 크기를 사용해 월드맵 크기를 계산
        this.tileSize = this.game.mapManager?.tileSize || 192;
        this.worldWidth = this.tileSize * 40;
        this.worldHeight = this.tileSize * 40;
        this.camera = { x: 0, y: 0 };
        this.cameraStart = { x: 0, y: 0 };
        this.dragStart = { x: 0, y: 0 };
        this.isDragging = false;
        this.followPlayer = true;
        // 월드맵용 GridRenderer 인스턴스 생성
        this.gridRenderer = new GridRenderer({
            mapWidth: this.worldWidth,
            mapHeight: this.worldHeight,
            tileSize: this.tileSize,
            lineColor: '#000',
            lineWidth: 6
        });
        // 플레이어 정보는 Game 초기화 이후 setPlayer()로 전달된다
        this.player = null;
        // 월드맵에 표시될 몬스터 지휘관 목록
        this.monsters = [];
        this.walkManager = new WalkManager();
        this.turnManager = new WorldTurnManager({
            movementEngine: this.movementEngine,
            entities: [...this.monsters]
        });
    }

    /**
     * 월드맵에 몬스터 지휘관을 추가한다.
     * @param {object} entity - 실제 몬스터 엔티티
     * @param {number} tileX - 월드맵 타일 X 좌표
     * @param {number} tileY - 월드맵 타일 Y 좌표
     */
    addMonster(entity, tileX, tileY) {
        if (!entity) return;
        const monster = {
            id: entity.id,
            entity,
            groupId: entity.groupId,
            tileX,
            tileY,
            x: tileX * this.tileSize,
            y: tileY * this.tileSize,
            width: this.tileSize,
            height: this.tileSize,
            image: entity.image || this.assets['monster'],
            isActive: true,
        };
        this.monsters.push(monster);
        if (this.turnManager) {
            this.turnManager.entities = [this.player, ...this.monsters];
        }
    }

    /**
     * 게임에서 사용 중인 플레이어 엔티티를 월드맵 전용 데이터로 초기화한다.
     * @param {object} entity - Game에서 생성한 플레이어 객체
     */
    setPlayer(entity) {
        this.player = {
            x: this.tileSize * 2,
            y: this.tileSize * 2,
            tileX: 2,
            tileY: 2,
            width: entity?.width || this.tileSize,
            height: entity?.height || this.tileSize,
            speed: 5,
            image: entity?.image || this.assets['player'],
            groupId: entity?.groupId,
            entity
        };
        if (this.movementEngine) {
            this.player.movementEngine = this.movementEngine;
        }
        if (this.turnManager) {
            this.turnManager.entities = [this.player, ...this.monsters];
        }
    }

    update(deltaTime) {
        if (!this.player) return;
        this.handleResetFollow();

        if (!this.turnManager) {
            if (this.movementEngine) this.movementEngine.update(deltaTime);
            this.updateCamera();
            return;
        }

        if (this.turnManager.isActionInProgress()) {
            if (this.movementEngine) this.movementEngine.update(deltaTime);
            this.updateCamera();
            return;
        }

        if (this.turnManager.isPlayerTurn()) {
            this.handlePlayerTurn();
        } else {
            this.handleEnemyTurn();
        }

        if (this.movementEngine) this.movementEngine.update(deltaTime);
        this.updateCamera();
        this.checkCollisions();
    }

    handleResetFollow() {
        if (!this.followPlayer && Object.keys(this.game.inputHandler.keysPressed).length > 0) {
            this.followPlayer = true;
            this.isDragging = false;
        }
    }

    handlePlayerTurn() {
        const keys = this.game.inputHandler.keysPressed;
        if (this.movementEngine && this.movementEngine.isMoving(this.player)) return;

        let moved = false;
        const target = { x: this.player.tileX, y: this.player.tileY };

        if (keys['ArrowUp']) { target.y -= 1; moved = true; }
        else if (keys['ArrowDown']) { target.y += 1; moved = true; }
        else if (keys['ArrowLeft']) { target.x -= 1; moved = true; }
        else if (keys['ArrowRight']) { target.x += 1; moved = true; }

        if (moved) {
            if (target.x >= 0 && target.x < this.worldWidth / this.tileSize &&
                target.y >= 0 && target.y < this.worldHeight / this.tileSize) {
                this.movementEngine.startMovement(this.player, target);
                this.turnManager.nextTurn();
            }
        }
    }

    handleEnemyTurn() {
        // 월드맵의 적들은 플레이어를 추격하지 않는다.
        // 향후 AI 확장을 고려하여 턴 전환만 처리한다.
        this.turnManager.nextTurn();
    }

    startDrag(screenX, screenY) {
        this.isDragging = true;
        this.followPlayer = false;
        this.dragStart.x = screenX;
        this.dragStart.y = screenY;
        this.cameraStart.x = this.camera.x;
        this.cameraStart.y = this.camera.y;
    }

    drag(screenX, screenY) {
        if (!this.isDragging) return;
        const zoom = this.game.gameState.zoomLevel || 1;
        const deltaX = (screenX - this.dragStart.x) / zoom;
        const deltaY = (screenY - this.dragStart.y) / zoom;
        this.camera.x = this.cameraStart.x - deltaX;
        this.camera.y = this.cameraStart.y - deltaY;
        this.clampCamera();
    }

    endDrag() {
        this.isDragging = false;
    }

    updateCamera() {
        const canvasWidth = this.game.layerManager.layers.entity.width;
        const canvasHeight = this.game.layerManager.layers.entity.height;
        const zoom = this.game.gameState.zoomLevel || 1;
        if (this.followPlayer) {
            const targetX = this.player.x - canvasWidth / (2 * zoom);
            const targetY = this.player.y - canvasHeight / (2 * zoom);
            this.camera.x = targetX;
            this.camera.y = targetY;
        }
        this.clampCamera();
    }

    clampCamera() {
        const canvasWidth = this.game.layerManager.layers.entity.width;
        const canvasHeight = this.game.layerManager.layers.entity.height;
        const zoom = this.game.gameState.zoomLevel || 1;
        this.camera.x = Math.max(0, Math.min(this.camera.x, this.worldWidth - canvasWidth / zoom));
        this.camera.y = Math.max(0, Math.min(this.camera.y, this.worldHeight - canvasHeight / zoom));
    }

    checkCollisions() {
        for (const monster of this.monsters) {
            if (monster.isActive === false) continue;
            if (
                this.player.x < monster.x + monster.width &&
                this.player.x + this.player.width > monster.x &&
                this.player.y < monster.y + monster.height &&
                this.player.y + this.player.height > monster.y
            ) {
                this.game.eventManager.publish('start_combat', { monsterParty: monster });
                break;
            }
        }
    }

    render(baseCtx, decorCtx, entityCtx) {
        if (!this.player) return;
        const zoom = this.game.gameState.zoomLevel || 1;

        if (baseCtx) {
            baseCtx.save();
            baseCtx.scale(zoom, zoom);
            baseCtx.translate(-this.camera.x, -this.camera.y);
            if (this.renderManager && this.renderManager.renderMap) {
                this.renderManager.renderMap(baseCtx, this);
            } else {
                this._drawWorldMap(baseCtx);
            }
            baseCtx.restore();
        }

        if (decorCtx) {
            decorCtx.save();
            decorCtx.scale(zoom, zoom);
            decorCtx.translate(-this.camera.x, -this.camera.y);
            this.gridRenderer.render(decorCtx);
            decorCtx.restore();
        }

        if (entityCtx) {
            entityCtx.save();
            entityCtx.scale(zoom, zoom);
            entityCtx.translate(-this.camera.x, -this.camera.y);
            if (this.renderManager && this.renderManager.renderEntities) {
                this.renderManager.renderEntities(entityCtx, [this.player, ...this.monsters]);
            } else {
                this._drawEntities(entityCtx);
            }
            entityCtx.restore();
        }
    }

    _drawWorldMap(ctx) {
        const worldTileImg = this.worldMapImage;
        const seaTileImg = this.assets['sea-tile'];
        if (!worldTileImg || !seaTileImg) return;

        const worldWidth = this.worldWidth;
        const worldHeight = this.worldHeight;

        // 전투 맵과 같은 크기의 타일을 반복하여 월드맵을 그린다
        const renderTileSize = this.tileSize;

        // 전체 영역을 바다 타일로 채움
        const seaPattern = ctx.createPattern(seaTileImg, 'repeat');
        if (seaPattern) {
            ctx.fillStyle = seaPattern;
            ctx.fillRect(0, 0, worldWidth, worldHeight);
        }

        // 육지를 작은 타일 이미지로 반복 렌더링
        for (let y = this.tileSize; y < worldHeight - this.tileSize; y += renderTileSize) {
            for (let x = this.tileSize; x < worldWidth - this.tileSize; x += renderTileSize) {
                ctx.drawImage(worldTileImg, x, y, renderTileSize, renderTileSize);
            }
        }
    }

    _drawEntities(ctx) {
        if (this.player && this.player.image) {
            ctx.drawImage(this.player.image, this.player.x, this.player.y, this.player.width, this.player.height);
        }
        this.monsters.forEach(monster => {
            if (monster.image) {
                ctx.drawImage(monster.image, monster.x, monster.y, monster.width, monster.height);
            }
        });
    }
}
