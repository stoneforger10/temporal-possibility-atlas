// Read-only: no signer, no write method, no rebroadcast.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {receipt,source,rpc,canonical,read,denied} from './check.mjs';
import {analysisState,queryState} from './state.mjs';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
assert(p.final_readback_verified&&p.voting_metadata_verified&&p.transactions.length===10);assert.equal(await rpc('eth_chainId',[]),'0xf22f');
assert.equal(canonical(await source(p.address)),canonical(p.source));
for(const t of p.transactions){assert(t.verified&&t.hash&&!t.broadcast_unknown);await receipt(t.hash,t.expected,t.expected_message);}
for(const [name,x] of Object.entries(p.analyses)){
 assert.equal(canonical(await analysisState(p.address,x.key)),canonical(x.state));
 assert.equal(await read(p.address,'get_request',[p.account.address,name]),x.key);
}
for(const q of p.queries){
 const r=Object.values(p.analyses).find(x=>x.key===q.key).state;
 assert.equal(canonical(await queryState(p.address,r,q.left,q.right,q.label)),canonical(q.result));
}
for(const nonce of ['resample','bad-order','unsafe'])assert(await denied(p.address,'get_request',[p.account.address,nonce]));
const history=await rpc('sim_getTransactionsForAddress',[p.address]);
assert.deepEqual(history.map(t=>t.hash).sort(),p.transactions.map(t=>t.hash).sort());
for(const t of history){
 const intent=p.transactions.find(x=>x.hash===t.hash);
 assert.equal(t.from_address.toLowerCase(),p.account.address.toLowerCase());
 assert.equal(t.to_address.toLowerCase(),p.address.toLowerCase());
 assert.equal(BigInt(t.nonce),BigInt(intent.nonce_before));assert.equal(BigInt(t.value),0n);
}
console.log(JSON.stringify({verified:true,address:p.address,transactions:10,source_match:true,analyses:5,queries:p.queries.length}));
