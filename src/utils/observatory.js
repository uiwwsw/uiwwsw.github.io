export const TOPICS = {
  essay: { label: "사유와 일상", english: "THOUGHTS", color: "#dfd5bf" },
  engineering: {
    label: "개발과 기술",
    english: "ENGINEERING",
    color: "#9ccde4",
  },
  project: { label: "만드는 이야기", english: "MAKING", color: "#a7caba" },
  retrospective: {
    label: "회고와 성장",
    english: "REFLECTIONS",
    color: "#c5b4dc",
  },
};
export const clamp = (value, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
export const EARTH_RADIUS = 12.3;
export const earthPosition = (compact) =>
  compact ? [14, 83, -186] : [22.4, 68, -166];
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(text) {
  return Array.from(text).reduce(
    (value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0,
    2166136261,
  );
}
function classify(article) {
  const title = article.title || "";
  if (/회고|retrospective|리팩토링|돌아보|성장|배운|실수|교훈/i.test(title))
    return "retrospective";
  if (
    /개발기|머랭|프리페이|이스터에그|프로젝트|출시|런칭|서비스.*만들/i.test(
      title,
    )
  )
    return "project";
  if (
    /react|javascript|typescript|css|html|api|graphql|flutter|프론트|코드|코딩|개발|컴포넌트|테스트|렌더링|아키텍처|리[액엑]트|스크립트|object\.|mfe|federation|storybook/i.test(
      title,
    )
  )
    return "engineering";
  return article.sentences?.some((sentence) => sentence.type === "code")
    ? "engineering"
    : "essay";
}
export function buildCatalog(data) {
  return Object.entries(data || {})
    .map(([id, article]) => {
      const random = seededRandom(hash(article.slug || article.title || id));
      const topic = classify(article);
      // Adding a post never rearranges the existing sky.
      const position = [
        (random() - 0.5) * 49,
        random() * 24 - 1,
        -random() * 43 - 6,
      ];
      return {
        ...article,
        id: article.slug || id,
        legacyId: id,
        topic,
        color: TOPICS[topic].color,
        position,
        phase: random() * Math.PI * 2,
        sentences: article.sentences || [],
        readingTime: article.readingTime || 1,
        summary:
          article.summary ||
          article.sentences?.find((s) => s.type === "text")?.fullSentence ||
          "",
        codeCount: (article.sentences || []).filter((s) => s.type === "code")
          .length,
      };
    })
    .sort(
      (a, b) =>
        (b.publishedAt || "").localeCompare(a.publishedAt || "") ||
        a.id.localeCompare(b.id),
    );
}
export function filterCatalog(
  articles,
  query,
  topic = "all",
  codeOnly = false,
  year = "all",
) {
  const words = query.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  return articles.filter((article) => {
    const text =
      `${article.title} ${article.summary} ${(article.tags || []).join(" ")}`.toLocaleLowerCase();
    return (
      (topic === "all" || article.topic === topic) &&
      (!codeOnly || article.codeCount > 0) &&
      (year === "all" || article.publishedAt?.startsWith(year)) &&
      words.every((word) => text.includes(word))
    );
  });
}
export function flightPose(progress, compact = false) {
  const p = clamp(progress);
  return {
    position: [p * (compact ? 10 : 18), 50 + p * (compact ? 24 : 14), 32 - p * 160],
    target: [
      (compact ? 5 : 0) * (1 - p) + earthPosition(compact)[0] * p,
      55 * (1 - p) + earthPosition(compact)[1] * p,
      -50 * (1 - p) + earthPosition(compact)[2] * p,
    ],
  };
}
export function formatDate(value) {
  if (!value || Number.isNaN(Date.parse(value))) return "날짜 미상";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
