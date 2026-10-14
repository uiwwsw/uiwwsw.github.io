import { clamp, earthPosition, EARTH_RADIUS, flightPose } from './observatory.js';
import { lunarDeparture } from './lunarDeparture.js';

const normalize = v => v.map(value => value / Math.hypot(...v));
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot = (a,b) => a.reduce((sum,v,i) => sum+v*b[i],0);

// Screen-up, not world-x: the whole atmosphere starts above the viewport.
// The opening camera remains below this calibrated flight origin until liftoff.
export function worldAssemblyLayout(compact) {
  const pose = flightPose(0, compact);
  const forward = normalize(pose.target.map((v,i) => v-pose.position[i]));
  const right = normalize(cross(forward,[0,1,0]));
  const up = cross(right,forward);
  const baseEarth = earthPosition(compact);
  const depth = dot(baseEarth.map((v,i)=>v-pose.position[i]),forward);
  const tanV = Math.tan((compact ? 58 : 46)*Math.PI/360);
  const radius = EARTH_RADIUS*1.025;
  const shift = depth*tanV + radius*Math.hypot(1,tanV) + 72;
  return {baseEarth, earthOffset:up.map(v=>v*shift)};
}
export const createWorldAssembly = (compact=false) => ({
  phase:'waiting', earth:1, ground:1,
  departure:lunarDeparture(0),
  layout:worldAssemblyLayout(compact),
});
export const assemblyEarthPosition = ({baseEarth,earthOffset}, amount) =>
  baseEarth.map((v,i)=>v+earthOffset[i]*clamp(amount));

export function scrubWorldAssembly(state, progress) {
  state.departure = lunarDeparture(progress);
  state.earth = state.departure.earth;
  state.ground = 1-state.departure.landing;
  state.phase = progress >= 1 ? 'done' : 'assembling';
}
