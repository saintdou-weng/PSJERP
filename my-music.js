/* 🎧 我的音樂 My music v1（2026-11-25 Paul：手機裡的特別音樂檔（.dsf）也要能在平台播放，只給自己用）
   · 歌只存在「這台裝置」的瀏覽器裡（IndexedDB），不上傳、不寫進公開程式，別人打開平台看不到也聽不到
   · 一般格式（mp3／flac／m4a／aac／wav／ogg／opus）直接存、直接播
   · .dsf（DSD 高解析）瀏覽器不會播 → 匯入時在這台裝置上轉成 44.1kHz／16-bit WAV 再存（只轉一次）
   · 鎖屏／通知列有播放鍵（Media Session）；可以隨機、上一首、下一首、刪除
   由 music.js 的「🎧 我的音樂」叫用：window.VRTMyMusic.open()／play(vol)／stop()／vol(v) */
(function(){
  'use strict';
  if(window.VRTMyMusic)return;
  var DBN='vrt_mymusic',ST='tracks',db=null;
  function idb(){return db?Promise.resolve(db):new Promise(function(ok,no){var r=indexedDB.open(DBN,1);r.onupgradeneeded=function(){r.result.createObjectStore(ST,{keyPath:'id'});};r.onsuccess=function(){db=r.result;ok(db);};r.onerror=function(){no(r.error);};});}
  function tx(mode,fn){return idb().then(function(d){return new Promise(function(ok,no){var t=d.transaction(ST,mode),s=t.objectStore(ST),res=fn(s);t.oncomplete=function(){ok(res&&res.result!==undefined?res.result:res);};t.onerror=function(){no(t.error);};t.onabort=function(){no(t.error);};});});}
  function all(){return tx('readonly',function(s){return s.getAll();}).then(function(a){return (a||[]).sort(function(x,y){return (x.album||'').localeCompare(y.album||'')||(x.no||0)-(y.no||0)||x.name.localeCompare(y.name);});});}
  /* v3（2026-11-26）：清單只讀「目錄」，不再每次把整首歌（每首約 50MB）全部讀進來 → 換頁接著播不會卡 */
  var IDX='vrt_mymusic_idx';
  function mOf(t){return {id:t.id,name:t.name,album:t.album,no:t.no,size:t.size,src:t.src,dur:t.dur,osz:t.osz||0,v16:t.v16||0};}
  function sortM(a){return a.sort(function(x,y){return (x.album||'').localeCompare(y.album||'')||(x.no||0)-(y.no||0)||String(x.name).localeCompare(String(y.name));});}
  function idxGet(){try{var j=JSON.parse(localStorage.getItem(IDX)||'null');return Array.isArray(j)?j:null;}catch(e){return null;}}
  function idxSet(a){try{localStorage.setItem(IDX,JSON.stringify(a));}catch(e){}}
  function rebuild(){return idb().then(function(d){return new Promise(function(ok){var out=[];try{var c=d.transaction(ST,'readonly').objectStore(ST).openCursor();c.onsuccess=function(){var cu=c.result;if(cu){out.push(mOf(cu.value));cu.continue();}else{idxSet(out);ok(out);}};c.onerror=function(){ok(out);};}catch(e){ok(out);}});});}
  function meta(){var a=idxGet();return (a?Promise.resolve(a):rebuild()).then(function(x){return sortM(x.slice());});}
  function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function mb(n){return (n/1048576).toFixed(n>104857600?0:1)+' MB';}
  function tm(s){s=Math.max(0,Math.round(s||0));return Math.floor(s/60)+':'+('0'+s%60).slice(-2);}

  /* ---------- DSF → PCM（兩段降頻：查表 FIR ÷16 到 176.4k，再 FIR ÷4 到 44.1k）---------- */
  function DSFCORE(){
    function design(n,fc){var h=new Float64Array(n),m=(n-1)/2,s=0;for(var i=0;i<n;i++){var x=i-m,w=.42-.5*Math.cos(2*Math.PI*i/(n-1))+.08*Math.cos(4*Math.PI*i/(n-1));h[i]=(x===0?2*fc:Math.sin(2*Math.PI*fc*x)/(Math.PI*x))*w;s+=h[i];}for(i=0;i<n;i++)h[i]/=s;return h;}
    function u32(v,o){return v.getUint32(o,true);}
    function u64(v,o){return v.getUint32(o,true)+v.getUint32(o+4,true)*4294967296;}
    function header(buf){var v=new DataView(buf);if(String.fromCharCode(v.getUint8(0),v.getUint8(1),v.getUint8(2),v.getUint8(3))!=='DSD ')throw new Error('不是 DSF 檔');
      var o=u64(v,4);if(String.fromCharCode(v.getUint8(o),v.getUint8(o+1),v.getUint8(o+2),v.getUint8(o+3))!=='fmt ')throw new Error('DSF 格式不對');
      var h={ch:u32(v,o+24),fs:u32(v,o+28),bits:u32(v,o+32),n:u64(v,o+36),blk:u32(v,o+44)};o+=u64(v,o+4);
      if(String.fromCharCode(v.getUint8(o),v.getUint8(o+1),v.getUint8(o+2),v.getUint8(o+3))!=='data')throw new Error('DSF 找不到音訊');
      h.data=o+12;h.dlen=u64(v,o+4)-12;h.meta=u64(v,20);return h;}
    /* 用法：decode(readChunk(off,len)→Promise<ArrayBuffer>, size, progress) → {rate,ch,pcm:Int16Array[]（交錯）} */
    function decode(read,size,prog){
      return read(0,Math.min(size,4096)).then(function(hb){var h=header(hb);if(h.bits!==1&&h.bits!==8)throw new Error('DSF 位元格式不支援');if(h.ch<1||h.ch>2)throw new Error('只支援單聲道／立體聲');
        var D1=16,N1=256,NB=N1/8,STEP=D1/8,D2=Math.round(h.fs/D1/44100),r1=h.fs/D1,out=h.fs/D1/D2;
        if(!(D2>=1&&D2<=16))throw new Error('DSF 取樣率不支援：'+h.fs);
        var c1=design(N1,24000/h.fs*1.6),N2=Math.max(32,Math.round(5.5*r1/4100)|1),c2=design(N2,20500/r1);
        /* 查表：每個位元組位置 p、每個值 b → 該 8 個 tap 的 ±1 加權和；DSF 位元 LSB 先（bits=1），MSB 先（bits=8） */
        var LUT=new Float32Array(NB*256);for(var p=0;p<NB;p++)for(var b=0;b<256;b++){var s=0;for(var k=0;k<8;k++){var bit=h.bits===1?(b>>k)&1:(b>>(7-k))&1;s+=(bit?1:-1)*c1[p*8+k];}LUT[p*256+b]=s;}
        var C2=new Float32Array(c2),ch=h.ch,blk=h.blk,total=Math.floor(h.n/(D1*D2)),pcm=new Int16Array(total*ch),wi=new Array(ch).fill(0);
        var hist=[],mid=[],mpos=[],ph=[];for(var c=0;c<ch;c++){hist.push(new Uint8Array(NB+blk).fill(0x69));mid.push(new Float32Array(N2+8192));mpos.push(0);ph.push(0);}
        var group=blk*ch,per=group*64,off=0,len=Math.min(h.dlen,Math.floor(h.n/8/blk+1)*group),done=0;
        function feed(c,bytes){var H=hist[c],M=mid[c],m=mpos[c];H.copyWithin(0,blk,blk+NB);H.set(bytes,NB);
          for(var i=STEP;i<=blk;i+=STEP){var acc=0,base=i;for(var q=0;q<NB;q++)acc+=LUT[q*256+H[base+q]];M[m++]=acc;
            if(m>=N2){if(++ph[c]>=D2){ph[c]=0;var w=wi[c];if(w<total){var s=0;for(var t=0;t<N2;t++)s+=M[m-N2+t]*C2[t];s*=1.0;pcm[w*ch+c]=s>1?32767:s<-1?-32768:Math.round(s*32767);wi[c]=w+1;}}
              if(m>=M.length){M.copyWithin(0,m-N2+1,m);m=N2-1;}}}
          mpos[c]=m;}
        function step(){if(off>=len||wi[0]>=total)return Promise.resolve({rate:out,ch:ch,pcm:pcm,n:Math.min.apply(null,wi)});
          var n=Math.min(per,len-off);return read(h.data+off,n).then(function(ab){var u=new Uint8Array(ab);for(var g=0;g+group<=u.length;g+=group)for(var c=0;c<ch;c++)feed(c,u.subarray(g+c*blk,g+c*blk+blk));off+=n;if(prog)prog(Math.min(1,off/len));return step();});}
        return step();});}
    return {decode:decode,header:header};
  }
  function wav(r){var n=r.n*r.ch,b=new ArrayBuffer(44),v=new DataView(b),w=function(o,s){for(var i=0;i<4;i++)v.setUint8(o+i,s.charCodeAt(i));};
    w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,r.ch,true);v.setUint32(24,r.rate,true);v.setUint32(28,r.rate*r.ch*2,true);v.setUint16(32,r.ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
    return new Blob([b,r.pcm.subarray(0,n)],{type:'audio/wav'});}
  /* 有 Worker 就在背景轉，沒有（例如網頁安全設定擋掉）就在畫面上分段轉 */
  function decodeDSF(file,prog){
    var src='('+DSFCORE.toString()+')';
    try{var wk=new Worker(URL.createObjectURL(new Blob(['var C='+src+'();onmessage=function(e){var f=e.data;C.decode(function(o,l){return f.slice(o,o+l).arrayBuffer();},f.size,function(p){postMessage({p:p});}).then(function(r){postMessage({r:r},[r.pcm.buffer]);},function(er){postMessage({e:String(er&&er.message||er)});});};'],{type:'text/javascript'})));
      return new Promise(function(ok,no){var t=setTimeout(function(){},0);wk.onmessage=function(e){var d=e.data;if(d.p!=null){prog&&prog(d.p);return;}wk.terminate();if(d.e)no(new Error(d.e));else ok(d.r);};wk.onerror=function(er){wk.terminate();er.preventDefault&&er.preventDefault();mainThread().then(ok,no);};wk.postMessage(file);});
    }catch(e){return mainThread();}
    function mainThread(){var C=DSFCORE();return C.decode(function(o,l){return new Promise(function(ok){setTimeout(function(){file.slice(o,o+l).arrayBuffer().then(ok);},0);});},file.size,prog);}
  }
  window.__vrtDSF=DSFCORE;window.__vrtWav=wav;
  /* v5（2026-11-26 Paul：WAV 加得進來卻播不了）：手機的瀏覽器對某些 WAV（24-bit、32-bit、浮點、特殊表頭、超大檔 RF64…）會讀不出來
     → 匯入時自己把 WAV 轉成最通用的 16-bit WAV（取樣率不變）；自己讀不懂的，再請瀏覽器解碼一次；都不行才原樣存 */
  function wavNorm(ab){var v=new DataView(ab),id=function(o){return String.fromCharCode(v.getUint8(o),v.getUint8(o+1),v.getUint8(o+2),v.getUint8(o+3));};
    var riff=id(0);if((riff!=='RIFF'&&riff!=='RF64')||id(8)!=='WAVE')return null;var o=12,fmt=null,dOff=-1,dLen=0,ds64=0;
    while(o+8<=ab.byteLength){var cid=id(o),sz=v.getUint32(o+4,true);
      if(cid==='ds64'){ds64=v.getUint32(o+16,true)+v.getUint32(o+20,true)*4294967296;}
      if(cid==='fmt '){var tag=v.getUint16(o+8,true);if(tag===0xFFFE&&sz>=26)tag=v.getUint16(o+32,true);fmt={tag:tag,ch:v.getUint16(o+10,true),rate:v.getUint32(o+12,true),ba:v.getUint16(o+20,true),bits:v.getUint16(o+22,true)};}
      if(cid==='data'){dOff=o+8;dLen=(sz===0xFFFFFFFF&&ds64)?ds64:sz;if(dOff+dLen>ab.byteLength||sz===0)dLen=ab.byteLength-dOff;break;}
      o+=8+sz+(sz&1);}
    if(!fmt||dOff<0||!fmt.ch||!fmt.rate)return null;var B=fmt.bits/8,ba=fmt.ba||B*fmt.ch;if(!(fmt.tag===1&&(B===1||B===2||B===3||B===4))&&!(fmt.tag===3&&(B===4||B===8)))return null;
    var oc=Math.min(2,fmt.ch),n=Math.floor(dLen/ba),out=new Int16Array(n*oc),u8=new Uint8Array(ab);
    for(var i=0;i<n;i++){var base=dOff+i*ba;for(var c=0;c<oc;c++){var q=base+c*B,x;
      if(fmt.tag===3){x=B===4?v.getFloat32(q,true):v.getFloat64(q,true);x=x>1?32767:x<-1?-32768:Math.round(x*32767);}
      else if(B===2)x=v.getInt16(q,true);else if(B===3)x=(u8[q+2]<<24|u8[q+1]<<16)>>16;else if(B===4)x=v.getInt32(q,true)>>16;else x=(u8[q]-128)<<8;
      out[i*oc+c]=x;}}
    return {rate:fmt.rate,ch:oc,pcm:out,n:n,same:fmt.tag===1&&B===2&&fmt.ch<=2&&riff==='RIFF'};}
  function viaBrowser(ab){var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return Promise.reject(new Error('no decoder'));var ac=new AC();
    return new Promise(function(ok,no){try{var p=ac.decodeAudioData(ab.slice(0),ok,no);if(p&&p.then)p.then(ok,no);}catch(e){no(e);}}).then(function(bf){var oc=Math.min(2,bf.numberOfChannels),n=bf.length,out=new Int16Array(n*oc);for(var c=0;c<oc;c++){var d=bf.getChannelData(c);for(var i=0;i<n;i++){var x=d[i];out[i*oc+c]=x>1?32767:x<-1?-32768:Math.round(x*32767);}}try{ac.close();}catch(e){}return {rate:bf.sampleRate,ch:oc,pcm:out,n:n};},function(e){try{ac.close();}catch(_){}throw e;});}
  function fixWav(blob){return blob.arrayBuffer().then(function(ab){var r=null;try{r=wavNorm(ab);}catch(e){r=null;}if(r)return {blob:wav(r),dur:r.n/r.rate};return viaBrowser(ab).then(function(r2){return {blob:wav(r2),dur:r2.n/r2.rate};});});}


  /* ---------- 匯入 ---------- */
  var OK_RE=/\.(mp3|flac|m4a|aac|wav|ogg|oga|opus|webm|mp4|dsf)$/i;
  function parseName(f){var n=f.name.replace(/\.[^.]+$/,''),no=0,m=n.match(/^(\d{1,3})[\s._-]+(.*)$/);if(m){no=+m[1];n=m[2];}var album=(f.webkitRelativePath||'').split('/').slice(-2,-1)[0]||'';return {name:n.trim()||f.name,no:no,album:album};}
  function durOf(blob){return new Promise(function(ok){var a=new Audio(),u=URL.createObjectURL(blob),done=function(v){URL.revokeObjectURL(u);ok(v||0);};a.preload='metadata';a.onloadedmetadata=function(){done(isFinite(a.duration)?a.duration:0);};a.onerror=function(){done(0);};setTimeout(function(){done(0);},8000);a.src=u;});}
  function importFiles(files,ui){files=[].filter.call(files,function(f){return OK_RE.test(f.name);});if(!files.length){ui('沒有可以播的音樂檔（mp3／flac／m4a／wav／ogg／dsf）');return Promise.resolve(0);}
    try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist();}catch(e){}
    var i=0,n=0,skip=0;function nx(){if(i>=files.length){ui('✅ 加入 '+n+' 首'+(skip?'（'+skip+' 首已經有了，沒有重複加）':''));return Promise.resolve(n);}var f=files[i++],P=parseName(f),tag='（'+i+'/'+files.length+'）'+P.name;var dup=(idxGet()||[]).some(function(z){return z.name===P.name&&(z.osz===f.size||(!z.osz&&z.album===P.album));});if(dup){ui('⏭ 已經有了，跳過 '+tag);skip++;return nx();}
      var job=/\.wav$/i.test(f.name)?(ui('🔄 轉成手機能播的格式 '+tag),fixWav(f).then(function(x){return {blob:x.blob,dur:x.dur,src:'wav',v16:1};},function(){return f.arrayBuffer().then(function(ab){var b=new Blob([ab],{type:'audio/wav'});return durOf(b).then(function(d){return {blob:b,dur:d,src:'wav'};});});})):/\.dsf$/i.test(f.name)?(ui('🔄 轉檔中 '+tag+' 0%'),decodeDSF(f,function(p){ui('🔄 轉檔中 '+tag+' '+Math.round(p*100)+'%');}).then(function(r){return {blob:wav(r),dur:r.n/r.rate,src:'dsf'};})):(ui('📥 加入中 '+tag),f.arrayBuffer().then(function(ab){var b=new Blob([ab],{type:f.type||'audio/'+((f.name.split('.').pop()||'').toLowerCase())});return durOf(b).then(function(d){return {blob:b,dur:d,src:(f.name.split('.').pop()||'').toLowerCase()};});})/* v4：把檔案內容真的複製進來；只存「檔案位置」的話，過一陣子手機會收回權限，歌就播不了 */);
      return job.then(function(x){var t={id:'t'+Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:P.name,no:P.no,album:P.album,src:x.src,dur:x.dur,size:x.blob.size,blob:x.blob,added:Date.now(),v16:x.v16||(x.src==='dsf'?1:0),osz:f.size};return tx('readwrite',function(s){s.put(t);}).then(function(){n++;var ix=idxGet()||[];ix=ix.filter(function(z){return z.id!==t.id;});ix.push(mOf(t));idxSet(ix);});}).catch(function(e){ui('⚠️ '+P.name+'：'+(e&&e.name==='QuotaExceededError'?'這台裝置空間不夠':(e&&e.message||e)));return new Promise(function(r){setTimeout(r,1500);});}).then(nx);}
    return nx();}

  /* ---------- 播放 ---------- */
  var A=null,url='',list=[],cur=-1,shuf=false,volume=.5,playing=false,box=null,lastSave=0,rep='all',sel=null;try{rep=localStorage.getItem('vrt_mymusic_rep')||'all';}catch(e){}
  function sig(){try{window.dispatchEvent(new CustomEvent('vrt-mymusic',{detail:{playing:playing}}));}catch(e){}}
  function ensureA(){if(A)return A;A=new Audio();A.preload='auto';A.addEventListener('ended',function(){if(rep==='one'){A.currentTime=0;tryPlay();return;}if(rep==='off'&&!shuf&&cur>=list.length-1){playing=false;draw();return;}next(1);});A.addEventListener('error',function(){if(cur>=0&&list[cur]){list[cur].bad=1;msg('⚠️ 「'+list[cur].name+'」播不了，請重新加入這首');draw();}});A.addEventListener('play',function(){playing=true;sig();draw();setTimeout(repairRest,3000);});A.addEventListener('pause',function(){playing=false;sig();draw();});A.addEventListener('timeupdate',function(){prog();var n=Date.now();if(n-lastSave>4000&&cur>=0&&list[cur]){lastSave=n;try{localStorage.setItem('vrt_mymusic_pos',JSON.stringify({id:list[cur].id,t:A.currentTime}));}catch(e){}}});return A;}
  var badRun=0;
  function load(i,at){return tx('readonly',function(s){return s.get(list[i].id);}).then(function(t){if(!t)return;return t.blob.slice(0,16).arrayBuffer().then(function(){badRun=0;if(t.src!=='wav'||t.v16)return t;msg('🔧 第一次播放，正在把「'+t.name+'」轉成手機能播的格式…');return fixWav(t.blob).then(function(x){t.blob=x.blob;t.dur=x.dur;t.size=x.blob.size;t.v16=1;return tx('readwrite',function(s2){s2.put(t);}).then(function(){var ix=idxGet()||[];ix=ix.map(function(z){return z.id===t.id?mOf(t):z;});idxSet(ix);list[i].dur=t.dur;list[i].size=t.size;list[i].bad=0;msg('✅ 「'+t.name+'」已修好');return t;});},function(){return t;});},function(){list[i].bad=1;badRun++;msg('⚠️ 「'+list[i].name+'」的檔案已經讀不到了（手機收回了檔案權限），請按「➕ 加入歌曲」重新加入這首');draw();if(badRun<list.length){setTimeout(function(){next(1);},400);}else{badRun=0;}return null;});}).then(function(t){if(!t)return;ensureA();if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(t.blob);cur=i;A.src=url;A.volume=Math.min(1,volume);if(at>0){var sk=function(){A.removeEventListener('loadedmetadata',sk);try{A.currentTime=at;}catch(e){}};A.addEventListener('loadedmetadata',sk);}
    try{if('mediaSession' in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:t.name,artist:t.album||'我的音樂',album:t.album||''});
      navigator.mediaSession.setActionHandler('previoustrack',function(){next(-1);});navigator.mediaSession.setActionHandler('nexttrack',function(){next(1);});navigator.mediaSession.setActionHandler('play',function(){tryPlay();});navigator.mediaSession.setActionHandler('pause',function(){want=false;A.pause();});}}catch(e){}
    tryPlay();draw();});}
  /* 換分頁＝換一頁，瀏覽器常常不准「沒按過畫面就出聲」→ 等手指碰一下畫面就接著播（跟電台一樣） */
  var waitG=false;function tryPlay(){if(!A)return;var p=A.play();if(p&&p.catch)p.catch(function(er){if(er&&er.name==='NotAllowedError'&&!waitG){waitG=true;var h=function(){document.removeEventListener('pointerdown',h,true);document.removeEventListener('keydown',h,true);waitG=false;if(A&&A.src)A.play().catch(function(){});};document.addEventListener('pointerdown',h,true);document.addEventListener('keydown',h,true);}});}
  function savePos(){try{if(A&&cur>=0&&list[cur])localStorage.setItem('vrt_mymusic_pos',JSON.stringify({id:list[cur].id,t:A.currentTime}));}catch(e){}}
  window.addEventListener('pagehide',savePos);document.addEventListener('visibilitychange',function(){if(document.hidden)savePos();});
  function next(d){if(!list.length)return;var i=shuf&&d>0?Math.floor(Math.random()*list.length):(cur+d+list.length)%list.length;load(i);}
  function refresh(){return meta().then(function(m){var id=cur>=0&&list[cur]?list[cur].id:'';list=m;cur=id?list.findIndex(function(x){return x.id===id;}):-1;return list;});}
  function play(v){want=true;if(v!=null)volume=v;return refresh().then(function(){if(!list.length){open();return false;}if(A&&A.src&&cur>=0){A.volume=Math.min(1,volume);tryPlay();}else{var sv=null;try{sv=JSON.parse(localStorage.getItem('vrt_mymusic_pos')||'null');}catch(e){}var si=sv?list.findIndex(function(x){return x.id===sv.id;}):-1;if(si>=0)load(si,sv.t||0);else load(shuf?Math.floor(Math.random()*list.length):0);}return true;});}
  function stop(){want=false;if(A)A.pause();}
  /* v7（2026-11-26 Paul：換分頁後還要進去重按播放）：Telegram 裡的網頁規定「要手指碰過才能出聲」。
     只要還在「要播」的狀態，畫面上任何一次點擊／觸碰都會順手把歌接著播（不用打開我的音樂）。 */
  var want=false;
  function kick(){if(want&&A&&A.src&&A.paused){try{A.play().catch(function(){});}catch(e){}}}
  ['pointerdown','pointerup','touchstart','touchend','click','keydown'].forEach(function(ev){document.addEventListener(ev,kick,true);});
  /* 剩下還沒轉好的 WAV 在背景一首一首先轉好，播到下一首就不用等（等太久會停） */
  var repairing=false;function repairRest(){if(repairing)return;var todo=list.filter(function(t){return t.src==='wav'&&!t.v16&&!t.bad;});if(!todo.length)return;repairing=true;var k=0;
    (function one(){if(k>=todo.length){repairing=false;msg('✅ 全部 '+todo.length+' 首都轉好了，可以連續播');return;}var m=todo[k++];if(cur>=0&&list[cur]&&list[cur].id===m.id)return setTimeout(one,50);
      msg('🔧 背景轉檔 '+k+'/'+todo.length+'：'+m.name);tx('readonly',function(s4){return s4.get(m.id);}).then(function(t){if(!t||t.v16)return;return fixWav(t.blob).then(function(x){t.blob=x.blob;t.dur=x.dur;t.size=x.blob.size;t.v16=1;return tx('readwrite',function(s5){s5.put(t);}).then(function(){idxSet((idxGet()||[]).map(function(z){return z.id===t.id?mOf(t):z;}));m.v16=1;m.dur=t.dur;m.size=t.size;draw();});});}).catch(function(){m.bad=1;}).then(function(){setTimeout(one,800);});})();}
  function prog(){if(!box||box.hidden)return;var b=box.querySelector('.mmPr i'),t=box.querySelector('.mmT');if(b&&A&&A.duration)b.style.width=(A.currentTime/A.duration*100)+'%';if(t&&A)t.textContent=tm(A.currentTime)+' / '+tm(A.duration);}

  /* ---------- 介面 ---------- */
  var css='#mmBox{position:fixed;inset:0;z-index:2147483600;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center;font-family:system-ui,-apple-system,"Noto Sans TC",sans-serif}#mmBox[hidden]{display:none}'
   +'#mmBox .mm{background:#fff;color:#0f172a;width:min(560px,100%);max-height:88vh;border-radius:18px 18px 0 0;display:flex;flex-direction:column;box-shadow:0 -10px 40px rgba(0,0,0,.3)}'
   +'#mmBox .mmH{display:flex;align-items:center;gap:8px;padding:12px 14px;border-bottom:1px solid #e2e8f0}#mmBox .mmH b{font-size:16px;flex:1}#mmBox button{font:inherit;border:1px solid #cbd5e1;background:#f8fafc;color:#0f172a;border-radius:10px;padding:7px 11px;cursor:pointer}#mmBox button.on{background:#4f46e5;color:#fff;border-color:#4f46e5}'
   +'#mmBox .mmNow{padding:10px 14px;border-bottom:1px solid #e2e8f0}#mmBox .mmNow .n{font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#mmBox .mmNow small{color:#64748b}#mmBox .mmPr{height:6px;background:#e2e8f0;border-radius:3px;margin:8px 0 4px;cursor:pointer}#mmBox .mmPr i{display:block;height:100%;width:0;background:#4f46e5;border-radius:3px}'
   +'#mmBox .mmC{display:flex;gap:8px;justify-content:center;margin-top:6px}#mmBox .mmC button{min-width:52px;font-size:18px}'
   +'#mmBox .mmL{overflow:auto;flex:1;padding:4px 0}#mmBox .mmR{display:flex;align-items:center;gap:10px;padding:9px 14px;border-bottom:1px solid #f1f5f9;cursor:pointer}#mmBox .mmR:hover{background:#f8fafc}#mmBox .mmR.cur{background:#eef2ff}#mmBox .mmR .t{flex:1;min-width:0}#mmBox .mmR .t div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600;font-size:14px}#mmBox .mmR small{color:#64748b;font-size:11.5px}#mmBox .mmR .x{border:0;background:none;color:#94a3b8;font-size:16px;padding:4px 8px}'
   +'#mmBox .mmA{padding:10px 14px;border-top:1px solid #e2e8f0;display:flex;flex-wrap:wrap;gap:8px;align-items:center}#mmBox .mmMsg{font-size:12.5px;color:#334155;flex-basis:100%}#mmBox .mmE{padding:26px 18px;text-align:center;color:#475569;line-height:1.7;font-size:14px}';
  function mount(){if(box)return box;var st=document.createElement('style');st.textContent=css;document.head.appendChild(st);box=document.createElement('div');box.id='mmBox';box.hidden=true;document.body.appendChild(box);
    box.addEventListener('click',function(e){if(e.target===box){box.hidden=true;return;}var b=e.target.closest('[data-a]');if(b){var a=b.dataset.a;e.stopPropagation();
      if(a==='close')box.hidden=true;else if(a==='play'){if(A&&A.src&&!A.paused){want=false;A.pause();}else play();}else if(a==='prev')next(-1);else if(a==='next')next(1);else if(a==='shuf'){shuf=!shuf;draw();}else if(a==='rep'){rep=rep==='all'?'one':rep==='one'?'off':'all';try{localStorage.setItem('vrt_mymusic_rep',rep);}catch(e){}msg(rep==='one'?'🔂 單曲重複：一直播這首':rep==='off'?'⏹ 播到最後一首就停':'🔁 整張循環：一首接一首，播完從頭再來');draw();}
      else if(a==='add'||a==='dir'){var inp=document.createElement('input');inp.type='file';inp.multiple=true;if(a==='dir')inp.webkitdirectory=true;else inp.accept='audio/*,.dsf,.flac,.m4a,.opus,.ogg';inp.onchange=function(){importFiles(inp.files,msg).then(function(){refresh().then(draw);});};inp.click();}
      else if(a==='delall'){sel={};list.forEach(function(t){sel[t.id]=1;});msg('☑️ 勾掉要留下的歌，再按「🗑 刪除勾選」');draw();}
      else if(a==='selnone'){if(sel){var any=Object.keys(sel).some(function(k){return sel[k];});list.forEach(function(t){sel[t.id]=any?0:1;});draw();}}
      else if(a==='selcancel'){sel=null;msg('');draw();}
      else if(a==='seldel'){var ids=Object.keys(sel||{}).filter(function(k){return sel[k];});if(!ids.length){msg('還沒勾任何歌');return;}if(!confirm('從這台裝置刪掉勾選的 '+ids.length+' 首？（原始檔不受影響）'))return;if(cur>=0&&list[cur]&&ids.indexOf(list[cur].id)>=0){stop();cur=-1;if(A)A.removeAttribute('src');}
        tx('readwrite',function(s3){ids.forEach(function(id){s3.delete(id);});}).then(function(){idxSet((idxGet()||[]).filter(function(z){return ids.indexOf(z.id)<0;}));sel=null;msg('🗑 已刪除 '+ids.length+' 首');refresh().then(draw);});}
      else if(a==='del'){var id=b.dataset.id,t=list.find(function(x){return x.id===id;});if(t&&confirm('從這台裝置刪掉「'+t.name+'」？（原始檔不受影響）'))tx('readwrite',function(s){s.delete(id);}).then(function(){idxSet((idxGet()||[]).filter(function(z){return z.id!==id;}));if(cur>=0&&list[cur]&&list[cur].id===id){stop();cur=-1;if(A)A.removeAttribute('src');}refresh().then(draw);});}
      return;}
      var r=e.target.closest('.mmR');if(r){if(sel){var tt=list[+r.dataset.i];if(tt){sel[tt.id]=sel[tt.id]?0:1;draw();}return;}want=true;load(+r.dataset.i);}var pr=e.target.closest('.mmPr');if(pr&&A&&A.duration){var R=pr.getBoundingClientRect();A.currentTime=(e.clientX-R.left)/R.width*A.duration;}});
    return box;}
  function msg(t){var m=box&&box.querySelector('.mmMsg');if(m)m.textContent=t;}
  function draw(){if(!box||box.hidden)return;var now=cur>=0&&list[cur],tot=list.reduce(function(s,x){return s+(x.size||0);},0),keepMsg=(box.querySelector('.mmMsg')||{}).textContent||'';
    box.innerHTML='<div class="mm"><div class="mmH"><b>🎧 我的音樂</b><button data-a="shuf" class="'+(shuf?'on':'')+'">🔀</button><button data-a="rep" title="'+(rep==='one'?'單曲重複':rep==='off'?'播完整張就停':'整張循環（預設）')+'" class="'+(rep!=='off'?'on':'')+'">'+(rep==='one'?'🔂':'🔁')+'</button><button data-a="close">✕</button></div>'
     +'<div class="mmNow"><div class="n">'+(now?esc(now.name):'還沒播放')+'</div><small>'+(now?[now.album,now.src==='dsf'?'DSF→WAV':String(now.src||'').toUpperCase(),tm(now.dur)].filter(Boolean).map(esc).join(' · '):list.length+' 首 · '+mb(tot))+'</small><div class="mmPr"><i></i></div><small class="mmT">0:00 / 0:00</small>'
     +'<div class="mmC"><button data-a="prev">⏮</button><button data-a="play">'+(playing?'⏸':'▶️')+'</button><button data-a="next">⏭</button></div></div>'
     +'<div class="mmL">'+(list.length?list.map(function(t,i){return '<div class="mmR'+(i===cur?' cur':'')+'" data-i="'+i+'"><span style="font-size:20px">'+(sel?(sel[t.id]?'☑️':'⬜'):(i===cur&&playing?'🔊':'🎵'))+'</span><div class="t"><div>'+(t.bad?'⚠️ ':'')+esc(t.name)+'</div><small>'+esc(t.album||'')+(t.album?' · ':'')+tm(t.dur)+' · '+String(t.src||'').toUpperCase()+' · '+mb(t.size||0)+'</small></div>'+(sel?'':'<button class="x" data-a="del" data-id="'+t.id+'" title="刪除">🗑</button>')+'</div>';}).join(''):'<div class="mmE">還沒有歌。<br>按下面「➕ 加入歌曲」，從手機或雲端硬碟選音樂檔（可以一次選很多首）。<br>.dsf 會在這台裝置上轉成 WAV 再存，每首大約要 10–40 秒。<br>歌只存在這台裝置，不會上傳。</div>')+'</div>'
     +(sel?'<div class="mmA"><button data-a="seldel" class="on">🗑 刪除勾選（'+Object.keys(sel).filter(function(k){return sel[k];}).length+'）</button><button data-a="selnone">全選／全不選</button><button data-a="selcancel">取消</button><div class="mmMsg">'+esc(keepMsg)+'</div></div></div>':'<div class="mmA"><button data-a="add">➕ 加入歌曲</button><button data-a="dir">📁 加入整個資料夾</button> '+(list.length?'<button data-a="delall">🗑 選歌刪除</button>':'')+'<small style="color:#64748b">'+list.length+' 首 · 佔用 '+mb(tot)+'</small>'+(/Telegram/i.test(navigator.userAgent)||window.TelegramWebviewProxy?'<a href="https://saintdou-weng.github.io/PSJERP/music.html" style="font-size:12px;color:#4f46e5;margin-left:auto">📱 想切到別的 App 也繼續播？</a>':'')+'<div class="mmMsg">'+esc(keepMsg)+'</div></div></div>');
    prog();}
  function open(){mount();box.hidden=false;refresh().then(draw);}
  window.VRTMyMusic={open:open,play:play,stop:stop,vol:function(v){volume=v;if(A)A.volume=Math.min(1,v);},state:function(){return {n:list.length,playing:playing,cur:cur};},_import:importFiles};
})();
