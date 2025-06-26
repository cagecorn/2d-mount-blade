import { EventEmitter } from '../utils/EventEmitter.js';

export class MicroWorldWorker extends EventEmitter {
    constructor() {
        super();
        const url = new URL('./microWorldWorkerThread.js', import.meta.url);
        this.worker = new Worker(url, { type: 'module' });
        this.worker.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg.type === 'resolveAttackComplete' || msg.type === 'updateComplete') return;
            this.emit(msg.type, msg.payload);
        });
    }

    resolveAttack(attacker, defender) {
        return new Promise((resolve) => {
            const listener = (event) => {
                const msg = event.data;
                if (msg.type === 'resolveAttackComplete') {
                    this.worker.removeEventListener('message', listener);
                    resolve(msg);
                }
            };
            this.worker.addEventListener('message', listener);
            this.worker.postMessage({ type: 'resolveAttack', attacker, defender });
        });
    }

    update(arg1, arg2) {
        // 기존 테스트 호환을 위해 배열이 전달되면 그대로 사용한다.
        let items = Array.isArray(arg1) ? arg1 : null;
        // 게임 루프에서 호출될 경우 (deltaTime, context) 형태다.
        if (!items && arg2 && arg2.itemManager) {
            items = arg2.itemManager.items;
        }

        return new Promise((resolve) => {
            const listener = (event) => {
                const msg = event.data;
                if (msg.type === 'updateComplete') {
                    this.worker.removeEventListener('message', listener);
                    resolve();
                }
            };
            this.worker.addEventListener('message', listener);
            this.worker.postMessage({ type: 'update', items });
        });
    }

    postMessage(data) {
        this.worker.postMessage(data);
    }

    subscribe(event, handler) {
        this.on(event, handler);
    }

    terminate() {
        this.worker.terminate();
    }
}
