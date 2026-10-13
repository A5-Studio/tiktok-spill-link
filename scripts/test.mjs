import assert from 'node:assert/strict';
import { parseInput, videoIdFromOembed, encryptRow, decryptRow, indexKey } from '../site/lib.js';

const cases = [
  ['https://vt.tiktok.com/ZSbo4Hcto/', { kind: 'short', code: 'ZSbo4Hcto', url: 'https://vt.tiktok.com/ZSbo4Hcto/' }],
  ['Lihat video ini https://vm.tiktok.com/ZMabc123/ keren', { kind: 'short', code: 'ZMabc123', url: 'https://vm.tiktok.com/ZMabc123/' }],
  ['vt.tiktok.com/ZSbo4Hcto', { kind: 'short', code: 'ZSbo4Hcto', url: 'https://vt.tiktok.com/ZSbo4Hcto/' }],
  ['https://www.tiktok.com/@user/video/7695714861950471444?is_from_webapp=1', { kind: 'long', videoId: '7695714861950471444' }],
  ['https://www.tiktok.com/@user', { kind: 'invalid' }],
  ['https://evil.com/vt.tiktok.com/x', { kind: 'not_tiktok' }],
  ['https://vt.tiktok.com.evil.com/x', { kind: 'not_tiktok' }],
  ['hello', { kind: 'invalid' }],
  ['', { kind: 'invalid' }],
];
for (const [input, expected] of cases) assert.deepEqual(parseInput(input), expected, input);

assert.equal(videoIdFromOembed({ embed_product_id: '7695714861950471444' }), '7695714861950471444');
assert.equal(videoIdFromOembed({ html: '<x data-video-id="7695714861950471444">' }), '7695714861950471444');
assert.equal(videoIdFromOembed({ code: 400 }), null);

const row = await encryptRow('123456789', { reveal_url: 'https://a.b', premium_code: 'X' });
assert.deepEqual(await decryptRow('123456789', row), { reveal_url: 'https://a.b', premium_code: 'X' });
await assert.rejects(decryptRow('987654321', row));
assert.equal((await indexKey('1')).length, 32);

console.log('All tests passed.');
