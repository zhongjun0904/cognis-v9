/* COGNIS V10 · knowledge guidance and evidence-linked thinking */
(function(){
'use strict';
const SESSION_KEY='cognis_strategy_flow_local_v1',TREE_KEY='cognis_v10_thinking_trees_v1';
const $=id=>document.getElementById(id), esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f}catch{return f}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const studentOnly=m=>m?.agent==='student', ai=()=>typeof AI_CONNECTED!=='undefined'&&AI_CONNECTED===true;
const data=()=>read(SESSION_KEY,{}),date=n=>new Date(n||Date.now()).toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
const currentId=d=>{const first=(d.messages||[]).find(studentOnly);return first?'session_'+(first.ts||0)+'_'+String(first.text||'').slice(0,30):null};
const labels={claim:'研究判断',question:'需要回答的问题',evidence:'证据与观察',assumption:'待核实的前提',decision:'阶段性判断',revision:'想法的修正',action:'下一步行动',knowledge:'补充知识'};
const SAMPLE=[
{id:'s1',type:'claim',title:'认为卫星数量越多定位越准确',quote:'我觉得卫星越多，定位精度一定越高',detail:'学生提出的初步假设，尚未完成对照实验。'},
{id:'s2',type:'question',title:'用什么指标衡量定位效果？',quote:'我打算比较质心位置 RMSE',detail:'明确了可测量的定位误差指标。',parentId:'s1'},
{id:'s3',type:'evidence',title:'现有数据不足以完成比较',quote:'现在只有单星的五次仿真',detail:'多星数据尚未统一条件；目前不能直接比较。',parentId:'s2'},
{id:'s4',type:'assumption',title:'时间同步也可能影响结果',quote:'时间同步和特征匹配也可能有影响',detail:'进一步识别需要控制和验证的条件。',parentId:'s3'},
{id:'s5',type:'revision',title:'重新考虑绝对化判断',quote:'保留不支持原判断的结果',detail:'愿意检验可能推翻初始假设的证据。',parentId:'s1',relation:'revises'},
{id:'s6',type:'action',title:'分别调整同步误差与卫星数量',quote:'分别改变同步误差和卫星数量',detail:'提出下一步对照实验的方向。',parentId:'s4'}
];
let sample=false,recordId=null,selected='',zoom=1,working=false,lastKnowledge='',lastThinking='',knowledgePending=false;
function activeSession(){return !($('sfConnectionState')?.textContent||'').includes('教学示例');}
function tree(){if(sample)return {id:'sample',nodes:SAMPLE};const id=recordId||currentId(data()),all=read(TREE_KEY,{});return {id,nodes:id&&Array.isArray(all[id])?all[id]:[]};}
function persist(id,nodes){const all=read(TREE_KEY,{});all[id]=nodes.slice(-70);const ks=Object.keys(all);if(ks.length>55)ks.slice(0,ks.length-55).forEach(k=>delete all[k]);save(TREE_KEY,all);badge();}
function badge(){const b=$('v10TreeCount'),id=currentId(data()),all=read(TREE_KEY,{});if(b)b.textContent=String((all[id]||[]).length);}
function note(text){const thread=$('sfThread');if(!thread)return;const el=document.createElement('section');el.className='v10-knowledge';el.textContent=text;thread.append(el);thread.scrollTop=thread.scrollHeight;}
function card(a){const thread=$('sfThread');if(!thread)return;const el=document.createElement('section');el.className='v10-knowledge';el.setAttribute('role','region');el.setAttribute('aria-label','知识学习支持');
const terms=(Array.isArray(a.related)?a.related:[]).slice(0,4).map(v=>'<span>'+esc(v)+'</span>').join('');
el.innerHTML='<div class="v10-kicker">✦ 相关知识 · AI 辅助解释</div><strong>'+esc(a.concept||'与你的问题有关的知识')+'</strong><p>'+esc(a.explanation||'目前还没有足够信息解释这一概念')+'</p>'+(a.whyRelevant?'<p style="color:#55718f">和你的问题有什么关系：'+esc(a.whyRelevant)+'</p>':'')+(terms?'<div class="v10-terms">'+terms+'</div>':'')+'<div class="v10-links"><a href="https://ocw.mit.edu/search/" target="_blank" rel="noopener noreferrer">MIT 开放课程</a><a href="https://arxiv.org/search/" target="_blank" rel="noopener noreferrer">arXiv 论文检索</a><a href="https://www.nasa.gov/learning-resources/" target="_blank" rel="noopener noreferrer">NASA 学习资源</a></div><small>以上是可信公开资源平台的搜索入口，不代表系统已查到或验证了某一篇具体文献。</small><button class="v10-back">把学到的知识带回研究</button>';
el.querySelector('.v10-back').onclick=()=>{const x=$('sfInput');if(x){x.value=a.returnQuestion||'了解这个知识后，我该怎样重新核实我的研究判断？';x.focus()}};
thread.append(el);el.scrollIntoView({block:'nearest',behavior:'smooth'});
const d=data(),id=currentId(d),last=(d.messages||[]).filter(studentOnly).at(-1);
if(id&&last&&a.concept){const all=tree().nodes;all.push({id:'k_'+Date.now(),type:'knowledge',title:String(a.concept).slice(0,65),detail:String(a.explanation||'').slice(0,500),quote:last.text.slice(0,300),sourceTs:last.ts,parentId:all.at(-1)?.id||null,origin:'knowledge',createdAt:Date.now()});persist(id,all);}
}
async function learn(force=false){if(working||!activeSession())return;const d=data(),last=(d.messages||[]).filter(studentOnly).at(-1);if(!last)return;
const key=currentId(d)+':'+last.ts;if(!force&&lastKnowledge===key)return;lastKnowledge=key;working=true;
const loading=document.createElement('div');loading.className='v10-knowledge';loading.textContent='正在整理你可能需要的相关知识…';$('sfThread')?.append(loading);
try{if(!ai())throw Error('当前为离线演示。请连接真实 AI 服务后再获取针对性知识。');
const a=await window.COGNIS_API.call('knowledge-support',{topic:d.topic||'',question:last.text,conversation:(d.messages||[]).slice(-12).map(m=>({role:studentOnly(m)?'student':'assistant',text:m.text})),force});
loading.remove();if(currentId(data())!==currentId(d)||!activeSession())return;if(a.needsHelp===false){if(force)note('目前更适合继续讨论研究问题，不必强行补充知识。');return;}card(a);
}catch(e){loading.textContent='知识支持暂时不可用：'+String(e.message||e);lastKnowledge='';}finally{working=false;}}
async function refresh(force=false){if(!activeSession()||sample||recordId)return;
const d=data(),id=currentId(d),students=(d.messages||[]).filter(studentOnly);if(!id||!students.length)return;
const key=id+':'+students.at(-1).ts;if(!force&&key===lastThinking)return;lastThinking=key;
if(!ai()){if(force)note('离线演示不对你的思考过程自动作推断；连接 AI 后可生成真实思维节点。');return;}
try{const old=tree().nodes,a=await window.COGNIS_API.call('thinking-update',{topic:d.topic||'',conversation:(d.messages||[]).slice(-30).map(m=>({role:studentOnly(m)?'student':'assistant',text:m.text,ts:m.ts})),existingNodes:old.slice(-22).map(n=>({id:n.id,type:n.type,title:n.title,quote:n.quote}))});
if(currentId(data())!==id)return;const nodes=tree().nodes;let count=0;for(const n of (Array.isArray(a.nodes)?a.nodes:[])){
if(!labels[n.type]||n.type==='knowledge')continue;const quote=String(n.quote||'').trim(),src=students.find(m=>quote.length>=4&&m.text.includes(quote));if(!src||!n.title||nodes.some(v=>v.quote===quote&&v.title===n.title&&v.type===n.type))continue;
const parentId=nodes.some(v=>v.id===n.parentId)?n.parentId:nodes.at(-1)?.id||null;
nodes.push({id:'t_'+Date.now()+'_'+count++,type:n.type,title:String(n.title).slice(0,75),detail:String(n.detail||'').slice(0,500),quote,sourceTs:src.ts,parentId,relation:n.relation,origin:'ai',createdAt:Date.now()});}
if(count){persist(id,nodes);if($('v10Overlay')?.classList.contains('open'))draw();}else if(force)note('没有发现新的、能回指学生原话的关键思考节点。');
}catch(e){if(force)note('暂时无法更新思维路径：'+String(e.message||e));lastThinking='';}}
function modal(){if($('v10Overlay'))return;
const el=document.createElement('section');el.id='v10Overlay';el.className='v10-overlay';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','科研思维路径');
el.innerHTML='<div class="v10-panel"><header class="v10-header"><div><h2>我的科研思维路径</h2><p>沿着研究判断、证据和思路修正，回看自己的决策过程</p></div><div class="v10-tools"><button class="v10-btn" id="v10Minus" aria-label="缩小">－</button><button class="v10-btn" id="v10Plus" aria-label="放大">＋</button><button class="v10-btn" id="v10Update">更新思路</button><button class="v10-btn v10-primary" id="v10Close">返回</button></div></header><div class="v10-workspace"><div class="v10-map" id="v10Map"><div id="v10Board" class="v10-board"></div></div><aside id="v10Detail" class="v10-detail"><h3>思维节点</h3><p>选择节点，查看它对应的学生原话。</p></aside></div><footer class="v10-footer">AI 分类仅供思考回顾，不能用于直接评定科研能力。教学样例与个人讨论严格区分。</footer></div>';
document.body.append(el);$('v10Close').onclick=close;$('v10Update').onclick=()=>refresh(true);$('v10Plus').onclick=()=>{zoom=Math.min(1.5,zoom+.15);draw()};$('v10Minus').onclick=()=>{zoom=Math.max(.65,zoom-.15);draw()};el.addEventListener('click',e=>{if(e.target===el)close()});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&el.classList.contains('open'))close()});}
function open(which){recordId=null;sample=which==='sample';if(which&&typeof which==='object'){sample=!!which.sample;const first=(which.messages||[]).find(studentOnly);recordId=first?'session_'+(first.ts||0)+'_'+String(first.text||'').slice(0,30):null;}
if(!which&&!activeSession())sample=true;zoom=1;selected='';modal();$('v10Overlay').classList.add('open');$('v10Update').hidden=sample||!!recordId;draw();}
function close(){$('v10Overlay')?.classList.remove('open');sample=false;recordId=null;}
function detail(n){const target=$('v10Detail');if(!target)return;
target.innerHTML='<h3>'+esc(n.title)+'</h3><div style="font-size:12px;color:#367bc8">'+esc(labels[n.type])+'</div><p>'+esc(n.detail||'这段内容来自当前科研对话。')+'</p><strong style="font-size:13px">学生当时的原话</strong><blockquote>'+esc(n.quote||'')+'</blockquote><small>'+esc(date(n.sourceTs))+' · '+(sample?'虚构教学案例':n.origin==='ai'?'AI 整理，尚待核对':'学生知识学习记录')+'</small><button class="v10-btn" id="v10Locate">回到原文</button>';
$('v10Locate').onclick=()=>{close();if(sample||recordId)return;const nodes=[...document.querySelectorAll('#sfThread .sf-message.user .sf-bubble')],m=nodes.find(x=>x.textContent.includes(n.quote));if(m)m.scrollIntoView({behavior:'smooth',block:'center'});else note('这条原文来自历史讨论，请到历史探索查看。')};}
function draw(){const {nodes}=tree(),board=$('v10Board');if(!board)return;board.replaceChildren();
if(!nodes.length){board.innerHTML='<div class="v10-empty"><div style="font-size:50px">✦</div><h3>思维路径还没有记录</h3><p>通过真实对话积累研究判断、证据和修正后，可逐步生成。没有证据时不会凭空画图。</p><button class="v10-btn" id="v10Sample">查看虚构示例</button></div>';$('v10Sample').onclick=()=>open('sample');return;}
const xgap=286,ygap=162,w=Math.max(730,100+Math.ceil(nodes.length/3)*xgap),h=620;
board.style.width=w*zoom+'px';board.style.height=h*zoom+'px';
const inner=document.createElement('div');inner.style.cssText='position:relative;width:'+w+'px;height:'+h+'px;transform:scale('+zoom+');transform-origin:top left';
const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('width',w);svg.setAttribute('height',h);svg.style.cssText='position:absolute;top:0;left:0;pointer-events:none';
const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.innerHTML='<marker id="v10arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10z" fill="#8bb8ed"/></marker>';svg.append(defs);
const pos=nodes.map((_,i)=>({x:35+Math.floor(i/3)*xgap,y:45+(i%3)*ygap}));
nodes.forEach((n,i)=>{const j=nodes.findIndex(p=>p.id===n.parentId);if(j<0)return;const a=pos[j],b=pos[i],same=a.x===b.x;const x1=same?a.x+105:a.x+210,y1=same?a.y+108:a.y+55,x2=same?b.x+105:b.x,y2=same?b.y:b.y+55;
const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M'+x1+','+y1+' C'+(x1+(same?0:40))+','+(y1+20)+' '+(x2-(same?0:40))+','+(y2-20)+' '+x2+','+y2);path.setAttribute('stroke',n.relation==='challenges'?'#dbaa74':'#93bce8');path.setAttribute('stroke-width','2');path.setAttribute('fill','none');path.setAttribute('marker-end','url(#v10arrow)');svg.append(path)});
inner.append(svg);nodes.forEach((n,i)=>{const btn=document.createElement('button');btn.type='button';btn.className='v10-node'+(n.id===selected?' active':'');btn.dataset.type=n.type;btn.style.left=pos[i].x+'px';btn.style.top=pos[i].y+'px';btn.innerHTML='<small>'+esc(labels[n.type]||'科研记录')+'</small><strong>'+esc(n.title)+'</strong><em>'+esc(date(n.sourceTs))+'</em>';btn.onclick=()=>{selected=n.id;draw()};inner.append(btn)});board.append(inner);const n=nodes.find(x=>x.id===selected)||nodes.at(-1);selected=n.id;detail(n);}
function controls(){const btn=$('sfNotesBtn');if(!btn||$('v10TreeOpen'))return;const t=document.createElement('button');t.id='v10TreeOpen';t.type='button';t.className='sf-lite-btn';t.innerHTML='✦ 思维路径 <span id="v10TreeCount">0</span>';t.onclick=()=>open();btn.insertAdjacentElement('afterend',t);badge();}
function quick(){const el=$('sfQuick'),d=data();if(!el||el.querySelector('#v10Learn')||!activeSession()||!(d.messages||[]).some(studentOnly))return;const b=document.createElement('button');b.id='v10Learn';b.type='button';b.className='sf-chip';b.textContent='补充相关知识';b.onclick=()=>learn(true);el.append(b);}
function historyAction(){const target=$('cxHistoryDetail');if(!target||target.querySelector('#v10HistoryOpen')||!$('cxCenter')?.classList.contains('open'))return;const actions=target.querySelector('.cx-record-actions');if(!actions)return;const selectedBtn=$('cxHistoryItems')?.querySelector('.cx-history-item.sel');const m=selectedBtn?.getAttribute('onclick')?.match(/cxSelectHistory\('([^']+)'\)/);let d=null;
if(m?.[1]==='current')d=data();else if(m?.[1])d=read('cognis_strategy_archive_v11',[]).find(x=>x.id===m[1]);if(!d?.messages?.some(studentOnly))return;
const b=document.createElement('button');b.id='v10HistoryOpen';b.type='button';b.className='cx-btn';b.textContent='查看这次思维路径';b.onclick=()=>open(d);actions.append(b);}
function growthAction(){const p=$('cxPage');if(!p||p.querySelector('#v10GrowthOpen')||!$('cxCenter')?.classList.contains('open'))return;const title=p.querySelector('.cx-page-title');if(!title||!title.textContent.includes('一步步想清楚'))return;const b=document.createElement('button');b.className='cx-btn';b.id='v10GrowthOpen';b.textContent='✦ 查看思维决策路径';b.onclick=()=>open();title.insertAdjacentElement('afterend',b);}
function onMessage(event){const m=event.detail?.message;if(!m||m.demo||!activeSession())return;if(studentOnly(m)){knowledgePending=/(不懂|不理解|不了解|不清楚|没学过|知识盲区|什么是|什么意思|讲解|解释一下|基本原理|基础知识|如何理解)/.test(m.text);return;}
if(!/服务未能完成回复|连接异常/.test(m.text||'')){if(knowledgePending){knowledgePending=false;setTimeout(()=>learn(false),150)}const n=(data().messages||[]).filter(studentOnly).length;if(n>=2&&n%2===0&&ai())setTimeout(()=>refresh(false),300);}}
function init(){controls();quick();document.addEventListener('cognis-strategy:open',()=>setTimeout(()=>{controls();quick();badge()},25));document.addEventListener('cognis-v10-message',onMessage);
const quickRoot=$('sfQuick');if(quickRoot)new MutationObserver(quick).observe(quickRoot,{childList:true});const page=$('cxPage');if(page)new MutationObserver(()=>{historyAction();growthAction()}).observe(page,{childList:true,subtree:true});document.addEventListener('cognis-history-updated',badge);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();