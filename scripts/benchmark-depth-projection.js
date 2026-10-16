// CPU-only comparison, excludes GPU, React, DOM and device FPS.
// devctl exec -- node scripts/benchmark-depth-projection.js /absolute/path/to/baseline/starVisibility.js
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { PerspectiveCamera } from 'three';
import { corridorStars } from '../src/utils/flightCorridor.js';
import { flightPose } from '../src/utils/observatory.js';
import { createStarProjectionBuffer } from '../src/utils/starVisibility.js';
const baseline=await import(pathToFileURL(resolve(process.argv[2])).href);
const index=JSON.parse(fs.readFileSync(new URL('../src/data/velog-index.json',import.meta.url)));
const source=index.articles.filter(a=>a.sectorId==='home');
const iterations=12000,rounds=7;
const median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)];
for(const compact of [false,true]){
  const width=compact?390:1200,height=compact?844:754;
  const stars=corridorStars(source,{id:'home',origin:[0,0,0]},compact,42,{width,height});
  const cameras=Array.from({length:240},(_,i)=>{
    const camera=new PerspectiveCamera(compact?58:46,width/height,.1,650),pose=flightPose(.16+.4*i/239,compact);
    camera.position.set(...pose.position);camera.lookAt(...pose.target);camera.updateMatrixWorld();return camera;
  });
  const before=baseline.createStarProjectionBuffer(stars,64),after=createStarProjectionBuffer(stars,64);
  for(const camera of cameras)assert.deepEqual(after.update(camera,width,height),before.update(camera,width,height));
  let checksum=0;
  const measure=buffer=>{
    const start=performance.now();
    for(let i=0;i<iterations;i++)checksum+=buffer.update(cameras[i%cameras.length],width,height).projected.length;
    return performance.now()-start;
  };
  measure(before);measure(after);
  const old=[],next=[];
  for(let i=0;i<rounds;i++){
    if(i%2){next.push(measure(after));old.push(measure(before));}
    else{old.push(measure(before));next.push(measure(after));}
  }
  const oldMs=median(old),newMs=median(next);
  console.log(JSON.stringify({compact,stars:stars.length,iterations,rounds,baselineMs:+oldMs.toFixed(2),
    optimizedMs:+newMs.toFixed(2),speedup:+(oldMs/newMs).toFixed(2),identicalOutput:true,checksum}));
}
