
import { fetch } from 'undici';
import * as cheerio from 'cheerio';

const URL = 'https://velog.io/@uiwwsw/%EC%8A%A4%ED%86%A0%EB%A6%AC%EB%B6%81%EC%97%90-%EB%B2%84%EC%A0%84%EB%B3%84-%EC%BB%B4%ED%8F%AC%EB%84%8C%ED%8A%B8-%EB%B3%B4%EC%97%AC%EC%A3%BC%EA%B8%B0-%EB%82%AD%EB%B9%84-%EC%97%86%EC%9D%B4-%ED%95%9C-%EA%B3%B3%EC%97%90-%EB%AA%A8%EC%9C%BC%EB%8A%94-%EB%B2%95';



function cleanMarkdown(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/^#+\s+/gm, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/>\s+/gm, '');
}

function extractSentencesFromText(text) {
    const cleanedMarkdown = cleanMarkdown(text);
    // Split key behavior check:
    const rawSentences = cleanedMarkdown.split(/[.!?]+/).map(s => s.trim());

    console.log(`Raw split rejected count: ${rawSentences.filter(s => s.length <= 0).length}`);

    const candidates = rawSentences.filter(s => s.length > 0);
    const accepted = [];
    const rejected = [];

    for (const sentence of candidates) {
        if (sentence.length < 10) {
            rejected.push({ s: sentence, reason: 'too_short' });
            continue;
        }

        const trimmed = sentence.length > 100 ? sentence.substring(0, 100) + '...' : sentence;
        const words = trimmed.split(/\s+/);
        if (words.length === 0) {
            rejected.push({ s: sentence, reason: 'no_words' });
            continue;
        }

        if (/Assisted\s+by\s+AI/i.test(trimmed)) {
            rejected.push({ s: sentence, reason: 'assisted_by_ai' });
            continue;
        }

        const checkWord = words[0];

        if (checkWord.length < 2 || /^\d+$/.test(checkWord)) {
            rejected.push({ s: sentence, reason: 'first_word_invalid', word: checkWord });
            continue;
        }

        if (!/^[가-힣a-zA-Z0-9]/.test(checkWord)) {
            rejected.push({ s: sentence, reason: 'special_char_start', word: checkWord });
            continue;
        }

        accepted.push(trimmed);
    }

    return { accepted, rejected };
}

async function verify() {
    console.log("Fetching page...");
    const res = await fetch(URL);
    const text = await res.text();
    const $ = cheerio.load(text);

    let body = null;
    $('script').each((i, el) => {
        const content = $(el).html();
        if (content && content.includes('window.__APOLLO_STATE__=')) {
            const jsonStr = content.replace('window.__APOLLO_STATE__=', '').trim();
            try {
                const json = jsonStr.endsWith(';') ? JSON.parse(jsonStr.slice(0, -1)) : JSON.parse(jsonStr);
                const postKey = Object.keys(json).find(k => k.startsWith('Post:') && json[k].body);
                if (postKey) body = json[postKey].body;
            } catch (e) { }
        }
    });

    if (body) {
        console.log(`Body Length: ${body.length}`);
        const parts = body.split(/(```[\s\S]*?```)/g);
        let totalAccepted = 0;

        parts.forEach((part, idx) => {
            if (part.trim().startsWith('```')) return; // skip code blocks

            const { accepted, rejected } = extractSentencesFromText(part);
            totalAccepted += accepted.length;

            if (rejected.length > 0) {
                console.log(`\n--- Part ${idx} Rejected (Sample) ---`);
                rejected.slice(0, 3).forEach(r => console.log(`[${r.reason}] ${r.s.substring(0, 50)}...`));
            }
        });

        console.log(`\nTotal Accepted Sentences: ${totalAccepted}`);
    }
}

verify();
