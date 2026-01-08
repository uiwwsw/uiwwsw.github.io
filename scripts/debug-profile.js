
import { fetch } from 'undici';
import * as cheerio from 'cheerio';

const URL = 'https://velog.io/@uiwwsw';

async function verify() {
    console.log("Fetching profile page...");
    const res = await fetch(URL, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
    });
    const text = await res.text();
    console.log(`Page Fetched. Length: ${text.length}`);
    const $ = cheerio.load(text);

    // Inspect Body content
    const body = $('body').html();
    console.log("Body Snippet (500 chars):", body ? body.substring(0, 500) : "BODY EMPTY");

    // Check if there are any <script> tags with src (external bundles)
    console.log("Script Sources:");
    $('script[src]').each((i, el) => {
        console.log(` - ${$(el).attr('src')}`);
    });

    console.log("--- Searching for specific JSON structures ---");
    // Sometimes data is in a script with id="__NEXT_DATA__" or similar
    const nextData = $('#__NEXT_DATA__').html();
    if (nextData) {
        console.log("Found __NEXT_DATA__");
    } else {
        console.log("__NEXT_DATA__ NOT FOUND");
    }
}

verify();
