// src/utils/tf-loader.js

class TensorFlowLoader {
    constructor() {
        this.tf = null;
        this.cocoSsd = null;
        this.knnClassifier = null;
        this.tfvis = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return true;
        try {
            if (typeof window !== 'undefined') {
                // 브라우저 환경: 전역 window 객체에서 라이브러리를 가져온다.
                this.tf = window.tf;
                this.cocoSsd = window.cocoSsd;
                this.knnClassifier = window.knnClassifier;
                this.tfvis = window.tfvis;

                if (!this.tf) {
                    throw new Error('TensorFlow.js (tf) not found on window object.');
                }
                if (!this.cocoSsd) {
                    console.warn('[tf-loader] coco-ssd not found on window object.');
                }
                if (!this.knnClassifier) {
                    console.warn('[tf-loader] knn-classifier not found on window object.');
                }

                await this.tf.ready();
                console.log('[tf-loader] TensorFlow.js backend:', this.tf.getBackend());
                console.log('[tf-loader] All TensorFlow libraries initialized successfully from <script> tags.');
            } else {
                // 테스트나 Node.js 환경: 최소 기능을 제공하는 모의 객체를 사용한다.
                console.warn('[tf-loader] window object not found; using mock TensorFlow objects');
                this.tf = {
                    tensor: () => ({}),
                    dispose: () => {},
                    ready: async () => {},
                    getBackend: () => 'mock'
                };
                this.cocoSsd = {};
                this.knnClassifier = {};
                this.tfvis = {};
            }
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('[tf-loader] Failed to initialize TensorFlow libraries:', error);
            return false;
        }
    }

    getTf() {
        return this.tf;
    }

    // 아래 함수들은 동적 로드를 하지 않지만,
    // 기존 코드와의 호환성을 위해 객체를 반환하도록 유지한다.
    async loadCocoSsd() {
        return this.cocoSsd;
    }

    async loadKnnClassifier() {
        return this.knnClassifier;
    }
}

const tfLoader = new TensorFlowLoader();
export default tfLoader;
