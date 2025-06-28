export class ArenaLogStorage {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.db = null;
        this.cacheName = 'arena-log-cache';
        this.storeName = 'logs';
    }

    async init() {
        if (typeof indexedDB === 'undefined') return;
        this.db = await new Promise((resolve, reject) => {
            const req = indexedDB.open('ArenaLogs', 1);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        this.setup();
    }

    setup() {
        if (!this.eventManager) return;
        this.eventManager.subscribe('arena_log', (data) => this.addLog(data));
    }

    addLog(data) {
        if (!this.db) return;
        const tx = this.db.transaction(this.storeName, 'readwrite');
        tx.objectStore(this.storeName).add({ timestamp: Date.now(), ...data });
    }

    async getAllLogs() {
        if (!this.db) return [];
        const tx = this.db.transaction(this.storeName, 'readonly');
        const req = tx.objectStore(this.storeName).getAll();
        return new Promise((res) => { req.onsuccess = () => res(req.result || []); });
    }

    async snapshotToCache() {
        const logs = await this.getAllLogs();
        const cache = await caches.open(this.cacheName);
        const blob = new Blob([JSON.stringify(logs)], { type: 'application/json' });
        const response = new Response(blob);
        await cache.put('snapshot-' + Date.now() + '.json', response);
    }
}
