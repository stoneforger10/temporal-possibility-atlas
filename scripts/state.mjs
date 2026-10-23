import assert from 'node:assert/strict';
import {digest,canonical,sha,read} from './check.mjs';
import {solve,labels} from './reference.mjs';
export async function analysisState(address,key){
 const r=await read(address,'get_analysis',[key]),{root,...body}=r,s=r.report.spec,row=r.report.source;
 assert.equal(digest(body),root);assert.equal(digest(s),key);assert.equal(r.input_root,key);
 assert.equal(s.contract,address);assert.equal(s.policy,'temporal-possibility-atlas-v1');assert.equal(row.url,s.source.url);
 assert.deepEqual(s.events,[...new Set(s.events)].sort());assert(s.events.length>=2&&s.events.length<=3);
 if(['OK','HASH_MISMATCH'].includes(row.status)){
  assert.equal(row.http,200);assert(Buffer.byteLength(row.body)>=1&&Buffer.byteLength(row.body)<=4096);
  assert.equal(sha(row.body),row.hash);assert.equal(row.status,row.hash===s.source.sha256?'OK':'HASH_MISMATCH');
 }else{
  assert(['UNAVAILABLE','HTTP_ERROR','SIZE_ERROR','ENCODING_ERROR'].includes(row.status));assert(!row.body&&!row.hash);
  if(row.status==='UNAVAILABLE')assert.equal(row.http,0);
  else if(row.status==='HTTP_ERROR')assert(row.http>=100&&row.http<=599&&row.http!==200);
  else assert.equal(row.http,200);
 }
 if(row.status!=='OK'){
  assert.deepEqual(r.report.constraints,{pairs:[]});assert.equal(r.status,'HELD');
  assert.deepEqual(r.envelope,{world_count:0,worlds_root:digest([]),pairs:[]});
 }else{
  const envelope=solve(r.report.constraints,s.events);assert.equal(canonical(envelope),canonical(r.envelope));
  assert.equal(r.status,envelope.world_count===0?'INCONSISTENT':envelope.world_count===1?'DETERMINED':'AMBIGUOUS');
 }
 return r;
}
export async function queryState(address,r,left,right,label){
 let expected={answer:'NO_CLAIM',analysis_root:r.root,reason:r.status,witness:[]};
 if(!['HELD','INCONSISTENT'].includes(r.status)){
  const names=r.report.spec.events,reverse=names.indexOf(left)>names.indexOf(right),[a,b]=reverse?[right,left]:[left,right];
  const requested=reverse?labels[12-labels.indexOf(label)]:label;
  const row=r.envelope.pairs.find(x=>x.left===a&&x.right===b);assert(row);
  expected={answer:!row.possible.includes(requested)?'IMPOSSIBLE':row.possible.length===1?'NECESSARY':'POSSIBLE',
   analysis_root:r.root,reason:'DOCUMENT_CONSTRAINTS',witness:row.witnesses.find(x=>x.relation===requested)?.ranks??[]};
 }
 const actual=await read(address,'query',[r.input_root,r.root,left,right,label]);assert.deepEqual(actual,expected);return actual;
}
