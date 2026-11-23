/* v2.12（2026-11-23）：加 4 張會動的風景壁紙、手機轉橫保持直立。
   VRT 🎵 放鬆音樂開關 v2.5（2026-11-23）— 各平台共用一支（PSJERP repo 的 music.js）
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
  {k:'love',ic:'💗',t:'英文抒情歌電台 Love songs',note:'181.fm The Heart',urls:['https://listen.181fm.com/181-heart_128k.mp3','https://stream-uk1.radioparadise.com/mellow-128']},
  {k:'best',ic:'📻',t:'台灣 好事聯播網 Best Radio',note:'港都 983／好事 989',urls:['https://n10.rcs.revma.com/q2m07dc59duvv','https://stream.rcs.revma.com/q2m07dc59duvv','https://n01.rcs.revma.com/fkdywbc59duvv']},
  {k:'khmer',ic:'🇰🇭',t:'柬語電台 Khmer radio',note:'Sweet FM 88',urls:['https://n12.rcs.revma.com/whn9hqwstk3vv','https://stream.rcs.revma.com/whn9hqwstk3vv']}];
 var st={src:'rain',v:40};
 try{ var j=JSON.parse(localStorage.getItem('vrt_music')||'null'); if(!j){ var o=JSON.parse(localStorage.getItem('psj_music')||'null'); if(o)j={src:o.src,v:o.vol==='s'?20:o.vol==='l'?75:40} } if(j&&j.src==='ufo')j.src='love'; if(j&&SRC.some(function(x){return x.k===j.src}))st.src=j.src; if(j&&j.v>=0&&j.v<=100)st.v=+j.v }catch(e){}
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
 '@media print{#vmBox,#vmPanel,#vmTip,#vpPanel,#vpTint,#vpImg,#vpWp{display:none!important}}';
 var box,sw,more,panel,dot,T0=Date.now();
 function draw(volOnly){ if(sw){sw.classList.toggle('on',on);sw.setAttribute('aria-checked',on?'true':'false');sw.title=(on?'音樂：開 Music ON':'音樂：關 Music OFF')+'　·　音量 Volume '+st.v+'%（滾輪可調 scroll to adjust）';sw.lastChild.textContent=on?'ON':'OFF'}
  if(dot)dot.classList.toggle('on',on);
  if(!panel||panel.hidden)return; if(volOnly){var r=panel.querySelector('input[type=range]'),s=panel.querySelector('.vol span');if(r&&document.activeElement!==r)r.value=st.v;if(s)s.textContent=st.v+'%';panel.querySelectorAll('.q button').forEach(function(b){b.classList.toggle('on',+b.dataset.v===st.v)});return}
  var _vp=document.getElementById('vpBtn'),_mini=box.classList.contains('mini'),_pal=_vp&&!_vp.offsetWidth;panel.innerHTML=((_mini||_pal)?'<div class="hd">'+(_mini?'<button class="psw '+(on?'on':'')+'">♪ '+(on?'ON · 點一下關 Stop':'OFF · 點一下開 Play')+'</button>':'')+(_pal?'<button class="pal">'+(_vp&&_vp.textContent==='🧱'?'🧱 壁紙 Wallpaper':'🎨 背景 Background')+'</button>':'')+'</div>':'')+SRC.map(function(x){return '<button class="row '+(st.src===x.k?'on':'')+'" data-k="'+x.k+'"><span style="font-size:18px;width:24px;text-align:center">'+x.ic+'</span><span>'+x.t+(x.note?'<small>'+x.note+' · 需要網路 needs internet</small>':'')+'</span></button>'}).join('')+
   '<div class="vol">🔈<input type="range" min="0" max="100" step="5" value="'+st.v+'" aria-label="Volume"><span>'+st.v+'%</span></div><div class="q">'+[[20,'小 Low'],[40,'中 Mid'],[75,'大 High']].map(function(v){return '<button data-v="'+v[0]+'" class="'+(st.v===v[0]?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>'+
   '<div class="fxl">✨ 重點卡翻頁特效 Card effect</div><div class="fx">'+FXS.map(function(f){return '<button data-fx="'+f[0]+'" class="'+(fxGet()===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>' }
 /* v2.10.0：嵌在分頁裡的頁面比外面那頁早載入時，會多出一顆音樂開關 → 發現外面那頁也有，就把自己這顆收掉 */
 try{if(window.top!==window){var dupN=0,dupT=setInterval(function(){var tp=false;try{tp=!!window.top.__VRT_MUSIC}catch(e){}
   if(tp){clearInterval(dupT);try{if(on)stop()}catch(e){}try{var b=document.getElementById('vmBox');if(b)b.style.display='none'}catch(e){}}else if(++dupN>15)clearInterval(dupT)},1000)}}catch(e){}
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
   設定存 localStorage 'vrt_pal:<平台>'（v2.4 起每個平台各一份），圖存這台裝置的 IndexedDB，不上傳。 */
(function(){
 if(window.__VRT_PAL)return; window.__VRT_PAL=1;
 var P=(location.pathname||'').toLowerCase();
 /* v2.4（2026-11-23 Paul）：
    ① 每個平台各記各的顏色／壁紙（存 'vrt_pal:<平台>'），不再全部平台共用一份；還沒自己設定過的平台先沿用舊的共用設定，改了才分開。
    ② GASCheck 也用這個調色盤（混色、壁紙都有）；它原本的 🎨 收起來，底層主題改成中性（見 gc-theme.js）。
    ③ PSJERP／PSJHR／PSJGA 的顏色是它們自己的主題在管（卡片有自己的層次），這裡只多給「🧱 壁紙」。
    ④ 壁紙不再蓋在最上層（會蓋過卡片，卡片就不凸了）——改成畫在「頁面底色那一層」，卡片、按鈕自然壓在花紋上面。 */
 var PLAT=(P.split('/')[1]||'root'),KEY='vrt_pal:'+PLAT,WPONLY=/^(psjerp|psjhr|psjgas)$/.test(PLAT),GCK=PLAT==='ac-gascheck';
 var PROD=/^\/vrt-prod\//.test(P);   /* 生產平台：2026-11-23 起也用這個調色盤（原本入口頁的 🎨 收進來）；明暗沿用它自己的 ☀️／🌙（vrt-theme），這裡不另外做深色 */
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
 var st={c:'',c2:'',veil:70,wp:''},BG=null,mixMode=false;
 /* 🧱 壁紙 v2（2026-11-23 Paul 看過第一版後）：花紋要小、有間隔、有立體感；金屬要有鐵片的光澤。
    每種花紋都是「亮邊＋暗邊」的浮雕畫法（左上受光），畫在頁面底色那一層；深色底用另一組濃淡。 */
 function svgU(w,h,body){return 'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+body+'</svg>')+'")'}
 var WPS=[['','無 None'],['grid','格子 Grid'],['dots','圓點 Dots'],['stars','星星 Stars'],['diamond','菱形 Diamond'],['clover','四葉草 Clover'],['stone','石壁 Stone'],['brick','磚牆 Brick'],['metal','金屬 Metal'],['a_sun','☀️ 藍天白雲（會動）'],['a_river','🏞️ 小河平原（會動）'],['a_rain','🌧️ 雷雨（會動）'],['a_car','🚗 鄉間小車（會動）']];
 /* v2.9 風景壁紙（自己畫的向量圖，不是照片，不用下載）：貼在畫面最下面一條、左右連續，上面是很淡的天色；捲動時不跟著跑。 */
 var SCN={};
 function scene(k,dark){var key=k+(dark?1:0);if(SCN[key])return SCN[key];var sd=k.length*7919+17,b='',W0=1200,H0=420,x,i;
  function R(){sd=(sd*9301+49297)%233280;return sd/233280}
  function hill(y0,amp,per,ph,fill,op){var d='M0 '+H0,xx;for(xx=0;xx<=W0;xx+=20)d+=' L'+xx+' '+(y0-amp*Math.sin((xx/W0)*Math.PI*2*per+ph)-amp*.4*Math.sin((xx/W0)*Math.PI*2*per*3+ph*2)).toFixed(1);return '<path d="'+d+' L'+W0+' '+H0+' Z" fill="'+fill+'" fill-opacity="'+op+'"/>'}
  var sky;
  if(k==='town'){var cols=['#e9b384','#d98b6a','#f1d9a7','#b9c7a4','#a8c3d8','#e3a7a0','#cdb7dc','#f0c987'],roofs=['#9a4a3a','#7a4638','#8d5a4a','#5d6f86'];
   b+=hill(300,26,2,.6,'#8fb08a',.35);
   for(x=0;x<W0;){var w=58+Math.round(R()*52);if(W0-x-w<50)w=W0-x;var h=96+Math.round(R()*86),y=H0-h,c=cols[Math.floor(R()*cols.length)],rf=roofs[Math.floor(R()*roofs.length)],rh=26+Math.round(R()*30);
    b+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'" fill-opacity=".82"/><path d="M'+(x-3)+' '+y+' L'+(x+w/2)+' '+(y-rh)+' L'+(x+w+3)+' '+y+' Z" fill="'+rf+'" fill-opacity=".85"/>';
    var cn=Math.max(2,Math.floor(w/26)),rn=Math.max(2,Math.floor(h/36));for(var a=0;a<cn;a++)for(var q=0;q<rn;q++)b+='<rect x="'+(x+9+a*((w-18)/cn)).toFixed(0)+'" y="'+(y+12+q*32)+'" width="10" height="15" rx="1" fill="'+(R()<.3?'#ffe9a8':'#fdfdfb')+'" fill-opacity=".8"/>';
    if(R()<.16)b+='<rect x="'+(x+w/2-7)+'" y="'+(y-rh-70)+'" width="14" height="74" fill="#c9b79c" fill-opacity=".85"/><path d="M'+(x+w/2-11)+' '+(y-rh-70)+' L'+(x+w/2)+' '+(y-rh-112)+' L'+(x+w/2+11)+' '+(y-rh-70)+' Z" fill="#5d6f86" fill-opacity=".9"/>';
    x+=w}
   b+='<rect x="0" y="'+(H0-10)+'" width="'+W0+'" height="10" fill="#8a8f98" fill-opacity=".5"/>';sky='linear-gradient(180deg,rgba(186,214,238,0) 30%,rgba(186,214,238,.38) 70%,rgba(250,221,190,.42) 100%)'}
  else if(k==='night'){b+='<circle cx="930" cy="70" r="26" fill="#fff7d6" fill-opacity=".9"/><circle cx="930" cy="70" r="44" fill="#fff7d6" fill-opacity=".14"/>';
   for(i=0;i<46;i++)b+='<circle cx="'+Math.round(R()*W0)+'" cy="'+Math.round(R()*150)+'" r="'+(R()<.2?1.6:1)+'" fill="#fff" fill-opacity="'+(.4+R()*.5).toFixed(2)+'"/>';
   for(var ly=0;ly<2;ly++)for(x=0;x<W0;){var w2=42+Math.round(R()*56);if(W0-x-w2<40)w2=W0-x;var h2=(ly?70:150)+Math.round(R()*(ly?150:170)),y2=H0-h2;
    b+='<rect x="'+x+'" y="'+y2+'" width="'+w2+'" height="'+h2+'" fill="'+(ly?'#0b1630':'#1b2a52')+'" fill-opacity="'+(ly?.92:.7)+'"/>';
    if(R()<.3)b+='<rect x="'+(x+w2/2-1)+'" y="'+(y2-22)+'" width="2" height="22" fill="#0b1630" fill-opacity=".9"/>';
    for(var a2=x+6;a2<x+w2-8;a2+=11)for(var q2=y2+8;q2<H0-8;q2+=14)if(R()<(ly?.42:.3))b+='<rect x="'+a2+'" y="'+q2+'" width="5" height="7" fill="'+(R()<.8?'#ffd76a':'#9fd8ff')+'" fill-opacity="'+(.55+R()*.4).toFixed(2)+'"/>';
    x+=w2}
   sky='linear-gradient(180deg,rgba(30,41,90,'+(dark?.0:.10)+') 0%,rgba(30,41,90,'+(dark?.25:.34)+') 55%,rgba(88,60,130,'+(dark?.3:.40)+') 100%)'}
  else if(k==='forest'){b+=hill(250,34,1,.4,'#9cc79a',.5)+hill(290,26,2,1.7,'#6fae78',.6);
   for(i=0;i<34;i++){var tx=Math.round((i+R()*.7)*(W0/34)),th=70+Math.round(R()*90),ty=H0-18-Math.round(R()*26),tw=th*.42;
    if(R()<.6)b+='<path d="M'+tx+' '+(ty-th)+' L'+(tx-tw/2)+' '+ty+' L'+(tx+tw/2)+' '+ty+' Z" fill="'+(R()<.5?'#2f7d4f':'#3f9360')+'" fill-opacity=".82"/><rect x="'+(tx-2)+'" y="'+ty+'" width="4" height="14" fill="#6b4a32" fill-opacity=".8"/>';
    else b+='<rect x="'+(tx-3)+'" y="'+(ty-th*.45)+'" width="6" height="'+(th*.45+14).toFixed(0)+'" fill="#6b4a32" fill-opacity=".8"/><circle cx="'+tx+'" cy="'+(ty-th*.62).toFixed(0)+'" r="'+(th*.3).toFixed(0)+'" fill="'+(R()<.5?'#58a85f':'#7cc06d')+'" fill-opacity=".85"/>'}
   b+=hill(404,7,4,.2,'#4f9a58',.9)+'<circle cx="170" cy="74" r="30" fill="#fff3b0" fill-opacity=".7"/>';sky='linear-gradient(180deg,rgba(190,228,236,0) 30%,rgba(190,228,236,.34) 72%,rgba(214,240,200,.42) 100%)'}
  else{b+=hill(230,30,1,2.2,'#a9cfa6',.5)+hill(275,22,2,.5,'#7fb886',.6);
   var d1='M0 '+H0,d2='';for(x=0;x<=W0;x+=20){var yy=330+18*Math.sin((x/W0)*Math.PI*4);d1+=' L'+x+' '+yy.toFixed(1)}
   b+='<path d="'+d1+' L'+W0+' '+H0+' Z" fill="#5fa9d6" fill-opacity=".78"/>';
   for(i=0;i<26;i++){var wx=Math.round(R()*W0),wy=350+Math.round(R()*56),wl=24+Math.round(R()*46);b+='<rect x="'+wx+'" y="'+wy+'" width="'+wl+'" height="2" rx="1" fill="#fff" fill-opacity="'+(.35+R()*.4).toFixed(2)+'"/>'}
   for(i=0;i<16;i++){var rx=Math.round((i+R()*.6)*(W0/16)),ry=300+Math.round(18*Math.sin((rx/W0)*Math.PI*4))+4,rh2=44+Math.round(R()*50);
    b+='<rect x="'+(rx-2)+'" y="'+(ry-rh2*.4).toFixed(0)+'" width="5" height="'+(rh2*.4+8).toFixed(0)+'" fill="#6b4a32" fill-opacity=".8"/><circle cx="'+rx+'" cy="'+(ry-rh2*.6).toFixed(0)+'" r="'+(rh2*.32).toFixed(0)+'" fill="'+(R()<.5?'#4f9a58':'#77b96b')+'" fill-opacity=".85"/>'}
   sky='linear-gradient(180deg,rgba(186,220,240,0) 30%,rgba(186,220,240,.36) 72%,rgba(160,208,236,.44) 100%)'}
  return SCN[key]={i:[svgU(W0,H0,b),sky],s:['auto 44vh','100% 100%'],p:['center bottom','0 0'],r:['repeat-x','no-repeat'],a:['fixed','fixed'],pv:1}}
 /* v2.12 會動的風景壁紙（2026-11-23 Paul）：藍天白雲／小河平原／雷雨／鄉間小車野餐。
    整張 SVG 自己畫、用 SVG 內建動畫（SMIL），不下載、不跑程式；固定在畫面後面、半透明，不擋前面的卡片。
    同一段動作一直重複，動得慢、量不多。手機直立時看中間那一塊，所以主角都放在畫面中間。 */
 var ANI={};
 function animScene(k,dark){var key=k+(dark?1:0);if(ANI[key])return ANI[key];
  var W=1200,H=800,b='',d='',i,sd=k.length*7717+29;
  function R(){sd=(sd*9301+49297)%233280;return sd/233280}
  function f(n){return (+n).toFixed(1)}
  function drift(inner,dur,beg,dx){return '<g>'+'<animateTransform attributeName="transform" type="translate" from="'+(-(dx||420))+' 0" to="'+(W+(dx||420))+' 0" dur="'+dur+'s" begin="-'+beg+'s" repeatCount="indefinite"/>'+inner+'</g>'}
  function cloud(x,y,s,c,op){return '<g transform="translate('+f(x)+' '+f(y)+') scale('+s+')" fill="'+c+'" fill-opacity="'+op+'"><ellipse cx="0" cy="0" rx="70" ry="30"/><ellipse cx="-48" cy="10" rx="46" ry="24"/><ellipse cx="50" cy="8" rx="52" ry="26"/><ellipse cx="-8" cy="-22" rx="44" ry="30"/><ellipse cx="30" cy="-14" rx="36" ry="24"/></g>'}
  function tree(x,y,s,c,sway){var g='<g transform="translate('+f(x)+' '+f(y)+') scale('+s+')"><g>'+(sway?'<animateTransform attributeName="transform" type="rotate" values="-2 0 0;2 0 0;-2 0 0" dur="'+(4+R()*3).toFixed(1)+'s" repeatCount="indefinite"/>':'')+
    '<rect x="-3" y="-26" width="6" height="26" fill="#7a5a3c"/><circle cx="0" cy="-40" r="20" fill="'+c+'"/><circle cx="-11" cy="-30" r="13" fill="'+c+'"/><circle cx="11" cy="-31" r="14" fill="'+c+'"/><circle cx="-6" cy="-47" r="8" fill="#fff" fill-opacity=".18"/></g></g>';return g}
  function house(x,y,s,wall,roof){return '<g transform="translate('+f(x)+' '+f(y)+') scale('+s+')"><rect x="-22" y="-26" width="44" height="26" fill="'+wall+'"/><path d="M-28 -26 L0 -48 L28 -26Z" fill="'+roof+'"/><rect x="-5" y="-14" width="10" height="14" fill="#7a5a3c"/><rect x="-17" y="-20" width="8" height="7" fill="#fdf3c4"/><rect x="9" y="-20" width="8" height="7" fill="#fdf3c4"/></g>'}
  function sky(a,c){return '<defs><linearGradient id="sk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+c+'"/></linearGradient></defs><rect width="'+W+'" height="'+H+'" fill="url(#sk)"/>'}
  function sun(x,y,r){var rays='';for(i=0;i<12;i++){var a=i*30;rays+='<rect x="-3" y="'+(-r-34)+'" width="6" height="20" rx="3" fill="#ffd25a" fill-opacity=".7" transform="rotate('+a+')"/>'}
   return '<g transform="translate('+x+' '+y+')"><circle r="'+(r+44)+'" fill="#fff1b3" fill-opacity=".35"><animate attributeName="r" values="'+(r+36)+';'+(r+54)+';'+(r+36)+'" dur="7s" repeatCount="indefinite"/></circle><g><animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="140s" repeatCount="indefinite"/>'+rays+'</g><circle r="'+r+'" fill="#ffcf4a"/><circle r="'+(r*.72)+'" fill="#ffe27a"/></g>'}
  function bird(dur,beg,y,s){return '<g><animateTransform attributeName="transform" type="translate" values="-80 '+y+';'+(W+80)+' '+(y-40)+'" dur="'+dur+'s" begin="-'+beg+'s" repeatCount="indefinite"/><g transform="scale('+s+')"><path fill="none" stroke="#3b4a5a" stroke-width="2.4" stroke-linecap="round" d="M-10 0 Q-5 -7 0 0 Q5 -7 10 0"><animate attributeName="d" values="M-10 0 Q-5 -7 0 0 Q5 -7 10 0;M-10 2 Q-5 5 0 0 Q5 5 10 2;M-10 0 Q-5 -7 0 0 Q5 -7 10 0" dur=".9s" repeatCount="indefinite"/></path></g></g>'}

  if(k==='a_sun'){b+=sky('#6fbfee','#dff2fb')+sun(760,150,54);
   b+=drift(cloud(0,120,1.1,'#fff',.95),110,10)+drift(cloud(0,250,.8,'#fff',.9),80,50)+drift(cloud(0,330,1.3,'#fff',.85),140,95)+drift(cloud(0,470,.7,'#fff',.8),95,30)+drift(cloud(0,560,1,'#fff',.75),125,70);
   b+='<path d="M0 760 Q300 700 600 740 T1200 730 V800 H0Z" fill="#bfe3c4" fill-opacity=".7"/>'}

  else if(k==='a_river'){b+=sky('#bfe2f6','#eef6e6');
   b+=drift(cloud(0,90,.8,'#fff',.9),120,20)+drift(cloud(0,170,.6,'#fff',.85),90,60);
   b+='<path d="M0 300 Q200 286 400 296 T800 292 T1200 298 V800 H0Z" fill="#a9d690"/>';
   for(i=0;i<6;i++)b+='<path d="M0 '+(330+i*80)+' Q600 '+(318+i*80)+' 1200 '+(332+i*80)+'" stroke="#c6e6a8" stroke-opacity=".6" stroke-width="'+(6+i*4)+'" fill="none"/>';
   var L='',Rr='',C='';for(var y=296;y<=H;y+=10){var t=(y-296)/(H-296),cx=600+ (30+170*t)*Math.sin(t*Math.PI*2.6)*.9,w=5+150*t*t+30*t;L+=(y===296?'M':' L')+f(cx-w)+' '+y;Rr=' L'+f(cx+w)+' '+y+Rr;C+=(y===296?'M':' L')+f(cx)+' '+y}
   b+='<path d="'+L+Rr+' Z" fill="#6ab3de"/><path d="'+L+'" fill="none" stroke="#e8f3d8" stroke-width="5"/>';
   b+='<path d="'+C+'" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-dasharray="14 46" stroke-linecap="round"><animate attributeName="stroke-dashoffset" from="0" to="-60" dur="2.4s" repeatCount="indefinite"/></path>';
   b+='<path d="'+C+'" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2" stroke-dasharray="6 70" transform="translate(-18 0)"><animate attributeName="stroke-dashoffset" from="0" to="-76" dur="3.1s" repeatCount="indefinite"/></path>';
   var hs=[[430,420,1,'#f4e3c3','#b5523b'],[790,390,.8,'#f6efe2','#5d6f86'],[300,560,1.4,'#efe0c8','#9a4a3a'],[880,610,1.6,'#f6efe2','#b5523b'],[520,340,.6,'#f4e3c3','#5d6f86'],[1050,470,1.1,'#efe0c8','#9a4a3a'],[150,450,1.1,'#f6efe2','#5d6f86']];
   hs.forEach(function(h){b+=house(h[0],h[1],h[2],h[3],h[4])});
   b+='<g><circle cx="438" cy="372" r="5" fill="#fff" fill-opacity=".7"><animate attributeName="cy" values="372;330" dur="5s" repeatCount="indefinite"/><animate attributeName="fill-opacity" values=".7;0" dur="5s" repeatCount="indefinite"/></circle></g>';
   var ts=[[380,470,1],[700,420,.8],[820,520,1.3],[240,640,1.7],[980,700,1.9],[470,700,1.6],[640,350,.6],[1120,560,1.3],[90,560,1.3],[560,470,.9]];
   ts.forEach(function(t){b+=tree(t[0],t[1],t[2],R()<.5?'#5aa55e':'#79bc66',true)})}

  else if(k==='a_rain'){b+=sky('#535d6b','#8b95a0');
   b+='<path d="M0 640 Q250 600 520 630 T1200 620 V800 H0Z" fill="#5e6e66"/><path d="M0 700 Q300 670 640 696 T1200 690 V800 H0Z" fill="#4c5c55"/>';
   for(i=0;i<9;i++)b+=tree(80+i*135+R()*40,690+R()*40,1+R()*.5,'#3f5a49',false);
   b+=house(560,700,1.6,'#9aa3a0','#4a4f57')+'<rect x="537" y="676" width="13" height="11" fill="#ffd977" fill-opacity=".85"/>';
   b+=drift(cloud(0,90,2.2,'#39424d',.95),200,30,600)+drift(cloud(0,150,1.8,'#454e5a',.9),160,110,600)+drift(cloud(0,60,2.6,'#2f3741',.95),240,170,700)+drift(cloud(0,230,1.4,'#4b5561',.85),180,60,500);
   d+='<pattern id="rp" width="48" height="64" patternUnits="userSpaceOnUse"><path d="M10 0 l-6 22 M34 18 l-6 22 M22 40 l-6 22" stroke="#dfe8f2" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/><animateTransform attributeName="patternTransform" type="translate" from="0 0" to="-12 64" dur=".55s" repeatCount="indefinite"/></pattern>';
   b+='<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.06;.12;.68;.75;1" dur="46s" repeatCount="indefinite"/><rect width="'+W+'" height="'+H+'" fill="url(#rp)"/></g>';
   b+='<rect width="'+W+'" height="'+H+'" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0;.5;0;.3;0;0" keyTimes="0;.55;.56;.575;.59;.61;1" dur="23s" repeatCount="indefinite"/></rect>';
   b+='<path d="M660 170 L630 250 L655 250 L620 340 L690 230 L662 230 L690 170Z" fill="#fff6c8" opacity="0"><animate attributeName="opacity" values="0;0;1;0;.8;0;0" keyTimes="0;.55;.56;.575;.59;.61;1" dur="23s" repeatCount="indefinite"/></path>';
   b+='<rect width="'+W+'" height="'+H+'" fill="#fff" opacity="0"><animate attributeName="opacity" values="0;0;.35;0;0" keyTimes="0;.3;.31;.33;1" dur="37s" repeatCount="indefinite"/></rect>'}

  else if(k==='a_car'){b+=sky('#8fd0f3','#e9f7fd')+sun(820,130,40);
   b+=drift(cloud(0,110,.8,'#fff',.9),130,40)+drift(cloud(0,210,.6,'#fff',.85),100,80);
   b+=bird(26,4,250,1)+bird(26,5.2,270,.8)+bird(26,6,240,.7)+bird(34,20,180,.9);
   b+='<rect x="0" y="560" width="'+W+'" height="240" fill="#79b86a"/><g transform="translate(0 -90)">';
   b+='<path d="M0 520 Q180 380 380 470 T760 430 T1200 470 V800 H0Z" fill="#a8d394"/><path d="M0 590 Q260 510 520 570 T1000 545 T1200 560 V800 H0Z" fill="#84c174"/>';
   for(i=0;i<11;i++)b+=tree(40+i*110+R()*50,560+R()*40,.9+R()*.6,R()<.5?'#4f9a58':'#6db362',true);
   b+='<rect x="0" y="642" width="'+W+'" height="70" fill="#d9c39a"/><rect x="0" y="642" width="'+W+'" height="5" fill="#c4ab7f"/><rect x="0" y="707" width="'+W+'" height="5" fill="#c4ab7f"/><rect x="0" y="712" width="'+W+'" height="88" fill="#79b86a"/>';
   for(i=0;i<14;i++)b+=tree(30+i*90+R()*40,790,.9+R()*.4,'#5aa55e',false);
   /* 一家人＋野餐墊：車停下來的那段時間才出現 */
   d+='<pattern id="ck" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#fff"/><rect width="8" height="8" fill="#e05a4f"/><rect x="8" y="8" width="8" height="8" fill="#e05a4f"/></pattern>';
   function ppl(x,y,s,shirt){return '<g transform="translate('+x+' '+y+') scale('+s+')"><rect x="-7" y="-26" width="14" height="22" rx="6" fill="'+shirt+'"/><rect x="-6" y="-6" width="5" height="10" fill="#3d4a66"/><rect x="1" y="-6" width="5" height="10" fill="#3d4a66"/><circle cy="-34" r="8" fill="#f2c9a0"/><path d="M-8 -36 Q0 -46 8 -36" fill="#3b2a20"/></g>'}
   var fam='<path d="M610 636 L740 636 L760 612 L630 612Z" fill="url(#ck)"/><rect x="668" y="606" width="22" height="14" rx="3" fill="#a8743f"/><path d="M670 606 Q679 594 688 606" fill="none" stroke="#7a5230" stroke-width="2"/>'+
     ppl(625,636,1,'#4f86c6')+ppl(755,636,1,'#e08ab0')+'<g>'+'<animateTransform attributeName="transform" type="translate" values="0 0;0 -8;0 0" dur="1.1s" repeatCount="indefinite"/>'+ppl(700,640,.7,'#f2b84b')+'</g>'+ppl(650,640,.65,'#6cbf8a');
   b+='<g opacity="0"><animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;.37;.41;.6;.64;1" dur="50s" repeatCount="indefinite"/>'+fam+'</g>';
   /* 小車（圓頂、自己畫的，沒有任何廠牌）：開進來、停一下、再開走 */
   var wheel=function(cx){return '<g transform="translate('+cx+' 690)"><circle r="15" fill="#2f3542"/><circle r="7" fill="#c9ced6"/><g><animateTransform attributeName="transform" type="rotate" values="0;2480;2480;5400" keyTimes="0;.35;.65;1" dur="50s" repeatCount="indefinite"/><rect x="-1.5" y="-13" width="3" height="26" fill="#c9ced6"/><rect x="-13" y="-1.5" width="26" height="3" fill="#c9ced6"/></g></g>'};
   var car='<g><animateTransform attributeName="transform" type="translate" values="-220 0;0 0;0 0;900 0" keyTimes="0;.35;.65;1" dur="50s" repeatCount="indefinite"/>'+
     '<g transform="translate(470 0)"><ellipse cx="60" cy="706" rx="62" ry="6" fill="#000" fill-opacity=".12"/>'+
     '<path d="M4 690 Q2 662 26 656 Q40 618 76 618 Q104 620 116 656 Q126 662 124 690Z" fill="#ef7b5f"/>'+
     '<path d="M40 656 Q48 628 74 628 Q96 630 104 656Z" fill="#cfe9f7"/><rect x="71" y="628" width="4" height="28" fill="#ef7b5f"/>'+
     '<circle cx="118" cy="670" r="5" fill="#fff4b0"/><rect x="0" y="682" width="128" height="6" rx="3" fill="#c9ced6"/>'+wheel(32)+wheel(98)+'</g></g>';
   b+=car+'</g>'}
  var op=dark?.38:.55,svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="xMidYMax slice"><defs>'+d+'</defs><g opacity="'+op+'">'+b+'</g></svg>';
  return ANI[key]={i:['url("data:image/svg+xml,'+encodeURIComponent(svg)+'")'],s:['cover'],p:['center bottom'],r:['no-repeat'],a:['fixed'],pv:2}}
 function wpCss(k,dark){
  if(/^a_/.test(k))return animScene(k,dark);
  if(k==='town'||k==='night'||k==='forest'||k==='river')return scene(k,dark);
  var dk=dark?1.9:1,hl=dark?.22:1;
  function D(a){return 'fill="#0f172a" fill-opacity="'+Math.min(.9,a*dk).toFixed(3)+'"'}
  function L(a){return 'fill="#fff" fill-opacity="'+Math.min(.95,a*hl).toFixed(3)+'"'}
  function DS(a,w){return 'fill="none" stroke="#0f172a" stroke-opacity="'+Math.min(.9,a*dk).toFixed(3)+'" stroke-width="'+(w||1)+'"'}
  function LS(a,w){return 'fill="none" stroke="#fff" stroke-opacity="'+Math.min(.95,a*hl).toFixed(3)+'" stroke-width="'+(w||1)+'"'}
  function one(svg,w,h){return {i:[svg],s:[w+'px '+h+'px'],p:['0 0'],r:['repeat']}}
  if(k==='grid')return one(svgU(22,22,'<path d="M0 .5H22M.5 0V22" '+DS(.13)+'/><path d="M0 1.5H22M1.5 0V22" '+LS(.6)+'/>'),22,22);
  if(k==='dots'){var dot=function(x,y){return '<circle cx="'+(x+.8)+'" cy="'+(y+.8)+'" r="2" '+L(.75)+'/><circle cx="'+x+'" cy="'+y+'" r="2" '+D(.2)+'/>'};return one(svgU(24,24,dot(6,6)+dot(18,18)),24,24)}
  if(k==='stars'){var sp='M0-5 1.45-1.55 5.3-1.55 2.2.85 3.35 4.7 0 2.45-3.35 4.7-2.2.85-5.3-1.55-1.45-1.55Z',star=function(x,y,sc,ro){return '<g transform="translate('+x+' '+y+') rotate('+ro+') scale('+sc+')"><path transform="translate(.9 .9)" d="'+sp+'" '+L(.75)+'/><path d="'+sp+'" '+D(.25)+'/></g>'};
   return one(svgU(120,120,star(16,20,1,0)+star(70,12,.6,22)+star(100,52,.85,-14)+star(42,62,.7,35)+star(84,98,1.05,10)+star(14,100,.55,-28)),120,120)}
  if(k==='diamond'){ /* 菱格（像絎縫／壓紋板）：每格左上受光、右下背光，格線凹下去，交叉點有一顆小釘 */
   var nail=function(x,y){return '<circle cx="'+(x+.7)+'" cy="'+(y+.7)+'" r="1.5" '+L(.8)+'/><circle cx="'+x+'" cy="'+y+'" r="1.5" '+D(.26)+'/>'};
   return one(svgU(28,28,
    '<path d="M0 14 14 0V14Z" '+L(.34)+'/><path d="M14 0 28 14H14Z" '+L(.1)+'/><path d="M0 14 14 28V14Z" '+D(.025)+'/><path d="M28 14 14 28V14Z" '+D(.085)+'/>'+
    '<path d="M0 0H14L0 14Z" '+D(.085)+'/><path d="M28 0H14L28 14Z" '+D(.025)+'/><path d="M0 28H14L0 14Z" '+L(.1)+'/><path d="M28 28H14L28 14Z" '+L(.34)+'/>'+
    '<path d="M14 .9 27.1 14 14 27.1 .9 14Z" '+LS(.55,.8)+'/><path d="M14 0 28 14 14 28 0 14Z" '+DS(.2,.9)+'/>'+nail(14,0)+nail(14,28)+nail(0,14)+nail(28,14)),28,28)}
  if(k==='clover'){var leaf='<circle cx="-2.3" cy="-2.3" r="2.5"/><circle cx="2.3" cy="-2.3" r="2.5"/><circle cx="-2.3" cy="2.3" r="2.5"/><circle cx="2.3" cy="2.3" r="2.5"/>',cv=function(x,y,ro,sc){return '<g transform="translate('+x+' '+y+') rotate('+ro+') scale('+sc+')"><g transform="translate(.8 .8)" '+L(.7)+'>'+leaf+'</g><g '+D(.24)+'>'+leaf+'</g><path d="M.6 1.6q1.6 4 4.4 5.6" '+DS(.22,1)+' stroke-linecap="round"/></g>'};
   return one(svgU(84,84,cv(16,18,-12,1)+cv(58,56,24,.8)),84,84)}
  if(k==='stone'){ /* 石壁（Paul：用回第一版那種「牆面凹凸不平」的質感）：雜訊打光後，亮的地方疊白、暗的地方疊深色，不改底色 */
   var tb='<feTurbulence type="fractalNoise" baseFrequency=".035 .05" numOctaves="4" seed="7" stitchTiles="stitch"/><feDiffuseLighting lighting-color="#fff" surfaceScale="3.4" diffuseConstant="1.05"><feDistantLight azimuth="225" elevation="52"/></feDiffuseLighting>';
   return one(svgU(260,260,'<filter id="d" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'+tb+'<feColorMatrix values="0 0 0 0 .06  0 0 0 0 .09  0 0 0 0 .16  -'+(1.5*dk).toFixed(2)+' 0 0 0 '+(1.02*dk).toFixed(2)+'"/></filter><filter id="l" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB">'+tb+'<feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  '+(2.6*hl).toFixed(2)+' 0 0 0 -'+(1.95*hl).toFixed(2)+'"/></filter><rect width="260" height="260" filter="url(#d)"/><rect width="260" height="260" filter="url(#l)"/>'),260,260)}
  if(k==='brick'){ /* 磚牆（2026-11-23 Paul：原本「石壁」那個一塊一塊的圖案改給磚牆用）：不規則的石磚，有圓角、左上亮右下暗，中間是深色的縫 */
   var rows=[[30,[44,58,36,62]],[36,[66,40,52,42]],[28,[38,64,48,50]],[34,[56,46,60,38]]],y=0,b='';
   rows.forEach(function(r,ri){var x=0;r[1].forEach(function(w,ci){var g=2.2,jx=((ri*7+ci*13)%5)*.5,jy=((ri*11+ci*5)%4)*.5;
     b+='<rect x="'+(x+g+jx)+'" y="'+(y+g+jy)+'" width="'+(w-2*g-jx)+'" height="'+(r[0]-2*g-jy)+'" rx="'+(5+((ri+ci)%3)*2)+'" fill="url(#s'+((ri+ci)%3)+')" stroke="#0f172a" stroke-opacity="'+Math.min(.9,.2*dk).toFixed(3)+'" stroke-width=".8"/>'+
        '<path d="M'+(x+g+jx+5)+' '+(y+g+jy+1.6)+'h'+(w-2*g-jx-12)+'" '+LS(.7,1.2)+' stroke-linecap="round"/>';x+=w});y+=r[0]});
   var gr=function(id,a,c){return '<linearGradient id="'+id+'" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="'+(a*hl).toFixed(3)+'"/><stop offset=".55" stop-color="#fff" stop-opacity="'+(a*hl*.25).toFixed(3)+'"/><stop offset="1" stop-color="#0f172a" stop-opacity="'+Math.min(.9,c*dk).toFixed(3)+'"/></linearGradient>'};
   return one(svgU(200,128,'<defs>'+gr('s0',.62,.10)+gr('s1',.42,.15)+gr('s2',.52,.06)+'<filter id="n" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="2" seed="5" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .06  0 0 0 0 .09  0 0 0 0 .16  0 0 0 '+(.5*dk).toFixed(2)+' -.2"/></filter></defs><rect width="200" height="128" '+D(.17)+'/>'+b+'<rect width="200" height="128" filter="url(#n)"/>'),200,128)}
  if(k==='metal'){ /* 拉絲鐵片：很細的橫向髮絲紋＋一條一條寬的反光帶（像不鏽鋼板的光澤） */
   var hair=svgU(480,120,'<filter id="a" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".003 .62" numOctaves="3" seed="11" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 .06  0 0 0 0 .09  0 0 0 0 .16  '+(1.2*dk).toFixed(2)+' 0 0 0 -'+(.5*dk).toFixed(2)+'"/></filter><filter id="b" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .5" numOctaves="3" seed="29" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 '+(2.0*hl).toFixed(2)+' 0 0 -'+(.82*hl).toFixed(2)+'"/></filter><rect width="480" height="120" filter="url(#a)"/><rect width="480" height="120" filter="url(#b)"/>');
   var w=function(a){return 'rgba(255,255,255,'+(a*hl).toFixed(3)+')'},d=function(a){return 'rgba(15,23,42,'+Math.min(.9,a*dk).toFixed(3)+')'};
   return {i:['linear-gradient(180deg,'+d(.17)+' 0%,'+d(.05)+' 12%,'+w(.55)+' 24%,'+w(.95)+' 33%,'+w(.5)+' 42%,'+d(.06)+' 56%,'+d(.19)+' 70%,'+d(.08)+' 80%,'+w(.5)+' 89%,'+d(.06)+' 96%,'+d(.17)+' 100%)',hair],s:['100% 340px','480px 120px'],p:['0 0','0 0'],r:['repeat','repeat']}}
  return null}
 var GCMAP={green:'green',yellow:'yellow',blue:'blue',pink:'pink',beige:'beige',navy:'navy',forest:'dgreen',black:'dark',wine:'wine',purple:'dpurple',white:''};
 function load(){try{var own=localStorage.getItem(KEY),j=JSON.parse(own||(WPONLY||GCK?'null':localStorage.getItem('vrt_pal'))||'null');st={c:'',c2:'',veil:70,wp:''};
   /* GASCheck 第一次：把它原本選的顏色帶過來（之後就由這個調色盤管） */
   if(GCK&&!own){try{var g=window.GCTheme&&window.GCTheme.choice&&window.GCTheme.choice();if(g&&GCMAP[g.key]!=null){st.c=GCMAP[g.key];localStorage.setItem(KEY,JSON.stringify(st));if(window.GCTheme.apply)window.GCTheme.apply()}}catch(_){}return}
   if(j){if(WPONLY){j.c='';j.c2=''}if(j.wp&&WPS.some(function(x){return x[0]===j.wp}))st.wp=j.wp;if(COL.some(function(x){return x[0]===j.c}))st.c=j.c;if(j.c2&&COL.some(function(x){return x[0]===j.c2}))st.c2=j.c2;if(j.veil>=0&&j.veil<=95)st.veil=+j.veil}}catch(e){}}
 function save(){try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}if(GCK){try{window.GCTheme&&window.GCTheme.apply&&window.GCTheme.apply()}catch(_){}}}
 function idb(mode,fn){return new Promise(function(res){try{var rq=indexedDB.open('vrt_pal',1);rq.onupgradeneeded=function(){rq.result.createObjectStore('kv')};rq.onerror=function(){res(null)};rq.onsuccess=function(){try{var tx=rq.result.transaction('kv',mode),r=fn(tx.objectStore('kv'));tx.oncomplete=function(){res(r&&r.result)};tx.onerror=tx.onabort=function(){res(null)}}catch(e){res(null)}}}catch(e){res(null)}})}
 function lum(c){var m=String(c||'').match(/\d+(\.\d+)?/g);if(!m||m.length<3||(m.length>3&&+m[3]===0))return null;return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255}
 function nativeDark(){var h=document.documentElement,was=h.classList.contains('vp-dark');if(was)h.classList.remove('vp-dark');var L=null;try{var bs=getComputedStyle(document.body);L=lum(bs.backgroundColor);if(L==null&&/gradient/.test(bs.backgroundImage)){var gm=bs.backgroundImage.match(/rgba?\([^)]+\)/g);if(gm)L=lum(gm[gm.length-1])}   /* 底是漸層的頁面（例如 GASCheck 入口）：看漸層的顏色；壁紙疊在前面，所以取最後一個 */
  if(L==null)L=lum(getComputedStyle(h).backgroundColor)}catch(e){}if(was)h.classList.add('vp-dark');return L!=null&&L<0.4}
 var CARDCSS='html.vp-on .vp-card{box-shadow:0 12px 26px rgba(15,23,42,.24),0 3px 7px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 0 rgba(15,23,42,.10)!important;border-color:rgba(15,23,42,.26)!important;background-image:linear-gradient(150deg,rgba(255,255,255,.80) 0%,rgba(255,255,255,0) 30%,rgba(15,23,42,.06) 58%,rgba(255,255,255,.30) 74%,rgba(15,23,42,.11) 100%)!important}'+
  'html.vp-acc .cmp-acts button:not(.err):not(.gh),html.vp-acc .gip-btn.pri,html.vp-acc .ic-btn.pri,html.vp-acc .pc-btn.pri,html.vp-acc #kn-foot button:not(:disabled),html.vp-acc .kn-chip.on,html.vp-acc .kn-cc button.on{background:var(--vp-acc)!important;border-color:var(--vp-acc)!important;color:#fff!important}';
 var css='#vpTint,#vpImg{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;mix-blend-mode:multiply;z-index:2147483000}#vpPanel .wp{display:flex;flex-wrap:wrap;gap:8px}#vpPanel .wp button{width:46px;border:0;background:none;padding:0;font:inherit;font-size:10.5px;color:inherit;cursor:pointer;text-align:center}#vpPanel .wp i{display:block;width:40px;height:40px;margin:0 auto 3px;border-radius:9px;border:2px solid #cbd5e1;background-color:#dfe6ee}#vpPanel .wp button.on i{border-color:#22a35a;box-shadow:0 0 0 3px rgba(34,163,90,.25)}#vpImg{background-position:center;background-size:cover;background-repeat:no-repeat}'+
  'html.vp-dark{filter:invert(1) hue-rotate(180deg);background:#fff!important}html.vp-dark img,html.vp-dark video,html.vp-dark picture,html.vp-dark canvas.vp-keep,html.vp-dark #vpImg,html.vp-dark #vpPanel .sw i{filter:invert(1) hue-rotate(180deg)}html.vp-dark #kn-box,html.vp-dark .pkn-box{outline:2px solid #000;outline-offset:-1px}'+
  CARDCSS+
  '#vpPanel .mx{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;font-size:11.5px}#vpPanel .mx button{border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:5px 9px;font:inherit;font-size:12px;cursor:pointer;color:inherit}#vpPanel .mx button.on{background:#14213d;border-color:#14213d;color:#fff}#vpPanel .mx i{display:inline-block;width:22px;height:22px;border-radius:50%;border:2px solid #cbd5e1;vertical-align:middle}'+
  '#vpBtn{border:0;background:rgba(127,127,127,.18);border-radius:8px;width:30px;height:26px;padding:0;margin-left:4px;font-size:16px;line-height:1;cursor:pointer}'+
  '#vpPanel{position:fixed;z-index:2147483100;width:min(296px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow-y:auto;background:#fff;color:#14202b;border:1px solid #d5dde5;border-radius:12px;box-shadow:0 14px 34px rgba(2,6,23,.24);padding:10px 12px;font:13px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}'+
  '#vpPanel b.h{display:block;margin-bottom:8px}#vpPanel .sw{display:flex;flex-wrap:wrap;gap:8px}#vpPanel .swl{font-size:11px;opacity:.65;margin:10px 0 6px}#vpPanel .sw button{width:46px;border:0;background:none;padding:0;font:inherit;font-size:10.5px;color:inherit;cursor:pointer;text-align:center}#vpPanel .sw i{display:block;width:34px;height:34px;margin:0 auto 3px;border-radius:50%;border:2px solid #cbd5e1}#vpPanel .sw button.on i{border-color:#22a35a;box-shadow:0 0 0 3px rgba(34,163,90,.25)}'+
  '#vpPanel .im{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid #e5eaf0}#vpPanel .im button{border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:5px 9px;font:inherit;font-size:12px;cursor:pointer;color:inherit}#vpPanel .im label{display:flex;align-items:center;gap:6px;font-size:12px;width:100%}#vpPanel .im input{flex:1;accent-color:#22a35a}#vpPanel small{display:block;opacity:.65;font-size:10.5px;margin-top:6px}';
 var tint,img,btn,panel,wpEl;
 /* 壁紙畫在哪：body（它的底會鋪滿整頁）、html 自己有底色時也畫、以及「蓋滿整頁的外框」（有些平台用一個滿版的 div 當底）。
    卡片、表格、彈出視窗都不算外框，所以花紋只在最底層，卡片壓在上面。原本就有漸層／圖的底，花紋疊在它上面，不把它換掉。 */
 var WPROPS=['background-image','background-size','background-position','background-repeat','background-attachment'];
 function wpClear(e){try{var o=e.__vpInl||{};WPROPS.forEach(function(p){if(o[p]&&o[p][0])e.style.setProperty(p,o[p][0],o[p][1]);else e.style.removeProperty(p)});e.removeAttribute('data-vpwp');e.__vpInl=null}catch(_){}}
 function wpSet(e,k,w0){try{
   if(e.__vpInl){var o=e.__vpInl;WPROPS.forEach(function(p){if(o[p]&&o[p][0])e.style.setProperty(p,o[p][0],o[p][1]);else e.style.removeProperty(p)})}   /* 先還原，才讀得到它原本的底 */
   else{e.__vpInl={};WPROPS.forEach(function(p){e.__vpInl[p]=[e.style.getPropertyValue(p),e.style.getPropertyPriority(p)]})}
   var cs=w0.getComputedStyle(e),L=lum(cs.backgroundColor);if(L==null){var q=(cs.backgroundImage||'').match(/rgba?\([^)]+\)/);L=q?lum(q[0]):null}
   if(L==null)L=lum(w0.getComputedStyle(e.ownerDocument.documentElement).backgroundColor);
   var c=wpCss(k,L!=null&&L<0.42);if(!c)return;
   var has=cs.backgroundImage&&cs.backgroundImage!=='none';
   e.style.setProperty('background-image',c.i.join(',')+(has?','+cs.backgroundImage:''),'important');
   e.style.setProperty('background-size',c.s.join(',')+(has?','+cs.backgroundSize:''),'important');
   e.style.setProperty('background-position',c.p.join(',')+(has?','+cs.backgroundPosition:''),'important');
   e.style.setProperty('background-repeat',c.r.join(',')+(has?','+cs.backgroundRepeat:''),'important');
   e.style.setProperty('background-attachment',(c.a||c.i.map(function(){return 'scroll'})).join(',')+(has?','+cs.backgroundAttachment:''),'important');
   e.setAttribute('data-vpwp',k)}catch(_){}}
 function wpCovers(d,w0){var out=[];try{if(!d.elementsFromPoint)return out;var vw=w0.innerWidth,vh=w0.innerHeight;
   [[.5,.5],[.5,.9],[.04,.55],[.96,.6],[.5,.22],[.25,.75]].forEach(function(pt){var stk=d.elementsFromPoint(vw*pt[0],vh*pt[1])||[];
    for(var i=0;i<stk.length;i++){var e=stk[i];if(e===d.body||e===d.documentElement)break;if(out.indexOf(e)>=0)continue;
     if(/^(TABLE|IFRAME|CANVAS|IMG|VIDEO|SVG|svg|DIALOG|TEXTAREA|INPUT|SELECT|BUTTON)$/.test(e.tagName))continue;
     var r=e.getBoundingClientRect();if(r.width<vw*.7||r.height<vh*.75)continue;
     var nm=(typeof e.className==='string'?e.className:'')+' '+(e.id||'');if(/(^|[\s_-])(mask|modal|overlay|dialog|drawer|sheet|popup|toast|gate|lock|login|ov)([\s_-]|$)|^vp|^vm|^vg|gip-|kn-|pkn-|cmp-/i.test(nm))continue;
     var cs=w0.getComputedStyle(e),m=cs.backgroundColor.match(/[\d.]+/g)||[];if(m.length<3||(m.length>3&&+m[3]<0.9))continue;
     if(parseFloat(cs.borderTopLeftRadius)>4||cs.boxShadow!=='none')continue;                       /* 圓角或有影子＝卡片，不是外框 */
     if(cs.position==='fixed'&&(+cs.zIndex||0)>=900)continue;
     out.push(e)}})}catch(_){}return out}
 function wpDoc(d,k){try{var w0=d.defaultView,b=d.body,h=d.documentElement;if(!w0||!b)return;
   var old=[].slice.call(d.querySelectorAll('[data-vpwp]'));
   if(!k){old.forEach(wpClear);return}
   var tg=[b],hm=w0.getComputedStyle(h).backgroundColor.match(/[\d.]+/g)||[];if(hm.length>=3&&(hm.length<4||+hm[3]>0.05))tg.push(h);
   wpCovers(d,w0).forEach(function(e){tg.push(e)});
   old.forEach(function(e){if(tg.indexOf(e)<0)wpClear(e)});
   tg.forEach(function(e){wpSet(e,k,w0)})}catch(_){}}
 function wpAll(){try{var k=st.wp||'';docsAll().forEach(function(d){wpDoc(d,k)})}catch(_){}}
 function apply(){ if(!document.body)return;
  if(WPONLY){st.c='';st.c2=''}
  var c=COL.filter(function(x){return x[0]===st.c})[0]||COL[0],dark=!!c[4],h=document.documentElement,ov=dark?c[3]:(c[0]?c[2]:'');
  /* 兩色混合：同一組（淺配淺、深配深）各取一半 */
  var c2=st.c2&&c[0]?colOf(st.c2):null;if(c2&&c2[0]&&!!c2[4]===!!c[4]&&c2[0]!==c[0])ov=mixHex(ov||'#ffffff',(dark?c2[3]:c2[2])||'#ffffff');
  if(PROD){if(dark){dark=false;ov=''}if(h.classList.contains('vrt-inv')||h.getAttribute('data-theme')==='dark')ov=''}
  if(dark&&nativeDark()){dark=false;ov=''}
  var acc=(ov||dark)?(c2&&c2[0]&&ACC[c2[0]]?mixHex(ACC[c[0]],ACC[c2[0]]):ACC[c[0]]):'';if(acc)h.style.setProperty('--vp-acc',acc);else h.style.removeProperty('--vp-acc');h.classList.toggle('vp-acc',!!acc);
  if(ov){if(!tint){tint=document.createElement('div');tint.id='vpTint';tint.setAttribute('aria-hidden','true')}tint.style.background=ov;if(tint.parentNode!==document.body)document.body.appendChild(tint)}else if(tint&&tint.parentNode)tint.parentNode.removeChild(tint);
  var wc=!!st.wp;
  h.classList.toggle('vp-dark',dark);h.classList.toggle('vp-inv',dark);h.classList.toggle('vp-on',!!(ov||dark||BG||wc));wpAll();cards();

  if(BG&&!WPONLY){if(!img){img=document.createElement('div');img.id='vpImg';img.setAttribute('aria-hidden','true')}var v=(st.veil/100).toFixed(2);img.style.backgroundImage='linear-gradient(rgba(255,255,255,'+v+'),rgba(255,255,255,'+v+')),url("'+BG+'")';if(img.parentNode!==document.body)document.body.appendChild(img)}else if(img&&img.parentNode)img.parentNode.removeChild(img) }
 /* 換了底色／背景圖後，卡片要「浮起來」：加影子、邊線、一點金屬光澤（Paul 11/23：不然卡片跟背景黏在一起）。
    只加在原本沒有漸層圖的卡片上，不改它原本的底色；關掉調色（白色、沒背景圖）就全部拿掉。 */
 var CSEL='.kpi,.kpi-card,.stat-card,.sum-card,.metric,.kc,.kcard,.card,.exp-card,.sew-card,.tile,.panel,.box,.sbox,.kn-n,[class*="kpi-"],[class*="-kpi"],[class$="-card"],[class*="-card "]',ct=0;
 /* 連嵌在裡面的分頁（同網域 iframe，最多兩層）一起處理：色片本來就蓋得到，卡片的影子／按鈕顏色要另外送進去 */
 function docsAll(){var out=[document];try{[].forEach.call(document.querySelectorAll('iframe'),function(f){try{var d=f.contentDocument;if(d&&d.documentElement&&d.body){out.push(d);[].forEach.call(d.querySelectorAll('iframe'),function(g){try{var e=g.contentDocument;if(e&&e.documentElement&&e.body)out.push(e)}catch(_){}})}}catch(_){}})}catch(_){}return out}
 function cards(){ if(ct)return; ct=setTimeout(function(){ct=0;try{
   var H=document.documentElement,on=H.classList.contains('vp-on'),acc=H.classList.contains('vp-acc')?H.style.getPropertyValue('--vp-acc'):'';
   docsAll().forEach(function(d){try{var h=d.documentElement;
    if(d!==document){if(on&&!d.getElementById('vrt-pal-card')){var s2=d.createElement('style');s2.id='vrt-pal-card';s2.textContent=CARDCSS;(d.head||h).appendChild(s2)}
     h.classList.toggle('vp-on',on);h.classList.toggle('vp-inv',H.classList.contains('vp-inv'));h.classList.toggle('vp-acc',!!acc);if(acc)h.style.setProperty('--vp-acc',acc);else h.style.removeProperty('--vp-acc')}
    var els=d.querySelectorAll(on?CSEL:'.vp-card'),n=0,w0=d.defaultView;
    for(var i=0;i<els.length&&n<600;i++){var e=els[i];if(!on){e.classList.remove('vp-card');e.__vpc=0;continue}if(e.classList.contains('vp-card')||e.__vpc)continue;n++;
     if(e.closest('#vmPanel,#vpPanel,#vmBox'))continue;var w=e.offsetWidth,hh=e.offsetHeight;if(w<70||hh<36){continue}
     var cs=w0.getComputedStyle(e);e.__vpc=1;if(cs.backgroundImage!=='none'||cs.position==='fixed')continue;var bg=cs.backgroundColor.match(/[\d.]+/g)||[];if(bg.length>3&&+bg[3]<0.4)continue;
     e.classList.add('vp-card')}}catch(_){}})}catch(_){}},160)}
 setInterval(function(){if(!document.hidden&&document.documentElement.classList.contains('vp-on')){cards();if(st.wp)wpAll()}},2500);
 try{new MutationObserver(function(){if(document.documentElement.classList.contains('vp-on'))cards()}).observe(document.documentElement,{subtree:true,childList:true})}catch(_){}
 function draw(){ if(!panel||panel.hidden)return;
  var wpRow='<div class="swl">🧱 壁紙 Wallpaper'+(WPONLY?'':'（可以跟顏色、混色一起用 · works with any colour or mix）')+'</div><div class="wp">'+WPS.map(function(x){var w=x[0]?wpCss(x[0],false):null;return '<button data-w="'+x[0]+'" class="'+(st.wp===x[0]?'on':'')+'"><i style="'+(w?'background-image:'+w.i.join(',').replace(/"/g,"&quot;")+(w.pv===2?';background-size:cover;background-position:center bottom':w.pv?';background-size:auto 100%,100% 100%;background-position:30% 100%,0 0;background-color:#eef4fa':';background-size:'+w.s.join(',')):'background-color:#fff')+'"></i>'+x[1]+'</button>'}).join('')+'</div>';
  if(WPONLY){panel.innerHTML='<b class="h">🧱 壁紙 Wallpaper（這個平台自己記住）</b>'+wpRow+'<small>顏色請用這個平台原本的 🎨；這裡只管壁紙，每個平台各設各的。<br>Colours stay in this platform’s own 🎨; wallpaper is saved per platform.</small>';place2();return}
  panel.innerHTML='<b class="h">🎨 背景顏色 Background（這個平台自己記住 · saved per platform）</b><div class="sw">'+COL.filter(function(x){return !x[4]}).map(function(x){return '<button data-c="'+x[0]+'" class="'+(st.c===x[0]?'on':'')+'"><i style="background:'+x[2]+'"></i>'+x[1]+'</button>'}).join('')+'</div>'+(PROD?'<div class="swl">明暗 Light / Dark（生產平台原本的）</div><div class="mx" style="margin-top:0"><button data-a="th-light">☀️ 淡色 Light</button><button data-a="th-dark">🌙 深色 Dark</button>'+(document.getElementById('themeBtn')?'<button data-a="oldbg">原本的背景選單</button>':'')+'</div>':'<div class="swl">深色 Dark</div><div class="sw">'+COL.filter(function(x){return x[4]}).map(function(x){return '<button data-c="'+x[0]+'" class="'+(st.c===x[0]?'on':'')+'"><i style="background:'+x[2]+'"></i>'+x[1]+'</button>'}).join('')+'</div>')+
   '<div class="mx"><button data-a="mix" class="'+(mixMode?'on':'')+'">🎨＋🎨 混色 Mix</button>'+(mixMode?'<span>再點一個顏色 pick a second colour</span>':'')+(st.c2&&colOf(st.c2)&&colOf(st.c)?'<span>'+colOf(st.c)[1].split(' ')[0]+'＋'+colOf(st.c2)[1].split(' ')[0]+' ＝ <i style="background:'+mixHex(colOf(st.c)[2],colOf(st.c2)[2])+'"></i></span><button data-a="unmix">取消混色 Unmix</button>':'')+'</div>'+
   wpRow+
   '<div class="im"><button data-a="pick">🖼️ 自訂背景圖 Image</button>'+(BG?'<button data-a="clear">✕ 移除 Remove</button><label>遮罩 Veil <input type="range" min="30" max="95" step="5" value="'+st.veil+'"><span>'+st.veil+'%</span></label>':'')+'</div><small>圖片只存在這台裝置，不會上傳。遮罩越高，圖越淡、字越清楚。<br>The image stays on this device. Higher veil = fainter image.</small>';
  place2() }
 var anchorEl=null;
 function place2(){var a=(anchorEl&&anchorEl.offsetWidth)?anchorEl:(btn.offsetWidth?btn:document.getElementById('vmBox')),b=a.getBoundingClientRect(),w=Math.min(296,innerWidth-16),hh=panel.offsetHeight||260,up=b.bottom+6+hh>innerHeight-4&&b.top>hh;panel.style.top=Math.max(6,Math.min(innerHeight-hh-6,up?b.top-hh-6:b.bottom+6))+'px';panel.style.left=Math.max(8,Math.min(innerWidth-w-8,b.right-w))+'px'}
 function shrink(file){return (window.createImageBitmap?createImageBitmap(file):Promise.reject()).then(function(bmp){var k=Math.min(1,1600/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*k));c.height=Math.max(1,Math.round(bmp.height*k));c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.8)})}
 function pick(){var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.onchange=function(){var f=inp.files&&inp.files[0];if(!f)return;shrink(f).then(function(d){BG=d;apply();draw();idb('readwrite',function(s){return s.put(d,'bg:'+PLAT)});try{localStorage.setItem('vrt_pal_img',String(Date.now()))}catch(e){}}).catch(function(){})};inp.click()}
 function mount(){ var box=document.getElementById('vmBox'); if(!box||btn)return !!btn;
  var s=document.createElement('style');s.id='vrt-pal-css';s.textContent=css+(PROD?'#themeBtn{display:none!important}':'')+(GCK?'#gc-theme-btn{display:none!important}':'');document.head.appendChild(s);
  btn=document.createElement('button');btn.id='vpBtn';btn.type='button';btn.title='背景顏色／背景圖 Background';btn.setAttribute('aria-label','Background colour');btn.textContent=WPONLY?'🧱':'🎨';if(WPONLY){btn.title='壁紙 Wallpaper';btn.setAttribute('aria-label','Wallpaper')}box.appendChild(btn);
  panel=document.createElement('div');panel.id='vpPanel';panel.hidden=true;document.body.appendChild(panel);
  btn.addEventListener('click',function(e){e.stopPropagation();anchorEl=null;panel.hidden=!panel.hidden;draw()});
  window.vrtPalette={open:function(a){anchorEl=a||null;panel.hidden=false;draw()},state:function(){return {plat:PLAT,c:st.c,c2:st.c2,wp:st.wp}}};
  panel.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='th-light'||b.dataset.a==='th-dark'){var tv=b.dataset.a==='th-dark'?'dark':'light';try{if(typeof window.setTheme==='function'&&document.getElementById('themeBtn'))window.setTheme(tv);else if(window.VRTTheme)window.VRTTheme.set(tv)}catch(_){}setTimeout(function(){apply();draw()},60);return}
   if(b.dataset.a==='oldbg'){panel.hidden=true;var tb=document.getElementById('themeBtn');if(tb)setTimeout(function(){tb.click()},0);return}
   if(b.dataset.w!=null){st.wp=b.dataset.w;save();apply();draw();return}
   if(b.dataset.a==='mix'){mixMode=!mixMode;draw();return}if(b.dataset.a==='unmix'){st.c2='';mixMode=false;save();apply();draw();return}
   if(b.dataset.c!=null){var k=b.dataset.c,a0=colOf(st.c),a1=colOf(k);if(mixMode&&st.c&&k&&k!==st.c&&a0&&a1&&!!a0[4]===!!a1[4]){st.c2=k}else{st.c=k;st.c2=''}mixMode=false;save();apply();draw()}else if(b.dataset.a==='pick')pick();else if(b.dataset.a==='clear'){BG=null;apply();draw();idb('readwrite',function(s){return s.put('', 'bg:'+PLAT)});try{localStorage.setItem('vrt_pal_img',String(Date.now()))}catch(e){}}});
  panel.addEventListener('input',function(e){if(e.target.type==='range'){st.veil=+e.target.value;save();apply();var sp=panel.querySelector('label span');if(sp)sp.textContent=st.veil+'%'}});
  document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&e.target!==btn&&!(e.target.closest&&e.target.closest('#vmPanel .pal')))panel.hidden=true},true);
  try{window.vrtMusic&&window.vrtMusic.place()}catch(e){} return true }
 function readImg(){if(WPONLY)return Promise.resolve();return idb('readonly',function(s){return s.get('bg:'+PLAT)}).then(function(d){
   if(d==null&&!GCK)return idb('readonly',function(s){return s.get('bg')});return d}).then(function(d){BG=(typeof d==='string'&&d.indexOf('data:image/')===0)?d:null;apply();draw()})}
 function start(){load();apply();readImg();var n=0,iv=setInterval(function(){if(mount()||++n>40)clearInterval(iv)},250);mount();
  window.addEventListener('storage',function(e){if(e.key===KEY){load();apply();draw()}else if(e.key==='vrt_pal_img')readImg()})}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* ===== 💡 深色頁的滑鼠燈光 v1（2026-11-23）=====
   Paul：深色的平台選單／分頁，滑鼠要自帶一點燈光（像 GASCheck 入口那樣），有立體感跟層次，不要單調。
   · 游標所在位置的底色是深色時，跟著一圈柔光；滑到卡片／按鈕上，那一張的邊會亮起來。淺色頁不出現。
   · 手機沒有滑鼠：手指點到深色區域時，那一點亮一下再淡掉。
   · 每一頁（包含嵌在裡面的分頁）各自跑；只畫一層不擋滑鼠的光，不動資料、不改各頁排版。PSJERP 有自己的聚光燈，這裡跳過。 */
(function(){
 if(window.__VRT_GLOW)return; window.__VRT_GLOW=1;
 if(/^\/psjerp\//i.test(location.pathname||''))return;
 try{if(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){}
 var H=document.documentElement,glow=null,lit=null,raf=0,px=0,py=0,cache=typeof WeakMap==='function'?new WeakMap():null,hideT=0;
 var LSEL='.kpi,.card,.tile,.panel,.box,.sbox,.module,.mod,.hub-card,.hd-tile,.hd-card,.ctab,.tab,[class*="-card"],[class*="card-"],[class*="module"],[class*="tile"],a[class*="mod"],button';
 function inv(){return H.classList.contains('vp-dark')||H.classList.contains('vrt-inv')}
 function lumOf(e){ /* 往上找第一個有底色的，回傳亮度 0~1 */
  for(var n=e,i=0;n&&n.nodeType===1&&i<12;n=n.parentElement,i++){var v=cache&&cache.get(n);
   if(v===undefined||v===null){var c=getComputedStyle(n),m=c.backgroundColor.match(/[\d.]+/g)||[];v=(m.length>=3&&(m.length<4||+m[3]>0.5))?(0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255:(c.backgroundImage!=='none'&&/gradient/.test(c.backgroundImage)?(function(g){var q=g.match(/rgba?\(([^)]+)\)/);if(!q)return -1;var t=q[1].split(',').map(parseFloat);return (0.2126*t[0]+0.7152*t[1]+0.0722*t[2])/255})(c.backgroundImage):-1);if(cache)cache.set(n,v)}
   if(v>=0)return v}
  return 1}
 function ensure(){ if(glow||!document.body)return;
  var st=document.createElement('style');st.id='vrt-glow-css';st.textContent='#vgGlow{position:fixed;left:0;top:0;width:190px;height:190px;margin:-95px 0 0 -95px;border-radius:50%;pointer-events:none;z-index:2147482500;opacity:0;transition:opacity .28s ease;will-change:transform,opacity;background:radial-gradient(circle,rgba(255,255,255,.085) 0%,rgba(255,255,255,.035) 40%,rgba(255,255,255,0) 70%);mix-blend-mode:screen}'+
   '#vgGlow.inv{background:radial-gradient(circle,rgba(0,0,0,.10) 0%,rgba(0,0,0,.04) 40%,rgba(0,0,0,0) 70%);mix-blend-mode:multiply}'+
   '.vg-lit{outline:1px solid rgba(255,255,255,.26)!important;outline-offset:-1px;box-shadow:0 8px 20px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.14)!important;transition:outline-color .2s ease,box-shadow .25s ease}'+
   'html.vp-dark .vg-lit,html.vrt-inv .vg-lit{outline-color:rgba(0,0,0,.28)!important;box-shadow:0 8px 20px rgba(255,255,255,.22),inset 0 1px 0 rgba(0,0,0,.12)!important}'+
   '@media print{#vgGlow{display:none!important}}';
  (document.head||H).appendChild(st);glow=document.createElement('div');glow.id='vgGlow';glow.setAttribute('aria-hidden','true');document.body.appendChild(glow)}
 function unlit(){if(lit){lit.classList.remove('vg-lit');lit=null}}
 function frame(){raf=0;ensure();if(!glow)return;var e=document.elementFromPoint(px,py);if(!e||e===glow){return}
  var iv=inv(),L=lumOf(e),dark=iv?L>0.5:L<0.52;
  glow.classList.toggle('inv',iv);glow.style.transform='translate3d('+px+'px,'+py+'px,0)';glow.style.opacity=dark?'1':'0';
  var c=dark&&e.closest?e.closest(LSEL):null;
  if(dark&&!c){for(var n=e,i=0;n&&n.nodeType===1&&n!==document.body&&i<6;n=n.parentElement,i++){try{if(getComputedStyle(n).cursor==='pointer'){c=n}else if(c)break}catch(_){break}}}   /* 沒有常見卡片類名的：找「可以點」的那一塊（取最外層） */if(c&&(c.offsetWidth<60||c.offsetHeight<28||c.offsetWidth>innerWidth*0.96&&c.offsetHeight>innerHeight*0.7))c=null;
  if(c&&c.closest('#vmBox,#vmPanel,#vpPanel'))c=null;
  if(c!==lit){unlit();if(c){c.classList.add('vg-lit');lit=c}}}
 function move(x,y){px=x;py=y;if(!raf)raf=requestAnimationFrame(frame)}
 document.addEventListener('pointermove',function(e){if(e.pointerType==='touch')return;move(e.clientX,e.clientY)},{passive:true});
 document.addEventListener('pointerleave',function(){if(glow)glow.style.opacity='0';unlit()},{passive:true});
 document.documentElement.addEventListener('mouseleave',function(){if(glow)glow.style.opacity='0';unlit()},{passive:true});
 /* 手機：點到深色區域亮一下 */
 document.addEventListener('touchstart',function(e){var t=e.touches&&e.touches[0];if(!t)return;move(t.clientX,t.clientY);clearTimeout(hideT);hideT=setTimeout(function(){if(glow)glow.style.opacity='0';unlit()},650)},{passive:true});
})();

/* ===== 🪙 卡片質感＋按壓感＋卡片上方不用黑色 v1（2026-11-23，music.js 2.2.0）=====
   Paul 11/23：① 卡片要有金屬質感跟立體感；滑鼠或手指按下去，要像鐵板被壓下／按鈕被按下一點點。
              ② 卡片跳出來以後，上方永遠不要是黑的——改成「接近背景色、再深一點或淺一點」。
   · 每個平台、每一頁（含嵌在裡面的分頁）都做，不管有沒有選調色；只加影子／光澤／按壓動作，不動資料、不改排版。
   · ①：常見的卡片（.card、.kpi、xxx-card…）加上浮起的影子＋上亮下暗的邊＋一點拉絲光澤（原本自己有漸層底的不蓋）。
        小張、裡面沒有輸入框／表格的卡片才有「按下去」的動作（大面板每點一下就晃會很煩）。
   · ②：跳出來的卡片／視窗，最上面那一條如果是黑色／深藍色 → 換成跟頁面底色同色系、深一點點的顏色，字改深色；
        卡片後面那片暗幕也從黑色改成底色系的霧面。深色頁則是比底色淺一點。 */
(function(){
 if(window.__VRT_CARD3D)return; window.__VRT_CARD3D=1;
 var H=document.documentElement,W=window;
 function rgb(c){c=String(c||'');if(!/^\s*rgb/i.test(c))return null;var m=c.match(/[\d.]+/g);if(!m||m.length<3)return null;return [+m[0],+m[1],+m[2],m.length>3?+m[3]:1]}
 function lum(a){return (0.2126*a[0]+0.7152*a[1]+0.0722*a[2])/255}
 function mix(a,b,t){return [0,1,2].map(function(i){return Math.round(a[i]+(b[i]-a[i])*t)})}
 function bgOf(e){ /* 這個元素自己的底色（純色或漸層第一個顏色）；透明＝null */
  try{var cs=W.getComputedStyle(e),c=rgb(cs.backgroundColor);if(c&&c[3]>0.5)return c;
   if(cs.backgroundImage&&/gradient/.test(cs.backgroundImage)){var q=cs.backgroundImage.match(/rgba?\([^)]+\)/);var g=q&&rgb(q[0]);if(g&&g[3]>0.5)return g}}catch(_){}return null}
 function pageBg(){var c=document.body&&bgOf(document.body);if(!c)c=bgOf(H);return c||[255,255,255,1]}
 var CSS=
  '.vc3{box-shadow:0 12px 26px rgba(15,23,42,.20),0 3px 7px rgba(15,23,42,.14),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 0 rgba(15,23,42,.10)!important}.vc3:not(.vc3-a){border-color:rgba(15,23,42,.24)!important}'+
  '.vc3.vc3-g{background-image:linear-gradient(150deg,rgba(255,255,255,.80) 0%,rgba(255,255,255,0) 30%,rgba(15,23,42,.06) 58%,rgba(255,255,255,.30) 74%,rgba(15,23,42,.11) 100%)!important}'+
  '.vc3.vc3-d{box-shadow:0 12px 26px rgba(0,0,0,.46),0 3px 7px rgba(0,0,0,.34),inset 0 1px 0 rgba(255,255,255,.18),inset 0 -2px 0 rgba(0,0,0,.36)!important}.vc3.vc3-d:not(.vc3-a){border-color:rgba(255,255,255,.18)!important}'+
  '.vc3.vc3-d.vc3-g{background-image:linear-gradient(150deg,rgba(255,255,255,.11) 0%,rgba(255,255,255,0) 30%,rgba(0,0,0,.10) 58%,rgba(255,255,255,.06) 74%,rgba(0,0,0,.18) 100%)!important}'+
  /* 按壓：平常微微浮起 → 按下去往下沉、影子收掉、裡面出現一圈壓痕，放開彈回來 */
  'html .vc3.vc3-p{transition:transform .13s cubic-bezier(.3,.7,.4,1),box-shadow .13s ease,filter .13s ease;-webkit-tap-highlight-color:transparent}'+
  /* v2.6：只有「可以按」的卡片（滑鼠移上去時由下面的 clk() 判斷）才浮起／下沉；不能按的卡片不動，金屬質感照舊 */
  'html .vc3.vc3-p.vc-hov{transform:translateY(-2px);filter:none;box-shadow:0 18px 34px rgba(15,23,42,.24),0 4px 9px rgba(15,23,42,.15),inset 0 1px 0 rgba(255,255,255,.98),inset 0 -2px 0 rgba(15,23,42,.10)!important}'+
  'html .vc3.vc3-p.vc3-d.vc-hov{box-shadow:0 18px 34px rgba(0,0,0,.52),0 4px 9px rgba(0,0,0,.36),inset 0 1px 0 rgba(255,255,255,.24),inset 0 -2px 0 rgba(0,0,0,.36)!important}'+
  'html .vc3.vc3-p.vc-dn{transform:translateY(2px) scale(.988);box-shadow:0 1px 2px rgba(15,23,42,.28),inset 0 3px 7px rgba(15,23,42,.24),inset 0 -1px 0 rgba(255,255,255,.65)!important;filter:brightness(.965)!important}'+
  'html .vc3.vc3-p.vc3-d.vc-dn{box-shadow:0 1px 2px rgba(0,0,0,.5),inset 0 3px 8px rgba(0,0,0,.55),inset 0 -1px 0 rgba(255,255,255,.12)!important;filter:brightness(.92)!important}'+
  /* ③（v2.4）選了顏色／壁紙以後，沒有框線的選項（分頁、切換鈕、下拉）補一圈細線，才看得出每一個的邊界 */
  'html.vp-on .vc-opt:not(:focus-visible){outline:1px solid rgba(71,85,105,.36);outline-offset:-1px}html.vp-on .vc-opt-d:not(:focus-visible){outline:1px solid rgba(255,255,255,.36);outline-offset:-1px}'+
  /* 選了壁紙：卡片的邊再清楚一點（花紋上面要分得出哪一塊是卡片） */
  'html.vp-on .vc3:not(.vc3-a):not(.vc3-d){border-color:rgba(15,23,42,.30)!important}'+
  /* v2.5 深色調色（整頁反相）：原本的亮邊／影子反相後看不出來，卡片變成一塊平的黑。
     這裡給「反相前」的值：卡片蓋一層灰色光澤帶（反相後＝深灰的金屬漸層）、深色的上緣線（反相後＝亮邊）、白色的外影（反相後＝黑影）。 */
  'html.vp-inv .vc3:not(.vc3-d){background-image:linear-gradient(150deg,rgba(15,23,42,.24) 0%,rgba(15,23,42,.09) 28%,rgba(15,23,42,.19) 56%,rgba(15,23,42,.07) 74%,rgba(15,23,42,.22) 100%)!important;box-shadow:0 0 0 1px rgba(15,23,42,.42),inset 0 1px 0 rgba(15,23,42,.6),inset 0 -2px 0 rgba(255,255,255,.9),0 12px 24px rgba(255,255,255,.95)!important}'+
  'html.vp-inv .vc3.vc3-p.vc-hov:not(.vc3-d){box-shadow:0 0 0 1px rgba(15,23,42,.6),inset 0 1px 0 rgba(15,23,42,.75),0 16px 30px rgba(255,255,255,.98)!important}'+
  'html.vp-inv .vc3.vc3-p.vc-dn:not(.vc3-d){box-shadow:0 0 0 1px rgba(15,23,42,.5),inset 0 3px 8px rgba(255,255,255,.9)!important}'+
  /* v2.5 可以按的東西：滑鼠移上去／手指按下去，底色略變、微微浮起；按下去往下沉。列表的列也一樣（整列一起）。 */
  '.vc-hov:not(tr):not(.vc-bk):not(.vc3){filter:brightness(.955) saturate(1.06);box-shadow:0 5px 12px rgba(15,23,42,.20),inset 0 1px 0 rgba(255,255,255,.55)!important;transition:box-shadow .12s ease,filter .12s ease}'+
  '.vc-hov.vc-hd2:not(tr):not(.vc-bk){filter:brightness(1.14) saturate(1.05)}'+
  '.vc-hov.vc-ht:not(tr):not(.vc-bk){filter:none;background-image:linear-gradient(rgba(100,116,139,.16),rgba(100,116,139,.16));box-shadow:0 3px 8px rgba(15,23,42,.14),inset 0 1px 0 rgba(255,255,255,.5)!important}'+
  'tr.vc-hov>td,tr.vc-hov>th{background-image:linear-gradient(rgba(79,70,229,.075),rgba(79,70,229,.075))!important;transition:background-image .12s ease}tr.vc-hov{box-shadow:0 4px 10px rgba(15,23,42,.20),inset 0 1px 0 rgba(255,255,255,.7);position:relative;z-index:1}'+
  '.vc-dn:not(tr):not(.vc-bk):not(.vc3-p){filter:brightness(.92)!important;box-shadow:inset 0 2px 6px rgba(15,23,42,.28)!important}.vc-dn.vc-dt:not(tr):not(.vc-bk):not(.vc3){transform:translateY(1px)}'+
  'tr.vc-dn>td,tr.vc-dn>th{background-image:linear-gradient(rgba(79,70,229,.15),rgba(79,70,229,.15))!important}tr.vc-dn{box-shadow:inset 0 2px 5px rgba(15,23,42,.22)}'+
  /* v2.6 按鈕＝石磚（跟卡片的金屬不一樣）：四邊倒角（上／左亮、下／右暗）＋底下一道厚邊＋表面石頭的粗粒；按下去厚邊收掉、整塊陷下去 */
  '.vc-bk{box-shadow:inset 0 1px 0 rgba(255,255,255,.62),inset 1px 0 0 rgba(255,255,255,.28),inset 0 -2px 0 rgba(15,23,42,.20),inset -1px 0 0 rgba(15,23,42,.12),0 2px 0 rgba(15,23,42,.34),0 4px 6px rgba(15,23,42,.20)!important;transition:transform .09s ease,box-shadow .09s ease,filter .09s ease;-webkit-tap-highlight-color:transparent;font-weight:700!important}.vc-bk{text-shadow:0 1px 1px rgba(0,0,0,.38)}.vc-bk.vc-bk-k{text-shadow:0 1px 0 rgba(255,255,255,.85),0 2px 2px rgba(15,23,42,.16)}.vc-bk.vc-dn,.vc-bk:active{text-shadow:0 1px 1px rgba(15,23,42,.22)!important}.vc-bk.vc-bk-k:not(.on):not(.active):not(.sel):not(.selected):not(.is-active):not([aria-selected=true]):not([aria-pressed=true]),.vc-bk.vc-bk-k:not(.on):not(.active):not(.sel):not(.selected):not(.is-active):not([aria-selected=true]):not([aria-pressed=true]) *{color:#14233a!important}'+
  '.vc-bk.vc-bk-r0{border-radius:5px 3px 6px 2px/3px 6px 2px 5px!important}.vc-bk.vc-bk-r1{border-radius:3px 7px 3px 5px/6px 3px 5px 2px!important}.vc-bk.vc-bk-r2{border-radius:7px 4px 2px 6px/4px 2px 6px 3px!important}.vc-bk.vc-bk-r3{border-radius:2px 5px 8px 3px/5px 3px 4px 8px!important}'+
  '.vc-bk.vc-bk-t{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2796%27 height=%2796%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.035 .05%27 numOctaves=%272%27 seed=%277%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .08 0 0 0 0 .1 0 0 0 0 .16 0 0 0 -1.5 .98%27/%3E%3C/filter%3E%3Cfilter id=%27m%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.03 .045%27 numOctaves=%272%27 seed=%2723%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.5 .95%27/%3E%3C/filter%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23n)%27 opacity=%27.14%27/%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23m)%27 opacity=%27.17%27/%3E%3C/svg%3E\"),linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,0) 45%,rgba(15,23,42,.10))!important;background-size:100% 100%,100% 100%,96px 96px,100% 100%!important}'+
  '.vc-bk.vc-bk-t.vc-bk-n:not(.vc-hov){background-color:var(--vc-bkbg,#e4e9ef)!important}'+
  '.vc-bk.vc-bk-c{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2796%27 height=%2796%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.035 .05%27 numOctaves=%272%27 seed=%277%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .08 0 0 0 0 .1 0 0 0 0 .16 0 0 0 -1.5 .98%27/%3E%3C/filter%3E%3Cfilter id=%27m%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.03 .045%27 numOctaves=%272%27 seed=%2723%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.5 .95%27/%3E%3C/filter%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23n)%27 opacity=%27.14%27/%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23m)%27 opacity=%27.17%27/%3E%3C/svg%3E\"),linear-gradient(180deg,rgba(255,255,255,.50),rgba(226,232,240,.34) 55%,rgba(148,163,184,.30))!important;background-size:100% 100%,100% 100%,96px 96px,100% 100%!important}'+
  '.vc-bk.vc-hov{filter:brightness(1.05) saturate(1.06)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 1px 0 0 rgba(255,255,255,.3),inset 0 -2px 0 rgba(15,23,42,.20),inset -1px 0 0 rgba(15,23,42,.12),0 3px 0 rgba(15,23,42,.34),0 6px 9px rgba(15,23,42,.24)!important}'+
  '.vc-bk.vc-hov.vc-bk-t{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),linear-gradient(180deg,rgba(255,255,255,.26),rgba(129,140,248,.24))!important;background-size:100% 100%,100% 100%,100% 100%!important}'+
  '.vc-bk.vc-hov.vc-bk-c{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2796%27 height=%2796%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.035 .05%27 numOctaves=%272%27 seed=%277%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .08 0 0 0 0 .1 0 0 0 0 .16 0 0 0 -1.5 .98%27/%3E%3C/filter%3E%3Cfilter id=%27m%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.03 .045%27 numOctaves=%272%27 seed=%2723%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.5 .95%27/%3E%3C/filter%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23n)%27 opacity=%27.14%27/%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23m)%27 opacity=%27.17%27/%3E%3C/svg%3E\"),linear-gradient(180deg,rgba(255,255,255,.62),rgba(199,210,254,.36) 55%,rgba(129,140,248,.26))!important}'+
  '.vc-bk.vc-dn,.vc-bk:active{filter:brightness(.93)!important;box-shadow:inset 0 2px 5px rgba(15,23,42,.38),inset 0 -1px 0 rgba(255,255,255,.35),0 0 0 rgba(15,23,42,0)!important}.vc-bk.vc-dn.vc-dt,.vc-bk.vc-dt:active{transform:translateY(2px)}'+
  'html.vp-inv .vc-bk{box-shadow:inset 0 1px 0 rgba(15,23,42,.45),inset 0 -2px 0 rgba(255,255,255,.55),0 0 0 1px rgba(15,23,42,.30)!important}html.vp-inv .vc-bk.vc-dn{box-shadow:inset 0 2px 5px rgba(255,255,255,.8)!important}'+
  '@media print{.vc-bk{box-shadow:none!important}}'+
  '.vc-k0{color:#1d2b3a!important}'+
  /* ② 卡片上方：不用黑色 */
  '.vc-hd{background:var(--vc-hd,#e8ecf1)!important;background-image:linear-gradient(180deg,rgba(255,255,255,.38),rgba(255,255,255,0))!important;color:var(--vc-ink,#1d2b3a)!important;border-bottom:1px solid var(--vc-line,rgba(15,23,42,.14))!important;text-shadow:none!important}'+
  '.vc-hd .vc-ink{color:var(--vc-ink,#1d2b3a)!important;text-shadow:none!important}.vc-hd .vc-ink2{border-color:var(--vc-line,rgba(15,23,42,.2))!important}'+
  '.gip-ov,#kn-mask,.cmp-mask,.pkn-mask,.vc-veil{background:var(--vc-veil,rgba(214,221,230,.74))!important;-webkit-backdrop-filter:blur(7px) saturate(1.05);backdrop-filter:blur(7px) saturate(1.05)}'+
  '.gip-panel,#kn-box,.pkn-box,.cmp-drawer,.cmp-sheet{box-shadow:0 26px 64px rgba(15,23,42,.30),0 4px 12px rgba(15,23,42,.16),inset 0 1px 0 rgba(255,255,255,.9)!important;border:1px solid rgba(15,23,42,.16)}'+
  /* 每頁最上面「回平台選單」那一條：原本黑底白字 → 跟底色同色系、細一點 */
  '#fx-homebar{background:var(--vc-hd,#e8ecf1)!important;box-shadow:0 1px 0 rgba(15,23,42,.14)!important}'+
  '#fx-home{background:var(--vc-hd,#e8ecf1)!important;color:var(--vc-ink,#1d2b3a)!important;border-bottom:1px solid var(--vc-line,rgba(15,23,42,.14));padding-top:5px!important;padding-bottom:5px!important;font-size:12px!important}'+
  (/^\/vrt-prod\//i.test(location.pathname)?'.hdr{padding-top:3px!important;padding-bottom:3px!important;min-height:0!important;height:auto!important;row-gap:1px!important;column-gap:12px!important}.hdr .sub{display:none!important}.hdr .logo{font-size:13px!important;letter-spacing:1px!important}.hdr .hstat{display:flex!important;flex-direction:row-reverse;align-items:baseline;gap:4px;min-width:0!important;flex:none!important}.hdr .hsv{font-size:13px!important}.hdr .hbtn{padding:3px 9px!important}.hdr-r{width:auto!important;margin-left:auto!important}@media(min-width:900px){.hdr{padding-right:292px!important}}'+(W.top!==W?'#vrtLangSw{left:auto!important;right:8px!important;transform:none!important}':'')+'':'')+
  '@media(prefers-reduced-motion:reduce){html .vc3.vc3-p{transition:none}html .vc3.vc3-p.vc-hov,html .vc3.vc3-p.vc-dn,.vc-bk.vc-dn{transform:none}}'+
  '@media print{.vc3{box-shadow:none!important;background-image:none!important}}';
 var SIDE=/^\/(psjerp|psjhr|psjgas)\//i.test(location.pathname)?',aside,#rail,.rail,.sidebar,#ga-sidebar,.mobile-nav,#drawer':'';
 var CSEL='.kpi,.kpi-card,.stat-card,.sum-card,.summary-card,.metric,.kc,.kcard,.card,.exp-card,.sew-card,.tile,.panel,.box,.sbox,.kn-n,.gip-kpi,.gcpt,.gcpt-kpi,[class*="kpi-"],[class*="-kpi"],[class$="-card"],[class*="-card "]';
 var HSEL='.ic-h,.pc-h,.mh,.dh,.modal-head,.modal-header,.m-head,.gc-modal-head,.cmp-dh,.gip-top,#kn-head,.pkn-head,.drawer-head,.dlg-head,.sheet-head,[class*="-head"],[class*="-hd"],[class*="-top"],[class$="-h"],header';
 var OSEL='.gip-ov,.cmp-mask,#kn-mask,.pkn-mask,.gcpt-ov,.modal,.modal-bg,.modal-overlay,.modal-mask,.ovl,.overlay,.mask,[role=dialog],dialog[open],.gc-common-modal,#drawer,.drawer,.sheet,[class*="modal"],[class*="-mask"],[class*="overlay"]';
 function vars(){try{var b=pageBg(),dark=lum(b)<0.45,inv=H.classList.contains('vp-dark')||H.classList.contains('vrt-inv');
   var hd=dark?mix(b,[255,255,255],.16):mix(b,[15,23,42],.085),ve=dark?mix(b,[255,255,255],.10):mix(b,[15,23,42],.16);
   var key=hd.join(',')+dark;if(H.__vcK===key)return;H.__vcK=key;
   H.style.setProperty('--vc-hd','rgb('+hd.join(',')+')');H.style.setProperty('--vc-bkbg','rgb('+(dark?mix(b,[255,255,255],.12):mix(b,[15,23,42],.09)).join(',')+')');H.style.setProperty('--vc-ink',dark?'#eef2f7':'#1d2b3a');
   H.style.setProperty('--vc-line',dark?'rgba(255,255,255,.16)':'rgba(15,23,42,.14)');H.style.setProperty('--vc-veil','rgba('+ve.join(',')+',.76)')}catch(_){}}
 function isVis(e){return !!(e&&(e.offsetWidth||e.offsetHeight))}
 function heads(){try{var ovs=document.querySelectorAll(OSEL),n=0;
   for(var i=0;i<ovs.length&&n<12;i++){var o=ovs[i];if(!isVis(o)||o.closest('#vmPanel,#vpPanel'))continue;var ps;try{ps=W.getComputedStyle(o).position}catch(_){continue}
    if(ps!=='fixed'&&ps!=='absolute'&&!o.matches('[role=dialog],dialog'))continue;n++;
    var hs=o.querySelectorAll(HSEL);
    for(var j=0;j<hs.length&&j<14;j++){var h=hs[j];if(h.__vch||h.closest('.vc-hd'))continue;if(!isVis(h)||h.offsetHeight>170||h.offsetWidth<180){continue}
     var c=bgOf(h);h.__vch=1;if(!c||lum(c)>0.42)continue;
     /* 深色頁（頁面本身就深）就不用改：它的表頭深色是對的 */
     if(lum(pageBg())<0.45)continue;
     h.classList.add('vc-hd');ink(h)}}}catch(_){}}
 function ink(h){try{var all=h.querySelectorAll('*'),k=0;paint(h,h);for(var i=0;i<all.length&&k<120;i++,k++)paint(all[i],h)}catch(_){}}
 function paint(e,h){try{ /* 原本是白字／淺色字 → 改深色字；自己有深色底的小按鈕（例如實心的關閉鈕）保留原樣 */
   if(e!==h){for(var p=e;p&&p!==h;p=p.parentElement){var b=bgOf(p);if(b&&lum(b)<0.5)return;if(b)break}}
   var cs=W.getComputedStyle(e),c=rgb(cs.color);if(c&&lum(c)>0.62)e.classList.add('vc-ink');
   var bc=rgb(cs.borderTopColor);if(e!==h&&bc&&parseFloat(cs.borderTopWidth)>0&&lum(bc)>0.7)e.classList.add('vc-ink2')}catch(_){}}
 var ct=0;
 /* v2.4：很多頁的卡片沒有「card」這類名字（例如 HRA-PAY、Audit 用的是 bg-white rounded-…），第一版沒抓到 → 選了壁紙就不凸。
    補一輪「看長相」的：有圓角（≥6px）＋有自己不透明的底＋夠大的區塊，就當卡片。整頁大小的外框、表格裡的小標籤不算。 */
 var GSEL='div,section,article,li,aside,form,fieldset,details',OPSEL='button,select,[role=tab],[role=button],a[class*="tab"],a[class*="btn"],label[class*="btn"],.tab,.chip';
 function generic(){try{var els=document.querySelectorAll(GSEL),n=0,vw=W.innerWidth,vh=W.innerHeight;
   for(var i=0;i<els.length&&n<700;i++){var e=els[i];if(e.__vc3||e.__vcg)continue;var w=e.offsetWidth,hh=e.offsetHeight;if(!w&&!hh)continue;e.__vcg=1;
    if(w<110||hh<44||(w>=vw*.97&&hh>=vh*.9))continue;n++;
    var cs=W.getComputedStyle(e);if(parseFloat(cs.borderTopLeftRadius)<6)continue;
    if(cs.position==='fixed'||cs.position==='sticky'||cs.display==='inline'||cs.display==='contents')continue;
    var c=rgb(cs.backgroundColor),hasImg=cs.backgroundImage!=='none';if(!(c&&c[3]>=0.6)&&!(hasImg&&/gradient/.test(cs.backgroundImage)))continue;
    if(e.hasAttribute('data-vpwp')||e.closest('#vmPanel,#vpPanel,#vmBox,#kn-foot,#kn-chips,td,th'+SIDE))continue;
    e.__vc3=1;tag(e,cs,w,hh)}
   var os=document.querySelectorAll(OPSEL),m=0;
   for(var j=0;j<os.length&&m<500;j++){var o=os[j];if(o.__vco)continue;if(!o.offsetWidth)continue;o.__vco=1;m++;
    if(o.closest('#vmPanel,#vpPanel,#vmBox'+SIDE))continue;var s2=W.getComputedStyle(o);
    var bw=parseFloat(s2.borderTopWidth)||0,bc=rgb(s2.borderTopColor);if(bw>0&&bc&&bc[3]>0.15&&s2.borderTopStyle!=='none')continue;   /* 本來就有框 */
    if(s2.boxShadow!=='none'||s2.outlineStyle!=='none'&&parseFloat(s2.outlineWidth)>0)continue;
    var tc=rgb(s2.color);o.classList.add(tc&&lum(tc)>0.72?'vc-opt-d':'vc-opt')}
   bricks()}catch(_){}}
 /* v2.6 哪些算按鈕：button／.btn 類／role=button／分頁。太小的（<24×22）、開關、列表裡整列的那種、已經是卡片的不算。 */
 /* v2.9（Paul：點了會出卡片的才用有色字，沒得點的用黑字）：頁面載入 3.5 秒後看一次每張卡片——不能按的，裡面有顏色的大數字改成黑字（紅色警示不動）。 */
 function inkCards(){try{if(!W.performance||performance.now()<3500)return;var cs0=document.querySelectorAll('.vc3'),n=0;
   for(var i=0;i<cs0.length&&n<120;i++){var e=cs0[i];if(e.__vck)continue;e.__vck=1;n++;if(e.classList.contains('vc3-d'))continue;
    var can=false;try{can=W.getComputedStyle(e).cursor==='pointer'||e.hasAttribute('onclick')||e.matches('a,button,[role=button],.kn-n[data-c]')||!!e.closest('a[href],button,[onclick],[role=button]')||(typeof W.acKnCardOf==='function'&&!!W.acKnCardOf(e))}catch(_){}
    if(can)continue;var lf=e.querySelectorAll('*');
    for(var k=0;k<lf.length&&k<60;k++){var x=lf[k];if(x.children.length||!/\d/.test(x.textContent||'')||x.closest('.vc-bk,a,button,[onclick]'))continue;var xs=W.getComputedStyle(x);if(parseFloat(xs.fontSize)<17)continue;
     var c=rgb(xs.color);if(!c)continue;var sat=Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2]);if(sat<70||(c[0]>170&&c[1]<110&&c[2]<110))continue;x.classList.add('vc-k0')}}}catch(_){}}
 var TOPSEL='header,.hdr,.hdr-top,.hdr-right,.more-menu,.lang-sw,.topbar,.top,.gc-unified-shell,.gc-head-tools,.gc-head-langs,#fx-homebar,[class*="topbar"],[class*="lang-sw"],[class*="langsw"],#vrtLangSw';
 var BSEL='button,input[type=button],input[type=submit],[role=button],[role=tab],a[class*="btn"],label[class*="btn"],label.cursor-pointer,.btn,.tab,.chip,.kn-chip';
 function bricks(){try{var bs=document.querySelectorAll(BSEL),m=0,vw=W.innerWidth;
   for(var j=0;j<bs.length&&m<600;j++){var o=bs[j];if(o.__vcb)continue;var w=o.offsetWidth,h=o.offsetHeight;if(!w)continue;o.__vcb=1;m++;
    if(w<24||h<22||h>220||(w>vw*.9&&h>70))continue;
    if(o.classList.contains('vc3')||o.matches('.kn-br,[role=switch],[data-nobrick],.kn-n')||o.closest('#vmBox,#vmPanel,#vpPanel,[data-nobrick],td,th,.leaflet-container'+SIDE))continue;
    try{if(o.closest(TOPSEL))continue;var rt=o.getBoundingClientRect();if(rt.top+(W.pageYOffset||0)+h/2<96)continue}catch(_){}
    var cs=W.getComputedStyle(o);if(cs.display==='inline'||cs.display==='contents')continue;
    var c=rgb(cs.backgroundColor),img=cs.backgroundImage!=='none',clear=!img&&(!c||c[3]<0.15);
    if(clear&&(h<24||w<34))continue;
    if(h>64){if(!clear&&!o.__vc3&&!o.closest('.vc3')){o.__vc3=1;tag(o,cs,w,h)}continue}   /* 大顆的（數字磚）＝卡片：金屬，不要石頭粗粒 */   /* 沒底色的小字連結不變成磚 */
    o.classList.add('vc-bk');if(!clear&&!img&&c&&c[3]>0.9&&lum(c)>0.82&&(Math.max(c[0],c[1],c[2])-Math.min(c[0],c[1],c[2]))<26&&lum(pageBg())>0.45&&!/\b(on|active|sel|selected)\b/.test(o.className))o.classList.add('vc-bk-n');if(parseFloat(cs.borderTopLeftRadius)<9&&h>=24)o.classList.add('vc-bk-r'+(j%4));o.classList.remove('vc-opt','vc-opt-d');if(clear)o.classList.add('vc-bk-c');else if(!img)o.classList.add('vc-bk-t');
    /* v2.7 字：淺底上的灰字看不清楚 → 加深（原本就有顏色的字，例如選到的藍／綠，不動） */
    var tc=rgb(cs.color),bg=clear?pageBg():(c&&c[3]>=0.15?(c[3]<0.95?mix(pageBg(),c,c[3]):c):bgOf(o));   /* 半透明的底：跟頁面底色混過以後才算深淺 */
    if(bg&&lum(bg)>0.6)o.classList.add('vc-bk-k');
    if(cs.transform==='none'&&cs.position!=='fixed'&&cs.position!=='sticky')o.classList.add('vc-dt')}}catch(_){}}
 function tag(e,cs,w,hh){var c=rgb(cs.backgroundColor),hasImg=cs.backgroundImage!=='none';
    var dk=c&&c[3]>=0.4?lum(c)<0.42:(function(){var g=bgOf(e);return g?lum(g)<0.42:false})();
    e.classList.add('vc3');if(!hasImg)e.classList.add('vc3-g');if(dk)e.classList.add('vc3-d');
    if(parseFloat(cs.borderLeftWidth)>=3||parseFloat(cs.borderTopWidth)>=3||parseFloat(cs.borderBottomWidth)>=3||parseFloat(cs.borderRightWidth)>=3)e.classList.add('vc3-a');
    if(hh<=340&&w<=760&&!e.querySelector('input,select,textarea,table,iframe,video,canvas')&&!/^(TABLE|TR|TD|FORM|BODY|MAIN|SECTION)$/.test(e.tagName))e.classList.add('vc3-p')}
 function cards(){if(ct)return;ct=setTimeout(function(){ct=0;try{vars();inkCards();
   var els=document.querySelectorAll(CSEL),n=0;
   for(var i=0;i<els.length&&n<500;i++){var e=els[i];if(e.__vc3)continue;
    var w=e.offsetWidth,hh=e.offsetHeight;if(!w&&!hh)continue;   /* 還沒顯示的下次再看 */
    e.__vc3=1;n++;if(w<70||hh<36)continue;if(e.closest('#vmPanel,#vpPanel,#vmBox,#kn-foot,#kn-chips'+SIDE))continue;if(e.hasAttribute('data-vpwp'))continue;
    var cs=W.getComputedStyle(e);if(cs.position==='fixed'||cs.display==='inline'||cs.display==='contents')continue;
    var c=rgb(cs.backgroundColor),hasImg=cs.backgroundImage!=='none';if(!hasImg&&(!c||c[3]<0.4))continue;
    var dk=c&&c[3]>=0.4?lum(c)<0.42:(function(){var g=bgOf(e);return g?lum(g)<0.42:false})();
    e.classList.add('vc3');if(!hasImg)e.classList.add('vc3-g');if(dk)e.classList.add('vc3-d');
    /* 原本有一邊粗的色條（例如左邊 4px 的分類色）：邊線顏色不動 */
    if(parseFloat(cs.borderLeftWidth)>=3||parseFloat(cs.borderTopWidth)>=3||parseFloat(cs.borderBottomWidth)>=3||parseFloat(cs.borderRightWidth)>=3)e.classList.add('vc3-a');
    /* 小張、裡面沒有輸入框／表格／影片的，才加按壓動作 */
    if(hh<=340&&w<=760&&!e.querySelector('input,select,textarea,table,iframe,video,canvas')&&!/^(TABLE|TR|TD|FORM|BODY|MAIN|SECTION)$/.test(e.tagName))e.classList.add('vc3-p')}
   generic();heads()}catch(_){}},70)}
 function start(){try{var s=document.createElement('style');s.id='vrt-card3d-css';s.textContent=CSS;(document.head||H).appendChild(s)}catch(_){}
  cards();chart3d();setInterval(function(){if(!document.hidden){H.__vcK='';cards();chart3d()}},3000);
  try{new MutationObserver(cards).observe(H,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','open','data-tint','data-theme']})}catch(_){}
  /* 手機：要有 touchstart 監聽，:active 才會出現；手指移開（開始捲動）就放開 */
  try{document.addEventListener('touchstart',function(){},{passive:true})}catch(_){}}
 /* v2.5 滑鼠經過／按下的浮凸感（事件掛在整頁，一次只標一個元素；不動各頁自己的樣式表） */
 var HSEL2='button,a[href],[onclick],[role=button],[role=tab],summary,select,label[for],.kn-br,.kn-n[data-c],.gcpt-kpi,.cmp-rec .cmp-pslot,.quickcard',hovEl=null,dnEl=null,dnT=0;
 function clk(t){try{if(!t||!t.closest||t.closest('#vmBox,#vmPanel,#vpPanel,[data-nohover]'+SIDE))return null;
   var e=t.closest(HSEL2),tr=t.closest('tr');
   if(e&&e.tagName!=='TR'&&e!==document.body){if(e.disabled||e.getAttribute('aria-disabled')==='true')return null;}
   else{e=null;if(tr&&tr.parentElement&&tr.parentElement.tagName==='TBODY'&&tr.cells.length>=2){var pc=false;try{pc=W.getComputedStyle(tr).cursor==='pointer'}catch(_){}if(pc||tr.hasAttribute('onclick')||/\b(kn-able|pkn-row|r)\b/.test(tr.className))e=tr}
    if(!e){var c=null;for(var n=t,i=0;n&&n.nodeType===1&&n!==document.body&&i<5;n=n.parentElement,i++){var cp=false;try{cp=W.getComputedStyle(n).cursor==='pointer'}catch(_){}if(cp)c=n;else if(c)break}e=c}}
   if(!e&&typeof W.acKnCardOf==='function'){try{e=W.acKnCardOf(t)||null}catch(_){e=null}}
   if(!e)return null;var w=e.offsetWidth,h=e.offsetHeight;if(!w||w>W.innerWidth*.96&&h>W.innerHeight*.6)return null;return e}catch(_){return null}}
 function mark(e){if(e.tagName==='TR'||e.__vch2)return;e.__vch2=1;try{var cs=W.getComputedStyle(e),c=rgb(cs.backgroundColor),img=cs.backgroundImage!=='none';
   if(!img&&(!c||c[3]<0.15))e.classList.add('vc-ht');else{var g=c&&c[3]>=0.15?c:bgOf(e);if(g&&lum(g)<0.45)e.classList.add('vc-hd2')}
   if(cs.transform==='none'&&cs.position!=='fixed')e.classList.add('vc-dt')}catch(_){}}
 function setHov(e){if(e===hovEl)return;if(hovEl)hovEl.classList.remove('vc-hov');hovEl=e;if(e){mark(e);e.classList.add('vc-hov')}}
 function up(){clearTimeout(dnT);if(dnEl){var x=dnEl;dnEl=null;dnT=setTimeout(function(){x.classList.remove('vc-dn')},110)}}
 try{document.addEventListener('pointerover',function(e){if(e.pointerType==='touch')return;setHov(clk(e.target))},{passive:true});
  document.addEventListener('pointerleave',function(){setHov(null)},{passive:true});H.addEventListener('mouseleave',function(){setHov(null)},{passive:true});
  document.addEventListener('pointerdown',function(e){var t=clk(e.target);if(!t)return;mark(t);if(dnEl&&dnEl!==t)dnEl.classList.remove('vc-dn');dnEl=t;t.classList.add('vc-dn');
    if(e.pointerType==='touch'){setHov(t);setTimeout(function(){if(hovEl===t)setHov(null)},520)}},{passive:true});
  ['pointerup','pointercancel','dragend'].forEach(function(n){document.addEventListener(n,up,{passive:true})});
  document.addEventListener('scroll',function(){if(dnEl)up()},{passive:true,capture:true})}catch(_){}
 /* v2.7 圖表（Chart.js）立體感：長條＝圓柱（左右暗、中間偏左一道亮）、圓環＝有厚度的環、折線＝底下一道影子。
    只在圖表重畫時多畫一層漸層，不留任何東西在記憶體裡；超過 400 根的圖不畫。 */
 function chart3d(){var C=W.Chart;if(!C||C.__vc3d||!C.register)return;C.__vc3d=1;
  try{C.register({id:'vrt3d',
   beforeDatasetDraw:function(ch,a){try{if(a.meta.type==='line'&&!a.meta.hidden){var x=ch.ctx;x.save();a.meta.__vs=1;x.shadowColor='rgba(15,23,42,.30)';x.shadowBlur=5;x.shadowOffsetY=3}}catch(_){}},
   afterDatasetDraw:function(ch,a){try{var m=a.meta,x=ch.ctx,t=m.type,els=m.data||[];if(m.__vs){m.__vs=0;x.restore()}if(m.hidden||els.length>400)return;
     if(t==='bar'){for(var i=0;i<els.length;i++){var p=els[i].getProps(['x','y','base','width','height','horizontal'],true);if(p.x==null||p.base==null)continue;var x0,y0,w,h,g;
       if(p.horizontal){x0=Math.min(p.x,p.base);w=Math.abs(p.x-p.base);y0=p.y-p.height/2;h=p.height;g=x.createLinearGradient(0,y0,0,y0+h)}
       else{x0=p.x-p.width/2;w=p.width;y0=Math.min(p.y,p.base);h=Math.abs(p.y-p.base);g=x.createLinearGradient(x0,0,x0+w,0)}
       if(w<2||h<2)continue;g.addColorStop(0,'rgba(15,23,42,.24)');g.addColorStop(.26,'rgba(255,255,255,.38)');g.addColorStop(.5,'rgba(255,255,255,.04)');g.addColorStop(1,'rgba(15,23,42,.30)');
       x.save();x.fillStyle=g;x.fillRect(x0,y0,w,h);x.restore()}}
     else if(t==='doughnut'||t==='pie'||t==='polarArea'){for(var j=0;j<els.length;j++){var q=els[j].getProps(['x','y','startAngle','endAngle','innerRadius','outerRadius'],true);if(!(q.outerRadius>4)||q.endAngle-q.startAngle<0.005)continue;
       var ir=Math.max(0,q.innerRadius||0),rg=x.createRadialGradient(q.x,q.y,ir,q.x,q.y,q.outerRadius);rg.addColorStop(0,'rgba(15,23,42,.22)');rg.addColorStop(.4,'rgba(255,255,255,.30)');rg.addColorStop(.62,'rgba(255,255,255,.03)');rg.addColorStop(1,'rgba(15,23,42,.28)');
       x.save();x.beginPath();x.arc(q.x,q.y,q.outerRadius,q.startAngle,q.endAngle);if(ir>0)x.arc(q.x,q.y,ir,q.endAngle,q.startAngle,true);else x.lineTo(q.x,q.y);x.closePath();x.fillStyle=rg;x.fill();x.restore()}}}catch(_){}}});
   var ins=C.instances||{};Object.keys(ins).forEach(function(k){try{ins[k].update('none')}catch(_){}})}catch(_){}}
 W.vrtCard3d={refresh:function(){H.__vcK='';cards()}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* ===== 🎨 同平台同色 v1（2026-11-23，music.js 2.11.0）=====
   Paul：調色盤選了一個顏色，同一個平台每一頁都要是那個顏色；不能這頁藍、那頁紅、那頁綠（例：HRA 合約試用頁）。
   原因：每一頁有自己原本的主色（合約＝藍、產假＝桃紅、行事曆＝綠、考勤＝藍綠），調色盤只是蓋一層淡色，主色還在。
   做法：選了顏色時，找出這一頁樣式表裡「最常用的主色」，把同色相的顏色（按鈕、選到的分頁、表頭、淡色底）
        換成調色盤那個顏色的色相（深淺不變）。紅／橘／綠這些代表「警示、通過」的狀態色、寫在資料上的顏色都不動。
   只在 HRA Portal、HRA-PAY 生效；沒選顏色（白色）就完全還原。只動顏色，不動排版和資料。 */
(function(){try{
 var P=(location.pathname||'').toLowerCase(),PLAT=P.split('/')[1]||'';
 if(!/^(ac-hra-portal|ac-hra-pay)$/.test(PLAT))return;
 var H=document.documentElement,st=null,sig='';
 var SKIP=/ok\b|good|success|pass|danger|warn|err|bad|badge|status|legend|holiday|\bdot\b|pill|alert|toast|kn-|vp|vm|vc-|vc3|acpl|row-|rate/i;
 var PROP=/^--|color|background|border|fill|stroke|outline|shadow|caret|decoration/i;
 function hsl(r,g,b){r/=255;g/=255;b/=255;var mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2,h=0,s=0,d=mx-mn;if(d){s=l>.5?d/(2-mx-mn):d/(mx+mn);h=mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4;h*=60}return [h,s,l]}
 function rgb(h,s,l){h=((h%360)+360)%360/360;function f(p,q,t){if(t<0)t+=1;if(t>1)t-=1;return t<1/6?p+(q-p)*6*t:t<1/2?q:t<2/3?p+(q-p)*(2/3-t)*6:p}
  var q=l<.5?l*(1+s):l+s-l*s,p=2*l-q;return [Math.round(f(p,q,h+1/3)*255),Math.round(f(p,q,h)*255),Math.round(f(p,q,h-1/3)*255)]}
 function hexRgb(x){x=x.replace('#','');if(x.length===3||x.length===4)x=x.split('').map(function(c){return c+c}).join('');return [parseInt(x.slice(0,2),16),parseInt(x.slice(2,4),16),parseInt(x.slice(4,6),16),x.slice(6,8)]}
 function hx(n){return ('0'+n.toString(16)).slice(-2)}
 var RE=/#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b|rgba?\(\s*(\d{1,3})(\s*,\s*|\s+)(\d{1,3})(\s*,\s*|\s+)(\d{1,3})/gi;
 function near(h,c,w){var d=Math.abs(h-c)%360;if(d>180)d=360-d;return d<=w}
 function each(fn){[].forEach.call(document.styleSheets,function(ss){var o=ss.ownerNode;if(o&&(o.id==='vpTone'||/^(vp|vm|vc|kn|acpl|tf|fx)/i.test(o.id||'')))return;var rs;try{rs=ss.cssRules}catch(e){return}if(!rs)return;
   (function walk(rs,wrap){for(var i=0;i<rs.length;i++){var r=rs[i];if(r.type===1){fn(r,wrap)}else if((r.type===4||r.type===12)&&r.cssRules){walk(r.cssRules,wrap.concat([(r.type===4?'@media ':'@supports ')+(r.conditionText||(r.media&&r.media.mediaText)||'all')]))}}})(rs,[])})}
 function brand(){var bins={},sum={},tot=0;
  each(function(r){var s=r.style;for(var i=0;i<s.length;i++){var n=s[i];if(!/^background/.test(n))continue;var v=s.getPropertyValue(n),m;RE.lastIndex=0;
    while((m=RE.exec(v))){var c=m[1]?hexRgb(m[1]):[+m[2],+m[4],+m[6]],q=hsl(c[0],c[1],c[2]);if(q[1]>.35&&q[2]>.15&&q[2]<.62){var b=Math.floor(q[0]/20);bins[b]=(bins[b]||0)+1;sum[b]=(sum[b]||0)+q[0];tot++}}}});
  var best=-1,bn=0;for(var k in bins)if(bins[k]>bn){bn=bins[k];best=k}
  return bn>=3?sum[best]/bn:null}
 function off(){if(st&&st.parentNode)st.parentNode.removeChild(st);st=null;sig='';H.classList.remove('vp-tone');ink()}
 function nat(){try{var bs=getComputedStyle(document.body),m=(bs.backgroundImage.match(/rgba?\([^)]+\)/g)||[bs.backgroundColor]).pop().match(/[\d.]+/g);if(!m||m.length<3||(m.length>3&&+m[3]===0))return false;return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255<0.4}catch(e){return false}}
 function run(){try{
  var acc=H.classList.contains('vp-acc')?(H.style.getPropertyValue('--vp-acc')||'').trim():'';
  if(!acc||!document.body||(!H.classList.contains('vp-tone')&&nat())){if(st)off();return}
  var n=0;[].forEach.call(document.styleSheets,function(ss){try{if(ss.ownerNode&&ss.ownerNode.id==='vpTone')return;n+=ss.cssRules.length}catch(e){}});
  var sg=acc+'|'+n;if(sg===sig)return;sig=sg;
  var a=hexRgb(acc),ah=hsl(a[0],a[1],a[2]),B=brand();if(B==null){if(st)off();sig=sg;return}
  if(near(ah[0],B,12)&&ah[1]>.3){if(st)off();sig=sg;return}      /* 本來就是同一個色相，不用換 */
  var sk=Math.max(.3,Math.min(1,ah[1]/.5)),out=[];
  function map(v){var hit=false;RE.lastIndex=0;var nv=v.replace(RE,function(all,h6,r,s1,g,s2,b){var c=h6?hexRgb(h6):[+r,+g,+b],q=hsl(c[0],c[1],c[2]);
    if(q[1]<.12||!near(q[0],B,30))return all;hit=true;var t=rgb(ah[0],q[1]*sk,q[2]);return h6?'#'+hx(t[0])+hx(t[1])+hx(t[2])+(c[3]||''):all.replace(/\d{1,3}(\s*,\s*|\s+)\d{1,3}(\s*,\s*|\s+)\d{1,3}$/,t[0]+s1+t[1]+s2+t[2])});return hit?nv:null}
  each(function(r,wrap){var sel=r.selectorText||'';if(!sel||SKIP.test(sel))return;var s=r.style,d='';
   for(var i=0;i<s.length;i++){var p=s[i];if(!PROP.test(p))continue;var v=s.getPropertyValue(p);if(!v||v.length>900||!/#|rgb/i.test(v))continue;var nv=map(v);if(nv)d+=p+':'+nv+'!important;'}
   /* 換完色後底是深色的（選到的分頁、主要按鈕、深色表頭）→ 字一律白色，蓋過石磚按鈕的深色字 */
   var bg=s.getPropertyValue('background-color')||s.getPropertyValue('background-image')||s.getPropertyValue('background'),dk=false;
   if(bg){RE.lastIndex=0;var m0=RE.exec(bg);if(m0){var c0=m0[1]?hexRgb(m0[1]):[+m0[2],+m0[4],+m0[6]],q0=hsl(c0[0],c0[1],c0[2]);dk=q0[1]>=.12&&near(q0[0],B,30)&&(0.2126*c0[0]+0.7152*c0[1]+0.0722*c0[2])/255<.5;if(dk&&!m0[1]){var tail=bg.slice(m0.index+m0[0].length,bg.indexOf(')',m0.index)+1),am=tail.match(/[,\/]\s*(0?\.\d+|0|1(\.0+)?)\s*\)/);if(am&&parseFloat(am[1])<.6)dk=false}if(dk&&m0[1]&&c0[3]&&parseInt(c0[3],16)<153)dk=false}}
   var open=wrap.join('{')+(wrap.length?'{':''),close=wrap.map(function(){return '}'}).join('');
   if(d)out.push(open+sel+'{'+d+'}'+close);
   void dk});
  if(!st){st=document.createElement('style');st.id='vpTone'}
  st.textContent=out.join('\n')+'\nhtml.vp-tone body{background-color:#fff!important;background-image:none}html.vp-tone:not(#_):not(#_) .fx-hdr{background-image:none!important}html.vp-tone:not(#_):not(#_) .vt-w,html.vp-tone:not(#_):not(#_) .vt-w *{color:#fff!important;text-shadow:none!important}';
  (document.head||H).appendChild(st);H.classList.add('vp-tone');ink();
 }catch(e){}}
 /* 換色後底變深的石磚按鈕（選到的分頁、主要按鈕）：字改白色；底是淺色的不動 */
 function ink(){try{var on=H.classList.contains('vp-tone'),inv=H.classList.contains('vp-inv');function lm(c){var m=String(c).match(/[\d.]+/g);return m&&m.length>=3&&(m.length<4||+m[3]>.6)?(0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255:null}
  [].forEach.call(document.querySelectorAll('button,[role=tab],a.btn,.btn,.tab,.tab-btn,.vt-w'),function(e){var w=false;if(on&&!inv&&e.offsetParent){var cs=getComputedStyle(e),b=lm(cs.backgroundColor);if(b==null&&/gradient/.test(cs.backgroundImage)){var gm=cs.backgroundImage.match(/rgba?\([^)]+\)/g)||[],gl=gm.map(lm).filter(function(x){return x!=null});if(gl.length&&gl.length>=gm.length-1)b=gl.reduce(function(a,x){return a+x},0)/gl.length}if(b!=null&&b<.42){w=e.classList.contains('vt-w')||(lm(cs.color)||0)<.55}}if(w!==e.classList.contains('vt-w'))e.classList.toggle('vt-w',w)})}catch(e){}}
 var tm=0;function later(){clearTimeout(tm);tm=setTimeout(run,120)}
 try{new MutationObserver(later).observe(H,{attributes:true,attributeFilter:['class','style']})}catch(e){}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',later);else later();
 setInterval(function(){if(!document.hidden){run();ink()}},3000);
 document.addEventListener('click',function(){setTimeout(ink,180)},true);
}catch(e){}})();

/* v2.12 手機轉橫也保持直立（2026-11-23 Paul）：手機往左或往右轉成橫的，頁面不跟著變成橫版，
   一樣是直立的樣子（跟著手機轉回去）；轉的那一下，頁面會往那邊稍微歪一點，再慢慢擺正。
   只在手機（觸控、小螢幕）的最外層頁面做；平板、電腦、內嵌的 iframe 都不動。 */
(function(){try{
 if(window.top!==window||window.__VRT_UPRIGHT)return;window.__VRT_UPRIGHT=1;
 var mq=window.matchMedia&&matchMedia('(pointer:coarse)');if(!mq||!mq.matches)return;
 if(Math.min(screen.width,screen.height)>=600)return;
 var cur=0,st=null;
 function ang(){var a=(screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(typeof window.orientation==='number'?window.orientation:0);a=((a%360)+360)%360;return a===90||a===270?a:0}
 function css(){if(st)return;st=document.createElement('style');st.id='vrtUpright';st.textContent=
  'html.vr-up,html.vr-up body{overflow:hidden!important;height:100%!important}'+
  'html.vr-up body{position:fixed!important;top:0!important;left:0!important;margin:0!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch;transform-origin:0 0!important}';
  document.head.appendChild(st)}
 function base(a){var w=document.documentElement.clientWidth,h=document.documentElement.clientHeight;
  return a===90?'translateY('+h+'px) rotate(-90deg)':'translateX('+w+'px) rotate(90deg)'}
 function size(){var b=document.body,w=document.documentElement.clientWidth,h=document.documentElement.clientHeight;b.style.setProperty('width',h+'px','important');b.style.setProperty('height',w+'px','important')}
 function tilt(dir){var b=document.body;if(!b.animate)return;var t=b.style.transform||'';
  /* 往手機轉的方向歪 7 度，再彈回來擺正 */
  try{b.animate([{transform:t+' rotate('+(dir*7)+'deg)'},{transform:t+' rotate('+(-dir*2)+'deg)',offset:.6},{transform:t}],{duration:900,easing:'cubic-bezier(.2,.8,.3,1)'})}catch(_){}}
 function set(){var a=ang(),b=document.body;if(!b)return;if(a===cur){if(a)size(),b.style.setProperty('transform',base(a),'important');return}
  var dir=a===90||(a===0&&cur===270)?-1:1,prevTop=a?window.scrollY:(b.scrollTop||0);cur=a;
  if(a){css();document.documentElement.classList.add('vr-up');size();b.style.setProperty('transform',base(a),'important');b.scrollTop=prevTop}
  else{document.documentElement.classList.remove('vr-up');['width','height','transform'].forEach(function(p){b.style.removeProperty(p)});window.scrollTo(0,prevTop)}
  tilt(dir)}
 var tm;function later(){clearTimeout(tm);tm=setTimeout(set,120)}
 if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',later);
 window.addEventListener('orientationchange',later);window.addEventListener('resize',later);
 /* 能鎖就先鎖（只有加到主畫面／全螢幕時才有用，一般瀏覽器會拒絕，就用上面那招） */
 try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('portrait').catch(function(){})}catch(_){}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',set);else set();
}catch(_){}})();
