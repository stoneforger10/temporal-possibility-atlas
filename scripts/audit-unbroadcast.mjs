// No send/sign path. Archive a hashless attempt ONLY after manual history inspection
// and these repeatable read-only checks. complete-proofs still performs its own nonce preflight.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {rpc,denied,source,canonical} from './check.mjs';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8')),entry=p.transactions.at(-1);
assert(entry?.broadcast_unknown&&!entry.hash&&!entry.verified);
assert.equal(entry.step,'analyze-unknown');assert(p.transactions.slice(0,-1).every(t=>t.verified&&t.hash));
assert.equal(await rpc('eth_chainId',[]),'0xf22f');
const latest=await rpc('eth_getTransactionCount',[p.account.address,'latest']);
const pending=await rpc('eth_getTransactionCount',[p.account.address,'pending']);
assert.equal(latest,entry.nonce_before);assert.equal(pending,entry.nonce_before);
const history=await rpc('sim_getTransactionsForAddress',[p.address]);assert(Array.isArray(history));
const hashes=history.map(t=>t.hash).sort(),known=p.transactions.slice(0,-1).map(t=>t.hash).sort();
assert.deepEqual(hashes,known,'Unaccounted transaction exists: inspect without resending');
assert(history.every(t=>t.from_address.toLowerCase()===p.account.address.toLowerCase()&&BigInt(t.nonce)<BigInt(entry.nonce_before)));
assert(await denied(p.address,'get_request',[p.account.address,'unknown']),'Request already applied');
assert.equal(canonical(await source(p.address)),canonical(p.source));
assert.equal(await rpc('eth_getTransactionCount',[p.account.address,'latest']),latest);
assert.equal(await rpc('eth_getTransactionCount',[p.account.address,'pending']),pending);
p.transport_incidents??=[];
p.transport_incidents.push({kind:'NO_HASH_CAPTURED',intent:entry,audit:{checked_at:new Date().toISOString(),chain_id:61999,
 latest,pending,known_contract_hashes:hashes,request_absent:true,source_match:true},
 note:'No acceptance observed after manual history inspection and repeated unchanged nonce checks. Original attempt is not a transaction proof. Exact caller nonce binding prevents duplicate state effects; final contract history must match the proof ledger.'});
p.transactions.pop();p.final_readback_verified=false;
fs.writeFileSync('PROOFS.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({audited:true,step:entry.step,latest,pending,known_contract_transactions:hashes.length,request_absent:true,send_performed:false}));
