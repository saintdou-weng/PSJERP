import openpyxl,sys,json,datetime,re,collections,statistics
D=sys.argv[1]; OUT=sys.argv[2]
K=lambda s:re.sub(r'[^A-Z0-9]','',str(s or '').upper())
def d(v): return v.strftime('%Y-%m-%d') if isinstance(v,datetime.datetime) else ''
def n(v):
    try: return float(v)
    except: return 0.0
TODAY='2026-11-11'; END='2026-12-12'; HOL={'2026-11-23','2026-11-24','2026-11-25'}
def workdays(a,b):
    x=datetime.date.fromisoformat(a); e=datetime.date.fromisoformat(b); o=[]
    while x<=e:
        if x.weekday()!=6 and x.isoformat() not in HOL: o.append(x.isoformat())
        x+=datetime.timedelta(days=1)
    return o
DAYS=workdays(TODAY,END)
def day_idx_on_or_after(ds):
    for i,x in enumerate(DAYS):
        if x>=ds: return i
    return len(DAYS)
# ---- SMV + actual
wb2=openpyxl.load_workbook(D+'/dpo.xlsx',read_only=True,data_only=True); SMV={}
for r in wb2['SMV'].iter_rows(min_row=4,values_only=True):
    if r and len(r)>4 and r[3] and n(r[4])>0: SMV[K(r[3])]=(n(r[4]),str(r[2] or '').upper())
act=[]
for sn in wb2.sheetnames:
    if not re.fullmatch(r'\d\d',sn): continue
    for r in wb2[sn].iter_rows(min_row=5,values_only=True):
        if not r or not r[0] or not str(r[0]).startswith('Line'): continue
        q=n(r[7])
        if q>0: act.append(('2026-11-'+sn,'L'+re.sub(r'\D','',str(r[0])),K(r[3]),q,str(r[9] or '').upper(),n(r[10])))
        if q>0 and n(r[10])>0 and K(r[3]) not in SMV: SMV[K(r[3])]=(n(r[10]),str(r[9] or '').upper())
tavg={}
for t in ['GARMENT','APRON','TOP','NAPKIN']:
    v=[s for s,ty in SMV.values() if t in ty]; tavg[t]=statistics.median(v) if v else 5
def smv_of(style,typ):
    k=K(style)
    for m in range(len(k),3,-1):
        if k[:m] in SMV: return SMV[k[:m]][0],('表' if m==len(k) else '同款'),k[:m]
    return tavg.get(typ,5),'估',k
lm=collections.defaultdict(lambda: collections.defaultdict(float)); lt=collections.defaultdict(lambda: collections.defaultdict(float)); lstyles=collections.defaultdict(dict)
for dt,l,s,q,ty,sv in act:
    lm[l][dt]+=q*sv; lt[l]['G' if 'GARMENT' in ty else 'F']+=q*sv; lstyles[l][s]=dt
LINES={}
for l in sorted(lm,key=lambda x:int(x[1:])):
    v=sorted(lm[l].values()); cap=statistics.median(v)
    LINES[l]=dict(cap=cap,kind='G' if lt[l]['G']>=lt[l]['F'] else 'F',both=min(lt[l]['G'],lt[l]['F'])>0.25*sum(lt[l].values()),recent=lstyles[l],t=0.0,last=max(lstyles[l],key=lstyles[l].get),blocks=[])
# ---- demand
wb=openpyxl.load_workbook(D+'/stats.xlsx',read_only=True,data_only=True); ws=wb['ALL CUSTOMER']
rows=[]
for r in ws.iter_rows(min_row=5,values_only=True):
    r=list(r)+[None]*70; t=str(r[4] or '').strip().upper()
    if t not in ('GARMENT','APRON','TOP','NAPKIN') or not r[5] or not r[6] or n(r[56])<=0: continue
    ns=n(r[56]); unc=min(n(r[37]),ns); yd=n(r[14])
    if not (0<yd<=10): yd=(n(r[17])/n(r[37])) if n(r[37])>0 and 0<n(r[17])/max(n(r[37]),1)<=10 else 0
    rows.append(dict(cust=str(r[0]).strip(),ship=d(r[2]),type=t,po=str(r[5]).strip(),style=str(r[6]).strip(),item=str(r[12] or '').strip(),yd=yd,stock=n(r[18]),fab=str(r[20] or '').strip().upper(),ns=ns,unc=unc,ready=ns-unc,line=str(r[43] or '')))
# incoming fabric 11/13
wf=openpyxl.load_workbook(D+'/fabric.xlsx',read_only=True,data_only=True); inc=collections.defaultdict(float)
for r in wf['ETA 11-13-2026'].iter_rows(min_row=8,values_only=True):
    if r and r[1] and str(r[1]).startswith('TCF'): inc[str(r[1]).strip()]+=n(r[10])
stock={}
for x in rows:
    if x['item']: stock[x['item']]=max(stock.get(x['item'],0),x['stock'])
tr=[]; nofab=[]
for x in sorted(rows,key=lambda x:(x['ship'] or '9999')):
    if x['ready']>0: tr.append(dict(x,q=x['ready'],rd=TODAY,src='已裁'))
    u=x['unc']
    if u<=0: continue
    it=x['item']; yd=x['yd']
    if x['fab'] in ('ON HOLD','MOQ'): nofab.append(dict(x,q=u,why=x['fab'])); continue
    if not yd or not it:
        if x['fab']=='YES': tr.append(dict(x,q=u,rd=DAYS[2],src='有布'))
        else: nofab.append(dict(x,q=u,why='缺布'))
        continue
    a=min(u,int(stock.get(it,0)/yd)); 
    if a>0: stock[it]-=a*yd; tr.append(dict(x,q=a,rd=DAYS[2],src='有布')); u-=a
    if u>0:
        b=min(u,int(inc.get(it,0)/yd))
        if b>0: inc[it]-=b*yd; tr.append(dict(x,q=b,rd='2026-11-17',src='布 11/13 到')); u-=b
    if u>0: nofab.append(dict(x,q=u,why='缺布'))
# ---- group tranches into jobs by (cust,po,style,rd)
J={}
for t in tr:
    sv,ss,fam=smv_of(t['style'],t['type'])
    k=(fam,t['rd'],t['type'])
    j=J.setdefault(k,dict(cust=t['cust'],style=fam,type=t['type'],rd=t['rd'],ship=t['ship'],q=0,pos=set(),hint=set(),src=t['src'],smv=sv,smvsrc=ss,custs=set(),mins=0))
    j['q']+=t['q']; j['mins']+=t['q']*sv; j['pos'].add(t['po']); j['custs'].add(t['cust'])
    if t['ship'] and (not j['ship'] or t['ship']<j['ship']): j['ship']=t['ship']; [j['hint'].add('L'+h) for h in re.findall(r'\d+',t['line'])[:3]]
jobs=sorted(J.values(),key=lambda j:(j['ship'] or '9999',j['rd'],-j['q']))
CAPDAY=len(DAYS)
unsched=[]
for j in jobs:
    sv,ss=j['smv'],j['smvsrc']; mins=j['mins']; kind='G' if j['type']=='GARMENT' else 'F'; ks=K(j['style'])
    best=None
    for l,L in LINES.items():
        if L['kind']!=kind and not L['both']: continue
        start=max(L['t'],day_idx_on_or_after(j['rd'])); chg=0 if L['last']==ks else (0.08 if j['q']<200 else 0.25)
        fin=start+chg+mins/L['cap']; score=fin
        if ks in L['recent']: score-=1.5
        elif l in j['hint']: score-=0.7
        if L['last']==ks: score-=1.0
        if best is None or score<best[0]: best=(score,l,start+chg,fin)
    if best is None or best[2]>=CAPDAY: unsched.append(j); continue
    _,l,st,fin=best; L=LINES[l]; L['t']=fin; L['last']=ks
    def dt(x): i=min(int(x),CAPDAY-1); return DAYS[i]
    L['blocks'].append(dict(style=j['style'],cust='/'.join(sorted(j['custs'])),type=j['type'],q=round(j['q']),pos=sorted(j['pos'])[:4],npo=len(j['pos']),start=dt(st),end=dt(max(st,fin-1e-6)) if fin<CAPDAY else '12/12 之後',over=fin>=CAPDAY,ship=j['ship'],smv=round(sv,2),smvsrc=ss,src=j['src'],mins=round(mins)))
res=dict(today=TODAY,end=END,days=DAYS,lines={l:dict(cap=round(L['cap']),kind=L['kind'],blocks=L['blocks'],free=(DAYS[int(L['t'])] if L['t']<CAPDAY else None)) for l,L in LINES.items()},
 nofab=sorted([dict(cust=x['cust'],po=x['po'],style=x['style'],type=x['type'],q=round(x['q']),ship=x['ship'],why=x['why'],item=x['item']) for x in nofab],key=lambda x:-x['q']),
 unsched=[dict(cust=j['cust'],style=j['style'],q=round(j['q']),ship=j['ship']) for j in unsched])
json.dump(res,open(OUT,'w'),ensure_ascii=False)
tot=sum(x['ns'] for x in rows); sch=sum(b['q'] for L in LINES.values() for b in L['blocks'])
print('未車縫',round(tot),'可排',round(sum(t['q'] for t in tr)),'已排',sch,'缺布',round(sum(x['q'] for x in nofab)),'排不進',round(sum(j['q'] for j in unsched)))
print('src',collections.Counter({k:0 for k in []}) , {s:round(sum(t['q'] for t in tr if t['src']==s)) for s in ('已裁','有布','布 11/13 到')})
for l,L in LINES.items():
    bl=L['blocks']; print(l,L['kind'],'cap',round(L['cap']),'blocks',len(bl),'pcs',sum(b['q'] for b in bl),'free',res['lines'][l]['free'],'|',' > '.join(f"{b['style']}({b['q']},{b['start'][5:]}~{str(b['end'])[5:]})" for b in bl[:5]))
late=[(l,b) for l,L in LINES.items() for b in L['blocks'] if b['ship'] and str(b['end'])>b['ship']]
print('late blocks',len(late),'pcs',sum(b['q'] for _,b in late)); print('smv src',collections.Counter(b['smvsrc'] for L in LINES.values() for b in L['blocks']))
