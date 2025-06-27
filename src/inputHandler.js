export class InputHandler {
    // 생성자를 수정하여 game 객체를 받습니다.
    constructor(game) {
        this.game = game;
        this.keysPressed = {};
        this._setupListeners();
    }

    _setupListeners() {
        document.addEventListener('keydown', (event) => this.handleKeyDown(event));
        document.addEventListener('keyup', (event) => {
            delete this.keysPressed[event.key];
        });
        // 추가: 마우스 휠 이벤트 리스너
        document.addEventListener('wheel', (e) => this.handleMouseWheel(e), { passive: false });
    }

    handleKeyDown(e) {
        this.keysPressed[e.key] = true;
        switch (e.key) {
            case 'd': // 'D' 키를 누르면 데이터 다운로드
                this.game?.dataRecorder?.downloadData();
                break;
            default:
                break;
        }
        if (['1', '2', '3', '4'].includes(e.key)) {
            this.game.eventManager?.publish('key_pressed', { key: e.key });
        }
    }

    // 장비창 휠 전환 기능과 카메라 줌을 모두 처리합니다.
    handleMouseWheel(e) {
        const uiManager = this.game.uiManager;

        if (uiManager.characterSheetPanel && !uiManager.characterSheetPanel.classList.contains('hidden')) {
            // 장비창이 열려있을 땐 기본 스크롤/줌 동작을 막고 캐릭터를 전환합니다.
            e.preventDefault();

            const party = this.game.getPartyMembers();
            if (party.length <= 1) return;

            const currentId = uiManager.currentCharacterId;
            const currentIndex = party.findIndex(member => member.id === currentId);
            if (currentIndex === -1) return;

            const nextIndex = e.deltaY < 0
                ? (currentIndex - 1 + party.length) % party.length
                : (currentIndex + 1) % party.length;

            uiManager.displayCharacterSheet(party[nextIndex]);
        } else {
            // 장비창이 열려 있지 않으면 카메라 줌 이벤트를 발행합니다.
            e.preventDefault();
            const direction = Math.sign(e.deltaY);
            this.game.eventManager?.publish('mouse_wheel', { direction });
        }
    }
}
