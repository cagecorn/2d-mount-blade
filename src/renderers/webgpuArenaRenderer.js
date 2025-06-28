export class WebGPUArenaRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.device = null;
        this.context = null;
    }

    async init() {
        if (!('gpu' in navigator)) {
            console.warn('[WebGPUArenaRenderer] WebGPU not supported');
            return;
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            console.warn('[WebGPUArenaRenderer] Failed to get GPU adapter');
            return;
        }
        this.device = await adapter.requestDevice();
        this.context = this.canvas.getContext('webgpu');
        const format = navigator.gpu.getPreferredCanvasFormat();
        this.context.configure({ device: this.device, format });
    }

    clear(color = [0, 0, 0, 1]) {
        if (!this.device || !this.context) return;
        const encoder = this.device.createCommandEncoder();
        const view = this.context.getCurrentTexture().createView();
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
                view,
                clearValue: { r: color[0], g: color[1], b: color[2], a: color[3] },
                loadOp: 'clear',
                storeOp: 'store'
            }]
        });
        pass.end();
        this.device.queue.submit([encoder.finish()]);
    }

    render(units = []) {
        this.clear([0.1, 0.1, 0.1, 1]);
        // TODO: implement real unit rendering with WebGPU
    }
}
