export class WorkflowManager {
    constructor(context) {
        // Store a shared context containing references to all managers.
        // Individual workflows will use this when instantiated.
        this.context = context;
        this.workflows = new Map();
    }

    /**
     * Register a workflow class under a symbolic name.
     * @param {string} name
     * @param {Function} workflowClass
     */
    register(name, workflowClass) {
        if (this.workflows.has(name)) {
            console.warn(`[WorkflowManager] '${name}' is already registered.`);
            return;
        }
        this.workflows.set(name, workflowClass);
    }

    /**
     * Trigger a previously registered workflow by name.
     * Additional arguments are forwarded to the workflow's execute method.
     * @param {string} name
     */
    trigger(name, ...args) {
        const WorkflowClass = this.workflows.get(name);
        if (!WorkflowClass) {
            console.error(`[WorkflowManager] Workflow '${name}' not found.`);
            return;
        }
        const instance = new WorkflowClass(this.context);
        if (typeof instance.execute === 'function') {
            instance.execute(...args);
        }
    }
}
