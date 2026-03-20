import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import Starfield from './Starfield';
import ArticleCluster from './wordcloud/ArticleCluster';
import useWordCloudController from './wordcloud/useWordCloudController';

export default function WordCloud({
  universe,
  selectedSentence,
  onSelectSentence,
  onFocusArticleChange,
  visibleArticleIds = null,
  flightTargetArticleId = null,
  onFlightComplete = () => {}
}) {
  const { camera, gl, scene } = useThree();
  const visibleArticleIdSet = useMemo(() => {
    return visibleArticleIds ? new Set(visibleArticleIds) : null;
  }, [visibleArticleIds]);
  const visibleArticles = useMemo(() => {
    if (!visibleArticleIdSet) {
      return universe.articles;
    }

    return universe.articles.filter(article => visibleArticleIdSet.has(article.articleId));
  }, [universe.articles, visibleArticleIdSet]);
  const {
    focusedArticleId,
    setFocusedArticleId,
    beginGesture,
    registerCluster,
    unregisterCluster
  } = useWordCloudController({
    camera,
    gl,
    scene,
    universe,
    selectedSentence,
    onFocusArticleChange,
    visibleArticleIdSet,
    flightTargetArticleId,
    onFlightComplete
  });

  return (
    <group>
      <Starfield />

      {visibleArticles.map(article => (
        <ArticleCluster
          key={`cluster-${article.articleId}`}
          article={article}
          selectedSentence={selectedSentence}
          focusedArticleId={focusedArticleId}
          onHoverArticle={(articleId) => {
            if (articleId == null) return;

            const hoveredArticle = universe.articleById[articleId];

            if (hoveredArticle) {
              setFocusedArticleId(articleId);
              onFocusArticleChange(hoveredArticle);
            }
          }}
          onSelectSentence={onSelectSentence}
          onPointerGestureStart={beginGesture}
          registerCluster={registerCluster}
          unregisterCluster={unregisterCluster}
        />
      ))}
    </group>
  );
}
