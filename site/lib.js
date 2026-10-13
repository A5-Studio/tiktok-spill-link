// Shared by the browser (app.js) and Node (build + tests). No dependencies.

const SHORT_HOSTS = ['vt.tiktok.com', 'vm.tiktok.com'];
const LONG_HOSTS = ['www.tiktok.com', 'tiktok.com', 'm.tiktok.com'];

// Pull the first URL out of whatever the user pasted (TikTok's share text
// sometimes wraps the link in a sentence).
export function parseInput(raw) {
  const text = String(raw || '').trim();
  const match = text.match(/https?:\/\/[^\s]+/i) || text.match(/(?:vt|vm|www|m)?\.?tiktok\.com\/[^\s]+/i);
  if (!match) return { kind: 'invalid' };

  let url;
  try {
    url = new URL(/^https?:\/\//i.test(match[0]) ? match[0] : 'https://' + match[0]);
  } catch {
    return { kind: 'invalid' };
  }

  const host = url.hostname.toLowerCase();
  if (SHORT_HOSTS.includes(host)) {
    const code = url.pathname.split('/').filter(Boolean)[0];
    if (!code || !/^[A-Za-z0-9]+$/.test(code)) return { kind: 'invalid' };
    return { kind: 'short', code, url: `https://${host}/${code}/` };
  }
  if (LONG_HOSTS.includes(host)) {
    const videoId = videoIdFromPath(url.pathname);
    return videoId ? { kind: 'long', videoId } : { kind: 'invalid' };
  }
  return { kind: 'not_tiktok' };
}

export function videoIdFromPath(path) {
  const m = String(path).match(/\/video\/(\d{8,25})/);
  return m ? m[1] : null;
}

// oEmbed response -> video ID.
export function videoIdFromOembed(data) {
  if (!data || typeof data !== 'object') return null;
  if (/^\d{8,25}$/.test(String(data.embed_product_id || ''))) return String(data.embed_product_id);
  const m = String(data.html || '').match(/data-video-id="(\d{8,25})"/);
  return m ? m[1] : null;
}

// --- Table encryption -------------------------------------------------------
// The table ships as a public static file. Each row is indexed by a hash of the
// video ID and AES-GCM encrypted with a key derived from the video ID, so
// reading the page source does not list your links. Anyone who already knows a
// video ID can still decrypt its row: this is obfuscation, not a hard gate.

const enc = new TextEncoder();

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function b64(buf) {
  let s = '';
  for (const b of new Uint8Array(buf)) s += String.fromCharCode(b);
  return btoa(s);
}

function unb64(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export async function indexKey(videoId) {
  return hex(await crypto.subtle.digest('SHA-256', enc.encode('tsl:idx:' + videoId))).slice(0, 32);
}

async function aesKey(videoId) {
  const raw = await crypto.subtle.digest('SHA-256', enc.encode('tsl:key:' + videoId));
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

export async function encryptRow(videoId, payload) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(videoId), enc.encode(JSON.stringify(payload)));
  return { iv: b64(iv), ct: b64(ct) };
}

export async function decryptRow(videoId, row) {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(row.iv) }, await aesKey(videoId), unb64(row.ct));
  return JSON.parse(new TextDecoder().decode(pt));
}
