
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, '../src/data/velog-words.json');

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Find article with title containing "스토리북"
const articleId = data.find(item => item.title.includes('스토리북'))?.articleId;

if (articleId === undefined) {
    console.log("Article not found");
} else {
    console.log(`Article ID: ${articleId}`);
    const sentences = data.filter(item => item.articleId === articleId);
    console.log(`Total sentences: ${sentences.length}`);

    const codeBlocks = sentences.filter(s => s.type === 'code');
    console.log(`Code blocks found: ${codeBlocks.length}`);

    if (codeBlocks.length > 0) {
        console.log("--- First 3 code blocks ---");
        codeBlocks.slice(0, 3).forEach(b => {
            console.log(`[${b.sentenceIndex}] ${b.fullSentence.substring(0, 50)}...`);
        });
    } else {
        console.log("NO CODE BLOCKS FOUND for this article.");
    }

    console.log("--- Checking specific text 'stories/head' ---");
    const found = sentences.filter(s => s.fullSentence.includes('stories/head'));
    found.forEach(f => {
        console.log(`[${f.sentenceIndex}] Type: ${f.type}, Content: ${f.fullSentence.substring(0, 50)}...`);
    });
}
