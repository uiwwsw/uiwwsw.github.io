import React, { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import FragmentLabel from './FragmentLabel';
import { clamp, fontUrl } from './shared';

export default function ArticleCluster({
  article,
  worldPosition,
  selectedSentence,
  focusedArticleId,
  searchActive = false,
  isSearchMatch = true,
  onSelectSentence,
  onSelectArticle,
  onPointerGestureStart,
  registerCluster,
  unregisterCluster
}) {
  const clusterRef = useRef();
  const tapStartRef = useRef(null);
  const beaconRef = useRef();
  const haloRef = useRef();
  const coronaRef = useRef();
  const ringRef = useRef();
  const beaconMaterialRef = useRef();
  const haloMaterialRef = useRef();
  const coronaMaterialRef = useRef();
  const ringMaterialRef = useRef();
  const focusBlendRef = useRef(0);
  const focusFlashRef = useRef(0);
  const wasFocusedRef = useRef(false);
  const isFocused = focusedArticleId === article.articleId;
  const isSelected = selectedSentence?.articleId === article.articleId;
  const isFocusDimmed = focusedArticleId != null && !isSelected && !isFocused && !selectedSentence;
  const isSearchDimmed = searchActive && !isSearchMatch && !isSelected && !isFocused;
  const isDimmed = isFocusDimmed || isSearchDimmed;
  const labelVisible = isFocused || isSelected;

  useEffect(() => {
    if (clusterRef.current) {
      registerCluster(article.articleId, clusterRef, article);
    }

    return () => {
      unregisterCluster(article.articleId);
    };
  }, [article, registerCluster, unregisterCluster]);

  useEffect(() => {
    if (isFocused && !wasFocusedRef.current) {
      focusFlashRef.current = 1;
    }

    wasFocusedRef.current = isFocused;
  }, [isFocused]);

  const handleClusterPointerDown = (event) => {
    if (selectedSentence) return;

    tapStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    };

    onPointerGestureStart(event.clientX, event.clientY);
    event.stopPropagation();
  };

  const handleClusterPointerUp = (event) => {
    const start = tapStartRef.current;
    tapStartRef.current = null;

    if (selectedSentence) return;

    event.stopPropagation();

    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const duration = Date.now() - start.time;

    if ((dx * dx) + (dy * dy) <= 36 && duration <= 320) {
      onSelectArticle?.(article);
    }
  };

  useFrame((state, delta) => {
    if (!clusterRef.current) return;

    focusBlendRef.current = THREE.MathUtils.damp(
      focusBlendRef.current,
      isSelected || isFocused ? 1 : 0,
      isSelected ? 8 : isFocused ? 6.5 : 4.5,
      delta
    );
    focusFlashRef.current = THREE.MathUtils.damp(focusFlashRef.current, 0, 4.2, delta);

    const focusBlend = focusBlendRef.current;
    const focusFlash = focusFlashRef.current;
    const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4 + article.articleId) * (0.05 + focusBlend * 0.05);
    const searchBoost = searchActive && isSearchMatch ? 0.12 : 0;
    const beaconScale = (
      isDimmed
        ? isSearchDimmed ? 0.82 : 0.94
        : 1 + searchBoost * 0.7 + focusBlend * 0.34 + focusFlash * 0.26 + (isSelected ? 0.12 : 0)
    ) * pulse;
    const haloScale = (
      isDimmed
        ? isSearchDimmed ? 1.08 : 1.24
        : 1.85 + searchBoost * 1.1 + focusBlend * 0.9 + focusFlash * 0.8 + (isSelected ? 0.28 : 0)
    ) * pulse;
    const coronaScale = (1.36 + searchBoost * 0.65 + focusBlend * 0.82 + focusFlash * 1.55) * pulse;
    const beaconOpacity = isDimmed
      ? isSearchDimmed ? 0.08 : 0.18
      : clamp(0.4 + searchBoost * 0.45 + focusBlend * 0.38 + focusFlash * 0.24 + (isSelected ? 0.12 : 0), 0.28, 1);
    const haloOpacity = isDimmed
      ? isSearchDimmed ? 0.008 : 0.018
      : clamp(0.04 + searchBoost * 0.06 + focusBlend * 0.11 + focusFlash * 0.18 + (isSelected ? 0.05 : 0), 0.03, 0.34);
    const coronaOpacity = isDimmed
      ? 0
      : clamp(searchBoost * 0.05 + focusBlend * 0.08 + focusFlash * 0.2 + (isSelected ? 0.04 : 0), 0, 0.24);
    const ringScale = 1.4 + (1 - focusFlash) * 4.1 + focusBlend * 0.35;
    const ringOpacity = clamp(focusFlash * 0.32 + (isSelected ? 0.08 : 0), 0, 0.36);

    if (beaconRef.current) {
      beaconRef.current.scale.setScalar(beaconScale);
    }

    if (haloRef.current) {
      haloRef.current.scale.setScalar(haloScale);
    }

    if (coronaRef.current) {
      coronaRef.current.scale.setScalar(coronaScale);
    }

    if (ringRef.current) {
      ringRef.current.visible = ringOpacity > 0.01;
      ringRef.current.scale.setScalar(ringScale);
    }

    if (beaconMaterialRef.current) {
      beaconMaterialRef.current.opacity = beaconOpacity;
    }

    if (haloMaterialRef.current) {
      haloMaterialRef.current.opacity = haloOpacity;
    }

    if (coronaMaterialRef.current) {
      coronaMaterialRef.current.opacity = coronaOpacity;
    }

    if (ringMaterialRef.current) {
      ringMaterialRef.current.opacity = ringOpacity;
    }
  });

  return (
    <group ref={clusterRef} position={worldPosition || article.center}>
      <mesh
        onPointerDown={handleClusterPointerDown}
        onPointerUp={handleClusterPointerUp}
      >
        <sphereGeometry args={[7.6, 20, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      </mesh>
      <mesh ref={haloRef}>
        <sphereGeometry args={[3.8, 16, 16]} />
        <meshBasicMaterial
          ref={haloMaterialRef}
          color={article.glow}
          transparent
          opacity={labelVisible ? 0.13 : 0.05}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={coronaRef}>
        <sphereGeometry args={[5.8, 20, 20]} />
        <meshBasicMaterial
          ref={coronaMaterialRef}
          color={article.glow}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={beaconRef}>
        <sphereGeometry args={[1.15, 16, 16]} />
        <meshBasicMaterial
          ref={beaconMaterialRef}
          color={article.color}
          transparent
          opacity={labelVisible ? 0.95 : 0.42}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Billboard follow>
        <mesh ref={ringRef} visible={false}>
          <ringGeometry args={[5.5, 6.4, 48]} />
          <meshBasicMaterial
            ref={ringMaterialRef}
            color={article.glow}
            transparent
            opacity={0}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </Billboard>

      {labelVisible && (
        <Billboard position={[0, 12, 0]} follow>
          <group>
            <mesh
              onPointerDown={handleClusterPointerDown}
              onPointerUp={handleClusterPointerUp}
            >
              <planeGeometry args={[58, 10]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
            </mesh>
            <Text
              font={fontUrl}
              fontSize={3.9}
              color="#f7fbff"
              fillOpacity={0.95}
              outlineWidth="4%"
              outlineColor="#030712"
              anchorX="center"
              anchorY="middle"
              maxWidth={120}
              onPointerDown={handleClusterPointerDown}
              onPointerUp={handleClusterPointerUp}
            >
              {article.constellationName}
            </Text>
          </group>
        </Billboard>
      )}

      {article.fragments.map(fragment => (
        <FragmentLabel
          key={fragment.id}
          fragment={fragment}
          selectedSentence={selectedSentence}
          focusArticleId={focusedArticleId}
          searchActive={searchActive}
          isSearchMatch={isSearchMatch}
          onSelectSentence={onSelectSentence}
          onPointerGestureStart={onPointerGestureStart}
        />
      ))}
    </group>
  );
}
