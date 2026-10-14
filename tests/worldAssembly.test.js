import test from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { lunarDeparture, departurePose } from "../src/utils/lunarDeparture.js";
import { createWorldAssembly, scrubWorldAssembly, worldAssemblyLayout, assemblyEarthPosition } from "../src/utils/worldAssembly.js";
import { flightPose, earthPosition, EARTH_RADIUS } from "../src/utils/observatory.js";
import { createLunarCraters, lunarHeight, lunarSegments } from "../src/utils/lunarTerrain.js";

test("logo-only opening lands, holds at eye level, then lifts off into the flight route", () => {
  assert.equal(lunarDeparture(0).veil,1);
  assert.equal(lunarDeparture(0).logo,0);
  assert.equal(lunarDeparture(.25).logo,1);
  for(const compact of [false,true]){
    const start=departurePose(0,compact), landed=departurePose(.47,compact);
    assert.ok(start.position[1]>landed.position[1]+20);
    assert.equal(landed.position[1],2);
    assert.deepEqual(departurePose(.45,compact),departurePose(.54,compact));
    assert.ok(departurePose(.8,compact).position[1]>landed.position[1]+20);
    assert.deepEqual(departurePose(1,compact),flightPose(0,compact));
  }
});

test("Earth waits for landing and enters from above on both narrow and wide screens", () => {
  for(const [width,height] of [[320,568],[390,844],[1440,900],[844,390]]){
    const compact=width<=760, layout=worldAssemblyLayout(compact);
    for(const p of [0,.25,.43,.54]){
      const pose=departurePose(p,compact);
      const camera=new PerspectiveCamera(compact?58:46,width/height,.1,650);
      camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
      const point=new Vector3(...assemblyEarthPosition(layout,lunarDeparture(p).earth));
      point.y-=EARTH_RADIUS*1.025;
      assert.ok(point.project(camera).y>1, 'whole globe must start above the frame');
    }
    assert.equal(lunarDeparture(.54).earth,1);
    assert.equal(lunarDeparture(.88).earth,0);
    assert.deepEqual(assemblyEarthPosition(layout,0),earthPosition(compact));
  }
});

test("every scene property rewinds identically and there is no autonomous entry clock", () => {
  const state=createWorldAssembly();
  for(const p of [0,.1,.3,.47,.65,.8,1]){
    scrubWorldAssembly(state,p);const snapshot=structuredClone(state);
    scrubWorldAssembly(state,1);scrubWorldAssembly(state,0);scrubWorldAssembly(state,p);
    assert.deepEqual(state,snapshot);
  }
  const before=structuredClone(state.departure);
  state.layout=worldAssemblyLayout(true);
  assert.deepEqual(state.departure,before);
});

test("camera and Earth motion have continuous endpoints and finite bounded scroll steps",()=>{
  for(const compact of [true,false]){
    let previous=departurePose(0,compact);
    for(let i=1;i<=1000;i++){
      const pose=departurePose(i/1000,compact);
      assert.ok(pose.position.every(Number.isFinite));
      assert.ok(Math.hypot(...pose.position.map((v,j)=>v-previous.position[j]))<.21);
      previous=pose;
    }
    assert.ok(Math.abs(departurePose(.99999,compact).position[1]-flightPose(0,compact).position[1])<.00001);
  }
});

test("the lunar ridge and mobile geometry budget remain deterministic", () => {
  const craters = createLunarCraters();
  assert.deepEqual(createLunarCraters(), craters);
  const vertices = (compact) =>
    lunarSegments(compact).reduce(
      (count, segments) => count * (segments + 1),
      1,
    );
  assert.equal(vertices(true), 13545);
  assert.equal(vertices(false), 40001);
  for (let x = -130; x <= 130; x += 10)
    for (let z = -80; z <= 140; z += 10) {
      const y = lunarHeight(x, z, craters);
      assert.ok(Number.isFinite(y) && y > -25 && y < 0);
    }
});
