// Preserve full sub-pixel precision. Cache exact numeric values, so only
// unchanged SVG attributes are skipped (no throttling or visual quantization).
export function updateDepthConnector(record,camera,size,compact,point) {
  const {item,line,dot}=record;
  if(!line || !dot)return 0;
  point.set(...item.position).project(camera);
  const x=(point.x+1)*size.width/2-item.labelPlacement.x;
  const y=(1-point.y)*size.height/2-item.labelPlacement.y;
  const width=compact?156:198,height=compact?72:82;
  const x2=x<width/2?0:width, y2=Math.max(0,Math.min(height,y));
  const previous=record.previous || (record.previous={});
  let writes=0;
  if(x!==previous.x){
    line.setAttribute('x1',x);dot.setAttribute('cx',x);writes+=2;previous.x=x;
  }
  if(y!==previous.y){
    line.setAttribute('y1',y);dot.setAttribute('cy',y);writes+=2;previous.y=y;
  }
  if(x2!==previous.x2){line.setAttribute('x2',x2);writes++;previous.x2=x2;}
  if(y2!==previous.y2){line.setAttribute('y2',y2);writes++;previous.y2=y2;}
  return writes;
}
