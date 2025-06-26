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

    // 추가: 마우스 휠 이벤트를 처리하는 메서드
    handleMouseWheel(e) {
        const uiManager = this.game.uiManager;
        // 장비창이 열려 있을 때만 작동
        if (!uiManager.characterSheetPanel || uiManager.characterSheetPanel.classList.contains('hidden')) {
            return;
        }

        e.preventDefault();

        const party = this.game.getPartyMembers();
        if (party.length <= 1) return;

        const currentId = uiManager.currentCharacterId;
        const currentIndex = party.findIndex(member => member.id === currentId);
        if (currentIndex === -1) return;

        let nextIndex;
        if (e.deltaY < 0) {
            nextIndex = (currentIndex - 1 + party.length) % party.length;
        } else {
            nextIndex = (currentIndex + 1) % party.length;
        }

        const nextCharacter = party[nextIndex];
        uiManager.displayCharacterSheet(nextCharacter);
    }
}
