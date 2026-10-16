import test from 'node:test';
import assert from 'node:assert/strict';
import { packStarLabels, createStarLabelMemory, transitionStarLabels, approachingStarLabel } from '../src/utils/starSelection.js';

test('an active label keeps its placement and reserves its rectangle before new neighbors', () => {
  const active={id:'reading',x:400,y:300,offsetX:-210,offsetY:-82};
  const others=Array.from({length:8},(_,i)=>({id:String(i),x:200+i*20,y:240+i*12}));
  const labels=packStarLabels([...others,active],1000,700,false,undefined,others.map(s=>s.id),
    [{x:180,y:200,width:240,height:120}],['reading']);
  assert.equal(labels[0].id,'reading');
  assert.equal(labels[0].offsetX,-210);
  assert.equal(labels[0].offsetY,-82);
  const rect=labels[0].rect;
  for(const item of labels.slice(1)){
    const r=item.rect;
    assert.ok(r.x>=rect.x+rect.width+14 || r.x+r.width+14<=rect.x ||
      r.y>=rect.y+rect.height+14 || r.y+r.height+14<=rect.y);
  }
  assert.equal(transitionStarLabels([active],labels,10,true)[0].leavingAt,null);
});

test('leaving and rediscovering a title restores its side and height without caching stale projections',()=>{
  const memory=createStarLabelMemory();
  const a={id:'a',x:400,y:300,position:[1,2,3],offsetX:-210,offsetY:-82,leavingAt:null};
  memory.remember([a]);
  memory.remember([{...a,offsetX:12,leavingAt:3}]);
  const rediscovered=memory.apply({id:'a',x:450,y:350,position:[4,5,6]});
  assert.equal(rediscovered.offsetX,-210);
  assert.equal(rediscovered.offsetY,-82);
  assert.equal(rediscovered.x,450);
  assert.deepEqual(rediscovered.position,[4,5,6]);
  const labels=packStarLabels([rediscovered],1000,700,false,undefined,[],[]);
  assert.equal(labels[0].offsetX,-210);
  assert.equal(labels[0].offsetY,-82);
  memory.clear();
  assert.equal(memory.apply({id:'a'}).offsetX,undefined);
});

test('remembered placements adapt safely to a smaller viewport',()=>{
  const memory=createStarLabelMemory();
  memory.remember([{id:'a',offsetX:-210,offsetY:-82}]);
  const labels=packStarLabels([memory.apply({id:'a',x:30,y:400})],390,844,true,undefined,[],[]);
  assert.equal(labels.length,1);
  assert.ok(labels[0].rect.x>=12 && labels[0].rect.x+156<=378);
});


test('approaching a title protects it before hover and uses a wider exit boundary',()=>{
  const labels=[
    {id:'a',rect:{x:200,y:200,width:198,height:82},leavingAt:null},
    {id:'b',rect:{x:500,y:200,width:198,height:82},leavingAt:null},
    {id:'fading',rect:{x:100,y:100,width:198,height:82},leavingAt:1},
  ];
  assert.equal(approachingStarLabel(labels,{x:170,y:240},null),'a');
  assert.equal(approachingStarLabel(labels,{x:120,y:240},'a'),'a');
  assert.equal(approachingStarLabel(labels,{x:100,y:240},'a'),null);
  assert.equal(approachingStarLabel(labels,{x:530,y:240},'a'),'b');
  assert.equal(approachingStarLabel(labels,{x:110,y:110},null),null);
  assert.equal(approachingStarLabel(labels,{x:180,y:240},null,true),'a');
});
