import { clamp } from './observatory.js';

export const READING_START = .16;
export const READING_END = .98;
export const bandProgress = (index,count) =>
  READING_START + index / Math.max(1,count-1) * (READING_END-READING_START);

export function readingGrid(width,height,compact) {
  const labelWidth=compact?156:198, labelHeight=compact?72:82;
  const top=Math.min(130,Math.max(96,height*.2)), bottom=Math.min(210,height*.3);
  const cols=Math.max(1,Math.min(compact?1:2,Math.floor((width-40)/(labelWidth+64))));
  const rows=Math.max(1,Math.min(2,Math.floor((height-top-bottom)/(labelHeight+54))));
  return {cols,rows,capacity:cols*rows,labelWidth,labelHeight,top,bottom};
}

// Retain a band beyond its midpoint, so small wheel reversals do not flash
// neighboring label sets. Large jumps can go directly to their destination.
export function resolveReadingBand(progress,count,previous=null) {
  if(count<=1) return 0;
  const step=(READING_END-READING_START)/(count-1);
  if(previous!==null && previous>=0 && previous<count) {
    const center=bandProgress(previous,count);
    const min=previous===0?-Infinity:center-step*.68;
    const max=previous===count-1?Infinity:center+step*.68;
    if(progress>=min && progress<=max) return previous;
  }
  return Math.round(clamp((progress-READING_START)/(READING_END-READING_START))*(count-1));
}
export const navigationSample = (start,target,elapsed,duration) => {
  const t=clamp(elapsed/duration);
  if(t===0)return start;
  if(t===1)return target;
  const ease=t*t*t*(t*(t*6-15)+10);
  return start+(target-start)*ease;
};
