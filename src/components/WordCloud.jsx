import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import Starfield from './Starfield';

const fontUrl = '/fonts/SUITE-Variable.ttf';
const CRUISE_SPEED = 30;
const MAX_SPEED = 230;
const TUNNEL_LENGTH = 3200;
const WRAP_RADIUS = 920;
const WRAP_HEIGHT = 680;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashString(input) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleTunnelCrossSection(articleId, wrapIndex) {
  const rng = createRng(hashString(`${articleId}:${wrapIndex}`));
  const theta = rng() * Math.PI * 2;
  const radius = 130 + Math.pow(rng(), 0.72) * (WRAP_RADIUS - 160);

  return {
    x: Math.cos(theta) * radius,
    y: (rng() - 0.5) * WRAP_HEIGHT * 1.5
  };
}

function findFocusArticle(camera, clusterMap) {
  const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
  const worldPosition = new THREE.Vector3();
  const projectedPosition = new THREE.Vector3();
  let bestArticle = null;
  let bestScore = Number.POSITIVE_INFINITY;

  clusterMap.forEach(({ article, ref }) => {
    if (!ref.current) return;

    ref.current.getWorldPosition(worldPosition);

    const direction = worldPosition.clone().sub(camera.position);
    const distance = direction.length();

    if (distance < 1) return;

    const forwardness = direction.normalize().dot(cameraForward);

    if (forwardness < -0.1) return;

    projectedPosition.copy(worldPosition).project(camera);

    if (
      projectedPosition.z < -1
      || projectedPosition.z > 1
      || projectedPosition.x < -1
      || projectedPosition.x > 1
      || projectedPosition.y < -1
      || projectedPosition.y > 1
    ) {
      return;
    }

    const score = distance - forwardness * 200;

    if (score < bestScore) {
      bestScore = score;
      bestArticle = article;
    }
  });

  return bestArticle;
}

function FragmentLabel({
  fragment,
  selectedSentence,
  focusArticleId,
  onHoverArticle,
  onSelectSentence,
  onPointerGestureStart
}) {
  const { camera } = useThree();
  const labelRef = useRef();
  const textRef = useRef();
  const tapStartRef = useRef(null);
  const worldPositionRef = useRef(new THREE.Vector3());
  const interactiveRef = useRef(false);
  const baseLocalPosition = useMemo(() => new THREE.Vector3(...fragment.localPosition), [fragment.localPosition]);
  const [hovered, setHovered] = useState(false);

  const isSelectedFragment = !!selectedSentence
    && selectedSentence.articleId === fragment.articleId
    && Number(selectedSentence.sentenceIndex) === fragment.sentenceIndex;
  const isSelectedArticle = !!selectedSentence && selectedSentence.articleId === fragment.articleId;

  useFrame((state, delta) => {
    if (!labelRef.current || !textRef.current) return;

    const time = state.clock.elapsedTime;
    const driftX = Math.sin(time * 0.28 + baseLocalPosition.x * 0.03) * 0.9;
    const driftY = Math.cos(time * 0.34 + baseLocalPosition.z * 0.02) * 0.8;
    const driftZ = Math.sin(time * 0.22 + baseLocalPosition.y * 0.03) * 0.7;

    labelRef.current.position.set(
      baseLocalPosition.x + driftX,
      baseLocalPosition.y + driftY,
      baseLocalPosition.z + driftZ
    );

    labelRef.current.getWorldPosition(worldPositionRef.current);

    const distance = camera.position.distanceTo(worldPositionRef.current);
    const nearFade = distance < 24 ? distance / 24 : 1;
    const farFade = distance > 920 ? clamp(1 - (distance - 920) / 520, 0, 1) : 1;
    const scale = clamp(1.18 - distance / 1350, 0.72, 1.15);
    const focused = focusArticleId === fragment.articleId;
    const focusLocked = focusArticleId != null && !selectedSentence;
    let targetOpacity = nearFade * farFade * (fragment.type === 'code' ? 0.82 : 0.7);

    if (focusLocked) {
      targetOpacity *= focused ? 1.18 : 0.34;
    }

    if (focused) targetOpacity += focusLocked ? 0.24 : 0.16;
    if (hovered) targetOpacity = 1;

    if (selectedSentence) {
      targetOpacity = isSelectedFragment ? 1 : isSelectedArticle ? 0.48 : 0.08;
    }

    interactiveRef.current = distance < 220 && targetOpacity > 0.18;

    labelRef.current.scale.setScalar(scale * (focused ? 1.08 : focusLocked ? 0.96 : 1));
    textRef.current.fillOpacity = THREE.MathUtils.lerp(
      textRef.current.fillOpacity,
      clamp(targetOpacity, 0, 1),
      delta * 6
    );
    labelRef.current.visible = textRef.current.fillOpacity > 0.015 || hovered || isSelectedArticle || focused;
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

    if ((dx * dx) + (dy * dy) <= 36 && duration <= 320) {
      onSelectSentence(fragment);
    }
  };

  const handlePointerOver = (event) => {
    if (!interactiveRef.current) return;

    event.stopPropagation();
    setHovered(true);
    onHoverArticle(fragment.articleId);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (event) => {
    event.stopPropagation();
    setHovered(false);
    onHoverArticle(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <Billboard ref={labelRef} position={fragment.localPosition} follow>
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[Math.max(6.5, fragment.displayText.length * 1.05 + 1.6), 2.3]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} depthTest={false} />
      </mesh>
      <Text
        ref={textRef}
        font={fontUrl}
        fontSize={1.18}
        color={hovered ? '#ffffff' : fragment.type === 'code' ? '#f6fbff' : fragment.color}
        fillOpacity={0}
        outlineWidth="6%"
        outlineColor="#02050c"
        anchorX="center"
        anchorY="middle"
        whiteSpace="nowrap"
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        {fragment.displayText}
      </Text>
    </Billboard>
  );
}

function ArticleCluster({
  article,
  selectedSentence,
  focusedArticleId,
  onHoverArticle,
  onSelectSentence,
  onPointerGestureStart,
  registerCluster,
  unregisterCluster
}) {
  const clusterRef = useRef();
  const baseCenter = useMemo(() => new THREE.Vector3(...article.center), [article.center]);
  const relPosition = useRef(new THREE.Vector3());
  const worldQuaternion = useRef(new THREE.Quaternion());
  const wrapIndexRef = useRef(0);
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
  const isDimmed = focusedArticleId != null && !isSelected && !isFocused && !selectedSentence;
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

  useFrame((state, delta) => {
    if (!clusterRef.current) return;

    if (clusterRef.current.position.lengthSq() === 0) {
      clusterRef.current.position.copy(baseCenter);
    }

    if (!selectedSentence) {
      relPosition.current.subVectors(clusterRef.current.position, state.camera.position);
      worldQuaternion.current.copy(state.camera.quaternion).invert();
      relPosition.current.applyQuaternion(worldQuaternion.current);

      const halfLength = TUNNEL_LENGTH / 2;
      let changed = false;

      if (relPosition.current.z > halfLength) {
        const respawn = sampleTunnelCrossSection(article.articleId, wrapIndexRef.current += 1);
        relPosition.current.z -= TUNNEL_LENGTH;
        relPosition.current.x = respawn.x;
        relPosition.current.y = respawn.y;
        changed = true;
      } else if (relPosition.current.z < -halfLength) {
        const respawn = sampleTunnelCrossSection(article.articleId, wrapIndexRef.current += 1);
        relPosition.current.z += TUNNEL_LENGTH;
        relPosition.current.x = respawn.x;
        relPosition.current.y = respawn.y;
        changed = true;
      }

      if (relPosition.current.x > WRAP_RADIUS) {
        relPosition.current.x -= WRAP_RADIUS * 2;
        changed = true;
      } else if (relPosition.current.x < -WRAP_RADIUS) {
        relPosition.current.x += WRAP_RADIUS * 2;
        changed = true;
      }

      if (relPosition.current.y > WRAP_HEIGHT) {
        relPosition.current.y -= WRAP_HEIGHT * 2;
        changed = true;
      } else if (relPosition.current.y < -WRAP_HEIGHT) {
        relPosition.current.y += WRAP_HEIGHT * 2;
        changed = true;
      }

      if (changed) {
        relPosition.current.applyQuaternion(state.camera.quaternion);
        clusterRef.current.position.copy(state.camera.position).add(relPosition.current);
      }
    }

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
    const beaconScale = (isDimmed ? 0.94 : 1 + focusBlend * 0.34 + focusFlash * 0.26 + (isSelected ? 0.12 : 0)) * pulse;
    const haloScale = (isDimmed ? 1.24 : 1.85 + focusBlend * 0.9 + focusFlash * 0.8 + (isSelected ? 0.28 : 0)) * pulse;
    const coronaScale = (1.36 + focusBlend * 0.82 + focusFlash * 1.55) * pulse;
    const beaconOpacity = isDimmed
      ? 0.18
      : clamp(0.4 + focusBlend * 0.38 + focusFlash * 0.24 + (isSelected ? 0.12 : 0), 0.28, 1);
    const haloOpacity = isDimmed
      ? 0.018
      : clamp(0.04 + focusBlend * 0.11 + focusFlash * 0.18 + (isSelected ? 0.05 : 0), 0.03, 0.34);
    const coronaOpacity = isDimmed
      ? 0
      : clamp(focusBlend * 0.08 + focusFlash * 0.2 + (isSelected ? 0.04 : 0), 0, 0.24);
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
    <group ref={clusterRef} position={article.center}>
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
          >
            {article.constellationName}
          </Text>
        </Billboard>
      )}

      {article.fragments.map(fragment => (
        <FragmentLabel
          key={fragment.id}
          fragment={fragment}
          selectedSentence={selectedSentence}
          focusArticleId={focusedArticleId}
          onHoverArticle={onHoverArticle}
          onSelectSentence={onSelectSentence}
          onPointerGestureStart={onPointerGestureStart}
        />
      ))}
    </group>
  );
}

export default function WordCloud({
  universe,
  selectedSentence,
  onSelectSentence,
  onFocusArticleChange
}) {
  const { camera, gl, scene } = useThree();
  const [focusedArticleId, setFocusedArticleId] = useState(null);
  const speedRef = useRef(CRUISE_SPEED);
  const rotationVelocityRef = useRef(new THREE.Vector2());
  const targetQuaternionRef = useRef(new THREE.Quaternion());
  const yawAxisRef = useRef(new THREE.Vector3());
  const pitchAxisRef = useRef(new THREE.Vector3());
  const yawStepRef = useRef(new THREE.Quaternion());
  const pitchStepRef = useRef(new THREE.Quaternion());
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const pinchDistanceRef = useRef(null);
  const focusTickRef = useRef(0);
  const clusterRefs = useRef(new Map());

  const syncRotationAnchor = () => {
    targetQuaternionRef.current.copy(camera.quaternion).normalize();
    rotationVelocityRef.current.set(0, 0);
  };

  const applyRotationDelta = (deltaYaw, deltaPitch) => {
    const targetQuaternion = targetQuaternionRef.current;

    yawAxisRef.current.set(0, 1, 0).applyQuaternion(targetQuaternion).normalize();
    yawStepRef.current.setFromAxisAngle(yawAxisRef.current, deltaYaw);
    targetQuaternion.premultiply(yawStepRef.current).normalize();

    pitchAxisRef.current.set(1, 0, 0).applyQuaternion(targetQuaternion).normalize();
    pitchStepRef.current.setFromAxisAngle(pitchAxisRef.current, deltaPitch);
    targetQuaternion.premultiply(pitchStepRef.current).normalize();
  };

  const beginGesture = (clientX, clientY) => {
    if (selectedSentence) return;

    syncRotationAnchor();
    draggingRef.current = true;
    lastPointerRef.current = { x: clientX, y: clientY };
  };

  useEffect(() => {
    camera.position.set(0, 12, 920);
    camera.lookAt(0, 0, 0);
    targetQuaternionRef.current.copy(camera.quaternion).normalize();
  }, [camera]);

  useEffect(() => {
    if (selectedSentence) return;

    setFocusedArticleId(null);
  }, [selectedSentence]);

  useEffect(() => {
    if (!selectedSentence) return;

    setFocusedArticleId(selectedSentence.articleId);
    onFocusArticleChange(universe.articleById[selectedSentence.articleId] || null);
  }, [onFocusArticleChange, selectedSentence, universe]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.touchAction = 'none';

    const handleWheel = (event) => {
      if (selectedSentence) return;

      event.preventDefault();
      speedRef.current = clamp(speedRef.current - event.deltaY * 0.085, -40, MAX_SPEED);
    };

    const handlePointerDown = (event) => {
      if (selectedSentence || event.target !== canvas) return;

      beginGesture(event.clientX, event.clientY);
    };

    const handlePointerMove = (event) => {
      if (!draggingRef.current || selectedSentence) return;

      const dx = event.clientX - lastPointerRef.current.x;
      const dy = event.clientY - lastPointerRef.current.y;

      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      rotationVelocityRef.current.x += dx * 0.00024;
      rotationVelocityRef.current.y += dy * 0.00018;
    };

    const handlePointerUp = () => {
      draggingRef.current = false;
    };

    const handleTouchStart = (event) => {
      if (selectedSentence || event.target !== canvas) return;

      if (event.touches.length === 1) {
        beginGesture(event.touches[0].clientX, event.touches[0].clientY);
      }

      if (event.touches.length === 2) {
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        pinchDistanceRef.current = Math.hypot(dx, dy);
      }
    };

    const handleTouchMove = (event) => {
      if (selectedSentence || event.target !== canvas) return;

      if (event.touches.length === 1 && draggingRef.current) {
        event.preventDefault();

        const dx = event.touches[0].clientX - lastPointerRef.current.x;
        const dy = event.touches[0].clientY - lastPointerRef.current.y;

        lastPointerRef.current = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        };

        rotationVelocityRef.current.x += dx * 0.00028;
        rotationVelocityRef.current.y += dy * 0.0002;
      }

      if (event.touches.length === 2 && pinchDistanceRef.current !== null) {
        event.preventDefault();

        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const nextDistance = Math.hypot(dx, dy);
        const delta = nextDistance - pinchDistanceRef.current;

        pinchDistanceRef.current = nextDistance;
        speedRef.current = clamp(speedRef.current + delta * 0.34, -40, MAX_SPEED);
      }
    };

    const handleTouchEnd = () => {
      draggingRef.current = false;
      pinchDistanceRef.current = null;
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [gl, selectedSentence]);

  useFrame((state, delta) => {
    if (!scene.fog) {
      scene.fog = new THREE.FogExp2('#02040a', 0.00078);
    }

    if (!scene.background) {
      scene.background = new THREE.Color('#02040a');
    }

    if (rotationVelocityRef.current.lengthSq() > 1e-8) {
      applyRotationDelta(rotationVelocityRef.current.x, rotationVelocityRef.current.y);
      rotationVelocityRef.current.multiplyScalar(0.92);
    } else {
      rotationVelocityRef.current.set(0, 0);
    }

    camera.quaternion.slerp(targetQuaternionRef.current, 1 - Math.exp(-delta * 4.5));

    if (selectedSentence) {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, delta * 3.4);
    } else {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, CRUISE_SPEED, delta * 0.65);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      camera.position.add(forward.multiplyScalar(speedRef.current * delta));
    }

    focusTickRef.current += delta;

    if (focusTickRef.current > 0.14) {
      focusTickRef.current = 0;

      const focusArticle = selectedSentence
        ? universe.articleById[selectedSentence.articleId]
        : findFocusArticle(camera, clusterRefs.current);

      if ((focusArticle?.articleId || null) !== focusedArticleId) {
        setFocusedArticleId(focusArticle?.articleId || null);
        onFocusArticleChange(focusArticle || null);
      }
    }
  });

  return (
    <group>
      <Starfield />

      {universe.articles.map(article => (
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
          registerCluster={(articleId, ref, clusterArticle) => {
            clusterRefs.current.set(articleId, { ref, article: clusterArticle });
          }}
          unregisterCluster={(articleId) => {
            clusterRefs.current.delete(articleId);
          }}
        />
      ))}
    </group>
  );
}
