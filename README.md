# Doulie Landing

Marketing site for [douliesleep.com](https://douliesleep.com) — hand-written
static HTML, no framework, no build step.

## Structure

```
index.html          The landing page (semantic HTML, edit directly)
landing.css         The landing stylesheet (hand-written; fonts load from
                    Google Fonts and Fontshare)
site.js             All behavior: waitlist form → Supabase, the night sky
                    (Canvas star field, scroll-driven sky and clock), prop tilt
concept/            The creative direction ("The Long Night") and the
                    prototype the landing page was built from
privacy/index.html  Privacy Policy  — keep in sync with the iOS app's PrivacyView
terms/index.html    Terms of Use    — keep in sync with the iOS app's TermsView
*.png, *.svg, *.ico Brand assets — wordmark, social card, favicons, touch icon
                    (generated from the iOS app's assets; keep them matching)
```

## History

The site began as a Next.js app; its source was lost and the compiled export
lived here. In August 2026 the marketing page was rebuilt as plain HTML/JS and
the in-browser app prototype was removed. In September 2026 the page was
redesigned as "The Long Night" (one night told in hours, a 3D star field, the
same palette and typefaces) and the last of the Next.js stylesheet went with
it. Edit `index.html`, `landing.css` and `site.js` directly — there is nothing
to build. The design rationale lives in `concept/direction.html`.

## Running locally

No build step — plain static files. Serve the directory with anything:

```bash
python3 -m http.server 8000
```

Opening `index.html` via `file://` won't work — asset paths resolve against a
server root.

## Deploying

Cloudflare Pages, ready to serve as-is: build command *(none)*, build output
directory `/`. Note: Cloudflare's Email Address Obfuscation rewrites the
`mailto:` footer link at serve time — that's a CDN feature, not source.

## Waitlist

The signup forms POST to the Doulie Supabase project's `waitlist_signups`
table using the publishable key. Duplicate emails are treated as success.
