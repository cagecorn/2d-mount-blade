import { SYNERGIES } from '../data/synergies.js';

// A self-contained "engine" for managing tooltips.
// This prevents tooltip errors from breaking the rest of the UI.
class TooltipEngine {
    constructor() {
        this.element = document.createElement('div');
        this.element.id = 'game-tooltip';
        this.element.className = 'tooltip ui-frame hidden'; // Use existing styles
        document.body.appendChild(this.element);
    }

    show(event, content) {
        if (!content) return;
        this.element.innerHTML = content;
        this.element.classList.remove('hidden');
        this.updatePosition(event);
    }

    hide() {
        this.element.classList.add('hidden');
    }

    updatePosition(event) {
        const rect = this.element.getBoundingClientRect();
        let left = event.pageX + 15;
        let top = event.pageY + 15;

        if (left + rect.width > window.innerWidth) {
            left = window.innerWidth - rect.width - 15;
        }
        if (top + rect.height > window.innerHeight) {
            top = window.innerHeight - rect.height - 15;
        }

        this.element.style.left = `${left}px`;
        this.element.style.top = `${top}px`;
    }

    // Safer HTML generation for tooltips
    generateItemTooltipHTML(item) {
        if (!item) return '';

        try {
            const rarityColor = {
                'rare': '#4e9af1',
                'unique': '#ff8000'
            }[item.tier] || 'white';

            let html = `<h3 style="color: ${rarityColor};">${item.name || '알 수 없는 아이템'}</h3>`;
            html += `<p>등급: ${item.tier || '일반'}</p>`;
            if (item.type) {
                html += `<p>종류: ${item.type}</p>`;
            }

            const stats = item.stats instanceof Map ? Object.fromEntries(item.stats) : item.stats;
            if (stats && Object.keys(stats).length > 0) {
                html += '<h4>능력치</h4><ul>';
                for (const [stat, value] of Object.entries(stats)) {
                    html += `<li>${stat}: ${value}</li>`;
                }
                html += '</ul>';
            }
            
            if(item.weight || item.toughness || item.durability) {
                html += '<h4>미시세계 스탯</h4><ul>';
                if(item.weight) html += `<li>무게(공격력): ${item.weight}</li>`;
                if(item.toughness) html += `<li>강인함(방어력): ${item.toughness}</li>`;
                if(item.durability) html += `<li>내구도(HP): ${item.durability}</li>`;
                html += '</ul>';
            }


            if (item.synergies && Array.isArray(item.synergies) && item.synergies.length > 0) {
                html += '<h4>시너지</h4><ul>';
                item.synergies.forEach(key => {
                    const data = SYNERGIES[key];
                    const name = data ? `${data.icon || ''} ${data.name}` : key;
                    html += `<li>${name}</li>`;
                });
                html += '</ul>';
            }
            
            return html;
        } catch (error) {
            console.error("Error generating tooltip:", error, item);
            return "툴팁 정보를 불러올 수 없습니다.";
        }
    }
}


export class UIManager {
    constructor(eventManager, entityManager) {
        this.eventManager = eventManager;
        this.entityManager = entityManager;
        this.synergyManager = null;
        this.squads = [];
        this.formationManager = null;
        this.openCharacterSheets = new Map();
        this.handlers = {};

        // The "Small Engine" for tooltips.
        this.tooltipEngine = new TooltipEngine();

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

    setSynergyManager(manager) {
        this.synergyManager = manager;
    }

    /**
     * 초기화 메서드. 게임에서 전달한 핸들러를 저장하고 버튼 이벤트를 연결합니다.
     * @param {object} handlers - { onStatUp, onItemUse, onConsumableUse, onEquipItem }
     */
    init(handlers = {}) {
        this.handlers = handlers;

        // 스탯 증가 버튼 설정
        document.querySelectorAll('.stat-plus').forEach(btn => {
            btn.onclick = () => {
                const stat = btn.id.replace('btn-plus-', '');
                this.handlers.onStatUp?.(stat);
            };
        });

        return this;
    }

    showPanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.remove('hidden');
    }

    hidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) panel.classList.add('hidden');
    }

    showCharacterSheet(entity) {
        if (!entity) return;
        let panel = this.openCharacterSheets.get(entity.id);
        if (!panel) {
            const template = document.getElementById('character-sheet-template');
            if (!template) return;
            panel = template.cloneNode(true);
            panel.id = `character-sheet-${entity.id}`;
            panel.classList.remove('template');
            document.body.appendChild(panel);
            panel.querySelector('.close-btn').onclick = () => {
                this.hideCharacterSheet(entity.id);
            };
            this.openCharacterSheets.set(entity.id, panel);
        }
        panel.classList.remove('hidden');
        this.renderCharacterSheet(entity, panel);
    }

    hideCharacterSheet(entityId) {
        const panel = this.openCharacterSheets.get(entityId);
        if (panel) {
            panel.classList.add('hidden');
        }
    }

    renderCharacterSheet(entity, panel) {
        if (!entity || !panel) return;
        const nameEl = panel.querySelector('#sheet-character-name');
        if (nameEl) nameEl.textContent = entity.name || 'Character';
        const stats = panel.querySelector('#player-stats-container');
        if (stats) {
            stats.querySelector('#ui-player-level').textContent = entity.level ?? 1;
            stats.querySelector('#ui-player-strength').textContent = entity.strength ?? 0;
            stats.querySelector('#ui-player-agility').textContent = entity.agility ?? 0;
            stats.querySelector('#ui-player-endurance').textContent = entity.endurance ?? 0;
            stats.querySelector('#ui-player-focus').textContent = entity.focus ?? 0;
            stats.querySelector('#ui-player-intelligence').textContent = entity.intelligence ?? 0;
            stats.querySelector('#ui-player-movement').textContent = entity.movement ?? 0;
            stats.querySelector('#ui-player-movementSpeed').textContent = entity.movementSpeed ?? 0;
            stats.querySelector('#ui-player-attackPower').textContent = entity.attackPower ?? 0;
        }
    }

    renderInventory(gameState) {
        const grid = document.querySelector('#inventory-panel .inventory-grid');
        if (!grid) return;
        grid.innerHTML = '';
        (gameState.inventory || []).forEach((item, idx) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-item-slot';
            if (item.image) {
                const img = document.createElement('img');
                img.src = item.image.src || item.image;
                slot.appendChild(img);
            } else {
                slot.textContent = item.name?.[0] || '?';
            }
            if (item.quantity > 1) {
                const qty = document.createElement('div');
                qty.className = 'item-qty';
                qty.textContent = item.quantity;
                slot.appendChild(qty);
            }
            slot.onclick = () => this.handlers.onItemUse?.(idx);
            grid.appendChild(slot);
        });
    }

    /**
     * 공유 인벤토리(UI 패널 왼쪽 하단)에 현재 보유한 아이템을 표시합니다.
     * InventoryManager에서 주입된 getSharedInventory() 함수를 활용합니다.
     */
    renderSharedInventory() {
        const inventory = this.getSharedInventory ? this.getSharedInventory() : [];
        const container = document.getElementById('inventory-slots');
        if (!container) return;

        container.innerHTML = '';
        const slots = inventory.slots ? inventory.slots : inventory;
        slots.forEach((item) => {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';

            if (item) {
                if (item.image) {
                    const img = document.createElement('img');
                    img.src = item.image.src || item.image;
                    slot.appendChild(img);
                } else {
                    slot.textContent = item.name?.[0] || '?';
                }

                // Use the new tooltip engine
                slot.addEventListener('mouseover', (e) => {
                    const tooltipContent = this.tooltipEngine.generateItemTooltipHTML(item);
                    this.tooltipEngine.show(e, tooltipContent);
                });
                slot.addEventListener('mouseout', () => this.tooltipEngine.hide());
                slot.addEventListener('mousemove', (e) => this.tooltipEngine.updatePosition(e));
            }

            container.appendChild(slot);
        });
    }

    updateUI(gameState) {
        if (!gameState?.player) return;
        const p = gameState.player;
        const hpEl = document.getElementById('ui-player-hp');
        const maxHpEl = document.getElementById('ui-player-maxHp');
        const hpFill = document.getElementById('ui-hp-bar-fill');
        if (hpEl) hpEl.textContent = Math.floor(p.hp);
        if (maxHpEl) maxHpEl.textContent = Math.floor(p.maxHp);
        if (hpFill) hpFill.style.width = `${(p.hp / p.maxHp) * 100}%`;

        const mpEl = document.getElementById('ui-player-mp');
        const maxMpEl = document.getElementById('ui-player-maxMp');
        const mpFill = document.getElementById('ui-mp-bar-fill');
        if (mpEl) mpEl.textContent = Math.floor(p.mp ?? 0);
        if (maxMpEl) maxMpEl.textContent = Math.floor(p.maxMp ?? 0);
        if (mpFill && p.maxMp) mpFill.style.width = `${(p.mp / p.maxMp) * 100}%`;

        const goldEl = document.getElementById('ui-player-gold');
        if (goldEl) goldEl.textContent = p.gold ?? 0;
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
                    const tooltipContent = this.tooltipEngine.generateItemTooltipHTML(item);
                    this.tooltipEngine.show(e, tooltipContent);
                });
                itemSlot.addEventListener('mouseout', () => {
                    this.tooltipEngine.hide();
                });
                itemSlot.addEventListener('mousemove', (e) => {
                    this.tooltipEngine.updatePosition(e);
                });

                inventoryPanel.appendChild(itemSlot);
            }
        });
    }
}
