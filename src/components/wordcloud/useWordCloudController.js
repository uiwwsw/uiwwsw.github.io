import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  clamp,
  createRng,
  CRUISE_SPEED,
  findFocusArticle,
  hashString,
  MAX_SPEED
} from './shared';

const INITIAL_DISCOVERY_COUNT = 5;
const MIN_LOCAL_DISCOVERY_COUNT = 5;
const MIN_FORWARD_VISIBLE_COUNT = 4;
const DISCOVERY_CHECK_INTERVAL = 0.45;
const DISCOVERY_TURN_TRIGGER_DOT = 0.58;
const DISCOVERY_TRAVEL_TRIGGER_DISTANCE = 280;
const LOCAL_DISCOVERY_RADIUS = 1180;
const INITIAL_DISTANCE_MIN = 280;
const INITIAL_DISTANCE_MAX = 900;
const FRONTIER_DISTANCE_MIN = 520;
const FRONTIER_DISTANCE_MAX = 1200;
const ARTICLE_NEIGHBOR_COUNT = 2;
const MEMORY_RETENTION_SECONDS = 10;
const MEMORY_RADIUS_MIN = 820;
const MEMORY_RADIUS_MAX = 1860;
const FRUSTUM_HORIZONTAL_MARGIN = 0.9;
const FRUSTUM_VERTICAL_MARGIN = 0.86;
const HIDDEN_SPAWN_DISTANCE_RATIO = 0.8;
const HIDDEN_SPAWN_LATERAL_RATIO = 0.52;
const HIDDEN_SPAWN_VERTICAL_RATIO = 0.38;
const FORWARD_BUFFER_VIEWPORT_MARGIN = 1.48;

function getArticleClearance(article) {
  return Math.max(150, article.clusterSize * 2.35);
}

export default function useWordCloudController({
  camera,
  gl,
  scene,
  universe,
  selectedSentence,
  onFocusArticleChange,
  flightTargetArticleId,
  onFlightComplete,
  performanceProfile
}) {
  const isMobile = performanceProfile?.isMobile === true;
  const initialDiscoveryCount = isMobile ? 3 : INITIAL_DISCOVERY_COUNT;
  const minLocalDiscoveryCount = isMobile ? 3 : MIN_LOCAL_DISCOVERY_COUNT;
  const minForwardVisibleCount = isMobile ? 2 : MIN_FORWARD_VISIBLE_COUNT;
  const localDiscoveryRadius = isMobile ? 920 : LOCAL_DISCOVERY_RADIUS;
  const [focusedArticleId, setFocusedArticleId] = useState(null);
  const [discoveryVersion, setDiscoveryVersion] = useState(0);
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
  const pinchCenterRef = useRef(null);
  const activePointersRef = useRef(new Map());
  const focusTickRef = useRef(0);
  const discoveryTickRef = useRef(0);
  const lastDiscoveryAnchorRef = useRef(new THREE.Vector3());
  const lastDiscoveryForwardRef = useRef(new THREE.Vector3(0, 0, -1));
  const clusterRefs = useRef(new Map());
  const flightTargetRef = useRef(null);
  const flightTargetWorldRef = useRef(new THREE.Vector3());
  const flightDirectionRef = useRef(new THREE.Vector3());
  const cameraForwardRef = useRef(new THREE.Vector3());
  const lookMatrixRef = useRef(new THREE.Matrix4());
  const desiredQuaternionRef = useRef(new THREE.Quaternion());
  const cameraRightRef = useRef(new THREE.Vector3());
  const cameraUpRef = useRef(new THREE.Vector3());
  const articlePositionMapRef = useRef(new Map());
  const availableArticleIdsRef = useRef(new Set());
  const discoveredArticleIdsRef = useRef(new Set());
  const discoveredOrderRef = useRef([]);
  const positionSampleRef = useRef(new THREE.Vector3());
  const positionDirectionRef = useRef(new THREE.Vector3());
  const projectedPositionRef = useRef(new THREE.Vector3());

  const eligibleArticles = useMemo(() => {
    return universe.articles;
  }, [universe.articles]);

  const eligibleArticleIdSet = useMemo(() => {
    return new Set(eligibleArticles.map(article => article.articleId));
  }, [eligibleArticles]);

  const syncRotationAnchor = useCallback(() => {
    targetQuaternionRef.current.copy(camera.quaternion).normalize();
    rotationVelocityRef.current.set(0, 0);
  }, [camera]);

  const refreshCameraBasis = useCallback(() => {
    cameraForwardRef.current.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
    cameraRightRef.current.set(1, 0, 0).applyQuaternion(camera.quaternion).normalize();
    cameraUpRef.current.set(0, 1, 0).applyQuaternion(camera.quaternion).normalize();
  }, [camera]);

  const getMemoryRadius = useCallback(() => {
    const effectiveSpeed = Math.max(Math.abs(speedRef.current), CRUISE_SPEED * 2.8);
    return clamp(
      effectiveSpeed * MEMORY_RETENTION_SECONDS,
      MEMORY_RADIUS_MIN,
      MEMORY_RADIUS_MAX
    );
  }, []);

  const applyRotationDelta = useCallback((deltaYaw, deltaPitch) => {
    const targetQuaternion = targetQuaternionRef.current;

    yawAxisRef.current.set(0, 1, 0).applyQuaternion(targetQuaternion).normalize();
    yawStepRef.current.setFromAxisAngle(yawAxisRef.current, deltaYaw);
    targetQuaternion.premultiply(yawStepRef.current).normalize();

    pitchAxisRef.current.set(1, 0, 0).applyQuaternion(targetQuaternion).normalize();
    pitchStepRef.current.setFromAxisAngle(pitchAxisRef.current, deltaPitch);
    targetQuaternion.premultiply(pitchStepRef.current).normalize();
  }, []);

  const beginGesture = useCallback((clientX, clientY) => {
    if (selectedSentence) return;

    syncRotationAnchor();
    draggingRef.current = true;
    lastPointerRef.current = { x: clientX, y: clientY };
  }, [selectedSentence, syncRotationAnchor]);

  const endGesture = useCallback(() => {
    draggingRef.current = false;
    pinchDistanceRef.current = null;
    pinchCenterRef.current = null;
  }, []);

  const applyDragDelta = useCallback((dx, dy, sensitivityX = 0.00024, sensitivityY = 0.00018) => {
    rotationVelocityRef.current.x += dx * sensitivityX;
    rotationVelocityRef.current.y += dy * sensitivityY;
  }, []);

  const applyZoomDelta = useCallback((delta) => {
    speedRef.current = clamp(speedRef.current + delta, -40, MAX_SPEED);
  }, []);

  const registerCluster = useCallback((articleId, ref, article) => {
    clusterRefs.current.set(articleId, { ref, article });
  }, []);

  const unregisterCluster = useCallback((articleId) => {
    clusterRefs.current.delete(articleId);
  }, []);

  const hasAvailableEligibleArticles = useCallback(() => {
    return availableArticleIdsRef.current.size > 0 && eligibleArticles.length > 0;
  }, [eligibleArticles.length]);

  const pickAvailableArticle = useCallback((excludedIds = new Set()) => {
    const candidates = eligibleArticles.filter(article => {
      return availableArticleIdsRef.current.has(article.articleId) && !excludedIds.has(article.articleId);
    });

    if (candidates.length === 0) {
      return null;
    }

    return candidates[Math.floor(Math.random() * candidates.length)];
  }, [eligibleArticles]);

  const isPositionClear = useCallback((article, position, ignoreArticleId = null) => {
    const requiredClearance = getArticleClearance(article);

    for (const articleId of discoveredOrderRef.current) {
      if (ignoreArticleId != null && articleId === ignoreArticleId) {
        continue;
      }

      const existingPosition = articlePositionMapRef.current.get(articleId);
      const existingArticle = universe.articleById[articleId];

      if (!existingPosition || !existingArticle) {
        continue;
      }

      const targetClearance = Math.max(requiredClearance, getArticleClearance(existingArticle) * 0.86);

      if (existingPosition.distanceTo(position) < targetClearance) {
        return false;
      }
    }

    return true;
  }, [universe]);

  const findOpenPosition = useCallback((article, {
    anchorPosition = camera.position,
    distanceMin = INITIAL_DISTANCE_MIN,
    distanceMax = INITIAL_DISTANCE_MAX,
    lateralScale = 0.52,
    verticalScale = 0.24,
    attemptSalt = '',
    preferCenter = false,
    visibilityMode = 'visible'
  } = {}) => {
    const seedBase = hashString(`${article.articleId}:${attemptSalt}:${discoveredOrderRef.current.length}`);
    const memoryRadius = getMemoryRadius();
    const resolvedDistanceMax = Math.min(distanceMax, Math.max(distanceMin, memoryRadius * 0.9));
    const hiddenDistanceMin = Math.min(
      resolvedDistanceMax,
      Math.max(distanceMin, memoryRadius * HIDDEN_SPAWN_DISTANCE_RATIO)
    );
    const resolvedDistanceMin = visibilityMode === 'hidden'
      ? hiddenDistanceMin
      : Math.min(distanceMin, resolvedDistanceMax);
    const verticalFov = THREE.MathUtils.degToRad(camera.fov || 50);
    const aspect = Math.max(camera.aspect || 1, 0.85);
    refreshCameraBasis();

    for (let attempt = 0; attempt < 28; attempt += 1) {
      const rng = createRng(seedBase + attempt * 17);
      const centeredAttempt = preferCenter && attempt === 0;
      const distance = centeredAttempt
        ? THREE.MathUtils.lerp(resolvedDistanceMin, resolvedDistanceMax, 0.38)
        : THREE.MathUtils.lerp(resolvedDistanceMin, resolvedDistanceMax, rng());
      const visibleHalfHeight = Math.tan(verticalFov / 2) * distance * FRUSTUM_VERTICAL_MARGIN;
      const visibleHalfWidth = visibleHalfHeight * aspect * FRUSTUM_HORIZONTAL_MARGIN;
      const lateralRange = centeredAttempt ? 0 : visibleHalfWidth * clamp(lateralScale, 0, 1);
      const verticalRange = centeredAttempt ? 0 : visibleHalfHeight * clamp(verticalScale, 0, 1);

      positionSampleRef.current.copy(anchorPosition);
      positionSampleRef.current.addScaledVector(cameraForwardRef.current, distance);

      if (!centeredAttempt && visibilityMode === 'hidden') {
        positionSampleRef.current.addScaledVector(
          cameraRightRef.current,
          (rng() - 0.5) * visibleHalfWidth * HIDDEN_SPAWN_LATERAL_RATIO * 2
        );
        positionSampleRef.current.addScaledVector(
          cameraUpRef.current,
          (rng() - 0.5) * visibleHalfHeight * HIDDEN_SPAWN_VERTICAL_RATIO * 2
        );
      } else if (!centeredAttempt) {
        positionSampleRef.current.addScaledVector(
          cameraRightRef.current,
          (rng() - 0.5) * lateralRange * 2
        );
        positionSampleRef.current.addScaledVector(
          cameraUpRef.current,
          (rng() - 0.5) * verticalRange * 2
        );
      }

      projectedPositionRef.current.copy(positionSampleRef.current).project(camera);

      if (
        projectedPositionRef.current.z < -1
        || projectedPositionRef.current.z > 1
        || projectedPositionRef.current.x < -1
        || projectedPositionRef.current.x > 1
        || projectedPositionRef.current.y < -1
        || projectedPositionRef.current.y > 1
      ) {
        continue;
      }

      if (isPositionClear(article, positionSampleRef.current)) {
        return positionSampleRef.current.clone();
      }
    }

    positionSampleRef.current.copy(anchorPosition);
    positionSampleRef.current.addScaledVector(cameraForwardRef.current, resolvedDistanceMax);
    return positionSampleRef.current.clone();
  }, [camera, camera.position, getMemoryRadius, isPositionClear, refreshCameraBasis]);

  const assignArticlePosition = useCallback((article, position) => {
    if (
      !article
      || discoveredArticleIdsRef.current.has(article.articleId)
      || !availableArticleIdsRef.current.has(article.articleId)
    ) {
      return false;
    }

    articlePositionMapRef.current.set(article.articleId, position.clone());
    discoveredArticleIdsRef.current.add(article.articleId);
    availableArticleIdsRef.current.delete(article.articleId);
    discoveredOrderRef.current.push(article.articleId);
    setDiscoveryVersion(version => version + 1);
    return true;
  }, []);

  const discoverArticle = useCallback((article, options) => {
    if (!article) {
      return false;
    }

    if (
      discoveredArticleIdsRef.current.has(article.articleId)
      || !availableArticleIdsRef.current.has(article.articleId)
    ) {
      return false;
    }

    const position = findOpenPosition(article, options);
    return assignArticlePosition(article, position);
  }, [assignArticlePosition, findOpenPosition]);

  const populateFrontier = useCallback((count, excludedIds = new Set(), options = {}) => {
    let added = 0;

    while (added < count) {
      const article = pickAvailableArticle(excludedIds);

      if (!article) {
        break;
      }

      excludedIds.add(article.articleId);

      if (discoverArticle(article, options)) {
        added += 1;
      }
    }

    return added;
  }, [discoverArticle, pickAvailableArticle]);

  const evictStaleArticles = useCallback((preservedArticleIds = new Set()) => {
    const memoryRadius = getMemoryRadius();
    const nextOrder = [];
    let removedAny = false;

    discoveredOrderRef.current.forEach((articleId) => {
      const worldPosition = articlePositionMapRef.current.get(articleId);

      if (!worldPosition) {
        discoveredArticleIdsRef.current.delete(articleId);
        availableArticleIdsRef.current.add(articleId);
        clusterRefs.current.delete(articleId);
        removedAny = true;
        return;
      }

      if (preservedArticleIds.has(articleId) || worldPosition.distanceTo(camera.position) <= memoryRadius) {
        nextOrder.push(articleId);
        return;
      }

      articlePositionMapRef.current.delete(articleId);
      discoveredArticleIdsRef.current.delete(articleId);
      availableArticleIdsRef.current.add(articleId);
      clusterRefs.current.delete(articleId);
      removedAny = true;
    });

    if (removedAny) {
      discoveredOrderRef.current = nextOrder;
      setDiscoveryVersion(version => version + 1);
    }
  }, [camera.position, getMemoryRadius]);

  const countNearbyEligibleArticles = useCallback((radius = localDiscoveryRadius) => {
    let nearbyCount = 0;

    discoveredOrderRef.current.forEach((articleId) => {
      if (!eligibleArticleIdSet.has(articleId)) {
        return;
      }

      const worldPosition = articlePositionMapRef.current.get(articleId);

      if (!worldPosition) {
        return;
      }

      const distance = worldPosition.distanceTo(camera.position);

      if (distance >= 60 && distance <= radius) {
        nearbyCount += 1;
      }
    });

    return nearbyCount;
  }, [camera.position, eligibleArticleIdSet, localDiscoveryRadius]);

  const seedInitialNeighborhood = useCallback(() => {
    if (eligibleArticles.length === 0 || discoveredOrderRef.current.length > 0) {
      return;
    }

    populateFrontier(Math.min(1, eligibleArticles.length), new Set(), {
      distanceMin: 320,
      distanceMax: 520,
      lateralScale: 0.05,
      verticalScale: 0.04,
      attemptSalt: 'initial-core',
      preferCenter: true
    });

    const ringCount = Math.min(initialDiscoveryCount - 1, Math.max(0, eligibleArticles.length - 1));

    if (ringCount > 0) {
      populateFrontier(ringCount, new Set(), {
        distanceMin: 460,
        distanceMax: 860,
        lateralScale: 0.34,
        verticalScale: 0.2,
        attemptSalt: 'initial-ring'
      });
    }

    lastDiscoveryAnchorRef.current.copy(camera.position);
    refreshCameraBasis();
    lastDiscoveryForwardRef.current.copy(cameraForwardRef.current);
  }, [camera.position, eligibleArticles.length, initialDiscoveryCount, populateFrontier, refreshCameraBasis]);

  const countForwardBufferedArticles = useCallback(() => {
    refreshCameraBasis();

    let visibleCount = 0;

    discoveredOrderRef.current.forEach((articleId) => {
      if (!eligibleArticleIdSet.has(articleId)) {
        return;
      }

      const worldPosition = articlePositionMapRef.current.get(articleId);

      if (!worldPosition) {
        return;
      }

      positionDirectionRef.current.subVectors(worldPosition, camera.position);
      const distance = positionDirectionRef.current.length();

      if (distance < 60 || distance > Math.min(1850, getMemoryRadius() * 1.08)) {
        return;
      }

      const forwardness = positionDirectionRef.current.normalize().dot(cameraForwardRef.current);

      if (forwardness <= 0.2) {
        return;
      }

      projectedPositionRef.current.copy(worldPosition).project(camera);

      if (
        projectedPositionRef.current.z < -1
        || projectedPositionRef.current.z > 1
        || projectedPositionRef.current.x < -FORWARD_BUFFER_VIEWPORT_MARGIN
        || projectedPositionRef.current.x > FORWARD_BUFFER_VIEWPORT_MARGIN
        || projectedPositionRef.current.y < -FORWARD_BUFFER_VIEWPORT_MARGIN
        || projectedPositionRef.current.y > FORWARD_BUFFER_VIEWPORT_MARGIN
      ) {
        return;
      }

      visibleCount += 1;
    });

    return visibleCount;
  }, [camera, camera.position, eligibleArticleIdSet, getMemoryRadius, refreshCameraBasis]);

  const ensureArticleDiscovered = useCallback((articleId, options = {}) => {
    const article = universe.articleById[articleId];

    if (!article) {
      return false;
    }

    if (discoveredArticleIdsRef.current.has(articleId)) {
      return false;
    }

    return discoverArticle(article, options);
  }, [discoverArticle, universe]);

  const stopFlight = useCallback((targetArticleId = flightTargetRef.current) => {
    if (targetArticleId == null) {
      return null;
    }

    flightTargetRef.current = null;
    syncRotationAnchor();
    onFlightComplete(targetArticleId);
    return targetArticleId;
  }, [onFlightComplete, syncRotationAnchor]);

  useEffect(() => {
    camera.position.set(0, 12, 920);
    camera.lookAt(0, 0, 0);
    targetQuaternionRef.current.copy(camera.quaternion).normalize();
    refreshCameraBasis();
    lastDiscoveryAnchorRef.current.copy(camera.position);
    lastDiscoveryForwardRef.current.copy(cameraForwardRef.current);
  }, [camera, refreshCameraBasis]);

  useEffect(() => {
    articlePositionMapRef.current = new Map();
    availableArticleIdsRef.current = new Set(eligibleArticles.map(article => article.articleId));
    discoveredArticleIdsRef.current = new Set();
    discoveredOrderRef.current = [];
    clusterRefs.current.clear();
    flightTargetRef.current = null;
    discoveryTickRef.current = 0;
    focusTickRef.current = 0;
    refreshCameraBasis();
    lastDiscoveryAnchorRef.current.copy(camera.position);
    lastDiscoveryForwardRef.current.copy(cameraForwardRef.current);
    setFocusedArticleId(null);
    setDiscoveryVersion(version => version + 1);
    onFocusArticleChange(null);
  }, [camera, eligibleArticles, onFocusArticleChange, refreshCameraBasis, universe]);

  useEffect(() => {
    if (eligibleArticles.length === 0) {
      return;
    }

    seedInitialNeighborhood();
  }, [eligibleArticles, seedInitialNeighborhood]);

  useEffect(() => {
    if (selectedSentence) return;

    setFocusedArticleId(null);
  }, [selectedSentence]);

  useEffect(() => {
    if (!selectedSentence) return;

    const selectedArticle = universe.articleById[selectedSentence.articleId] || null;
    setFocusedArticleId(selectedArticle?.articleId || null);
    onFocusArticleChange(selectedArticle);
  }, [onFocusArticleChange, selectedSentence, universe]);

  useEffect(() => {
    if (selectedSentence) {
      flightTargetRef.current = null;
      return;
    }

    if (flightTargetArticleId == null) {
      flightTargetRef.current = null;
      return;
    }

    ensureArticleDiscovered(flightTargetArticleId, {
      distanceMin: 420,
      distanceMax: 860,
      lateralScale: 0.16,
      verticalScale: 0.12,
      attemptSalt: `target:${flightTargetArticleId}`,
      preferCenter: true,
      visibilityMode: 'visible'
    });
    populateFrontier(ARTICLE_NEIGHBOR_COUNT, new Set([flightTargetArticleId]), {
      distanceMin: 520,
      distanceMax: 940,
      lateralScale: 0.24,
      verticalScale: 0.16,
      attemptSalt: `neighbors:${flightTargetArticleId}`,
      visibilityMode: 'hidden'
    });

    flightTargetRef.current = flightTargetArticleId;
    syncRotationAnchor();
    draggingRef.current = false;
    pinchDistanceRef.current = null;
    speedRef.current = Math.max(speedRef.current, 14);

    const targetArticle = universe.articleById[flightTargetArticleId] || null;
    setFocusedArticleId(flightTargetArticleId);
    onFocusArticleChange(targetArticle);
  }, [
    ensureArticleDiscovered,
    flightTargetArticleId,
    onFocusArticleChange,
    populateFrontier,
    selectedSentence,
    stopFlight,
    syncRotationAnchor,
    universe
  ]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.touchAction = 'none';
    canvas.style.userSelect = 'none';

    const handleWheel = (event) => {
      if (selectedSentence) return;

      if (flightTargetRef.current != null) {
        stopFlight();
      }

      event.preventDefault();
      applyZoomDelta(-event.deltaY * 0.085);
    };

    const handlePointerDown = (event) => {
      if (selectedSentence || event.target !== canvas) return;

      if (flightTargetRef.current != null) {
        stopFlight();
      }

      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY
      });

      if (typeof canvas.setPointerCapture === 'function') {
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch (error) {
          // Ignore capture failures on unsupported browsers.
        }
      }

      if (activePointersRef.current.size === 2) {
        const [first, second] = [...activePointersRef.current.values()];
        pinchDistanceRef.current = Math.hypot(first.x - second.x, first.y - second.y);
        pinchCenterRef.current = {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2
        };
        draggingRef.current = false;
        return;
      }

      beginGesture(event.clientX, event.clientY);
    };

    const handlePointerMove = (event) => {
      if (selectedSentence || flightTargetRef.current != null) return;

      if (activePointersRef.current.has(event.pointerId)) {
        activePointersRef.current.set(event.pointerId, {
          x: event.clientX,
          y: event.clientY
        });
      }

      if (activePointersRef.current.size >= 2) {
        const [first, second] = [...activePointersRef.current.values()];
        const nextDistance = Math.hypot(first.x - second.x, first.y - second.y);
        const nextCenter = {
          x: (first.x + second.x) / 2,
          y: (first.y + second.y) / 2
        };

        if (pinchDistanceRef.current !== null) {
          applyZoomDelta((nextDistance - pinchDistanceRef.current) * 0.34);
        }

        if (pinchCenterRef.current) {
          applyDragDelta(
            nextCenter.x - pinchCenterRef.current.x,
            nextCenter.y - pinchCenterRef.current.y,
            0.00018,
            0.00014
          );
        }

        pinchDistanceRef.current = nextDistance;
        pinchCenterRef.current = nextCenter;
        return;
      }

      if (!draggingRef.current) return;

      const dx = event.clientX - lastPointerRef.current.x;
      const dy = event.clientY - lastPointerRef.current.y;

      lastPointerRef.current = { x: event.clientX, y: event.clientY };
      applyDragDelta(dx, dy);
    };

    const handlePointerUp = (event) => {
      activePointersRef.current.delete(event.pointerId);

      if (typeof canvas.releasePointerCapture === 'function') {
        try {
          if (canvas.hasPointerCapture?.(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
          }
        } catch (error) {
          // Ignore release failures.
        }
      }

      if (activePointersRef.current.size === 1) {
        const remainingPointer = [...activePointersRef.current.values()][0];
        pinchDistanceRef.current = null;
        pinchCenterRef.current = null;
        beginGesture(remainingPointer.x, remainingPointer.y);
        return;
      }

      endGesture();
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [applyDragDelta, applyZoomDelta, beginGesture, endGesture, gl, selectedSentence, stopFlight]);

  const renderedArticles = useMemo(() => {
    return discoveredOrderRef.current
      .map((articleId) => {
        const article = universe.articleById[articleId];
        const worldPosition = articlePositionMapRef.current.get(articleId);

        if (!article || !worldPosition) {
          return null;
        }

        return {
          article,
          worldPosition: [worldPosition.x, worldPosition.y, worldPosition.z]
        };
      })
      .filter(Boolean);
  }, [discoveryVersion, universe]);

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

    const activeFlightTargetId = !selectedSentence ? flightTargetRef.current : null;

    if (activeFlightTargetId != null) {
      const targetEntry = clusterRefs.current.get(activeFlightTargetId);

      if (targetEntry?.ref?.current) {
        targetEntry.ref.current.getWorldPosition(flightTargetWorldRef.current);
        flightDirectionRef.current.subVectors(flightTargetWorldRef.current, camera.position);

        const distanceToTarget = flightDirectionRef.current.length();
        const arrivalDistance = Math.max(148, targetEntry.article.clusterSize * 1.8);
        const remainingDistance = Math.max(0, distanceToTarget - arrivalDistance);

        if (distanceToTarget <= arrivalDistance) {
          stopFlight(activeFlightTargetId);
          speedRef.current = 0;
          setFocusedArticleId(activeFlightTargetId);
          onFocusArticleChange(targetEntry.article || null);
        } else if (distanceToTarget > 0.0001) {
          flightDirectionRef.current.normalize();
          lookMatrixRef.current.lookAt(camera.position, flightTargetWorldRef.current, camera.up);
          desiredQuaternionRef.current.setFromRotationMatrix(lookMatrixRef.current);
          targetQuaternionRef.current.slerp(
            desiredQuaternionRef.current,
            1 - Math.exp(-delta * 2.8)
          );

          refreshCameraBasis();
          const alignment = cameraForwardRef.current.dot(flightDirectionRef.current);
          let nextSpeed = 0;

          if (alignment > 0.92) {
            nextSpeed = clamp(remainingDistance * 0.26, 14, MAX_SPEED * 0.72);
          } else if (alignment > 0.62) {
            nextSpeed = clamp(remainingDistance * 0.12, 7, MAX_SPEED * 0.34);
          } else if (alignment > 0.25) {
            nextSpeed = clamp(remainingDistance * 0.05, 0, 18);
          }

          speedRef.current = THREE.MathUtils.lerp(speedRef.current, nextSpeed, delta * 3.1);
        }
      }
    }

    camera.quaternion.slerp(targetQuaternionRef.current, 1 - Math.exp(-delta * 4.5));

    if (selectedSentence) {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, delta * 3.4);
    } else if (activeFlightTargetId != null) {
      refreshCameraBasis();
      camera.position.addScaledVector(cameraForwardRef.current, speedRef.current * delta);
    } else {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, CRUISE_SPEED, delta * 0.65);
      refreshCameraBasis();
      camera.position.addScaledVector(cameraForwardRef.current, speedRef.current * delta);
    }

    if (!selectedSentence) {
      discoveryTickRef.current += delta;

      if (discoveryTickRef.current >= DISCOVERY_CHECK_INTERVAL) {
        discoveryTickRef.current = 0;
        const memoryRadius = getMemoryRadius();
        const pinnedArticleIds = new Set(
          [
            focusedArticleId,
            flightTargetRef.current,
            flightTargetArticleId,
            selectedSentence?.articleId
          ].filter(articleId => articleId != null)
        );

        evictStaleArticles(pinnedArticleIds);

        const nearbyCount = countNearbyEligibleArticles(Math.min(localDiscoveryRadius, memoryRadius));
        const distanceSinceAnchor = camera.position.distanceTo(lastDiscoveryAnchorRef.current);

        if (activeFlightTargetId == null && hasAvailableEligibleArticles()) {
          const forwardBufferedCount = countForwardBufferedArticles();
          const forwardBufferTarget = Math.min(minForwardVisibleCount, eligibleArticles.length);
          const forwardVisibilityGap = Math.max(0, forwardBufferTarget - forwardBufferedCount);
          refreshCameraBasis();
          const turnedIntoEmptySpace = (
            forwardBufferedCount === 0
            && cameraForwardRef.current.dot(lastDiscoveryForwardRef.current) < DISCOVERY_TURN_TRIGGER_DOT
          );
          const movedIntoSparseRegion = (
            nearbyCount < Math.min(minLocalDiscoveryCount, eligibleArticles.length)
            && distanceSinceAnchor >= DISCOVERY_TRAVEL_TRIGGER_DISTANCE
          );
          let additionsNeeded = 0;

          if (movedIntoSparseRegion) {
            additionsNeeded = Math.max(
              additionsNeeded,
              Math.min(2, Math.min(minLocalDiscoveryCount, eligibleArticles.length) - nearbyCount)
            );
          }

          if (forwardVisibilityGap > 0) {
            additionsNeeded = Math.max(
              additionsNeeded,
              turnedIntoEmptySpace
                ? Math.min(2, forwardVisibilityGap)
                : Math.min(1, forwardVisibilityGap)
            );
          }

          if (additionsNeeded > 0) {
            populateFrontier(additionsNeeded, new Set(), {
              distanceMin: turnedIntoEmptySpace ? 340 : movedIntoSparseRegion ? 360 : FRONTIER_DISTANCE_MIN,
              distanceMax: turnedIntoEmptySpace ? 720 : movedIntoSparseRegion ? 780 : FRONTIER_DISTANCE_MAX,
              lateralScale: turnedIntoEmptySpace ? 0.18 : movedIntoSparseRegion ? 0.24 : 0.42,
              verticalScale: turnedIntoEmptySpace ? 0.12 : movedIntoSparseRegion ? 0.16 : 0.22,
              attemptSalt: `frontier:${camera.position.x.toFixed(1)}:${camera.position.y.toFixed(1)}:${camera.position.z.toFixed(1)}`,
              preferCenter: false,
              visibilityMode: 'hidden'
            });
            lastDiscoveryAnchorRef.current.copy(camera.position);
            lastDiscoveryForwardRef.current.copy(cameraForwardRef.current);
          }
        }
      }
    }

    focusTickRef.current += delta;

    if (focusTickRef.current > 0.14) {
      focusTickRef.current = 0;

      const focusArticle = selectedSentence
        ? universe.articleById[selectedSentence.articleId]
        : activeFlightTargetId != null
          ? universe.articleById[activeFlightTargetId]
          : findFocusArticle(camera, clusterRefs.current);

      if ((focusArticle?.articleId || null) !== focusedArticleId) {
        setFocusedArticleId(focusArticle?.articleId || null);
        onFocusArticleChange(focusArticle || null);
      }
    }
  });

  return {
    renderedArticles,
    focusedArticleId,
    setFocusedArticleId,
    beginGesture,
    registerCluster,
    unregisterCluster
  };
}
