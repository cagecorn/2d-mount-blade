# Arena Integration Log

이 문서는 아레나 모드에 본 게임 전투 로직을 단계별로 통합한 과정을 기록합니다.

## 1단계: 핵심 매니저 연결 (세션 21)
- `ArenaManager`가 `CombatCalculator`, `MovementManager`, `MotionManager` 참조를 저장하도록 수정했습니다.
- `Unit` 클래스가 위 매니저들과 `EventManager`를 받아 실제 전투 로직을 공통 모듈을 통해 수행하도록 변경했습니다.
- `damage_calculated` 이벤트를 활용해 공격 결과를 처리하고 로그를 남기도록 구현했습니다.
- 기존 임시 공격 처리 코드를 정리하고 아레나에서도 동일한 계산식을 사용하게 되었습니다.

이후 단계에서는 스킬/아이템 데이터 공유 검증과 AI 엔진 통합을 진행할 예정입니다.
