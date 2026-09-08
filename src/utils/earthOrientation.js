import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { earthPosition, flightPose } from "./observatory.js";

export function earthOrientation(compact) {
  // Approximate South Korean center, matched to the equirectangular map and
  // Three.js SphereGeometry UVs (Greenwich is +X, east runs toward -Z).
  const latitude = MathUtils.degToRad(36);
  const longitude = MathUtils.degToRad(128);
  const korea = new Vector3(
    Math.cos(latitude) * Math.cos(longitude),
    Math.sin(latitude),
    -Math.cos(latitude) * Math.sin(longitude),
  );
  const north = new Vector3(0, 1, 0);
  const localFrame = new Matrix4().lookAt(korea, new Vector3(), north);
  const viewFrame = new Matrix4().lookAt(
    new Vector3(...flightPose(0, compact).position),
    new Vector3(...earthPosition(compact)),
    north,
  );

  // Face the opening camera while keeping geographic north upright. Both
  // layouts retain this orientation as the camera travels toward Earth.
  return new Quaternion().setFromRotationMatrix(
    viewFrame.multiply(localFrame.transpose()),
  );
}

export function earthSway(elapsed) {
  // A gentle +/- 2.6 degree drift, never a full spin that hides Korea.
  return Math.sin(elapsed * 0.12) * 0.045;
}
