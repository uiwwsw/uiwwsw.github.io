
import { fetch } from 'undici';

const RSS_URL = 'https://v2.velog.io/rss/uiwwsw';

async function verify() {
    const res = await fetch(RSS_URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const text = await res.text();

    console.log("Fetched raw RSS size:", text.length);

    // Check for the missing code block context
    // In markdown it was:
    // ...복제되고, 내부 import가 배포된 패키지(별칭) 를 바라보도록 치환됨.
    // (then code block)
    //
    // Let's search for "바라보도록 치환됨" and look ahead

    const idx = text.indexOf("바라보도록 치환됨");
    if (idx !== -1) {
        console.log("Found anchor text. Context:");
        // Print next 500 characters
        const snippet = text.substring(idx, idx + 500);
        console.log(snippet);
    } else {
        console.log("Anchor text NOT FOUND in raw XML.");
    }

    console.log("\n--- Searching for 'stories/head' near anchor ---");
    // Look for 'stories/head' after the anchor
    const sub = text.substring(idx);
    const subIdx = sub.indexOf("stories/head");
    if (subIdx !== -1 && subIdx < 500) {
        console.log("Found 'stories/head' nearby!");
        const context = sub.substring(subIdx - 50, subIdx + 50);
        console.log("Context around stories/head:", context);
    } else {
        console.log("did not find 'stories/head' nearby.");
    }
}

verify();
