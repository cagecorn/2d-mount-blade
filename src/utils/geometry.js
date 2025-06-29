// src/utils/geometry.js

// 두 점 사이에 벽이 있는지 확인하는 시야선(Line of Sight) 함수
export function hasLineOfSight(x0, y0, x1, y1, mapManager) {
    // allow calling with (posA, posB, mapManager)
    if (typeof x0 === 'object' && typeof y0 === 'object' && x1 && x1.isWallAt) {
        mapManager = x1;
        x1 = Math.floor(y0.x / mapManager.tileSize);
        y1 = Math.floor(y0.y / mapManager.tileSize);
        y0 = Math.floor(x0.y / mapManager.tileSize);
        x0 = Math.floor(x0.x / mapManager.tileSize);
    }

    if (
        !mapManager ||
        typeof mapManager.isWallAt !== 'function' ||
        [x0, y0, x1, y1].some(v => typeof v !== 'number' || Number.isNaN(v))
    ) {
        return false;
    }

    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    const maxSteps = dx + Math.abs(dy) + 1;

    for (let step = 0; step < maxSteps; step++) {
        if (x0 === x1 && y0 === y1) return true;
        if (mapManager.isWallAt(x0 * mapManager.tileSize, y0 * mapManager.tileSize)) {
            return false;
        }
        const e2 = 2 * err;
        if (e2 >= dy) {
            err += dy;
            x0 += sx;
        }
        if (e2 <= dx) {
            err += dx;
            y0 += sy;
        }
    }

    return false;
}

// 두 엔티티 간의 중심 거리 계산
export function calculateDistance(a, b) {
    const ax = a.x + (a.width || 0) / 2;
    const ay = a.y + (a.height || 0) / 2;
    const bx = b.x + (b.width || 0) / 2;
    const by = b.y + (b.height || 0) / 2;
    return Math.hypot(ax - bx, ay - by);
}
