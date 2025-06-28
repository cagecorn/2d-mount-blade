import { createSquadManagementUI } from '../ui/squad-management-ui/squad-management-ui.js';

export class BattlePreparationState extends Phaser.State {
    create() {
        // 1. 검은색 배경 설정
        this.game.stage.backgroundColor = '#000000';

        // 2. 부대 편성 UI 생성 및 표시
        this.squadManagementUI = createSquadManagementUI(this.game);
        this.game.world.add(this.squadManagementUI);

        console.log("전투 준비 페이즈 시작");
    }
}
