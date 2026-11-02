/* Hand-drawn <canvas> charts, devicePixelRatio aware. */
const Charts=(()=>{
 const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const C={gr:'#00d35a',rd:'#ff453a',or:'#ff9f0a',bl:'#0a84ff',sep:'rgba(84,84,88,0.55)',ter:'rgba(235,235,245,0.3)',sec:'rgba(235,235,245,0.6)',c2:'#2c2c2e'};
 const FT='-apple-system,"SF Pro Text",system-ui,sans-serif',FM='ui-monospace,"SF Mono",Menlo,monospace';
 function setup(cv,h,w){const d=window.devicePixelRatio||1;w=w||cv.clientWidth||cv.parentNode.clientWidth;
  cv.style.height=h+'px';if(cv.width!==Math.round(w*d)||cv.height!==Math.round(h*d)){cv.width=Math.round(w*d);cv.height=Math.round(h*d);}
  const x=cv.getContext('2d');x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,w,h);return{x,w,h};}
 const fmtP=v=>{if(v==null)return'n/a';const a=Math.abs(v);return a>=1?v.toFixed(4):a>=.01?v.toFixed(5):a>=1e-4?v.toFixed(7):v.toExponential(3);};
 /* Home line. pts [{t,v}], marks [{t,label,kind:'buy'|'win'|'loss'}], start = night-start value */
 const prev=new WeakMap();
 function line(cv,pts,marks,start,h=200){
  const st=prev.get(cv)||{n:0,seen:new Set()};const grew=st.n&&pts.length>st.n&&!RM;const fresh=marks.filter(m=>!st.seen.has(m.t+m.label));
  prev.set(cv,{n:pts.length,seen:new Set(marks.map(m=>m.t+m.label))});
  const t0w=performance.now();
  const frame=now=>{const k=grew?Math.min(1,(now-t0w)/250):1,a=fresh.length&&!RM?Math.min(1,(now-t0w)/200):1;
   draw(cv,pts,marks,start,h,k,a,new Set(fresh.map(m=>m.t+m.label)));if(k<1||a<1)requestAnimationFrame(frame);};
  requestAnimationFrame(frame);frame(t0w);}
 function draw(cv,pts,marks,start,h,k,alpha,freshSet){const{x,w}=setup(cv,h);const nm=Math.min(3,(marks||[]).length),top=nm?Math.min(h*.45,14+nm*24):16,bot=h-8;
  if(!pts||pts.length<1){x.setLineDash([4,4]);x.strokeStyle=C.ter;x.lineWidth=1;x.beginPath();x.moveTo(0,h*.6);x.lineTo(w,h*.6);x.stroke();x.setLineDash([]);return;}
  let P=pts.slice();if(k<1&&P.length>1){const a=P[P.length-2],b=P[P.length-1];P[P.length-1]={t:a.t+(b.t-a.t)*k,v:a.v+(b.v-a.v)*k};}
  const vs=P.map(p=>p.v).concat(start??[]),mn=Math.min(...vs),mx=Math.max(...vs),r=(mx-mn)||1,t0=pts[0].t,t1=pts[pts.length-1].t,dt=(t1-t0)||1;
  const X=t=>(t-t0)/dt*(w-2)+1,Y=v=>bot-(v-mn)/r*(bot-top);
  if(start!=null){x.setLineDash([3,4]);x.strokeStyle=C.ter;x.lineWidth=1;x.beginPath();x.moveTo(0,Y(start));x.lineTo(w,Y(start));x.stroke();x.setLineDash([]);}
  const path=()=>{x.beginPath();P.forEach((p,i)=>i?x.lineTo(X(p.t),Y(p.v)):x.moveTo(X(p.t),Y(p.v)));};
  path();const lx=X(P[P.length-1].t);x.lineTo(lx,h);x.lineTo(X(t0),h);x.closePath();
  const g=x.createLinearGradient(0,top,0,h);g.addColorStop(0,'rgba(0,211,90,0.32)');g.addColorStop(1,'rgba(0,211,90,0)');x.fillStyle=g;x.fill();
  path();x.strokeStyle=C.gr;x.lineWidth=2;x.lineJoin='round';x.stroke();
  const last=P[P.length-1];x.fillStyle=C.gr;x.beginPath();x.arc(X(last.t),Y(last.v),4,0,7);x.fill();
  // marks: label pills above the line; a later mark that would overlap moves up a row
  x.font='600 11px '+FT;const rows=[],lay=[];
  marks.filter(m=>m.t>=t0&&m.t<=t1).sort((a,b)=>a.t-b.t).forEach(m=>{
   let best=pts[0];pts.forEach(p=>{if(Math.abs(p.t-m.t)<Math.abs(best.t-m.t))best=p});
   const px=X(best.t),py=Y(best.v),tw=x.measureText(m.label).width+12,lx=Math.min(Math.max(px-tw/2,0),w-tw);let row=0;
   while((rows[row]||[]).some(b=>lx<b[1]+4&&lx+tw>b[0]-4))row++;(rows[row]=rows[row]||[]).push([lx,lx+tw]);lay.push({m,px,py,tw,lx,row});});
  lay.forEach(({m,px,py,tw,lx,row})=>{const by=4+(rows.length-1-row)*24,col=m.kind==='buy'?C.bl:m.kind==='win'?C.gr:C.rd;
   x.globalAlpha=freshSet.has(m.t+m.label)?alpha:1;
   x.strokeStyle=col;x.globalAlpha*=.6;x.lineWidth=1;x.beginPath();x.moveTo(px,by+20);x.lineTo(px,py-5);x.stroke();x.globalAlpha=freshSet.has(m.t+m.label)?alpha:1;
   x.fillStyle=col;rr(x,lx,by,tw,20,10);x.fill();x.fillStyle=m.kind==='win'?'#000':'#fff';x.textBaseline='middle';x.fillText(m.label,lx+6,by+10.5);
   x.fillStyle=col;x.beginPath();x.arc(px,py,3.5,0,7);x.fill();x.globalAlpha=1;});}
 function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
 /* Coin 1-min candles [{t,o,h,l,c,v}], v = change of volume.m5; stop = current exit line */
 function candles(cv,c,stop,h=260){const{x,w}=setup(cv,h);if(!c||!c.length)return;
  const ax=64,cw=w-ax,vh=48,ph=h-vh-12;let lo=Math.min(...c.map(k=>k.l)),hi=Math.max(...c.map(k=>k.h));
  if(stop){lo=Math.min(lo,stop);hi=Math.max(hi,stop);}const pad=(hi-lo)*.06||hi*.02;lo-=pad;hi+=pad;
  const Y=v=>4+(hi-v)/(hi-lo)*(ph-8),step=cw/c.length,bw=Math.max(1.5,step*.62),mv=Math.max(...c.map(k=>Math.abs(k.v)))||1;
  x.font='11px '+FT;x.textBaseline='middle';x.lineWidth=.5;
  for(let i=0;i<=3;i++){const v=lo+(hi-lo)*i/3,y=Y(v);x.strokeStyle=C.sep;x.beginPath();x.moveTo(0,y);x.lineTo(cw,y);x.stroke();x.fillStyle=C.ter;x.fillText(fmtP(v),cw+6,Math.min(Math.max(y,8),ph-4));}
  c.forEach((k,i)=>{const cx=i*step+step/2,col=k.c>=k.o?C.gr:C.rd;x.strokeStyle=x.fillStyle=col;x.lineWidth=1;
   x.beginPath();x.moveTo(cx,Y(k.h));x.lineTo(cx,Y(k.l));x.stroke();const y1=Y(Math.max(k.o,k.c)),y2=Y(Math.min(k.o,k.c));
   x.fillRect(cx-bw/2,y1,bw,Math.max(1,y2-y1));x.globalAlpha=.4;const vv=Math.abs(k.v)/mv*vh;x.fillRect(cx-bw/2,h-vv,bw,vv);x.globalAlpha=1;});
  if(stop){const y=Y(stop);x.setLineDash([6,4]);x.strokeStyle=C.or;x.lineWidth=1.5;x.beginPath();x.moveTo(0,y);x.lineTo(cw,y);x.stroke();x.setLineDash([]);
   x.fillStyle=C.or;rr(x,cw+2,y-10,ax-2,20,6);x.fill();x.fillStyle='#000';x.fillText(fmtP(stop),cw+6,y);}}
 /* Score ring 0-100, green from thr */
 function ring(cv,score,thr,size){cv.style.width=size+'px';const{x}=setup(cv,size,size),r=size/2-7,c=size/2;
  x.lineWidth=Math.max(6,size*.09);x.lineCap='round';x.strokeStyle=C.c2;x.beginPath();x.arc(c,c,r,0,7);x.stroke();
  if(score!=null){x.strokeStyle=score>=thr?C.gr:'#ffd60a';x.beginPath();x.arc(c,c,r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.max(.001,score/100));x.stroke();}
  x.fillStyle='#fff';x.font='700 '+Math.round(size*.3)+'px -apple-system,"SF Pro Display",system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText(score==null?'–':score,c,c+1);}
 return{line,candles,ring,fmtP,RM};})();
