/* VRT 🎵 放鬆音樂開關 v1（2026-11-23）— 各平台共用一支（PSJERP repo 的 music.js）
   上方一顆小小的 ON/OFF 撥動開關（♪）：點一下開／關；旁邊 ▾ 選聲音、拉音量；滑鼠滾輪在開關上也能調音量。
   預設關。雨聲／海浪／輕鋼琴是瀏覽器即時產生（不下載、不連外）；兩個公開電台要網路，連不上自動改雨聲。
   同一個瀏覽器分頁裡開著音樂換頁：新頁面會接著播（瀏覽器若擋自動播放，點一下畫面任何地方就接上）。
   內嵌在別的平台（iframe）且外層已有開關時，內層不再出現第二顆。 */
(function(){
 if(window.__VRT_MUSIC)return; try{ if(window.top!==window&&window.top.__VRT_MUSIC)return }catch(e){} window.__VRT_MUSIC=1;
 var SRC=[{k:'rain',ic:'🌧️',t:'雨聲 Rain',gen:1},{k:'sea',ic:'🌊',t:'海浪 Ocean',gen:1},{k:'piano',ic:'🎹',t:'輕鋼琴 Soft piano',gen:1},
  {k:'classic',ic:'🎻',t:'古典電台 Classical radio',note:'Radio Swiss Classic',urls:['https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128','https://stream.srg-ssr.ch/srgssr/rsc_de/aac/96','https://stream.srg-ssr.ch/srgssr/rsc_fr/mp3/128']},
  {k:'pianor',ic:'🎼',t:'鋼琴電台 Piano radio',note:'Capriccio Piano',urls:['https://live.hdradiostreaming.com:10443/listen/capriccio_piano/stream']},
  {k:'ambient',ic:'🌌',t:'氛圍電台 Ambient radio',note:'SomaFM Drone Zone',urls:['https://ice1.somafm.com/dronezone-128-mp3','https://ice2.somafm.com/dronezone-128-mp3','https://ice4.somafm.com/dronezone-128-mp3','https://ice5.somafm.com/dronezone-128-mp3','https://ice6.somafm.com/dronezone-128-mp3']}];
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
 '#vmBox.float{position:fixed;z-index:9990}'+
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
 '@media print{#vmBox,#vmPanel,#vmTip{display:none!important}}';
 var box,sw,more,panel;
 function draw(volOnly){ if(sw){sw.classList.toggle('on',on);sw.setAttribute('aria-checked',on?'true':'false');sw.title=(on?'音樂：開 Music ON':'音樂：關 Music OFF')+'　·　音量 Volume '+st.v+'%（滾輪可調 scroll to adjust）';sw.lastChild.textContent=on?'ON':'OFF'}
  if(!panel||panel.hidden)return; if(volOnly){var r=panel.querySelector('input[type=range]'),s=panel.querySelector('.vol span');if(r&&document.activeElement!==r)r.value=st.v;if(s)s.textContent=st.v+'%';panel.querySelectorAll('.q button').forEach(function(b){b.classList.toggle('on',+b.dataset.v===st.v)});return}
  panel.innerHTML=SRC.map(function(x){return '<button class="row '+(st.src===x.k?'on':'')+'" data-k="'+x.k+'"><span style="font-size:18px;width:24px;text-align:center">'+x.ic+'</span><span>'+x.t+(x.note?'<small>'+x.note+' · 需要網路 needs internet</small>':'')+'</span></button>'}).join('')+
   '<div class="vol">🔈<input type="range" min="0" max="100" step="5" value="'+st.v+'" aria-label="Volume"><span>'+st.v+'%</span></div><div class="q">'+[[20,'小 Low'],[40,'中 Mid'],[75,'大 High']].map(function(v){return '<button data-v="'+v[0]+'" class="'+(st.v===v[0]?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>' }
 function dock(){ if(!box)return; var ref=document.querySelector('.top #langSw'), narrow=innerWidth<=640;
  /* 手機窄螢幕：上方工具列放不下，改放左下角（工具列有毛玻璃效果，fixed 不能放在它裡面） */
  if(ref){ if(box.parentNode!==ref.parentNode||box.nextSibling!==ref)ref.parentNode.insertBefore(box,ref); box.className=narrow?'nar':'' }
  else{ if(box.parentNode!==document.body)document.body.appendChild(box); box.className='float'+(document.getElementById('vrtLangSw')?' sm':'') } }
 function place(){ if(!box)return; if(box.classList.contains('bl')){box.style.top=box.style.left=box.style.right=''}else if(box.classList.contains('float')){var l=document.getElementById('vrtLangSw');if(l){var r=l.getBoundingClientRect();box.style.top=Math.max(1,r.top)+'px';box.style.left=(r.right+6)+'px';box.style.right='auto'}else{box.style.top='4px';box.style.right='8px';box.style.left='auto'}}
  if(panel&&!panel.hidden){var b=box.getBoundingClientRect(),w=Math.min(264,innerWidth-16),h=panel.offsetHeight||300,up=b.bottom+6+h>innerHeight-4;panel.style.top=(up?Math.max(6,b.top-h-6):b.bottom+6)+'px';panel.style.left=Math.max(8,Math.min(innerWidth-w-8,b.left<innerWidth/2?b.left:b.right-w))+'px'} }
 function mount(){ if(document.getElementById('vmBox')||!document.body)return true;
  var stEl=document.createElement('style');stEl.id='vrt-music-css';stEl.textContent=css;document.head.appendChild(stEl);
  box=document.createElement('span');box.id='vmBox';box.innerHTML='<button id="vmSw" type="button" role="switch" aria-checked="false" aria-label="Music"><i>♪</i><b>OFF</b></button><button id="vmMore" type="button" aria-label="Music options">▾</button>';
  dock();
  sw=box.firstChild;more=box.lastChild;panel=document.createElement('div');panel.id='vmPanel';panel.hidden=true;document.body.appendChild(panel);
  var lp=0,lpFired=false,openP=function(){panel.hidden=false;draw();place()};
  sw.addEventListener('pointerdown',function(){lpFired=false;clearTimeout(lp);lp=setTimeout(function(){lpFired=true;openP()},480)});
  ['pointerup','pointerleave','pointercancel'].forEach(function(ev){sw.addEventListener(ev,function(){clearTimeout(lp)})});
  sw.addEventListener('contextmenu',function(e){e.preventDefault();openP()});
  /* 點一下＝開／關；長按（或按右鍵）＝選聲音、調音量。窄螢幕沒有 ▾，第一次打開時自動跳出面板讓人知道可以選 */
  sw.addEventListener('click',function(){if(lpFired){lpFired=false;return}if(on)stop();else{play();if(box.classList.contains('nar'))openP()}});
  more.addEventListener('click',function(){panel.hidden=!panel.hidden;draw();place()});
  box.addEventListener('wheel',function(e){e.preventDefault();setVol(st.v+(e.deltaY<0?5:-5));tip('🔊 '+st.v+'%')},{passive:false});
  panel.addEventListener('click',function(e){var r=e.target.closest('.row');if(r){setSrc(r.dataset.k);if(!on)play();return}var q=e.target.closest('.q button');if(q)setVol(+q.dataset.v)});
  panel.addEventListener('input',function(e){if(e.target.type==='range')setVol(+e.target.value)});
  document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&!box.contains(e.target))panel.hidden=true},true);
  window.addEventListener('resize',function(){dock();place()},{passive:true});draw();place();
  if(box.classList.contains('float')&&!box.classList.contains('bl')){var n=0,iv=setInterval(function(){var had=box.classList.contains('sm');if(document.getElementById('vrtLangSw')&&!had)box.classList.add('sm');place();if(++n>12)clearInterval(iv)},500)}
  var was=false;try{was=sessionStorage.getItem('vrt_music_on')==='1'}catch(e){} if(was)play();
  return true }
 window.vrtMusic={toggle:function(){on?stop():play()},set:setSrc,vol:setVol,state:function(){return {on:on,src:st.src,v:st.v,ctx:ctx&&ctx.state,nodes:nodes.length,radio:!!radio,wait:waitGesture}}};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
