export class CanvasArenaRenderer {
    render(contexts, mapManager, assets, units = []) {
        if (!contexts) return;
        mapManager.render(contexts.mapBase, contexts.mapDecor, assets);
        for (const unit of units) {
            if (typeof unit.render === 'function') unit.render(contexts.entity);
        }
    }
}
