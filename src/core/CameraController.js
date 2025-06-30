export class CameraController {
  constructor(game) {
    this.game = game;
    this.cameraDrag = game.cameraDrag || {isDragging:false, dragStart:{x:0,y:0}, cameraStart:{x:0,y:0}, followPlayer:true};
  }

  startDragCamera(screenX, screenY) {
    const { cameraDrag, gameState } = this.game;
    cameraDrag.isDragging = true;
    cameraDrag.followPlayer = false;
    cameraDrag.dragStart.x = screenX;
    cameraDrag.dragStart.y = screenY;
    cameraDrag.cameraStart.x = gameState.camera.x;
    cameraDrag.cameraStart.y = gameState.camera.y;
  }

  dragCamera(screenX, screenY) {
    const { cameraDrag, gameState, layerManager, mapManager } = this.game;
    if (!cameraDrag.isDragging) return;
    const zoom = gameState.zoomLevel || 1;
    const deltaX = (screenX - cameraDrag.dragStart.x) / zoom;
    const deltaY = (screenY - cameraDrag.dragStart.y) / zoom;
    gameState.camera.x = cameraDrag.cameraStart.x - deltaX;
    gameState.camera.y = cameraDrag.cameraStart.y - deltaY;
    const canvas = layerManager.layers.mapBase;
    const mapPixelWidth = mapManager.width * mapManager.tileSize;
    const mapPixelHeight = mapManager.height * mapManager.tileSize;
    gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, mapPixelWidth - canvas.width / zoom));
    gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, mapPixelHeight - canvas.height / zoom));
  }

  endDragCamera() {
    this.game.cameraDrag.isDragging = false;
  }

  handleCameraReset() {
    const { cameraDrag, inputHandler } = this.game;
    if (!cameraDrag.followPlayer && Object.keys(inputHandler.keysPressed).length > 0) {
      cameraDrag.followPlayer = true;
      cameraDrag.isDragging = false;
    }
  }
}
