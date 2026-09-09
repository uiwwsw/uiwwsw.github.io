import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";
import { earthPosition, flightPose } from "./observatory.js";

export const EARTH_FOCUS = { latitude: 36, longitude: 128 };

export function geographicSurfacePoint(latitude, longitude) {
  const lat = MathUtils.degToRad(latitude);
  const lon = MathUtils.degToRad(longitude);
  return new Vector3(
    Math.cos(lat) * Math.cos(lon),
    Math.sin(lat),
    -Math.cos(lat) * Math.sin(lon),
  );
}

export function earthOrientation(compact) {
  // One global equirectangular map: Greenwich is +X, east runs toward -Z.
  // Rotate the geographic frame once, never the terrain's texture coordinates.
  const korea = geographicSurfacePoint(
    EARTH_FOCUS.latitude,
    EARTH_FOCUS.longitude,
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
