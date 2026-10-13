import { parseInput, videoIdFromOembed, indexKey, decryptRow } from './lib.js';
import { STRINGS, pickLang } from './i18n.js';

const lang = pickLang();
const t = STRINGS[lang];
const $ = (id) => document.getElementById(id);

// --- i18n -------------------------------------------------------------------
document.documentElement.lang = lang;
document.title = t.title;
document.querySelectorAll('[data-i18n]').forEach((el) => (el.textContent = t[el.dataset.i18n]));
document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => (el.placeholder = t[el.dataset.i18nPlaceholder]));
$('lang').textContent = t.langSwitch;
$('lang').href = lang === 'id' ? '?lang=en' : '?lang=id';

// --- table ------------------------------------------------------------------
let tablePromise;
function loadTable() {
  tablePromise ||= fetch('links.json', { cache: 'no-cache' }).then((r) => {
    if (!r.ok) throw new Error('table');
    return r.json();
  });
  return tablePromise;
}

// --- UI helpers -------------------------------------------------------------
function showError(key) {
  $('result').hidden = true;
  $('error').textContent = t[key];
  $('error').hidden = false;
}

function busy(on) {
  $('submit').disabled = on;
  $('submit').textContent = on ? t.loading : t.submit;
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = t.copied;
    setTimeout(() => (button.textContent = t.copy), 1500);
  } catch {
    showError('errCopy');
  }
}

// Light client-side throttle. TikTok rate-limits oEmbed per visitor IP on its
// side, and there is no server here to abuse.
let lastSubmit = 0;

// --- flow -------------------------------------------------------------------
async function resolveVideoId(parsed) {
  if (parsed.kind === 'long') return parsed.videoId;
  // TikTok's oEmbed endpoint follows the short link server-side and allows
  // browser CORS, so no backend is needed to expand vt./vm. links.
  let res;
  try {
    res = await fetch('https://www.tiktok.com/oembed?url=' + encodeURIComponent(parsed.url), { referrerPolicy: 'no-referrer' });
  } catch {
    // TikTok's error responses carry no CORS header, so a dead short link
    // surfaces as a fetch failure. Only blame the network when offline.
    throw navigator.onLine === false ? 'errNetwork' : 'errExpired';
  }
  if (!res.ok) throw 'errExpired';
  const data = await res.json().catch(() => null);
  const id = videoIdFromOembed(data);
  if (!id) throw 'errExpired';
  return id;
}

async function reveal(raw) {
  $('error').hidden = true;
  if (!raw.trim()) return showError('errEmpty');

  const parsed = parseInput(raw);
  if (parsed.kind === 'not_tiktok') return showError('errNotTiktok');
  if (parsed.kind === 'invalid') return showError('errInvalid');

  const now = Date.now();
  if (now - lastSubmit < 1500) return;
  lastSubmit = now;

  busy(true);
  try {
    const [videoId, table] = await Promise.all([resolveVideoId(parsed), loadTable().catch(() => { throw 'errNetwork'; })]);
    const row = table.rows[await indexKey(videoId)];
    if (!row) throw 'errNoLink';
    const entry = await decryptRow(videoId, row);
    render(entry, parsed);
  } catch (key) {
    showError(typeof key === 'string' && t[key] ? key : 'errNetwork');
  } finally {
    busy(false);
  }
}

function render(entry, parsed) {
  $('reveal').textContent = entry.reveal_url;
  $('reveal').href = entry.reveal_url;
  $('open').href = entry.reveal_url;

  // Premium code only for pasted short links: those come from Share → Copy
  // link, which is what bumps the share count. Soft gate, not proof.
  const hasCode = Boolean(entry.premium_code);
  const earned = hasCode && parsed.kind === 'short';
  $('premium').hidden = !earned;
  $('premiumHint').hidden = !hasCode || earned;
  if (earned) $('code').textContent = entry.premium_code;

  $('result').hidden = false;
}

// --- events -----------------------------------------------------------------
$('form').addEventListener('submit', (e) => {
  e.preventDefault();
  reveal($('url').value);
});

$('paste').addEventListener('click', async () => {
  try {
    const text = await navigator.clipboard.readText();
    $('url').value = text;
    if (text.trim()) reveal(text);
  } catch {
    showError('errPastePermission');
    $('url').focus();
  }
});

$('copy').addEventListener('click', (e) => copyText($('reveal').href, e.currentTarget));
$('copyCode').addEventListener('click', (e) => copyText($('code').textContent, e.currentTarget));

// Support ?u=<link> so the page can be opened pre-filled.
const prefill = new URLSearchParams(location.search).get('u');
if (prefill) {
  $('url').value = prefill;
  reveal(prefill);
}
loadTable().catch(() => {});
