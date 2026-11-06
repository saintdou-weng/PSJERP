
/* ---------- v1.4.0 (2026-11-06)：財務接 ACC Flow、成本分析接通、ERP 日期打錯自動校正 ----------
   1. 會計三項（WIP／成品入庫／製造費用）搬進 💰 財務：頁面就是 ACC Flow 原本的頁（同網域嵌入），資料仍存在 ACC 雲端，
      ACC 的匯入、合併、版本、Telegram 全部照舊；ACC 那邊的獨立會計頁改成「已移到 VRT ERP」。
   2. 人工彙總：自動讀 ACC 雲端的每月工廠費用（人數、出勤天數、直接人工、加班、間接人工取 W_CCS450），唯讀，不用匯入。
   3. 成本分析：SMV 用 smvFor（IE 核准 → ERP W_CBA190 → 日報）、料價用 W_CPU795（料名＋顏色），
      工資率／製費率 = ACC 最近 12 個月 直接人工、製造費用 ÷ 出勤分鐘（人數 × 出勤天 × 480）。
   4. ERP 打錯的年份（如 2015 打成 2050／2051）在載入時改回：先看訂單編號 VRTyy，再看同筆其他日期、同檔同月份的年份；原值留在 _typo，可在 ⚠️ 異常 看清單。
   5. 智慧匯入：ERP 認不出、但像會計檔（WIP／成品入庫／Factory Expense）的 Excel，自動交給 ACC 的匯入程式（同一套解析與雲端合併）。 */
(function(){
 const ACC_SITE='https://saintdou-weng.github.io/vrt-acc-flow-cost/';
 const ACC_GAS='https://script.google.com/macros/s/AKfycbzojXP0ixSsJqO1Ri2lfkdazTF-9XxoDqRYI0B4OEThkvjc95zacRflYtuArOd8ewHp/exec';
 window.ACC_SITE=ACC_SITE;
 const N=s=>String(s==null?'':s).toUpperCase().replace(/[^A-Z0-9]/g,'');

 /* ══ A. ERP 日期打錯 ══ */
 const YMAX=TODAY.getFullYear()+2;
 const DFIX={orders:['order_date','delivery','closed_date'],bom:['order_date'],shipping:['ship_date','etd','eta','order_date'],purchase:['purchase_date','eta'],price:['purchase_date','eta'],prodorders:['order_date','delivery'],fg:['date','in_date']};
 const TYPO=window.DATE_TYPO=[];
 const badY=v=>{const y=+String(v||'').slice(0,4);return y>YMAX&&y<2100};
 function fileYears(k){ const key='fy_'+k; if(GC.has(key))return GC.get(key); const m=new Map();
  (DB[k]||[]).forEach(r=>{ const f=r.source_file; if(!f)return; for(const g of DFIX[k]){ const v=r[g]; if(typeof v==='string'&&/^\d{4}-\d\d/.test(v)&&!badY(v)){ const kk=f+'|'+v.slice(5,7); const o=m.get(kk)||{}; const y=v.slice(0,4); o[y]=(o[y]||0)+1; m.set(kk,o); const ka=f+'|*'; const oa=m.get(ka)||{}; oa[y]=(oa[y]||0)+1; m.set(ka,oa); break } } });
  GC.set(key,m); return m }
 const top=o=>{let b=null,n=0;for(const y in (o||{}))if(o[y]>n){n=o[y];b=+y}return b};
 function guessYear(k,r,f,v){
  const m=String(r.od_no||'').match(/^VRT(\d{2})\d{5}/); if(m){const y=2000+ +m[1]; if(y>=2010&&y<=YMAX)return y}
  for(const g of ['order_date','purchase_date','ship_date','date']){ if(g===f)continue; const s=String(r[g]||''); const y=+s.slice(0,4); if(/^\d{4}-/.test(s)&&y>=2010&&y<=YMAX)return y }
  if(r.source_file){ const F=fileYears(k); const y=top(F.get(r.source_file+'|'+v.slice(5,7)))||top(F.get(r.source_file+'|*')); if(y)return y;
   const s=String(r.source_file).match(/20(1\d|2\d)/); if(s)return 2000+ +s[1] }
  return null }
 function fixDates(k){ const fs=DFIX[k], a=DB[k]; if(!fs||!Array.isArray(a)||!a.length)return 0; let n=0;
  for(const r of a){ if(!r)continue; for(const f of fs){ const v=r[f]; if(typeof v!=='string'||!badY(v))continue;
    let y=guessYear(k,r,f,v); if(!y)continue;
    const od=f!=='order_date'?String(r.order_date||''):''; if(od&&+od.slice(0,4)===y&&v.slice(5,10)<od.slice(5,10))y++;   /* 交期不會早於下單 */
    const nv=y+v.slice(4); r._typo=Object.assign({},r._typo||{},{[f]:v}); r[f]=nv; n++;
    TYPO.push({ds:k,f,from:v,to:nv,no:r.od_no||r.my_no||r.purchase_no||r.bl_no||'',po:r.po_no||'',style:r.style||'',src:(r.source_file||'')+(r.source_record_id?' · '+r.source_record_id:'')}) } }
  if(n){ GC.clear(); try{COSTC.clear()}catch(e){} }
  return n }
 const fixAll=ks=>{ let n=0; ks.forEach(k=>{ if(Array.isArray(DB[k])&&DB[k].length)n+=fixDates(k) }); if(n)try{updateDataRange()}catch(e){} return n };
 const _ld=loadDB; loadDB=async function(){ const r=await _ld.apply(this,arguments); TYPO.length=0; fixAll(Object.keys(DFIX)); return r };
 const _ens=window.ensureDS; window.ensureDS=async function(keys){ const want=(Array.isArray(keys)?keys:[keys]); const r=await _ens(keys); if(r)fixAll(want.filter(k=>DFIX[k])); return r };
 try{ ensureDS=window.ensureDS }catch(e){}
 const _le=liveExceptions; liveExceptions=function(){ const E=_le.apply(this,arguments)||[]; if(TYPO.length)E.push({sev:'info',title:tt('ERP 年份打錯，已自動改回（原值保留）','ERP year typos auto-corrected (original kept)'),count:fmt(TYPO.length)+tt(' 筆',' fields'),go:'datefix'}); return E };
 T.datefix=['ERP 日期校正','ERP date fixes','កែកាលបរិច្ឆេទ ERP'];
 RENDER.datefix=function(){ let h=pageHead('datefix')+`<p class="note info small">${tt('ERP 裡有幾筆年份明顯打錯（例：2015 打成 2050／2051、2048）。VRT ERP 載入時自動改回，ERP 本身不動；原值留著，下表可對照。判斷順序：訂單編號 VRTyy → 同筆其他日期 → 同一個匯出檔同月份最多的年份。','A few ERP dates carry an obvious year typo (e.g. 2015 keyed as 2050/2051). VRT ERP corrects them on load; the ERP itself is untouched and the original value is kept.')}</p>`;
  if(!TYPO.length)return h+`<p class="note">${tt('目前沒有。','None.')}</p>`;
  h+=`<div class="tw"><table class="tbl"><thead><tr><th>${tt('資料','Data')}</th><th>${tt('欄位','Field')}</th><th>${tt('原值','Was')}</th><th>${tt('改成','Now')}</th><th>${tt('單號','No.')}</th><th>PO</th><th>${tt('款號','Style')}</th><th>${tt('來源','Source')}</th></tr></thead><tbody>`;
  const seen=new Set(); TYPO.forEach(x=>{ const k=x.ds+x.f+x.no+x.from; if(x.ds==='bom'&&seen.has(k))return; seen.add(k); h+=`<tr><td>${esc(t(x.ds)||x.ds)}</td><td class="mono">${esc(x.f)}</td><td class="mono" style="color:var(--crit,#c00)">${esc(x.from)}</td><td class="mono"><b>${esc(x.to)}</b></td><td class="mono">${esc(x.no)}</td><td class="mono">${esc(x.po)}</td><td class="mono">${esc(x.style)}</td><td class="small muted">${esc(x.src)}</td></tr>` });
  return h+'</tbody></table></div>' };

 /* ══ B. ACC Flow 雲端（唯讀快取） ══ */
 const ACC=window.ACC_CACHE={state:null,at:'',loading:null,err:''};
 const ACC_KEY='psjerp_acc_cache';
 window.accLoad=async function(force){
  if(!ACC.state&&!ACC._tried){ ACC._tried=1; try{ const v=await IDB.get(ACC_KEY); if(v&&v.state){ACC.state=v.state;ACC.at=v.at} }catch(e){} }
  const stale=!ACC.at||(Date.now()-Date.parse(ACC.at))>3*3600e3;
  if(!force&&!stale)return ACC.state; if(ACC.loading)return ACC.loading;
  ACC.loading=(async()=>{ try{ const r=await fetch(ACC_GAS+'?action=pull&tool=vrt_acc&_='+Date.now(),{cache:'no-store',redirect:'follow',referrerPolicy:'no-referrer'}); const d=JSON.parse(await r.text());
    const p=d&&d.data&&d.data.schema==='vrt-flow-cost'?d.data:d&&d.payload&&d.payload.schema==='vrt-flow-cost'?d.payload:d&&d.data&&d.data.data&&d.data.data.schema==='vrt-flow-cost'?d.data.data:null;
    if(p&&p.state&&p.state.periods){ ACC.state=p.state; ACC.at=new Date().toISOString(); ACC.err=''; try{await IDB.set(ACC_KEY,{state:ACC.state,at:ACC.at})}catch(e){} GC.clear(); try{COSTC.clear()}catch(e){} if(['labor','costing','factory-cost','dashboard','reports'].includes(CUR))rerender() }
   }catch(e){ ACC.err=String(e.message||e); console.warn('ACC pull',e) } finally{ ACC.loading=null } return ACC.state })();
  return ACC.loading };
 const accMod=(p,m)=>{ const e=ACC.state&&ACC.state.periods&&ACC.state.periods[p]; const x=e&&e.modules&&e.modules[m]; if(!x||(x.meta&&x.meta.deleteIntent))return null; if(ACC.state.tombstones&&ACC.state.tombstones.periods&&ACC.state.tombstones.periods[p])return null; return x };
 window.accExpense=function(){ if(GC.has('accexp'))return GC.get('accexp'); const out=[]; if(ACC.state&&ACC.state.periods)Object.keys(ACC.state.periods).sort().forEach(p=>{ const x=accMod(p,'expense'); const r=x&&x.records&&x.records[0]; if(r&&/^\d{4}-\d\d$/.test(p))out.push(Object.assign({},r,{period:p})) }); GC.set('accexp',out); return out };
 window.accRows=function(m){ const out=[]; if(ACC.state&&ACC.state.periods)Object.keys(ACC.state.periods).sort().forEach(p=>{ const x=accMod(p,m); (x&&x.records||[]).forEach(r=>out.push(Object.assign({period:p},r))) }); return out };
 setTimeout(()=>{ if(!isDemo())accLoad(false) },2500);

 /* ══ C. 人工彙總：ACC 每月工廠費用 → 人工列（唯讀） ══ */
 const idlOf=p=>{ const r=live(DB.factorycost||[]).filter(x=>x.month===p); return r.length?sum(r,'indirect_labor'):null };
 window.accLaborRows=function(){ if(GC.has('acclab'))return GC.get('acclab'); const out=accExpense().map(e=>{ const hc=+e.associates||0, wd=+e.workDays||0;
   return {id:'acc-lab-'+e.period,month_date:e.period+'-01',dept:tt('全廠','Whole factory','រោងចក្រទាំងមូល'),headcount:hc||null,work_days:wd||null,work_hours:hc&&wd?Math.round(hc*wd*8):null,ot_hours:null,
    ot_cost:(+e.overtime||0)+(+e.specialOt||0)||null,dl_cost:+e.directLabor||+e.salary||null,idl_cost:idlOf(e.period),salary:+e.salary||null,actual_salary:+e.actualSalary||null,pv:+e.pv||null,overhead:+e.overhead||null,
    src_note:tt('ACC Flow 工廠費用（出勤工時 = 人數 × 出勤天 × 8）','ACC Flow factory expense (hours = headcount × days × 8)'),source_system:'ACC_FLOW',source_file:'ACC Flow · Factory Expense',_ro:1} });
  GC.set('acclab',out); return out };
 const labAll=()=>live(DB.labor||[]).concat(accLaborRows().filter(a=>!live(DB.labor||[]).some(m=>m.month_date===a.month_date)));
 if(typeof SRCS!=='undefined'&&SRCS.labor)SRCS.labor.rows=labAll;
 if(typeof CFG!=='undefined'&&CFG.labor){ CFG.labor.data=labAll; CFG.labor.cols.splice(5,0,COL('ot_cost','加班費 USD',{tp:'money'})); CFG.labor.cols.splice(7,0,COL('pv','產值 PV',{tp:'money'})) }
 if(typeof NEED!=='undefined')NEED.labor=['自動：ACC Flow 每月工廠費用（雲端直接讀，不用匯入）；手動新增的部門／線別列會蓋過同月份'];
 if(T.sub_labor)T.sub_labor=['每月人工彙總：自動讀 ACC Flow 工廠費用（人數、出勤工時、直接人工、加班費、產值），間接人工取 ERP W_CCS450。個人薪資不放這裡。','Monthly labour summary, read automatically from ACC Flow factory expense; indirect labour from ERP W_CCS450.'];

 /* ══ D. 成本分析接通 ══ */
 window.smvOfOrder=function(o){ let x=null; try{ x=smvFor(o.style,o.style_name)||null }catch(e){} if(x&&x.src==='ie_upd')return x;   /* IE 週報核准第一 */
  if(o.smv>0.01)return {v:+o.smv,src:'erpo'}; return x };
 const matIdx=()=>{ if(GC.has('matidx'))return GC.get('matidx'); const nc=new Map(), n=new Map();
  live(DB.price||[]).forEach(p=>{ const v=+p.unit_price||+p.price||0; if(!(v>0))return; if(p.currency&&p.currency!=='USD')return; const d=p.purchase_date||''; const put=(m,k)=>{ if(!k)return; const o=m.get(k); if(!o||d>o.d)m.set(k,{v,d,src:'cpu795',no:p.purchase_no}) }; put(nc,N(p.material)+'|'+N(p.color)); put(n,N(p.material)); if(p.material_no&&p.material_no!==p.material){put(nc,N(p.material_no)+'|'+N(p.color));put(n,N(p.material_no))} });
  const r={nc,n}; GC.set('matidx',r); return r };
 window.bomPrice=function(b){ if(b.price>0)return {v:b.price,src:'bom'}; const I=matIdx(); return I.nc.get(N(b.material)+'|'+N(b.color))||I.n.get(N(b.material))||(b.material_no?(I.nc.get(N(b.material_no)+'|'+N(b.color))||I.n.get(N(b.material_no))):null)||null };
 const bomIdx=()=>{ if(GC.has('bomidx'))return GC.get('bomidx'); const a=new Map(), b=new Map(); live(DB.bom||[]).forEach(x=>{ if(x.od_no){let l=a.get(x.od_no);if(!l)a.set(x.od_no,l=[]);l.push(x)} const m=keyN(x.my_no); if(m){let l=b.get(m);if(!l)b.set(m,l=[]);l.push(x)} }); const r={a,b}; GC.set('bomidx',r); return r };
 const EFFK='psjerp_cost_eff'; window.costEff=()=>{ const v=+LS.get(EFFK,'100'); return v>=30&&v<=120?v:100 };
 window.setCostEff=v=>{ LS.set(EFFK,String(v)); GC.clear(); try{COSTC.clear()}catch(e){} rerender() };
 const _rates=rates;
 rates=function(){ if(GC.has('rates'))return GC.get('rates'); const E=accExpense().filter(e=>e.associates>0&&e.workDays>0&&(e.directLabor||e.salary));
  let R; if(E.length){ const L=E.slice(-12); const min=sum(L,e=>e.associates*e.workDays*480); const lab=sum(L,e=>+e.directLabor||+e.salary||0), oh=sum(L,e=>+e.overhead||0);
   const fgq=sum(accRows('fg').filter(r=>r.period>=L[0].period&&r.period<=L[L.length-1].period),'qty');
   R={labor:lab/min,oh:oh/min,total:(lab+oh)/min,pcs:fgq||1,cost:lab+oh,basis:'acc',from:L[0].period,to:L[L.length-1].period,months:L.length,minutes:min} }
  else R=Object.assign({basis:'erp'},_rates());
  GC.set('rates',R); return R };
 costOrder=function(o,basis){
  const R=rates(), I=bomIdx(); const bom=((o.od_no&&I.a.get(o.od_no))||(o.my_no&&I.b.get(keyN(o.my_no)))||[]);
  let mat=null, miss=0, priced=0; if(bom.length){ mat=sum(bom,b=>{ let p=basis==='wavg'?wavgPrice(b.material_no,b.color):null; if(p==null){const x=bomPrice(b); p=x?x.v:null} if(p==null){miss++;return 0} priced++; return (+b.total_use||0)*p })/Math.max(1,Math.max(0,...bom.map(b=>+b.order_qty||0))||+o.qty||1) }   /* BOM 用量是整張自編單（各色／尺寸加總），除以 BOM 的訂單量 */
  const S=smvOfOrder(o); const smv=S?+S.v:0; const smvOk=smv>0.01; const eff=costEff()/100; const tm=TERMS[o.cust]||{term:'FOB',freight:0.04,duty:0};
  const labor=smvOk?smv/eff*R.labor:null, oh=smvOk?smv/eff*R.oh:null, other=0.02;
  const total=(mat!=null&&labor!=null)?mat+labor+oh+tm.freight+tm.duty+other:null; const price=+o.price||0;
  const margin=total!=null&&price?price-total:null;
  return {mat,labor,oh,freight:tm.freight,duty:tm.duty,other,total,price,margin,mpct:margin!=null&&price?margin/price*100:null,term:tm.term,smvOk,hasBom:bom.length>0,smv,smvSrc:S&&S.src,priceMiss:miss,priced,bomLines:bom.length};
 };
 const _cb=costBlock; costBlock=function(c,o){ let h=_cb.apply(this,arguments); const R=rates();
  const bits=[]; if(c.smvOk)bits.push(`SMV ${fmt(c.smv,2)}（${esc(smvSrcName(c.smvSrc))}）`); if(c.bomLines)bits.push(tt('BOM ','BOM ')+fmt(c.bomLines)+tt(' 列，料價 ',' lines, priced ')+fmt(c.priced)+(c.priceMiss?tt('，缺價 ',' , no price ')+fmt(c.priceMiss):''));
  if(R.basis==='acc')bits.push(tt('工資率 ','Labour ')+money(R.labor,4)+tt('／分、製費率 ','/min, OH ')+money(R.oh,4)+tt('／分（ACC ','/min (ACC ')+R.from+'～'+R.to+tt('，效率 ',', eff ')+costEff()+'%）');
  return h+(bits.length?`<p class="small muted" style="margin:6px 0 0">${bits.join(' · ')}</p>`:'') };
 const _rc=RENDER.costing; RENDER.costing=function(){ let h=String(_rc.apply(this,arguments)); const R=rates();
  const eff=costEff(); const ctl=`<div class="toolbar" style="margin:0 0 10px;gap:8px;flex-wrap:wrap;align-items:center"><span class="small muted">${tt('車縫效率','Sewing efficiency')}</span><div class="seg">${[100,85,75,65].map(v=>`<button class="${v===eff?'on':''}" onclick="setCostEff(${v})">${v}%</button>`).join('')}</div>
   <span class="small muted">${R.basis==='acc'?tt('工資、製費率來自 ACC Flow 工廠費用 ','Rates from ACC Flow factory expense ')+R.from+'～'+R.to+tt('（'+R.months+' 個月，直接人工 ÷ 出勤分鐘）','('+R.months+' months, direct labour ÷ attendance minutes)'):tt('ACC 工廠費用尚未讀到，暫用 ERP 製費','ACC factory expense not loaded yet; using ERP overhead')}</span></div>`;
  return h.replace('<div class="formula"',ctl+'<div class="formula"') };
 if(typeof PAGE_DS!=='undefined'&&PAGE_DS.costing)PAGE_DS.costing=['bom','price','purchase'];

 /* ══ E. 會計頁（ACC Flow 原頁，嵌入） ══ */
 const AF={'acc-overview':['overview','📊',['會計總覽','Accounting overview','ទិដ្ឋភាពគណនេយ្យ']],'acc-wip':['wip','🧶',['WIP 在製','WIP','WIP']],'acc-fg':['fg','📦',['成品入庫（會計）','FG inbound (accounting)','ទំនិញចូលឃ្លាំង']],'acc-expense':['expense','🏭',['製造費用','Factory expense','ថ្លៃរោងចក្រ']]};
 T.g_acc=['會計（ACC Flow）','Accounting (ACC Flow)','គណនេយ្យ'];
 const accUrl=k=>ACC_SITE+'index.html?embed=psjerp&page='+AF[k][0]+'&lang='+(['zh','en','km'][LANG]||'zh');
 Object.keys(AF).forEach(k=>{ T[k]=AF[k][2]; if(window.FRAMES)window.FRAMES[k]=[accUrl(k),'email',AF[k][2],'acc'];
  RENDER[k]=function(){ const u=accUrl(k); return `<div class="ph"><div style="min-width:0"><h1>${AF[k][1]} ${esc(t(k))}</h1><div class="src-line">${srcChip('email',tt('會計','Accounting'))}<span class="small muted">${tt('ACC Flow 的會計頁，資料存在 ACC 雲端；匯入、編輯、上下載都在這頁，或把會計 Excel 直接丟進 🧠 智慧匯入。','The ACC Flow accounting page; data stays in the ACC cloud. Import/edit here, or drop accounting Excel files into 🧠 Smart import.')}</span></div></div>
   <div class="acts"><a class="btn sm" href="${u.replace('embed=psjerp&','')+'&legacy=1'}" target="_blank" rel="noopener">${tt('在新分頁開啟','Open in new tab')} ↗</a></div></div><div class="pframe-wrap"><iframe class="pframe" id="accFrame" src="${u}" title="${esc(t(k))}" loading="eager"></iframe></div>` } });
 const at=MODS.findIndex(m=>m[0]==='invoices'); const add=Object.keys(AF).map(k=>[k,AF[k][1],'g_acc','fin']);
 if(at>=0)MODS.splice(at,0,...add); else MODS.push(...add);
 try{ renderNav() }catch(e){}

 /* ══ F. 智慧匯入：會計檔 → ACC 匯入程式 ══ */
 const accScore=wb=>{ let w=0,f=0,e=0; (wb.SheetNames||[]).forEach(sn=>{ const ns=String(sn).toLowerCase(); if(/wip/.test(ns))w+=4; if(/fg in|成品|summary 產量|summary_產量/.test(ns))f+=3; if(/產值人工|製造費用|每工人產值|expense/.test(ns))e+=4;
   const txt=(XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,defval:'',blankrows:false})||[]).slice(0,12).map(r=>r.join(' ')).join('\n').toLowerCase();
   if(/wip qty|wip amt/.test(txt))w+=8; if(/入庫日期/.test(txt)&&/數量/.test(txt)&&/產值/.test(txt))f+=8; if(/direct labor|manufacturing overhead|total pv|total salary/.test(txt))e+=6 });
  const m=Math.max(w,f,e); return m>=8?(m===w?'wip':m===f?'fg':'expense'):null };
 const waitAcc=()=>new Promise((res,rej)=>{ const t0=Date.now(); (function w(){ try{ const fr=document.getElementById('accFrame'); const cw=fr&&fr.contentWindow; if(cw&&typeof cw.smartImport==='function'&&cw.XLSX&&cw.document.readyState==='complete'&&cw.__accReady)return res(cw) }catch(e){} if(Date.now()-t0>45000)return rej(new Error(tt('ACC 頁面載入逾時','ACC page timed out'))); setTimeout(w,400) })() });
 window.sendToAcc=async function(files,kind){ go('acc-'+(kind||'overview')); try{ const cw=await waitAcc(); toast(tt('會計檔交給 ACC 匯入：','Accounting files → ACC import: ')+files.length); await cw.smartImport(files); setTimeout(()=>accLoad(true),8000) }catch(e){ toast(String(e.message||e)) } };
 const _hf2=handleFiles; handleFiles=async function(list){ const files=[...(list||[])]; const rest=[], acc=[]; let kind='';
  for(const f of files){ if(/\.xlsx?$/i.test(f.name||'')&&window.XLSX){ try{ const {aoa}=await readAOA(f); if(!detectReport(aoa)&&!(typeof isOBD==='function'&&await isOBD(f))){ const wb=XLSX.read(await f.arrayBuffer(),{type:'array',sheetRows:14}); const k=accScore(wb); if(k){acc.push(f);kind=kind&&kind!==k?'overview':k;continue} } }catch(e){} } rest.push(f) }
  if(rest.length)await _hf2(rest);
  if(acc.length)await sendToAcc(acc,acc.length===1?kind:'overview') };

 /* ══ G. 財務總覽小卡（ACC 最新月份） ══ */
 const _rd=RENDER.dashboard; RENDER.dashboard=function(){ const h=String(_rd.apply(this,arguments)); if(SECTION!=='fin')return h; const E=accExpense(); if(!E.length)return h; const e=E[E.length-1];
  const wipP=Object.keys((ACC.state||{}).periods||{}).filter(p=>accMod(p,'wip')).sort().pop(); const fgP=Object.keys((ACC.state||{}).periods||{}).filter(p=>accMod(p,'fg')).sort().pop();
  const wipAmt=wipP?sum(accMod(wipP,'wip').records,'wipAmount'):null, fgVal=fgP?sum(accMod(fgP,'fg').records,'value'):null;
  const card=`<div class="sec"><h4>🧾 ${tt('會計（ACC Flow）最新','Accounting (ACC Flow) latest')}</h4><div class="kpis">
   ${kpi(tt('製造費用 ','Factory expense ')+e.period,money(+e.totalCost||0,0),'',tt('直接人工 ','DL ')+money(+e.directLabor||0,0)+' · '+tt('製費 ','OH ')+money(+e.overhead||0,0))}
   ${kpi(tt('人數','Headcount'),fmt(+e.associates||0),'',tt('出勤 ','Days ')+fmt(+e.workDays||0)+tt(' 天',''))}
   ${kpi(tt('產值 PV','Production value'),money(+e.pv||0,0),'',e.salary&&e.pv?tt('人工佔產值 ','Labour/PV ')+fmt(e.salary/e.pv*100,1)+'%':'')}
   ${wipAmt!=null?kpi('WIP '+wipP,money(wipAmt,0)):''}${fgVal!=null?kpi(tt('成品入庫 ','FG inbound ')+fgP,money(fgVal,0)):''}</div>
   <p class="small muted" style="margin:4px 0 0"><a href="#acc-overview">${tt('打開會計頁 →','Open accounting →')}</a> · ${tt('雲端讀取 ','Cloud read ')}${esc(String(ACC.at||'').slice(0,16).replace('T',' '))}</p></div>`;
  const i=h.indexOf('<div class="kpis"'); return i>=0?h.slice(0,i)+card+h.slice(i):h+card };
})();
