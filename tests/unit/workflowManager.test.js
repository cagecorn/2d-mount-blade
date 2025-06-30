import { WorkflowManager } from '../../src/managers/workflowManager.js';
import { describe, test, assert } from '../helpers.js';

let callCount = 0;

class MockWorkflow {
    constructor(context) {
        this.context = context;
    }
    execute(...args) {
        callCount++;
    }
}

const mockContext = {
    uiManager: {},
    soundManager: {},
    combatManager: {}
};

describe('WorkflowManager', () => {
    test('register: 새로운 워크플로를 성공적으로 등록해야 한다', () => {
        const manager = new WorkflowManager(mockContext);
        manager.register('test-workflow', MockWorkflow);
        assert.ok(manager.workflows.has('test-workflow'));
        assert.strictEqual(manager.workflows.get('test-workflow'), MockWorkflow);
    });

    test('trigger: 등록된 워크플로를 찾아서 실행해야 한다', () => {
        const manager = new WorkflowManager(mockContext);
        callCount = 0;
        manager.register('test-workflow', MockWorkflow);
        manager.trigger('test-workflow');
        assert.strictEqual(callCount, 1);
    });

    test('trigger: 등록되지 않은 워크플로를 실행하려고 하면 조용히 실패해야 한다', () => {
        const manager = new WorkflowManager(mockContext);
        callCount = 0;
        manager.trigger('unknown-workflow');
        assert.strictEqual(callCount, 0);
    });
});
