/**
 * 프로세스 종료 및 정리를 관리하는 매니저.
 * 특정 이벤트가 발생했을 때 등록된 정리 작업들을 실행합니다.
 */
export class ProcessTerminationManager {
    /**
     * @param {object} eventManager - 게임의 이벤트 매니저 인스턴스
     */
    constructor(eventManager) {
        if (!eventManager) {
            throw new Error('ProcessTerminationManager는 EventManager 인스턴스가 필요합니다.');
        }
        this.eventManager = eventManager;
        this.tasks = new Map(); // Key: eventName, Value: Array of cleanup functions
    }

    /**
     * 특정 이벤트가 발생했을 때 실행할 정리 작업을 등록합니다.
     * @param {string} eventName - 작업을 실행시킬 이벤트의 이름 (예: 'battle_ended')
     * @param {function} task - 실행할 콜백 함수
     */
    register(eventName, task) {
        // 해당 이벤트에 대한 작업 목록이 없으면 새로 생성하고 이벤트를 구독합니다.
        if (!this.tasks.has(eventName)) {
            this.tasks.set(eventName, []);
            // 해당 이벤트가 발생하면 등록된 모든 작업을 실행하도록 리스너를 추가합니다.
            this.eventManager.subscribe(eventName, () => this.executeTasks(eventName));
        }
        // 해당 이벤트의 작업 목록에 새로운 작업을 추가합니다.
        this.tasks.get(eventName).push(task);
        console.log(`[TerminationManager] '${eventName}' 이벤트에 대한 정리 작업이 등록되었습니다.`);
    }

    /**
     * 특정 이벤트에 등록된 모든 작업을 실행합니다.
     * @param {string} eventName - 실행할 이벤트의 이름
     */
    executeTasks(eventName) {
        const tasksToRun = this.tasks.get(eventName);
        if (tasksToRun && tasksToRun.length > 0) {
            console.log(`[TerminationManager] '${eventName}' 이벤트 발생. ${tasksToRun.length}개의 정리 작업을 실행합니다.`);
            for (const task of tasksToRun) {
                try {
                    task();
                } catch (error) {
                    console.error(`[TerminationManager] '${eventName}' 이벤트 작업 실행 중 오류 발생:`, error);
                }
            }
        }
    }
}
