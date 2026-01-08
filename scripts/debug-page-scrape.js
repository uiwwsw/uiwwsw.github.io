
import { fetch } from 'undici';
import * as cheerio from 'cheerio';

const URL = 'https://velog.io/@uiwwsw/%EC%8A%A4%ED%86%A0%EB%A6%AC%EB%B6%81%EC%97%90-%EB%B2%84%EC%A0%84%EB%B3%84-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EB%B3%B4%EC%97%AC%EC%A3%BC%EA%B8%B0-%EB%82%AD%EB%B9%84-%EC%97%86%EC%9D%B4-%ED%95%9C-%EA%B3%B3%EC%97%90-%EB%AA%A8%EC%9C%BC%EB%8A%94-%EB%B2%95';

async function verify() {
    console.log("Fetching page...");
    const res = await fetch(URL);
    const text = await res.text();
    const $ = cheerio.load(text);

    console.log("--- Searching script tags ---");
    $('script').each((i, el) => {
        const content = $(el).html();
        if (content && (content.includes('접근 방식') || content.includes('stories/head'))) {
            console.log(`Found match in Script #${i}`);
            // Check if it's JSON
            if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
                console.log("Looks like JSON.");
                try {
                    // Sometimes it might be window.__INITIAL_STATE__ = { ... }
                    // or just raw JSON
                    if (content.trim().startsWith('{')) {
                        const json = JSON.parse(content);
                        console.log("Parsed JSON keys:", Object.keys(json));
                    }
                } catch (e) {
                    console.log("Error parsing JSON:", e.message);
                }
            } else {
                console.log("Snippet (Start):", content.substring(0, 100));
            }
        }
    });

    // Check specific known Velog state vars
    const initial = $('script:contains("window.__INITIAL_STATE__")').html();
    if (initial) {
        console.log("Found window.__INITIAL_STATE__");
    }
}

verify();
