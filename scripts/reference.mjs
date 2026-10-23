// Independent Cartesian endpoint oracle. Imports no contract or production solver.
import assert from 'node:assert/strict';
import {digest} from './check.mjs';
export const labels=['BEFORE','MEETS','OVERLAPS','STARTS','DURING','FINISHES','EQUALS','FINISHED_BY','CONTAINS','STARTED_BY','OVERLAPPED_BY','MET_BY','AFTER'];
export function classify(a,b,c,d){
 const predicates=[b<c,b===c,a<c&&c<b&&b<d,a===c&&b<d,c<a&&b<d,c<a&&b===d,a===c&&b===d,a<c&&b===d,a<c&&d<b,a===c&&d<b,c<a&&a<d&&d<b,a===d,d<a];
 assert.equal(predicates.filter(Boolean).length,1);return labels[predicates.indexOf(true)];
}
const cache=new Map();
export function universe(n){
 if(cache.has(n))return cache.get(n);const worlds=[],r=Array(n*2).fill(0);
 for(let code=0;code<(2*n)**(2*n);code++){
  let v=code;for(let i=r.length-1;i>=0;i--){r[i]=v%(2*n);v=Math.floor(v/(2*n));}
  if(Array.from({length:n},(_,i)=>r[2*i]<r[2*i+1]).some(x=>!x))continue;
  const set=new Set(r);if(set.size!==Math.max(...r)+1)continue;worlds.push([...r]);
 }cache.set(n,worlds);return worlds;
}
export function solve(table,names){
 const pairs=[];for(let i=0;i<names.length;i++)for(let j=i+1;j<names.length;j++)pairs.push([i,j]);
 assert.equal(table.pairs.length,pairs.length);
 for(let k=0;k<pairs.length;k++){
  const row=table.pairs[k],[i,j]=pairs[k];assert.deepEqual(Object.keys(row).sort(),['left','relations','right']);
  assert.equal(row.left,names[i]);assert.equal(row.right,names[j]);assert.deepEqual(row.relations,labels.filter(x=>row.relations.includes(x)));
 }
 const worlds=universe(names.length).filter(r=>pairs.every(([i,j],k)=>table.pairs[k].relations.includes(classify(r[2*i],r[2*i+1],r[2*j],r[2*j+1]))));
 return {world_count:worlds.length,worlds_root:digest(worlds),pairs:pairs.map(([i,j])=>{
  const seen=new Map();for(const r of worlds){const label=classify(r[2*i],r[2*i+1],r[2*j],r[2*j+1]);if(!seen.has(label))seen.set(label,r);}
  const possible=labels.filter(x=>seen.has(x));return {left:names[i],right:names[j],possible,witnesses:possible.map(relation=>({relation,ranks:seen.get(relation)}))};
 })};
}
