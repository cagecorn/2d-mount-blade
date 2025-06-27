// src/workers/pathfinding.worker.js

// 간단한 A* 혹은 직선 경로 계산을 수행하는 워커
function findPath(grid, start, end) {
    const path = [];
    let current = { ...start };
    while (current.x !== end.x || current.y !== end.y) {
        if (current.x < end.x) current.x++;
        else if (current.x > end.x) current.x--;
        if (current.y < end.y) current.y++;
        else if (current.y > end.y) current.y--;
        path.push({ ...current });
    }
    return path;
}

self.onmessage = (event) => {
    const { grid, start, end } = event.data;
    const path = findPath(grid, start, end);
    self.postMessage(path);
};
