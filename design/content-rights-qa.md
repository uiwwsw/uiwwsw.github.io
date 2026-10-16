# Content rights rollout — 2026-10-17 (Asia/Seoul)

- Site implementation: `96ccd09`; GitHub Pages run `38921822615` succeeded.
- Public `/content-rights/` HTML matches the built output byte for byte; `/robots.txt` exposes only GPTBot, ClaudeBot, Google-Extended and CCBot disallow rules, with the wildcard allow and sitemap preserved.
- 192 tests pass. Production build and SEO checks verify 67 indexable HTML pages, all 62 original complete article bodies and 17 images. No noindex/nosnippet or general-search restrictions were introduced.
- GitHub profile implementation: `uiwwsw/uiwwsw@c18d73f`. English/Korean README notices and CONTENT-RIGHTS.md are public; the generator retains notices on refresh. Its 18 tests pass. Existing code and third-party licenses were not edited.
- Velog's existing logged-in author session allowed editing. The introduction keeps its original text and appends the full notice and exceptions. All 62 public posts (of 67 author-visible posts) now have the same short footer with the detailed policy link. Five private posts were left untouched.
- Every edited post was checked for a rendered policy link after saving. The bulk UI flow compares original body child text/tags/image sources against saved content excluding the appended separator and notice. The first two posts were also compared against their original rendered content during the initial manual flow. One navigation timeout was recovered by checking saved state before resuming; notices were never blindly appended twice.
- Velog titles, tags, summaries, permalinks, publication dates and visibility controls were not edited. No robots/headers were changed on Velog or GitHub domains. No credentials or permissions were added.
- Limits remain explicit: robots compliance is voluntary; public copying and past collection cannot be completely prevented. Existing legal permissions, platform terms and code/third-party licenses continue to apply. New Velog posts need the footer when published; this rollout does not install account-wide automation.

Public entry points:

- https://uiwwsw.github.io/content-rights/
- https://uiwwsw.github.io/robots.txt
- https://github.com/uiwwsw/uiwwsw/blob/main/CONTENT-RIGHTS.md
- https://github.com/uiwwsw/uiwwsw.github.io/blob/main/CONTENT-RIGHTS.md
- https://velog.io/@uiwwsw/about
