import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera } from 'three';
import { createWorldAssembly, scrubWorldAssembly } from '../src/utils/worldAssembly.js';
import { createFlightGesture, createFlightInput, elasticLook, relaxFlightLook } from '../src/utils/flightInput.js';
import { corridorStars } from '../src/utils/flightCorridor.js';
import { flightPose } from '../src/utils/observatory.js';
import { createStarProjector } from '../src/utils/starVisibility.js';

test('opening scrubs in both directions even after completion, and holds without input', () => {
  const state = createWorldAssembly();
  scrubWorldAssembly(state, .45);
  const middle = [state.earth, state.ground];
  scrubWorldAssembly(state, 1);
  assert.deepEqual([state.earth, state.ground], [0, 0]);
  scrubWorldAssembly(state, .45);
  assert.deepEqual([state.earth, state.ground], middle);
  scrubWorldAssembly(state, .45);
  assert.deepEqual([state.earth, state.ground], middle);
  scrubWorldAssembly(state, 0);
  assert.deepEqual([state.earth, state.ground], [1, 1]);
});

test('wheel up advances, down retreats; elastic look stays narrow and settles at its edge', () => {
  const input = createFlightInput();
  const gesture = createFlightGesture(input, () => ({width: 390, height: 844}));
  const forward = gesture.wheel({deltaX: 0, deltaY: -120, deltaMode: 0}).travel;
  assert.ok(forward > 0);
  assert.equal(gesture.wheel({deltaX: 0, deltaY: 120, deltaMode: 0}).travel, -forward);
  input.lookX = 52;
  input.lookY = -32;
  assert.ok(elasticLook(input.lookX, 9) < 11);
  assert.ok(elasticLook(input.lookY, 6) > -8);
  for (let i = 0; i < 120; i++) relaxFlightLook(input, 1 / 60);
  assert.ok(Math.abs(input.lookX - 9) < .001);
  assert.ok(Math.abs(input.lookY + 6) < .001);
});

test('every reading star crosses the forward view on narrow and wide screens without panning', () => {
  const project = createStarProjector();
  for (const [width, height] of [[320,568], [390,844], [1440,900], [844,390]]) {
    const compact = width <= 760;
    const stars = corridorStars(Array.from({length:96}, (_,i) => ({id:String(i)})), {origin:[0,0,0]}, compact);
    stars.forEach((star, i) => {
      const pose = flightPose(.16 + i / 95 * .82, compact);
      const camera = new PerspectiveCamera(compact ? 58 : 46, width/height, .1, 650);
      camera.position.set(...pose.position);
      camera.lookAt(...pose.target);
      camera.updateMatrixWorld();
      assert.ok(project(star, camera, width, height), `${width}: ${star.id} must be visible straight ahead`);
    });
  }
});
