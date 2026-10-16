import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera } from 'three';
import { corridorStars } from '../src/utils/flightCorridor.js';
import { flightPose } from '../src/utils/observatory.js';
import { createStarProjector } from '../src/utils/starVisibility.js';
import { packStarLabels } from '../src/utils/starSelection.js';
import { resolveReadingBand, bandProgress, readingGrid, navigationSample } from '../src/utils/depthBands.js';

const articles=Array.from({length:62},(_,i)=>({id:String(i),topic:'essay'}));
const overlaps=(a,b)=>a.x<b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y;
test('every depth band owns a non-overlapping readable layout on PC, mobile and landscape',()=>{
  for(const [width,height] of [[320,568],[390,844],[760,600],[844,390],[1200,754],[1440,900]]){
    const compact=width<=760, grid=readingGrid(width,height,compact);
    for(const seed of [1,42,999]){
      const stars=corridorStars(articles,{id:'home',origin:[0,0,0]},compact,seed,{width,height});
      const camera=new PerspectiveCamera(compact?58:46,width/height,.1,650),project=createStarProjector();
      for(let band=0;band<stars[0].bandCount;band++){
        const own=stars.filter(s=>s.bandIndex===band), pose=flightPose(own[0].readAt,compact);
        camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
        const projected=own.map(s=>project(s,camera,width,height));
        assert.ok(projected.every(Boolean),`${width}/${seed}/${band} all stars pickable`);
        const desired=projected.map(s=>({...s,offsetX:s.labelPlacement.x-s.x,offsetY:s.labelPlacement.y-s.y}));
        const labels=packStarLabels(desired,width,height,compact,undefined,[],[]);
        assert.equal(labels.length,own.length,`${width}/${band}: every title fits`);
        assert.ok(labels.length<=grid.capacity);
        labels.forEach((a,i)=>{
          assert.ok(a.rect.x>=12 && a.rect.x+a.rect.width<=width-12);
          assert.ok(a.rect.y>=grid.top && a.rect.y+a.rect.height<=height-grid.bottom);
          for(const b of labels.slice(i+1)) assert.equal(overlaps(a.rect,b.rect),false);
        });
      }
    }
  }
});
test('band boundaries resist small scroll reversals but allow direct distant jumps',()=>{
  const count=20, step=(bandProgress(19,count)-bandProgress(0,count))/19;
  const middle=bandProgress(4,count)+step*.5;
  for(const delta of [-.1,.1,-.1,.1]) assert.equal(resolveReadingBand(middle+delta*step,count,4),4);
  assert.equal(resolveReadingBand(middle+step*.2,count,4),5);
  assert.equal(resolveReadingBand(middle-step*.1,count,5),5);
  assert.equal(resolveReadingBand(bandProgress(17,count),count,4),17);
  assert.equal(resolveReadingBand(0,1,0),0);
});
test('navigation moves continuously in either direction, reaches the exact reading depth and never overshoots',()=>{
  for(const [start,target] of [[.16,.92],[.9,.22]]){
    let previous=start;
    for(let t=0;t<=1800;t+=16){
      const next=navigationSample(start,target,t,1500);
      assert.ok(next>=Math.min(start,target) && next<=Math.max(start,target));
      assert.ok(Math.abs(next-previous)<.02);
      assert.ok((next-previous)*(target-start)>=-1e-12);
      previous=next;
    }
    assert.equal(navigationSample(start,target,1500,1500),target);
  }
});
test('current-band stars stay discoverable throughout forward and reverse boundary crossings',()=>{
  for(const [width,height] of [[320,568],[390,844],[844,390],[1200,754]]){
    const compact=width<=760, stars=corridorStars(articles,{origin:[0,0,0]},compact,42,{width,height});
    const camera=new PerspectiveCamera(compact?58:46,width/height,.1,650),project=createStarProjector();
    let band=null;
    for(const direction of [1,-1]){
      for(let step=0;step<=100;step++){
        const p=direction===1?.12+step*.0088:1-step*.0088;
        const pose=flightPose(p,compact);
        camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();
        band=resolveReadingBand(p,stars[0].bandCount,band);
        for(const star of stars.filter(s=>s.bandIndex===band))
          assert.ok(project(star,camera,width,height),`${width}/${direction}/${p}: ${star.id}`);
      }
    }
  }
});
