import { PerspectiveCamera, Vector3 } from 'three';
import { flightPose, seededRandom } from './observatory.js';
import { starSeed, giveStarsPersonality } from './starPersonality.js';
import { readingGrid, bandProgress } from './depthBands.js';

// Allocate each depth band's screen rectangles first, then unproject their
// irregular anchors into real world positions. Labels fit before we fly there.
export function corridorStars(articles,sector,compact,visitSeed=0,viewport) {
  const {width,height}=viewport || (compact?{width:390,height:844}:{width:1440,height:900});
  const grid=readingGrid(width,height,compact);
  const count=Math.max(1,Math.ceil(articles.length/grid.capacity));
  const camera=new PerspectiveCamera(compact?58:46,width/height,.1,650);
  const direction=new Vector3(), point=new Vector3();
  const origin=sector.origin || [0,0,0];
  const outer=compact?24:Math.max(24,width*.15);
  const cellWidth=(width-outer*2)/grid.cols;
  const cellHeight=(height-grid.top-grid.bottom)/grid.rows;
  return giveStarsPersonality(articles,visitSeed).map((article,index)=>{
    const bandIndex=Math.floor(index/grid.capacity), slot=index%grid.capacity;
    const readAt=bandProgress(bandIndex,count);
    const pose=flightPose(readAt,compact);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    camera.updateMatrixWorld();
    camera.getWorldDirection(direction);
    const random=seededRandom(starSeed(article.id,visitSeed));
    const column=slot%grid.cols, row=Math.floor(slot/grid.cols);
    const slackX=Math.max(0,cellWidth-grid.labelWidth-48);
    const slackY=Math.max(0,cellHeight-grid.labelHeight-26);
    const x=outer+column*cellWidth+24+random()*slackX;
    const y=grid.top+row*cellHeight+13+random()*slackY;
    // Vary which side of the star holds its title without changing the slot.
    const left=random()<.5, above=random()<.5;
    const offsetX=left?-grid.labelWidth-12:12, offsetY=above?-grid.labelHeight:0;
    const anchorX=x-offsetX, anchorY=y-offsetY;
    point.set(anchorX/width*2-1,1-anchorY/height*2,.5).unproject(camera).sub(camera.position).normalize();
    const depth=28+random()*2;
    point.multiplyScalar(depth/point.dot(direction)).add(camera.position);
    return {...article,position:point.toArray().map((v,i)=>v+origin[i]),
      bandIndex,bandCount:count,readAt,slotIndex:slot,
      labelPlacement:{x,y,offsetX,offsetY}};
  });
}
