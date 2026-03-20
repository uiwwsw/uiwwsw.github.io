import { fetch } from 'undici';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GQL_URL = 'https://v2cdn.velog.io/graphql';
const USERNAME = 'uiwwsw';
const OUTPUT_FILE = path.join(__dirname, '../src/data/velog-words.json');
const CONTEXT_FILE = path.join(__dirname, '../src/data/velog-context.json');
const MAX_SENTENCES = 800;



// Helper to remove markdown syntax
function cleanMarkdown(text) {
    return text
        .replace(/^[\*\-]\s+/gm, '')     // Unordered lists
        .replace(/^\d+\.\s+/gm, '')      // Ordered lists
        .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
        .replace(/\*(.*?)\*/g, '$1')     // Italic
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
        .replace(/`([^`]+)`/g, '$1')     // Inline code (keep text)
        .replace(/^#+\s+/gm, '')         // Headers
        .replace(/!\[.*?\]\(.*?\)/g, '') // Images
        .replace(/>\s+/gm, '')           // Blockquotes
        .replace(/^-{3,}/gm, '');        // Horizontal rules
}

// Helper to split text into sentences respecting quotes and brackets
function splitSentences(text) {
    const sentences = [];
    let buffer = '';
    let stack = [];

    const inGroup = () => stack.length > 0;
    const peek = () => stack[stack.length - 1];

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const prev = text[i - 1];
        const next = text[i + 1];

        // Handle Quotes
        if (char === '"') {
            if (peek() === '"') stack.pop();
            else stack.push('"');
        }
        else if (char === '“') stack.push('“');
        else if (char === '”') {
            if (peek() === '“') stack.pop();
        }
        else if (char === '‘') stack.push('‘');
        else if (char === '’') {
            if (peek() === '‘') stack.pop();
        }
        else if (char === "'") {
            // Apostrophe heuristic
            const isApostrophe = /[a-zA-Z0-9]/.test(prev || '') && /[a-zA-Z0-9]/.test(next || '');
            if (!isApostrophe) {
                if (peek() === "'") stack.pop();
                else stack.push("'");
            }
        }
        // Parens and Brackets
        else if (char === '(') stack.push('(');
        else if (char === ')') {
            if (peek() === '(') stack.pop();
        }
        else if (char === '[') stack.push('[');
        else if (char === ']') {
            if (peek() === '[') stack.pop();
        }
        else if (char === '{') stack.push('{');
        else if (char === '}') {
            if (peek() === '{') stack.pop();
        }

        buffer += char;

        // Split Condition: Punctuation + Not in Group
        if (/[.!?]/.test(char) && !inGroup()) {
            sentences.push(buffer.trim());
            buffer = '';
        }
    }

    if (buffer.trim()) {
        sentences.push(buffer.trim());
    }

    return sentences.filter(s => s.length > 0);
}

// Extract sentences from plain text
function extractSentencesFromText(text) {
    const cleanedMarkdown = cleanMarkdown(text);
    const rawSentences = splitSentences(cleanedMarkdown);

    const sentences = [];

    for (const sentence of rawSentences) {
        if (sentence.length < 5) continue;

        const trimmed = sentence.length > 200 ? sentence.substring(0, 200) + '...' : sentence;
        const words = trimmed.split(/\s+/);
        if (words.length === 0) continue;

        let checkWord = words[0];
        checkWord = checkWord.replace(/^[^가-힣a-zA-Z0-9]+/, '');

        if (checkWord.length < 1 && words.length === 1) continue;
        if (/^\d+$/.test(checkWord)) continue;

        // Filter out "Assisted by AI"
        if (/Assisted\s+by\s+AI/i.test(trimmed)) continue;



        // Must contain at least one valid char
        if (!/[가-힣a-zA-Z0-9]/.test(checkWord)) continue;

        // Check if this is an image sentence (contains velcdn or image references)
        const isImageSentence = /velcdn/i.test(trimmed) ||
            /\.(jpg|jpeg|png|gif|webp|svg)/i.test(trimmed) ||
            /!\[.*?\]\(.*?\)/i.test(trimmed);

        sentences.push({
            fullSentence: trimmed,
            type: isImageSentence ? 'image' : 'text'
        });
    }

    return sentences;
}

function buildSummary(sentences, fallbackSummary = '') {
    const fallback = cleanMarkdown(fallbackSummary || '').replace(/\s+/g, ' ').trim();
    const textSummary = sentences
        .filter(sentence => sentence.type === 'text')
        .map(sentence => sentence.fullSentence.trim())
        .filter(Boolean)
        .slice(0, 2)
        .join(' ');

    const summary = (fallback || textSummary).replace(/\s+/g, ' ').trim();

    if (!summary) {
        return '';
    }

    return summary.length > 180
        ? `${summary.slice(0, 177).trim()}...`
        : summary;
}

function estimateReadingTime(markdown = '') {
    const withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, ' ');
    const normalized = cleanMarkdown(withoutCodeBlocks).replace(/\s+/g, ' ').trim();
    const wordCount = normalized ? normalized.split(' ').length : 0;

    return Math.max(1, Math.ceil(wordCount / 220));
}

function normalizeTags(rawTags) {
    if (Array.isArray(rawTags)) {
        return rawTags
            .map(tag => typeof tag === 'string' ? tag : tag?.name)
            .filter(Boolean);
    }

    if (rawTags && typeof rawTags === 'object' && Array.isArray(rawTags.json)) {
        return rawTags.json
            .map(tag => typeof tag === 'string' ? tag : tag?.name)
            .filter(Boolean);
    }

    return [];
}

// Helper: Fetch post content and metadata using the page Apollo state
async function fetchPostData(url) {
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const postData = {
            body: null,
            releasedAt: null,
            tags: [],
            summary: ''
        };

        $('script').each((i, el) => {
            const content = $(el).html();
            if (content && content.includes('window.__APOLLO_STATE__=')) {
                const jsonStr = content.replace('window.__APOLLO_STATE__=', '').trim();
                try {
                    const json = jsonStr.endsWith(';')
                        ? JSON.parse(jsonStr.slice(0, -1))
                        : JSON.parse(jsonStr);

                    const postKey = Object.keys(json).find(k => k.startsWith('Post:') && json[k].body);
                    if (postKey) {
                        const post = json[postKey];
                        postData.body = post.body || null;
                        postData.releasedAt = post.released_at || post.releasedAt || null;
                        postData.tags = normalizeTags(post.tags);
                        postData.summary = post.short_description || post.shortDescription || '';
                    }
                } catch (e) { }
            }
        });
        return postData;
    } catch (error) {
        console.error(`Error fetching post data for ${url}:`, error.message);
        return {
            body: null,
            releasedAt: null,
            tags: [],
            summary: ''
        };
    }
}

// Helper: Fetch Posts List via GraphQL
async function fetchAllPosts(username) {
    const allPosts = [];
    let cursor = null;
    let hasNext = true;

    const query = `
        query Posts($username: String, $cursor: ID) {
            posts(username: $username, cursor: $cursor) {
                id
                title
                url_slug
            }
        }
    `;

    console.log(`Fetching post list for ${username}...`);

    while (hasNext) {
        try {
            const res = await fetch(GQL_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0'
                },
                body: JSON.stringify({
                    query,
                    variables: { username, cursor }
                })
            });
            const json = await res.json();

            if (json.errors) {
                throw new Error(`GraphQL Errors: ${JSON.stringify(json.errors)}`);
            }

            const posts = json.data.posts;
            if (posts.length === 0) {
                hasNext = false;
            } else {
                // Add to list
                posts.forEach(p => {
                    allPosts.push(p);
                });

                cursor = posts[posts.length - 1].id;
                console.log(`  Fetched ${posts.length} posts. Total: ${allPosts.length}`);

                // Safety break to prevent infinite loops if API changes
                if (allPosts.length > 1000) hasNext = false;
            }
        } catch (e) {
            throw e;
        }
    }

    return allPosts;
}

async function fetchAndProcess() {
    try {
        // 1. Get All Posts
        const posts = await fetchAllPosts(USERNAME);
        console.log(`Found ${posts.length} items total.`);

        if (posts.length === 0) {
            throw new Error('No posts fetched from Velog. Aborting refresh to avoid overwriting existing archive data.');
        }

        let allSentences = [];
        let articleId = 0;

        for (const item of posts) {
            console.log(`Processing [${articleId}]: ${item.title}`);
            const link = `https://velog.io/@${USERNAME}/${item.url_slug}`;
            const postData = await fetchPostData(link);
            const markdown = postData.body;

            let itemSentences = [];
            const readingTime = estimateReadingTime(markdown || '');

            if (markdown) {
                // Split by Code Blocks
                const parts = markdown.split(/(```[\s\S]*?```)/g);

                parts.forEach(part => {
                    const trimmed = part.trim();
                    if (!trimmed) return;

                    if (trimmed.startsWith('```')) {
                        // Extract language if present
                        // Format: ```js\n code \n```
                        const firstLineMatch = trimmed.match(/^```(\w+)?/);
                        const language = firstLineMatch && firstLineMatch[1] ? firstLineMatch[1] : null;

                        const content = trimmed.replace(/^```.*\n?/, '').replace(/```$/, '');
                        if (content.trim().length > 0) {
                            itemSentences.push({
                                fullSentence: content.trim(),
                                type: 'code',
                                language: language
                            });
                        }
                    } else {
                        const extracted = extractSentencesFromText(part);
                        itemSentences.push(...extracted);
                    }
                });
            } else {
                console.log(`  Failed to get markdown for ${item.title}`);
            }

            itemSentences.forEach((sentence, index) => {
                allSentences.push({
                    ...sentence,
                    link,
                    title: item.title,
                    slug: item.url_slug,
                    articleId: articleId,
                    sentenceIndex: index,
                    totalInArticle: itemSentences.length,
                    publishedAt: postData.releasedAt,
                    tags: postData.tags,
                    summary: buildSummary(itemSentences, postData.summary),
                    readingTime
                });
            });

            articleId++;
            // Be nice to the server
            await new Promise(r => setTimeout(r, 100));
        }

        console.log(`Total sentences extracted: ${allSentences.length}`);

        // Save Context Data
        const byArticle = {};
        allSentences.forEach(s => {
            if (!byArticle[s.articleId]) {
                byArticle[s.articleId] = {
                    title: s.title,
                    link: s.link,
                    slug: s.slug,
                    publishedAt: s.publishedAt,
                    tags: s.tags,
                    summary: s.summary,
                    readingTime: s.readingTime,
                    sentences: []
                };
            }
            byArticle[s.articleId].sentences.push({
                fullSentence: s.fullSentence,
                index: s.sentenceIndex,
                type: s.type,
                language: s.language
            });
        });

        await fs.writeFile(CONTEXT_FILE, JSON.stringify(byArticle, null, 2));
        console.log(`Saved context data to ${CONTEXT_FILE}`);

        // Filter out image sentences for WordCloud (but keep them in context)
        const textSentencesOnly = allSentences.filter(s => s.type !== 'image');
        console.log(`Filtered ${allSentences.length - textSentencesOnly.length} image sentences from cloud`);

        // Random shuffle for WordCloud
        const shuffled = [...textSentencesOnly].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, MAX_SENTENCES);

        await fs.writeFile(OUTPUT_FILE, JSON.stringify(selected, null, 2));
        console.log(`Saved ${selected.length} sentences to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error in main process:', error);
        process.exitCode = 1;
    }
}

fetchAndProcess();
