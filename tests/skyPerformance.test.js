import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { updateDepthConnector } from '../src/utils/depthConnector.js';
import { sameStarLabels } from '../src/utils/starSelection.js';
import { createStarProjector, starVisibility, STAR_PICK_ALPHA } from '../src/utils/starVisibility.js';

const node=()=>({attrs:{},setAttribute(key,value){this.attrs[key]=String(value);}});
test('cached connectors preserve exact SVG geometry during motion, resizing and pauses',()=>{
  const camera=new PerspectiveCamera(46,1200/754,.1,650);
  const record={item:{position:[2,4,-25],labelPlacement:{x:400,y:300}},line:node(),dot:node()};
  const point=new Vector3();
  let writes=0;
  for(const [x,y,width,height,compact] of [[0,0,1200,754,false],[0,0,1200,754,false],
    [3,2,1200,754,false],[-10,20,390,844,true],[50,-30,844,390,false]]){
    camera.position.set(x,y,0);camera.aspect=width/height;camera.updateProjectionMatrix();camera.updateMatrixWorld();
    const projected=new Vector3(...record.item.position).project(camera);
    const expectedX=(projected.x+1)*width/2-400,expectedY=(1-projected.y)*height/2-300;
    const before=writes;
    writes+=updateDepthConnector(record,camera,{width,height},compact,point);
    assert.deepEqual(record.line.attrs,{x1:String(expectedX),y1:String(expectedY),
      x2:String(expectedX<(compact?156:198)/2?0:compact?156:198),
      y2:String(Math.max(0,Math.min(compact?72:82,expectedY)))});
    assert.deepEqual(record.dot.attrs,{cx:String(expectedX),cy:String(expectedY)});
    assert.equal(updateDepthConnector(record,camera,{width,height},compact,point),0,'stationary view writes nothing');
    assert.ok(writes-before<=6);
  }
});
test('fixed-slot label rendering ignores moving connector offsets but retains real UI changes',()=>{
  const a={id:'a',position:[1,2,3],offsetX:12,offsetY:0,leavingAt:null,labelPlacement:{x:200,y:300}};
  assert.equal(sameStarLabels([a],[{...a,offsetX:-10,offsetY:30}]),true);
  for(const change of [{id:'b'},{leavingAt:1},{position:[1,2,4]},{labelPlacement:{x:201,y:300}},{labelPlacement:null}])
    assert.equal(sameStarLabels([a],[{...a,...change}]),false);
  const legacy={...a,labelPlacement:undefined};
  assert.equal(sameStarLabels([legacy],[{...legacy,offsetX:20}]),false);
});
test('early depth rejection preserves the previous visibility and exact projected coordinates',()=>{
  const project=createStarProjector(),view=new Vector3(),ndc=new Vector3();
  for(const compact of [false,true]){
    const width=compact?390:1200,height=compact?844:754;
    const camera=new PerspectiveCamera(compact?58:46,width/height,.1,650);
    camera.position.set(3,5,8);camera.lookAt(0,2,-50);camera.updateMatrixWorld();
    for(const depth of [-10,0,2,3,6,12,25,38,50,57,58,100]){
      for(const x of [-20,0,20]){
        const item={position:[x,4,-depth]};
        view.set(...item.position).applyMatrix4(camera.matrixWorldInverse);
        ndc.copy(view).applyMatrix4(camera.projectionMatrix);
        const visibility=starVisibility(-view.z,ndc.x,ndc.y);
        const expected=ndc.z>=-1 && ndc.z<=1 && Number.isFinite(visibility) && visibility>=STAR_PICK_ALPHA;
        const actual=project(item,camera,width,height);
        assert.equal(!!actual,expected);
        if(actual){
          assert.equal(actual.visibility,visibility);
          assert.equal(actual.x,(ndc.x+1)*width/2);
          assert.equal(actual.y,(1-ndc.y)*height/2);
        }
      }
    }
  }
});
