/* v2.23（2026-11-25）：🎧 我的音樂——手機／雲端的歌（含 .dsf）匯入這台裝置播放，只給自己用（my-music.js）
   v2.18（2026-11-25）：Paul：PSJGA 首頁跟分頁的卡片會閃 → ① 手指碰到卡片只是要捲動時，不再馬上顯示「按下／亮起」（停 120ms 沒移動才算按）；② 平台重畫時新卡片立刻套好立體樣式、透明度、字色，不再先平面 70～160ms 再變；③ 卡片底色改成比後面的底色稍深一點（約 4.5%），立體卡片左上的白色反光調淡，卡片不再比背景亮；④ 立體按鈕拿掉 CSS 的 :active（手指一碰就下沉，捲動時整排按鈕閃），按下效果統一由上面的 120ms 判斷來加。
/* v2.22（2026-11-25 晚）：大字卡內不套質感／3D 卡片（深色主題下字看不到）；展開名單時不重跑整頁，減少卡頓閃爍。
   v2.21（2026-11-25 晚）：Paul：換色後字看不到 → 全頁對比檢查（字跟底太接近就自動換深字／白字）。
   v2.20（2026-11-25 晚）：Paul：按鈕和卡片同一個顏色、混色＝漸層、字色跟著選（看不清楚就自動黑／白，淺底不會白字）。
   v2.19（2026-11-25）：Paul：HRA Portal／HRA-PAY／GASCheck／GA-EXP／SEC／Audit 預設平面（要 3D 再自己選），PSJ 系列、Admin 維持 3D；
   新增按鈕／卡片「質感」（金屬、木質、石壁、玻璃、皮革）、形狀（方正、圓角、膠囊、石塊）、顏色（調色盤色、比背景深）、按下效果（下沉、彈縮、發光、變暗、不動）；
   每個平台各自記住（另備份 IndexedDB，localStorage 滿了也記得）；放開／捲動時清掉按下狀態，不會陷下去彈不回來。
   v2.17（2026-11-24）：Paul：傾斜太敏感，手機一動就開始斜跟閃 → 拿掉「歪一下再擺正」的效果（含重力感應觸發和轉向時的那一下），轉手機時只維持直立。
   v2.16（2026-11-23 夜）：照片改成鋪在最後面當背景（跟壁紙一樣，不蓋住選單、卡片、字）；混色改成斜向漸層，兩個顏色都看得到；字可以調大小（90–110%）；
   字色跟底色太接近時自動換成看得清楚的顏色；音樂：手機休眠或離開畫面超過 30 分鐘自動停，回來再接著播（到設定的關閉時間或離開為止）。
   v2.15（2026-11-23 晚）：調色盤分頁（背景／字與樣式／音樂）；加字型 Times New Roman、新細明體、Comic Sans、Calibri；字的設定不套在各平台的選單頁和 PSJ 左邊選單；手機轉向改用重力感應（<45° 微歪、>45° 多歪、90° 歪更多再擺正，永遠直立）。
   v2.14（2026-11-23 晚）：每個平台各自可以設 字的顏色（同底色系＋10 色）、字的深淺、字型（10 種常見字型）、按鈕／卡片要不要立體、頁面亮度、卡片透明度。
   v2.13（2026-11-23 晚）：拿掉會動的壁紙；深色湊到 10 色、壁紙 10 種、自己的照片最多 10 張；顏色／壁紙／音樂各自可以「每小時／每天／每週自動換」；
   音樂可以設每天幾點自動開、幾點關；有壁紙時卡片稍微透明（看得到一點背景）；手機轉橫的位置修正。
   VRT 🎵 放鬆音樂開關 v2.5（2026-11-23）— 各平台共用一支（PSJERP repo 的 music.js）
   上方一顆小小的 ON/OFF 撥動開關（♪）：點一下開／關；旁邊 ▾ 選聲音、拉音量；滑鼠滾輪在開關上也能調音量。
   預設關。雨聲／海浪／輕鋼琴是瀏覽器即時產生（不下載、不連外）；公開電台要網路，連不上自動改雨聲。
   同一個瀏覽器分頁裡開著音樂換頁：新頁面會接著播（瀏覽器若擋自動播放，點一下畫面任何地方就接上）。
   內嵌在別的平台（iframe）且外層已有開關時，內層不再出現第二顆。 */
/* v2.18（2026-11-25 Paul：生產平台訂單卡片字變白色看不清楚）：頁面用 color-mix() 做半透明卡片時，瀏覽器回報的顏色是「color(srgb 1 1 1 / 0.86)」，
   以前直接抓數字會當成 rgb(1,1,1)＝黑色 → 以為卡片是深色、把字改成白色。這裡先把 color(srgb …) 換成正常的 rgba(…) 再判斷。 */
window.__vcs=window.__vcs||function(m){var v=String(m).match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+))?/i);if(!v)return m;return 'rgba('+Math.round(v[1]*255)+','+Math.round(v[2]*255)+','+Math.round(v[3]*255)+','+(v[4]!=null?v[4]:1)+')'};

(function(){
 if(window.__VRT_MUSIC)return; try{ if(window.top!==window&&window.top.__VRT_MUSIC)return }catch(e){} window.__VRT_MUSIC=1;
 var MM_SRC=((document.currentScript&&document.currentScript.src)||'https://saintdou-weng.github.io/psjerp/music.js').replace(/music\.js.*$/,'my-music.js?v=6');
 var SRC=[{k:'rain',ic:'🌧️',t:'雨聲 Rain',gen:1},{k:'sea',ic:'🌊',t:'海浪 Ocean',gen:1},{k:'piano',ic:'🎹',t:'輕鋼琴 Soft piano',gen:1},
  {k:'mine',ic:'🎧',t:'我的音樂 My music',mine:1},{k:'classic',ic:'🎻',t:'古典電台 Classical radio',note:'Radio Swiss Classic',urls:['https://stream.srg-ssr.ch/srgssr/rsc_de/mp3/128','https://stream.srg-ssr.ch/srgssr/rsc_de/aac/96','https://stream.srg-ssr.ch/srgssr/rsc_fr/mp3/128']},
  {k:'pianor',ic:'🎼',t:'鋼琴電台 Piano radio',note:'Capriccio Piano',urls:['https://live.hdradiostreaming.com:10443/listen/capriccio_piano/stream']},
  {k:'jazz',ic:'🎷',t:'輕爵士電台 Jazz radio',note:'Radio Swiss Jazz',urls:['https://stream.srg-ssr.ch/srgssr/rsj/mp3/128','https://stream.srg-ssr.ch/srgssr/rsj/aac/96']},
  {k:'pop',ic:'🎤',t:'抒情流行電台 Soft pop radio',note:'Radio Swiss Pop',urls:['https://stream.srg-ssr.ch/srgssr/rsp/mp3/128','https://stream.srg-ssr.ch/srgssr/rsp/aac/96']},
  {k:'hitz',ic:'🇲🇾',t:'馬來西亞 HITZ',note:'HITZ Malaysia',urls:['https://stream.rcs.revma.com/488kt4sbv4uvv','https://n10.rcs.revma.com/488kt4sbv4uvv']},
  {k:'love',ic:'💗',t:'英文抒情歌電台 Love songs',note:'181.fm The Heart',urls:['https://listen.181fm.com/181-heart_128k.mp3','https://stream-uk1.radioparadise.com/mellow-128']},
  {k:'best',ic:'📻',t:'台灣 好事聯播網 Best Radio',note:'港都 983／好事 989',urls:['https://n10.rcs.revma.com/q2m07dc59duvv','https://stream.rcs.revma.com/q2m07dc59duvv','https://n01.rcs.revma.com/fkdywbc59duvv']},
  {k:'khmer',ic:'🇰🇭',t:'柬語電台 Khmer radio',note:'Sweet FM 88',urls:['https://n12.rcs.revma.com/whn9hqwstk3vv','https://stream.rcs.revma.com/whn9hqwstk3vv']}];
 var st={src:'rain',v:40,rl:[],ri:'off',at:'',ao:''};
 try{ var j=JSON.parse(localStorage.getItem('vrt_music')||'null'); if(!j){ var o=JSON.parse(localStorage.getItem('psj_music')||'null'); if(o)j={src:o.src,v:o.vol==='s'?20:o.vol==='l'?75:40} } if(j&&j.src==='ufo')j.src='love'; if(j&&SRC.some(function(x){return x.k===j.src}))st.src=j.src; if(j&&j.v>=0&&j.v<=100)st.v=+j.v; if(j&&Array.isArray(j.rl))st.rl=j.rl.filter(function(k){return SRC.some(function(x){return x.k===k})}); if(j&&/^(off|h|d|w)$/.test(j.ri||''))st.ri=j.ri; if(j&&/^\d\d:\d\d$/.test(j.at||''))st.at=j.at; if(j&&/^\d\d:\d\d$/.test(j.ao||''))st.ao=j.ao }catch(e){}
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
  if(!S.mine&&window.VRTMyMusic)VRTMyMusic.stop();
  try{if(S.mine){radioStop();if(ctx&&master)master.gain.setTargetAtTime(0,ctx.currentTime,.2);genStop();mm(function(M){M.play(Math.min(1,G()*1.4)).then(function(ok){if(!ok){on=false;draw();}})})}else if(S.gen){radioStop();genStart(S.k);setTimeout(function(){if(on&&ctx&&ctx.state!=='running')needGesture()},400)}else radioStart(S)}catch(e){on=false;tip('這個瀏覽器不能播放聲音 · Audio not supported')}draw()}
 function stop(){on=false;try{sessionStorage.removeItem('vrt_music_on')}catch(e){}radioStop();if(window.VRTMyMusic)VRTMyMusic.stop();clearTimeout(timer);if(ctx&&master){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(0,ctx.currentTime,.25);setTimeout(function(){if(!on){genStop();try{ctx.suspend()}catch(e){}}},900)}draw()}
 function setVol(v){st.v=Math.max(0,Math.min(100,Math.round(v)));save();if(ctx&&master&&on)master.gain.setTargetAtTime(G(),ctx.currentTime,.1);if(radio)radio.volume=Math.min(1,G()*1.4);if(window.VRTMyMusic)VRTMyMusic.vol(Math.min(1,G()*1.4));draw(true)}
 /* 🎧 我的音樂（2026-11-25）：歌存在這台裝置；第一次用才載入 my-music.js */
 function mm(cb){if(window.VRTMyMusic)return cb(window.VRTMyMusic);var s0=document.createElement('script');s0.src=MM_SRC;s0.onload=function(){if(window.VRTMyMusic)cb(window.VRTMyMusic)};s0.onerror=function(){tip('我的音樂載入失敗，請重新整理 · My music failed to load')};document.head.appendChild(s0)}
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
 '#vmPanel .row .star{margin-left:auto;font-style:normal;font-size:16px;opacity:.45;padding:2px 4px;flex:none}#vmPanel .row .star.on{opacity:1;color:#d99a00}'+
 '#vmPanel .atm{display:flex;gap:8px;margin:4px 4px 0;flex-wrap:wrap}#vmPanel .atm label{display:flex;align-items:center;gap:4px;font-size:12px}#vmPanel .atm input{font:inherit;font-size:12px;padding:3px 4px;border:1px solid #d5dde5;border-radius:7px;width:96px}#vmPanel .atn{display:block;margin:4px 4px 0;font-size:10.5px;opacity:.6;line-height:1.35}'+
 '#vmBox.bl{left:10px;bottom:calc(10px + env(safe-area-inset-bottom,0px));top:auto;right:auto;z-index:44;opacity:.92;filter:drop-shadow(0 2px 6px rgba(0,0,0,.25))}#vmBox.bl #vmMore{background:#14213d;color:#fff;opacity:.9}'+
 '@media print{#vmBox,#vmPanel,#vmTip,#vpPanel,#vpTint,#vpImg,#vpWp{display:none!important}}';
 var box,sw,more,panel,dot,T0=Date.now();
 function draw(volOnly){ if(sw){sw.classList.toggle('on',on);sw.setAttribute('aria-checked',on?'true':'false');sw.title=(on?'音樂：開 Music ON':'音樂：關 Music OFF')+'　·　音量 Volume '+st.v+'%（滾輪可調 scroll to adjust）';sw.lastChild.textContent=on?'ON':'OFF'}
  if(dot)dot.classList.toggle('on',on);
  if(!panel||panel.hidden)return; if(volOnly){var r=panel.querySelector('input[type=range]'),s=panel.querySelector('.vol span');if(r&&document.activeElement!==r)r.value=st.v;if(s)s.textContent=st.v+'%';panel.querySelectorAll('.q button').forEach(function(b){b.classList.toggle('on',+b.dataset.v===st.v)});return}
  var _vp=document.getElementById('vpBtn'),_mini=box.classList.contains('mini'),_pal=!!_vp;panel.innerHTML=((_mini||_pal)?'<div class="hd">'+(_mini?'<button class="psw '+(on?'on':'')+'">♪ '+(on?'ON · 點一下關 Stop':'OFF · 點一下開 Play')+'</button>':'')+(_pal?'<button class="pal">'+(_vp&&_vp.textContent==='🧱'?'🧱 壁紙 Wallpaper':'🎨 背景 Background')+'</button>':'')+'</div>':'')+SRC.map(function(x){return '<button class="row '+(st.src===x.k?'on':'')+'" data-k="'+x.k+'"><span style="font-size:18px;width:24px;text-align:center">'+x.ic+'</span><span>'+x.t+(x.note?'<small>'+x.note+' · 需要網路 needs internet</small>':'')+'</span><i class="star'+(st.rl.indexOf(x.k)>=0?' on':'')+'" data-st="'+x.k+'" title="加入／移出自動輪換 Add to / remove from auto-rotate">'+(st.rl.indexOf(x.k)>=0?'★':'☆')+'</i></button>'}).join('')+
   '<div class="vol">🔈<input type="range" min="0" max="100" step="5" value="'+st.v+'" aria-label="Volume"><span>'+st.v+'%</span></div><div class="q">'+[[20,'小 Low'],[40,'中 Mid'],[75,'大 High']].map(function(v){return '<button data-v="'+v[0]+'" class="'+(st.v===v[0]?'on':'')+'">'+v[1]+'</button>'}).join('')+'</div>'+
   '<div class="fxl">🔁 自動換台 Auto change（換有 ★ 的，至少 2 個 · rotates ★ stations）</div><div class="fx">'+[['off','不換 Off'],['h','每小時 Hourly'],['d','每天 Daily'],['w','每週 Weekly']].map(function(f){return '<button data-ri="'+f[0]+'" class="'+(st.ri===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>'+
   '<div class="fxl">⏰ 每天自動開／關 Daily on / off</div><div class="atm"><label>開 On <input type="time" data-at="at" value="'+st.at+'"></label><label>關 Off <input type="time" data-at="ao" value="'+st.ao+'"></label></div><small class="atn">平台要開著才會執行；瀏覽器規定這一頁要先點過一下，才會自動出聲。空白＝不用。<br>Runs only while the platform is open; tap the page once so the browser allows sound.</small>'+
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
  panel.addEventListener('click',function(e){var fb=e.target.closest('[data-fx]');if(fb){try{localStorage.setItem('vrt_fx2',fb.dataset.fx)}catch(_){}draw();window.vrtFx(panel,1);return}if(e.target.closest('.psw')){if(on)stop();else play();draw();return}if(e.target.closest('.pal')){panel.hidden=true;var vb=document.getElementById('vpBtn');if(vb)vb.click();return}var sb=e.target.closest('.star');if(sb){var sk=sb.dataset.st,ix=st.rl.indexOf(sk);if(ix>=0)st.rl.splice(ix,1);else st.rl.push(sk);save();draw();return}var rb=e.target.closest('[data-ri]');if(rb){st.ri=rb.dataset.ri;save();autoRot();draw();return}var r=e.target.closest('.row');if(r){if(r.dataset.k==='mine'){panel.hidden=true;mm(function(M){M.open()})}setSrc(r.dataset.k);if(!on)play();return}var q=e.target.closest('.q button');if(q)setVol(+q.dataset.v)});
  panel.addEventListener('input',function(e){if(e.target.type==='range')setVol(+e.target.value)});
  panel.addEventListener('change',function(e){var a=e.target.dataset&&e.target.dataset.at;if(a){st[a]=/^\d\d:\d\d$/.test(e.target.value)?e.target.value:'';save();tip(st[a]?'⏰ 每天 '+st[a]+(a==='at'?' 自動開':' 自動關'):'⏰ 已取消')}});
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
 /* v2.13 自動換台、每天定時開關：用「時鐘」算，第幾個小時／第幾天／第幾週就輪到第幾台；關掉再開會直接接上現在該播的那台。平台沒開就不會跑。 */
 function perIdx(ri){var n=Date.now(),d=Math.floor((n-new Date().getTimezoneOffset()*6e4)/864e5);return ri==='h'?Math.floor(n/36e5):ri==='d'?d:ri==='w'?Math.floor((d+3)/7):-1}
 function autoRot(){try{if(st.ri==='off')return;var L=st.rl.filter(function(k){return SRC.some(function(x){return x.k===k})});if(L.length<2)return;var k=L[perIdx(st.ri)%L.length];if(k&&k!==st.src){st.src=k;save();if(on){play();tip('🔁 換台：'+(SRC.filter(function(x){return x.k===k})[0]||{}).t)}else draw()}}catch(e){}}
 function clockTick(){try{autoRot();var t=new Date(),hm=('0'+t.getHours()).slice(-2)+':'+('0'+t.getMinutes()).slice(-2),day=t.toDateString(),fired='';try{fired=localStorage.getItem('vrt_music_fired')||''}catch(_){}
   if(st.at&&hm===st.at&&fired!==day+' on '+hm){try{localStorage.setItem('vrt_music_fired',day+' on '+hm)}catch(_){}if(!on){play();tip('⏰ '+hm+' 音樂開了 · Music on')}}
   if(st.ao&&hm===st.ao&&fired!==day+' off '+hm){try{localStorage.setItem('vrt_music_fired',day+' off '+hm)}catch(_){}if(on){stop();tip('⏰ '+hm+' 音樂關了 · Music off')}}}catch(e){}}
 setInterval(clockTick,20000);setTimeout(autoRot,1500);
 /* v2.16 休眠／離開畫面超過 30 分鐘：音樂自動停；回到畫面再接著播（到設定的關閉時間或離開頁面為止） */
 var hidAt=0,slept=false,slT=0;
 function pastOff(){if(!st.ao)return false;var t=new Date(),hm=('0'+t.getHours()).slice(-2)+':'+('0'+t.getMinutes()).slice(-2);return st.at&&st.at<st.ao?(hm>=st.ao||hm<st.at):false}
 document.addEventListener('visibilitychange',function(){try{
   if(document.hidden){hidAt=Date.now();clearTimeout(slT);if(on)slT=setTimeout(function(){if(document.hidden&&on){stop();slept=true}},30*60e3)}
   else{clearTimeout(slT);if(on&&hidAt&&Date.now()-hidAt>=30*60e3){stop();slept=true}
    if(slept){slept=false;if(!pastOff()){play();tip('▶️ 歡迎回來，音樂繼續 · Music resumed')}}hidAt=0}}catch(e){}});
 window.addEventListener('vrt-mymusic',function(e){var pl=e.detail&&e.detail.playing;if(pl){if(st.src!=='mine'){st.src='mine';save()}if(!on){on=true;radioStop();genStop();try{sessionStorage.setItem('vrt_music_on','1')}catch(_){}}draw()}});
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
 var FLATDEF=/^(ac-hra-portal|ac-hra-pay|ac-gascheck|ac-ga-exp|ac-gas-sec|ac-audit)$/.test(PLAT);   /* v2.20 Paul 11/25：這六個平台預設平面，要 3D 再自己選；PSJ 系列、Admin 維持 3D */
 var PROD=/^\/vrt-prod\//.test(P);   /* 生產平台：2026-11-23 起也用這個調色盤（原本入口頁的 🎨 收進來）；明暗沿用它自己的 ☀️／🌙（vrt-theme），這裡不另外做深色 */
 try{if(window.top!==window&&window.top.location.origin===location.origin)return}catch(e){}
 /* [key, 名稱, 色票顏色, 蓋上去的色片（深色系＝整頁反相後再蓋這個色，算好會剛好變成色票那個顏色）, 是否深色] */
 var COL=[['','白色 White','#ffffff'],['ivory','象牙 Ivory','#F5EFDC'],['beige','米色 Beige','#E6DACA'],['yellow','淡黃 Yellow','#F0E4BC'],['orange','淡橘 Orange','#F7D9B5'],
  ['pink','粉紅 Pink','#F0D4DF'],['purple','淡紫 Purple','#DCD3F2'],['blue','淡藍 Blue','#CFE0F2'],['green','淡綠 Green','#D3EADB'],['grey','淺灰 Grey','#E1E5EA'],
  ['dark','黑色 Black','#1b1f27','',1],['navy','海軍藍 Navy','#162444','#CEDCFC',1],['dpurple','深紫 Purple','#2A1E44','#E2D6FC',1],['dgreen','墨綠 Green','#143026','#C0DCD2',1],['wine','酒紅 Wine','#3A1820','#F9D7DF',1],
  ['brown','深咖啡 Brown','#33251C','#E3D5CC',1],['slate','石板灰 Slate','#262E38','#CBD3DD',1],['teal','深青 Teal','#123437','#B7D9DC',1],['olive','橄欖 Olive','#2C301A','#D0D4BE',1],['midnight','午夜藍 Midnight','#101830','#DFE7FF',1]];
 /* 卡片裡的主要按鈕（編輯、下一筆…）跟著底色走：淺色底＝同色系的深色；深色底＝同色系的淺色（深色系是整頁反相，這裡的值是反相前算好的） */
 var ACC={ivory:'#A8892F',beige:'#9A6B3F',yellow:'#C99700',orange:'#D9731A',pink:'#C9457A',purple:'#7B55C7',blue:'#2F6FC2',green:'#2E8B57',grey:'#56657A',dark:'#28303B',navy:'#265079',dpurple:'#59477D',dgreen:'#0B4D31',wine:'#803E4F',brown:'#66411C',slate:'#3C4B5F',teal:'#05494C',olive:'#363E00',midnight:'#3B4E8E'};
 function hx2(h){h=(h||'#ffffff').replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]}
 function mixHex(a,b){var x=hx2(a),y=hx2(b);return '#'+[0,1,2].map(function(i){return ('0'+Math.round((x[i]+y[i])/2).toString(16)).slice(-2)}).join('')}
 function colOf(k){return COL.filter(function(x){return x[0]===k})[0]||null}
 var st={c:'',c2:'',veil:70,wp:'',img:'',rc:[],rci:'off',rw:[],rwi:'off',fc:'',fw:'',ff:'',fz:100,b3:FLATDEF?0:1,c3:FLATDEF?0:1,br:100,co:85,tx:'',sh:'',pr:'n',tc:'',tc2:'',dv:2,ts:0},BG=null,IMGS=[],mixMode=false,tcMix=false;
 /* v2.14 字與樣式（每個平台各記各的） */
 var FCS=[['','原本 Default',''],['bg','同底色 Match',''],['k','黑 Black','#111827'],['dg','深灰 Charcoal','#374151'],['g','灰 Grey','#6b7280'],['nb','深藍 Navy','#1e3a8a'],['sb','海藍 Sea','#0f4c75'],['gn','深綠 Green','#14532d'],['br','咖啡 Brown','#5b3a29'],['wn','酒紅 Wine','#7f1d1d'],['pp','深紫 Purple','#4c1d95'],['w','白 White','#ffffff']];
 var FFS=[['','原本 Default',''],['sys','系統 System','system-ui,-apple-system,"Segoe UI",Roboto,sans-serif'],['jh','微軟正黑 JhengHei','"Microsoft JhengHei","微軟正黑體","PingFang TC","Noto Sans TC",sans-serif'],['noto','思源黑體 Noto Sans','"Noto Sans TC","Noto Sans CJK TC","Source Han Sans TC","PingFang TC",sans-serif'],['ping','蘋方 PingFang','"PingFang TC","Heiti TC","Microsoft JhengHei",sans-serif'],['pming','新細明體 PMingLiU','"PMingLiU","新細明體","MingLiU","Noto Serif TC","Songti TC",serif'],['ming','宋體 Song','"Noto Serif TC","Songti TC","STSong","SimSun","PMingLiU",serif'],['kai','楷體 Kai','"DFKai-SB","標楷體","BiauKai","Kaiti TC","KaiTi",serif'],['arial','Arial','Arial,"Helvetica Neue",Helvetica,"Microsoft JhengHei",sans-serif'],['times','Times New Roman','"Times New Roman",Times,"PMingLiU",serif'],['georgia','Georgia','Georgia,"Times New Roman","PMingLiU",serif'],['calibri','Calibri','Calibri,Carlito,"Segoe UI","Microsoft JhengHei",sans-serif'],['comic','Comic Sans','"Comic Sans MS","Comic Neue","Chalkboard SE","Microsoft JhengHei",cursive'],['verdana','Verdana','Verdana,Tahoma,"Microsoft JhengHei",sans-serif'],['mono','等寬 Mono','"Cascadia Mono",Consolas,"Courier New",monospace']];
 /* 各平台的「選單頁」：字的顏色／深淺／字型不套用，維持原樣（Paul 11/23：只對分頁有效） */
 function isMenu(pn){pn=String(pn||'').toLowerCase();return /^\/(ac-hra-portal\/(hra_portal_v2\.html)?|ac-hra-pay\/(index\.html)?|ac-admin\/(index\.html|classic\.html)?|ac-gascheck\/(ac_gascheck_portal_v1\.html|index\.html)?|ac-ga-exp\/(index\.html)?|ac-gas-sec\/(index\.html)?|ac-audit\/(ac_audit_platform_v1\.html|ac_audit_core\.html|index\.html)?|vrt-prod\/(index\.html)?)$/.test(pn)}
 var TCL={ff:false,fwl:false,fwd:false},MENU=isMenu(location.pathname);
 function preInv(hex){var c=hx2(hex),M=[[-0.574,1.43,0.144],[0.426,0.43,0.144],[0.426,1.43,-0.856]];return '#'+M.map(function(r){var v=255-(r[0]*c[0]+r[1]*c[1]+r[2]*c[2]);return ('0'+Math.max(0,Math.min(255,Math.round(v))).toString(16)).slice(-2)}).join('')}
 /* 🧱 壁紙 v2（2026-11-23 Paul 看過第一版後）：花紋要小、有間隔、有立體感；金屬要有鐵片的光澤。
    每種花紋都是「亮邊＋暗邊」的浮雕畫法（左上受光），畫在頁面底色那一層；深色底用另一組濃淡。 */
 function svgU(w,h,body){return 'url("data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+body+'</svg>')+'")'}
 var WPS=[['','無 None'],['grid','格子 Grid'],['dots','圓點 Dots'],['stars','星星 Stars'],['diamond','菱形 Diamond'],['clover','四葉草 Clover'],['stone','石壁 Stone'],['brick','磚牆 Brick'],['metal','金屬 Metal'],['linen','布紋 Linen'],['wood','木紋 Wood']];
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
 var BGD={};   /* 深色模式用：照片先反相好，整頁反相後剛好變回原圖 */
 function bgDark(src,id){if(BGD[id])return BGD[id];BGD[id]='pending';var im=new Image();im.onload=function(){try{var cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;var x=cv.getContext('2d');x.drawImage(im,0,0);var d=x.getImageData(0,0,cv.width,cv.height),a=d.data,M=[[-0.574,1.43,0.144],[0.426,0.43,0.144],[0.426,1.43,-0.856]];
   for(var i=0;i<a.length;i+=4){var r=a[i],g=a[i+1],b=a[i+2];a[i]=255-(M[0][0]*r+M[0][1]*g+M[0][2]*b);a[i+1]=255-(M[1][0]*r+M[1][1]*g+M[1][2]*b);a[i+2]=255-(M[2][0]*r+M[2][1]*g+M[2][2]*b)}x.putImageData(d,0,0);BGD[id]=cv.toDataURL('image/jpeg',.85);apply()}catch(e){BGD[id]='fail'}};im.src=src;return 'pending'}
 function wpCss(k,dark){
  if(/^__photo/.test(k)){if(!BG)return null;var vd=document.documentElement.classList.contains('vp-dark'),src=BG;if(vd){var dd=bgDark(BG,st.img||'x');if(dd&&dd!=='pending'&&dd!=='fail')src=dd}var v=(st.veil/100).toFixed(2),vc=(dark?'rgba(0,0,0,':'rgba(255,255,255,')+v+')';
   return {i:['linear-gradient('+vc+','+vc+')','url("'+src+'")'],s:['auto','cover'],p:['0 0','center center'],r:['repeat','no-repeat'],a:['scroll','fixed']}}
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
  if(k==='linen'){ /* 布紋：細細的經緯線，一亮一暗，像布料表面 */
   return one(svgU(12,12,'<path d="M0 3H12M0 9H12" '+DS(.08,1.6)+'/><path d="M3 0V12M9 0V12" '+DS(.055,1.4)+'/><path d="M0 2.1H12M0 8.1H12" '+LS(.5,.7)+'/><path d="M2.1 0V12M8.1 0V12" '+LS(.38,.6)+'/>'),12,12)}
  if(k==='wood'){ /* 木紋：橫向的年輪線，有深有淺，像木板 */
   var wl='',yy;for(yy=6;yy<120;yy+=9+((yy*7)%5)){var a1=2+((yy*3)%4),ph=(yy*13)%60;wl+='<path d="M0 '+yy+' Q'+(60+ph)+' '+(yy-a1)+' 120 '+yy+' T240 '+yy+'" '+DS(.07+((yy%3)*.02),1.1)+'/><path d="M0 '+(yy+1.2)+' Q'+(60+ph)+' '+(yy+1.2-a1)+' 120 '+(yy+1.2)+' T240 '+(yy+1.2)+'" '+LS(.45,.8)+'/>'}
   wl+='<ellipse cx="170" cy="58" rx="16" ry="5" '+DS(.12,1)+'/><ellipse cx="170" cy="58" rx="8" ry="2.4" '+DS(.1,.9)+'/>';
   return one(svgU(240,120,wl),240,120)}
  return null}
 var GCMAP={green:'green',yellow:'yellow',blue:'blue',pink:'pink',beige:'beige',navy:'navy',forest:'dgreen',black:'dark',wine:'wine',purple:'dpurple',white:''};
 function load(src){try{var own=src!=null?src:localStorage.getItem(KEY),j=JSON.parse(own||(WPONLY||GCK?'null':localStorage.getItem('vrt_pal'))||'null');st={c:'',c2:'',veil:70,wp:'',img:'',rc:[],rci:'off',rw:[],rwi:'off',fc:'',fw:'',ff:'',fz:100,b3:FLATDEF?0:1,c3:FLATDEF?0:1,br:100,co:85,tx:'',sh:'',pr:'n',tc:'',tc2:'',dv:2,ts:0};
   /* GASCheck 第一次：把它原本選的顏色帶過來（之後就由這個調色盤管） */
   if(GCK&&!own){try{var g=window.GCTheme&&window.GCTheme.choice&&window.GCTheme.choice();if(g&&GCMAP[g.key]!=null){st.c=GCMAP[g.key];localStorage.setItem(KEY,JSON.stringify(st));if(window.GCTheme.apply)window.GCTheme.apply()}}catch(_){}return}
   if(j){if(WPONLY){j.c='';j.c2=''}if(j.wp&&WPS.some(function(x){return x[0]===j.wp}))st.wp=j.wp;if(COL.some(function(x){return x[0]===j.c}))st.c=j.c;if(j.c2&&COL.some(function(x){return x[0]===j.c2}))st.c2=j.c2;if(j.veil>=0&&j.veil<=95)st.veil=+j.veil;if(typeof j.img==='string')st.img=j.img;
    if(Array.isArray(j.rc))st.rc=j.rc.filter(function(x){var q=String(x).split('|');return colOf(q[0])&&(!q[1]||colOf(q[1]))}).slice(0,20);if(/^(off|h|d|w)$/.test(j.rci||''))st.rci=j.rci;
    if(Array.isArray(j.rw))st.rw=j.rw.filter(function(x){return /^img:/.test(x)||WPS.some(function(w){return w[0]&&w[0]===x})}).slice(0,20);if(/^(off|h|d|w)$/.test(j.rwi||''))st.rwi=j.rwi;
    if(FCS.some(function(x){return x[0]===j.fc}))st.fc=j.fc;if(/^(|l|d)$/.test(j.fw||''))st.fw=j.fw||'';if(FFS.some(function(x){return x[0]===j.ff}))st.ff=j.ff;if(j.dv===2){if(j.b3===0||j.b3===1)st.b3=j.b3;if(j.c3===0||j.c3===1)st.c3=j.c3}else if(!FLATDEF){if(j.b3===0)st.b3=0;if(j.c3===0)st.c3=0}   /* 舊設定：六個平台一次改成平面（dv=2 之後照使用者選的） */
    if(TXS.some(function(x){return x[0]===j.tx}))st.tx=j.tx;if(SHS.some(function(x){return x[0]===j.sh}))st.sh=j.sh;if(PRS.some(function(x){return x[0]===j.pr}))st.pr=j.pr;if(j.tc===''||colOf(j.tc))st.tc=j.tc||'';if(j.tc2&&colOf(j.tc2)&&st.tc)st.tc2=j.tc2;if(+j.ts>0)st.ts=+j.ts;if(j.br>=60&&j.br<=140)st.br=+j.br;if([90,95,100,105,110].indexOf(+j.fz)>=0)st.fz=+j.fz;if(j.co>=40&&j.co<=100)st.co=+j.co}}catch(e){}}
 function save(){st.ts=Date.now();var js=JSON.stringify(st);try{localStorage.setItem(KEY,js)}catch(e){}try{idb('readwrite',function(o){return o.put(js,'st:'+KEY)})}catch(_){}if(GCK){try{window.GCTheme&&window.GCTheme.apply&&window.GCTheme.apply()}catch(_){}}}
 function idb(mode,fn){return new Promise(function(res){try{var rq=indexedDB.open('vrt_pal',1);rq.onupgradeneeded=function(){rq.result.createObjectStore('kv')};rq.onerror=function(){res(null)};rq.onsuccess=function(){try{var tx=rq.result.transaction('kv',mode),r=fn(tx.objectStore('kv'));tx.oncomplete=function(){res(r&&r.result)};tx.onerror=tx.onabort=function(){res(null)}}catch(e){res(null)}}}catch(e){res(null)}})}
 function lum(c){var m=String(c||'').replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/\d+(\.\d+)?/g);if(!m||m.length<3||(m.length>3&&+m[3]===0))return null;return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255}
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
 css+='#vpPanel .ph{display:flex;flex-wrap:wrap;gap:6px}#vpPanel .ph .pt{position:relative}#vpPanel .ph .pt button,#vpPanel .ph .padd{width:44px;height:44px;border-radius:9px;border:2px solid #cbd5e1;background:#f1f5f9 center/cover no-repeat;cursor:pointer;padding:0;font:700 20px/1 system-ui;color:#64748b}#vpPanel .ph .pt.on button{border-color:#22a35a;box-shadow:0 0 0 2px #22a35a55}'+
  '#vpPanel .ph .pt b,#vpPanel .rt .rc b{position:absolute;top:-6px;right:-6px;width:17px;height:17px;border-radius:50%;background:#475569;color:#fff;font:700 9px/17px system-ui;text-align:center;cursor:pointer}'+
  '#vpPanel .rt{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0 4px;font-size:11.5px}#vpPanel .rt>span:first-child{min-width:100%;opacity:.7}#vpPanel .rt .rc{position:relative}#vpPanel .rt .rc i{display:block;width:26px;height:26px;border-radius:50%;border:2px solid #cbd5e1}#vpPanel .rt .rc i.sq{border-radius:7px}'+
  '#vpPanel .rt button,#vpPanel .rtv button{border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:4px 8px;font:inherit;font-size:11.5px;cursor:pointer;color:inherit}#vpPanel .rtv{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px}#vpPanel .rtv button.on{background:#14213d;border-color:#14213d;color:#fff}'+
  'html.vp-glass .vp-card{-webkit-backdrop-filter:blur(2px) saturate(1.05);backdrop-filter:blur(2px) saturate(1.05)}'+
  '#vpPanel .ptb{display:flex;gap:4px;margin:-2px 0 10px;position:sticky;top:-10px;background:#fff;padding:6px 0;z-index:1;border-bottom:1px solid #e5eaf0}#vpPanel .ptb button{flex:1;border:1px solid #d5dde5;background:#f8fafc;border-radius:8px;padding:6px 2px;font:inherit;font-size:11.5px;font-weight:700;cursor:pointer;color:inherit;white-space:nowrap}#vpPanel .ptb button.on{background:#14213d;border-color:#14213d;color:#fff}'+
  '#vpPanel .ty{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0 6px;font-size:11.5px}#vpPanel .ty button{border:1px solid #d5dde5;background:#fff;border-radius:8px;padding:4px 8px;font:inherit;font-size:11.5px;cursor:pointer;color:inherit}#vpPanel .ty button.on{background:#14213d;border-color:#14213d;color:#fff}#vpPanel .ty .fc{width:24px;height:24px;border-radius:50%;padding:0;border:2px solid #cbd5e1;font-size:9px}#vpPanel .ty .fc.on{border-color:#22a35a;box-shadow:0 0 0 2px #22a35a66;background-clip:padding-box;color:inherit}#vpPanel .ty select{font:inherit;font-size:12px;padding:4px;border-radius:7px;border:1px solid #d5dde5;max-width:100%}#vpPanel .ty label{display:flex;align-items:center;gap:6px;width:100%}#vpPanel .ty input[type=range]{flex:1;accent-color:#22a35a}';
 var tint,img,btn,panel,wpEl,bri;
 var STYCSS='html.vp-fz body>*:not(#vpPanel):not(#vmPanel):not(#vmBox):not(#vmTip):not(#vpBtn):not(#vpTint):not(#vpBri):not(#vpWp):not(script):not(style){zoom:var(--vp-fz)}'+
  '#vpBri{position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:2147482900}'+
  'html.vp-ff body,html.vp-ff body *:not(i):not(svg):not(svg *):not([class*="fa-"]):not([class*="icon"]):not([class*="material"]):not(#vpPanel):not(#vmPanel):not(#vmBox):not(#vpPanel *):not(#vmPanel *):not(nav):not(nav *):not(aside):not(aside *){font-family:var(--vp-ff)!important}'+
  'html.vp-fwl body *:not(b):not(strong):not(h1):not(h2):not(h3):not(th):not(#vpPanel):not(#vmPanel):not(#vmBox):not(#vpPanel *):not(#vmPanel *):not(nav):not(nav *):not(aside):not(aside *){font-weight:300!important}html.vp-fwd body{-webkit-text-stroke:.35px currentColor}html.vp-fwd nav,html.vp-fwd aside{-webkit-text-stroke:0}html.vp-fwd #vpPanel,html.vp-fwd #vmPanel{-webkit-text-stroke:0}'+
  'html.vp-flatb button:not(#vpPanel):not(#vmPanel):not(#vmBox):not(#vpPanel *):not(#vmPanel *):not(#vmBox *),html.vp-flatb .btn,html.vp-flatb [role=button]{box-shadow:none!important;background-image:none!important;text-shadow:none!important;filter:none!important;border-bottom-width:1px!important;transform:none!important}'+
  'html.vp-flatc .vp-card,html.vp-flatc [data-vpg]{box-shadow:none!important;background-image:none!important}';
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
     var cs=w0.getComputedStyle(e),m=cs.backgroundColor.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[];if(m.length<3||(m.length>3&&+m[3]<0.9))continue;
     if(parseFloat(cs.borderTopLeftRadius)>4||cs.boxShadow!=='none')continue;                       /* 圓角或有影子＝卡片，不是外框 */
     if(cs.position==='fixed'&&(+cs.zIndex||0)>=900)continue;
     out.push(e)}})}catch(_){}return out}
 function wpDoc(d,k){try{var w0=d.defaultView,b=d.body,h=d.documentElement;if(!w0||!b)return;
   var old=[].slice.call(d.querySelectorAll('[data-vpwp]'));
   if(!k){old.forEach(wpClear);return}
   var tg=[b],hm=w0.getComputedStyle(h).backgroundColor.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[];if(hm.length>=3&&(hm.length<4||+hm[3]>0.05))tg.push(h);
   wpCovers(d,w0).forEach(function(e){tg.push(e)});
   old.forEach(function(e){if(tg.indexOf(e)<0)wpClear(e)});
   tg.forEach(function(e){wpSet(e,k,w0)})}catch(_){}}

 /* ===== v2.20（2026-11-25 Paul）按鈕／卡片「質感」：金屬、木質、石壁、玻璃、皮革；形狀；顏色；按下效果 =====
    · 按鈕和卡片同一個質感、同一個色系（卡片淺一點，字照樣看得清楚）；顏色＝調色盤的顏色，但一定比背景深一些（自動＝背景同色系）。
    · 每個平台各自記住（跟其他調色設定一起存 vrt_pal:<平台>，另備份一份在 IndexedDB）；同平台所有分頁、內嵌分頁都通用。
    · 只用 CSS 變數＋html 上的 class，換的時候一次換好，不會一直閃。
    · 按下效果只用 :active（手指／滑鼠放開就結束），另外放開、取消、捲動、切走視窗時把卡片的「按下」狀態全部清掉，不會陷下去彈不回來。
    · 深色主題是整頁反相：這時按鈕／卡片會比底色「亮」一點點（深色畫面的常規做法），字仍清楚。 */
 var TXS=[['','原本 Default'],['metal','🔩 金屬 Metal'],['wood','🪵 木質 Wood'],['stone','🪨 石壁 Stone'],['glass','💎 玻璃 Glass'],['leather','👜 皮革 Leather']];
 var SHS=[['','原本 Default'],['sq','⬛ 方正 Square'],['rd','▢ 圓角 Rounded'],['pill','💊 膠囊 Pill'],['rock','🪨 石塊 Stone block']];
 var PRS=[['n','正常 Normal'],['sink','⬇ 下沉 Sink'],['pop','🔘 彈縮 Squeeze'],['glow','✨ 發光 Glow'],['dim','🌑 變暗 Darken'],['off','不動 None']];
 var TXNAT={metal:['#7d8794','#e7ebef'],wood:['#9a6a3f','#ecdcc6'],stone:['#8b8b84','#e4e2dc'],glass:['#5d7fa3','#e6eef7'],leather:['#6e4630','#ecdcd0']};
 function hxm(a,b,t){var x=hx2(a),y=hx2(b);return '#'+[0,1,2].map(function(i){return ('0'+Math.round(x[i]+(y[i]-x[i])*t).toString(16)).slice(-2)}).join('')}
 function hlum(h){var c=hx2(h);return (0.2126*c[0]+0.7152*c[1]+0.0722*c[2])/255}
 var NOISE="url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .32 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";
 var TXL={ /* [紋理, 光澤, 紋理大小, 浮起影子] */
  metal:['repeating-linear-gradient(90deg,rgba(255,255,255,.10) 0 1px,rgba(0,0,0,.05) 1px 2px,transparent 2px 4px)','linear-gradient(180deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.10) 46%,rgba(0,0,0,.10) 54%,rgba(0,0,0,.20) 100%)','auto','0 2px 5px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.75),inset 0 -1px 0 rgba(0,0,0,.25)'],
  wood:['repeating-linear-gradient(93deg,rgba(70,35,10,.13) 0 2px,transparent 2px 7px,rgba(70,35,10,.07) 7px 8px,transparent 8px 15px,rgba(255,255,255,.07) 15px 17px,transparent 17px 24px)','linear-gradient(180deg,rgba(255,255,255,.20),rgba(0,0,0,.10))','auto','0 2px 5px rgba(60,30,10,.30),inset 0 1px 0 rgba(255,255,255,.35),inset 0 -2px 0 rgba(60,30,10,.25)'],
  stone:[NOISE,'linear-gradient(160deg,rgba(255,255,255,.28),rgba(0,0,0,.14))','140px 140px','0 3px 6px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.30),inset 0 -2px 0 rgba(0,0,0,.20)'],
  glass:['linear-gradient(120deg,rgba(255,255,255,.0) 40%,rgba(255,255,255,.35) 50%,rgba(255,255,255,0) 60%)','linear-gradient(180deg,rgba(255,255,255,.60) 0%,rgba(255,255,255,.10) 50%,rgba(255,255,255,.02) 100%)','auto','0 4px 14px rgba(15,23,42,.18),inset 0 1px 0 rgba(255,255,255,.85)'],
  leather:['radial-gradient(rgba(0,0,0,.10) 1px,transparent 1.3px)','linear-gradient(180deg,rgba(255,255,255,.14),rgba(0,0,0,.12))','5px 5px','0 2px 5px rgba(40,20,10,.30),inset 0 1px 0 rgba(255,255,255,.25)']};
 var TXB=':is(button,.btn,a.btn,[role=button],input[type=button],input[type=submit]):not(#kn-box *):not(.pkn-box *):not(#vpPanel *):not(#vmPanel *):not(#vmBox *):not(#vpBtn):not([role=tab]):not([role=switch]):not([data-vt=off]):not(.kn-n):not(.vc3)';
 var TXC=':is(.vc3,.vp-card,[data-vpg]):not(#kn-box *):not(.pkn-box *):not(#vpPanel *):not(#vmPanel *):not([data-vt=off])';
 var TXCSS=(function(){var B='html.vt-on '+TXB,C='html.vt-on '+TXC,o='';
  o+=B+'{background-color:var(--vt-b)!important;color:var(--vt-bt)!important;border:1px solid var(--vt-bd)!important;background-image:var(--vt-tex),var(--vt-hl),var(--vt-gr)!important;background-size:var(--vt-ts),auto,auto!important;text-shadow:none!important}';
  o+=B+' *{color:inherit}';
  o+=C+'{background-color:var(--vt-k)!important;color:var(--vt-bt)!important;background-image:var(--vt-tex),var(--vt-hl),var(--vt-grk)!important;background-size:var(--vt-ts),auto,auto!important;border-color:var(--vt-bd)!important;text-shadow:none!important}';
  o+='html.vt-on:not(.vp-flatb) '+TXB+'{box-shadow:var(--vt-sd)!important}html.vt-on:not(.vp-flatc) '+TXC+'{box-shadow:var(--vt-sd)!important}';
  o+='html.vt-glass '+TXB+',html.vt-glass '+TXC+'{-webkit-backdrop-filter:blur(6px) saturate(1.2);backdrop-filter:blur(6px) saturate(1.2)}';
  o+='html.vt-leather '+TXB+'{outline:1px dashed rgba(255,255,255,.45)!important;outline-offset:-4px}html.vt-leather '+TXC+'{outline:1px dashed var(--vt-bd)!important;outline-offset:-6px}';
  /* 形狀 */
  var SH={sq:['3px','4px'],rd:['10px','14px'],pill:['999px','22px'],rock:['14px 6px 16px 8px / 8px 15px 6px 14px','20px 9px 24px 11px / 11px 22px 9px 20px']};
  Object.keys(SH).forEach(function(k){o+='html.vt-sh-'+k+' '+TXB+'{border-radius:'+SH[k][0]+'!important}html.vt-sh-'+k+' '+TXC+'{border-radius:'+SH[k][1]+'!important}'});
  /* 按下效果：只用 :active／.vc-dn，放開就恢復；雙 class 讓它蓋過「平面」的設定 */
  var BA=TXB.replace(':is(',':is(')+':active',CA=TXC+'.vc-dn',CA2=TXC+':active';
  o+='html.vt-pr '+TXB+',html.vt-pr '+TXC+'{transition:transform .12s ease,box-shadow .12s ease,filter .12s ease!important;-webkit-tap-highlight-color:transparent}';
  var PR={sink:'transform:translateY(2px)!important;box-shadow:inset 0 3px 7px rgba(0,0,0,.35)!important;filter:brightness(.95)!important',
   pop:'transform:scale(.94)!important',glow:'box-shadow:0 0 0 3px var(--vt-gl),0 0 16px var(--vt-gl)!important',dim:'filter:brightness(.80)!important',off:'transform:none!important;filter:none!important'};
  Object.keys(PR).forEach(function(k){var x='html.vt-pr-'+k+'.vt-pr-'+k+' ';o+=x+BA+','+x+CA+','+x+CA2+'{'+PR[k]+'}'});
  /* 平面：連卡片的金屬光、浮起影子、傾斜一起拿掉 */
  o+='html.vp-flatc .vc3,html.vp-flatc .vc3.vc3-g,html.vp-flatc .vc3.vc3-d{box-shadow:none!important}html.vp-flatc:not(.vt-on) .vc3.vc3-g{background-image:none!important}html.vp-flatc .vc3.vc3-p.vc-hov,html.vp-flatc .vc3.vc3-p.vc-dn{transform:none!important;box-shadow:none!important}html.vp-flatc .fx-tilt,html.vp-flatc [data-fx=tilt],html.vp-flatc .mod-btn,html.vp-flatc .kpi{transform:none!important}';
  return o})();
 var TXV={};
 function txApply(h,dark){var on=!!(st.tx||st.tc),k=st.tx||'metal',nat=TXNAT[k],L=st.tx?TXL[k]:['none','none','auto','0 2px 5px rgba(0,0,0,.22)'],c=colOf(st.c);
  /* v2.20 按鈕和卡片「同一個顏色」：選了調色盤的色＝那個色；沒選＝背景同色系；白底＝質感本身的顏色。
     只會比背景深一點（淺色調暗到比背景再深一階；本來就深的色不動）。混色＝兩個色漸層。 */
  var c2=st.c2&&c&&c[0]?colOf(st.c2):null,mixBg=!!(c2&&c2[0]&&!!c2[4]===!!c[4]&&c2[0]!==c[0]);
  var bgL=(c&&c[0]&&!c[4])?hlum(c[2]):(st.wp||st.img)?0.86:0.97;if(mixBg&&!c[4])bgL=Math.min(bgL,hlum(c2[2]));
  var tgt=Math.max(0.40,Math.min(0.80,bgL-0.13));
  var fit=function(x){var g=0;while(hlum(x)>tgt&&g++<20)x=hxm(x,'#000000',.06);return x};
  var A,B='';
  var viv=function(k2){var x=colOf(k2);return x[4]?x[2]:(ACC[k2]?hxm(x[2],ACC[k2],.3):x[2])};if(st.tc){A=viv(st.tc);if(st.tc2&&colOf(st.tc2))B=viv(st.tc2);else if(mixBg&&!st.tc2)B=hxm(A,c2[4]?(ACC[c2[0]]||c2[2]):c2[2],.6)}
  else if(c&&c[0]&&!c[4]&&ACC[c[0]]){A=hxm(c[2],ACC[c[0]],.35);if(mixBg&&ACC[c2[0]])B=hxm(c2[2],ACC[c2[0]],.35)}
  else if(c&&c[4]){A=c[3]||'#cbd5e1';if(mixBg)B=c2[3]||''}
  else A=hxm(nat[0],nat[1],.45);
  A=fit(A);if(B)B=fit(B);
  /* 字色：有選「字的顏色」而且看得清楚就用它；不然看底色深淺自動黑字／白字（淺底一定不會是白字） */
  var rl=function(hx){var a=hx2(hx).map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]},
   cr=function(x,y){var p=rl(x),q=rl(y);return (Math.max(p,q)+0.05)/(Math.min(p,q)+0.05)},stops=B?[A,B,hxm(A,B,.5)]:[A],
   worst=function(t){return Math.min.apply(null,stops.map(function(s0){return cr(t,s0)}))};
  var want='';if(st.fc==='bg')want=ACC[st.c]||'#1f2937';else{var fx=FCS.filter(function(x){return x[0]===st.fc})[0];if(fx&&fx[2])want=fx[2]}
  var bt=(want&&worst(want)>=3.2)?want:(worst('#1f2937')>=worst('#ffffff')?'#1f2937':'#ffffff');
  var mid=B?hxm(A,B,.5):A,bd=hxm(mid,'#000000',.25),gl=hxm(mid,'#ffffff',.35);
  var al=k==='glass'?'d9':'',ak=k==='glass'?'c0':((st.wp||st.img)&&st.co<100?('0'+Math.round(Math.max(.4,st.co/100)*255).toString(16)).slice(-2):'');
  var P=dark?preInv:function(x){return x};
  var gr=function(a2){return B?'linear-gradient(135deg,'+P(A)+a2+' 0%,'+P(hxm(A,B,.5))+a2+' 50%,'+P(B)+a2+' 100%)':'none'};
  TXV={'--vt-b':P(A)+al,'--vt-k':P(A)+ak,'--vt-gr':gr(al),'--vt-grk':gr(ak),'--vt-bt':P(bt),'--vt-bd':P(bd),'--vt-gl':P(gl)+'99','--vt-tex':L[0],'--vt-hl':L[1],'--vt-ts':L[2],'--vt-sd':L[3]};
  TXV.__stops=stops.map(function(x){return hx2(P(x))});TXV.__bt=hx2(P(bt));TXV.__fc=!!want;
  var cls=['vt-on',on?'vt-'+k:'',st.sh?'vt-sh-'+st.sh:'',st.pr!=='n'?'vt-pr':'',st.pr!=='n'?'vt-pr-'+st.pr:''].filter(Boolean);
  TXV.__cls=cls;TXV.__on=on;TXV.__sig=on?JSON.stringify([A,B,bt,dark,st.fc,k]):'';txDoc(document)}
 /* v2.20 卡片／按鈕裡的字：灰黑字（有選字色時）或看不清楚的字（對比不到 3 倍，例如淺卡片上的白字）→ 換成上面算好的字色。
    紅綠等狀態色只要看得清楚就不動；自己有底色的小標籤不動。換顏色時先全部還原再重算。 */
 var SURF=TXB+','+TXC;
 function txText(d){try{var on=!!TXV.__on&&d.documentElement.classList.contains('vt-on');
   if(!on||d.__vtSig!==TXV.__sig){[].forEach.call(d.querySelectorAll('[data-vtt]'),function(e){var o=e.__vtt||['',''];if(o[0])e.style.setProperty('color',o[0],o[1]);else e.style.removeProperty('color');e.removeAttribute('data-vtt')});[].forEach.call(d.getElementsByTagName('*'),function(e){e.__vtt2=0});d.__vtSig=on?TXV.__sig:''}
   if(!on)return;var w0=d.defaultView,ss=d.querySelectorAll(SURF),n=0,bt='rgb('+TXV.__bt.join(',')+')';
   var rl=function(c){var a=c.map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]},cr=function(x,y){var p=rl(x),q=rl(y);return (Math.max(p,q)+0.05)/(Math.min(p,q)+0.05)};
   for(var i=0;i<ss.length&&n<3000;i++){var s0=ss[i],all=[s0].concat([].slice.call(s0.querySelectorAll('*'),0,250));
    for(var j=0;j<all.length;j++){var e=all[j];if(e.__vtt2)continue;e.__vtt2=1;n++;if(/^(SCRIPT|STYLE|svg|SVG|path|IMG|CANVAS|IFRAME|INPUT|SELECT|TEXTAREA|OPTION)$/.test(e.tagName))continue;
     var t=false;for(var c=e.firstChild;c;c=c.nextSibling)if(c.nodeType===3&&/\S/.test(c.nodeValue)){t=true;break}if(!t)continue;
     var own=false;for(var x=e;x&&x!==s0;x=x.parentElement){if(x!==e&&x.matches&&x.matches(SURF)){own=true;break}var m0=(w0.getComputedStyle(x).backgroundColor.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[]).map(Number);if(x!==s0&&m0.length>=3&&(m0.length<4||m0[3]>0.5)){own=true;break}}
     if(own)continue;var m=(w0.getComputedStyle(e).color.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[]).map(Number);if(m.length<3)continue;m=m.slice(0,3);
     var grey=Math.max(m[0],m[1],m[2])-Math.min(m[0],m[1],m[2])<=42,low=Math.min.apply(null,TXV.__stops.map(function(sx){return cr(m,sx)}))<3;
     if(!(low||(grey&&TXV.__fc)))continue;e.__vtt=[e.style.getPropertyValue('color'),e.style.getPropertyPriority('color')];e.style.setProperty('color',bt,'important');e.setAttribute('data-vtt','')}}}catch(_){}}
 function txDoc(d){try{var h=d.documentElement;if(d!==document&&!d.getElementById('vrt-pal-tx')){var s4=d.createElement('style');s4.id='vrt-pal-tx';s4.textContent=TXCSS;(d.head||h).appendChild(s4)}
   var want=(TXV.__cls||[]).filter(function(x){return x!=='vt-on'||TXV.__on});[].slice.call(h.classList).forEach(function(x){if(/^vt-/.test(x)&&want.indexOf(x)<0)h.classList.remove(x)});want.forEach(function(x){h.classList.add(x)});
   Object.keys(TXV).forEach(function(kv){if(kv.indexOf('--')===0)h.style.setProperty(kv,TXV[kv])})}catch(_){}}
 /* 放開／取消／捲動／切走：把卡片的「按下」狀態清乾淨 */
 (function(){var clr=function(){try{docsAll().forEach(function(d){[].forEach.call(d.querySelectorAll('.vc-dn'),function(e){e.classList.remove('vc-dn')})})}catch(_){}};
  ['pointerup','pointercancel','touchend','touchcancel','dragend'].forEach(function(ev){document.addEventListener(ev,function(){setTimeout(clr,140)},{passive:true,capture:true})});
  window.addEventListener('blur',clr);document.addEventListener('visibilitychange',clr);window.addEventListener('scroll',function(){clr()},{passive:true,capture:true})})();
 function txHtml(b){var sw=function(k,on){var x=colOf(k);return '<button class="fc'+(on?' on':'')+'" data-sy="tc" data-sv="'+k+'" title="'+(x?x[1]:'自動 Auto')+'" style="'+(x?'background:'+x[2]:'background:linear-gradient(135deg,#fff 50%,#94a3b8 50%)')+'">'+(k===''?'自':'')+'</button>'};
  return '<div class="ty"><span style="width:100%;opacity:.7">質感 Material（按鈕和卡片一致）</span>'+TXS.map(function(x){return b('tx',x[0],x[1],st.tx)}).join('')+'</div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">形狀 Shape</span>'+SHS.map(function(x){return b('sh',x[0],x[1],st.sh)}).join('')+'</div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">按鈕／卡片顏色 Colour（同一個色，比背景深一些）</span>'+sw('',st.tc==='')+COL.filter(function(x){return x[0]}).map(function(x){return sw(x[0],st.tc===x[0]||st.tc2===x[0])}).join('')+'<button data-a="tcmix" class="'+(tcMix?'on':'')+'">🎨＋🎨 漸層混色</button>'+(tcMix?'<span>再點第二個顏色</span>':'')+(st.tc2?'<button data-a="tcunmix">取消混色</button>':'')+'</div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">按下效果 Press</span>'+PRS.map(function(x){return b('pr',x[0],x[1],st.pr)}).join('')+'</div>'}
 function wpAll(){try{var k=(BG&&!WPONLY)?'__photo:'+(st.img||'x')+':'+st.veil+':'+(document.documentElement.classList.contains('vp-dark')?1:0)+':'+(BGD[st.img||'x']&&BGD[st.img||'x'].length>20?1:0):(st.wp||'');docsAll().forEach(function(d){wpDoc(d,k)})}catch(_){}}
 function apply(){ if(!document.body)return;
  if(WPONLY){st.c='';st.c2=''}
  var c=COL.filter(function(x){return x[0]===st.c})[0]||COL[0],dark=!!c[4],h=document.documentElement,ov=dark?c[3]:(c[0]?c[2]:'');
  /* 兩色混合：同一組（淺配淺、深配深）各取一半 */
  var c2=st.c2&&c[0]?colOf(st.c2):null;if(c2&&c2[0]&&!!c2[4]===!!c[4]&&c2[0]!==c[0])ov=mixHex(ov||'#ffffff',(dark?c2[3]:c2[2])||'#ffffff');
  if(PROD){if(dark){dark=false;ov=''}if(h.classList.contains('vrt-inv')||h.getAttribute('data-theme')==='dark')ov=''}
  if(dark&&nativeDark()){dark=false;ov=''}
  var acc=(ov||dark)?(c2&&c2[0]&&ACC[c2[0]]?mixHex(ACC[c[0]],ACC[c2[0]]):ACC[c[0]]):'';if(acc)h.style.setProperty('--vp-acc',acc);else h.style.removeProperty('--vp-acc');h.classList.toggle('vp-acc',!!acc);
  var grd='';if(c2&&c2[0]&&!!c2[4]===!!c[4]&&c2[0]!==c[0]){var ca=dark?c[3]:c[2],cb=dark?c2[3]:c2[2];grd='linear-gradient(135deg,'+ca+' 0%,'+ca+' 18%,'+mixHex(ca,cb)+' 50%,'+cb+' 82%,'+cb+' 100%)'}
  if(ov){if(!tint){tint=document.createElement('div');tint.id='vpTint';tint.setAttribute('aria-hidden','true')}tint.style.background=grd||ov;if(tint.parentNode!==document.body)document.body.appendChild(tint)}else if(tint&&tint.parentNode)tint.parentNode.removeChild(tint);
  var wc=!!st.wp||!!(BG&&!WPONLY);
  /* v2.14 字色：同底色＝底色那一系的深色；深色模式整頁反相，先算好反相前的值 */
  var fcv='';if(st.fc==='bg')fcv=ACC[st.c]?(dark?ACC[st.c]:ACC[st.c]):(dark?'#e5e7eb':'#1f2937');else{var fx=FCS.filter(function(x){return x[0]===st.fc})[0];if(fx&&fx[2])fcv=dark?preInv(fx[2]):fx[2]}
  if(st.fc==='bg'&&dark&&!ACC[st.c])fcv=preInv('#e5e7eb');
  var ffv=(FFS.filter(function(x){return x[0]===st.ff})[0]||FFS[0])[2];
  if(fcv)h.style.setProperty('--vp-fc',fcv);else h.style.removeProperty('--vp-fc');if(ffv)h.style.setProperty('--vp-ff',ffv);else h.style.removeProperty('--vp-ff');
  TCL={ff:!!ffv,fwl:st.fw==='l',fwd:st.fw==='d',fz:st.fz};h.style.setProperty('--vp-fz',String(st.fz/100));h.classList.toggle('vp-fz',st.fz!==100&&!MENU);h.classList.toggle('vp-ff',TCL.ff&&!MENU);h.classList.toggle('vp-fwl',TCL.fwl&&!MENU);h.classList.toggle('vp-fwd',TCL.fwd&&!MENU);h.classList.toggle('vp-flatb',!st.b3);h.classList.toggle('vp-flatc',!st.c3);
  var ts=!!(fcv||ffv||st.fw||st.fz!==100||!st.b3||!st.c3||st.br!==100||st.co<85||st.tx||st.sh||st.pr!=='n');txApply(h,dark);
  if(st.br!==100){if(!bri){bri=document.createElement('div');bri.id='vpBri';bri.setAttribute('aria-hidden','true')}var bk=st.br<100;bri.style.background=bk?'rgba(0,0,0,'+((100-st.br)/100*1.1).toFixed(3)+')':'rgba(255,255,255,'+((st.br-100)/100*1.1).toFixed(3)+')';bri.style.mixBlendMode=bk?'normal':'screen';if(bri.parentNode!==document.body)document.body.appendChild(bri)}else if(bri&&bri.parentNode)bri.parentNode.removeChild(bri);
  h.classList.toggle('vp-dark',dark);h.classList.toggle('vp-inv',dark);h.classList.toggle('vp-on',!!(ov||dark||BG||wc||ts));wpAll();cards();

  if(false){if(!img){img=document.createElement('div');img.id='vpImg';img.setAttribute('aria-hidden','true')}var v=(st.veil/100).toFixed(2);img.style.backgroundImage='linear-gradient(rgba(255,255,255,'+v+'),rgba(255,255,255,'+v+')),url("'+BG+'")';if(img.parentNode!==document.body)document.body.appendChild(img)}else if(img&&img.parentNode)img.parentNode.removeChild(img) }
 /* 換了底色／背景圖後，卡片要「浮起來」：加影子、邊線、一點金屬光澤（Paul 11/23：不然卡片跟背景黏在一起）。
    只加在原本沒有漸層圖的卡片上，不改它原本的底色；關掉調色（白色、沒背景圖）就全部拿掉。 */
 var CSEL='.kpi,.kpi-card,.stat-card,.sum-card,.metric,.kc,.kcard,.card,.exp-card,.sew-card,.tile,.panel,.box,.sbox,.kn-n,[class*="kpi-"],[class*="-kpi"],[class$="-card"],[class*="-card "]',ct=0;
 /* 連嵌在裡面的分頁（同網域 iframe，最多兩層）一起處理：色片本來就蓋得到，卡片的影子／按鈕顏色要另外送進去 */
 function docsAll(){var out=[document];try{[].forEach.call(document.querySelectorAll('iframe'),function(f){try{var d=f.contentDocument;if(d&&d.documentElement&&d.body){out.push(d);[].forEach.call(d.querySelectorAll('iframe'),function(g){try{var e=g.contentDocument;if(e&&e.documentElement&&e.body)out.push(e)}catch(_){}})}}catch(_){}})}catch(_){}return out}
 function palRun(){try{
   var H=document.documentElement,on=H.classList.contains('vp-on'),acc=H.classList.contains('vp-acc')?H.style.getPropertyValue('--vp-acc'):'';
   docsAll().forEach(function(d){try{var h=d.documentElement;
    if(d!==document){if(on&&!d.getElementById('vrt-pal-card')){var s2=d.createElement('style');s2.id='vrt-pal-card';s2.textContent=CARDCSS;(d.head||h).appendChild(s2)}
     h.classList.toggle('vp-on',on);h.classList.toggle('vp-inv',H.classList.contains('vp-inv'));h.classList.toggle('vp-acc',!!acc);if(acc)h.style.setProperty('--vp-acc',acc);else h.style.removeProperty('--vp-acc');
     var dm=false;try{dm=isMenu(d.location.pathname)}catch(_){}h.classList.toggle('vp-ff',TCL.ff&&!dm);h.classList.toggle('vp-fz',TCL.fz!==100&&!dm);h.style.setProperty('--vp-fz',String((TCL.fz||100)/100));h.classList.toggle('vp-fwl',TCL.fwl&&!dm);h.classList.toggle('vp-fwd',TCL.fwd&&!dm);['vp-flatb','vp-flatc'].forEach(function(k){h.classList.toggle(k,H.classList.contains(k))});txDoc(d);var ffv2=H.style.getPropertyValue('--vp-ff');if(ffv2)h.style.setProperty('--vp-ff',ffv2);else h.style.removeProperty('--vp-ff');
     if(!d.getElementById('vrt-pal-sty')){var s3=d.createElement('style');s3.id='vrt-pal-sty';s3.textContent=STYCSS;(d.head||h).appendChild(s3)}}
    var els=d.querySelectorAll(on?CSEL:'.vp-card'),n=0,w0=d.defaultView;
    for(var i=0;i<els.length&&n<600;i++){var e=els[i];if(!on){e.classList.remove('vp-card');e.__vpc=0;continue}if(e.classList.contains('vp-card')||e.__vpc)continue;n++;
     if(e.closest('#vmPanel,#vpPanel,#vmBox'))continue;var w=e.offsetWidth,hh=e.offsetHeight;if(w<70||hh<36){continue}
     var cs=w0.getComputedStyle(e);e.__vpc=1;if(cs.backgroundImage!=='none'||cs.position==='fixed')continue;var bg=cs.backgroundColor.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[];if(bg.length>3&&+bg[3]<0.4)continue;
     e.classList.add('vp-card')}
    glass(d,on&&!TXV.__on&&st.co<100&&!!(st.wp||st.img||st.c||st.co<85));fontPass(d,on&&!!H.style.getPropertyValue('--vp-fc')&&!(function(){try{return isMenu(d.location.pathname)}catch(_){return false}})());txText(d);cgPass(d,on)}catch(_){}})}catch(_){}}
 /* v2.21（2026-11-25 Paul：換色後字有時看不到——字跟卡片／背景太接近、淺字配淺底）
    全頁檢查：每個有字的元素，找它實際的底色（不透明的底色，或漸層的平均色；圖片底不猜），對比不到 2.5 倍 → 換成看得清楚的深字或白字。
    有選字色而且夠清楚就用字色。換主題時先全部還原再重算。 */
 function cgRgb(str){var out=[],re=/rgba?\(([^)]+)\)|#([0-9a-f]{6}|[0-9a-f]{3})\b/gi,m;str=String(str||'').replace(/color\(srgb[^)]*\)/gi,window.__vcs);while((m=re.exec(str))){if(m[1]){var p=m[1].split(/[\s,\/]+/).filter(Boolean).map(Number);if(p.length>=3)out.push([p[0],p[1],p[2],p.length>3?p[3]:1])}else{var h=m[2];if(h.length===3)h=h.replace(/./g,'$&$&');out.push([parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),1])}}return out}
 function cgBg(e,w0){for(var x=e,k=0;x&&x.nodeType===1&&k<14;x=x.parentElement,k++){var cs=w0.getComputedStyle(x),c=cgRgb(cs.backgroundColor)[0],bi=cs.backgroundImage||'';
   if(bi.indexOf('gradient')>=0){var cl=cgRgb(bi).filter(function(q){return q[3]>=0.35});if(cl.length){var r=0,g=0,b=0,wt=0;cl.forEach(function(q){r+=q[0]*q[3];g+=q[1]*q[3];b+=q[2]*q[3];wt+=q[3]});var av=[r/wt,g/wt,b/wt];if(c&&c[3]>=0.6)av=[(av[0]+c[0])/2,(av[1]+c[1])/2,(av[2]+c[2])/2];var mx=Math.max.apply(null,cl.map(function(q){return q[3]}));if(mx>=0.6||(c&&c[3]>=0.6))return av}}
   if(c&&c[3]>=0.6)return c.slice(0,3);
   if(bi.indexOf('url(')>=0&&x!==e.ownerDocument.documentElement&&x!==e.ownerDocument.body)return null}
  return [255,255,255]}
 function cgRL(c){var a=c.map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]}
 function cgCR(a,b){var x=cgRL(a),y=cgRL(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}
 function cgPass(d,on){try{var H=document.documentElement,sig=on?JSON.stringify([st.c,st.c2,st.wp,st.img,st.tx,st.tc,st.tc2,st.fc,H.classList.contains('vp-dark')]):'';
   if(d.__cgSig!==sig){[].forEach.call(d.querySelectorAll('[data-vcg]'),function(e){var o=e.__vcg||['',''];if(o[0])e.style.setProperty('color',o[0],o[1]);else e.style.removeProperty('color');e.removeAttribute('data-vcg')});[].forEach.call(d.getElementsByTagName('*'),function(e){e.__vcg2=0});d.__cgSig=sig}
   if(!on||!d.body)return;var w0=d.defaultView,els=d.body.getElementsByTagName('*'),n=0,fc=(H.style.getPropertyValue('--vp-fc')||'').trim(),fcr=fc?cgRgb(fc)[0]:null;
   for(var i=0;i<els.length&&n<2500;i++){var e=els[i];if(e.__vcg2)continue;var tg=e.tagName;if(/^(SCRIPT|STYLE|svg|SVG|path|IMG|CANVAS|IFRAME|INPUT|SELECT|TEXTAREA|OPTION|VIDEO)$/.test(tg))continue;
    var t=false;for(var c0=e.firstChild;c0;c0=c0.nextSibling)if(c0.nodeType===3&&/\S/.test(c0.nodeValue)){t=true;break}if(!t)continue;if(!e.offsetWidth&&!e.offsetHeight)continue;e.__vcg2=1;n++;
    if(e.closest('#vpPanel,#vmPanel,#vmBox,#vmTip,#vpTint'))continue;
    var cs=w0.getComputedStyle(e),col=cgRgb(cs.color)[0];if(!col||col[3]<0.25)continue;if(/transparent|rgba\(0, 0, 0, 0\)/.test(cs.webkitTextFillColor||''))continue;
    var bg=cgBg(e,w0);if(!bg)continue;var cc=col.slice(0,3);if(cgCR(cc,bg)>=2.5)continue;
    var pick=fcr&&cgCR(fcr.slice(0,3),bg)>=3?fc:(cgCR([31,41,55],bg)>=cgCR([255,255,255],bg)?'#1f2937':'#ffffff');
    e.__vcg=[e.style.getPropertyValue('color'),e.style.getPropertyPriority('color')];e.style.setProperty('color',pick,'important');e.setAttribute('data-vcg','')}}catch(_){}}
 function cards(){ if(ct)return; ct=setTimeout(function(){ct=0;palRun()},160)}
 /* v2.17：新加進來的卡片在畫面更新前就套好透明度／字色，不會先閃出原本顏色（同上，連續很多次才退回節流） */
 var pN=0,pAt=0;function palMO(ms){if(!document.documentElement.classList.contains('vp-on'))return;var add=false;for(var q=0;q<ms.length&&!add;q++){var an=ms[q].addedNodes;for(var r=0;r<an.length;r++)if(an[r].nodeType===1){add=true;break}}
  if(add){var tg=ms[0]&&ms[0].target;try{if(tg&&tg.closest&&tg.closest('#kn-box,.pkn-box,#kn-mask'))return}catch(_){}var now=Date.now();if(now-pAt>250){pAt=now;pN=0}if(++pN<=2){clearTimeout(ct);ct=0;palRun();return}}cards()}   /* v2.22 大字卡裡展開名單／員工卡不再每次重跑整頁（會卡、會閃） */
 /* v2.13 有壁紙時，卡片稍微透明（約 85%），隱約看得到後面的花紋；字、按鈕都不變。關掉壁紙就還原。 */
 function glass(d,on2){try{d.documentElement.classList.toggle('vp-glass',on2);if(on2&&!d.getElementById('vrt-pal-glass')){var g=d.createElement('style');g.id='vrt-pal-glass';g.textContent='html.vp-glass [data-vpg]{-webkit-backdrop-filter:blur(2px) saturate(1.05);backdrop-filter:blur(2px) saturate(1.05)}';(d.head||d.documentElement).appendChild(g)}
   var w0=d.defaultView;
   if(!on2){[].forEach.call(d.querySelectorAll('[data-vpg]'),function(e){var o=e.__vpg||['',''];if(o[0])e.style.setProperty('background-color',o[0],o[1]);else e.style.removeProperty('background-color');e.removeAttribute('data-vpg');e.__vpg2=0});return}
   /* 「卡片」＝有圓角、有影子或邊框、底色不透明、不是滿版外框、不是彈出視窗／選單；每個元素只檢查一次 */
   var els=d.querySelectorAll('.vp-card,div,section,article,aside,details,li,a'),vw=w0.innerWidth,vh=w0.innerHeight,n=0;
   for(var i=0;i<els.length&&n<400;i++){var e=els[i];if(e.__vpg2)continue;
    var w=e.offsetWidth,h=e.offsetHeight;if(!w)continue;e.__vpg2=1;n++;if(w<70||h<36||(w>=vw*.97&&h>=vh*.9))continue;
    if(e.closest('#vmPanel,#vpPanel,#vmBox,#vmTip,[role=dialog],dialog,.modal,.overlay'))continue;
    var cs=w0.getComputedStyle(e);if(cs.position==='fixed'||cs.position==='sticky')continue;
    var m=cs.backgroundColor.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[];if(m.length<3||(m.length>3&&+m[3]<0.9))continue;
    var card=e.classList.contains('vp-card')||(parseFloat(cs.borderTopLeftRadius)>=6&&(cs.boxShadow!=='none'||parseFloat(cs.borderTopWidth)>0));if(!card)continue;
    e.__vpg=[e.style.getPropertyValue('background-color'),e.style.getPropertyPriority('background-color')];e.style.setProperty('background-color','rgba('+m[0]+','+m[1]+','+m[2]+','+(st.co/100).toFixed(2)+')','important');e.setAttribute('data-vpg','');e.__vpgc=st.co}
   if(on2)[].forEach.call(d.querySelectorAll('[data-vpg]'),function(e){if(e.__vpgc!==st.co){var mm=(e.style.getPropertyValue('background-color').replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[]);if(mm.length>=3){e.style.setProperty('background-color','rgba('+mm[0]+','+mm[1]+','+mm[2]+','+(st.co/100).toFixed(2)+')','important');e.__vpgc=st.co}}})}catch(_){}}
 /* v2.14 字色：只換「原本是一般深灰／黑字」的字（亮色按鈕上的白字、紅綠狀態色都不動）；深底的頁面則換原本的淺灰白字 */
 function fontPass(d,on3){try{var w0=d.defaultView,fc=document.documentElement.style.getPropertyValue('--vp-fc');d.documentElement.style.setProperty('--vp-fc',fc);
   if(!on3){[].forEach.call(d.querySelectorAll('[data-vpf]'),function(e){var o=e.__vpf||['',''];if(o[0])e.style.setProperty('color',o[0],o[1]);else e.style.removeProperty('color');e.removeAttribute('data-vpf');e.__vpf2=0});return}
   if(d.__vpFC!==fc){[].forEach.call(d.querySelectorAll('[data-vpf]'),function(e){var o=e.__vpf||['',''];if(o[0])e.style.setProperty('color',o[0],o[1]);else e.style.removeProperty('color');e.removeAttribute('data-vpf')});[].forEach.call(d.body.getElementsByTagName('*'),function(e){e.__vpf2=0});d.__vpFC=fc}
   var want=hx2(fc.trim().charAt(0)==='#'?fc.trim():'#1f2937'),CAND=[want,[255,255,255],[17,24,39],[30,58,138],[76,29,149],[245,239,220],[15,76,117]];
   function rl(c){var a=c.map(function(v){v/=255;return v<=0.03928?v/12.92:Math.pow((v+0.055)/1.055,2.4)});return 0.2126*a[0]+0.7152*a[1]+0.0722*a[2]}
   function cr(a,b){var x=rl(a),y=rl(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}
   function effBg(e){for(var x=e;x&&x.nodeType===1;x=x.parentElement){var m=(w0.getComputedStyle(x).backgroundColor.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[]).map(Number);if(m.length>=3&&(m.length<4||m[3]>0.5))return m.slice(0,3)}return [255,255,255]}
   /* 字色跟底色太接近（對比不到 3 倍）就自動換成最看得清楚的那個 */
   function best(e){var bg=effBg(e);if(cr(want,bg)>=3)return fc;var bc=want,bv=0;CAND.forEach(function(c){var v=cr(c,bg);if(v>bv){bv=v;bc=c}});return 'rgb('+bc.join(',')+')'}
   var nd=d===document?nativeDark():false,els=d.body.getElementsByTagName('*'),n=0;
   for(var i=0;i<els.length&&n<1500;i++){var e=els[i];if(e.__vpf2)continue;var tg=e.tagName;if(/^(SCRIPT|STYLE|SVG|svg|PATH|path|IMG|CANVAS|IFRAME|INPUT|SELECT|TEXTAREA|OPTION)$/.test(tg))continue;
    var t=false;for(var c=e.firstChild;c;c=c.nextSibling)if(c.nodeType===3&&/\S/.test(c.nodeValue)){t=true;break}if(!t)continue;
    if(!e.offsetWidth&&!e.offsetHeight)continue;e.__vpf2=1;n++;
    if(e.closest('#vpPanel,#vmPanel,#vmBox,#vmTip,nav,aside,.rail,.drawer,.sidebar'))continue;if(TXV.__on&&e.closest(SURF))continue;
    var m=(w0.getComputedStyle(e).color.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[]).map(Number);if(m.length<3)continue;var mx=Math.max(m[0],m[1],m[2]),mn=Math.min(m[0],m[1],m[2]),L=(0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255;
    if(mx-mn>42)continue;if(nd?L<0.55:L>0.55)continue;
    e.__vpf=[e.style.getPropertyValue('color'),e.style.getPropertyPriority('color')];e.style.setProperty('color',best(e),'important');e.setAttribute('data-vpf','')}}catch(_){}}
 setInterval(function(){if(!document.hidden&&document.documentElement.classList.contains('vp-on')){cards();if(st.wp)wpAll()}},2500);
 try{new MutationObserver(palMO).observe(document.documentElement,{subtree:true,childList:true})}catch(_){}
 function draw(){ if(!panel||panel.hidden)return;
  var wpRow='<div class="swl">🧱 壁紙 Wallpaper'+(WPONLY?'':'（可以跟顏色、混色一起用 · works with any colour or mix）')+'</div><div class="wp">'+WPS.map(function(x){var w=x[0]?wpCss(x[0],false):null;return '<button data-w="'+x[0]+'" class="'+(st.wp===x[0]?'on':'')+'"><i style="'+(w?'background-image:'+w.i.join(',').replace(/"/g,"&quot;")+(w.pv===2?';background-size:cover;background-position:center bottom':w.pv?';background-size:auto 100%,100% 100%;background-position:30% 100%,0 0;background-color:#eef4fa':';background-size:'+w.s.join(',')):'background-color:#fff')+'"></i>'+x[1]+'</button>'}).join('')+'</div>';
  if(WPONLY){panel.innerHTML='<b class="h">🧱 壁紙 Wallpaper（這個平台自己記住）</b>'+wpRow+rotHtml(false)+'<small>顏色請用這個平台原本的 🎨；這裡只管壁紙，每個平台各設各的。<br>Colours stay in this platform’s own 🎨; wallpaper is saved per platform.</small>';panel.innerHTML=tabBar()+(PTAB==='ty'?styHtml():panel.innerHTML);place2();return}
  panel.innerHTML='<b class="h">🎨 背景顏色 Background（這個平台自己記住 · saved per platform）</b><div class="sw">'+COL.filter(function(x){return !x[4]}).map(function(x){return '<button data-c="'+x[0]+'" class="'+(st.c===x[0]?'on':'')+'"><i style="background:'+x[2]+'"></i>'+x[1]+'</button>'}).join('')+'</div>'+(PROD?'<div class="swl">明暗 Light / Dark（生產平台原本的）</div><div class="mx" style="margin-top:0"><button data-a="th-light">☀️ 淡色 Light</button><button data-a="th-dark">🌙 深色 Dark</button>'+(document.getElementById('themeBtn')?'<button data-a="oldbg">原本的背景選單</button>':'')+'</div>':'<div class="swl">深色 Dark</div><div class="sw">'+COL.filter(function(x){return x[4]}).map(function(x){return '<button data-c="'+x[0]+'" class="'+(st.c===x[0]?'on':'')+'"><i style="background:'+x[2]+'"></i>'+x[1]+'</button>'}).join('')+'</div>')+
   '<div class="mx"><button data-a="mix" class="'+(mixMode?'on':'')+'">🎨＋🎨 混色 Mix</button>'+(mixMode?'<span>再點一個顏色 pick a second colour</span>':'')+(st.c2&&colOf(st.c2)&&colOf(st.c)?'<span>'+colOf(st.c)[1].split(' ')[0]+'＋'+colOf(st.c2)[1].split(' ')[0]+' ＝ <i style="background:linear-gradient(135deg,'+colOf(st.c)[2]+','+colOf(st.c2)[2]+')"></i></span><button data-a="unmix">取消混色 Unmix</button>':'')+'</div>'+
   wpRow+
   '<div class="swl">🖼️ 我的照片 My photos（最多 10 張 · max 10）</div><div class="ph">'+IMGS.map(function(m){return '<span class="pt'+(st.img===m.id?' on':'')+'"><button data-im="'+m.id+'" style="background-image:url(&quot;'+m.d+'&quot;)" title="用這張 Use"></button><b data-imx="'+m.id+'" title="刪掉 Delete">✕</b></span>'}).join('')+(IMGS.length<10?'<button class="padd" data-a="pick" title="加照片 Add">＋</button>':'')+'</div>'+
   (BG?'<div class="im" style="border:0;padding-top:0;margin-top:6px"><button data-a="clear">不用照片 No photo</button><label>遮罩 Veil <input type="range" min="30" max="95" step="5" value="'+st.veil+'"><span>'+st.veil+'%</span></label></div>':'')+'<small>照片只存在這台裝置，不會上傳。遮罩越高，圖越淡、字越清楚。<br>Photos stay on this device. Higher veil = fainter image.</small>'+rotHtml(true);panel.innerHTML=tabBar()+(PTAB==='ty'?styHtml():panel.innerHTML);
  place2() }
 /* v2.13 自動輪換：顏色一組、壁紙（含照片）一組，各自設「每小時／每天／每週」；照時鐘算第幾段輪到第幾個，平台開著才會換 */
 var IVS=[['off','不換 Off'],['h','每小時 Hourly'],['d','每天 Daily'],['w','每週 Weekly']];
 function perIdx(ri){var n=Date.now(),d=Math.floor((n-new Date().getTimezoneOffset()*6e4)/864e5);return ri==='h'?Math.floor(n/36e5):ri==='d'?d:ri==='w'?Math.floor((d+3)/7):-1}
 function colSw(x){var q=String(x).split('|'),a=colOf(q[0]),b=q[1]?colOf(q[1]):null;return a?(b?mixHex(a[2],b[2]):a[2]):'#fff'}
 function wpChip(x){if(/^img:/.test(x)){var m=IMGS.filter(function(i){return 'img:'+i.id===x})[0];return m?'background-image:url(&quot;'+m.d+'&quot;);background-size:cover':'background:#ddd'}var w=wpCss(x,false);return w?'background-color:#fff;background-image:'+w.i.join(',').replace(/"/g,'&quot;')+';background-size:'+w.s.join(','):'background:#fff'}
 function styHtml(){var b=function(k,v,t,cur){return '<button data-sy="'+k+'" data-sv="'+v+'" class="'+(String(cur)===String(v)?'on':'')+'">'+t+'</button>'};
  return '<div class="swl" style="margin-top:12px">🔤 字與樣式 Text &amp; style（這個平台自己記住）</div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">字的顏色 Text colour</span>'+FCS.map(function(x){var bgc=x[0]==='bg'?(ACC[st.c]||'#1f2937'):x[2];return '<button class="fc'+(st.fc===x[0]?' on':'')+'" data-sy="fc" data-sv="'+x[0]+'" title="'+x[1]+'" style="'+(bgc?'background:'+bgc+';color:'+(x[0]==='w'?'#333':'#fff'):'background:#fff')+'">'+(x[0]===''?'原':x[0]==='bg'?'底':'')+'</button>'}).join('')+'</div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">字的深淺 Weight</span>'+b('fw','l','淡 Light',st.fw)+b('fw','','標準 Normal',st.fw)+b('fw','d','深 Bold',st.fw)+'</div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">字的大小 Size</span>'+b('fz',90,'小 A-',st.fz)+b('fz',95,'稍小',st.fz)+b('fz',100,'標準 A',st.fz)+b('fz',105,'稍大',st.fz)+b('fz',110,'大 A+',st.fz)+'</div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">字型 Font</span><select data-sy="ff">'+FFS.map(function(x){return '<option value="'+x[0]+'"'+(st.ff===x[0]?' selected':'')+' style="font-family:'+(x[2]||'inherit').replace(/"/g,"'")+'">'+x[1]+'</option>'}).join('')+'</select></div>'+
   '<div class="ty"><span style="width:100%;opacity:.7">按鈕 Buttons</span>'+b('b3',1,'立體 3D',st.b3)+b('b3',0,'平面 Flat',st.b3)+'<span style="width:100%;opacity:.7">卡片 Cards</span>'+b('c3',1,'立體 3D',st.c3)+b('c3',0,'平面 Flat',st.c3)+'</div>'+txHtml(b)+
   '<div class="ty"><label>☀️ 頁面亮度 Brightness <input type="range" data-sy="br" min="60" max="140" step="5" value="'+st.br+'"><span>'+st.br+'%</span></label>'+
   '<label>🪟 卡片不透明度 Card opacity <input type="range" data-sy="co" min="40" max="100" step="5" value="'+st.co+'"><span>'+st.co+'%</span></label>'+b('reset','1','↺ 字與樣式還原 Reset','')+'</div>'}
 function rotHtml(full){var iv=function(key,cur){return '<div class="rtv">'+IVS.map(function(f){return '<button data-'+key+'="'+f[0]+'" class="'+(cur===f[0]?'on':'')+'">'+f[1]+'</button>'}).join('')+'</div>'};
  var h='<div class="swl" style="margin-top:12px">🔁 自動輪換 Auto-rotate（平台開著才會換，至少放 2 個 · needs 2+）</div>';
  if(full)h+='<div class="rt"><span>顏色 Colour</span>'+st.rc.map(function(x,i){return '<span class="rc"><i style="background:'+colSw(x)+'"></i><b data-rcx="'+i+'">✕</b></span>'}).join('')+(st.rc.length<20?'<button data-a="rc+">＋ 目前顏色 Add current</button>':'')+'</div>'+iv('rci',st.rci);
  h+='<div class="rt"><span>壁紙 Wallpaper</span>'+st.rw.map(function(x,i){return '<span class="rc"><i class="sq" style="'+wpChip(x)+'"></i><b data-rwx="'+i+'">✕</b></span>'}).join('')+(st.rw.length<20?'<button data-a="rw+">＋ 目前'+(full?'壁紙／照片 Add current':'壁紙 Add current')+'</button>':'')+'</div>'+iv('rwi',st.rwi);
  return h}
 function rotTick(quiet){try{var ch=false;
   if(!WPONLY&&st.rci!=='off'&&st.rc.length>=2){var x=String(st.rc[perIdx(st.rci)%st.rc.length]).split('|');if(colOf(x[0])&&(st.c!==x[0]||st.c2!==(x[1]||''))){st.c=x[0];st.c2=x[1]||'';ch=true}}
   if(st.rwi!=='off'&&st.rw.length>=2){var y=st.rw[perIdx(st.rwi)%st.rw.length];if(/^img:/.test(y)){var id=y.slice(4);if(IMGS.some(function(m){return m.id===id})&&(st.img!==id||st.wp)){st.wp='';imgUse(id);ch=true}}else if(st.wp!==y||st.img){st.wp=y;imgUse('');ch=true}}
   if(ch){save();if(!quiet){apply();draw()}}}catch(e){}}
 setInterval(function(){rotTick(false)},60000);
 var anchorEl=null,PTAB='bg';
 function tabBar(){var t=[['bg',WPONLY?'🧱 壁紙':'🎨 背景'],['ty','🔤 字體樣式'],['mu','🎵 音樂']];return '<div class="ptb">'+t.map(function(x){return '<button data-pt="'+x[0]+'" class="'+(PTAB===x[0]?'on':'')+'">'+x[1]+'</button>'}).join('')+'</div>'}
 function place2(){var a=(anchorEl&&anchorEl.offsetWidth)?anchorEl:(btn.offsetWidth?btn:document.getElementById('vmBox')),b=a.getBoundingClientRect(),w=Math.min(296,innerWidth-16),hh=panel.offsetHeight||260,up=b.bottom+6+hh>innerHeight-4&&b.top>hh;panel.style.top=Math.max(6,Math.min(innerHeight-hh-6,up?b.top-hh-6:b.bottom+6))+'px';panel.style.left=Math.max(8,Math.min(innerWidth-w-8,b.right-w))+'px'}
 function shrink(file){return (window.createImageBitmap?createImageBitmap(file):Promise.reject()).then(function(bmp){var k=Math.min(1,1600/Math.max(bmp.width,bmp.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*k));c.height=Math.max(1,Math.round(bmp.height*k));c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return c.toDataURL('image/jpeg',0.8)})}
 /* v2.13 自己的照片最多 10 張（只存在這台裝置的 IndexedDB 'imgs:<平台>'），點縮圖＝用這張；可以放進壁紙輪換 */
 function imgSave(){idb('readwrite',function(s){return s.put(IMGS,'imgs:'+PLAT)});try{localStorage.setItem('vrt_pal_img',String(Date.now()))}catch(e){}}
 function imgUse(id){var m=IMGS.filter(function(x){return x.id===id})[0];st.img=m?id:'';BG=m?m.d:null}
 function pick(){if(IMGS.length>=10){alert('最多 10 張，先刪掉一張 · Max 10 photos');return}var inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.multiple=true;inp.onchange=function(){var fs=[].slice.call(inp.files||[],0,10-IMGS.length);if(!fs.length)return;
   Promise.all(fs.map(function(f){return shrink(f).catch(function(){return null})})).then(function(ds){var last='';ds.forEach(function(d){if(!d)return;var id='p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);IMGS.push({id:id,d:d});last=id});if(last){imgUse(last);save();imgSave();apply();draw()}})};inp.click()}
 function mount(){ var box=document.getElementById('vmBox'); if(!box||btn)return !!btn;
  var s=document.createElement('style');s.id='vrt-pal-css';s.textContent=css+STYCSS+TXCSS+(PROD?'#themeBtn{display:none!important}':'')+(GCK?'#gc-theme-btn{display:none!important}':'');document.head.appendChild(s);
  btn=document.createElement('button');btn.id='vpBtn';btn.type='button';btn.title='背景顏色／背景圖 Background';btn.setAttribute('aria-label','Background colour');btn.textContent=WPONLY?'🧱':'🎨';if(WPONLY){btn.title='壁紙 Wallpaper';btn.setAttribute('aria-label','Wallpaper')}box.appendChild(btn);
  panel=document.createElement('div');panel.id='vpPanel';panel.hidden=true;document.body.appendChild(panel);
  btn.addEventListener('click',function(e){e.stopPropagation();anchorEl=null;panel.hidden=!panel.hidden;draw()});
  window.vrtPalette={open:function(a){anchorEl=a||null;panel.hidden=false;draw()},state:function(){return {plat:PLAT,c:st.c,c2:st.c2,wp:st.wp}}};
  panel.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.a==='th-light'||b.dataset.a==='th-dark'){var tv=b.dataset.a==='th-dark'?'dark':'light';try{if(typeof window.setTheme==='function'&&document.getElementById('themeBtn'))window.setTheme(tv);else if(window.VRTTheme)window.VRTTheme.set(tv)}catch(_){}setTimeout(function(){apply();draw()},60);return}
   if(b.dataset.a==='oldbg'){panel.hidden=true;var tb=document.getElementById('themeBtn');if(tb)setTimeout(function(){tb.click()},0);return}
   if(b.dataset.w!=null){st.wp=b.dataset.w;save();apply();draw();return}
   if(b.dataset.pt){if(b.dataset.pt==='mu'){panel.hidden=true;var mm=document.getElementById('vmMore'),dt=document.getElementById('vmDot'),sw0=document.getElementById('vmSw');setTimeout(function(){if(mm&&mm.offsetWidth)mm.click();else if(dt&&dt.offsetWidth)dt.click();else if(sw0)sw0.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true}))},0);return}PTAB=b.dataset.pt;draw();panel.scrollTop=0;return}
   if(b.dataset.sy){var sy=b.dataset.sy,sv=b.dataset.sv;if(sy==='reset'){st.fc='';st.fw='';st.ff='';st.fz=100;st.b3=FLATDEF?0:1;st.c3=FLATDEF?0:1;st.br=100;st.co=85;st.tx='';st.sh='';st.pr='n';st.tc='';st.tc2=''}else if(sy==='b3'||sy==='c3'||sy==='fz')st[sy]=+sv;else if(sy==='tc'&&tcMix&&st.tc&&sv&&sv!==st.tc){st.tc2=sv;tcMix=false}else{st[sy]=sv;if(sy==='tc'){st.tc2='';tcMix=false}}save();apply();draw();return}
   if(b.dataset.im){imgUse(b.dataset.im);save();apply();draw();return}
   if(b.dataset.rci){st.rci=b.dataset.rci;save();rotTick(false);draw();return}if(b.dataset.rwi){st.rwi=b.dataset.rwi;save();rotTick(false);draw();return}
   if(b.dataset.a==='rc+'){var cv=st.c+(st.c2?'|'+st.c2:'');if(st.rc.indexOf(cv)<0)st.rc.push(cv);save();draw();return}
   if(b.dataset.a==='rw+'){var wv=st.img?'img:'+st.img:st.wp;if(wv&&st.rw.indexOf(wv)<0)st.rw.push(wv);save();draw();return}
   if(b.dataset.a==='mix'){mixMode=!mixMode;draw();return}if(b.dataset.a==='tcmix'){tcMix=!tcMix;draw();return}if(b.dataset.a==='tcunmix'){st.tc2='';tcMix=false;save();apply();draw();return}if(b.dataset.a==='unmix'){st.c2='';mixMode=false;save();apply();draw();return}
   if(b.dataset.c!=null){var k=b.dataset.c,a0=colOf(st.c),a1=colOf(k);if(mixMode&&st.c&&k&&k!==st.c&&a0&&a1&&!!a0[4]===!!a1[4]){st.c2=k}else{st.c=k;st.c2=''}mixMode=false;save();apply();draw()}else if(b.dataset.a==='pick')pick();else if(b.dataset.a==='clear'){imgUse('');save();apply();draw()}});
  panel.addEventListener('click',function(e){var x=e.target.closest('b[data-imx],b[data-rcx],b[data-rwx]');if(!x)return;e.stopPropagation();
   if(x.dataset.imx){var id=x.dataset.imx;IMGS=IMGS.filter(function(m){return m.id!==id});st.rw=st.rw.filter(function(r){return r!=='img:'+id});if(st.img===id)imgUse('');imgSave()}
   else if(x.dataset.rcx!=null)st.rc.splice(+x.dataset.rcx,1);else if(x.dataset.rwx!=null)st.rw.splice(+x.dataset.rwx,1);save();apply();draw()});
  panel.addEventListener('input',function(e){var sy=e.target.dataset&&e.target.dataset.sy;if(!sy)return;e.stopImmediatePropagation();if(sy==='ff'){st.ff=e.target.value}else{st[sy]=+e.target.value;var sp=e.target.parentNode.querySelector('span');if(sp)sp.textContent=st[sy]+'%'}save();apply()},true);
  panel.addEventListener('change',function(e){if(e.target.dataset&&e.target.dataset.sy==='ff'){st.ff=e.target.value;save();apply();draw()}});
  panel.addEventListener('input',function(e){if(e.target.type==='range'){st.veil=+e.target.value;save();apply();var sp=panel.querySelector('label span');if(sp)sp.textContent=st.veil+'%'}});
  document.addEventListener('click',function(e){if(!panel.hidden&&!panel.contains(e.target)&&e.target!==btn&&!(e.target.closest&&e.target.closest('#vmPanel .pal')))panel.hidden=true},true);
  try{window.vrtMusic&&window.vrtMusic.place()}catch(e){} return true }
 function readImg(){if(WPONLY)return Promise.resolve();return idb('readonly',function(s){return s.get('imgs:'+PLAT)}).then(function(a){
   if(Array.isArray(a)){IMGS=a.filter(function(x){return x&&x.id&&typeof x.d==='string'&&x.d.indexOf('data:image/')===0}).slice(0,10);return null}
   /* 舊版只有一張圖：搬進新的照片清單，原本有用就繼續用 */
   return idb('readonly',function(s){return s.get('bg:'+PLAT)}).then(function(d){if(d==null&&!GCK)return idb('readonly',function(s){return s.get('bg')});return d}).then(function(d){IMGS=[];if(typeof d==='string'&&d.indexOf('data:image/')===0){IMGS=[{id:'p0',d:d}];if(!st.img)st.img='p0';save()}imgSave()})}).then(function(){imgUse(st.img);rotTick(true);apply();draw()})}
 function start(){load();rotTick(true);apply();readImg();
  /* v2.20：localStorage 滿了存不進去時，設定改從 IndexedDB 的備份讀回來（比較新的那份為準），不會每次重開都忘記 */
  idb('readonly',function(o){return o.get('st:'+KEY)}).then(function(v){try{if(typeof v==='string'){var jv=JSON.parse(v);if((+jv.ts||0)>(+st.ts||0)){load(v);imgUse(st.img);apply();if(panel&&!panel.hidden)draw()}}}catch(_){}});var n=0,iv=setInterval(function(){if(mount()||++n>40)clearInterval(iv)},250);mount();
  window.addEventListener('storage',function(e){if(e.key===KEY){load();imgUse(st.img);apply();draw()}else if(e.key==='vrt_pal_img')readImg()})}
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
   if(v===undefined||v===null){var c=getComputedStyle(n),m=c.backgroundColor.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[];v=(m.length>=3&&(m.length<4||+m[3]>0.5))?(0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255:(c.backgroundImage!=='none'&&/gradient/.test(c.backgroundImage)?(function(g){var q=g.match(/rgba?\(([^)]+)\)/);if(!q)return -1;var t=q[1].split(',').map(parseFloat);return (0.2126*t[0]+0.7152*t[1]+0.0722*t[2])/255})(c.backgroundImage):-1);if(cache)cache.set(n,v)}
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
 function rgb(c){c=String(c||'');var cs0=/^\s*color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+))?/i.exec(c);if(cs0)return [Math.round(+cs0[1]*255),Math.round(+cs0[2]*255),Math.round(+cs0[3]*255),cs0[4]!=null?+cs0[4]:1];   /* v2.18：color-mix() 算出來是 color(srgb …)，以前讀不懂就當成透明 → 深色卡片被當成淺色 */
  if(!/^\s*rgb/i.test(c))return null;var m=c.replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g);if(!m||m.length<3)return null;return [+m[0],+m[1],+m[2],m.length>3?+m[3]:1]}
 function lum(a){return (0.2126*a[0]+0.7152*a[1]+0.0722*a[2])/255}
 function mix(a,b,t){return [0,1,2].map(function(i){return Math.round(a[i]+(b[i]-a[i])*t)})}
 function bgOf(e){ /* 這個元素自己的底色（純色或漸層第一個顏色）；透明＝null */
  try{var cs=W.getComputedStyle(e),c=rgb(cs.backgroundColor);if(c&&c[3]>0.5)return c;
   if(cs.backgroundImage&&/gradient/.test(cs.backgroundImage)){var q=cs.backgroundImage.match(/rgba?\([^)]+\)/);var g=q&&rgb(q[0]);if(g&&g[3]>0.5)return g}}catch(_){}return null}
 function pageBg(){var c=document.body&&bgOf(document.body);if(!c)c=bgOf(H);return c||[255,255,255,1]}
 var CSS=
  '.vc3{box-shadow:0 12px 26px rgba(15,23,42,.20),0 3px 7px rgba(15,23,42,.14),inset 0 1px 0 rgba(255,255,255,.95),inset 0 -2px 0 rgba(15,23,42,.10)!important}.vc3:not(.vc3-a){border-color:rgba(15,23,42,.24)!important}'+
  '.vc3.vc3-g{background-image:linear-gradient(150deg,rgba(255,255,255,.45) 0%,rgba(255,255,255,0) 30%,rgba(15,23,42,.06) 58%,rgba(255,255,255,.18) 74%,rgba(15,23,42,.12) 100%)!important}'+
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
  '.vc-bk{box-shadow:inset 0 1px 0 rgba(255,255,255,.62),inset 1px 0 0 rgba(255,255,255,.28),inset 0 -2px 0 rgba(15,23,42,.20),inset -1px 0 0 rgba(15,23,42,.12),0 2px 0 rgba(15,23,42,.34),0 4px 6px rgba(15,23,42,.20)!important;transition:transform .09s ease,box-shadow .09s ease,filter .09s ease;-webkit-tap-highlight-color:transparent;font-weight:700!important}.vc-bk{text-shadow:0 1px 1px rgba(0,0,0,.38)}.vc-bk.vc-bk-k{text-shadow:0 1px 0 rgba(255,255,255,.85),0 2px 2px rgba(15,23,42,.16)}.vc-bk.vc-dn{text-shadow:0 1px 1px rgba(15,23,42,.22)!important}.vc-bk.vc-bk-k:not(.on):not(.active):not(.sel):not(.selected):not(.is-active):not([aria-selected=true]):not([aria-pressed=true]),.vc-bk.vc-bk-k:not(.on):not(.active):not(.sel):not(.selected):not(.is-active):not([aria-selected=true]):not([aria-pressed=true]) *{color:#14233a!important}'+
  '.vc-bk.vc-bk-r0{border-radius:5px 3px 6px 2px/3px 6px 2px 5px!important}.vc-bk.vc-bk-r1{border-radius:3px 7px 3px 5px/6px 3px 5px 2px!important}.vc-bk.vc-bk-r2{border-radius:7px 4px 2px 6px/4px 2px 6px 3px!important}.vc-bk.vc-bk-r3{border-radius:2px 5px 8px 3px/5px 3px 4px 8px!important}'+
  '.vc-bk.vc-bk-t{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2796%27 height=%2796%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.035 .05%27 numOctaves=%272%27 seed=%277%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .08 0 0 0 0 .1 0 0 0 0 .16 0 0 0 -1.5 .98%27/%3E%3C/filter%3E%3Cfilter id=%27m%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.03 .045%27 numOctaves=%272%27 seed=%2723%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.5 .95%27/%3E%3C/filter%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23n)%27 opacity=%27.14%27/%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23m)%27 opacity=%27.17%27/%3E%3C/svg%3E\"),linear-gradient(180deg,rgba(255,255,255,.26),rgba(255,255,255,0) 45%,rgba(15,23,42,.10))!important;background-size:100% 100%,100% 100%,96px 96px,100% 100%!important}'+
  '.vc-bk.vc-bk-t.vc-bk-n:not(.vc-hov){background-color:var(--vc-bkbg,#e4e9ef)!important}'+
  '.vc-bk.vc-bk-c{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2796%27 height=%2796%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.035 .05%27 numOctaves=%272%27 seed=%277%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .08 0 0 0 0 .1 0 0 0 0 .16 0 0 0 -1.5 .98%27/%3E%3C/filter%3E%3Cfilter id=%27m%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.03 .045%27 numOctaves=%272%27 seed=%2723%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.5 .95%27/%3E%3C/filter%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23n)%27 opacity=%27.14%27/%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23m)%27 opacity=%27.17%27/%3E%3C/svg%3E\"),linear-gradient(180deg,rgba(255,255,255,.50),rgba(226,232,240,.34) 55%,rgba(148,163,184,.30))!important;background-size:100% 100%,100% 100%,96px 96px,100% 100%!important}'+
  '.vc-bk.vc-hov{filter:brightness(1.05) saturate(1.06)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.75),inset 1px 0 0 rgba(255,255,255,.3),inset 0 -2px 0 rgba(15,23,42,.20),inset -1px 0 0 rgba(15,23,42,.12),0 3px 0 rgba(15,23,42,.34),0 6px 9px rgba(15,23,42,.24)!important}'+
  '.vc-bk.vc-hov.vc-bk-t{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),linear-gradient(180deg,rgba(255,255,255,.26),rgba(129,140,248,.24))!important;background-size:100% 100%,100% 100%,100% 100%!important}'+
  '.vc-bk.vc-hov.vc-bk-c{background-image:radial-gradient(150% 95% at 30% -20%,rgba(255,255,255,.50),rgba(255,255,255,.16) 45%,rgba(255,255,255,0) 70%),linear-gradient(165deg,rgba(255,255,255,0) 48%,rgba(255,255,255,.20) 68%,rgba(255,255,255,0) 90%),url(\"data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2796%27 height=%2796%27%3E%3Cfilter id=%27n%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.035 .05%27 numOctaves=%272%27 seed=%277%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 .08 0 0 0 0 .1 0 0 0 0 .16 0 0 0 -1.5 .98%27/%3E%3C/filter%3E%3Cfilter id=%27m%27 x=%270%27 y=%270%27 width=%27100%25%27 height=%27100%25%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%27.03 .045%27 numOctaves=%272%27 seed=%2723%27 stitchTiles=%27stitch%27/%3E%3CfeColorMatrix values=%270 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 -1.5 .95%27/%3E%3C/filter%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23n)%27 opacity=%27.14%27/%3E%3Crect width=%2796%27 height=%2796%27 filter=%27url(%23m)%27 opacity=%27.17%27/%3E%3C/svg%3E\"),linear-gradient(180deg,rgba(255,255,255,.62),rgba(199,210,254,.36) 55%,rgba(129,140,248,.26))!important}'+
  '.vc-bk.vc-dn{filter:brightness(.93)!important;box-shadow:inset 0 2px 5px rgba(15,23,42,.38),inset 0 -1px 0 rgba(255,255,255,.35),0 0 0 rgba(15,23,42,0)!important}.vc-bk.vc-dn.vc-dt{transform:translateY(2px)}'+
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
 var SIDE=(/^\/(psjerp|psjhr|psjgas)\//i.test(location.pathname)?',aside,#rail,.rail,.sidebar,#ga-sidebar,.mobile-nav,#drawer':'')+',#kn-box,.pkn-box,.kn-db';   /* v2.22 Paul 11/25：大字卡（重點卡）內不套金屬／石頭卡片，免得深底配深字看不到 */
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
 /* v2.18（2026-11-25 Paul：卡片底色要比背景稍深一點）：
    卡片跟它後面的底色差不多、或比底色還亮（例如白卡片放在淺灰／淺綠的頁面上）→ 卡片底色改成「後面底色再深 4.5%」，透明度照舊。
    只動接近中性色的卡片；後面是深色的就再深一點（字本來就是淺色）；卡片本來就明顯比後面亮或暗（例：深色面板上的亮按鈕）不動。
    換主題／換顏色時（頁面底色變了）自動重算；原本的底色有記下來，可以還原。 */
 function behind(e){for(var p=e.parentElement,i=0;p&&p!==document.documentElement&&i<40;p=p.parentElement,i++){var g=bgOf(p);if(g)return g}return pageBg()}
 function deepen(e,cs){try{if(e.closest('.gip-top,#vmPanel,#vpPanel,#vmBox'))return;cs=cs||W.getComputedStyle(e);
   var img=cs.backgroundImage;if(img&&img!=='none'&&!/^linear-gradient\(150deg, rgba\(255, 255, 255/.test(img)&&!e.classList.contains('vc3-g'))return;   /* 有自己的圖片／漸層 → 不動 */
   var c=rgb(e.__vcdp?e.__vcdp[2]:cs.backgroundColor);if(!c||c[3]<0.4)return;var b=behind(e),ce=c[3]<1?mix(b,c,c[3]):c;
   var sat=Math.max(ce[0],ce[1],ce[2])-Math.min(ce[0],ce[1],ce[2]);if(sat>48)return;
   var Lb=lum(b),d=lum(ce)-Lb;if(d< -0.035||d>0.16||(Lb>=0.4&&Lb<0.5))return;
   var inv=H.classList.contains('vp-dark');   /* 調色盤深色＝整頁反相：算的時候要反過來，畫出來才會是「比較深」 */
   var t=inv?(Lb>=0.5?mix(b,[255,255,255],0.06):mix(b,[255,255,255],0.12)):(Lb>=0.5?mix(b,[0,0,0],0.045):mix(b,[0,0,0],0.22));
   if(!e.__vcdp)e.__vcdp=[e.style.getPropertyValue('background-color'),e.style.getPropertyPriority('background-color'),cs.backgroundColor];
   var a=c[3];if(e.hasAttribute('data-vpg')){var mm=(e.style.getPropertyValue('background-color').replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g)||[]);if(mm.length>3)a=+mm[3]}
   e.style.setProperty('background-color','rgba('+t[0]+','+t[1]+','+t[2]+','+a+')','important');e.classList.add('vc3-dp')}catch(_){}}
 var dpSig='';function deepSig(){var p=pageBg();return p.join(',')+'|'+H.className.replace(/\bvc-\S+/g,'')+'|'+(H.getAttribute('data-theme')||'')+'|'+(document.body?document.body.className:'')}
 function deepAll(){var sg=deepSig();if(sg===dpSig)return;dpSig=sg;[].forEach.call(document.querySelectorAll('.vc3-dp'),function(e){var o=e.__vcdp;if(o){if(o[0])e.style.setProperty('background-color',o[0],o[1]);else e.style.removeProperty('background-color');e.__vcdp=null}e.classList.remove('vc3-dp');deepen(e)})}
 function tag(e,cs,w,hh){var c=rgb(cs.backgroundColor),hasImg=cs.backgroundImage!=='none';
    var dk=c&&c[3]>=0.4?lum(c)<0.42:(function(){var g=bgOf(e);return g?lum(g)<0.42:false})();
    e.classList.add('vc3');if(!hasImg)e.classList.add('vc3-g');if(dk)e.classList.add('vc3-d');
    if(parseFloat(cs.borderLeftWidth)>=3||parseFloat(cs.borderTopWidth)>=3||parseFloat(cs.borderBottomWidth)>=3||parseFloat(cs.borderRightWidth)>=3)e.classList.add('vc3-a');
    if(hh<=340&&w<=760&&!e.querySelector('input,select,textarea,table,iframe,video,canvas')&&!/^(TABLE|TR|TD|FORM|BODY|MAIN|SECTION)$/.test(e.tagName))e.classList.add('vc3-p');deepen(e,cs)}
 function cardsRun(){try{vars();inkCards();
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
    if(hh<=340&&w<=760&&!e.querySelector('input,select,textarea,table,iframe,video,canvas')&&!/^(TABLE|TR|TD|FORM|BODY|MAIN|SECTION)$/.test(e.tagName))e.classList.add('vc3-p');deepen(e,cs)}
   generic();heads()}catch(_){}}
 function cards(){if(ct)return;ct=setTimeout(function(){ct=0;cardsRun()},70)}
 /* v2.17（2026-11-25 Paul：卡片會閃）：平台重畫（換分頁、雲端資料載入）時，新卡片先以「平面」畫出來，70ms 後才加上立體樣式 → 每次重畫都閃一下。
    改成：有新元素加進來就在同一個畫面更新前（MutationObserver 回呼裡）直接套上；短時間內連續很多次才退回原本的 70ms 節流。 */
 var syncN=0,syncAt=0;function cardsMO(ms){var add=false;for(var q=0;q<ms.length&&!add;q++){var an=ms[q].addedNodes;for(var r=0;r<an.length;r++)if(an[r].nodeType===1){add=true;break}}
  var inKn=true;for(var z=0;z<ms.length;z++){var tz=ms[z].target;if(!(tz&&tz.closest&&tz.closest('#kn-box,.pkn-box,#kn-mask,.kn-db'))){inKn=false;break}}if(inKn)return;   /* v2.22 大字卡裡的變動不重跑 */
  if(add){var now=Date.now();if(now-syncAt>250){syncAt=now;syncN=0}if(++syncN<=4){clearTimeout(ct);ct=0;cardsRun();return}}cards()}
 function start(){try{var s=document.createElement('style');s.id='vrt-card3d-css';s.textContent=CSS;(document.head||H).appendChild(s)}catch(_){}
  cards();chart3d();dpSig=deepSig();setInterval(function(){if(!document.hidden){H.__vcK='';cards();chart3d();deepAll()}},3000);
  try{new MutationObserver(cardsMO).observe(H,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style','hidden','open','data-tint','data-theme']})}catch(_){}
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
  /* v2.17（2026-11-25 Paul：首頁／分頁的卡片會閃）：手指一碰卡片就馬上「按下去＋亮起來」，結果只是要往下滑也每張卡閃一下。
     手機改成：手指停在卡片上 120ms、沒有移動才顯示按下效果；一開始滑動（移動超過 8px、捲動、pointercancel）就取消，也不再亮 0.5 秒。滑鼠照舊。 */
  var tdn=null;function tcancel(){if(tdn){clearTimeout(tdn.t);tdn=null}}
  document.addEventListener('pointerdown',function(e){var t=clk(e.target);if(!t)return;mark(t);if(dnEl&&dnEl!==t)dnEl.classList.remove('vc-dn');
    if(e.pointerType==='touch'){tcancel();tdn={el:t,x:e.clientX,y:e.clientY,t:setTimeout(function(){tdn=null;dnEl=t;t.classList.add('vc-dn')},120)};return}
    dnEl=t;t.classList.add('vc-dn')},{passive:true});
  document.addEventListener('pointermove',function(e){if(tdn&&(Math.abs(e.clientX-tdn.x)>8||Math.abs(e.clientY-tdn.y)>8))tcancel()},{passive:true});
  document.addEventListener('pointerup',function(){if(!tdn)return;var t=tdn.el;tcancel();dnEl=t;t.classList.add('vc-dn');up()},{passive:true,capture:true});   /* 很快點一下：放開時才閃一下按下效果 */
  document.addEventListener('pointercancel',tcancel,{passive:true});
  document.addEventListener('scroll',tcancel,{passive:true,capture:true});
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
 function nat(){try{var bs=getComputedStyle(document.body),m=(bs.backgroundImage.match(/rgba?\([^)]+\)/g)||[bs.backgroundColor]).pop().replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g);if(!m||m.length<3||(m.length>3&&+m[3]===0))return false;return (0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255<0.4}catch(e){return false}}
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
 function ink(){try{var on=H.classList.contains('vp-tone'),inv=H.classList.contains('vp-inv');function lm(c){var m=String(c).replace(/^\s*color\(srgb[^)]*\)/i,window.__vcs).match(/[\d.]+/g);return m&&m.length>=3&&(m.length<4||+m[3]>.6)?(0.2126*m[0]+0.7152*m[1]+0.0722*m[2])/255:null}
  [].forEach.call(document.querySelectorAll('button,[role=tab],a.btn,.btn,.tab,.tab-btn,.vt-w'),function(e){var w=false;if(on&&!inv&&e.offsetParent){var cs=getComputedStyle(e),b=lm(cs.backgroundColor);if(b==null&&/gradient/.test(cs.backgroundImage)){var gm=cs.backgroundImage.match(/rgba?\([^)]+\)/g)||[],gl=gm.map(lm).filter(function(x){return x!=null});if(gl.length&&gl.length>=gm.length-1)b=gl.reduce(function(a,x){return a+x},0)/gl.length}if(b!=null&&b<.42){w=e.classList.contains('vt-w')||(lm(cs.color)||0)<.55}}if(w!==e.classList.contains('vt-w'))e.classList.toggle('vt-w',w)})}catch(e){}}
 var tm=0;function later(){clearTimeout(tm);tm=setTimeout(run,120)}
 try{new MutationObserver(later).observe(H,{attributes:true,attributeFilter:['class','style']})}catch(e){}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',later);else later();
 setInterval(function(){if(!document.hidden){run();ink()}},3000);
 document.addEventListener('click',function(){setTimeout(ink,180)},true);
}catch(e){}})();

/* v2.15 手機轉向（2026-11-23 Paul）：不管手機怎麼轉，頁面永遠是直立的版面。
   · 轉不到 45 度：頁面跟著稍微歪一點（約 3 度），再擺正。
   · 超過 45 度：歪多一點（約 6 度），再擺正。
   · 轉到 90 度以上（手機變橫的）：歪更多（約 10 度）再擺正，而且頁面維持直立的樣子（跟著手機轉回去），不會變成橫版。
   做法：用手機的重力感應算出轉了幾度；變橫的時候把整頁轉回直立（寬高用畫面的長邊／短邊算，轉完之後每 0.3 秒再對一次，連續 3 秒）。
   只在手機（觸控、小螢幕）的最外層頁面做；平板、電腦、內嵌的分頁都不動。 */
(function(){try{
 if(window.top!==window||window.__VRT_UPRIGHT)return;window.__VRT_UPRIGHT=1;
 var mq=window.matchMedia&&matchMedia('(pointer:coarse)');if(!mq||!mq.matches)return;
 if(Math.min(screen.width,screen.height)>=600)return;
 var cur=0,st=null,roll=0,band=0,lastAnim=0,poll=0;
 function rawAng(){var a=(screen.orientation&&typeof screen.orientation.angle==='number')?screen.orientation.angle:(typeof window.orientation==='number'?window.orientation:0);return ((a%360)+360)%360}
 function isLand(){var a=rawAng();if(a===90||a===270)return true;
  /* 有些內建瀏覽器（例如 Telegram 裡開的）角度一直回報 0：改看畫面是不是變成橫的 */
  var sw=screen.width,sh=screen.height;return sw>sh&&innerWidth>innerHeight}
 function ang(){if(!isLand())return 0;var a=rawAng();if(a===90||a===270)return a;return roll<0?270:90}
 function dims(){var w=innerWidth||document.documentElement.clientWidth,h=innerHeight||document.documentElement.clientHeight;return {L:Math.max(w,h),S:Math.min(w,h)}}
 function css(){if(st)return;st=document.createElement('style');st.id='vrtUpright';st.textContent=
  'html.vr-up,html.vr-up body{overflow:hidden!important;height:100%!important}'+
  'html.vr-up body{position:fixed!important;top:0!important;left:0!important;right:auto!important;bottom:auto!important;margin:0!important;max-width:none!important;min-height:0!important;overflow-x:hidden!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch;transform-origin:0 0!important}';
  document.head.appendChild(st)}
 function base(a){var z=dims();return a===90?'translateY('+z.S+'px) rotate(-90deg)':'translateX('+z.L+'px) rotate(90deg)'}
 function fit(a){var b=document.body,z=dims();b.style.setProperty('width',z.S+'px','important');b.style.setProperty('height',z.L+'px','important');b.style.setProperty('transform',base(a),'important')}
 function tilt(deg){return;/* v2.17 Paul：太敏感、一動就斜跟閃 → 不再歪一下，只保持直立 */var b=document.body;if(!b||!b.animate)return;var now=Date.now();if(now-lastAnim<700)return;lastAnim=now;var t=b.style.transform||'';
  try{b.animate([{transform:t+' rotate(0deg)'},{transform:t+' rotate('+deg+'deg)',offset:.35},{transform:t+' rotate('+(-deg*.25).toFixed(2)+'deg)',offset:.75},{transform:t+' rotate(0deg)'}],{duration:Math.abs(deg)>8?1000:800,easing:'cubic-bezier(.3,.7,.3,1)'})}catch(_){}}
 function set(){var a=ang(),b=document.body;if(!b)return;
  if(a===cur){if(a)fit(a);return}
  var top=a?window.scrollY:(b.scrollTop||0),was=cur;cur=a;
  if(a){css();document.documentElement.classList.add('vr-up');fit(a);b.scrollTop=top}
  else{document.documentElement.classList.remove('vr-up');['width','height','transform'].forEach(function(p){b.style.removeProperty(p)});window.scrollTo(0,top)}
  /* 轉到 90 度：歪 10 度再擺正（往手機轉的方向） */
  tilt((a===90||(a===0&&was===270))?-10:10);
  clearInterval(poll);var n=0;poll=setInterval(function(){if(++n>10)clearInterval(poll);if(cur)fit(cur)},300)}
 /* 重力感應：算手機往左／右歪了幾度，跨過 45 度那一下讓頁面歪一下再擺正 */
 function onMotion(e){var g=e.accelerationIncludingGravity;if(!g||g.x==null||g.y==null)return;var x=g.x,y=g.y;if(Math.abs(x)+Math.abs(y)<4)return;   /* 平放在桌上：不算 */
  var r=Math.atan2(x,y)*180/Math.PI;roll=r;var ar=Math.abs(r),nb=ar<20?0:ar<45?1:ar<80?2:3;
  band=nb;/* v2.17：只記方向（判斷轉橫時往哪邊），不再讓頁面歪 */}
 window.addEventListener('devicemotion',onMotion,{passive:true});
 var tm;function later(){clearTimeout(tm);tm=setTimeout(set,100)}
 if(screen.orientation&&screen.orientation.addEventListener)screen.orientation.addEventListener('change',later);
 window.addEventListener('orientationchange',later);window.addEventListener('resize',later);
 if(window.visualViewport)visualViewport.addEventListener('resize',later);
 setInterval(function(){if(!document.hidden&&ang()!==cur)set()},1500);
 try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('portrait').catch(function(){})}catch(_){}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',set);else set();
}catch(_){}})();
