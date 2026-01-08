
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';

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
    const $ = cheerio.load(content);

    console.log("--- ALL PRE Tags ---");
    $('pre').each((i, el) => {
        const text = $(el).text().trim().substring(0, 50);
        console.log(`[PRE ${i}] Node Name: ${el.name}, Text: "${text}..."`);
        // Check finding code inside
        const code = $(el).find('code');
        console.log(`       Has CODE child? ${code.length > 0}`);
    });

    console.log("\n--- Searching for '바라보도록 치환됨' in raw text ---");
    // We want to see the HTML context around this string
    let regex = /바라보도록 치환됨/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        const start = Math.max(0, match.index - 100);
        const end = Math.min(content.length, match.index + 100);
        const snippet = content.substring(start, end).replace(/\n/g, ' ');
        console.log(`Match at ${match.index}: ...${snippet}...`);
    }
}

verify();
