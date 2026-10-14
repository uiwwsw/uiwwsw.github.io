import { seededRandom, clamp } from './observatory.js';

export function starSeed(id, seed = 0) {
  return [...String(id)].reduce((n, c) => Math.imul(n ^ c.charCodeAt(0), 16777619) >>> 0, (2166136261 ^ seed) >>> 0);
}
export const STAR_PALETTES = {
  essay: { color: '#f4cf88', shape: 0 },
  engineering: { color: '#83cbff', shape: 1 },
  project: { color: '#83e1bd', shape: 2 },
  retrospective: { color: '#c7a4f5', shape: 3 },
};

// These are invitations drawn only from the supplied public catalog, never
// claims about readership/popularity or a request for private content.
export function giveStarsPersonality(articles, visitSeed = 0) {
  const dated = [...articles].filter(a => a.publishedAt).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt) || a.id.localeCompare(b.id));
  const latest = new Set(dated.slice(0, 3).map(a => a.id));
  const older = articles.filter(a => !latest.has(a.id));
  const rediscovered = [...older].sort((a,b) => starSeed(a.id, visitSeed) - starSeed(b.id, visitSeed)).slice(0, 2);
  const rediscoveredIds = new Set(rediscovered.map(a => a.id));
  return articles.map(article => {
    const random = seededRandom(starSeed(article.id, visitSeed));
    const palette = STAR_PALETTES[article.topic] || STAR_PALETTES.essay;
    const invitation = latest.has(article.id) ? '최근 기록' : rediscoveredIds.has(article.id) ? '다시 발견한 기록' : '';
    return { ...article, color: palette.color, starStyle: {
      size: .8 + random() * .5 + clamp((article.readingTime || 1) / 12) * .2 + (invitation ? .2 : 0),
      phase: random() * Math.PI * 2,
      period: 18 + random() * 18,
      shape: palette.shape,
      invitation,
      accent: invitation ? 1 : 0,
    }};
  });
}
