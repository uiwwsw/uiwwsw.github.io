import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera } from 'three';
import { giveStarsPersonality, STAR_PALETTES } from '../src/utils/starPersonality.js';
import { corridorStars } from '../src/utils/flightCorridor.js';
import { flightPose } from '../src/utils/observatory.js';
import { createStarProjector } from '../src/utils/starVisibility.js';

const catalog = Array.from({length:96}, (_,i) => ({
  id: `public-${i}`, topic: Object.keys(STAR_PALETTES)[i%4],
  publishedAt: `2026-09-${String(i%28+1).padStart(2,'0')}`, readingTime: 1+i%12,
  position:[i,0,0], link:`/writing/public-${i}/`,
}));
test('personality preserves exactly the public articles and assigns bounded, meaningful variations', () => {
  const before = JSON.stringify(catalog);
  const stars = giveStarsPersonality(catalog,42);
  assert.deepEqual(stars.map(s=>s.id),catalog.map(s=>s.id));
  assert.deepEqual(stars.map(s=>s.link),catalog.map(s=>s.link));
  assert.equal(stars.filter(s=>s.starStyle.invitation==='최근 기록').length,3);
  assert.equal(stars.filter(s=>s.starStyle.invitation==='다시 발견한 기록').length,2);
  assert.equal(new Set(stars.map(s=>s.color)).size,4);
  assert.equal(new Set(stars.map(s=>s.starStyle.shape)).size,4);
  assert.equal(new Set(stars.map(s=>s.starStyle.phase)).size,96);
  assert.ok(stars.every(s=>s.starStyle.size>=.8 && s.starStyle.size<1.71 && s.starStyle.period>=18));
  assert.equal(JSON.stringify(catalog), before);
  assert.deepEqual(giveStarsPersonality(catalog,42),stars);
  assert.deepEqual(giveStarsPersonality([],42),[]);
});
test('visit variation changes discovery and positions without shuffling targets during the visit', () => {
  const a = corridorStars(catalog,{id:'home',origin:[0,0,0]},false,42);
  const b = corridorStars(catalog,{id:'home',origin:[0,0,0]},false,43);
  assert.deepEqual(corridorStars(catalog,{id:'home',origin:[0,0,0]},false,42),a);
  assert.notDeepEqual(a.map(s=>s.position),b.map(s=>s.position));
  assert.notDeepEqual(a.filter(s=>s.starStyle.invitation==='다시 발견한 기록').map(s=>s.id),b.filter(s=>s.starStyle.invitation==='다시 발견한 기록').map(s=>s.id));
});
test('irregular pockets keep every article in the forward route across visits and viewports', () => {
  const project = createStarProjector();
  for (const [width,height] of [[320,568],[390,844],[1440,900],[844,390]]) {
    const compact=width<=760;
    for (const seed of [1,42,100,0xffffffff]) {
      const stars=corridorStars(catalog,{id:'home',origin:[0,0,0]},compact,seed,{width,height});
      stars.forEach((star,i)=>{
        const pose=flightPose(star.readAt,compact);
        const camera=new PerspectiveCamera(compact?58:46,width/height,.1,650);
        camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld();
        assert.ok(project(star,camera,width,height),`${width}/${seed}/${i} stays discoverable`);
      });
      const gaps=stars.slice(1).map((s,i)=>Math.hypot(...s.position.map((v,j)=>v-stars[i].position[j])));
      assert.ok(Math.max(...gaps)-Math.min(...gaps)>3,'spacing must not form a uniform chain');
    }
  }
});
test('deep route reveals a limited neighborhood while retaining every article along the journey', () => {
  for (const compact of [false,true]) {
    const stars=corridorStars(catalog,{id:'home',origin:[0,0,0]},compact,42);
    const camera=new PerspectiveCamera(compact?58:46,compact?390/844:1440/900,.1,650);
    const project=createStarProjector();
    const seen=new Set();
    let peak=0;
    for(let step=0;step<=100;step++){
      const pose=flightPose(step/100,compact);
      camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
      const visible=stars.filter(s=>project(s,camera,compact?390:1440,compact?844:900));
      peak=Math.max(peak,visible.length);
      visible.forEach(s=>seen.add(s.id));
    }
    assert.ok(peak<40, 'no wall of 50+ article stars');
    assert.equal(seen.size,96,'all articles remain discoverable');
  }
});
