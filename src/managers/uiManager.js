// src/managers/uiManager.js

export class UIManager {
    constructor(eventManager, entityManager) {
        this.eventManager = eventManager;
        this.entityManager = entityManager;
        this.squads = [];
        this.formationManager = null;

        // 툴팁 엘리먼트 생성 및 초기화
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.id = 'game-tooltip';
        this.tooltipElement.style.display = 'none';
        document.body.appendChild(this.tooltipElement);

        // 이벤트 구독
        this.eventManager?.subscribe('squads_updated', this.handleSquadsUpdate.bind(this));
        this.eventManager?.subscribe('formation_updated', this.handleFormationUpdate.bind(this));
        // 플레이어 인벤토리가 업데이트될 때 호출될 이벤트 구독
        this.eventManager?.subscribe('player_inventory_updated', this.renderPlayerInventory.bind(this));
    }

    // --- 기존 메서드 (handleSquadsUpdate, handleFormationUpdate 등) ---
    // 실제 게임 로직에서는 여기에 부대 관련 UI 업데이트 코드가 존재해야 합니다.
    handleSquadsUpdate(data) {
        this.squads = data.squads || [];
        this.renderSquadList();
    }

    renderSquadList() {
        // TODO: squad 목록을 화면에 표시하는 로직을 구현합니다.
    }

    handleFormationUpdate(data) {
        this.formationManager = data.formationManager || this.formationManager;
        this.renderFormationGrid();
    }

    renderFormationGrid() {
        // TODO: formation 그리드를 화면에 표시하는 로직을 구현합니다.
    }

    /**
     * 상세 툴팁을 생성하고 마우스 커서 주변에 표시합니다.
     * @param {MouseEvent} event - 마우스 이벤트
     * @param {string} htmlContent - 툴팁에 표시될 HTML 콘텐츠
     */
    showTooltip(event, htmlContent) {
        this.tooltipElement.innerHTML = htmlContent;
        this.tooltipElement.style.display = 'block';
        this.updateTooltipPosition(event);
    }

    /**
     * 툴팁을 숨깁니다.
     */
    hideTooltip() {
        this.tooltipElement.style.display = 'none';
    }

    /**
     * 마우스 움직임에 따라 툴팁 위치를 업데이트합니다.
     * @param {MouseEvent} event - 마우스 이벤트
     */
    updateTooltipPosition(event) {
        // 툴팁이 화면 가장자리를 벗어나지 않도록 처리
        const tooltipRect = this.tooltipElement.getBoundingClientRect();
        let left = event.pageX + 15;
        let top = event.pageY + 15;

        if (left + tooltipRect.width > window.innerWidth) {
            left = window.innerWidth - tooltipRect.width - 15;
        }
        if (top + tooltipRect.height > window.innerHeight) {
            top = window.innerHeight - tooltipRect.height - 15;
        }

        this.tooltipElement.style.left = `${left}px`;
        this.tooltipElement.style.top = `${top}px`;
    }

    /**
     * 아이템의 상세 정보를 바탕으로 툴팁에 들어갈 HTML을 생성합니다.
     * @param {object} item - 상세 정보가 필요한 아이템 객체
     * @returns {string} - 툴팁용 HTML 문자열
     */
    generateItemTooltipHTML(item) {
        if (!item) return '';

        // 아이템 희귀도에 따라 이름 색상을 다르게 할 수 있습니다. (예시)
        const rarityColor = item.rarity === 'legendary' ? 'orange' : 'white';
        let html = `<h3 style="color: ${rarityColor};">${item.name}</h3>`;
        html += `<p>타입: ${item.type || '일반'}</p>`;

        if (item.stats && Object.keys(item.stats).length > 0) {
            html += '<h4>능력치</h4><ul>';
            for (const [stat, value] of Object.entries(item.stats)) {
                html += `<li>${stat}: ${value}</li>`;
            }
            html += '</ul>';
        }

        if (item.affixes && item.affixes.length > 0) {
            html += '<h4>특수 효과</h4><ul>';
            item.affixes.forEach(affix => {
                html += `<li>${affix}</li>`;
            });
            html += '</ul>';
        }

        if (item.synergy) {
            html += `<h4>시너지</h4><p>${item.synergy.description || '없음'}</p>`;
        }

        return html;
    }

    /**
     * 플레이어의 인벤토리 UI를 렌더링합니다.
     * @param {object} data - { inventory: string[] } 형태의 인벤토리 아이템 ID 목록
     */
    renderPlayerInventory({ inventory }) {
        // HTML에 <div id="inventory-panel"></div> 가 있다고 가정합니다.
        const inventoryPanel = document.getElementById('inventory-panel');
        if (!inventoryPanel) {
            console.warn('UI: inventory-panel not found!');
            return;
        }

        inventoryPanel.innerHTML = '';

        (inventory || []).forEach(itemId => {
            const item = this.entityManager.getEntity(itemId);
            if (item) {
                const itemSlot = document.createElement('div');
                itemSlot.className = 'item-slot';
                itemSlot.textContent = item.name.substring(0, 1); // 아이템 이름 첫 글자 표시

                // 각 아이템 슬롯에 툴팁 이벤트 리스너 추가
                itemSlot.addEventListener('mouseover', (e) => {
                    const tooltipContent = this.generateItemTooltipHTML(item);
                    this.showTooltip(e, tooltipContent);
                });
                itemSlot.addEventListener('mouseout', () => {
                    this.hideTooltip();
                });
                itemSlot.addEventListener('mousemove', (e) => {
                    this.updateTooltipPosition(e);
                });

                inventoryPanel.appendChild(itemSlot);
            }
        });
    }
}
