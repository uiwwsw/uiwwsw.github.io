// Development-only, fixed-size sample. Measures ArticleSky's synchronous CPU
// callback, not GPU time or total page frame time. No production sampling.
export function createSkyProfile(warmup=120,limit=600) {
  let frames=0, active=false, labels=0, binds=0, writes=0;
  const samples=[];
  return {
    begin(readable) {
      active=false;
      if(!readable || samples.length>=limit) return null;
      frames++;
      if(frames<=warmup)return null;
      active=true;
      return performance.now();
    },
    end(start) {
      if(start!==null)samples.push(performance.now()-start);
    },
    labelCommit(){if(active)labels++;},
    bind(){if(active)binds++;},
    write(count=1){if(active)writes+=count;},
    summary(){
      const sorted=[...samples].sort((a,b)=>a-b), n=sorted.length;
      const p=q=>n?sorted[Math.min(n-1,Math.floor(n*q))].toFixed(3):'-';
      return `profile ${n}/${limit} · sky CPU p50 ${p(.5)}ms p95 ${p(.95)}ms · labels ${labels} · binds ${binds} · SVG writes ${writes}`;
    },
  };
}
