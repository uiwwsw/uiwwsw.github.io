import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp, CRUISE_SPEED, findFocusArticle, MAX_SPEED } from './shared';

export default function useWordCloudController({
  camera,
  gl,
  scene,
  universe,
  selectedSentence,
  onFocusArticleChange,
  visibleArticleIdSet,
  flightTargetArticleId,
  onFlightComplete
}) {
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
  const flightTargetRef = useRef(null);
  const flightTargetWorldRef = useRef(new THREE.Vector3());
  const flightDirectionRef = useRef(new THREE.Vector3());
  const cameraForwardRef = useRef(new THREE.Vector3());
  const lookMatrixRef = useRef(new THREE.Matrix4());
  const desiredQuaternionRef = useRef(new THREE.Quaternion());

  const syncRotationAnchor = useCallback(() => {
    targetQuaternionRef.current.copy(camera.quaternion).normalize();
    rotationVelocityRef.current.set(0, 0);
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

    const selectedArticle = universe.articleById[selectedSentence.articleId] || null;
    setFocusedArticleId(selectedArticle?.articleId || null);
    onFocusArticleChange(selectedArticle);
  }, [onFocusArticleChange, selectedSentence, universe]);

  useEffect(() => {
    if (
      selectedSentence
      || focusedArticleId == null
      || !visibleArticleIdSet
      || visibleArticleIdSet.has(focusedArticleId)
    ) {
      return;
    }

    setFocusedArticleId(null);
    onFocusArticleChange(null);
  }, [focusedArticleId, onFocusArticleChange, selectedSentence, visibleArticleIdSet]);

  useEffect(() => {
    if (selectedSentence) {
      flightTargetRef.current = null;
      return;
    }

    if (flightTargetArticleId == null) {
      flightTargetRef.current = null;
      return;
    }

    if (visibleArticleIdSet && !visibleArticleIdSet.has(flightTargetArticleId)) {
      flightTargetRef.current = null;
      onFlightComplete(flightTargetArticleId);
      return;
    }

    flightTargetRef.current = flightTargetArticleId;
    syncRotationAnchor();
    draggingRef.current = false;
    pinchDistanceRef.current = null;
    speedRef.current = Math.max(speedRef.current, 14);

    const targetArticle = universe.articleById[flightTargetArticleId] || null;
    setFocusedArticleId(flightTargetArticleId);
    onFocusArticleChange(targetArticle);
  }, [
    flightTargetArticleId,
    onFlightComplete,
    onFocusArticleChange,
    selectedSentence,
    syncRotationAnchor,
    universe,
    visibleArticleIdSet
  ]);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.style.touchAction = 'none';

    const handleWheel = (event) => {
      if (selectedSentence || flightTargetRef.current != null) return;

      event.preventDefault();
      speedRef.current = clamp(speedRef.current - event.deltaY * 0.085, -40, MAX_SPEED);
    };

    const handlePointerDown = (event) => {
      if (selectedSentence || event.target !== canvas || flightTargetRef.current != null) return;

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
      if (selectedSentence || event.target !== canvas || flightTargetRef.current != null) return;

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
  }, [beginGesture, gl, selectedSentence]);

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

        if (distanceToTarget <= 52) {
          flightTargetRef.current = null;
          speedRef.current = 0;
          setFocusedArticleId(activeFlightTargetId);
          onFocusArticleChange(targetEntry.article || null);
          onFlightComplete(activeFlightTargetId);
        } else if (distanceToTarget > 0.0001) {
          flightDirectionRef.current.normalize();
          lookMatrixRef.current.lookAt(camera.position, flightTargetWorldRef.current, camera.up);
          desiredQuaternionRef.current.setFromRotationMatrix(lookMatrixRef.current);
          targetQuaternionRef.current.slerp(
            desiredQuaternionRef.current,
            1 - Math.exp(-delta * 2.8)
          );

          cameraForwardRef.current.set(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
          const alignment = cameraForwardRef.current.dot(flightDirectionRef.current);
          let nextSpeed = 0;

          if (alignment > 0.92) {
            nextSpeed = clamp(distanceToTarget * 0.42, 42, MAX_SPEED * 0.96);
          } else if (alignment > 0.62) {
            nextSpeed = clamp(distanceToTarget * 0.18, 18, MAX_SPEED * 0.58);
          } else if (alignment > 0.25) {
            nextSpeed = clamp(distanceToTarget * 0.08, 8, 34);
          }

          speedRef.current = THREE.MathUtils.lerp(speedRef.current, nextSpeed, delta * 3.1);
        }
      }
    }

    camera.quaternion.slerp(targetQuaternionRef.current, 1 - Math.exp(-delta * 4.5));

    if (selectedSentence) {
      speedRef.current = THREE.MathUtils.lerp(speedRef.current, 0, delta * 3.4);
    } else if (activeFlightTargetId != null) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
      camera.position.add(forward.multiplyScalar(speedRef.current * delta));
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
    focusedArticleId,
    setFocusedArticleId,
    beginGesture,
    registerCluster,
    unregisterCluster
  };
}
