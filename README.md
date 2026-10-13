# tiktok-spill-link

A mobile page where a TikTok viewer pastes the video's share link and gets the link the creator mentioned in the video, plus an optional premium code.

Runs entirely on **GitHub Pages**. There is no server: TikTok's public oEmbed endpoint (`https://www.tiktok.com/oembed?url=…`) expands `vt.`/`vm.tiktok.com` short links and allows browser CORS, so the page resolves the video ID itself.

## How it works

1. The user pastes a link. `site/lib.js` accepts only `vt.tiktok.com`, `vm.tiktok.com`, `www.tiktok.com`, `tiktok.com` and `m.tiktok.com`.
2. Short link: the page calls oEmbed and reads `embed_product_id` (the video ID). Full `…/video/<ID>` link: the ID is read directly.
3. The page looks up the ID in `links.json` and shows the link with Open and Copy buttons.
4. The premium code appears only when a **short** link was pasted (that link only comes from Share → Copy link).

## Edit the table

Format (see `data/videos.example.json`):

```json
[
  { "video": "https://www.tiktok.com/@you/video/7695714861950471444", "reveal_url": "https://your-link", "premium_code": "OPTIONAL", "active": true }
]
```

`video` takes a full video URL or the bare ID. Rows with `"active": false` are skipped.

The build reads the table from, in order: the `VIDEOS_JSON` repository secret, then `data/videos.json` (gitignored), then the placeholder example. Put your real table in the secret: Settings → Secrets and variables → Actions → `VIDEOS_JSON`. Then re-run the deploy workflow.

## Deploy

1. Settings → Pages → Source: **GitHub Actions**.
2. Merge to `main` (or run the "Deploy to GitHub Pages" workflow by hand).

## Local check

```sh
node scripts/test.mjs
node scripts/build.mjs   # writes dist/
```

Language: Indonesian by default, `?lang=en` for English. Strings live in `site/i18n.js`.

## Limits of a server-less build

- **Table privacy:** each row is encrypted with a key derived from its video ID. Viewing the source does not list your links, but anyone who knows a video ID can decrypt that row. Video IDs are public, so treat links and codes as soft-gated.
- **One reward per short code:** cannot be enforced without a server. The page cannot see whether a code was used on another device.
- **Rate limit:** there is no backend to abuse. TikTok rate-limits oEmbed per visitor IP; the page adds a short client-side cooldown.
- **Expired vs. invalid short links:** TikTok returns the same error for both, so the page shows one "copy it again" message.
