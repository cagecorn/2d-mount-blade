import { TensorFlowController } from '../arena/TensorFlowController.js';
import tfLoader from '../utils/tf-loader.js';

export class ArenaTensorFlowManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.controllers = [];
    }

    async assignControllers(units = []) {
        await tfLoader.init();
        const tf = tfLoader.getTf();
        this.controllers = [];
        const teams = {};
        for (const u of units) {
            if (!teams[u.team]) teams[u.team] = u;
        }
        for (const team in teams) {
            const unit = teams[team];
            const controller = new TensorFlowController(tf);
            unit.tfController = controller;
            this.controllers.push({ unit, controller });
            if (this.eventManager) {
                this.eventManager.publish('arena_log', {
                    eventType: 'tf_control_assigned',
                    message: `TensorFlow가 ${unit.id}을(를) 조종합니다`
                });
            }
        }
    }
}
