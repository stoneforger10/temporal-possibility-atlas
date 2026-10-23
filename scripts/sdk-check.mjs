import assert from 'node:assert/strict';
import {abi} from 'genlayer-js';
const root='a'.repeat(64),coord='stoneforger10/temporal-possibility-atlas/'+'b'.repeat(40)+'/examples/ordered.txt';
for(const [name,args] of [['analysis_key',[coord,root,'ALPHA,BETA,GAMMA']],['analyze',['demo',coord,root,'ALPHA,BETA,GAMMA']],['get_analysis',[root]],['get_request',['0x'+'1'.repeat(40),'demo']],['query',[root,root,'ALPHA','BETA','BEFORE']]]){
 const bytes=abi.calldata.encode(abi.calldata.makeCalldataObject(name,args,{}));assert.deepEqual(abi.calldata.encode(abi.calldata.decode(bytes)),bytes);
}
console.log('5 SDK calldata roundtrips passed');
