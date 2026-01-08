
import Parser from 'rss-parser';

const RSS_URL = 'https://v2.velog.io/rss/uiwwsw';

async function verify() {
    const parser = new Parser();
    const feed = await parser.parseURL(RSS_URL);

    // Find the storybook article
    const item = feed.items.find(i => i.title.includes('스토리북'));
    if (!item) {
        console.log("Article not found");
        return;
    }

    const content = item['content:encoded'] || item.content;
    console.log("--- Content Snippet (First 500 chars) ---");
    console.log(content.substring(0, 500));
    console.log("--- Checking for PRE tags ---");
    if (content.includes('<pre>')) {
        console.log("Found <pre> tag!");
    } else {
        console.log("NO <pre> tag found.");
    }

    // Check for unique sequence known to be in code block
    console.log("--- Checking specific code snippet ---");
    const snippet = "stories/head";
    const idx = content.indexOf(snippet);
    if (idx !== -1) {
        console.log(`Found "${snippet}" at index ${idx}`);
        console.log("Surrounding context:");
        console.log(content.substring(idx - 50, idx + 50));
    }
}

verify();
