
import Parser from 'rss-parser';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const RSS_URL = 'https://v2.velog.io/rss/uiwwsw';
const OUTPUT_FILE = path.join(__dirname, '../src/data/velog-words.json');
const MAX_SENTENCES = 800;

// Filter for bad/weird words
const BAD_WORDS = new Set([
    '보지', '자지'
]);

// Extract sentences from text, preserving order
function extractSentences(text) {
    const rawSentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    const sentences = [];

    for (const sentence of rawSentences) {
        if (sentence.length < 10) continue;

        const trimmed = sentence.length > 100 ? sentence.substring(0, 100) + '...' : sentence;
        const words = trimmed.split(/\s+/);
        if (words.length === 0) continue;

        // Filter logic:
        // 1. Length < 2 (already there)
        // 2. Numbers only
        // 3. Bad words
        // 4. Starts with special char (non-hangul, non-alpha, non-digit)
        // 5. Incomplete Hangul (Jamo)

        const checkWord = words[0];

        if (checkWord.length < 2 || /^\d+$/.test(checkWord)) continue;
        if (BAD_WORDS.has(checkWord)) continue;

        // Regex: Check if starts with valid char (Hangul syllables, Alphabet, Number)
        // Excludes Jamo (ㄱ-ㅎ, ㅏ-ㅣ) and Special Chars
        if (!/^[가-힣a-zA-Z0-9]/.test(checkWord)) continue;

        sentences.push({
            fullSentence: trimmed
        });
    }

    return sentences;
}

async function fetchAndProcess() {
    console.log(`Fetching RSS feed from ${RSS_URL}...`);
    const parser = new Parser();

    try {
        const feed = await parser.parseURL(RSS_URL);
        console.log(`Found ${feed.items.length} items.`);

        let allSentences = [];
        let articleId = 0;

        for (const item of feed.items) {
            const content = item['content:encoded'] || item.content || item.description || '';
            const $ = cheerio.load(content);
            const text = $.text();

            const cleanedText = text.replace(/\s+/g, ' ').trim();
            const sentences = extractSentences(cleanedText);

            // Add metadata: articleId, sentenceIndex within article
            sentences.forEach((sentence, index) => {
                allSentences.push({
                    ...sentence,
                    link: item.link,
                    title: item.title,
                    articleId: articleId,
                    sentenceIndex: index,
                    totalInArticle: sentences.length
                });
            });

            articleId++;
        }

        console.log(`Total sentences extracted: ${allSentences.length}`);
        console.log(`From ${articleId} articles`);

        // Random shuffle but keep metadata
        const shuffled = [...allSentences].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, MAX_SENTENCES);

        // Save with full metadata
        const outputDir = path.dirname(OUTPUT_FILE);
        await fs.mkdir(outputDir, { recursive: true });
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(selected, null, 2));

        console.log(`\nSaved ${selected.length} sentences to ${OUTPUT_FILE}`);
        console.log(`Sample sentence with context:`);
        const sample = selected[0];
        console.log(`  Article: "${sample.title}"`);
        console.log(`  Sentence ${sample.sentenceIndex + 1}/${sample.totalInArticle}: "${sample.fullSentence}"`);

        // Also save the FULL ordered dataset for context lookup
        const contextFile = path.join(__dirname, '../src/data/velog-context.json');

        // Group by article for easy context lookup
        const byArticle = {};
        allSentences.forEach(s => {
            if (!byArticle[s.articleId]) {
                byArticle[s.articleId] = {
                    title: s.title,
                    link: s.link,
                    sentences: []
                };
            }
            byArticle[s.articleId].sentences.push({
                fullSentence: s.fullSentence,
                index: s.sentenceIndex
            });
        });

        await fs.writeFile(contextFile, JSON.stringify(byArticle, null, 2));
        console.log(`Saved context data to ${contextFile}`);

    } catch (error) {
        console.error('Error fetching RSS:', error);
    }
}

fetchAndProcess();
