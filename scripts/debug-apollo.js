
import { fetch } from 'undici';
import * as cheerio from 'cheerio';

const URL = 'https://velog.io/@uiwwsw/%EC%8A%A4%ED%86%A0%EB%A6%AC%EB%B6%81%EC%97%90-%EB%B2%84%EC%A0%84%EB%B3%84-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EB%B3%B4%EC%97%AC%EC%A3%BC%EA%B8%B0-%EB%82%AD%EB%B9%84-%EC%97%86%EC%9D%B4-%ED%95%9C-%EA%B3%B3%EC%97%90-%EB%AA%A8%EC%9C%BC%EB%8A%94-%EB%B2%95';

async function verify() {
    console.log("Fetching page...");
    const res = await fetch(URL);
    const text = await res.text();
    const $ = cheerio.load(text);

    let apolloState = null;

    $('script').each((i, el) => {
        const content = $(el).html();
        if (content && content.includes('window.__APOLLO_STATE__=')) {
            // Extract JSON
            // remove "window.__APOLLO_STATE__=" and trailing ";" or nothing
            const jsonStr = content.replace('window.__APOLLO_STATE__=', '').trim();
            try {
                apolloState = JSON.parse(jsonStr);
            } catch (e) {
                // sometimes it has a trailing semicolon
                if (jsonStr.endsWith(';')) {
                    try {
                        apolloState = JSON.parse(jsonStr.slice(0, -1));
                    } catch (e2) {
                        console.log("Failed to parse JSON");
                    }
                }
            }
        }
    });

    if (apolloState) {
        console.log("Parsed Apollo State!");
        // Find post body
        // Look for keys starting with 'Post:'
        const postKey = Object.keys(apolloState).find(k => k.startsWith('Post:') && apolloState[k].body);
        if (postKey) {
            const body = apolloState[postKey].body;
            console.log(`Found Post Body (Length: ${body.length})`);
            console.log("Snippet:", body.substring(0, 200).replace(/\n/g, '\\n'));

            // detailed search for stories/head in Markdown
            console.log("--- Detail Check for stories/head in Markdown ---");
            let regex = /stories\/head/g;
            let match;
            while ((match = regex.exec(body)) !== null) {
                const start = Math.max(0, match.index - 50);
                const end = Math.min(body.length, match.index + 50);
                console.log(`MD Match: ...${body.substring(start, end).replace(/\n/g, '\\n')}...`);
            }
        } else {
            console.log("Post entity not found in state.");
        }
    } else {
        console.log("Apollo State not found.");
    }
}

verify();
