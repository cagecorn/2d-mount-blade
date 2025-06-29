import { TensorFlowController } from '../arena/TensorFlowController.js';
import tfLoader from '../utils/tf-loader.js';

export class ArenaTensorFlowManager {
    constructor(eventManager) {
        this.eventManager = eventManager;
        this.controllers = [];
        this.tfInitialized = false; // TensorFlow init flag
    }

    async assignControllers(units = []) {
        if (!this.tfInitialized) {
            await tfLoader.init();
            this.tfInitialized = true;
        }
        const tf = tfLoader.getTf();
        this.controllers = [];
        const teams = {};
        for (const u of units) {
            if (!teams[u.team]) teams[u.team] = [];
            if (teams[u.team].length < 3) teams[u.team].push(u);
        }
        for (const team in teams) {
            for (const unit of teams[team]) {
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
}
