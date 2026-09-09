import test from "node:test";
import assert from "node:assert/strict";
import { SphereGeometry, Vector3, PerspectiveCamera } from "three";
import {
  EARTH_FOCUS,
  geographicSurfacePoint,
  earthOrientation,
  earthSway,
  koreaWorldNormal,
} from "../src/utils/earthOrientation.js";
import {
  earthPosition,
  flightPose,
  EARTH_RADIUS,
} from "../src/utils/observatory.js";
import {
  signalFlightPose,
  earthFocusFov,
  EARTH_FOCUS_ALTITUDE,
} from "../src/utils/secretSignal.js";

// Sample actual SphereGeometry vertices at the map's latitude/longitude UVs
// so the test also guards against mirrored longitude or a half-turn offset.
const sphere = new SphereGeometry(1, 360, 180);
const mapPoint = (latitude, longitude) =>
  new Vector3().fromBufferAttribute(
    sphere.attributes.position,
    (90 - latitude) * 361 + longitude + 180,
  );
const korea = mapPoint(36, 128);
const northOfKorea = mapPoint(45, 128);
sphere.dispose();

test("Korea faces the opening camera, with north upright, in both layouts", () => {
  for (const compact of [false, true]) {
    const orientation = earthOrientation(compact);
    const facing = new Vector3(...flightPose(0, compact).position)
      .sub(new Vector3(...earthPosition(compact)))
      .normalize();
    const center = korea.clone().applyQuaternion(orientation).normalize();
    const north = northOfKorea.clone().applyQuaternion(orientation);
    assert.ok(center.dot(facing) > 0.999999);
    assert.ok(north.y > center.y);
  }
});

test("Korea stays near the visible center and in daylight throughout the flight and sway", () => {
  const sun = new Vector3(-0.95, 0.45, 0.45).normalize();
  const axis = new Vector3(0, 1, 0);
  for (const compact of [false, true]) {
    const orientation = earthOrientation(compact);
    for (let step = 0; step <= 10; step++) {
      const facing = new Vector3(...flightPose(step / 10, compact).position)
        .sub(new Vector3(...earthPosition(compact)))
        .normalize();
      for (const phase of [0, Math.PI / 2, (Math.PI * 3) / 2]) {
        const center = korea
          .clone()
          .applyAxisAngle(axis, earthSway(phase / 0.12))
          .applyQuaternion(orientation)
          .normalize();
        assert.ok(center.dot(facing) > 0.97);
        assert.ok(center.dot(sun) > 0.26);
      }
    }
  }
});

test("Earth begins centered and never accumulates a full rotation", () => {
  assert.equal(earthSway(0), 0);
  for (let elapsed = 0; elapsed <= 86400; elapsed += 17)
    assert.ok(Math.abs(earthSway(elapsed)) <= 0.045);
});

test("the real SphereGeometry maps each geographic anchor once without a mirror or half-turn", () => {
  const geometry = new SphereGeometry(1, 360, 180);
  for (const [latitude, longitude] of [
    [36, 128],
    [36, 139],
    [36, 110],
    [0, 0],
    [0, -180],
    [0, 180],
    [-25, 134],
    [60, 105],
  ]) {
    const index = (90 - latitude) * 361 + longitude + 180;
    const point = new Vector3().fromBufferAttribute(
      geometry.attributes.position,
      index,
    );
    assert.ok(
      point.distanceTo(geographicSurfacePoint(latitude, longitude)) < 1e-6,
    );
    assert.ok(
      Math.abs(geometry.attributes.uv.getX(index) - (longitude + 180) / 360) <
        1e-6,
    );
    assert.ok(
      Math.abs(geometry.attributes.uv.getY(index) - (latitude + 90) / 180) <
        1e-6,
    );
  }
  geometry.dispose();
  assert.deepEqual(EARTH_FOCUS, { latitude: 36, longitude: 128 });
});

test("Japan stays east/right and China west/left of the Korean center in both layouts", () => {
  for (const compact of [false, true]) {
    const facing = new Vector3(...flightPose(0, compact).position)
      .sub(new Vector3(...earthPosition(compact)))
      .normalize();
    const right = new Vector3(0, 1, 0).cross(facing).normalize();
    const orientation = earthOrientation(compact);
    const japan = geographicSurfacePoint(36, 139).applyQuaternion(orientation);
    const china = geographicSurfacePoint(36, 110).applyQuaternion(orientation);
    assert.ok(japan.dot(right) > 0);
    assert.ok(china.dot(right) < 0);
  }
});

test("Earth focus tracks the actual Korean surface through sway on desktop and mobile", () => {
  for (const compact of [false, true]) {
    const earth = new Vector3(...earthPosition(compact));
    for (const sway of [-0.045, 0, 0.045]) {
      const normal = koreaWorldNormal(compact, sway);
      const mapped = korea
        .clone()
        .applyAxisAngle(new Vector3(0, 1, 0), sway)
        .applyQuaternion(earthOrientation(compact));
      assert.ok(normal.distanceTo(mapped) < 1e-7);
      const surface = normal.clone().multiplyScalar(EARTH_RADIUS).add(earth);
      for (const strength of [0.24, 0.5, 0.8, 1]) {
        const pose = signalFlightPose(1, strength, compact, normal.toArray());
        assert.ok(new Vector3(...pose.target).distanceTo(surface) < 1e-10);
        const camera = new PerspectiveCamera(
          earthFocusFov(strength, compact),
          compact ? 390 / 844 : 1440 / 900,
          0.1,
          650,
        );
        camera.position.set(...pose.position);
        camera.lookAt(...pose.target);
        camera.updateMatrixWorld();
        const screen = surface.clone().project(camera);
        assert.ok(Math.abs(screen.x) < 1e-9 && Math.abs(screen.y) < 1e-9);
        assert.ok(screen.z > -1 && screen.z < 1);
        assert.ok(
          camera.position.distanceTo(earth) >=
            EARTH_RADIUS + EARTH_FOCUS_ALTITUDE - 1e-10,
        );
      }
    }
  }
});
