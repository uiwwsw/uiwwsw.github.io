import test from 'node:test';
import assert from 'node:assert/strict';
import { createScrollSmoothing, stepScrollSmoothing } from '../src/utils/scrollSmoothing.js';
import { createWorldAssembly, scrubWorldAssembly } from '../src/utils/worldAssembly.js';
import { pointerStarPriority, packStarLabels } from '../src/utils/starSelection.js';

test('a wheel notch is spread over rendered frames instead of teleporting Earth', () => {
  const state = createScrollSmoothing(.5);
  const world = createWorldAssembly();
  scrubWorldAssembly(world, .5);
  const start = world.earth;
  scrubWorldAssembly(world, .662);
  const oldJump = Math.abs(world.earth - start);
  let previous = start;
  let largestFrame = 0;
  for (let i = 0; i < 60; i++) {
    scrubWorldAssembly(world, stepScrollSmoothing(state, .662, 1 / 60));
    largestFrame = Math.max(largestFrame, Math.abs(world.earth - previous));
    previous = world.earth;
  }
  assert.ok(largestFrame < oldJump * .25, `${largestFrame} vs old single-frame jump ${oldJump}`);
  assert.equal(state.value, .662);
  assert.equal(state.velocity, 0);
});

test('tracking is refresh-rate independent, promptly follows reversal, and reaches both endpoints', () => {
  const run = fps => {
    const state = createScrollSmoothing();
    for (let i = 0; i < fps / 4; i++) stepScrollSmoothing(state, .8, 1/fps);
    return state;
  };
  assert.ok(Math.abs(run(60).value - run(120).value) < 1e-9);
  const state = run(60);
  const before = state.value;
  for (let i = 0; i < 6; i++) stepScrollSmoothing(state, 0, 1/60);
  assert.ok(state.value < before * .5);
  for (const target of [0,1,0]) {
    for (let i = 0; i < 60; i++) stepScrollSmoothing(state, target, 1/60);
    assert.equal(state.value, target);
  }
  assert.equal(stepScrollSmoothing(state, .6, 1/60, true), .6);
  assert.equal(state.velocity, 0);
});

test('mouse priority follows screen proximity, including stars far from the camera', () => {
  const stars = [
    {id:'near-camera',x:100,y:300,distance:5},
    {id:'under-pointer',x:800,y:300,distance:150},
    {id:'neighbor',x:700,y:450,distance:120},
  ];
  const priority = pointerStarPriority(stars, {x:790,y:310});
  assert.equal(priority[0], 'under-pointer');
  const labels = packStarLabels(stars, 1200, 800, false, undefined, priority, []);
  assert.equal(labels[0].id, 'under-pointer');
  assert.equal(pointerStarPriority(stars, {x:100,y:300})[0], 'near-camera');
  assert.equal(pointerStarPriority(stars, {x:100,y:300}, ['under-pointer'])[0], 'under-pointer');
  assert.deepEqual(stars.map(s => s.id), ['near-camera','under-pointer','neighbor']);
});
