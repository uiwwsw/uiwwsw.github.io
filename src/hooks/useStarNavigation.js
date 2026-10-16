import { useCallback, useEffect, useRef, useState } from 'react';
import { navigationSample } from '../utils/depthBands.js';

export function useStarNavigation({distance,setDistance,enabled,reducedMotion}) {
  const [navigation,setNavigation]=useState(null);
  const current=useRef(distance), frame=useRef(null);
  current.current=distance;
  const cancel=useCallback(()=>{
    if(frame.current!==null) cancelAnimationFrame(frame.current);
    frame.current=null;
    setNavigation(null);
  },[]);
  const seek=useCallback(article=>{
    cancel();
    const start=current.current, target=article.readAt;
    if(!Number.isFinite(target)) return;
    if(reducedMotion){
      setDistance(target);
      setNavigation({id:article.id,title:article.title,moving:false});
      return;
    }
    setNavigation({id:article.id,title:article.title,moving:true});
    let began;
    const duration=650+Math.abs(target-start)*1500;
    const tick=now=>{
      began??=now;
      const elapsed=now-began;
      setDistance(navigationSample(start,target,elapsed,duration));
      if(elapsed<duration) frame.current=requestAnimationFrame(tick);
      else{
        frame.current=null;
        setNavigation({id:article.id,title:article.title,moving:false});
      }
    };
    frame.current=requestAnimationFrame(tick);
  },[cancel,reducedMotion,setDistance]);
  useEffect(()=>{if(!enabled || reducedMotion) cancel();},[enabled,reducedMotion,cancel]);
  useEffect(()=>{
    window.addEventListener('resize',cancel);
    return ()=>window.removeEventListener('resize',cancel);
  },[cancel]);
  useEffect(()=>()=>{if(frame.current!==null)cancelAnimationFrame(frame.current);},[]);
  return {navigation,seek,cancel};
}
