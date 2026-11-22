/* VRT 🎵 放鬆音樂開關 v1.8（2026-11-23）— 各平台共用一支（PSJERP repo 的 music.js）
   上方一顆小小的 ON/OFF 撥動開關（♪）：點一下開／關；旁邊 ▾ 選聲音、拉音量；滑鼠滾輪在開關上也能調音量。
   預設關。雨聲／海浪／輕鋼琴是瀏覽器即時產生（不下載、不連外）；公開電台要網路，連不上自動改雨聲。
   同一個瀏覽器分頁裡開著音樂換頁：新頁面會接著播（瀏覽器若擋自動播放，點一下畫面任何地方就接上）。
   內嵌在別的平台（iframe）且外層已有開關時，內層不再出現第二顆。 */
(function(){
 if(window.__VRT_MUSIC)return; try{ if(window.top!==window&&window.top.__VRT_MUSIC)return }catch(e){} window.__VRT_MUSIC=1;
 var SRC=[{k:'rain',ic:'🌧️',t:'雨聲 Rain',gen:1},{k:'sea',ic:'🌊',t:'海浪 Ocean',gen:1},{k:'piano',ic:'🎹',t:'輕鋼琴 Soft piano',gen:1},
  {k:'classic',ic:'🎻',t:'古典電台 Classical radio',note:'Radio Swiss Classic',urls:['https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128','https://stream.srg-ssr.ch/srgssr/rsc_de/aac/96','https://stream.srg-ssr.ch/srgssr/rsc_fr/mp3/128']},
  {k:'pianor',ic:'🎼',t:'鋼琴電台 Piano radio',note:'Capriccio Piano',urls:['https://live.hdradiostreaming.com:10443/listen/capriccio_piano/stream']},
  {k:'jazz',ic:'🎷',t:'輕爵士電台 Jazz radio',note:'Radio Swiss Jazz',urls:['https://stream.srg-ssr.ch/srgssr/rsj/mp3/128','https://stream.srg-ssr.ch/srgssr/rsj/aac/96']},
  {k:'pop',ic:'🎤',t:'抒情流行電台 Soft pop radio',note:'Radio Swiss Pop',urls:['https://stream.srg-ssr.ch/srgssr/rsp/mp3/128','https://stream.srg-ssr.ch/srgssr/rsp/aac/96']},
  {k:'hitz',ic:'🇲🇾',t:'馬來西亞 HITZ',note:'HITZ Malaysia',urls:['https://stream.rcs.revma.com/488kt4sbv4uvv','https://n10.rcs.revma.com/488kt4sbv4uvv']},
  {k:'ufo',ic:'🇹🇼',t:'台灣 飛碟電台 UFO Radio',note:'飛碟聯播網',urls:['https://n10.rcs.revma.com/em90w4aeewzuv','https://stream.rcs.revma.com/em90w4aeewzuv']},
  {k:'best',ic:'📻',t:'台灣 好事聯播網 Best Radio',note:'港都 983／好事 989',urls:['https://n10.rcs.revma.com/q2m07dc59duvv','https://stream.rcs.revma.com/q2m07dc59duvv','https://n01.rcs.revma.com/fkdywbc59duvv']},
  {k:'khmer',ic:'🇰🇭',t:'柬語電台 Khmer radio',note:'Sweet FM 88',urls:['https://n12.rcs.revma.com/whn9hqwstk3vv','https://stream.rcs.revma.com/whn9hqwstk3vv']}];
 var st={src:'rain',v:40};
 try{ var j=JSON.parse(localStorage.getItem('vrt_music')||'null'); if(!j){ var o=JSON.parse(localStorage.getItem('psj_music')||'null'); if(o)j={src:o.src,v:o.vol==='s'?20:o.vol==='l'?75:40} } if(j&&SRC.some(function(x){return x.k===j.src}))st.src=j.src; if(j&&j.v>=0&&j.v<=100)st.v=+j.v }catch(e){}
 var save=function(){try{localStorage.setItem('vrt_music',JSON.stringify(st))}catch(e){}}, G=function(){return Math.pow(st.v/100,1.5)*0.85};
 var on=false,ctx=null,master=null,nodes=[],timer=0,radio=null,rTry=0,rWatch=0,waitGesture=false;
 function noiseBuf(kind){var n=ctx.sampleRate*4,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0),last=0;for(var i=0;i<n;i++){var w=Math.random()*2-1;if(kind==='brown'){last=(last+0.02*w)/1.02;d[i]=last*3.5}else d[i]=w}return b}
 function loop(buf){var s=ctx.createBufferSource();s.buffer=buf;s.loop=true;s.start();nodes.push(s);return s}
 function flt(type,f,q){var x=ctx.createBiquadFilter();x.type=type;x.frequency.value=f;if(q)x.Q.value=q;nodes.push(x);return x}
 function gain(v){var g=ctx.createGain();g.gain.value=v;nodes.push(g);return g}
 function genStop(){clearTimeout(timer);timer=0;nodes.forEach(function(n){try{n.stop&&n.stop()}catch(e){}try{n.disconnect()}catch(e){}});nodes=[]}
 function genStart(k){
  if(!ctx){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw new Error('no audio');ctx=new AC();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination)}
  if(ctx.state==='suspended')ctx.resume();
  genStop();master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(G(),ctx.currentTime,.4);
  if(k==='rain'){var w=loop(noiseBuf('white')),a=flt('highpass',900),b=flt('lowpass',7000),g=gain(.5);w.connect(a);a.connect(b);b.connect(g);g.connect(master);var r=loop(noiseBuf('brown')),c=flt('lowpass',350),g2=gain(.55);r.connect(c);c.connect(g2);g2.connect(master)}
  else if(k==='sea'){var r2=loop(noiseBuf('brown')),c2=flt('lowpass',700),g3=gain(.6);r2.connect(c2);c2.connect(g3);g3.connect(master);var lfo=ctx.createOscillator();lfo.frequency.value=.09;var lg=gain(.38);lfo.connect(lg);lg.connect(g3.gain);lfo.start();nodes.push(lfo);
   var w2=loop(noiseBuf('white')),a2=flt('bandpass',2500,.6),g4=gain(.08);w2.connect(a2);a2.connect(g4);g4.connect(master);var l2=ctx.createOscillator();l2.frequency.value=.09;var lg2=gain(.07);l2.connect(lg2);lg2.connect(g4.gain);l2.start(ctx.currentTime+2.5);nodes.push(l2)}
  else if(k==='piano'){var dly=ctx.createDelay(1);dly.delayTime.value=.33;var fb=gain(.38),lp=flt('lowpass',2200),wet=gain(.5),dry=gain(.9);nodes.push(dly);dry.connect(master);dry.connect(dly);dly.connect(lp);lp.connect(fb);fb.connect(dly);lp.connect(wet);wet.connect(master);
   var CH=[[0,4,7,12,16],[9,12,16,21,24],[5,9,12,17,21],[7,11,14,19,23]],F=function(n){return 261.63*Math.pow(2,n/12)},bar=0,beat=0;
   var note=function(n,vel,len){var t=ctx.currentTime+.02,o1=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),gg=ctx.createGain();o1.type='sine';o2.type='triangle';o1.frequency.value=F(n);o2.frequency.value=F(n)*2.001;gg.gain.value=.18;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vel,t+.012);g.gain.exponentialRampToValueAtTime(.0008,t+len);o1.connect(g);o2.connect(gg);gg.connect(g);g.connect(dry);o1.start(t);o2.start(t);o1.stop(t+len+.1);o2.stop(t+len+.1);o1.onended=function(){try{g.disconnect();gg.disconnect()}catch(e){}}};
   var tick=function(){if(!on||st.src!=='piano')return;var c=CH[bar%4];if(beat===0)note(c[0]-12,.32,4.5);if(Math.random()<.8)note(c[1+Math.floor(Math.random()*4)],.2+Math.random()*.12,3+Math.random()*1.5);if(Math.random()<.22)note(c[2]+12,.11,3);beat=(beat+1)%4;if(beat===0)bar++;timer=setTimeout(tick,650+Math.random()*900)};tick()}
 }
 function radioStop(){clearTimeout(rWatch);if(radio){try{radio.pause();radio.removeAttribute('src');radio.load()}catch(e){}radio=null}}
 function tip(t){var e=document.getElementById('vmTip');if(!e){e=document.createElement('div');e.id='vmTip';document.body.appendChild(e)}e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(function(){e.classList.remove('on')},3500)}
 function radioStart(S){radioStop();if(master&&ctx)master.gain.setTargetAtTime(0,ctx.currentTime,.2);genStop();rTry=0;
  var next=function(){if(!on||st.src!==S.k)return;if(rTry>=S.urls.length){tip('這個電台現在連不上，先改播雨聲 · Station unreachable, switched to rain');st.src='rain';save();genStart('rain');draw();return}
   var a=new Audio();radio=a;a.preload='none';a.volume=Math.min(1,G()*1.4);a.src=S.urls[rTry++];var ok=false;a.addEventListener('playing',function(){ok=true;clearTimeout(rWatch);draw()});a.addEventListener('error',function(){if(radio===a&&!ok)next()});
   clearTimeout(rWatch);rWatch=setTimeout(function(){if(radio===a&&!ok){try{a.pause()}catch(e){}next()}},15000);var p=a.play();if(p&&p.catch)p.catch(function(err){if(radio!==a||ok)return;if(err&&err.name==='NotAllowedError'){needGesture()}else next()})};next()}
 function needGesture(){ if(waitGesture)return; waitGesture=true; var h=function(){document.removeEventListener('pointerdown',h,true);document.removeEventListener('keydown',h,true);waitGesture=false;if(on)play()};document.addEventListener('pointerdown',h,true);document.addEventListener('keydown',h,true) }
 function play(){on=true;try{sessionStorage.setItem('vrt_music_on','1')}catch(e){}var S=SRC.filter(function(x){return x.k===st.src})[0]||SRC[0];
  try{if(S.gen){radioStop();genStart(S.k);setTimeout(function(){if(on&&ctx&&ctx.state!=='running')needGesture()},400)}else radioStart(S)}catch(e){on=false;tip('這個瀏覽器不能播放聲音 · Audio not supported')}draw()}
 function stop(){on=false;try{sessionStorage.removeItem('vrt_music_on')}catch(e){}radioStop();clearTimeout(timer);if(ctx&&master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(0,ctx.currentTime,.25);setTimeout(function(){if(!on){genStop();try{ctx.suspend()}catch(e){}}},900)}draw()}
 function setVol(v){st.v=Math.max(0,Math.min(100,Math.round(v)));save();if(ctx&&master&&on)master.gain.setTargetAtTime(G(),ctx.currentTime,.1);if(radio)radio.volume=Math.min(1,G()*1.4);draw(true)}
 function setSrc(k){st.src=k;save();if(on)play();else draw()}
 var css='#vmBox{display:inline-flex;align-items:center;gap:3px;font:600 10px/1 system-ui,-apple-system,"Segoe UI",sans-serif;vertical-align:middle;flex:none;-webkit-user-select:none;user-select:none}'+
 '#vmBox.float{position:fixed;z-index:9990}#vmDot{display:none}#vmBox.float.pill{gap:5px}#vmBox.pill #vpBtn{display:none}#vmBox.pill #vmSw{transform:scale(.9);transform-origin:left center;margin-right:-4px}#vmBox.pill #vmMore{width:20px;height:20px;background:rgba(20,33,61,.5);color:#fff;opacity:.85}'+
 '#vmBox.mini #vmSw,#vmBox.mini #vmMore,#vmBox.mini #vpBtn{display:none}#vmBox.mini #vmDot{display:block;width:24px;height:24px;border-radius:50%;border:0;padding:0;background:rgba(20,33,61,.42);color:#fff;font:700 13px/1 system-ui;cursor:pointer;opacity:.6}#vmBox.mini #vmDot:hover{opacity:1}#vmBox.mini #vmDot.on{background:#22a35a;opacity:.9}'+
 '#vmPanel{max-height:calc(100vh - 16px);overflow-y:auto;overscroll-behavior:contain}#vmPanel .row{display:flex!important;flex-direction:row!important;flex-wrap:nowrap!important;min-height:0;margin:0;box-shadow:none;text-transform:none;letter-spacing:0}#vmPanel .row>span{display:block;min-width:0}#vmPanel .row>span:last-child{flex:1}#vmPanel .fxl{margin:10px 4px 4px;font-size:11px;opacity:.7}#vmPanel .fx{display:flex;gap:5px;margin:0 4px}#vmPanel .fx button{flex:1;border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:5px 0;font:inherit;font-size:11.5px;cursor:pointer;color:inherit;white-space:nowrap}#vmPanel .fx button.on{background:#14213d;border-color:#14213d;color:#fff}#vmPanel .hd{display:flex;gap:8px;margin:0 0 8px}#vmPanel .hd button{flex:1;border:1px solid #d5dde5;background:#fff;border-radius:9px;padding:7px 0;font:inherit;font-weight:700;cursor:pointer;color:inherit}#vmPanel .hd .psw.on{background:#22a35a;border-color:#22a35a;color:#fff}'+
 '#vmBox.float{gap:12px}#vmBox.float #vmMore{width:26px;height:24px;font-size:11px;background:rgba(100,112,135,.62);color:#fff;opacity:.9}#vmBox.float.sm{gap:9px}'+
 '#vmSw{position:relative;width:46px;height:22px;border-radius:11px;border:0;padding:0;cursor:pointer;background:#9aa4b2;box-shadow:inset 0 1px 2px rgba(0,0,0,.28);transition:background .2s ease;color:#fff;font:inherit;letter-spacing:.3px;overflow:hidden}'+
 '#vmSw i{position:absolute;top:2px;left:2px;width:18px;height:18px;border-radius:50%;background:#fff;color:#64748b;display:grid;place-items:center;font:700 11px/1 system-ui;font-style:normal;box-shadow:0 1px 3px rgba(0,0,0,.35);transition:transform .2s ease,color .2s ease}'+
 '#vmSw b{position:absolute;top:0;bottom:0;right:5px;display:grid;place-items:center;font-weight:700;font-size:9px;transition:opacity .15s}'+
 '#vmSw.on{background:#22a35a}#vmSw.on i{transform:translateX(24px);color:#15803d}#vmSw.on b{right:auto;left:6px}'+
 '#vmSw:focus-visible,#vmMore:focus-visible{outline:2px solid #60a5fa;outline-offset:2px}'+
 '#vmMore{width:16px;height:22px;border:0;border-radius:6px;background:rgba(127,127,127,.18);color:inherit;cursor:pointer;padding:0;font:700 9px/1 system-ui;opacity:.75}#vmMore:hover{opacity:1}'+
 '#vmBox.sm #vmSw{transform:scale(.86);transform-origin:left center;margin-right:-6px}#vmBox.sm #vmMore{height:19px;background:#14213d;color:#fff}'+
 '#vmPanel{position:fixed;z-index:9992;width:min(264px,calc(100vw - 16px));background:#fff;color:#14202b;border:1px solid #d5dde5;border-radius:12px;box-shadow:0 14px 34px rgba(2,6,23,.24);padding:10px;font:13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif}'+
 '#vmPanel .row{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:7px 9px;border-radius:9px;border:1px solid transparent;background:none;color:inherit;font:inherit;cursor:pointer}#vmPanel .row:hover{background:#f1f5f9}#vmPanel .row.on{border-color:#22a35a;background:#eaf7ef;font-weight:700}'+
 '#vmPanel .row small{display:block;font-weight:400;opacity:.6;font-size:10.5px}#vmPanel .vol{display:flex;align-items:center;gap:8px;margin:8px 4px 2px}#vmPanel input[type=range]{flex:1;accent-color:#22a35a}#vmPanel .vol span{font-size:11px;opacity:.7;min-width:30px;text-align:right}'+
 '#vmPanel .q{display:flex;gap:6px;margin:6px 4px 0}#vmPanel .q button{flex:1;border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:5px 0;font:inherit;font-size:12px;cursor:pointer;color:inherit}#vmPanel .q button.on{background:#22a35a;border-color:#22a35a;color:#fff}'+
 '#vmTip{position:fixed;left:50%;top:40px;transform:translateX(-50%);z-index:9993;background:#14213d;color:#fff;padding:7px 12px;border-radius:9px;font:12px system-ui;opacity:0;pointer-events:none;transition:opacity .2s;max-width:90vw}#vmTip.on{opacity:.96}'+
 '#vmBox.nar #vmMore{display:none}'+
 '#vmBox.bl{left:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));top:auto;right:auto;z-index:44;opacity:.92;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}#vmBox.bl #vmMore{background:#14213d;color:#fff;opacity:.9}'+
 '@media print{#vmBox,#vmPanel,#vmTip,#vpPanel,#vpTint,#vpImg{display:none!important}}';
 var box,sw,more,panel,dot,T0=Date.now();
 function draw(volOnly){ if(sw){sw.classList.toggle('on',on);sw.setAttribute('aria-checked',on?'true':'false');sw.title=(on?'音樂：開 Music ON':'音樂：關 Music OFF')+'　·　音量 Volume '+st.v+'%（滾輪可調 scroll to adjust）';sw.lastChild.textContent=on?'ON':'OFF'}
  if(dot)dot.classList.toggle('on',on);
  if(!panel||panel.hidden)return; if(volOnly){var r=panel.querySelector('input[type=range]'),s=panel.querySelector('.vol span');if(r&&document.activeElement!==r)r.value=st.v;if(s)s.textContent=st.v+'%';panel.querySelectorAll('.q button').forEach(function(b){b.classList.toggle('on',+b.dataset.v===st.v)});return}
  var _vp=document.getElementById('vpBtn'),_mini=box.classList.contains('mini'),_pal=_vp&&!_vp.offsetWidth;panel.innerHTML=((_mini||_pal)?'<div class="hd">'+(_mini?'<button class="psw '+(on?'on':'')+'">♪ '+(on?'ON · 點一下關 Stop':'OFF · 點一下開 Play')+'</button>':'')+(_pal?'<button class="pal">🎨 背景 Background</button>':'')+'</div>':'')+SRC.map(function(x){return '<button class="row '+(st.src===x.k?'on':'')+'" data-k="'+x.k+'"><span style="font-size:18px;width:24px;text-align:center">'+x.ic+'</span><span>'+x.t+(x.note?'<small>'+x.note+' · 需要網路 needs internet</small>':'')+'</span></button>'}).join('')+
   '<div class="vol">🔈<input type="range" min="0" max="100" step="5" value="'+st.v+'" aria-label="Volume"><span>'+st.v+'%</span></div><div class="q">'+[[20,'小 Low'],[40,'中 Mid'],[75,'大 High']].map(function(v){return '<button data-v="'+v[0]+'" class="'+(st.v===v[0]?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>'+
   '<div class="fxl">✨ 重點卡翻頁特效 Card effect</div><div class="fx">'+FXS.map(function(f){return '<button data-fx="'+f[0]+'" class="'+(fxGet()===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>' }
 function dock(){ if(!box)return; var ref=document.querySelector('.top #langSw'), narrow=innerWidth<=640;
  /* 手機窄螢幕：上方工具列放不下，改放左下角（工具列有毛玻璃效果，fixed 不能放在它裡面） */
  if(ref){ if(box.parentNode!==ref.parentNode||box.nextSibling!==ref)ref.parentNode.insertBefore(box,ref); box.className=narrow?'nar':'' }
  else{ if(box.parentNode!==document.body)document.body.appendChild(box); var keep=box.classList.contains('mini')?' mini':box.classList.contains('pill')?' pill':'';box.className='float'+(document.getElementById('vrtLangSw')?' sm':keep) } }
 /* 浮動時（沒有 PSJERP 那種工具列的平台）：不可以蓋到頁面上原有的按鈕／文字 → 從右上角往左、往下找第一個空位 */
 function busyEl(e,win,x,y,w,h,ox,oy,depth){ if(!e)return false; var doc=e.ownerDocument;
   if(e===doc.body||e===doc.documentElement)return false;
   if(e.tagName==='IFRAME'&&depth<3){try{var d2=e.contentDocument,r2=e.getBoundingClientRect();if(d2){var hit=d2.elementFromPoint(busyEl.px-ox-r2.left,busyEl.py-oy-r2.top);return busyEl(hit,e.contentWindow,x,y,w,h,ox+r2.left,oy+r2.top,depth+1)}}catch(_){ }return false}
   if(e.closest&&e.closest('button,a,input,select,textarea,label,summary,[onclick],[role=button],[role=tab],[tabindex]'))return true;
   if(/^(IMG|SVG|CANVAS|VIDEO)$/i.test(e.tagName))return true;
   try{if(win.getComputedStyle(e).cursor==='pointer')return true}catch(_){}
   for(var c=e.firstChild;c;c=c.nextSibling){if(c.nodeType===3&&/\S/.test(c.nodeValue)){var rg=doc.createRange();rg.selectNodeContents(c);var rs=rg.getClientRects();for(var k=0;k<rs.length;k++){if(rs[k].left+ox<x+w&&rs[k].right+ox>x&&rs[k].top+oy<y+h&&rs[k].bottom+oy>y)return true}}}
   return false}
 /* 浮動時不可以蓋到頁面上原有的按鈕／文字（嵌在裡面的分頁也一起看） */
 function freeAt(x,y,w,h){x-=3;y-=3;w+=6;h+=6;var pts=[],gx,gy;for(gy=0;gy<3;gy++)for(gx=0;gx<=w;gx+=10)pts.push([Math.max(0,x+gx),Math.max(0,y+1+gy*(h-2)/2)]);
  for(var i=0;i<pts.length;i++){var els=document.elementsFromPoint(pts[i][0],pts[i][1])||[],e=null;for(var j=0;j<els.length;j++){if(box.contains(els[j])||els[j]===panel||/^vp(Tint|Img|Panel)$/.test(els[j].id||''))continue;e=els[j];break}
   busyEl.px=pts[i][0];busyEl.py=pts[i][1];if(busyEl(e,window,x,y,w,h,0,0,0))return false}
  return true}
 function place(){ if(!box)return; if(box.classList.contains('bl')){box.style.top=box.style.left=box.style.right=''}else if(box.classList.contains('float')){var l=document.getElementById('vrtLangSw');if(l){var r=l.getBoundingClientRect();box.style.top=Math.max(1,r.top)+'px';box.style.left=(r.right+6)+'px';box.style.right='auto'}else{
   /* Paul 11/23：上方角落有空間就放「完整的」（撥動開關＋▾＋🎨）；不夠放「開關＋▾」；真的都放不下才縮成小圓點。每次檢查都先試大的，空間空出來就自動變回開關。 */
   var VW=Math.min(innerWidth,document.documentElement.clientWidth||innerWidth);
   /* 位置要穩：頁面載入後 12 秒內才會找更好的位置；之後除非原位被別的東西蓋住或視窗大小變了，都不再移動、不再變形 */
   var settled=box._ok&&!box._re&&Date.now()-T0>12000;if(settled){var c0=box.getBoundingClientRect();if(c0.width&&c0.right<=VW+1&&freeAt(c0.left,c0.top,c0.width,c0.height))return placePanel()}box._re=0;/* 扣掉捲軸，不要壓在捲軸上 */var prev=box.classList.contains('mini')?'mini':box.classList.contains('pill')?'pill':'full',cur0=box.getBoundingClientRect(),ok0=box._ok,modes=['full','pill','mini'],done=false,best=null,xx,yy,bw,bh,mi,m;
   for(mi=0;mi<3&&!done;mi++){m=modes[mi];box.classList.toggle('pill',m==='pill');box.classList.toggle('mini',m==='mini');bw=box.offsetWidth||24;bh=box.offsetHeight||22;
    if(m===prev&&ok0&&cur0.width&&cur0.right<=VW&&freeAt(cur0.left,cur0.top,bw,bh)){done=true;break}
    best=null;
    /* 只找角落附近：右邊 1/3、左邊 1/5；中間不放 */
    for(xx=VW-bw-6;xx>=innerWidth*0.66&&!best;xx-=10)if(freeAt(xx,3,bw,bh))best=[xx,3];
    for(xx=4;xx+bw<=Math.max(innerWidth*0.2,bw+8)&&!best;xx+=10)if(freeAt(xx,3,bw,bh))best=[xx,3];
    if(!best&&m==='mini'){for(yy=14;yy<=260&&!best;yy+=12)if(freeAt(VW-bw-4,yy,bw,bh))best=[VW-bw-4,yy];
     for(yy=14;yy<=260&&!best;yy+=12)if(freeAt(4,yy,bw,bh))best=[4,yy];if(!best)best=[VW-bw-4,3]}
    if(best){box.style.left=best[0]+'px';box.style.top=best[1]+'px';box.style.right='auto';box._ok=1;done=true}}}}
  placePanel() }
 function placePanel(){ if(!panel||panel.hidden){if(panel)panel._at=0;return} if(panel._at)return; panel._at=1;{var b=box.getBoundingClientRect(),w=Math.min(264,innerWidth-16),h=panel.offsetHeight||300,up=b.bottom+6+h>innerHeight-4;panel.style.top=Math.max(8,Math.min(innerHeight-h-8,up?b.top-h-6:b.bottom+6))+'px';panel.style.left=Math.max(8,Math.min(innerWidth-w-8,b.left<innerWidth/2?b.left:b.right-w))+'px'} }
 function mount(){ if(document.getElementById('vmBox')||!document.body)return true;
  var stEl=document.createElement('style');stEl.id='vrt-music-css';stEl.textContent=css;document.head.appendChild(stEl);
  box=document.createElement('span');box.id='vmBox';box.innerHTML='<button id="vmDot" type="button" aria-label="Music and background" title="音樂／背景 Music &amp; background">♪</button><button id="vmSw" type="button" role="switch" aria-checked="false" aria-label="Music"><i>♪</i><b>OFF</b></button><button id="vmMore" type="button" aria-label="Music options">▾</button>';
  dock();
  sw=box.querySelector('#vmSw');more=box.querySelector('#vmMore');dot=box.querySelector('#vmDot');dot.addEventListener('click',function(){panel.hidden=!panel.hidden;draw();place()});panel=document.createElement('div');panel.id='vmPanel';panel.hidden=true;document.body.appendChild(panel);try{new MutationObserver(function(){if(panel.hidden)panel._at=0}).observe(panel,{attributes:true,attributeFilter:['hidden']})}catch(_){}
  var lp=0,lpFired=false,openP=function(){panel.hidden=false;draw();place()};
  sw.addEventListener('pointerdown',function(){lpFired=false;clearTimeout(lp);lp=setTimeout(function(){lpFired=true;openP()},480)});
  ['pointerup','pointerleave','pointercancel'].forEach(function(ev){sw.addEventListener(ev,function(){clearTimeout(lp)})});
  sw.addEventListener('contextmenu',function(e){e.preventDefault();openP()});
  /* 點一下＝開／關；長按（或按右鍵）＝選聲音、調音量。窄螢幕沒有 ▾，第一次打開時自動跳出面板讓人知道可以選 */
  sw.addEventListener('click',function(){if(lpFired){lpFired=false;return}if(on)stop();else{play();if(box.classList.contains('nar'))openP()}});
  more.addEventListener('click',function(){panel.hidden=!panel.hidden;draw();place()});
  box.addEventListener('wheel',function(e){e.preventDefault();setVol(st.v+(e.deltaY<0?5:-5));tip('🔊 '+st.v+'%')},{passive:false});
  panel.addEventListener('click',function(e){var fb=e.target.closest('[data-fx]');if(fb){try{localStorage.setItem('vrt_fx2',fb.dataset.fx)}catch(_){}draw();window.vrtFx(panel,1);return}if(e.target.closest('.psw')){if(on)stop();else play();draw();return}if(e.target.closest('.pal')){panel.hidden=true;var vb=document.getElementById('vpBtn');if(vb)vb.click();return}var r=e.target.closest('.row');if(r){setSrc(r.dataset.k);if(!on)play();return}var q=e.target.closest('.q button');if(q)setVol(+q.dataset.v)});
  panel.addEventListener('input',function(e){if(e.target.type==='range')setVol(+e.target.value)});
  document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&!box.contains(e.target))panel.hidden=true},true);
  window.addEventListener('resize',function(){box._re=1;dock();place()},{passive:true});draw();place();
  if(box.classList.contains('float')&&!box.classList.contains('bl')){var n=0,iv=setInterval(function(){var had=box.classList.contains('sm');if(document.getElementById('vrtLangSw')&&!had){box.classList.add('sm');box.classList.remove('mini');box.classList.remove('pill')}place();if(++n>12)clearInterval(iv)},500);setInterval(function(){if(!document.hidden&&(!panel||panel.hidden))place()},2000)}
  var was=false;try{was=sessionStorage.getItem('vrt_music_on')==='1'}catch(e){} if(was)play();
  return true }
 /* ✨ 重點卡（Keynote）換上一張／下一張、點開時的翻頁特效：翻書／推入／淡入／縮放／關。各平台的 Keynote 呼叫 window.vrtFx(卡片, 方向)。只做動畫，不動資料。 */
 var FXS=[['push','推入'],['flip','翻書'],['fade','淡入'],['zoom','縮放'],['off','關']];   /* 11/23 Paul：預設用不誇張的「推入」，各平台一致；點開＝由左向右出現 */
 function fxGet(){var k='push';try{k=localStorage.getItem('vrt_fx2')||'push'}catch(e){}return FXS.some(function(f){return f[0]===k})?k:'push'}
 window.vrtFx=function(el,dir,open,axis,snap){try{var k=fxGet();if(k==='off'||!el||!el.animate){if(snap&&snap.parentNode)snap.parentNode.removeChild(snap);return}if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches){if(snap&&snap.parentNode)snap.parentNode.removeChild(snap);return}
   var d=dir<0?-1:1,kf,ms=380,o0=el.style.transformOrigin,ease='cubic-bezier(.22,.61,.36,1)';
   try{(el.getAnimations?el.getAnimations():[]).forEach(function(x){if(x.id==='vrtfx')x.cancel()})}catch(_){}
   /* 上下（連續往下看下一筆）：像 PDF 連續頁——舊的那張往上推走，新的那張從下面接上來，同時動，不閃 */
   if(axis==='y'){ms=460;
    if(snap&&snap.animate){var sa=snap.animate([{transform:'translateY(0)',opacity:1},{transform:'translateY('+(-d*100)+'%)',opacity:.55}],{duration:ms,easing:ease,fill:'forwards'});var rm=function(){if(snap.parentNode)snap.parentNode.removeChild(snap)};sa.onfinish=sa.oncancel=rm;setTimeout(rm,ms+250);
     kf=[{transform:'translateY('+(d*100)+'%)',opacity:.55},{transform:'translateY(0)',opacity:1}]}
    else kf=[{transform:'translateY('+(d>0?28:-28)+'px)',opacity:0},{transform:'translateY(0)',opacity:1}]}
   else if(open&&k!=='fade'&&k!=='zoom'){kf=[{transform:'translateX(-36px)',opacity:0},{transform:'translateX(0)',opacity:1}];ms=340}   /* 點開：資訊由左向右出現 */
   else if(k==='flip'){el.style.transformOrigin=d>0?'left center':'right center';kf=[{transform:'perspective(1600px) rotateY('+(d>0?-38:38)+'deg)',opacity:.45},{transform:'perspective(1600px) rotateY(0deg)',opacity:1}];ms=520}
   else if(k==='push'){kf=[{transform:'translateX('+(d>0?48:-48)+'px)',opacity:0},{transform:'translateX(0)',opacity:1}];ms=340}
   else if(k==='fade'){kf=[{opacity:0},{opacity:1}];ms=360}
   else kf=[{transform:'scale(.95)',opacity:0},{transform:'scale(1)',opacity:1}];
   var an=el.animate(kf,{duration:ms,easing:ease});an.id='vrtfx';an.onfinish=an.oncancel=function(){el.style.transformOrigin=o0}}catch(e){}};
 /* 換內容「之前」先拍一張現在的樣子（複製一份釘在原位），換完再交給 vrtFx 一起推走 */
 window.vrtFx.snap=function(el){try{if(fxGet()==='off'||!el||!el.animate)return null;var r=el.getBoundingClientRect(),c=el.cloneNode(true),doc=el.ownerDocument;c.setAttribute('aria-hidden','true');c.setAttribute('data-noswipe','');
   c.style.cssText+=';position:fixed!important;left:'+r.left+'px!important;top:'+r.top+'px!important;width:'+r.width+'px!important;height:'+r.height+'px!important;max-height:none!important;margin:0!important;z-index:2147483600!important;pointer-events:none!important;overflow:hidden!important;animation:none!important;outline:0!important';
   doc.body.appendChild(c);c.scrollTop=el.scrollTop;return c}catch(e){return null}};
 window.vrtMusic={place:function(){place()},toggle:function(){on?stop():play()},set:setSrc,vol:setVol,state:function(){return {on:on,src:st.src,v:st.v,ctx:ctx&&ctx.state,nodes:nodes.length,radio:!!radio,wait:waitGesture}}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();

/* ===== 🎨 共用調色盤 v1（2026-11-23）— 給「自己沒有調色盤」的平台用（Admin OS、HRA Portal、HRA-PAY、SEC、GA-EXP、Audit）=====
   PSJERP／PSJHR／PSJGA／GASCheck／生產平台有自己的調色，這裡不出現、不干涉。被嵌在同網域外框裡的分頁也不出現（跟外框走）。
   做法＝在整頁最上層蓋一層「不擋滑鼠」的色片（multiply 混色）：白底變成所選淡色，字和狀態色不變；完全不動各平台的 CSS／資料。
   深色＝整頁反相（圖片再反回來，跟生產平台同一招）。背景圖＝同一招蓋一層圖，遮罩越高越淡。
   設定存 localStorage 'vrt_pal'（同網域各平台共用一份），圖存這台裝置的 IndexedDB，不上傳。 */
(function(){
 if(window.__VRT_PAL)return; window.__VRT_PAL=1;
 var P=(location.pathname||'').toLowerCase();
 if(/^\/(psjerp|psjhr|psjgas|vrt-prod|ac-gascheck)\//.test(P))return;
 try{if(window.top!==window&&window.top.location.origin===location.origin)return}catch(e){}
 /* [key, 名稱, 色票顏色, 蓋上去的色片（深色系＝整頁反相後再蓋這個色，算好會剛好變成色票那個顏色）, 是否深色] */
 var COL=[['','白色 White','#ffffff'],['ivory','象牙 Ivory','#F5EFDC'],['beige','米色 Beige','#E6DACA'],['yellow','淡黃 Yellow','#F0E4BC'],['orange','淡橘 Orange','#F7D9B5'],
  ['pink','粉紅 Pink','#F0D4DF'],['purple','淡紫 Purple','#DCD3F2'],['blue','淡藍 Blue','#CFE0F2'],['green','淡綠 Green','#D3EADB'],['grey','淺灰 Grey','#E1E5EA'],
  ['dark','黑色 Black','#1b1f27','',1],['navy','海軍藍 Navy','#162444','#CEDCFC',1],['dpurple','深紫 Purple','#2A1E44','#E2D6FC',1],['dgreen','墨綠 Green','#143026','#C0DCD2',1],['wine','酒紅 Wine','#3A1820','#F9D7DF',1]];
 /* 卡片裡的主要按鈕（編輯、下一筆…）跟著底色走：淺色底＝同色系的深色；深色底＝同色系的淺色（深色系是整頁反相，這裡的值是反相前算好的） */
 var ACC={ivory:'#A8892F',beige:'#9A6B3F',yellow:'#C99700',orange:'#D9731A',pink:'#C9457A',purple:'#7B55C7',blue:'#2F6FC2',green:'#2E8B57',grey:'#56657A',dark:'#28303B',navy:'#265079',dpurple:'#59477D',dgreen:'#0B4D31',wine:'#803E4F'};
 function hx2(h){h=(h||'#ffffff').replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
 function mixHex(a,b){var x=hx2(a),y=hx2(b);return '#'+[0,1,2].map(function(i){return ('0'+Math.round((x[i]+y[i])/2).toString(16)).slice(-2)}).join('')}
 function colOf(k){return COL.filter(function(x){return x[0]===k})[0]||null}
 var st={c:'',c2:'',veil:70},BG=null,mixMode=false;
 function load(){try{var j=JSON.parse(localStorage.getItem('vrt_pal')||'null');st={c:'',c2:'',veil:70};if(j){if(COL.some(function(x){return x[0]===j.c}))st.c=j.c;if(j.c2&&COL.some(function(x){return x[0]===j.c2}))st.c2=j.c2;if(j.veil>=0&&j.veil<=95)st.veil=+j.veil}}catch(e){}}
 function save(){try{localStorage.setItem('vrt_pal',JSON.stringify(st))}catch(e){}}
 function idb(mode,fn){return new Promise(function(res){try{var rq=indexedDB.open('vrt_pal',1);rq.onupgradeneeded=function(){rq.result.createObjectStore('kv')};rq.onerror=function(){res(null)};rq.onsuccess=function(){try{var tx=rq.result.transaction('kv',mode),r=fn(tx.objectStore('kv'));tx.oncomplete=function(){res(r&&r.result)};tx.onerror=tx.onabort=function(){res(null)}}catch(e){res(null)}}}catch(e){res(null)}})}
 function lum(c){var m=String(c||'').match(/\d+(\.\d+)?/g);if(!m||m.length<3||(m.length>3&&+m[3]===0))return null;return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255}
 function nativeDark(){var h=document.documentElement,was=h.classList.contains('vp-dark');if(was)h.classList.remove('vp-dark');var L=null;try{L=lum(getComputedStyle(document.body).backgroundColor);if(L==null)L=lum(getComputedStyle(h).backgroundColor)}catch(e){}if(was)h.classList.add('vp-dark');return L!=null&&L<0.4}
 var css='#vpTint,#vpImg{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;mix-blend-mode:multiply;z-index:2147483000}#vpImg{background-position:center;background-size:cover;background-repeat:no-repeat}'+
  'html.vp-dark{filter:invert(1) hue-rotate(180deg);background:#fff!important}html.vp-dark img,html.vp-dark video,html.vp-dark picture,html.vp-dark canvas.vp-keep,html.vp-dark #vpImg,html.vp-dark #vpPanel .sw i{filter:invert(1) hue-rotate(180deg)}html.vp-dark #kn-box,html.vp-dark .pkn-box{outline:2px solid #000;outline-offset:-1px}'+
  'html.vp-on .vp-card{box-shadow:0 12px 26px rgba(15,23,42,.24),0 3px 7px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 0 rgba(15,23,42,.10)!important;border-color:rgba(15,23,42,.26)!important;background-image:linear-gradient(150deg,rgba(255,255,255,.80) 0%,rgba(255,255,255,0) 30%,rgba(15,23,42,.06) 58%,rgba(255,255,255,.30) 74%,rgba(15,23,42,.11) 100%)!important}'+
  'html.vp-acc .cmp-acts button:not(.err):not(.gh),html.vp-acc .gip-btn.pri,html.vp-acc .ic-btn.pri,html.vp-acc .pc-btn.pri,html.vp-acc #kn-foot button:not(:disabled),html.vp-acc .kn-chip.on,html.vp-acc .kn-cc button.on{background:var(--vp-acc)!important;border-color:var(--vp-acc)!important;color:#fff!important}html.vp-acc .ic-h,html.vp-acc .pc-h{background:var(--vp-acc)!important}'+
  '#vpPanel .mx{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;font-size:11.5px}#vpPanel .mx button{border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:5px 9px;font:inherit;font-size:12px;cursor:pointer;color:inherit}#vpPanel .mx button.on{background:#14213d;border-color:#14213d;color:#fff}#vpPanel .mx i{display:inline-block;width:22px;height:22px;border-radius:50%;border:2px solid #cbd5e1;vertical-align:middle}'+
  '#vpBtn{border:0;background:rgba(127,127,127,.18);border-radius:8px;width:30px;height:26px;padding:0;margin-left:4px;font-size:16px;line-height:1;cursor:pointer}'+
  '#vpPanel{position:fixed;z-index:2147483100;width:min(296px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow-y:auto;background:#fff;color:#14202b;border:1px solid #d5dde5;border-radius:12px;box-shadow:0 14px 34px rgba(2,6,23,.24);padding:10px 12px;font:13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}'+
  '#vpPanel b.h{display:block;margin-bottom:8px}#vpPanel .sw{display:flex;flex-wrap:wrap;gap:8px}#vpPanel .swl{font-size:11px;opacity:.65;margin:10px 0 6px}#vpPanel .sw button{width:46px;border:0;background:none;padding:0;font:inherit;font-size:10.5px;color:inherit;cursor:pointer;text-align:center}#vpPanel .sw i{display:block;width:34px;height:34px;margin:0 auto 3px;border-radius:50%;border:2px solid #cbd5e1}#vpPanel .sw button.on i{border-color:#22a35a;box-shadow:0 0 0 3px rgba(34,163,90,.25)}'+
  '#vpPanel .im{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #e5eaf0}#vpPanel .im button{border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:5px 9px;font:inherit;font-size:12px;cursor:pointer;color:inherit}#vpPanel .im label{display:flex;align-items:center;gap:6px;font-size:12px;width:100%}#vpPanel .im input{flex:1;accent-color:#22a35a}#vpPanel small{display:block;opacity:.65;font-size:10.5px;margin-top:6px}';
 var tint,img,btn,panel;
 function apply(){ if(!document.body)return;
  var c=COL.filter(function(x){return x[0]===st.c})[0]||COL[0],dark=!!c[4],h=document.documentElement,ov=dark?c[3]:(c[0]?c[2]:'');
  /* 兩色混合：同一組（淺配淺、深配深）各取一半 */
  var c2=st.c2&&c[0]?colOf(st.c2):null;if(c2&&c2[0]&&!!c2[4]===!!c[4]&&c2[0]!==c[0])ov=mixHex(ov||'#ffffff',(dark?c2[3]:c2[2])||'#ffffff');
  if(dark&&nativeDark()){dark=false;ov=''}
  var acc=(ov||dark)?(c2&&c2[0]&&ACC[c2[0]]?mixHex(ACC[c[0]],ACC[c2[0]]):ACC[c[0]]):'';if(acc)h.style.setProperty('--vp-acc',acc);else h.style.removeProperty('--vp-acc');h.classList.toggle('vp-acc',!!acc);
  if(ov){if(!tint){tint=document.createElement('div');tint.id='vpTint';tint.setAttribute('aria-hidden','true')}tint.style.background=ov;if(tint.parentNode!==document.body)document.body.appendChild(tint)}else if(tint&&tint.parentNode)tint.parentNode.removeChild(tint);
  h.classList.toggle('vp-dark',dark);h.classList.toggle('vp-on',!!(ov||dark||BG));cards();

  if(BG){if(!img){img=document.createElement('div');img.id='vpImg';img.setAttribute('aria-hidden','true')}var v=(st.veil/100).toFixed(2);img.style.backgroundImage='linear-gradient(rgba(255,255,255,'+v+'),rgba(255,255,255,'+v+')),url("'+BG+'")';if(img.parentNode!==document.body)document.body.appendChild(img)}else if(img&&img.parentNode)img.parentNode.removeChild(img) }
 /* 換了底色／背景圖後，卡片要「浮起來」：加影子、邊線、一點金屬光澤（Paul 11/23：不然卡片跟背景黏在一起）。
    只加在原本沒有漸層圖的卡片上，不改它原本的底色；關掉調色（白色、沒背景圖）就全部拿掉。 */
 var CSEL='.kpi,.kpi-card,.stat-card,.sum-card,.metric,.kc,.kcard,.card,.exp-card,.sew-card,.tile,.panel,.box,.sbox,.kn-n,[class*="kpi-"],[class*="-kpi"],[class$="-card"],[class*="-card "]',ct=0;
 function cards(){ if(ct)return; ct=setTimeout(function(){ct=0;try{
   var on=document.documentElement.classList.contains('vp-on'),els=document.querySelectorAll(on?CSEL:'.vp-card'),n=0;
   for(var i=0;i<els.length&&n<600;i++){var e=els[i];if(!on){e.classList.remove('vp-card');continue}if(e.classList.contains('vp-card')||e.__vpc)continue;n++;
    if(e.closest('#vmPanel,#vpPanel,#vmBox'))continue;var w=e.offsetWidth,hh=e.offsetHeight;if(w<70||hh<36){continue}
    var cs=getComputedStyle(e);e.__vpc=1;if(cs.backgroundImage!=='none'||cs.position==='fixed')continue;var bg=cs.backgroundColor.match(/[\d.]+/g)||[];if(bg.length>3&&+bg[3]<0.4)continue;
    e.classList.add('vp-card')}}catch(_){}},160)}
 try{new MutationObserver(function(){if(document.documentElement.classList.contains('vp-on'))cards()}).observe(document.documentElement,{subtree:true,childList:true})}catch(_){}
 function draw(){ if(!panel||panel.hidden)return;
  panel.innerHTML='<b class="h">🎨 背景顏色 Background（這台裝置會記住）</b><div class="sw">'+COL.filter(function(x){return !x[4]}).map(function(x){return '<button data-c="'+x[0]+'" class="'+(st.c===x[0]?'on':'')+'"><i style="background:'+x[2]+'"></i>'+x[1]+'</button>'}).join('')+'</div><div class="swl">深色 Dark</div><div class="sw">'+COL.filter(function(x){return x[4]}).map(function(x){return '<button data-c="'+x[0]+'" class="'+(st.c===x[0]?'on':'')+'"><i style="background:'+x[2]+'"></i>'+x[1]+'</button>'}).join('')+'</div>'+
   '<div class="mx"><button data-a="mix" class="'+(mixMode?'on':'')+'">🎨＋🎨 混色 Mix</button>'+(mixMode?'<span>再點一個顏色 pick a second colour</span>':'')+(st.c2&&colOf(st.c2)&&colOf(st.c)?'<span>'+colOf(st.c)[1].split(' ')[0]+'＋'+colOf(st.c2)[1].split(' ')[0]+' ＝ <i style="background:'+mixHex(colOf(st.c)[2],colOf(st.c2)[2])+'"></i></span><button data-a="unmix">取消混色 Unmix</button>':'')+'</div>'+
   '<div class="im"><button data-a="pick">🖼️ 自訂背景圖 Image</button>'+(BG?'<button data-a="clear">✕ 移除 Remove</button><label>遮罩 Veil <input type="range" min="30" max="95" step="5" value="'+st.veil+'"><span>'+st.veil+'%</span></label>':'')+'</div><small>圖片只存在這台裝置，不會上傳。遮罩越高，圖越淡、字越清楚。<br>The image stays on this device. Higher veil = fainter image.</small>';
  var b=(btn.offsetWidth?btn:document.getElementById('vmBox')).getBoundingClientRect(),w=Math.min(296,innerWidth-16),hh=panel.offsetHeight||260,up=b.bottom+6+hh>innerHeight-4&&b.top>hh;panel.style.top=(up?Math.max(6,b.top-hh-6):b.bottom+6)+'px';panel.style.left=Math.max(8,Math.min(innerWidth-w-8,b.right-w))+'px' }
 function shrink(file){return (window.createImageBitmap?createImageBitmap(file):Promise.reject()).then(function(bmp){var k=Math.min(1,1600/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*k));c.height=Math.max(1,Math.round(bmp.height*k));c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.8)})}
 function pick(){var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;shrink(f).then(function(d){BG=d;apply();draw();idb('readwrite',function(s){return s.put(d,'bg')});try{localStorage.setItem('vrt_pal_img',String(Date.now()))}catch(e){}}).catch(function(){})};inp.click()}
 function mount(){ var box=document.getElementById('vmBox'); if(!box||btn)return !!btn;
  var s=document.createElement('style');s.id='vrt-pal-css';s.textContent=css;document.head.appendChild(s);
  btn=document.createElement('button');btn.id='vpBtn';btn.type='button';btn.title='背景顏色／背景圖 Background';btn.setAttribute('aria-label','Background colour');btn.textContent='🎨';box.appendChild(btn);
  panel=document.createElement('div');panel.id='vpPanel';panel.hidden=true;document.body.appendChild(panel);
  btn.addEventListener('click',function(e){e.stopPropagation();panel.hidden=!panel.hidden;draw()});
  panel.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='mix'){mixMode=!mixMode;draw();return}if(b.dataset.a==='unmix'){st.c2='';mixMode=false;save();apply();draw();return}
   if(b.dataset.c!=null){var k=b.dataset.c,a0=colOf(st.c),a1=colOf(k);if(mixMode&&st.c&&k&&k!==st.c&&a0&&a1&&!!a0[4]===!!a1[4]){st.c2=k}else{st.c=k;st.c2=''}mixMode=false;save();apply();draw()}else if(b.dataset.a==='pick')pick();else if(b.dataset.a==='clear'){BG=null;apply();draw();idb('readwrite',function(s){return s.delete('bg')});try{localStorage.setItem('vrt_pal_img',String(Date.now()))}catch(e){}}});
  panel.addEventListener('input',function(e){if(e.target.type==='range'){st.veil=+e.target.value;save();apply();var sp=panel.querySelector('label span');if(sp)sp.textContent=st.veil+'%'}});
  document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&e.target!==btn&&!(e.target.closest&&e.target.closest('#vmPanel .pal')))panel.hidden=true},true);
  try{window.vrtMusic&&window.vrtMusic.place()}catch(e){} return true }
 function readImg(){return idb('readonly',function(s){return s.get('bg')}).then(function(d){BG=(typeof d==='string'&&d.indexOf('data:image/')===0)?d:null;apply();draw()})}
 function start(){load();apply();readImg();var n=0,iv=setInterval(function(){if(mount()||++n>40)clearInterval(iv)},250);mount();
  window.addEventListener('storage',function(e){if(e.key==='vrt_pal'){load();apply();draw()}else if(e.key==='vrt_pal_img')readImg()})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
