
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RSS_URL = 'https://v2.velog.io/rss/uiwwsw';
const OUTPUT_FILE = path.join(__dirname, '../src/data/velog-words.json');
const MAX_WORDS = 1000;

// Simple stop words list (Korean + English common words)
const STOP_WORDS = new Set([
    'the', 'and', 'a', 'to', 'of', 'in', 'is', 'that', 'for', 'it', 'with', 'as', 'on',
    'this', 'by', 'at', 'be', 'are', 'from', 'or', 'an', 'was', 'were', 'but', 'so',
    'can', 'if', 'has', 'have', 'not', 'which', 'what', 'when', 'how', 'why', 'who',
    '있다', '있는', '것이다', '한다', '하는', '할', '수', '등', '이', '가', '을', '를',
    '은', '는', '의', '에', '로', '와', '과', '도', '다', '만', '으로', '에서', '하고',
    '이다', '그리고', '하지만', '그래서', '때문에', '매우', '정말', '너무', '많이',
    '더', '좀', '잘', '그', '이런', '저런', '그런', '위해', '통해', '대한', '관한',
    '같은', '위한', '따라', '모두', '어떤', '또한', '가장', '많은', '바로', '다시',
    '이제', '여기', '거기', '저기', '경우', '사실', '생각', '사람', '우리', '자신',
    '문제', '결과', '방법', '사용', '부분', '시간', '정도', '하나', '가지', '때문',
    '그것', '이것', '저것', '지금', '다음', '이후', '이전', '시작', '관련', '내용',
    '필요', '중요', '가능', '단어', '코드', '함수', '데이터', '설정', '작성', '실행',
    'com', 'https', 'http', 'www', 'url', 'log', 'image', 'png', 'jpg', 'gif'
]);

async function fetchAndProcess() {
    console.log(`Fetching RSS feed from ${RSS_URL}...`);
    const parser = new Parser();

    try {
        const feed = await parser.parseURL(RSS_URL);
        console.log(`Found ${feed.items.length} items.`);

        let allWords = [];

        for (const item of feed.items) {
            // Prefer content:encoded, normally where full content lives in Velog RSS?
            // Velog RSS usually has 'content' or just 'description'.
            // Let's check both or fallback.
            const content = item['content:encoded'] || item.content || item.description || '';
            const $ = cheerio.load(content);
            const text = $.text();

            // Tokenize
            // Remove special chars, keep Korean, English, Numbers
            const cleanedText = text.replace(/[^a-zA-Z0-9가-힣\s]/g, ' ');
            const words = cleanedText.split(/\s+/)
                .map(w => w.trim())
                .filter(w => w.length >= 2) // Filter short words
                .filter(w => !STOP_WORDS.has(w.toLowerCase()))
                .filter(w => !/^\d+$/.test(w)); // Filter pure numbers

            // Map to object with link
            words.forEach(word => {
                allWords.push({
                    text: word,
                    link: item.link
                });
            });
        }

        console.log(`Total words extracted: ${allWords.length}`);

        // Random shuffle and slice
        const shuffled = allWords.sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, MAX_WORDS);

        // Save
        const outputDir = path.dirname(OUTPUT_FILE);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(selected, null, 2));

        console.log(`Saved ${selected.length} words to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error fetching RSS:', error);
    }
}

fetchAndProcess();
