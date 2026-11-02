/* Grok Bot desk – iPhone web app. Plain JS. All data goes through ONE adapter (Data). No secrets in this file. */
(()=>{
const Q=new URLSearchParams(location.search),H=new URLSearchParams(location.hash.slice(1));
if(H.get('t'))localStorage.setItem('desk_token',H.get('t'));
if(H.get('d'))localStorage.setItem('desk_data',H.get('d'));
if(H.get('t')||H.get('d'))history.replaceState(null,'',location.pathname+location.search);
const DEMO=Q.get('demo')==='1',FORCE=Q.get('state'); // ?state=loading|empty|error – screenshot/testing aid
const RM=Charts.RM,$=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const usd=(v,d=2)=>v==null?'n/a':(v<0?'-':'')+'$'+Math.abs(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const kusd=v=>v==null?'n/a':v>=1e6?'$'+(v/1e6).toFixed(2)+'M':v>=1e3?'$'+(v/1e3).toFixed(1)+'K':'$'+Math.round(v);
const pct=(v,d=2)=>v==null?'n/a':(v>=0?'+':'')+v.toFixed(d)+'%';
const short=m=>m?m.slice(0,4)+'...'+m.slice(-3):'';
const hhmm=t=>{const d=new Date(t);return isNaN(d)?'':d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})};
const toast=m=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)};

/* Demo only: same format as links.py (r=savipww). The ONLY place a FOMO URL is built in web/. */
function demoFomoLink(kind,arg){const REF='savipww';
 if(kind==='coin')return arg?`https://fomo.family/coin?address=${arg}&chainId=1399811149&r=${REF}&source=share_link`:`https://fomo.family/r/${REF}`;
 if(kind==='profile')return `https://fomo.family/profile/${arg}?source=share_link&r=${REF}`;
 return `https://fomo.family/r/${REF}`;}

/* ================= Adapter ================= */
const Data=(()=>{const token=localStorage.getItem('desk_token'),dpath=localStorage.getItem('desk_data');
 const mode=DEMO?'demo':token?'api':'file';if(mode==='file')document.documentElement.classList.add('ro'); /* static Pages site: read-only */const subs=[];let es,timer;
 async function get(name){
  if(mode==='demo')return Demo.get(name,FORCE==='empty');
  if(mode==='api'){const r=await fetch('/api/'+name,{headers:{Authorization:'Bearer '+token},cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
  if(mode==='file'){const r=await fetch(dpath?`/d/${encodeURIComponent(dpath)}/${name}.json`:`data/${name}.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
  throw Error('not connected');}
 async function send(action,body){ // settings, pause, mode, test push
  if(mode==='demo'){Demo.apply(action,body);return{ok:true};}
  if(mode!=='api')throw Error('read-only');
  const r=await fetch('/api/'+action,{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok)throw Error('HTTP '+r.status);return r.json();}
 function subscribe(fn){subs.push(fn);
  if(mode==='api'&&window.EventSource){es=new EventSource('/api/stream?token='+encodeURIComponent(token));
   const h=t=>e=>{let m={};try{m=JSON.parse(e.data)}catch{}m.type=t;subs.forEach(f=>f(m))};
   es.onmessage=h('update');es.addEventListener('audit_layer',h('audit_layer'));}
  if(mode==='file'||mode==='api')timer=setInterval(()=>subs.forEach(f=>f({type:'tick'})),mode==='file'?60000:15000);}
 return{get,send,subscribe,mode};})();

/* ================= Example data (demo only, labelled) ================= */
const Demo=(()=>{const now=Date.now(),start=now-5.5*36e5,M='7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',M2='Fq3bnXk9WqZt4PZ8mVxL2eR5uYc1oQsHjD6aKpNvpump',M3='9fQxR2mLkA7bC3dE4fG5hJ6kL7mN8pQ1rS2tU3vT2a';
 const eq=[];let v=1000;for(let i=0;i<=66;i++){v+=Math.sin(i/7)*3+(i>25?2.2:-.6)+((i*7919)%11-5)*.5;eq.push({t:start+i*3e5,v:+v.toFixed(2)});}
 const cd=[];let p=.000412;for(let i=0;i<54;i++){const o=p;p*=1+Math.sin(i/5)*.025+(i>22?.011:-.004);cd.push({t:now-(54-i)*6e4,o,c:p,h:Math.max(o,p)*1.01,l:Math.min(o,p)*.99,v:800+((i*37)%17)*260});}
 const L=(n,name,v,src,pass=true)=>({n,name,pass,value:v,source:src});
 const okLayers=[L(1,'Mint authority','Revoked','rpc'),L(2,'Freeze authority','Revoked','rpc'),L(3,'Dev wallet','0.9% · sold 0','rpc'),L(4,'Top 10 holders','16.8%','rpc'),
  L(5,'Liquidity','100% burned','rugcheck'),L(6,'Pool age','43m','rpc'),L(7,'Bundled wallets','None','rugcheck'),L(8,'Delegations','None','rpc')];
 const badLayers=[L(1,'Mint authority','Revoked','rpc'),L(2,'Freeze authority','Revoked','rpc'),L(3,'Dev wallet','dev holds 31%','rpc',false)];
 const dec=(m,n,vd,rs,mins)=>({ts:new Date(now-mins*6e4).toISOString(),mint:m,name:n,verdict:vd,reason:rs,coin_url:demoFomoLink('coin',m)});
 const settings={scanner:{min_liquidity_usd:40000,max_top10_pct:25,max_h1_change_pct:80,poll_s:60,min_pool_age_min:10,max_wait_min:60,runner_h24_pct:300},
  auditor:{enabled:true,max_dev_pct:5,max_top10_pct:25,min_lp_locked_pct:99,min_pool_age_min:10,max_bundled:5,max_delegated_accounts:10,retries:3},
  analyst:{alive_volume_h1:25000,organic_buys_h1:150,bundled_penalty:.5,flush_drop_m5_pct:5,chase_h1_pct:80,min_alive_6h:.7,min_organic:.65,max_chase:.3,min_score:70},
  executor:{stack_pct:8,max_pool_pct:2,min_ticket_usd:47.5,below_min:'bump',recheck_liq_drop_pct:20,recheck_price_up_pct:15},
  risk:{poll_s:15,stop_pct:6,trail_start_pct:20,trail_pct:12,timeout_h:3,timeout_min_gain_pct:5}};
 const S={mode:'PAPER',example:true,updated:new Date(now-8e3).toISOString(),night_start:start,balance:v,night_start_balance:160,today_pct:(v/1000-1)*100,
  equity:eq,marks:[{t:eq[20].t,label:'Bought BONKO',kind:'buy'},{t:eq[24].t,label:'Bought WIFHAT',kind:'buy'},{t:eq[38].t,label:'+$14.20',kind:'win'},{t:eq[12].t,label:'-6% · -$4.80',kind:'loss'}],
  unread_pushes:2,coins:[{mint:M,name:'WIFHAT',symbol:'WIFHAT'},{mint:M2,name:'BONKO',symbol:'BONKO'},{mint:M3,name:'PEPE2',symbol:'PEPE2'}],
  agents:{scanner:{running:true,today:214,pools:214,feed:[{name:'WIFHAT',verdict:'pass',liquidityUsd:52100},{name:'XMAS CAT',verdict:'kill',reason:'liq $17.6K'},{name:'TRUMPDOG',verdict:'kill',reason:'top 10 hold 38%'},{name:'BONK2',verdict:'kill',reason:'copycat of BONK'}],
    decisions:[dec(M,'WIFHAT','pass','→ auditor',4),dec(M3,'PEPE2','pass','→ auditor',22),dec(M2,'XMAS CAT','kill','liq $17.6K',25),dec(M2,'TRUMPDOG','kill','top 10 hold 38%',31)]},
   auditor:{running:true,busy:false,today:7,taken:7,rejected:5,strips:okLayers.map(()=>'ok'),last:'8/8 → Executor',decisions:[dec(M,'WIFHAT','pass','8/8 → Executor',3),dec(M3,'PEPE2','reject','dev holds 31%',21)]},
   analyst:{running:true,today:2,mode:'rules',last_score:78,decisions:[dec(M,'WIFHAT','pass','score 78',3),dec(M2,'MOONCAT','reject','chase 0.62',40)]},
   executor:{running:true,today:2,trades:2,last_size:80,last_pct:8,progress:100,decisions:[dec(M,'WIFHAT','bought','$80.00 · 8% of stack',3)]},
   risk:{running:true,today:2,open:1,last_exit:'Trailed out',decisions:[dec(M2,'BONKO','trail','+$14.20 · +17.8%',15),dec(M2,'DOGGO','stop','-6% stop · -$4.80',66)]}},
  positions:[{mint:M,name:'WIFHAT',size:80}],
  activity:[{ts:new Date(now-2e5).toISOString(),kind:'buy',title:'Bought WIFHAT',sub:'Executor · '+hhmm(now-2e5),right:'$80.00 · 8% of stack',mint:M},
   {ts:'',kind:'sell',title:'Sold BONKO',sub:'Risk · trailing stop',right:'+$14.20 · +17.8%',mint:M2},
   {ts:'',kind:'reject',title:'Rejected PEPE2',sub:'Auditor · dev holds 31%',right:'Skipped',mint:M3},
   {ts:'',kind:'reject',title:'Rejected MOONCAT',sub:'Analyst (rules) · chase 0.62',right:'Skipped',mint:M3},
   {ts:'',kind:'stop',title:'Stopped DOGGO',sub:'Risk · -6% stop',right:'-$4.80',mint:M2},
   {ts:'',kind:'reject',title:'Rejected FROGZ',sub:'Auditor · freeze not revoked',right:'Skipped',mint:M3}],
  settings,account:{handle:'scottishh',profile_url:demoFomoLink('profile','scottishh'),signup_url:demoFomoLink('signup'),stack:1240,telegram:{connected:true,bot:'@GrokTrading123bot'}}};
 const coin={mint:M,name:'WIFHAT',symbol:'WIFHAT',age_h:11,price:cd[53].c,since_entry_pct:(cd[53].c/.000431-1)*100,candles:cd,
  stop_line:Math.max(...cd.map(k=>k.h))*.88,mcap:412000,liq:52100,vol24:1.28e6,holders:1834,coin_url:demoFomoLink('coin',M),
  audit:{passed:true,layersChecked:8,layers:okLayers,reason:null},executor_size:80,
  position:{size:80,entry:.000431,stop_line:.000431*.94,trail_line:Math.max(...cd.map(k=>k.h))*.88,trail_active:true,timeout_at:now+1.3*36e5}};
 const rej={...coin,mint:M3,name:'PEPE2',symbol:'PEPE2',coin_url:demoFomoLink('coin',M3),audit:{passed:false,layersChecked:3,layers:badLayers,reason:'dev holds 31%'},position:null,holders:null};
 const EMPTY={...S,equity:[],marks:[],positions:[],activity:[],unread_pushes:0,balance:1000,night_start_balance:1000,today_pct:0,
  agents:{scanner:{running:true,today:0,pools:0,feed:[],decisions:[]},auditor:{running:true,today:0,taken:0,rejected:0,strips:[],decisions:[]},analyst:{running:true,today:0,mode:'rules',last_score:null,decisions:[]},executor:{running:true,today:0,trades:0,decisions:[]},risk:{running:true,today:0,open:0,decisions:[]}}};
 return{get:(n,empty)=>Promise.resolve(n==='state'?(empty?EMPTY:S):n.startsWith('audit/')?(empty?{...coin,audit:null}:n.endsWith(M3)?rej:coin):(empty?{...coin,candles:[],position:null,since_entry_pct:null}:n.endsWith(M3)?rej:coin)),
  apply:(a,b)=>{if(a==='settings')S.settings[b.agent][b.key]=b.value;if(a==='pause')S.agents[b.agent].running=!b.paused;if(a==='mode')S.mode=b.mode;}};})();

/* ================= State / routing ================= */
const V=$('#view');let S=null,C=null,lastOk=null,fail=0,retryAt=0,range='LIVE';
let route={s:Q.get('s')||'home',m:Q.get('m')};
function go(s,m){route={s,m};const q=new URLSearchParams(Q);q.set('s',s);m?q.set('m',m):q.delete('m');history.pushState(route,'','?'+q);scrollTo(0,0);load();}
onpopstate=e=>{route=e.state||{s:'home'};load();};
$$('.tabs a').forEach(a=>a.onclick=()=>go(a.dataset.s));
document.addEventListener('click',e=>{const t=e.target.closest('[data-go]');if(t&&!e.target.closest('a[href]')){e.preventDefault();go(t.dataset.go,t.dataset.m||undefined);}});

/* ---------- odometer: changed digits roll 600ms ease-out, 30ms stagger right to left ---------- */
const odoPrev={};
const odo=(key,str)=>`<span class="odo" data-odo="${key}" data-v="${esc(str)}">${[...str].map(ch=>/\d/.test(ch)?`<span class="d"><span class="col">${'0123456789'.split('').map(n=>`<span>${n}</span>`).join('')}</span></span>`:`<span>${esc(ch)}</span>`).join('')}</span>`;
function runOdo(){$$('[data-odo]').forEach(el=>{const k=el.dataset.odo,nv=el.dataset.v,ov=odoPrev[k];odoPrev[k]=nv;
 const cols=[...el.querySelectorAll('.col')],nd=[...nv].filter(c=>/\d/.test(c)),od=ov&&ov.length===nv.length?[...ov].filter(c=>/\d/.test(c)):null;
 cols.forEach((c,i)=>{const to=+nd[i],from=od?+od[i]:to;c.style.transition='none';c.style.transform=`translateY(${-from*1.05}em)`;
  if(from!==to&&!RM){void c.offsetHeight;c.style.transition='';c.style.transitionDelay=(cols.length-1-i)*30+'ms';c.style.transform=`translateY(${-to*1.05}em)`;}
  else c.style.transform=`translateY(${-to*1.05}em)`;});});}

/* ---------- states ---------- */
function offlineRow(){const el=$('#offline');if(!fail||Data.mode==='demo'&&FORCE!=='error'){el.hidden=true;return;}
 const n=Math.max(0,Math.ceil((retryAt-Date.now())/1000));el.hidden=false;
 el.textContent=`Desk offline · retrying in ${n}s · last update ${lastOk?hhmm(lastOk):'never'}`;}
setInterval(()=>{if(FORCE==='error'&&retryAt<Date.now())retryAt=Date.now()+15000;offlineRow();},1000);
const sk=(h,extra='')=>`<div class="sk" style="height:${h}px;${extra}"></div>`;
const SKEL={home:()=>`<div style="height:52px"></div>${sk(70,'width:70%')}${sk(22,'width:40%')}${sk(200)}${sk(44)}${sk(28,'width:50%')}<div class="sk" style="width:var(--cw);aspect-ratio:504/470;border-radius:calc(var(--cw)*42/504)"></div>${sk(300)}`,
 agents:()=>`${sk(44,'width:50%;margin-top:8px')}${[1,2,3].map(()=>sk(320)).join('')}`,activity:()=>`${sk(44,'width:50%;margin-top:8px')}${sk(480)}`,
 auditor:()=>`${sk(44,'width:30%')}${sk(250,'width:220px;margin:0 auto')}${sk(54)}${sk(400)}${sk(50)}`,coin:()=>`${sk(44,'width:30%')}${sk(60)}${sk(70,'width:60%')}${sk(260)}${sk(130)}${sk(110)}${sk(50)}`,account:()=>`${sk(44,'width:50%;margin-top:8px')}${sk(44)}${sk(150)}${sk(900)}`};

async function load(){
 if(!S||FORCE==='loading'||(route.s==='coin'||route.s==='auditor')&&C?.mint!==route.m)V.innerHTML=(SKEL[route.s]||SKEL.home)();
 tabs();if(FORCE==='loading')return;
 try{const ns=await Data.get('state');let nc=null;
  if(route.s==='coin'||route.s==='auditor')nc=await Data.get((route.s==='coin'?'coin/':'audit/')+(route.m||'latest'));
  if(FORCE==='error'){S=ns;C=nc;lastOk=Date.parse(ns.updated)||Date.now();throw Error('forced');}
  S=ns;C=nc;fail=0;lastOk=Date.now();}
 catch(e){fail++;retryAt=Date.now()+(FORCE==='error'?15000:Math.min(60,5*2**(fail-1))*1000);setTimeout(()=>{if(fail&&FORCE!=='error')load()},retryAt-Date.now());}
 offlineRow();if(S)paint();}
function tabs(){const s=route.s==='coin'||route.s==='auditor'?'home':route.s;$$('.tabs a').forEach(a=>a.classList.toggle('on',a.dataset.s===s));}
let demoTag;function paint(){if((DEMO||S.example)&&!demoTag){demoTag=document.createElement('div');demoTag.className='demo';demoTag.textContent='Example data';document.body.appendChild(demoTag);}
 if((route.s==='coin'||route.s==='auditor')&&!C){V.innerHTML=SKEL[route.s]();return;}
 V.innerHTML=(screens[route.s]||screens.home)();runOdo();after[route.s]?.();}

/* ================= Screens ================= */
const ACT_GO=a=>a.kind==='reject'?'auditor':'coin';
const actRow=a=>`<div class="row" data-go="${ACT_GO(a)}" data-m="${esc(a.mint||'')}"><div class="l"><div class="t">${esc(a.title)}</div><div class="st">${esc(a.sub)}</div></div><div class="rv ${a.kind==='sell'?'g':a.kind==='stop'?'r':a.kind==='reject'?'s3':''}">${esc(a.right)}</div></div>`;
const isPaper=()=>S.mode!=='LIVE';
const COL={scanner:'#64d2ff',auditor:'#fff',analyst:'#ffd60a',executor:'#00d35a',risk:'#ff6b9a'};
const NAMES={scanner:'Scanner',auditor:'Auditor',analyst:'Analyst',executor:'Executor',risk:'Risk'};
const ORDER=['scanner','auditor','analyst','executor','risk'];

function card(k){const a=S.agents[k]||{},st=S.settings,dot=`<i style="background:${COL[k]}"></i>`;
 if(k==='scanner')return `<div class="acard"><div class="an">${dot}Scanner</div><div class="av" style="color:${COL.scanner}">${a.pools??0} pools</div>
  <div class="feed">${(a.feed||[]).length?a.feed.slice(0,5).map(f=>f.verdict==='pass'?`<div><span>${esc(f.name)} · liq ${kusd(f.liquidityUsd)}</span><span class="s2">→ auditor</span></div>`:`<div class="kill"><span class="nm">${esc(f.name)}</span><span class="rs">${esc(f.reason)}</span></div>`).join(''):'<div class="s2">Listening for graduations</div>'}</div></div>`;
 if(k==='auditor')return `<div class="acard" data-go="auditor" data-m="${esc(a.mint||'')}"><div class="an">${dot}Auditor</div><div class="av">${a.taken??0} taken apart</div>
  <div class="strips">${Array.from({length:8},(_,i)=>`<i class="${(a.strips||[])[i]||''}"></i>`).join('')}</div>
  <div class="ax">${a.busy?'taking apart...':esc(a.last||'Waiting for Scanner')}</div><div class="foot ax">${a.rejected??0} rejected</div></div>`;
 if(k==='analyst')return `<div class="acard"><div class="an">${dot}Analyst${a.mode==='rules'?' <span class="s3">(rules)</span>':''}</div><div class="av" style="color:${COL.analyst}">Scoring</div>
  <div style="flex:1;display:grid;place-items:center"><canvas data-ring="${a.last_score??''}"></canvas></div></div>`;
 if(k==='executor')return `<div class="acard"><div class="an">${dot}Executor</div><div class="av" style="color:${COL.executor}">${a.trades??0} trades</div>
  <div class="ax">${a.last_size!=null?usd(a.last_size)+' · '+a.last_pct+'% of stack':'No trade yet'}</div>
  <div class="foot"><div class="ax" style="margin-bottom:8px">${a.progress>=100?'<span class="g">✓ Filled</span>':a.progress?'Executing... '+a.progress+'%':'&nbsp;'}</div><div class="bar"><b style="width:${a.progress||0}%"></b></div></div></div>`;
 return `<div class="acard"><div class="an">${dot}Risk</div><div class="av" style="color:${COL.risk}">${a.open?'Guarding':'Idle'}</div>
  <div class="ax">${esc(a.last_exit||'No exit yet')}</div><div class="foot"><span class="pill m rd">stop -${st.risk.stop_pct}%</span> <span class="pill m gr">trail ${st.risk.trail_pct}%</span></div></div>`;}

const RANGES={LIVE:null,'1H':36e5,'4H':144e5,'1D':864e5,'1W':6048e5,ALL:Infinity};
const screens={
 home(){const mult=S.night_start_balance?S.balance/S.night_start_balance:null,run=ORDER.filter(k=>S.agents[k]?.running).length;
  return `<div class="nav"><a class="ib" data-go="account"><span class="avatar">${esc((S.account.handle||'?')[0].toUpperCase())}</span></a>
   <a class="title" data-go="account">Grok Bot<span>›</span></a>
   <button class="ib" id="srchBtn" aria-label="Search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></button>
   <a class="ib" data-go="activity" aria-label="Notifications"><svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/></svg>${S.unread_pushes?'<i class="bdot"></i>':''}</a></div>
   <div id="srch" hidden><input class="search" placeholder="Name, symbol or mint" autocomplete="off"><div class="list" id="srchRes" style="margin-top:8px"></div></div>
   <div><div class="bal" style="flex-wrap:nowrap"><span class="big" id="balN">${odo('bal',usd(S.balance))}</span>${isPaper()?'<span class="pill paper">PAPER</span>':''}</div>
   <div class="bal" style="margin-top:6px"><span class="sub ${S.today_pct>0?'g':S.today_pct<0?'r':''}">${pct(S.today_pct)} today</span>${mult!=null?`<span class="pill mult">${mult.toFixed(2)}×</span>`:''}</div>${Data.mode==='file'&&S.updated?`<div class="s3" style="font-size:13px;margin-top:4px">Last change ${hhmm(S.updated)} · checks every 5 min</div>`:''}</div>
   <div style="position:relative"><canvas id="eq"></canvas>${S.equity.length?'':'<div class="s2" style="position:absolute;left:0;right:0;top:46%;text-align:center;font-size:15px">Waiting for the first trade</div>'}</div>
   <div class="range">${Object.keys(RANGES).map(r=>`<a data-r="${r}" class="${r===range?'on':''}">${r}</a>`).join('')}</div>
   <div class="sh">Agents · ${run} running</div><div class="car">${ORDER.map(card).join('')}</div>
   <div class="sh">Activity<a data-go="activity">See all</a></div>
   <div class="list">${S.activity.length?S.activity.slice(0,5).map(actRow).join(''):'<div class="empty">Nothing yet tonight</div>'}</div>`;},
 agents(){const locked=(S.positions||[]).length>0;return `<div class="h1">Agents</div>`+ORDER.map(k=>{const a=S.agents[k]||{},d=a.decisions||[];
  return `<div class="card" style="padding:0;overflow:hidden"><div class="set" style="min-height:60px"><span class="k" style="font:600 20px var(--disp);display:flex;align-items:center;gap:8px">
   <i style="width:8px;height:8px;border-radius:4px;background:${a.running?'#00d35a':'rgba(235,235,245,.3)'}"></i>${NAMES[k]}<small style="display:inline;margin-left:6px;font:400 15px var(--text);color:var(--sec)">${a.running?'running':'paused'} · ${a.today??0} today</small></span>
   <span class="hit"><button class="sw ${a.running?'on':''} ${k==='risk'&&locked?'lock':''}" data-pause="${k}" aria-label="Pause ${NAMES[k]}"></button></span></div>
   ${k==='risk'&&locked?'<div class="set s3" style="font-size:13px;min-height:28px">Locked while a position is open</div>':''}
   ${d.length?d.slice(0,20).map(x=>`<div class="set" style="font-size:14px"><span class="s3" style="width:42px">${hhmm(x.ts)}</span>
    <a class="k" href="${esc(x.coin_url||'#')}" target="_blank" rel="noopener" style="color:var(--bl);min-height:32px;display:flex;align-items:center">${esc(x.name)}</a>
    <span style="text-align:right;max-width:55%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" class="${/kill|reject|stop/.test(x.verdict)?'r':'g'}">${esc(x.verdict)} <span class="s2">${esc(x.reason)}</span></span></div>`).join('')
    :`<div class="empty" style="padding:16px">${k==='scanner'?'Listening for graduations':'No decisions yet tonight'}</div>`}
   <a class="set" data-go="account" data-m="${k}" style="color:var(--bl);cursor:pointer">Settings<span style="margin-left:auto;color:var(--ter)">›</span></a></div>`;}).join('');},
 activity(){return `<div class="h1">Activity</div><div class="list">${S.activity.length?S.activity.map(actRow).join(''):'<div class="empty">Nothing yet tonight</div>'}</div>`;},
 auditor(){const c=C,a=c.audit;const head=`<a class="back" data-go="home">‹ Home</a>`;
  const tog=`<div class="list"><div class="set"><span class="k">Take apart before buying</span><span class="hit"><button class="sw ${S.settings.auditor.enabled?'on':''}" id="audTog"></button></span></div></div>`;
  if(!a)return head+`<div class="h1">Auditor</div><div class="stack">${Array.from({length:8},(_,i)=>`<div class="disc" style="top:${i*28}px;z-index:${8-i}"></div>`).join('')}</div><div class="empty">No coin taken apart yet</div>`+tog;
  return head+`<div class="h1">${esc(c.name)}</div>
   <div class="stack" id="stack">${Array.from({length:8},(_,i)=>`<div class="disc" id="dk${i}" style="top:${i*28}px;z-index:${8-i}">${esc(LN[i])}</div>`).join('')}<div class="beam" id="beam"></div></div>
   <div class="verdict" id="verdict"></div>
   <div class="list">${Array.from({length:8},(_,i)=>`<div class="lv grey" id="lv${i}"><span class="ic"></span><span>${LN[i]}</span><span class="v">not checked</span></div>`).join('')}</div>
   ${tog}${c.coin_url?`<a class="btn" href="${esc(c.coin_url)}" target="_blank" rel="noopener">Open on FOMO</a>`:''}`;},
 coin(){const c=C,p=c.position,a=c.audit;
  return `<div class="nav"><a class="back" data-go="home" style="flex:1">‹ Home</a>${isPaper()?'<span class="pill paper" style="margin-right:6px">PAPER</span>':''}</div>
   <div><div style="display:flex;align-items:center;gap:10px"><div class="h1" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis">${esc(c.name)}</div>
    <a class="chip ${a?a.passed?'':'bad':'none'}" data-go="auditor" data-m="${esc(c.mint)}" style="min-height:44px;background:none;padding:0"><span class="chip ${a?a.passed?'':'bad':'none'}">🛡 ${a?a.layersChecked+'/8':'–'}</span></a></div>
   <div class="s2">${esc(c.symbol)} · Solana · ${c.age_h!=null?c.age_h+'h old':'age n/a'}</div></div>
   <div><div class="big" style="font-size:66px">${odo('px','$'+Charts.fmtP(c.price))}</div>
   ${c.since_entry_pct!=null&&p?`<div class="sub ${c.since_entry_pct>=0?'g':'r'}">${c.since_entry_pct>=0?'▲':'▼'} ${Math.abs(c.since_entry_pct).toFixed(2)}% since entry</div>`:''}</div>
   ${c.candles.length?`<div><canvas id="cd"></canvas>${c.stop_line&&p?'<div class="legend"><i></i>Risk trailing stop</div>':''}</div>`:'<div class="card empty">Candles start with the first price read</div>'}
   <div class="kv"><div><span>Market cap</span><b>${kusd(c.mcap)}</b></div><div><span>Liquidity</span><b>${kusd(c.liq)}</b></div><div><span>24h volume</span><b>${kusd(c.vol24)}</b></div><div><span>Holders</span><b>${c.holders??'n/a'}</b></div></div>
   ${p?`<div class="list"><div class="set" style="min-height:56px"><span class="k">Your position<small>Executor</small></span><span>${usd(p.size)} in</span></div>
    <div class="set"><span class="k">Stop line</span><span>$${Charts.fmtP(p.stop_line)}</span></div>
    <div class="set"><span class="k">Trail line</span><span>${p.trail_active?'$'+Charts.fmtP(p.trail_line):'not active'}</span></div>
    <div class="set"><span class="k">Time left to timeout</span><span>${tleft(p.timeout_at)}</span></div></div>`:''}
   ${c.coin_url?`<a class="btn ${p?'sell':'buy'}" href="${esc(c.coin_url)}" target="_blank" rel="noopener">${p?'Sell on FOMO':'Buy on FOMO'}</a>`:''}`;},
 account(){const st=S.settings,ac=S.account,ro=Data.mode==='file'||Data.mode==='none';
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  return `<div class="h1">Account</div>
   <div class="seg" id="modeSeg"><a data-mode="PAPER" class="${isPaper()?'on':''}">PAPER</a><a data-mode="LIVE" class="${!isPaper()?'on':''}">LIVE</a></div>
   <div class="list"><div class="set"><span class="k">Stack<small>${isPaper()?'simulated balance in PAPER':'what you set, FOMO can\'t be read'}</small></span><input type="number" id="stack" value="${ac.stack??''}" step="1" ${ro?'disabled':''}></div>
    <a class="set" href="${esc(ac.profile_url)}" target="_blank" rel="noopener"><span class="k">Your FOMO profile<small>@${esc(ac.handle)}</small></span><span class="s3">›</span></a>
    <a class="set" id="invite" style="cursor:pointer"><span class="k" style="color:var(--bl)">Invite a friend</span><span class="s3">›</span></a></div>
   <div class="grp">Notifications</div>
   <div class="list"><div class="set"><span class="k">Telegram<small>${ac.telegram?.connected?'Connected · '+esc(ac.telegram.bot||''):'Not connected'}</small></span>${ro?'':`<button class="btn sec" id="testPush" style="width:auto;min-height:44px;padding:0 14px;font-size:15px" ${ac.telegram?.connected?'':'disabled'}>Send test push</button>`}</div>
    <div class="set"><span class="k">Web push</span>${Data.mode==='file'?'<span class="s2" style="font-size:14px">Unavailable · Telegram only</span>':standalone?'<button class="btn sec" id="wpush" style="width:auto;min-height:44px;padding:0 14px;font-size:15px">Enable notifications</button>':'<span class="s2" style="font-size:14px">Add to Home Screen first</span>'}</div></div>
   ${ro?'<div class="s2" style="font-size:13px;padding:0 16px">Read-only here. Change settings from Telegram.</div>':''}
   ${ORDER.map(k=>`<div class="grp" id="set-${k}">${NAMES[k]}${k==='analyst'?' (rules)':''}</div><div class="list">${Object.entries(st[k]).map(([key,v])=>setRow(k,key,v,ro)).join('')}</div>`).join('')}`;}};
const LN=['Mint authority','Freeze authority','Dev wallet','Top 10 holders','Liquidity','Pool age','Bundled wallets','Delegations'];
const tleft=t=>{const ms=t-Date.now();if(!(ms>0))return'0m';const h=Math.floor(ms/36e5),m=Math.round(ms%36e5/6e4);return(h?h+'h ':'')+m+'m';};
const RANGE_MAX={usd:[0,200000],pct:[0,100],s:[5,300],min:[0,180],h:[1,24],n:[0,50],r:[0,1]};
function setRow(agent,key,v,ro){const id=`s_${agent}_${key}`;
 if(typeof v==='boolean')return `<div class="set"><span class="k">${key}</span><span class="hit"><button class="sw ${v?'on':''}" data-bool="${agent}.${key}" ${ro?'disabled':''}></button></span></div>`;
 if(typeof v==='string')return `<div class="set"><span class="k">${key}</span><input type="text" value="${esc(v)}" data-set="${agent}.${key}" ${ro?'disabled':''}></div>`;
 const kind=/usd|volume/.test(key)?'usd':/_s$/.test(key)?'s':/_h$/.test(key)?'h':/_min$/.test(key)?'min':v<=1&&!/pct/.test(key)?'r':/pct/.test(key)?'pct':'n';
 let[mn,mx]=RANGE_MAX[kind];if(kind==='usd')mx=Math.max(mx,v*4);if(kind==='n')mx=Math.max(50,v*4);if(/organic_buys/.test(key))mx=1000;
 const step=kind==='r'?.01:kind==='usd'&&v<1000?.5:1;
 return `<div class="set wide"><span class="k">${key}</span><span class="ctl"><input type="range" min="${mn}" max="${mx}" step="${step}" value="${v}" data-rng="${id}" ${ro?'disabled':''}><input type="number" step="${step}" id="${id}" value="${v}" data-set="${agent}.${key}" ${ro?'disabled':''}></span></div>`;}

/* ================= After-paint wiring ================= */
const after={
 home(){drawEq();$$('[data-ring]').forEach(c=>Charts.ring(c,c.dataset.ring===''?null:+c.dataset.ring,S.settings.analyst.min_score,Math.min(150,innerWidth*.34)));
  $$('.range a').forEach(a=>a.onclick=()=>{range=a.dataset.r;$$('.range a').forEach(b=>b.classList.toggle('on',b===a));drawEq();});
  $('#srchBtn').onclick=()=>{const s=$('#srch');s.hidden=!s.hidden;if(!s.hidden)s.querySelector('input').focus();};
  $('#srch input').oninput=e=>{const q=e.target.value.trim().toLowerCase(),r=q?(S.coins||[]).filter(c=>[c.name,c.symbol,c.mint].some(x=>(x||'').toLowerCase().includes(q))).slice(0,8):[];
   $('#srchRes').innerHTML=r.map(c=>`<div class="row" data-go="coin" data-m="${esc(c.mint)}"><div class="l"><div class="t">${esc(c.name)}</div><div class="st">${esc(c.symbol)} · ${short(c.mint)}</div></div></div>`).join('')||(q?'<div class="empty">No coin matches</div>':'');};},
 agents(){$$('[data-pause]').forEach(b=>b.onclick=async()=>{if(b.classList.contains('lock'))return toast("Risk can't pause with a position open");
  try{await Data.send('pause',{agent:b.dataset.pause,paused:b.classList.contains('on')});b.classList.toggle('on');}catch{toast('Read-only here. Use Telegram.');}});},
 coin(){const cd=$('#cd');if(cd)Charts.candles(cd,C.candles,C.position?C.stop_line:null);},
 auditor(){beam();wireAudTog();},
 account(){wireAudTog;$$('[data-rng]').forEach(r=>r.oninput=()=>{const n=$('#'+r.dataset.rng);n.value=r.value;n.dispatchEvent(new Event('change'));});
  $$('[data-set]').forEach(i=>i.onchange=()=>{const[a,k]=i.dataset.set.split('.');const v=i.type==='number'?+i.value:i.value;const r=$(`[data-rng="${i.id}"]`);if(r)r.value=v;save(a,k,v);});
  $$('[data-bool]').forEach(b=>b.onclick=()=>{const[a,k]=b.dataset.bool.split('.'),on=b.classList.contains('on');
   if(a==='auditor'&&k==='enabled'&&on&&!askTwice())return;b.classList.toggle('on');save(a,k,!on);});
  $$('#modeSeg a').forEach(a=>a.onclick=async()=>{const m=a.dataset.mode;if(m===S.mode)return;
   if(m==='LIVE'&&prompt('Type LIVE to confirm. Buy and Sell pushes will be for real money.')!=='LIVE')return;
   try{await Data.send('mode',{mode:m});S.mode=m;paint();}catch{toast('Read-only here. Use Telegram.');}});
  const st=$('#stack');if(st)st.onchange=()=>Data.send('settings',{agent:'account',key:'stack',value:+st.value}).then(()=>toast('Saved'),()=>toast('Not saved'));
  $('#invite').onclick=async()=>{const url=S.account.signup_url;try{if(navigator.share){await navigator.share({url});return;}}catch(e){if(e.name==='AbortError')return;}
   try{await navigator.clipboard.writeText(url);}catch{const t=document.createElement('textarea');t.value=url;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();}toast('Link copied');};
  const tp=$('#testPush');if(tp)tp.onclick=()=>Data.send('test_push',{}).then(()=>toast('Test push sent'),()=>toast('Push failed'));
  const wp=$('#wpush');if(wp)wp.onclick=async()=>{const p=await Notification.requestPermission();if(p!=='granted')return toast('Notifications blocked');
   try{const reg=await navigator.serviceWorker.ready,key=(await Data.get('vapid')).key;const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});await Data.send('push_subscribe',sub.toJSON());toast('Notifications on');}catch{toast('Web push unavailable · Telegram only');}};
  if(route.m){const el=$('#set-'+route.m);if(el)el.scrollIntoView();}}};
const askTwice=()=>confirm('Turn off the Auditor? Coins would go to Analyst without the 8 safety layers.')&&confirm('Are you sure? Grok Bot could buy a rug.');
function wireAudTog(){const b=$('#audTog');if(b)b.onclick=()=>{const on=b.classList.contains('on');if(on&&!askTwice())return;b.classList.toggle('on');save('auditor','enabled',!on);};}
function save(agent,key,value){if(S.settings[agent])S.settings[agent][key]=value;Data.send('settings',{agent,key,value}).then(()=>toast('Saved'),()=>toast('Not saved · read-only'));}
function drawEq(){const cv=$('#eq');if(!cv)return;const span=RANGES[range],t1=S.equity.length?S.equity[S.equity.length-1].t:Date.now();
 const from=range==='LIVE'?S.night_start||0:span===Infinity?0:t1-span;const pts=S.equity.filter(p=>p.t>=from);
 Charts.line(cv,pts,(S.marks||[]).filter(m=>m.t>=from),S.equity.length?(pts[0]?.v??null):null);}

/* ---------- audit beam: 350ms per layer, then 150ms to green/red; waits on a layer the server hasn't sent ---------- */
const beamDone={};let beamTimer;
function beam(){const a=C.audit;if(!a)return;clearTimeout(beamTimer);const key=C.mint,got=a.layers.length;let i=RM?got:(beamDone[key]||0);
 const show=n=>{for(let k=0;k<n;k++){const l=a.layers[k],d=$('#dk'+k),r=$('#lv'+k);if(!d)return;d.className='disc '+(l.pass?'ok':'red');d.textContent=(l.pass?'✓ ':'✕ ')+LN[k];
  r.className='lv '+(l.pass?'ok':'red');r.querySelector('.ic').textContent=l.pass?'✓':'✕';r.querySelector('.v').textContent=l.value;}};
 const finish=()=>{$('#beam').classList.remove('on');const v=$('#verdict');if(a.passed&&got===8)v.innerHTML=`<b class="g">Cleared · 8/8 parts</b><span>Sent to Executor · ${C.executor_size!=null?usd(C.executor_size):'size pending'}</span>`;
  else if(a.passed===false)v.innerHTML=`<b class="r">Rejected · ${esc(a.reason)}</b><span>Grok Bot won't buy ${esc(C.name)}</span>`;else v.innerHTML='<span>taking apart...</span>';};
 show(Math.min(i,got));if(RM||i>=got&&(a.passed!=null)){beamDone[key]=got;finish();return;}
 const bm=$('#beam');bm.classList.add('on');$('#verdict').innerHTML='<span>taking apart...</span>';
 const step=()=>{if(!$('#beam'))return;if(i>=got){if(a.passed!=null&&(got===8||a.passed===false)){finish();return;}return;} // wait for the server
  bm.style.top=(i*28+20)+'px';beamTimer=setTimeout(()=>{show(i+1);beamDone[key]=++i;if(a.layers[i-1]&&!a.layers[i-1].pass){finish();return;}beamTimer=setTimeout(step,150);},350);};
 bm.style.transition='none';bm.style.top=(i*28+20)+'px';void bm.offsetHeight;bm.style.transition='';step();}

Data.subscribe(async m=>{if(FORCE)return;if(m.type==='audit_layer'&&route.s==='auditor'&&m.mint===route.m&&C?.audit){C.audit.layers[m.n-1]=m.layer||m;beam();return;}load();});
addEventListener('resize',()=>{clearTimeout(window._rz);window._rz=setTimeout(()=>S&&paint(),200)});
if('serviceWorker'in navigator&&!DEMO)navigator.serviceWorker.register('sw.js').catch(()=>{});
load();})();
