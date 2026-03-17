const TOPIC_ORDER = ['engineering', 'project', 'retrospective', 'essay'];
const UNIVERSE_DEPTH = 2400;
const TOPIC_LANE_GAP = 210;

export const TOPIC_CONFIG = {
  engineering: {
    label: 'Engineering Nebula',
    shortLabel: 'Engineering',
    color: '#83d8ff',
    glow: '#3fa8ff'
  },
  project: {
    label: 'Product Belt',
    shortLabel: 'Product',
    color: '#89f5cf',
    glow: '#2dd4bf'
  },
  retrospective: {
    label: 'Reflection Rift',
    shortLabel: 'Reflection',
    color: '#ffc670',
    glow: '#ff9f43'
  },
  essay: {
    label: 'Inner Orbit',
    shortLabel: 'Essay',
    color: '#ff9b8a',
    glow: '#ff6b57'
  }
};

const TOPIC_KEYWORDS = {
  engineering: [
    'react', 'frontend', 'typescript', 'javascript', 'css', 'html', 'storybook', 'apollo',
    'mfe', 'federation', 'object.entries', 'flutter', 'api', 'graphql', '컴포넌트', '프론트',
    '코드', '타입', '렌더링', '성능', '리액트', '설계'
  ],
  project: [
    '개발기', '서비스', '프로젝트', '머랭트립', '런칭', '출시', '앱', '서비스', '운영',
    '구현', '기능', '사용자', '제품'
  ],
  retrospective: [
    '회고', 'retrospective', '리팩토링', '배운', '성장', '완성도', '개선', '실수', '과정',
    '교훈', '돌아보며'
  ],
  essay: [
    '무엇인가', '생각', '마음', '사랑', '인생', '관계', '왜', '철학', '선', '토끼',
    '코난', '좋아요', '지능', '태도', '감정'
  ]
};

function hashString(input) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function truncate(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function inferTopic(article) {
  const searchSpace = `${article.title} ${article.sentences.map(sentence => sentence.fullSentence).join(' ')}`.toLowerCase();
  const scoreByTopic = {};

  TOPIC_ORDER.forEach(topic => {
    scoreByTopic[topic] = TOPIC_KEYWORDS[topic].reduce((score, keyword) => {
      return score + (searchSpace.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
  });

  let topic = 'essay';
  let bestScore = -1;

  TOPIC_ORDER.forEach(candidate => {
    if (scoreByTopic[candidate] > bestScore) {
      topic = candidate;
      bestScore = scoreByTopic[candidate];
    }
  });

  return topic;
}

function buildDisplayText(sentence) {
  if (sentence.type === 'code') {
    const language = (sentence.language || '').toLowerCase();

    if (language === 'ts' || language === 'tsx' || language === 'typescript') return 'TS';
    if (language === 'js' || language === 'jsx' || language === 'javascript') return 'JS';
    if (language === 'css') return 'CSS';
    if (language === 'html') return 'HTML';
    if (language === 'dart') return 'DART';

    return '</>';
  }

  return truncate(sentence.fullSentence.replace(/\n/g, ' ').trim(), 22);
}

function getExcerpt(sentences) {
  const firstText = sentences.find(sentence => (sentence.type || 'text') === 'text');
  return truncate(firstText?.fullSentence || '', 160);
}

function getConstellationName(title, topicLabel) {
  const cleaned = title.replace(/[\[\]"'()]/g, '').trim();
  return truncate(`${cleaned} / ${topicLabel}`, 48);
}

export function getContextWindow(article, sentenceIndex, targetCount = 7) {
  const sentences = article?.sentences || [];
  const currentIndex = Number(sentenceIndex);

  if (Number.isNaN(currentIndex) || currentIndex < 0 || currentIndex >= sentences.length) {
    return [];
  }

  let startIndex = Math.max(0, currentIndex - Math.floor(targetCount / 2));
  let endIndex = Math.min(sentences.length, startIndex + targetCount);

  if (endIndex - startIndex < targetCount) {
    startIndex = Math.max(0, endIndex - targetCount);
  }

  return sentences.slice(startIndex, endIndex).map((sentence, index) => ({
    text: sentence.fullSentence,
    type: sentence.type || 'text',
    language: sentence.language || null,
    isSelected: startIndex + index === currentIndex
  }));
}

export function buildUniverseModel(contextData) {
  const sourceArticles = Object.entries(contextData || {}).map(([articleId, article]) => ({
    articleId: Number(articleId),
    ...article
  }));

  const sortedArticles = sourceArticles.sort((left, right) => left.articleId - right.articleId);
  const groupedByTopic = Object.fromEntries(TOPIC_ORDER.map(topic => [topic, []]));

  sortedArticles.forEach(article => {
    const topic = inferTopic(article);
    groupedByTopic[topic].push({
      ...article,
      topic
    });
  });

  const articles = [];

  TOPIC_ORDER.forEach((topic, topicIndex) => {
    const topicArticles = groupedByTopic[topic];
    const topicConfig = TOPIC_CONFIG[topic];
    const count = Math.max(topicArticles.length, 1);
    const laneOrigin = (topicIndex - (TOPIC_ORDER.length - 1) / 2) * TOPIC_LANE_GAP;

    topicArticles.forEach((article, articleIndex) => {
      const seed = hashString(`${article.title}:${article.articleId}`);
      const rng = createRng(seed);
      const orbitProgress = articleIndex / count;
      const laneWave = Math.sin(orbitProgress * Math.PI * 2 + topicIndex * 0.9) * 92;
      const x = laneOrigin + laneWave + (rng() - 0.5) * 150;
      const y = (rng() - 0.5) * 340 + Math.cos(orbitProgress * Math.PI * 1.5 + topicIndex) * 84;
      const z = (-UNIVERSE_DEPTH / 2) + orbitProgress * UNIVERSE_DEPTH + (rng() - 0.5) * 220;
      const sentenceCount = article.sentences.length;
      const codeCount = article.sentences.filter(sentence => sentence.type === 'code').length;

      articles.push({
        articleId: article.articleId,
        title: article.title,
        link: article.link,
        topic,
        topicLabel: topicConfig.label,
        topicShortLabel: topicConfig.shortLabel,
        color: topicConfig.color,
        glow: topicConfig.glow,
        sentenceCount,
        codeCount,
        excerpt: getExcerpt(article.sentences),
        center: [x, y, z],
        clusterSize: clamp(34 + sentenceCount * 1.2, 46, 102),
        constellationName: getConstellationName(article.title, topicConfig.shortLabel),
        sentences: article.sentences,
        fragments: []
      });
    });
  });

  const articleById = Object.fromEntries(articles.map(article => [article.articleId, article]));
  const fragments = [];

  articles.forEach(article => {
    article.sentences.forEach((sentence, sentenceIndex) => {
      const seed = hashString(`${article.title}:${sentence.fullSentence}:${sentenceIndex}`);
      const rng = createRng(seed);
      const ring = Math.floor(sentenceIndex / 6);
      const angle = rng() * Math.PI * 2 + sentenceIndex * 0.73;
      const radialOffset = 16 + ring * 10 + rng() * 10 + (sentence.type === 'code' ? 8 : 0);
      const verticalOffset = (rng() - 0.5) * article.clusterSize * 1.15;
      const drift = (rng() - 0.5) * 22;
      const localPosition = [
        Math.cos(angle) * radialOffset * 1.9,
        verticalOffset,
        Math.sin(angle) * radialOffset * 1.1 + drift
      ];

      const fragment = {
        id: `${article.articleId}:${sentenceIndex}`,
        articleId: article.articleId,
        title: article.title,
        link: article.link,
        topic: article.topic,
        topicLabel: article.topicLabel,
        color: article.color,
        glow: article.glow,
        fullSentence: sentence.fullSentence,
        type: sentence.type || 'text',
        language: sentence.language || null,
        displayText: buildDisplayText(sentence),
        sentenceIndex,
        totalInArticle: article.sentenceCount,
        localPosition,
        position: [
          article.center[0] + localPosition[0],
          article.center[1] + localPosition[1],
          article.center[2] + localPosition[2]
        ]
      };

      fragments.push(fragment);
      article.fragments.push(fragment);
    });
  });

  const topicSummary = TOPIC_ORDER.map(topic => {
    const topicArticles = articles.filter(article => article.topic === topic);
    const fragmentCount = topicArticles.reduce((count, article) => count + article.sentenceCount, 0);

    return {
      topic,
      label: TOPIC_CONFIG[topic].label,
      shortLabel: TOPIC_CONFIG[topic].shortLabel,
      color: TOPIC_CONFIG[topic].color,
      articleCount: topicArticles.length,
      fragmentCount
    };
  });

  return {
    articles,
    articleById,
    fragments,
    topicSummary,
    stats: {
      articleCount: articles.length,
      fragmentCount: fragments.length,
      sectorCount: TOPIC_ORDER.length
    }
  };
}
