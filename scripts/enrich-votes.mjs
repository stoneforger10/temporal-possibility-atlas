// Chain reads only; enrich the generated public journal, never send or sign.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {receipt} from './check.mjs';
const p=JSON.parse(fs.readFileSync('PROOFS.json','utf8'));
assert(p.final_readback_verified&&p.contract_history_matched&&p.transactions.length===10);
for(const t of p.transactions)Object.assign(t,await receipt(t.hash,t.expected,t.expected_message));
assert(p.transactions.filter(t=>t.step.startsWith('analyze-')&&t.step!=='analyze-ordered-bad').every(t=>t.validator_execution_seen));
p.voting_metadata_verified=true;
fs.writeFileSync('PROOFS.json',JSON.stringify(p,null,2)+'\n');
console.log(JSON.stringify({transactions:p.transactions.length,leader_only:false,minimum_initial_validators:Math.min(...p.transactions.map(t=>t.initial_validators)),minimum_explicit_agree_votes:Math.min(...p.transactions.map(t=>t.agree_votes))}));
