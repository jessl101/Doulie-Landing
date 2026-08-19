# Doulie Landing

Marketing site for [douliesleep.com](https://douliesleep.com) — hand-written
static HTML, no framework, no build step.

## Structure

```
index.html          The landing page (semantic HTML, edit directly)
site.js             All behavior: waitlist form → Supabase, stages carousel
privacy/index.html  Privacy Policy  — keep in sync with the iOS app's PrivacyView
terms/index.html    Terms of Use    — keep in sync with the iOS app's TermsView
_next/static/css/   The site stylesheet (inherited from the original Next.js
                    build; fonts load from Google Fonts / Fontshare)
*.png, *.svg, *.ico Brand assets — wordmark, social card, favicons, touch icon
                    (generated from the iOS app's assets; keep them matching)
```

## History

The site began as a Next.js app; its source was lost and the compiled export
lived here. In August 2026 the marketing page was rebuilt as plain HTML/JS
(same markup and stylesheet, so it is pixel-identical) and the in-browser app
prototype was removed. Edit `index.html` and `site.js` directly — there is
nothing to build.

## Waitlist

The signup forms POST to the Doulie Supabase project's `waitlist_signups`
table using the publishable key. Duplicate emails are treated as success.
