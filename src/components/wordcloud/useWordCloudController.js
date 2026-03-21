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
  onFlightComplete
}) {
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

  const registerCluster = useCallback((articleId, ref, article) => {
    clusterRefs.current.set(articleId, { ref, article });
  }, []);

  const unregisterCluster = useCallback((articleId) => {
    clusterRefs.current.delete(articleId);
  }, []);

  const hasUndiscoveredEligibleArticles = useCallback(() => {
    return eligibleArticles.some(article => !discoveredArticleIdsRef.current.has(article.articleId));
  }, [eligibleArticles]);

  const pickUndiscoveredArticle = useCallback((excludedIds = new Set()) => {
    const candidates = eligibleArticles.filter(article => {
      return !discoveredArticleIdsRef.current.has(article.articleId) && !excludedIds.has(article.articleId);
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
    preferCenter = false
  } = {}) => {
    const seedBase = hashString(`${article.articleId}:${attemptSalt}:${discoveredOrderRef.current.length}`);
    refreshCameraBasis();

    for (let attempt = 0; attempt < 28; attempt += 1) {
      const rng = createRng(seedBase + attempt * 17);
      const centeredAttempt = preferCenter && attempt === 0;
      const distance = centeredAttempt
        ? THREE.MathUtils.lerp(distanceMin, distanceMax, 0.38)
        : THREE.MathUtils.lerp(distanceMin, distanceMax, rng());
      const lateralRange = centeredAttempt ? 0 : Math.min(460, distance * lateralScale);
      const verticalRange = centeredAttempt ? 0 : Math.min(240, distance * verticalScale);

      positionSampleRef.current.copy(anchorPosition);
      positionSampleRef.current.addScaledVector(cameraForwardRef.current, distance);

      if (!centeredAttempt) {
        positionSampleRef.current.addScaledVector(
          cameraRightRef.current,
          (rng() - 0.5) * lateralRange * 2
        );
        positionSampleRef.current.addScaledVector(
          cameraUpRef.current,
          (rng() - 0.5) * verticalRange * 2
        );
      }

      if (isPositionClear(article, positionSampleRef.current)) {
        return positionSampleRef.current.clone();
      }
    }

    positionSampleRef.current.copy(anchorPosition);
    positionSampleRef.current.addScaledVector(cameraForwardRef.current, distanceMax);
    return positionSampleRef.current.clone();
  }, [camera.position, isPositionClear, refreshCameraBasis]);

  const assignArticlePosition = useCallback((article, position) => {
    if (!article || discoveredArticleIdsRef.current.has(article.articleId)) {
      return false;
    }

    articlePositionMapRef.current.set(article.articleId, position.clone());
    discoveredArticleIdsRef.current.add(article.articleId);
    discoveredOrderRef.current.push(article.articleId);
    setDiscoveryVersion(version => version + 1);
    return true;
  }, []);

  const discoverArticle = useCallback((article, options) => {
    if (!article) {
      return false;
    }

    if (discoveredArticleIdsRef.current.has(article.articleId)) {
      return false;
    }

    const position = findOpenPosition(article, options);
    return assignArticlePosition(article, position);
  }, [assignArticlePosition, findOpenPosition]);

  const populateFrontier = useCallback((count, excludedIds = new Set(), options = {}) => {
    let added = 0;

    while (added < count) {
      const article = pickUndiscoveredArticle(excludedIds);

      if (!article) {
        break;
      }

      excludedIds.add(article.articleId);

      if (discoverArticle(article, options)) {
        added += 1;
      }
    }

    return added;
  }, [discoverArticle, pickUndiscoveredArticle]);

  const countNearbyEligibleArticles = useCallback((radius = LOCAL_DISCOVERY_RADIUS) => {
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
  }, [camera.position, eligibleArticleIdSet]);

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

    const ringCount = Math.min(INITIAL_DISCOVERY_COUNT - 1, Math.max(0, eligibleArticles.length - 1));

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
  }, [camera.position, eligibleArticles.length, populateFrontier, refreshCameraBasis]);

  const countForwardVisibleArticles = useCallback(() => {
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

      if (distance < 60 || distance > 1850) {
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
        || projectedPositionRef.current.x < -1.15
        || projectedPositionRef.current.x > 1.15
        || projectedPositionRef.current.y < -1.15
        || projectedPositionRef.current.y > 1.15
      ) {
        return;
      }

      visibleCount += 1;
    });

    return visibleCount;
  }, [camera, camera.position, eligibleArticleIdSet, refreshCameraBasis]);

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
  }, [camera, onFocusArticleChange, refreshCameraBasis, universe]);

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
      preferCenter: true
    });
    populateFrontier(ARTICLE_NEIGHBOR_COUNT, new Set([flightTargetArticleId]), {
      distanceMin: 520,
      distanceMax: 940,
      lateralScale: 0.24,
      verticalScale: 0.16,
      attemptSalt: `neighbors:${flightTargetArticleId}`
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

    const handleWheel = (event) => {
      if (selectedSentence) return;

      if (flightTargetRef.current != null) {
        stopFlight();
      }

      event.preventDefault();
      speedRef.current = clamp(speedRef.current - event.deltaY * 0.085, -40, MAX_SPEED);
    };

    const handlePointerDown = (event) => {
      if (selectedSentence || event.target !== canvas) return;

      if (flightTargetRef.current != null) {
        stopFlight();
      }

      beginGesture(event.clientX, event.clientY);
    };

    const handlePointerMove = (event) => {
      if (!draggingRef.current || selectedSentence || flightTargetRef.current != null) return;

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

      if (flightTargetRef.current != null) {
        stopFlight();
      }

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
      if (selectedSentence || event.target !== canvas || flightTargetRef.current != null) return;

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
  }, [beginGesture, gl, selectedSentence, stopFlight]);

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
        const nearbyCount = countNearbyEligibleArticles();
        const distanceSinceAnchor = camera.position.distanceTo(lastDiscoveryAnchorRef.current);

        if (activeFlightTargetId == null && hasUndiscoveredEligibleArticles()) {
          const forwardVisibleCount = countForwardVisibleArticles();
          refreshCameraBasis();
          const turnedIntoEmptySpace = (
            forwardVisibleCount === 0
            && cameraForwardRef.current.dot(lastDiscoveryForwardRef.current) < DISCOVERY_TURN_TRIGGER_DOT
          );
          const movedIntoSparseRegion = (
            nearbyCount < Math.min(MIN_LOCAL_DISCOVERY_COUNT, eligibleArticles.length)
            && distanceSinceAnchor >= DISCOVERY_TRAVEL_TRIGGER_DISTANCE
          );
          let additionsNeeded = 0;

          if (movedIntoSparseRegion) {
            additionsNeeded = Math.max(
              additionsNeeded,
              Math.min(2, Math.min(MIN_LOCAL_DISCOVERY_COUNT, eligibleArticles.length) - nearbyCount)
            );
          }

          if (forwardVisibleCount < Math.min(MIN_FORWARD_VISIBLE_COUNT, eligibleArticles.length)) {
            additionsNeeded = 1;
          }

          if (additionsNeeded > 0) {
            populateFrontier(additionsNeeded, new Set(), {
              distanceMin: turnedIntoEmptySpace ? 340 : movedIntoSparseRegion ? 360 : FRONTIER_DISTANCE_MIN,
              distanceMax: turnedIntoEmptySpace ? 720 : movedIntoSparseRegion ? 780 : FRONTIER_DISTANCE_MAX,
              lateralScale: turnedIntoEmptySpace ? 0.18 : movedIntoSparseRegion ? 0.24 : 0.42,
              verticalScale: turnedIntoEmptySpace ? 0.12 : movedIntoSparseRegion ? 0.16 : 0.22,
              attemptSalt: `frontier:${camera.position.x.toFixed(1)}:${camera.position.y.toFixed(1)}:${camera.position.z.toFixed(1)}`,
              preferCenter: turnedIntoEmptySpace
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
