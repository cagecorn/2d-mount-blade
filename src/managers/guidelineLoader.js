// src/managers/guidelineLoader.js
import { SETTINGS } from '../../config/gameSettings.js';

export default class GuidelineLoader {
    constructor(
        url = SETTINGS.GUIDELINE_REPO_URL,
        fallbackFile = SETTINGS.DEFAULT_GUIDELINE_FILE,
        fetchFn = (typeof fetch !== 'undefined' ? fetch : null)
    ) {
        this.url = url;
        this.fallbackFile = fallbackFile;
        // bind or wrap fetch so that the global context is preserved.
        if (typeof fetchFn === 'function') {
            // Using an arrow function avoids "Illegal invocation" errors
            // when the native fetch implementation expects the global
            // object as its context.
            this.fetch = (...args) => fetchFn(...args);
        } else {
            this.fetch = null;
        }
        this.guidelines = {};
    }

    async fetchMarkdownList() {
        if (!this.url) {
            console.warn('[GuidelineLoader] No GUIDELINE_REPO_URL configured');
            return [];
        }
        const apiUrl = `https://api.github.com/repos/${this.url}`;
        try {
            const res = await this.fetch(apiUrl);
            if (!res.ok) {
                console.warn('[GuidelineLoader] Failed to fetch list:', res.status);
                return [];
            }
            const files = await res.json();
            return files.filter(f => f.name && f.name.endsWith('.md'));
        } catch (e) {
            console.warn('[GuidelineLoader] Error fetching list', e);
            return [];
        }
    }

    async load() {
        const list = await this.fetchMarkdownList();
        const guidelines = {};
        if (list.length === 0 && this.fallbackFile) {
            const fallback = await this.loadFallback();
            this.guidelines = fallback;
            return fallback;
        }
        for (const file of list) {
            try {
                const res = await this.fetch(file.download_url);
                if (!res.ok) {
                    console.warn('[GuidelineLoader] Failed to fetch', file.name);
                    continue;
                }
                const text = await res.text();
                const key = file.name.replace(/\.md$/, '');
                guidelines[key] = this.parseMarkdown(text);
            } catch (e) {
                console.warn('[GuidelineLoader] Error loading', file.name, e);
            }
        }
        this.guidelines = guidelines;
        console.log(`[GuidelineLoader] Loaded ${Object.keys(guidelines).length} guidelines`);
        return guidelines;
    }

    async loadFallback() {
        try {
            const res = await this.fetch(this.fallbackFile);
            if (!res.ok) {
                console.warn('[GuidelineLoader] Failed to fetch fallback', this.fallbackFile, res.status);
                return {};
            }
            const text = await res.text();
            const key = this.fallbackFile.split('/').pop().replace(/\.md$/, '');
            const data = {};
            data[key] = this.parseMarkdown(text);
            console.log('[GuidelineLoader] Loaded fallback guideline');
            return data;
        } catch (e) {
            console.warn('[GuidelineLoader] Error loading fallback', e);
            return {};
        }
    }

    parseMarkdown(md) {
        const lines = md.split(/\r?\n/);
        const sections = [];
        let current = null;
        for (const line of lines) {
            const h = line.match(/^#\s+(.*)/);
            if (h) {
                if (current) sections.push(current);
                current = { title: h[1], bullets: [] };
            } else if (/^[-*]\s+/.test(line)) {
                if (!current) current = { title: 'General', bullets: [] };
                current.bullets.push(line.replace(/^[-*]\s+/, '').trim());
            }
        }
        if (current) sections.push(current);
        return sections;
    }

    getGuidelines() {
        return this.guidelines;
    }
}
