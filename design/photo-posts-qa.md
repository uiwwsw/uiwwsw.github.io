# Photo-only article repair — 2026-09-08

## Root cause and repair

The old text cleanup removed Markdown image destinations before creating reading blocks. Photo-only entries were then replaced with a summary/title fallback: “서울역” contained the broken fragment `![](https://v`, and “양평 어느 카페” contained only its title. The reader also filtered out any image-typed blocks.

The new build-time parser preserves Markdown/reference/linked/HTML images in their original position alongside full paragraphs and fenced code. It emits typed data, never raw HTML. Unsafe URLs and active HTML are excluded. Extraction version 2 forces a one-time re-fetch even if an older cached article has the same source hash or HTTP validator. Text is no longer required for a valid article or a valid archive.

The live 58-post archive was refreshed with no failed posts. It now includes 17 image blocks in 9 articles. The three photo-only regressions are restored:

- 서울역: 6 images.
- 양평 어느 카페: 2 adjacent Markdown images.
- 사진: 3 images.

Existing star positions, sectors and numeric aliases were unchanged. The legacy word data was regenerated with its existing 800-item limit and excludes images and scraper cache fields.

## Verification

- 43 Node tests pass, including image-only input, adjacent/reference/linked/HTML images, mixed text/image/code ordering, text longer than 200 characters, URL safety, cache migration, and media-only loader validation.
- Production build succeeds; Marked/Cheerio remain build-only dependencies and are not shipped to the browser.
- In-app browser: desktop and 390 × 844 mobile layout. All 6 서울역 images, both café images and all 3 사진 images loaded successfully after scrolling/focusing through the article. No horizontal overflow in the page or reading panel.
- With WebGL disabled, the café photo-only article still renders normally.
- Failure injection used a temporary, untracked generated body with one nonexistent image URL. The first photo showed a scoped error/retry/Velog link while the second remained visible. Retry did not break the reader. The generator then restored the original body, and both images loaded successfully. No fixture data is deployed.
- Original-size links use each photo's HTTPS source, `target="_blank"` and `rel="noreferrer"`. Empty alternative text receives a title-and-photo-number fallback.

Images stay on the author's original Velog CDN. Lazy loading reduces up-front requests but does not promise offline access or availability if the original image is later removed.
