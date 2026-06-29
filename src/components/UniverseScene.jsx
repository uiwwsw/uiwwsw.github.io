import React, { Suspense, lazy, memo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';

const WordCloud = lazy(() => import('./WordCloud'));

function UniverseScene({
  universe,
  selectedSentence,
  onSelectSentence,
  onSelectArticle,
  onFocusArticleChange,
  highlightedArticleIds,
  flightTargetArticleId,
  onFlightComplete,
  sceneProfile,
  canvasOptions
}) {
  return (
    <Canvas
      gl={canvasOptions}
      dpr={sceneProfile.dpr}
      onCreated={({ gl }) => {
        gl.setClearColor('#02040a');
        gl.setPixelRatio(Math.min(window.devicePixelRatio, sceneProfile.pixelRatioMax));
      }}
    >
      <color attach="background" args={['#02040a']} />
      <PerspectiveCamera makeDefault position={[0, 12, 920]} fov={50} />

      <Suspense fallback={null}>
        <WordCloud
          universe={universe}
          selectedSentence={selectedSentence}
          onSelectSentence={onSelectSentence}
          onSelectArticle={onSelectArticle}
          onFocusArticleChange={onFocusArticleChange}
          highlightedArticleIds={highlightedArticleIds}
          flightTargetArticleId={flightTargetArticleId}
          onFlightComplete={onFlightComplete}
          performanceProfile={sceneProfile}
        />
      </Suspense>

      {sceneProfile.enablePostProcessing && (
        <EffectComposer disableNormalPass>
          <Bloom luminanceThreshold={0} mipmapBlur intensity={0.72} radius={0.62} />
          <Vignette eskil={false} offset={0.12} darkness={0.9} />
        </EffectComposer>
      )}

      <ambientLight intensity={0.78} />
      <directionalLight position={[140, 220, 180]} intensity={0.38} color="#9ad5ff" />
      <pointLight position={[-180, 60, 240]} intensity={0.22} color="#ffc670" />
    </Canvas>
  );
}

export default memo(UniverseScene);
