# Search visibility — 2026-09-09

## Before

The homepage had generic portfolio/OG metadata, but did not identify the author's Korean name or profession in its title/description. Initial HTML had an empty React root, no sitemap/canonical/author schema, and article choices were buttons. Individual stories were client-fetched `?article=` views, with only their document title changing. Social crawlers received the homepage metadata for every query URL.

## Implementation

- Keep the Moon–Earth experience and its query links. Add static, human-readable `/writing/<Velog slug>/` pages with the same complete typed content. These are ordinary reader pages, not bot-specific pages: no user-agent detection, hidden keyword blocks, scripted redirects, or executable content from scraped HTML.
- Put author identity and frontend/writing context in visible introduction/byline/footer content as well as metadata. Do not claim employers, qualifications, awards, or search rankings.
- Each article has a self-canonical, publication date, unique description/title, image/alt, `BlogPosting` and breadcrumb data. The original Velog source is clearly linked. No invented modification timestamp or keyword meta tag.
- Archive pages are bounded to 24 cards; pagination and related articles use real links. The generated sitemap covers all 58 articles plus the homepage and 3 archive pages (62 URLs).
- Every normal and monthly build generates and validates the pages before Pages upload. Body JSON, star positions, aliases, pagination and refresh schedule are unchanged. Reader CSS is content-addressed.

## Automated verification

- 50 tests: existing 43 interaction/content/scaling tests plus 7 SEO tests for identity, stable Korean URLs, initial HTML, photo-only posts, escaping/JSON-LD injection safety, complete pagination/sitemap coverage and 3,000-post bounded archives.
- Production build checks every generated HTML page for exactly one title/description/canonical/H1, correct URL metadata, parseable JSON-LD, crawlable local links and existing CSS/JS assets.
- Every text/code block is byte-equivalent after HTML decoding; all 17 photos retain their complete source URL and alternative text. No body fetch or JavaScript is needed for static reading pages.
- Sitemap URLs exactly match the 62 generated pages, without duplicate URLs, missing articles or fabricated last-modified dates.

## Browser verification

- Production preview at desktop size and 390 × 844: static archive, a long technical article with 59 code blocks, and the 서울역 photo-only article render correctly without horizontal page overflow.
- All six 서울역 photographs load after moving through the page. Alternative text, lazy/eager loading and original-size links remain intact. Static article pages contain zero executable scripts.
- Archive pagination navigates to a distinct, self-canonical page 2. The interactive archive still searches and opens a photo article via keyboard Enter; article rows now expose native destinations.
- “우주에서 이 별 만나기” opens the original selected-star reader. Its canonical/OG/title and schema match the article; closing restores the homepage metadata without leaving stale publication/image dimensions. The mobile Moon–Earth scene and author introduction remain usable.

## Limits and handoff

This is a technical implementation and local/HTTP validation, not a claim that Google/Naver has already indexed the new URLs or approved rich results. Owner verification and sitemap submission in Search Console/Naver Search Advisor are separate account actions. Velog duplicates can still be selected as canonical by search engines. No changes are made to the author's Velog account or publication settings.
