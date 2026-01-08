
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../src/data/velog-context.json');

const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Context file structure is { articleId: { sentences: [...] } }
// We need to find the article ID first by iterating keys
let articleId;
let articleData;

for (const id in rawData) {
    if (rawData[id].title.includes('스토리북')) {
        articleId = id;
        articleData = rawData[id];
        break;
    }
}

if (articleId !== undefined) {
    console.log(`Checking Article ID: ${articleId}`);
    const sentences = articleData.sentences;
    console.log(`Total sentences: ${sentences.length}`);

    console.log("--- Last 5 Sentences ---");
    sentences.slice(-5).forEach(s => {
        console.log(`[${s.sentenceIndex}] (${s.type}) ${s.fullSentence}`);
    });
} else {
    console.log("Article not found");
}
