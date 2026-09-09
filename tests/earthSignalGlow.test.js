import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PerspectiveCamera, Vector3 } from "three";
import {
  seoulSurfacePoint,
  seoulGlowStrength,
  seoulFocusBlend,
  seoulGlowEnvelope,
  seoulGlowShader,
} from "../src/utils/earthSignalGlow.js";
import {
  geographicSurfacePoint,
  EARTH_FOCUS,
  earthOrientation,
} from "../src/utils/earthOrientation.js";
import {
  signalFlightPose,
  earthFocusFov,
  EARTH_FOCUS_ALTITUDE,
} from "../src/utils/secretSignal.js";
import { EARTH_RADIUS, earthPosition } from "../src/utils/observatory.js";

test("Seoul light is absent on the normal route and increases continuously without a timed pulse", () => {
  for (const strength of [-1, 0, 0.01, 0.035])
    assert.equal(seoulGlowStrength(strength), 0);
  assert.equal(seoulGlowStrength(1), 1);
  let previous = 0;
  for (let i = 0; i <= 1000; i++) {
    const next = seoulGlowStrength(i / 1000);
    assert.ok(next >= previous && next - previous < 0.002);
    previous = next;
  }
  assert.equal(seoulFocusBlend(0.24), 0);
  assert.equal(seoulFocusBlend(0.9), 1);
  assert.ok(seoulGlowStrength(0.6) > seoulGlowStrength(0.3) * 2);
});

test("the regional light is centered on Seoul and cannot wrap onto Japan or the opposite hemisphere", () => {
  const seoul = seoulSurfacePoint();
  assert.deepEqual(seoulGlowEnvelope(seoul.dot(seoul)), { core: 1, region: 1 });
  const busan = seoulGlowEnvelope(
    seoul.dot(geographicSurfacePoint(35.18, 129.08)),
  );
  assert.ok(busan.region > 0.02 && busan.region < 0.5);
  assert.ok(busan.core < 0.00001);
  for (const [lat, lon] of [
    [35.68, 139.69],
    [39.9, 116.4],
    [-37.5665, -53.022],
  ]) {
    const light = seoulGlowEnvelope(
      seoul.dot(geographicSurfacePoint(lat, lon)),
    );
    assert.ok(light.region < 0.00001 && light.core < 0.00001);
  }
  assert.doesNotMatch(seoulGlowShader, /vUv|texture2D|sin\(|time/);
});

test("the focus moves from Korea into Seoul on the same swaying geographic frame, safely outside Earth", () => {
  const axis = new Vector3(0, 1, 0);
  const korea = geographicSurfacePoint(
    EARTH_FOCUS.latitude,
    EARTH_FOCUS.longitude,
  );
  for (const compact of [false, true])
    for (const sway of [-0.045, 0, 0.045]) {
      const orientation = earthOrientation(compact);
      const earth = new Vector3(...earthPosition(compact));
      let previousError = Infinity;
      for (const strength of [0.24, 0.4, 0.6, 0.8, 0.9, 1]) {
        const normal = korea
          .clone()
          .lerp(seoulSurfacePoint(), seoulFocusBlend(strength))
          .normalize()
          .applyAxisAngle(axis, sway)
          .applyQuaternion(orientation);
        const seoul = seoulSurfacePoint()
          .applyAxisAngle(axis, sway)
          .applyQuaternion(orientation)
          .multiplyScalar(EARTH_RADIUS)
          .add(earth);
        const pose = signalFlightPose(1, strength, compact, normal.toArray());
        const targetError = new Vector3(...pose.target).distanceTo(seoul);
        assert.ok(targetError <= previousError + 1e-10);
        previousError = targetError;
        const camera = new PerspectiveCamera(
          earthFocusFov(strength, compact),
          compact ? 390 / 844 : 1440 / 900,
          0.1,
          650,
        );
        camera.position.set(...pose.position);
        camera.lookAt(...pose.target);
        camera.updateMatrixWorld();
        const screen = seoul.clone().project(camera);
        assert.ok(Math.abs(screen.x) < 0.15 && Math.abs(screen.y) < 0.15);
        assert.ok(
          camera.position.distanceTo(earth) >=
            EARTH_RADIUS + EARTH_FOCUS_ALTITUDE - 1e-10,
        );
        if (strength >= 0.9) assert.ok(Math.hypot(screen.x, screen.y) < 1e-9);
      }
    }
});

test("the light is added inside the existing surface material with no marker or new texture", () => {
  const source = readFileSync(
    new URL("../src/components/CelestialBodies.jsx", import.meta.url),
    "utf8",
  );
  assert.equal((source.match(/name="earth-surface"/g) || []).length, 1);
  assert.match(source, /vLocalNormal = normal/);
  assert.match(source, /color \+= seoulLight\(\)/);
  assert.match(source, /signalGlow.value = seoulGlowStrength\(signal\)/);
  assert.match(source, /\.lerp\(seoul, seoulFocusBlend\(signal\)\)/);
  assert.match(source, /seoulDirection: \{ value: seoul \}/);
  assert.doesNotMatch(seoulGlowShader, /sampler2D|gl_FragColor/);
});
