# Doulie Landing

Marketing / waitlist landing page for **[douliesleep.com](https://douliesleep.com)**.

This is the deployed static build of the site — a statically exported Next.js app
(`output: 'export'`), captured from production on 19 August 2026.

## Contents

```
index.html                     the landing page
robots.txt
doulie-stars-only.svg          logo mark (three amber stars)
favicon*.png / favicon*.ico    favicons
apple-touch-icon-*.png
_next/static/css/              compiled stylesheet
_next/static/chunks/           compiled JS bundles
```

## Running locally

No build step — it's plain static files. Serve the directory with anything:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly via `file://` will not work, because the asset
paths are resolved relative to a server root.

## Deploying

The files are ready to serve as-is. For Cloudflare Pages, use:

- **Build command:** *(none)*
- **Build output directory:** `/`

## Notes

- Asset paths in `index.html` are **relative** (`./_next/...`), so the site also
  works when served from a subdirectory.
- The footer email is a normal `mailto:hello@douliesleep.com` link here.
  Cloudflare's Email Address Obfuscation rewrites it at serve time into a
  `/cdn-cgi/l/email-protection` link, which is a CDN feature rather than part of
  the source, so it has been reverted in this copy.
- `_next/static/` filenames contain content hashes. A future build will emit new
  hashes, so replace the whole `_next` directory rather than editing files in it.
