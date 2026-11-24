import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const mock=http.createServer(async(req,res)=>{
  if(req.method!=='POST'||req.url!=='/v1/responses'){res.writeHead(404).end();return;}
  let raw='';for await(const part of req)raw+=part;
  const d=JSON.parse(raw),user=JSON.stringify(d.input||[]);
  let output;
  if(user.includes('知识'))output={needsHelp:true,concept:'均方根误差 RMSE',explanation:'RMSE 用于衡量预测值与真实值偏差的典型大小。',whyRelevant:'可以比较不同定位方案误差',related:['误差统计','对照实验'],returnQuestion:'我如何控制对照条件并比较 RMSE？'};
  else output={nodes:[{type:'claim',title:'还没有完成比较',detail:'学生明确提到数据不足',quote:'尚未完成多星统一条件比较',parentId:null,relation:'leads_to'},{type:'revision',title:'不应被采纳',detail:'捏造引文',quote:'这里是学生从未说过的原话',parentId:null,relation:'revises'}]};
  const reply={status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(output)}]}]};
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(reply));
});
mock.listen(0,'127.0.0.1');await once(mock,'listening');
const upstreamPort=mock.address().port;
const apiPort=upstreamPort+1;
const env={...process.env,PORT:String(apiPort),HOST:'127.0.0.1',NODE_ENV:'test',OPENAI_API_KEY:'test-only-key',OPENAI_MODEL:'test-model',OPENAI_BASE_URL:'http://127.0.0.1:'+upstreamPort+'/v1',DEMO_ACCESS_CODE:'test-access-code',CORS_ALLOWED_ORIGINS:'http://localhost:3000'};
const child=spawn(process.execPath,['server.mjs'],{env,stdio:['ignore','pipe','pipe']});
let ready=false,stdout='',stderr='';
child.stdout.on('data',b=>{stdout+=b; if(stdout.includes('COGNIS V9'))ready=true;});
child.stderr.on('data',b=>stderr+=b);
const url='http://127.0.0.1:'+apiPort;
try{
  for(let i=0;i<70&&!ready;i++)await new Promise(r=>setTimeout(r,100));
  assert.ok(ready,'server did not start: '+stderr);
  const health=await (await fetch(url+'/api/health')).json();
  assert.equal(health.aiReady,true);
  const headers={'Content-Type':'application/json','X-Cognis-Access-Code':'test-access-code'};
  const knowledge=await fetch(url+'/api/knowledge-support',{method:'POST',headers,body:JSON.stringify({topic:'定位误差',question:'我不了解 RMSE 的知识'})});
  assert.equal(knowledge.status,200);const k=await knowledge.json();
  assert.equal(k.concept,'均方根误差 RMSE');
  const thought=await fetch(url+'/api/thinking-update',{method:'POST',headers,body:JSON.stringify({topic:'多星定位',conversation:[{role:'student',text:'我觉得定位精度会提高，但尚未完成多星统一条件比较',ts:123456789}],existingNodes:[]})});
  assert.equal(thought.status,200);const t=await thought.json();
  assert.equal(t.nodes.length,1,'hallucinated student quote must be rejected');
  assert.ok(t.nodes[0].quote.includes('尚未完成多星统一条件比较'));
  const reject=await fetch(url+'/api/knowledge-support',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert.equal(reject.status,401);
  console.log('PASS: health, knowledge support, sourced thinking nodes, fake quote rejection, access code');
}finally{child.kill();mock.close();}
