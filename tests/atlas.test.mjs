import test from 'node:test';
import assert from 'node:assert/strict';
import {universe,classify,solve,labels} from '../scripts/reference.mjs';
test('complete proper interval weak orders and inverse symmetry',()=>{
 assert.equal(universe(2).length,13);assert.equal(universe(3).length,409);
 for(const r of universe(3))for(const [i,j] of [[0,1],[0,2],[1,2]]){
  const f=classify(r[2*i],r[2*i+1],r[2*j],r[2*j+1]);
  const b=classify(r[2*j],r[2*j+1],r[2*i],r[2*i+1]);assert.equal(labels.indexOf(b),12-labels.indexOf(f));
 }
});
test('all pair subsets preserve exactly selected possibilities',()=>{
 for(let mask=0;mask<8192;mask++){
  const subset=labels.filter((_,i)=>mask&(1<<i));
  const result=solve({pairs:[{left:'A',right:'B',relations:subset}]},['A','B']);
  assert.equal(result.world_count,subset.length);assert.deepEqual(result.pairs[0].possible,subset);
 }
});
test('global cycle has no worlds; missing relation inferred transitively',()=>{
 const table=(ac)=>({pairs:[{left:'A',right:'B',relations:['BEFORE']},{left:'A',right:'C',relations:ac},{left:'B',right:'C',relations:['MEETS']}]});
 assert.equal(solve(table(['AFTER']),['A','B','C']).world_count,0);
 const r=solve(table(labels),['A','B','C']);assert.equal(r.world_count,1);assert.deepEqual(r.pairs[1].possible,['BEFORE']);
});
