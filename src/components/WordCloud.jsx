import React, { useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import Starfield from './Starfield';
import ArticleCluster from './wordcloud/ArticleCluster';
import useWordCloudController from './wordcloud/useWordCloudController';

export default function WordCloud({
  universe,
  selectedSentence,
  onSelectSentence,
  onSelectArticle,
  onFocusArticleChange,
  highlightedArticleIds = null,
  flightTargetArticleId = null,
  onFlightComplete = () => {},
  performanceProfile
}) {
  const { camera, gl, scene } = useThree();
  const highlightedArticleIdSet = useMemo(() => {
    return highlightedArticleIds ? new Set(highlightedArticleIds) : null;
  }, [highlightedArticleIds]);
  const {
    renderedArticles,
    focusedArticleId,
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
    flightTargetArticleId,
    onFlightComplete,
    performanceProfile
  });

  return (
    <group>
      <Starfield performanceProfile={performanceProfile} />

      {renderedArticles.map(({ article, worldPosition }) => (
        <ArticleCluster
          key={`cluster-${article.articleId}`}
          article={article}
          worldPosition={worldPosition}
          selectedSentence={selectedSentence}
          focusedArticleId={focusedArticleId}
          searchActive={highlightedArticleIdSet != null}
          isSearchMatch={highlightedArticleIdSet ? highlightedArticleIdSet.has(article.articleId) : true}
          onSelectSentence={onSelectSentence}
          onSelectArticle={onSelectArticle}
          onPointerGestureStart={beginGesture}
          registerCluster={registerCluster}
          unregisterCluster={unregisterCluster}
          performanceProfile={performanceProfile}
        />
      ))}
    </group>
  );
}
