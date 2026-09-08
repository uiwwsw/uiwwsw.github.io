import { useEffect, useState } from "react";
import { createArticleLoader } from "../utils/articleLoader.js";

const loadArticle = createArticleLoader();
export function useArticleContent(article) {
  const [attempt, retry] = useState(0);
  const [state, setState] = useState({
    id: null,
    status: "loading",
    sentences: [],
  });
  useEffect(() => {
    if (!article) return;
    const controller = new AbortController();
    setState({ id: article.id, status: "loading", sentences: [] });
    loadArticle(article, controller.signal)
      .then((sentences) => {
        if (!controller.signal.aborted)
          setState({ id: article.id, status: "ready", sentences });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setState({ id: article.id, status: "error", sentences: [] });
      });
    return () => controller.abort();
  }, [article?.id, article?.bodyUrl, attempt]);
  return {
    ...(state.id === article?.id
      ? state
      : { status: "loading", sentences: [] }),
    retry: () => retry((value) => value + 1),
  };
}
