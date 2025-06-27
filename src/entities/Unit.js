// src/entities/Unit.js

// 1. 우리가 사용할 데이터 소스를 명확히 지정합니다.
import { AI_STRATEGIES, CLASS_STATS, SKILLS } from '../data/legacy_data.js';

/**
 * '궁극의 시스템'에 맞게 재탄생한 통합 Unit 클래스
 * - 이전 Unit의 풍부한 로직과
 * - 새로운 아키텍처의 의존성 주입 방식을 결합
 */
export class Unit {
    constructor(template, team, managers) {
        // --- 이전 unit.js의 생성자 로직 대부분을 그대로 가져옵니다 ---
        Object.assign(this, template); // 템플릿의 모든 속성을 복사
        this.id = `${this.name}_${(Math.random() + 1).toString(36).substring(7)}`;
        this.team = team;

        // 위치(pos)는 GridManager가 설정하므로 여기서는 초기화만 합니다.
        this.pos = { x: 0, y: 0 };

        this.maxHp = this.hp;
        this.skills = template.skills || [];
        Object.assign(this, CLASS_STATS[this.classType]);
        this.isDead = false;
        this.hasActed = false;
        this.shield = (this.stats?.valor || this.valor || 0) * 2; // [용맹] 스탯 적용
        this.maxShield = this.shield;

        this.aiStrategy = AI_STRATEGIES[template.ai];
        this.statusEffects = {};

        // ★★★ 핵심적인 연결(수술) 부분 ★★★
        // 전역 변수 대신, 생성 시 주입받은 매니저들을 자신의 속성으로 저장합니다.
        this.managers = managers;
    }

    // --- 이전 unit.js의 핵심 로직(메서드) 이식 ---
    // 이제부터 이 유닛은 전역 매니저가 아니라, '주입받은' 매니저를 사용합니다.

    takeTurn(enemies, allies) {
        if (this.isDead || this.hasActed) return;

        // 예시: 전역 logManager 대신, this.managers.logManager를 사용하도록 수정
        this.managers.logManager?.add(`${this.name}의 턴입니다.`);

        if (this.aiStrategy) {
            this.aiStrategy(this, enemies, allies);
        }
        this.hasActed = true;
    }

    moveTowards(target) {
        // 이 안의 로직은 이전 legacy_unit.js의 moveTowards와 거의 동일합니다.
        if (!target) return;
        const dx = Math.sign(target.pos?.x - this.pos.x);
        const dy = Math.sign(target.pos?.y - this.pos.y);
        this.pos.x += dx * (this.moveSpeed || 1);
        this.pos.y += dy * (this.moveSpeed || 1);
    }

    takeDamage(amount) {
        if (this.isDead) return;
        const dmg = Math.max(0, Math.floor(amount));
        this.hp -= dmg;

        this.managers.vfxManager?.addPopup(`-${dmg}`, this.pos, 'red');
        this.managers.logManager?.add(`${this.name}가 ${dmg}의 피해를 입었습니다!`);

        if (this.hp <= 0) {
            this.isDead = true;
            this.hp = 0;
        }
    }

    render(context) {
        // 이 부분은 우리의 Y-Sorting을 위한 렌더링 방식과 동일합니다.
        if (!this.image) return; // 이미지가 없다면 그리지 않음

        const drawX = this.pos.x - (this.image.width / 2);
        const drawY = this.pos.y - this.image.height;

        context.drawImage(this.image, Math.floor(drawX), Math.floor(drawY));
    }
}
