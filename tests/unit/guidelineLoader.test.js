import GuidelineLoader from '../../src/managers/guidelineLoader.js';
import { describe, test, assert } from '../helpers.js';

function mockFetch(responses) {
    const fetch = async (url) => {
        const key = Object.keys(responses).find(k => url.includes(k));
        const value = responses[key];
        if (Array.isArray(value)) {
            return { ok: true, json: async () => value };
        }
        return { ok: true, text: async () => value };
    };
    return fetch;
}

describe('GuidelineLoader', () => {
    test('loads and parses markdown', async () => {
        const list = [
            { name: 'guide.md', download_url: 'https://example.com/guide.md' }
        ];
        const md = '# Title\n- one\n- two';
        const loader = new GuidelineLoader('dummy/path', null, mockFetch({ 'api.github.com': list, 'example.com': md }));
        const data = await loader.load();
        assert.ok(data.guide);
        assert.strictEqual(data.guide[0].title, 'Title');
        assert.deepStrictEqual(data.guide[0].bullets, ['one', 'two']);
    });

    test('falls back when list fetch fails', async () => {
        const fetch = async (url) => {
            if (url.includes('fallback.md')) {
                return { ok: true, text: async () => '# Fallback\n- ok' };
            }
            throw new Error('network');
        };
        const loader = new GuidelineLoader('dummy/path', 'fallback.md', fetch);
        const data = await loader.load();
        assert.ok(data.fallback);
        assert.strictEqual(data.fallback[0].title, 'Fallback');
        assert.deepStrictEqual(data.fallback[0].bullets, ['ok']);
    });
});
