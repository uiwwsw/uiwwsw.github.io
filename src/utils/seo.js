import { imageSource } from "./articleMedia.js";

export const SITE = {
  url: "https://uiwwsw.github.io",
  name: "윤창원 · uiwwsw",
  title: "윤창원 | 글 쓰는 프론트엔드 개발자 · uiwwsw",
  description:
    "코드를 쓰고, 생각을 쓰는 프론트엔드 개발자 윤창원(uiwwsw)의 포트폴리오입니다. React와 TypeScript 개발 경험, 프로젝트 회고, 일상과 사진을 기록합니다. 달에서 지구로 향하며 글 하나하나를 별처럼 만나보세요.",
  image: "https://uiwwsw.github.io/og-yoon-changwon-v2.png",
  imageAlt: "윤창원 · YOON CHANGWON · Frontend Developer",
  github: "https://github.com/uiwwsw",
  velog: "https://velog.io/@uiwwsw/posts",
};

export const AUTHOR = {
  "@type": "Person",
  "@id": `${SITE.url}/#person`,
  name: "윤창원",
  alternateName: ["uiwwsw", "Yoon Changwon"],
  url: `${SITE.url}/`,
  jobTitle: "프론트엔드 개발자",
  description: "코드를 쓰고, 생각을 쓰는 프론트엔드 개발자",
  sameAs: [SITE.github, SITE.velog],
};

export function articlePath(article) {
  return `/writing/${encodeURIComponent(article.slug || article.id)}/`;
}

export function archivePath(page = 1) {
  return page === 1 ? "/writing/" : `/writing/page/${page}/`;
}

export function articleImage(article) {
  const block = article.sentences?.find(
    (item) => item.type === "image" && imageSource(item.src),
  );
  const src = imageSource(article.seoImage?.src || block?.src);
  return src
    ? {
        src,
        alt: article.seoImage?.alt || block?.alt || `${article.title} · 사진 1`,
      }
    : { src: SITE.image, alt: SITE.imageAlt };
}

export function pageSeo(article = null) {
  if (!article)
    return {
      title: SITE.title,
      description: SITE.description,
      url: `${SITE.url}/`,
      type: "website",
      image: { src: SITE.image, alt: SITE.imageAlt },
    };
  return {
    title: `${article.title} | 윤창원 · uiwwsw`,
    description: `${article.summary || article.title} — 윤창원의 기록`,
    url: `${SITE.url}${articlePath(article)}`,
    type: "article",
    image: articleImage(article),
    publishedAt: article.publishedAt || null,
  };
}

export function structuredData(article = null) {
  const website = {
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: `${SITE.url}/`,
    name: SITE.name,
    alternateName: "uiwwsw",
    description: SITE.description,
    inLanguage: "ko-KR",
    author: { "@id": AUTHOR["@id"] },
  };
  const page = article
    ? {
        "@type": "BlogPosting",
        "@id": `${SITE.url}${articlePath(article)}#article`,
        url: `${SITE.url}${articlePath(article)}`,
        mainEntityOfPage: `${SITE.url}${articlePath(article)}`,
        headline: article.title,
        description: pageSeo(article).description,
        image: [articleImage(article).src],
        author: AUTHOR,
        publisher: { "@id": AUTHOR["@id"] },
        isPartOf: { "@id": website["@id"] },
        inLanguage: "ko-KR",
        isAccessibleForFree: true,
        ...(article.publishedAt ? { datePublished: article.publishedAt } : {}),
        ...(article.tags?.length ? { keywords: article.tags.join(", ") } : {}),
      }
    : {
        "@type": "ProfilePage",
        "@id": `${SITE.url}/#profile`,
        url: `${SITE.url}/`,
        name: SITE.title,
        description: SITE.description,
        mainEntity: { "@id": AUTHOR["@id"] },
        isPartOf: { "@id": website["@id"] },
        inLanguage: "ko-KR",
      };
  return {
    "@context": "https://schema.org",
    "@graph": [AUTHOR, website, page],
  };
}

// The immersive ?article= view is an alternate view of the static article URL.
// Keep its share metadata and canonical in sync, including when closing a post.
export function updatePageSeo(article, doc = document) {
  const seo = pageSeo(article);
  doc.title = seo.title;
  function meta(attribute, name, content) {
    let element = doc.head.querySelector(`meta[${attribute}="${name}"]`);
    if (!content) {
      element?.remove();
      return;
    }
    if (!element) {
      element = doc.createElement("meta");
      element.setAttribute(attribute, name);
      doc.head.append(element);
    }
    element.setAttribute("content", content);
  }
  meta("name", "description", seo.description);
  for (const prefix of ["og", "twitter"]) {
    meta("property", `${prefix}:title`, seo.title);
    meta("property", `${prefix}:description`, seo.description);
    meta("property", `${prefix}:url`, seo.url);
    meta("property", `${prefix}:image`, seo.image.src);
  }
  meta("property", "og:type", seo.type);
  meta("property", "og:image:alt", seo.image.alt);
  meta("name", "twitter:image:alt", seo.image.alt);
  // The default thumbnail dimensions do not apply to individual article photos.
  meta(
    "property",
    "og:image:width",
    seo.image.src === SITE.image ? "1738" : null,
  );
  meta(
    "property",
    "og:image:height",
    seo.image.src === SITE.image ? "905" : null,
  );
  meta(
    "property",
    "og:image:type",
    seo.image.src === SITE.image ? "image/png" : null,
  );
  meta("property", "article:published_time", seo.publishedAt);
  meta("property", "article:author", article ? AUTHOR.url : null);
  let canonical = doc.head.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = doc.createElement("link");
    canonical.rel = "canonical";
    doc.head.append(canonical);
  }
  canonical.href = seo.url;
  let schema = doc.getElementById("page-schema");
  if (!schema) {
    schema = doc.createElement("script");
    schema.id = "page-schema";
    schema.type = "application/ld+json";
    doc.head.append(schema);
  }
  schema.textContent = JSON.stringify(structuredData(article));
}
