import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { clamp, fontUrl } from './shared';

export default function FragmentLabel({
  fragment,
  selectedSentence,
  focusArticleId,
  searchActive = false,
  isSearchMatch = true,
  onSelectSentence,
  onPointerGestureStart,
  performanceProfile
}) {
  const { camera } = useThree();
  const labelRef = useRef();
  const textRef = useRef();
  const tapStartRef = useRef(null);
  const worldPositionRef = useRef(new THREE.Vector3());
  const interactiveRef = useRef(false);
  const baseLocalPosition = useMemo(() => new THREE.Vector3(...fragment.localPosition), [fragment.localPosition]);

  const isSelectedFragment = !!selectedSentence
    && selectedSentence.articleId === fragment.articleId
    && Number(selectedSentence.sentenceIndex) === fragment.sentenceIndex;
  const isSelectedArticle = !!selectedSentence && selectedSentence.articleId === fragment.articleId;
  const isMobile = performanceProfile?.isMobile === true;
  const isSearchDimmed = searchActive && !isSearchMatch && !isSelectedArticle;
  const hitWidth = Math.max(9.5, fragment.displayText.length * 1.28 + 3.8);
  const hitHeight = fragment.type === 'code' ? 4.6 : 4.1;

  useFrame((state, delta) => {
    if (!labelRef.current || !textRef.current) return;

    const time = state.clock.elapsedTime;
    const driftScale = isMobile ? 0.22 : 1;
    const driftX = Math.sin(time * 0.28 + baseLocalPosition.x * 0.03) * 0.9 * driftScale;
    const driftY = Math.cos(time * 0.34 + baseLocalPosition.z * 0.02) * 0.8 * driftScale;
    const driftZ = Math.sin(time * 0.22 + baseLocalPosition.y * 0.03) * 0.7 * driftScale;

    labelRef.current.position.set(
      baseLocalPosition.x + driftX,
      baseLocalPosition.y + driftY,
      baseLocalPosition.z + driftZ
    );

    labelRef.current.getWorldPosition(worldPositionRef.current);

    const distance = camera.position.distanceTo(worldPositionRef.current);
    const nearFade = distance < 24 ? distance / 24 : 1;
    const farFadeStart = isMobile ? 760 : 920;
    const farFadeRange = isMobile ? 320 : 520;
    const farFade = distance > farFadeStart ? clamp(1 - (distance - farFadeStart) / farFadeRange, 0, 1) : 1;
    const scale = clamp(1.18 - distance / (isMobile ? 1180 : 1350), 0.72, 1.15);
    const focused = focusArticleId === fragment.articleId;
    const focusLocked = focusArticleId != null && !selectedSentence;
    let targetOpacity = nearFade * farFade * (fragment.type === 'code' ? 0.82 : 0.7);

    if (focusLocked) {
      targetOpacity *= focused ? 1.18 : 0.34;
    }

    if (focused) targetOpacity += focusLocked ? 0.24 : 0.16;

    if (selectedSentence) {
      targetOpacity = isSelectedFragment ? 1 : isSelectedArticle ? 0.48 : 0.08;
    } else if (isSearchDimmed && !focused) {
      targetOpacity *= 0.18;
    }

    interactiveRef.current = distance < (isMobile ? 260 : 340)
      && (targetOpacity > 0.06 || distance < (isMobile ? 140 : 170) || isSelectedArticle || focused);

    labelRef.current.scale.setScalar(
      scale * (focused ? 1.08 : focusLocked ? 0.96 : isSearchDimmed ? 0.92 : 1)
    );
    textRef.current.fillOpacity = THREE.MathUtils.lerp(
      textRef.current.fillOpacity,
      clamp(targetOpacity, 0, 1),
      delta * 6
    );
    labelRef.current.visible = textRef.current.fillOpacity > 0.015 || isSelectedArticle || focused;
  });

  const handlePointerDown = (event) => {
    if (!interactiveRef.current) return;

    tapStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: Date.now()
    };

    onPointerGestureStart(event.clientX, event.clientY);
    event.stopPropagation();
  };

  const handlePointerUp = (event) => {
    const start = tapStartRef.current;
    tapStartRef.current = null;

    if (!interactiveRef.current) return;

    event.stopPropagation();

    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const duration = Date.now() - start.time;

    if ((dx * dx) + (dy * dy) <= 144 && duration <= 420) {
      onSelectSentence(fragment);
    }
  };

  return (
    <Billboard ref={labelRef} position={fragment.localPosition} follow>
      <mesh
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[hitWidth, hitHeight]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      </mesh>
      <Text
        ref={textRef}
        font={fontUrl}
        fontSize={1.18}
        color={fragment.type === 'code' ? '#f6fbff' : fragment.color}
        fillOpacity={0}
        outlineWidth="6%"
        outlineColor="#02050c"
        anchorX="center"
        anchorY="middle"
        whiteSpace="nowrap"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {fragment.displayText}
      </Text>
    </Billboard>
  );
}
