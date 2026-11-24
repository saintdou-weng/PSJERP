/* VRT ERP · 會議追蹤（Meeting follow-up）
   會議紀錄內容加密存放（repo 公開），輸入一次密碼後本機記住（與 PSJGA 同一把）。
   每一項可標「待追／進行中／已完成／不適用」＋備註，存在這台裝置。 */
(function(){
 const VB=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 let MM=null, ERR='', FILTER='open';
 const ST_KEY='psjerp_mm_status_v1';
 const st=()=>{try{return JSON.parse(localStorage.getItem(ST_KEY)||'{}')}catch(e){return {}}};
 const setSt=(id,v)=>{const o=st();o[id]=Object.assign(o[id]||{},v,{at:new Date().toISOString().slice(0,16).replace('T',' ')});try{localStorage.setItem(ST_KEY,JSON.stringify(o))}catch(e){}};
 const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 async function keyFromPw(pw){const b=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt:new TextEncoder().encode('VRT-PSJ-Vault-v1'),iterations:250000,hash:'SHA-256'},b,{name:'AES-GCM',length:256},true,['decrypt'])}
 async function open(k){const V=window.PSJ_MM_VAULT;const pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:VB(V.iv)},k,VB(V.ct));MM=JSON.parse(new TextDecoder().decode(pt))}
 async function auto(){try{const raw=localStorage.getItem('psj_vault_k');if(!raw||MM)return;const k=await crypto.subtle.importKey('raw',VB(raw),{name:'AES-GCM'},true,['decrypt']);await open(k);rr()}catch(e){}}
 window.mmUnlock=async function(f){try{ERR='';const k=await keyFromPw(f.pw.value);await open(k);const raw=new Uint8Array(await crypto.subtle.exportKey('raw',k));try{localStorage.setItem('psj_vault_k',btoa(String.fromCharCode(...raw)))}catch(e){}}catch(e){ERR='密碼不對 Wrong password'}rr();return false};
 const rr=()=>{try{if(typeof CUR!=='undefined'&&CUR==='minutes'&&typeof rerender==='function')rerender()}catch(e){}};
 window.mmSet=function(id,v){setSt(id,{s:v});rr()};
 window.mmNote=function(id,el){setSt(id,{n:el.value})};
 window.mmFilter=function(v){FILTER=v;rr()};
 const SS=[['todo','待追','#b45309','#fef3c7'],['doing','進行中','#1d4ed8','#dbeafe'],['done','已完成','#047857','#d1fae5'],['na','不適用','#64748b','#f1f5f9']];
 window.renderMinutes=function(){
  const head=(typeof pageHead==='function'?pageHead('minutes'):'<h1>📝 會議追蹤</h1>');
  if(!MM){ setTimeout(auto,0); return head+`<div class="card" style="padding:18px;max-width:560px"><b>🔒 會議紀錄已加密</b><p class="small muted" style="margin:6px 0 10px">輸入一次密碼（同 Admin OS／PSJGA），這台裝置之後會自動打開。</p><form onsubmit="return mmUnlock(this)" style="display:flex;gap:8px;flex-wrap:wrap"><input type="password" name="pw" class="inp" placeholder="密碼" style="min-width:200px"><button class="btn sm pri" type="submit">🔓 打開</button>${ERR?`<span style="color:#dc2626;font-weight:700">${E(ERR)}</span>`:''}</form></div>`; }
  const S=st(); let all=0,done=0,open=0;
  MM.forEach(m=>m.secs.forEach(s=>s.items.forEach(it=>{all++;const v=(S[it.id]||{}).s||'todo';if(v==='done'||v==='na')done++;else open++;})));
  const chips=[['open','未完成',open],['all','全部',all],['done','已完成／不適用',done]].map(([k,l,n])=>`<button class="btn sm ${FILTER===k?'pri':''}" onclick="mmFilter('${k}')">${l} <b>${n}</b></button>`).join(' ');
  let h=head+`<div class="note" style="margin-bottom:12px">把台北／VRT 會議紀錄逐項列出，每一項可標狀態跟寫備註，用來核對事情有沒有跟進。狀態存在這台裝置。</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">${chips}</div>`;
  MM.forEach(m=>{
   const items=[];m.secs.forEach(s=>s.items.forEach(it=>items.push([s.h,it])));
   const vis=items.filter(([_,it])=>{const v=(S[it.id]||{}).s||'todo';return FILTER==='all'||(FILTER==='open'?(v==='todo'||v==='doing'):(v==='done'||v==='na'))});
   if(items.length&&!vis.length)return;
   if(!items.length&&FILTER==='done')return;
   const n=items.length,d=items.filter(([_,it])=>['done','na'].includes((S[it.id]||{}).s)).length;
   h+=`<div class="card" style="padding:14px 16px;margin-bottom:12px"><div style="display:flex;gap:10px;align-items:baseline;flex-wrap:wrap"><b style="font-family:monospace;font-size:14px">${E(m.d)}</b><b style="font-size:15px">${E(m.t)}</b><span class="small muted">${E(m.src)}</span>${n?`<span class="small" style="margin-left:auto;font-weight:700">${d}/${n} 完成</span>`:''}</div>`;
   if(!n){h+=`<div class="small muted" style="margin-top:6px">這次會議的紀錄檔不在雲端信箱（只有轉寄／回覆）。有原檔可以丟進來補。</div></div>`;return}
   let lastSec=null;
   vis.forEach(([sec,it])=>{const cur=S[it.id]||{},v=cur.s||'todo';
    if(sec!==lastSec&&sec){h+=`<div style="margin:10px 0 4px;font-weight:800;font-size:12.5px;opacity:.75">${E(sec)}</div>`}lastSec=sec;
    h+=`<div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:7px 0;border-top:1px solid rgba(0,0,0,.06)"><div><div style="font-size:13.5px;line-height:1.5">${E(it.x)}</div><input class="inp" style="margin-top:4px;width:100%;font-size:12px;padding:5px 8px" placeholder="備註（誰、進度、日期）" value="${E(cur.n||'')}" onchange="mmNote('${it.id}',this)">${cur.at?`<div class="small muted" style="font-size:10.5px">更新 ${E(cur.at)}</div>`:''}</div><div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">${SS.map(([k,l,c,bg])=>`<button class="btn sm" onclick="mmSet('${it.id}','${k}')" style="${v===k?`background:${bg};color:${c};border-color:${c};font-weight:800`:''}">${l}</button>`).join('')}</div></div>`});
   h+=`</div>`;
  });
  return h;
 };
})();
