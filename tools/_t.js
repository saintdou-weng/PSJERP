
/* ---------- v1.4.1 (2026-11-06)：💹 款式損益（哪款賺、哪款賠、每月） ----------
   三種算法（同一套單件成本 costOrder：BOM×料價＋SMV×工資率／製費率＋運稅）：
   ・成品入庫（預設）：ACC 每月成品入庫明細（件數、產值）→ 每月實際做出來的東西賺多少；月表另列 ACC 實際工廠費用對照。
   ・出貨：ERP 出貨（W_CBL300）按出貨月。 ・訂單：ERP 訂單按下單月。
   單號對單號（自編單號＝selfKey／my_no），對不到才用同款最近訂單的成本。 */
(function(){
 T.stylepl=['款式損益','Style P&L','ចំណេញតាមម៉ូដ'];
 T.sub_stylepl=['哪一款賺、哪一款賠、每個月賺多少。單件成本＝BOM×料價＋SMV×工資／製費率＋運稅（同成本分析）；有樣衣圖的款會顯示照片。','Which styles make or lose money, and by month. Unit cost = BOM × price + SMV × labour/OH rate + freight/duty (same as Costing).'];
 const i=MODS.findIndex(m=>m[0]==='costing'); MODS.splice(i>=0?i+1:MODS.length,0,['stylepl','💹','g_cost','fin']); try{renderNav()}catch(e){}
 if(typeof PAGE_DS!=='undefined')PAGE_DS.stylepl=['bom','price','purchase'];
 const KN=s=>String(s==null?'':s).toUpperCase().replace(/[^A-Z0-9]/g,'');
 const ordIdx=()=>{ if(GC.has('plord'))return GC.get('plord'); const my=new Map(), st=new Map();
  ordersView().forEach(o=>{ if(!(o.price>0))return; const k=KN(o.my_no); if(k&&!my.has(k))my.set(k,o); const s=KN(o.style); if(s){const p=st.get(s); if(!p||(o.order_date||'')>(p.order_date||''))st.set(s,o)} });
  const r={my,st}; GC.set('plord',r); return r };
 const cc=o=>{ let m=GC.get('plc'); if(!m){m=new Map();GC.set('plc',m)} const k=o.id||(o.od_no+'|'+o.my_no+'|'+o.price); if(!m.has(k))m.set(k,costOrder(o,'latest')); return m.get(k) };
 function rowsOf(basis,y){ const key='plrows|'+basis+'|'+y; if(GC.has(key))return GC.get(key); const I=ordIdx(), out=[];
  const push=(ym,o,style,cust,qty,rev,how)=>{ const c=o?cc(o):null; out.push({ym,style:style||(o&&o.style)||'',cust:cust||(o&&o.cust)||'',qty:+qty||0,rev:+rev||0,c:c&&c.total!=null?c:null,o,how}) };
  if(basis==='fg'){ accRows('fg').filter(r=>String(r.period||'').startsWith(y)).forEach(r=>{ let o=I.my.get(KN(r.selfKey)), how='my'; if(!o){o=I.st.get(KN(r.style));how='style'} const q=+r.qty||0; push(r.period,o,r.style,r.customer,q,+r.value||q*(+r.unitPrice||0),how) }) }
  else if(basis==='ship'){ shipView().filter(s=>String(s.ship_date||'').startsWith(y)).forEach(s=>{ let o=I.my.get(KN(s.my_no)), how='my'; if(!o){o=I.st.get(KN(s.style));how='style'} const q=+s.qty||0; const rev=s.amount!=null&&s.amount!==''?+s.amount:q*((o&&o.price)||0); push(String(s.ship_date).slice(0,7),o,s.style,s.cust,q,rev,how) }) }
  else { ordersView().filter(o=>String(o.order_date||'').startsWith(y)&&o.price>0).forEach(o=>push(String(o.order_date).slice(0,7),o,o.style,o.cust,o.qty,(+o.qty||0)*o.price,'my')) }
  GC.set(key,out); return out }
 const agg=(rows,kf)=>{ const m=new Map(); rows.forEach(r=>{ const k=kf(r); let a=m.get(k); if(!a){a={k,qty:0,rev:0,cost:0,mat:0,lab:0,oh:0,qtyC:0,revC:0,nc:0,custs:new Set(),o:null,smv:0,smvSrc:''};m.set(k,a)}
   a.qty+=r.qty; a.rev+=r.rev; if(r.cust)a.custs.add(r.cust); if(r.c){ a.qtyC+=r.qty; a.revC+=r.rev; a.cost+=r.qty*r.c.total; a.mat+=r.qty*r.c.mat; a.lab+=r.qty*r.c.labor; a.oh+=r.qty*r.c.oh; if(!a.o){a.o=r.o;a.smv=r.c.smv;a.smvSrc=r.c.smvSrc} } else a.nc+=r.qty });
  m.forEach(a=>{ a.margin=a.revC-a.cost; a.mpct=a.revC?a.margin/a.revC*100:null; a.unit=a.qtyC?a.cost/a.qtyC:null; a.price=a.qty?a.rev/a.qty:null }); return [...m.values()] };
 const bar=(v,max)=>{ const w=max?Math.min(100,Math.abs(v)/max*100):0; return `<div style="height:6px;background:var(--line,#eee);border-radius:3px;overflow:hidden;min-width:60px"><div style="height:100%;width:${w}%;background:${v<0?'var(--crit,#d33)':'var(--good,#2a9d5c)'}"></div></div>` };
 const pc=v=>v==null?'—':fmt(v,1)+'%';
 window.plSet=(k,v)=>{ S('stylepl')[k]=v; rerender() };
 window.plExport=function(){ const st=S('stylepl'); const rows=window.__plLast||[]; if(!rows.length)return; const ws=XLSX.utils.json_to_sheet(rows.map(a=>({[st.view==='month'?'月份':st.view==='cust'?'客戶':'款號']:a.k,件數:a.qty,營收或產值:+a.rev.toFixed(2),可估算件數:a.qtyC,預估成本:+a.cost.toFixed(2),料費:+a.mat.toFixed(2),工資:+a.lab.toFixed(2),製費:+a.oh.toFixed(2),預估毛利:+a.margin.toFixed(2),'毛利%':a.mpct==null?'':+a.mpct.toFixed(1),SMV:a.smv||''}))); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'P&L'); XLSX.writeFile(wb,`VRT_款式損益_${st.y}_${st.basis}_${st.view}.xlsx`) };
 RENDER.stylepl=function(){
  const st=S('stylepl'); st.y=st.y||String(TODAY.getFullYear()); st.basis=st.basis||'fg'; st.view=st.view||'style'; st.f=st.f||'all'; st.m=st.m||''; st.sort=st.sort||'margin';
  if(!ACC_CACHE.state&&st.basis==='fg'){ accLoad(false) }
  let rows=rowsOf(st.basis,st.y); if(st.m)rows=rows.filter(r=>r.ym===st.m);
  const yrs=[...new Set([TODAY.getFullYear(),TODAY.getFullYear()-1,TODAY.getFullYear()-2,TODAY.getFullYear()-3].map(String))];
  const months=[...new Set(rowsOf(st.basis,st.y).map(r=>r.ym))].sort();
  const T0=agg(rows,()=> 'all')[0]||{qty:0,rev:0,cost:0,margin:0,mpct:null,qtyC:0,nc:0};
  const byStyle=agg(rows,r=>KN(r.style)||'—'); const lossN=byStyle.filter(a=>a.qtyC&&a.margin<0).length, winN=byStyle.filter(a=>a.qtyC&&a.margin>=0).length;
  const R=rates();
  const seg=(k,opts)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${st[k]===v?'on':''}" onclick="plSet('${k}','${v}')">${l}</button>`).join('')}</div>`;
  let h=pageHead('stylepl',`<button class="btn sm" onclick="plExport()">⬇ Excel</button>`);
  h+=`<div class="toolbar" style="gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
   <select class="inp" style="width:auto" onchange="plSet('y',this.value);S('stylepl').m=''">${yrs.map(y=>`<option ${y===st.y?'selected':''}>${y}</option>`).join('')}</select>
   <select class="inp" style="width:auto" onchange="plSet('m',this.value)"><option value="">${tt('全年','Whole year')}</option>${months.map(m=>`<option value="${m}" ${m===st.m?'selected':''}>${m}</option>`).join('')}</select>
   ${seg('basis',[['fg',tt('成品入庫','FG inbound')],['ship',tt('出貨','Shipped')],['order',tt('訂單','Orders')]])}
   ${seg('view',[['style',tt('按款','By style')],['month',tt('按月','By month')],['cust',tt('按客戶','By customer')]])}
   ${st.view==='style'?seg('f',[['all',tt('全部','All')],['loss','🔴 '+tt('賠錢','Losing')],['win','🟢 '+tt('賺錢','Profitable')]]):''}</div>
   <p class="small muted" style="margin:0 0 10px">${st.basis==='fg'?tt('成品入庫＝會計每月成品入庫明細（ACC），代表當月實際做出來的件數與產值。','FG inbound = monthly accounting FG detail (ACC): what was actually produced.'):st.basis==='ship'?tt('出貨＝ERP 出貨明細（W_CBL300），按出貨月。','Shipped = ERP shipments by ship month.'):tt('訂單＝ERP 訂單，按下單月（含還沒做的）。','Orders = ERP orders by order month (incl. not yet made).')}
   ${R.basis==='acc'?tt(' 工資率 ',' Labour ')+money(R.labor,4)+tt('、製費率 ',', OH ')+money(R.oh,4)+tt('／SMV 分（ACC ','/SMV min (ACC ')+R.from+'～'+R.to+tt('，效率 ',', eff ')+costEff()+'%）':''}</p>`;
  h+=`<div class="kpis">${kpi(st.basis==='fg'?tt('產值','Production value'):tt('營收','Revenue'),money(T0.rev,0),'',fmt(T0.qty)+tt(' 件',' pcs'))}${kpi(tt('預估成本','Est. cost'),money(T0.cost,0),'',T0.nc?tt('未估算 ','Not costed ')+fmt(T0.nc)+tt(' 件',' pcs'):'')}
   ${kpi(tt('預估毛利','Est. margin'),money(T0.margin,0),'',pc(T0.mpct),T0.margin<0?'crit':'good')}${kpi('🟢 '+tt('賺錢款','Profitable styles'),fmt(winN))}${kpi('🔴 '+tt('賠錢款','Losing styles'),fmt(lossN),'','',lossN?'crit':'')}</div>`;
  let list;
  if(st.view==='month'){ list=agg(rows,r=>r.ym).sort((a,b)=>a.k.localeCompare(b.k)); const E=new Map(accExpense().map(e=>[e.period,e]));
   const max=Math.max(1,...list.map(a=>Math.abs(a.margin)));
   h+=`<div class="tw"><table class="tbl"><thead><tr><th>${tt('月份','Month')}</th><th class="r">${tt('件數','Pcs')}</th><th class="r">${st.basis==='fg'?tt('產值','Value'):tt('營收','Revenue')}</th><th class="r">${tt('料費','Material')}</th><th class="r">${tt('工＋費（估）','Lab+OH (est)')}</th><th class="r">${tt('預估毛利','Est. margin')}</th><th class="r">%</th><th></th><th class="r">${tt('實際工廠費用','Actual factory exp.')}</th><th class="r" title="${tt('產值 − 料費 − 實際工廠費用（直接人工＋製造費用）','Value − material − actual factory expense')}">${tt('實際貢獻','Actual contribution')}</th></tr></thead><tbody>`;
   list.forEach(a=>{ const e=E.get(a.k); const act=e?(+e.directLabor||+e.salary||0)+(+e.overhead||0):null; const contrib=act!=null&&a.qtyC?a.revC-a.mat-act:null;
    h+=`<tr><td class="mono"><a href="javascript:void 0" onclick="S('stylepl').m='${a.k}';plSet('view','style')">${a.k}</a></td><td class="r num">${fmt(a.qty)}</td><td class="r num">${money(a.rev,0)}</td><td class="r num">${money(a.mat,0)}</td><td class="r num">${money(a.lab+a.oh,0)}</td><td class="r num" style="color:${a.margin<0?'var(--crit,#c00)':''}">${money(a.margin,0)}</td><td class="r num">${pc(a.mpct)}</td><td>${bar(a.margin,max)}</td><td class="r num">${act!=null?money(act,0):'—'}</td><td class="r num" style="color:${contrib<0?'var(--crit,#c00)':''}"><b>${contrib!=null?money(contrib,0):'—'}</b></td></tr>` });
   h+='</tbody></table></div>';
   if(st.basis==='fg')h+=`<p class="small muted">${tt('「實際貢獻」用的是會計當月真的花掉的工廠費用（ACC：直接人工＋製造費用），比估算更貼近實際；兩者差很多代表當月效率或產量跟平常不同。','"Actual contribution" uses the factory expense actually spent that month (ACC). A big gap vs the estimate means that month’s efficiency or volume was unusual.')}</p>`;
  } else if(st.view==='cust'){ list=agg(rows,r=>r.cust||'—').sort((a,b)=>b.margin-a.margin); const max=Math.max(1,...list.map(a=>Math.abs(a.margin)));
   h+=`<div class="tw"><table class="tbl"><thead><tr><th>${tt('客戶','Customer')}</th><th class="r">${tt('件數','Pcs')}</th><th class="r">${tt('營收／產值','Revenue')}</th><th class="r">${tt('單件均價','Avg price')}</th><th class="r">${tt('單件成本','Unit cost')}</th><th class="r">${tt('預估毛利','Est. margin')}</th><th class="r">%</th><th></th></tr></thead><tbody>`;
   list.forEach(a=>{ h+=`<tr><td>${esc(a.k)}</td><td class="r num">${fmt(a.qty)}</td><td class="r num">${money(a.rev,0)}</td><td class="r num">${money(a.price,2)}</td><td class="r num">${a.unit!=null?money(a.unit,2):'—'}</td><td class="r num" style="color:${a.margin<0?'var(--crit,#c00)':''}">${money(a.margin,0)}</td><td class="r num">${pc(a.mpct)}</td><td>${bar(a.margin,max)}</td></tr>` }); h+='</tbody></table></div>';
  } else { list=byStyle.filter(a=>st.f==='loss'?(a.qtyC&&a.margin<0):st.f==='win'?(a.qtyC&&a.margin>=0):true);
   list.sort((a,b)=>st.sort==='pct'?((a.mpct??1e9)-(b.mpct??1e9)):st.sort==='qty'?b.qty-a.qty:(st.f==='win'?b.margin-a.margin:a.margin-b.margin));
   const max=Math.max(1,...list.map(a=>Math.abs(a.margin))); const nImg=list.filter(a=>hasImg(a.k)).length;
   h+=`<p class="small muted" style="margin:0 0 6px">${fmt(list.length)} ${tt('款','styles')} · 📷 ${fmt(nImg)} ${tt('款有樣衣圖','with photo')} · ${tt('排序','Sort')}: ${seg('sort',[['margin',tt('毛利額','Margin $')],['pct',tt('毛利%','Margin %')],['qty',tt('件數','Pcs')]])}</p>`;
   h+=`<div class="tw"><table class="tbl"><thead><tr><th></th><th>${tt('款號','Style')}</th><th>${tt('客戶','Customer')}</th><th class="r">${tt('件數','Pcs')}</th><th class="r">${tt('均價','Avg price')}</th><th class="r">${tt('單件成本','Unit cost')}</th><th class="r">${tt('單件毛利','Margin/pc')}</th><th class="r">%</th><th class="r">${tt('毛利額','Margin $')}</th><th></th><th class="r">SMV</th></tr></thead><tbody>`;
   list.slice(0,400).forEach(a=>{ const up=a.qtyC?(a.revC/a.qtyC):null, mpu=a.unit!=null&&up!=null?up-a.unit:null;
    h+=`<tr style="cursor:pointer" onclick="openStyle('${esc(a.k)}')"><td style="width:44px">${hasImg(a.k)?styPh(a.k,'sty-th'):'<span class="muted small">—</span>'}</td><td class="mono"><b>${esc(a.k)}</b></td><td class="small">${esc([...a.custs].join(', '))}</td><td class="r num">${fmt(a.qty)}</td><td class="r num">${money(a.price,2)}</td><td class="r num">${a.unit!=null?money(a.unit,2):'<span class="muted small">'+tt('缺 BOM／SMV','no BOM/SMV')+'</span>'}</td>
     <td class="r num" style="color:${mpu<0?'var(--crit,#c00)':''}">${mpu!=null?money(mpu,2):'—'}</td><td class="r num">${pc(a.mpct)}</td><td class="r num" style="color:${a.margin<0?'var(--crit,#c00)':''}"><b>${a.qtyC?money(a.margin,0):'—'}</b></td><td>${a.qtyC?bar(a.margin,max):''}</td><td class="r small">${a.smv?fmt(a.smv,2)+'<br><span class="muted">'+esc(smvSrcName(a.smvSrc))+'</span>':'—'}</td></tr>` });
   h+='</tbody></table></div>'; if(list.length>400)h+=`<p class="small muted">${tt('只列前 400 款，其餘請匯出 Excel。','First 400 styles shown; export to Excel for the rest.')}</p>`;
  }
  window.__plLast=list; setTimeout(()=>{try{fillImgs(document.getElementById('page'))}catch(e){}},30);
  return h };

 /* SMV 對款再寬一點：VRT875 → 875、875RESLS → 875RES／875；客戶前綴（DI-1818 → DI1818） */
 const _so=window.smvOfOrder; window.smvOfOrder=function(o){ const r=_so(o); if(r)return r; const s=KN(o.style); const c=[s.replace(/^VRT/,''),s.replace(/(LS|SS|SP|CHP)$/,''),s.replace(/^[A-Z]{1,3}(?=\d)/,'')].filter((x,i,a)=>x&&x!==s&&x.length>=3&&a.indexOf(x)===i);
  for(const x of c){ try{ const y=smvFor(x,''); if(y)return Object.assign({},y,{via:x}) }catch(e){} } return null };
})();
