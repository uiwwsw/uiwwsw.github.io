import React, { useState } from "react";
import { imageSource } from "../utils/articleMedia.js";

function ArticleImage({ block, number, title, articleLink }) {
  const [status, setStatus] = useState("loading");
  const [attempt, setAttempt] = useState(0);
  const src = imageSource(block.src);
  const alt = block.alt?.trim() || `${title} · 사진 ${number}`;
  return (
    <figure className="article-image" aria-label={`사진 ${number}`}>
      {src && status !== "error" ? (
        <a
          className="article-image-frame"
          href={src}
          target="_blank"
          rel="noreferrer"
          aria-label={`${alt} 크게 보기 (새 탭)`}
          aria-busy={status === "loading"}
        >
          {status === "loading" && (
            <span className="article-image-loading">사진을 불러오는 중…</span>
          )}
          <img
            key={attempt}
            src={src}
            alt={alt}
            loading={number === 1 ? "eager" : "lazy"}
            decoding="async"
            referrerPolicy="no-referrer"
            onLoad={() => setStatus("ready")}
            onError={() => setStatus("error")}
          />
        </a>
      ) : (
        <div className="article-image-error" role="status">
          <p>{alt}</p>
          <span>사진을 불러오지 못했어요. 글은 계속 읽을 수 있습니다.</span>
          <div>
            {src && (
              <button
                onClick={() => {
                  setAttempt((value) => value + 1);
                  setStatus("loading");
                }}
              >
                다시 불러오기
              </button>
            )}
            <a href={articleLink} target="_blank" rel="noreferrer">
              벨로그에서 보기 ↗
            </a>
          </div>
        </div>
      )}
      <figcaption>
        <span>
          {block.alt?.trim() || `사진 ${String(number).padStart(2, "0")}`}
        </span>
        {src && status !== "error" && (
          <a href={src} target="_blank" rel="noreferrer">
            크게 보기 ↗
          </a>
        )}
      </figcaption>
    </figure>
  );
}

export default function ArticleBody({ sentences, title, articleLink }) {
  let imageNumber = 0;
  return sentences.map((block, index) => {
    if (block.type === "image")
      return (
        <ArticleImage
          key={`${index}:${block.src}`}
          block={block}
          number={++imageNumber}
          title={title}
          articleLink={articleLink}
        />
      );
    if (block.type === "code")
      return (
        <div className="code-block" key={index}>
          <span>{block.language || "code"}</span>
          <pre>
            <code>{block.fullSentence}</code>
          </pre>
        </div>
      );
    return <p key={index}>{block.fullSentence}</p>;
  });
}
