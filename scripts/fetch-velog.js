import { fetch } from 'undici';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'node:crypto';
import { collectPosts } from './lib/velog-pagination.js';
import { CONTENT_VERSION, canReuseContent, parseArticleBody, summarizeArticle, articleReadingTime } from './lib/article-content.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GQL_URL = 'https://v2cdn.velog.io/graphql';
const USERNAME = 'uiwwsw';
const OUTPUT_FILE = path.join(__dirname, '../src/data/velog-words.json');
const CONTEXT_FILE = path.join(__dirname, '../src/data/velog-context.json');
const MAX_SENTENCES = 800;
const MAX_FAILED_POSTS = 0;


function hashString(input) {
    let hash = 2166136261;

    for (let i = 0; i < input.length; i++) {
        hash ^= input.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }

    return hash >>> 0;
}

function buildStableSentenceKey(sentence) {
    return `${sentence.slug}:${sentence.sentenceIndex}:${sentence.fullSentence}`;
}

function selectStableSentences(sentences, limit) {
    return [...sentences]
        .sort((left, right) => {
            const hashDiff = hashString(buildStableSentenceKey(left)) - hashString(buildStableSentenceKey(right));
            if (hashDiff !== 0) return hashDiff;

            if (left.articleId !== right.articleId) return left.articleId - right.articleId;
            return left.sentenceIndex - right.sentenceIndex;
        })
        .slice(0, limit);
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
async function fetchPostData(url, previous) {
    try {
        const res = await fetch(url, {
            signal: AbortSignal.timeout(20000),
            headers: {
                ...(previous?.sourceETag ? { 'If-None-Match': previous.sourceETag } : {}),
                ...(previous?.sourceModified ? { 'If-Modified-Since': previous.sourceModified } : {}),
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (res.status === 304 && previous?.sentences?.length) return { unchanged: true };
        if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
        const html = await res.text();
        const $ = cheerio.load(html);

        const postData = {
            sourceETag: res.headers.get('etag'),
            sourceModified: res.headers.get('last-modified'),
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

    return collectPosts(async (cursor) => {
        const res = await fetch(GQL_URL, {
            method: 'POST',
            signal: AbortSignal.timeout(20000),
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                query,
                variables: { username, cursor }
            })
        });
        if (!res.ok) throw new Error(`Velog list request failed: ${res.status}`);
        const json = await res.json();

        if (json.errors) {
            throw new Error(`GraphQL Errors: ${JSON.stringify(json.errors)}`);
        }

        return json.data?.posts;
    });
}

async function fetchAndProcess() {
    try {
        let previous = {};
        try {
            previous = JSON.parse(await fs.readFile(CONTEXT_FILE, 'utf8'));
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
        const previousBySlug = new Map(Object.values(previous).map(article => [article.slug, article]));
        // 1. Get All Posts
        const posts = await fetchAllPosts(USERNAME);
        console.log(`Found ${posts.length} items total.`);

        if (posts.length === 0) {
            throw new Error('No posts fetched from Velog. Aborting refresh to avoid overwriting existing archive data.');
        }

        let allSentences = [];
        let articleId = 0;
        const failedPosts = [];

        for (const item of posts) {
            console.log(`Processing [${articleId}]: ${item.title}`);
            const link = `https://velog.io/@${USERNAME}/${item.url_slug}`;
            const cached = previousBySlug.get(item.url_slug);
            const oldArticle = canReuseContent(cached) ? cached : null;
            const postData = await fetchPostData(link, oldArticle);
            const markdown = postData.body;
            const sourceHash = markdown
                ? createHash('sha256').update(JSON.stringify([
                    markdown, item.title, postData.releasedAt, postData.tags, postData.summary
                ])).digest('hex')
                : null;
            if (oldArticle && (postData.unchanged || sourceHash === oldArticle.sourceHash)) {
                oldArticle.sentences.forEach((sentence, index) => allSentences.push({
                    ...sentence, title: item.title, link, slug: item.url_slug,
                    articleId, sentenceIndex: index, totalInArticle: oldArticle.sentences.length,
                    publishedAt: oldArticle.publishedAt, tags: oldArticle.tags, summary: oldArticle.summary,
                    readingTime: oldArticle.readingTime, sourceHash: oldArticle.sourceHash,
                    sourceETag: postData.sourceETag || oldArticle.sourceETag,
                    sourceModified: postData.sourceModified || oldArticle.sourceModified,
                }));
                articleId++;
                await new Promise(r => setTimeout(r, 100));
                continue;
            }

            if (!markdown) {
                console.error(`  Failed to get markdown for ${item.title}`);
                failedPosts.push({
                    title: item.title,
                    slug: item.url_slug,
                    reason: 'missing markdown body'
                });
                articleId++;
                continue;
            }

            const itemSentences = parseArticleBody(markdown, link);
            if (itemSentences.length === 0) {
                failedPosts.push({
                    title: item.title, slug: item.url_slug, reason: 'no readable text, code or images'
                });
                articleId++;
                continue;
            }
            const readingTime = articleReadingTime(itemSentences);
            const summary = summarizeArticle(itemSentences);

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
                    summary,
                    readingTime,
                    sourceHash,
                    sourceETag: postData.sourceETag,
                    sourceModified: postData.sourceModified
                });
            });

            articleId++;
            // Be nice to the server
            await new Promise(r => setTimeout(r, 100));
        }

        if (failedPosts.length > MAX_FAILED_POSTS) {
            const failureSummary = failedPosts
                .map(post => `${post.title} (${post.reason})`)
                .join(', ');

            throw new Error(
                `Aborting refresh because ${failedPosts.length} posts failed to process: ${failureSummary}`
            );
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
                    contentVersion: CONTENT_VERSION,
                    sourceHash: s.sourceHash,
                    sourceETag: s.sourceETag,
                    sourceModified: s.sourceModified,
                    sentences: []
                };
            }
            byArticle[s.articleId].sentences.push({
                fullSentence: s.fullSentence,
                index: s.sentenceIndex,
                type: s.type,
                language: s.language,
                ...(s.type === 'image' ? { src: s.src, alt: s.alt } : {})
            });
        });

        // Filter out image sentences for WordCloud (but keep them in context)
        const textSentencesOnly = allSentences.filter(s => s.type !== 'image');
        console.log(`Filtered ${allSentences.length - textSentencesOnly.length} image sentences from cloud`);

        if (allSentences.length === 0) {
            throw new Error('No readable content was extracted. Aborting refresh.');
        }

        // Keep scraper validators and cache-only fields out of the legacy word data.
        // Explicit field order also keeps fresh extraction and cached reuse identical.
        const selected = selectStableSentences(textSentencesOnly, MAX_SENTENCES).map(s => ({
            fullSentence: s.fullSentence,
            type: s.type,
            language: s.language,
            link: s.link,
            title: s.title,
            slug: s.slug,
            articleId: s.articleId,
            sentenceIndex: s.sentenceIndex,
            totalInArticle: s.totalInArticle,
            publishedAt: s.publishedAt,
            tags: s.tags,
            summary: s.summary,
            readingTime: s.readingTime
        }));

        await fs.writeFile(CONTEXT_FILE, JSON.stringify(byArticle, null, 2));
        console.log(`Saved context data to ${CONTEXT_FILE}`);
        await fs.writeFile(OUTPUT_FILE, JSON.stringify(selected, null, 2));
        console.log(`Saved ${selected.length} sentences to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error in main process:', error);
        process.exitCode = 1;
    }
}

fetchAndProcess();
