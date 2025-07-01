import { Entity } from './entities.js';
// 각 지휘관은 개인 수족관 전장을 보유합니다.
import { AquariumMapManager } from './aquariumMap.js';
/**
 * 고유 ID와 개인화된 전장을 보유한 지휘관 클래스입니다.
 */
export class Commander extends Entity {
    static nextCommanderId = 0;

    constructor(config) {
        super(config);
        this.commanderId = Commander.nextCommanderId++;
        this.battlefield = new AquariumMapManager(this.commanderId);
        console.log(`지휘관 생성됨: ID = ${this.commanderId}`);
    }
}
