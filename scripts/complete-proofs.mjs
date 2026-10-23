import fs from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {getAddress} from 'viem';
import {rpc,receipt,source,read,denied,sha,canonical} from './check.mjs';
import {analysisState,queryState} from './state.mjs';
const account={name:'studio-proof-deployer',address:getAddress('0x7a413bb4ab62e31d62d4cd9efc8c8a8dae37fb42')};
const file='PROOFS.json',commit=process.argv[2];
if(!/^[0-9a-f]{40}$/.test(commit??''))throw Error('Supply published full fixture commit');
let p=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):
 {network:'studionet',chain_id:61999,fixture_commit:commit,account,transactions:[],analyses:{},queries:[]};
assert.equal(p.fixture_commit,commit);
const save=()=>fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');p.final_readback_verified=false;save();let phase='preflight';
function broadcast(args,onHash){return new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['scripts/run-cli.cjs',...args],{windowsHide:true,env:{...process.env,TPA_TEST_ACCOUNT:account.name},stdio:['ignore','pipe','pipe']});
 let carry='';child.stderr.resume();child.stdout.on('data',data=>{carry+=data.toString();const lines=carry.split(/\r?\n/);carry=lines.pop();
  for(const line of lines)if(/^BROADCAST_HASH 0x[0-9a-fA-F]{64}$/.test(line))onHash(line.split(' ')[1]);});
 child.on('error',()=>reject(Error('CLI launch failed')));child.on('close',resolve);
});}
async function tx(step,args,expected='SUCCESS',message){
 phase=step;let entry=p.transactions.find(t=>t.step===step);
 if(!entry){
  const latest=await rpc('eth_getTransactionCount',[account.address,'latest']),pending=await rpc('eth_getTransactionCount',[account.address,'pending']);
  assert.equal(latest,pending,'Signer has pending transactions');
  entry={step,signer:account.address,expected,cli_arguments:args,nonce_before:latest,broadcast_unknown:true,verified:false,...(message?{expected_message:message}:{})};
  p.transactions.push(entry);save();await broadcast(args,hash=>{entry.hash=hash;delete entry.broadcast_unknown;save();console.log(step+' '+hash);});
 }
 if(!entry.hash)throw Error('Unknown broadcast outcome; audit history before any retry');
 assert.equal(canonical(entry.cli_arguments),canonical(args));
 Object.assign(entry,await receipt(entry.hash,expected,message),{verified:true});save();
 console.log(JSON.stringify({step,status:entry.status,execution:entry.execution,consensus:entry.consensus}));
 if(expected==='SUCCESS'&&!entry.committed)throw Error('No state committed');return entry;
}
const write=(step,args,expected='SUCCESS',message)=>tx(step,['write',p.address,'analyze','--args',...args.map(String)],expected,message);
function request(fixture,bad=false){return [fixture+(bad?'-bad':''),'stoneforger10/temporal-possibility-atlas/'+commit+'/examples/'+fixture+'.txt',
 bad?'f'.repeat(64):sha(fs.readFileSync('examples/'+fixture+'.txt')),['ordered','contradictory'].includes(fixture)?'ALPHA,BETA,GAMMA':'ALPHA,BETA'];}
async function analyze(fixture,status,bad=false){
 const args=request(fixture,bad),name=args[0];await write('analyze-'+name,args);
 const key=await read(p.address,'analysis_key',args.slice(1)),state=await analysisState(p.address,key);
 assert.equal(state.status,status);assert.equal(await read(p.address,'get_request',[account.address,name]),key);
 p.analyses[name]={key,state};save();return state;
}
async function query(r,left,right,label,answer){
 const result=await queryState(p.address,r,left,right,label);assert.equal(result.answer,answer);
 const item={key:r.input_root,left,right,label,result};
 p.queries=p.queries.filter(x=>!(x.key===item.key&&x.left===left&&x.right===right&&x.label===label));p.queries.push(item);save();
}
try{
 assert.equal(await rpc('eth_chainId',[]),'0xf22f');
 for(const fixture of ['ordered','ambiguous','contradictory','unknown']){
  const path='examples/'+fixture+'.txt',url='https://raw.githubusercontent.com/stoneforger10/temporal-possibility-atlas/'+commit+'/'+path;
  const r=await fetch(url,{signal:AbortSignal.timeout(20000)});assert(r.ok);assert.equal(sha(Buffer.from(await r.arrayBuffer())),sha(fs.readFileSync(path)));
 }
 const deployed=await tx('deploy',['deploy','--contract','contracts/TemporalPossibilityAtlas.py']);p.address=deployed.address;p.source=await source(p.address);save();
 const ordered=await analyze('ordered','DETERMINED');assert.equal(ordered.envelope.world_count,1);
 await query(ordered,'ALPHA','GAMMA','BEFORE','NECESSARY');await query(ordered,'GAMMA','ALPHA','AFTER','NECESSARY');
 await query(ordered,'BETA','GAMMA','MEETS','NECESSARY');await query(ordered,'ALPHA','GAMMA','OVERLAPS','IMPOSSIBLE');
 const ambiguous=await analyze('ambiguous','AMBIGUOUS');assert.equal(ambiguous.envelope.world_count,3);
 assert.deepEqual(ambiguous.envelope.pairs[0].possible,['BEFORE','MEETS','OVERLAPS']);
 await query(ambiguous,'ALPHA','BETA','OVERLAPS','POSSIBLE');await query(ambiguous,'ALPHA','BETA','EQUALS','IMPOSSIBLE');
 const contradictory=await analyze('contradictory','INCONSISTENT');await query(contradictory,'ALPHA','BETA','BEFORE','NO_CLAIM');
 const unknown=await analyze('unknown','AMBIGUOUS');assert.equal(unknown.envelope.world_count,13);await query(unknown,'ALPHA','BETA','BEFORE','POSSIBLE');
 const held=await analyze('ordered','HELD',true);assert.equal(held.report.source.status,'HASH_MISMATCH');await query(held,'ALPHA','BETA','BEFORE','NO_CLAIM');
 await write('input-resampling',['resample',...request('ordered').slice(1)],'ERROR','Input already analyzed');
 await write('nonce-replay',['ordered',...request('unknown').slice(1)],'ERROR','Nonce already used');
 await write('invalid-event-order',['bad-order',...request('ordered').slice(1,3),'BETA,ALPHA'],'ERROR','Invalid analysis request');
 await write('unsafe-url',['unsafe','https://evil.invalid/x','a'.repeat(64),'ALPHA,BETA'],'ERROR','Invalid analysis request');
 assert(await denied(p.address,'query',[ordered.input_root,'f'.repeat(64),'ALPHA','BETA','BEFORE']));
 for(const x of Object.values(p.analyses))assert.equal(canonical(await analysisState(p.address,x.key)),canonical(x.state));
 for(const nonce of ['resample','bad-order','unsafe'])assert(await denied(p.address,'get_request',[account.address,nonce]));
 p.rejected_requests_absent=true;p.source=await source(p.address);
 assert(p.transactions.length===10&&p.transactions.every(t=>t.verified&&t.hash&&!t.broadcast_unknown));p.final_readback_verified=true;save();
 console.log(JSON.stringify({complete:true,address:p.address,transactions:p.transactions.length,analyses:Object.keys(p.analyses).length,queries:p.queries.length}));
}catch(e){console.error('Sanitized workflow stopped at '+phase+' ('+(e instanceof assert.AssertionError?'assertion':'network/receipt check')+'); inspect journal before retry');process.exitCode=1;}
