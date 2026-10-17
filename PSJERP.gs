/**
 * PSJERP — VRT ERP Telegram + Google control layer  v0.6.1
 *   v0.7.0 (2026-10-16)：雲端資料集新增 製單 PROD_ORDER（W_CODK75）、進貨驗收 RECEIVING（W_CPU320）、INVOICE（W_CBL140）、應付明細 AP（W_AR700）、應付彙總 AP_SUM（W_ARA40）。
 *   v0.6.1 (2026-10-15)：網址基底改為 PSJERP（舊 vrt-asset 已失效，Telegram 選單按鈕全部連不上）；webBase_() 讀到舊網址會自動修正。
 *   v0.6.0 (2026-10-07)：雲端改成「一種資料一個試算表（PSJERP_ERP_*）、一個匯入批次一個分頁」，快滿 900 萬格自動開下一本；
 *                      資料集擴充（採購、採購單價、進耗存、成品庫存、出貨、SMV、人工彙總）；新增欄位對應範本 TEMPLATES；
 *                      舊 v0.5 資料仍可讀，重匯同一批次時自動搬到新格式。Telegram 功能不變。
 *   v0.5 (2026-10-06)：雲端同步。網頁匯入的 ERP 資料存進 Google Sheet「PSJERP_ERPDATA」，手機 / 電腦打開網頁都讀同一份。
 *                      讀寫都要「同步密碼」（下面 SYNC_KEY_DIRECT），網頁每台裝置輸入一次。Telegram 功能與 0.4.4 相同。
 *   v0.4.4 (2026-10-05)：選單支援完整網址（MENU 表 ROUTE 可填 https://…）、新增「🏭 VRT Prod」「🔗 ERP 對照」入口（執行一次 ADD_PROD_MENU()）、
 *                      每日 15:30 訊息改為誠實狀態（Bridge 尚未接通時不再顯示 CLOUD_REFRESH_OK）。Token／Chat ID 兩行與 0.4.3 完全相同。
 *
 * ★ GitHub 版：Token、群組 Chat ID、同步密碼都留空。真正貼進 Apps Script 的是另一份「PSJERP_AppsScript專用_v0.6.0.gs」（已填好，不要上傳 GitHub）。
 *   不需要另外設定 Script Properties。
 *   （若 Script Properties 有填 BOT_TOKEN / DEFAULT_CHAT_ID，會優先用 Script Properties。）
 */
const BOT_TOKEN_DIRECT = '';   // ← 貼現有 Bot Token（只貼在 Apps Script，不上傳 GitHub）
const CHAT_ID_DIRECT   = '';   // ← 貼 Account Flow 群組 Chat ID
const SYNC_KEY_DIRECT  = '';   // ← 雲端同步密碼（網頁「設定 → 雲端同步」輸入同一組）

const APP = {
  NAME: 'VRT ERP',
  TECH: 'PSJERP',
  VERSION: '0.7.2',
  PROD_PORTAL: 'https://saintdou-weng.github.io/vrt-prod/portal_v2.html',
  PROD_ERP_LINK: 'https://saintdou-weng.github.io/vrt-prod/vrt_erp_link_v1.html',
  WEBAPP_URL: 'https://script.google.com/macros/s/AKfycbzyAaaKlMGdot9YtYAlBp-dktm2xRr_aHbOcQ-TNfouERMjuq4iCfRhCY0_3LsPa2mL/exec',
  DEFAULT_WEB: 'https://saintdou-weng.github.io/PSJERP/',   // v0.6.1：repo 已由 vrt-asset 改名 PSJERP
  DEFAULT_TZ: 'Asia/Phnom_Penh',
  COMMANDS: ['/erp', '/psj', '/psjerp']
};

function props_() { return PropertiesService.getScriptProperties(); }
function cfg_(k, fallback) {
  const v = props_().getProperty(k);
  return (v === null || v === '') ? fallback : v;
}
function token_() {
  const v = String(cfg_('BOT_TOKEN', '') || BOT_TOKEN_DIRECT || '').trim();
  if (!v) throw new Error('請在程式最上面 BOT_TOKEN_DIRECT 的引號內貼上 Bot Token，存檔後再執行 INSTALL_ONCE()');
  return v;
}
function defaultChat_() {
  const v = String(cfg_('DEFAULT_CHAT_ID', '') || CHAT_ID_DIRECT || '').trim();
  if (!v) throw new Error('請在程式最上面 CHAT_ID_DIRECT 的引號內貼上 Account Flow 群組 Chat ID，存檔後再執行 INSTALL_ONCE()');
  return v;
}
function webBase_() {
  let u = String(cfg_('WEB_BASE_URL', APP.DEFAULT_WEB) || APP.DEFAULT_WEB).trim();
  // v0.6.1：舊設定仍指向已不存在的 vrt-asset → 自動改成 PSJERP，並寫回 SETTINGS 表（Telegram 17 顆按鈕全靠這個網址）
  if (/vrt-asset/i.test(u)) { u = APP.DEFAULT_WEB; try { setSetting_('WEB_BASE_URL', u); } catch (e) {} }
  return u.endsWith('/') ? u : u + '/';
}
function setSetting_(key, value) {
  const sh = ensureDataStore_().getSheetByName('SETTINGS');
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) if (String(vals[i][0]) === key) { sh.getRange(i + 1, 2).setValue(value); return; }
  sh.appendRow([key, value, '']);
}
/** v0.6.1 一次性：修正 WEB_BASE_URL（vrt-asset → PSJERP）。貼上新版後執行一次即可；之後 /erp 選單的所有按鈕都會指向 PSJERP。 */
function FIX_WEB_BASE() {
  setSetting_('WEB_BASE_URL', APP.DEFAULT_WEB);
  log_('SETTINGS', 'OK', 'WEB_BASE_URL -> ' + APP.DEFAULT_WEB);
  return 'WEB_BASE_URL 已改為 ' + APP.DEFAULT_WEB + '；在群組打 /erp 看新選單';
}
function tz_() { return cfg_('TZ', APP.DEFAULT_TZ); }

/**
 * ONE-TIME INSTALL.
 * Run after: (1) deploy as Web App, (2) set BOT_TOKEN and DEFAULT_CHAT_ID.
 * It creates the configuration spreadsheet, menu, holiday calendar, logs,
 * Telegram webhook, commands and the daily 15:30 trigger.
 */
function INSTALL_ONCE() {
  token_();
  defaultChat_();
  ensureDataStore_();
  seedMenu_();
  seedSettings_();
  seedHolidays_();
  installDailyTrigger_();
  let hook = 'OK';
  try { setWebhook_(); } catch (e) { hook = String(e.message || e); log_('WEBHOOK', 'PENDING', hook); }
  setTelegramCommands_();
  sendTelegram_(defaultChat_(), buildWelcomeText_(), buildMenuKeyboard_());
  log_('INSTALL', 'OK', 'PSJERP installation completed');
  Logger.log('PSJERP 資料表：' + dataSS_().getUrl());
  if (hook !== 'OK') return '已安裝，選單已發到群組。Webhook 尚未設定：請先「部署 → 新增部署 → 網頁應用程式」，再執行 SET_WEBHOOK()。';
  return 'PSJERP 安裝完成。之後改選單改 MENU 表、改廠休改 HOLIDAYS 表，不用改程式。';
}
/** 部署成網頁應用程式後執行一次（或重新部署後再執行一次）。 */
function SET_WEBHOOK() { return setWebhook_(); }
/** 選單一直重複跳出時執行一次：清掉 Telegram 積壓的重送訊息並重設 webhook。 */
function FIX_REPEAT() { props_().deleteProperty('LAST_UPDATE_ID'); return setWebhook_(); }

function ensureDataStore_() {
  const p = props_();
  let id = p.getProperty('DATA_SHEET_ID');
  let ss;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create('PSJERP_DATA');
    p.setProperty('DATA_SHEET_ID', ss.getId());
  }
  ['SETTINGS','MENU','HOLIDAYS','SYNC_LOG','TELEGRAM_LOG','AUDIT_LOG'].forEach(n => {
    if (!ss.getSheetByName(n)) ss.insertSheet(n);
  });
  return ss;
}

function dataSS_() { return SpreadsheetApp.openById(props_().getProperty('DATA_SHEET_ID')); }

function seedSettings_() {
  const sh = dataSS_().getSheetByName('SETTINGS');
  if (sh.getLastRow() > 0) return;
  const rows = [
    ['KEY','VALUE','NOTE'],
    ['APP_NAME','VRT ERP','Display name'],
    ['TECH_NAME','PSJERP','Technical namespace'],
    ['WEB_BASE_URL',webBase_(),'GitHub Pages base URL'],
    ['DAILY_SYNC_TIME','15:30','Cambodia local time'],
    ['SYNC_SUNDAY','NO','Sunday is factory closed'],
    ['HOLIDAY_SOURCE','HOLIDAYS','Use VRT factory calendar, not hard-coded public holidays'],
    ['DEFAULT_SUMMARY_GROUP','ACCOUNT_FLOW','Telegram route'],
    ['LEGACY_MODE','READ_ONLY','Never write back to clothes.exe / SQL']
  ];
  sh.getRange(1,1,rows.length,rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
}

function seedHolidays_() {
  const sh = dataSS_().getSheetByName('HOLIDAYS');
  if (sh.getLastRow() > 0) return;
  sh.getRange(1,1,1,3).setValues([['DATE','NAME','CLOSED']]);
  sh.setFrozenRows(1);
}

function seedMenu_() {
  const sh = dataSS_().getSheetByName('MENU');
  if (sh.getLastRow() > 0) return;
  const rows = [
    ['ORDER','ENABLED','ROW','LABEL_ZH','LABEL_EN','LABEL_KM','ROUTE'],
    [10,true,1,'📊 總覽','📊 Summary','📊 សង្ខេប','#dashboard'],
    [20,true,1,'🧠 智慧匯入','🧠 Smart Import','🧠 Smart Import','#smart-import'],
    [30,true,2,'🧾 訂單 / PO','🧾 Orders / PO','🧾 Orders / PO','#orders'],
    [40,true,2,'🧵 BOM','🧵 BOM','🧵 BOM','#bom'],
    [50,true,3,'🛒 採購','🛒 Purchase','🛒 Purchase','#purchase'],
    [60,true,3,'📥 進貨','📥 Receiving','📥 Receiving','#receiving'],
    [70,true,4,'🧶 布料','🧶 Fabric','🧶 Fabric','#fabric'],
    [80,true,4,'🧷 輔料','🧷 Accessories','🧷 Accessories','#accessories'],
    [90,true,5,'⏳ WIP','⏳ WIP','⏳ WIP','#wip'],
    [100,true,5,'📦 成品入庫','📦 Finished Goods','📦 Finished Goods','#finished-goods'],
    [110,true,6,'🏭 生產','🏭 Production','🏭 Production','#production'],
    [120,true,6,'🚢 出貨','🚢 Shipping','🚢 Shipping','#shipping'],
    [130,true,7,'💰 製造費用','💰 Factory Cost','💰 Factory Cost','#factory-cost'],
    [140,true,7,'🧮 成本分析','🧮 Costing','🧮 Costing','#costing'],
    [150,true,8,'🔍 資料比對','🔍 Compare','🔍 Compare','#compare'],
    [160,true,8,'🔄 同步中心','🔄 Sync Center','🔄 Sync Center','#sync'],
    [170,true,9,'📑 報告','📑 Reports','📑 Reports','#reports'],
    // v0.4.4：PROD ↔ ERP 互相入口（ROUTE 可以是完整網址）
    [180,true,10,'🏭 VRT Prod','🏭 VRT Prod','🏭 VRT Prod',APP.PROD_PORTAL],
    [190,true,10,'🔗 ERP 對照 (PROD)','🔗 ERP link (PROD)','🔗 ERP link (PROD)',APP.PROD_ERP_LINK]
  ];
  sh.getRange(1,1,rows.length,rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
}

/** v0.4.4 一次性：把「🏭 VRT Prod」「🔗 ERP 對照 (PROD)」加進既有 MENU 表（已有就不重複）。之後要調整直接改 MENU 表即可。 */
function ADD_PROD_MENU() {
  const sh = ensureDataStore_().getSheetByName('MENU');
  if (sh.getLastRow() < 1) { seedMenu_(); return 'MENU 表是空的，已用預設選單（含 VRT Prod 入口）建立'; }
  const vals = sh.getDataRange().getValues();
  const h = vals[0].map(String), I = Object.fromEntries(h.map((x,i)=>[x,i]));
  const routes = vals.slice(1).map(r => String(r[I.ROUTE]||'').trim());
  const want = [
    [180,true,10,'🏭 VRT Prod','🏭 VRT Prod','🏭 VRT Prod',APP.PROD_PORTAL],
    [190,true,10,'🔗 ERP 對照 (PROD)','🔗 ERP link (PROD)','🔗 ERP link (PROD)',APP.PROD_ERP_LINK]
  ];
  let added = 0;
  want.forEach(w => { if (routes.indexOf(w[6]) < 0) { const row = h.map(()=>''); row[I.ORDER]=w[0]; row[I.ENABLED]=w[1]; row[I.ROW]=w[2]; row[I.LABEL_ZH]=w[3]; row[I.LABEL_EN]=w[4]; row[I.LABEL_KM]=w[5]; row[I.ROUTE]=w[6]; sh.appendRow(row); added++; } });
  log_('MENU', 'OK', 'ADD_PROD_MENU added ' + added + ' row(s)');
  return added ? ('已加入 ' + added + ' 顆 PROD 入口按鈕；在群組打 /erp 看新選單') : 'MENU 表已經有 PROD 入口，沒有變更';
}

function buildMenuKeyboard_() {
  const sh = dataSS_().getSheetByName('MENU');
  const vals = sh.getDataRange().getValues();
  if (vals.length < 2) return {inline_keyboard:[]};
  const h = vals[0];
  const I = Object.fromEntries(h.map((x,i)=>[x,i]));
  const lang = 'ZH';
  const labelCol = lang === 'EN' ? I.LABEL_EN : lang === 'KM' ? I.LABEL_KM : I.LABEL_ZH;
  const rows = {};
  vals.slice(1)
    .filter(r => String(r[I.ENABLED]).toLowerCase() !== 'false' && r[I.ENABLED] !== '')
    .sort((a,b)=>Number(a[I.ORDER])-Number(b[I.ORDER]))
    .forEach(r => {
      const n = Number(r[I.ROW]) || 1;
      const route = String(r[I.ROUTE]||'').trim();
      // v0.4.4：ROUTE 填完整 https:// 網址就直接用（例：VRT Prod 入口），否則接在 WEB_BASE_URL 後面
      (rows[n] = rows[n] || []).push({text:String(r[labelCol]), url:/^https?:\/\//i.test(route) ? route : webBase_()+route});
    });
  return {inline_keyboard:Object.keys(rows).sort((a,b)=>a-b).map(k=>rows[k])};
}

function buildWelcomeText_() {
  return [
    '🏭 <b>VRT ERP / PSJERP</b>',
    '',
    'Legacy ERP：READ ONLY',
    'Cloud：Google Sheets + Apps Script + Drive',
    'Daily ERP sync：15:30 on VRT working days',
    'Sunday / factory holiday：Skip',
    '',
    '選擇工具 / Choose a tool:'
  ].join('\n');
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { body = {}; }
  if (body && body.api === 'psjerp') return json_(erpApi_(body));    // 網頁雲端同步
  try {
    const update = body;
    // 防重複：Telegram 沒馬上收到回應會重送同一則訊息，同一個 update_id 只處理一次
    const id = update.update_id;
    if (id != null) {
      const cache = CacheService.getScriptCache();
      const key = 'upd_' + id;
      if (cache.get(key)) return ContentService.createTextOutput('OK');
      cache.put(key, '1', 21600);
      const p = props_(), last = Number(p.getProperty('LAST_UPDATE_ID') || 0);
      if (id <= last) return ContentService.createTextOutput('OK');
      p.setProperty('LAST_UPDATE_ID', String(id));
    }
    handleTelegramUpdate_(update);
    return ContentService.createTextOutput('OK');
  } catch (err) {
    log_('WEBHOOK','ERROR',String(err));
    return ContentService.createTextOutput('ERROR');
  }
}

/**
 * Read-only JSON API for the VRT ERP web page (GitHub Pages).
 *   ?action=ping      health check
 *   ?action=holidays  VRT factory calendar (HOLIDAYS sheet)
 *   ?action=synclog   last 60 sync log rows
 *   ?action=settings  public settings (no secrets)
 * Nothing here writes to Google Sheets or to the Legacy ERP.
 */
function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'ping').toLowerCase();
  try { if (props_().getProperty('TRIGGER_VER') !== '0.7.2') installDailyTrigger_(); } catch (err) {}   // v0.7.2 自動換成週一四檢查
  let out;
  try {
    if (/^erp_/.test(action)) out = erpApi_(Object.assign({}, e.parameter, {action: action}));
    else if (action === 'holidays') out = {ok:true, holidays: readSheet_('HOLIDAYS')};
    else if (action === 'synclog') out = {ok:true, rows: readSheet_('SYNC_LOG').slice(-60).reverse()};
    else if (action === 'settings') out = {ok:true, settings: readSheet_('SETTINGS').filter(r => !/TOKEN|CHAT|PASS|SECRET/i.test(String(r.KEY)))};
    else out = {ok:true, app:APP.TECH, name:APP.NAME, version:APP.VERSION, time:now_(), workingDay:(function(){try{return isWorkingDay_(new Date())}catch(e){return null}})(), legacy:'READ_ONLY', sync:!!syncKey_()};
  } catch (err) {
    out = {ok:false, error:String(err)};
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
function now_() { return Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm:ss'); }
function readSheet_(name) {
  const sh = dataSS_().getSheetByName(name);
  if (!sh || sh.getLastRow() < 2) return [];
  const vals = sh.getDataRange().getValues();
  const h = vals[0].map(String);
  const z = tz_();
  return vals.slice(1).map(r => {
    const o = {};
    h.forEach((k, i) => { const v = r[i]; o[k] = v instanceof Date ? Utilities.formatDate(v, z, 'yyyy-MM-dd HH:mm') : v; });
    return o;
  });
}

function handleTelegramUpdate_(u) {
  const m = u.message;                       // 編輯過的訊息不再回應
  if (!m) return;
  if (m.date && (Date.now() / 1000 - m.date) > 120) return;   // 超過 2 分鐘的舊訊息不回
  const text0 = String(m.text || '').trim();
  if (!text0.startsWith('/')) return;
  // 群組裡指令常帶 @BotName（例 /erp@PSJERP_Bot），先去掉再比對
  const text = String(m.text || '').trim().split(/\s+/)[0].split('@')[0].toLowerCase();
  if (APP.COMMANDS.includes(text) || text === '/start') {
    const cache = CacheService.getScriptCache(), ck = 'menu_' + m.chat.id;
    if (cache.get(ck)) return;                // 同一群組 10 秒內只發一次選單
    cache.put(ck, '1', 10);
    sendTelegram_(m.chat.id, buildWelcomeText_(), buildMenuKeyboard_());
  }
}

function sendTelegram_(chatId, text, keyboard) {
  const payload = {
    chat_id: String(chatId),
    text: text,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  };
  if (keyboard) payload.reply_markup = JSON.stringify(keyboard);
  const res = UrlFetchApp.fetch('https://api.telegram.org/bot'+token_()+'/sendMessage', {
    method:'post', payload:payload, muteHttpExceptions:true
  });
  logTelegram_('sendMessage', chatId, res.getResponseCode(), res.getContentText());
  return res;
}

function setWebhook_() {
  // Always register the /exec URL (never /dev). WEBAPP_URL in Script Properties wins if set.
  let url = cfg_('WEBAPP_URL', '') || APP.WEBAPP_URL || ScriptApp.getService().getUrl() || '';
  url = url.replace(/\/dev$/, '/exec');
  if (!/\/exec$/.test(url)) throw new Error('Deploy as Web App first, then set Script Property WEBAPP_URL (…/exec).');
  const api = 'https://api.telegram.org/bot'+token_()+'/setWebhook';
  const res = UrlFetchApp.fetch(api,{method:'post',payload:{url:url, drop_pending_updates:'true', max_connections:'1', allowed_updates:JSON.stringify(['message'])},muteHttpExceptions:true});
  logTelegram_('setWebhook','-',res.getResponseCode(),res.getContentText());
  return res.getContentText();
}

function setTelegramCommands_() {
  const commands = [
    {command:'erp',description:'Open VRT ERP menu'},
    {command:'psj',description:'Open PSJERP menu'},
    {command:'psjerp',description:'Open PSJERP menu'}
  ];
  const api = 'https://api.telegram.org/bot'+token_()+'/setMyCommands';
  UrlFetchApp.fetch(api,{method:'post',contentType:'application/json',payload:JSON.stringify({commands:commands}),muteHttpExceptions:true});
}

function installDailyTrigger_() {
  // v0.7.2：不再每天 15:30 發「NOT_CONNECTED」。改成每天 11:00 檢查：週一、週四若還沒收到更新摘要就提醒。
  ScriptApp.getProjectTriggers().forEach(t => {
    const f = t.getHandlerFunction(); if (f === 'daily1530' || f === 'checkUpdate11') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkUpdate11').timeBased().atHour(11).nearMinute(0).everyDays(1).create();
  props_().setProperty('TRIGGER_VER', '0.7.2');
  return;
  // Time comes from SETTINGS → DAILY_SYNC_TIME (default 15:30). Google runs it within about ±15 min.
  const tm = String(getSetting_('DAILY_SYNC_TIME', '15:30')).split(':');
  const hh = Math.min(23, Math.max(0, Number(tm[0]) || 15)), mm = Math.min(59, Math.max(0, Number(tm[1]) || 30));
  ScriptApp.newTrigger('daily1530').timeBased().atHour(hh).nearMinute(mm).everyDays(1).create();
}
/** Run once after changing DAILY_SYNC_TIME in the SETTINGS sheet. */
function REINSTALL_TRIGGER() { installDailyTrigger_(); return 'Check trigger set: every day 11:00 (acts on Mon/Thu only)'; }
/** 週一、四 11:00：若今天還沒收到 ERP 更新摘要，就在 Telegram 提醒。 */
function checkUpdate11() {
  const d = new Date(), z = tz_(); const dow = Number(Utilities.formatDate(d, z, 'u'));
  if (dow !== 1 && dow !== 4) return;
  if (!isWorkingDay_(d)) { log_('UPDATE_CHECK','SKIPPED','FACTORY HOLIDAY'); return; }
  const today = Utilities.formatDate(d, z, 'yyyy-MM-dd'); const sh = erpSS_().getSheetByName('UPDATE_LOG');
  const got = sh ? readTable_(sh).some(r => String(r.time).slice(0, 10) === today) : false;
  if (got) { log_('UPDATE_CHECK','OK','updated today'); return; }
  sendTelegram_(defaultChat_(), '⚠️ <b>VRT ERP：今天 09:00 的 ERP 更新還沒完成</b>\n請確認公司電腦有開機、成衣管理系統已登入、沒有鎖螢幕。\n📊 ' + webBase_() + '#sync', null);
  log_('UPDATE_CHECK','WARN','no update today');
}
function getSetting_(key, fallback) {
  const sh = dataSS_().getSheetByName('SETTINGS');
  if (!sh || sh.getLastRow() < 2) return fallback;
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) if (String(vals[i][0]) === key) {
    const v = vals[i][1];
    return v instanceof Date ? Utilities.formatDate(v, tz_(), 'HH:mm') : (v === '' ? fallback : v);
  }
  return fallback;
}

function daily1530() {
  const today = new Date();
  if (!isWorkingDay_(today)) {
    const isSun = Number(Utilities.formatDate(today, tz_(), 'u')) === 7;
    log_('DAILY_SYNC','SKIPPED', isSun ? 'SKIPPED — SUNDAY' : 'SKIPPED — FACTORY HOLIDAY');
    return;   // no Legacy ERP access, no daily summary
  }
  // Bridge/data import hook. Legacy ERP must remain READ ONLY.
  const result = runCloudRefresh_();
  const txt = buildDailySummary_(result);
  sendTelegram_(defaultChat_(), txt, buildMenuKeyboard_());
  log_('DAILY_SYNC','OK',JSON.stringify(result));
}

function isWorkingDay_(d) {
  const z = tz_();
  const dow = Number(Utilities.formatDate(d,z,'u')); // Mon=1 ... Sun=7
  if (dow === 7) return false;
  const ymd = Utilities.formatDate(d,z,'yyyy-MM-dd');
  const sh = dataSS_().getSheetByName('HOLIDAYS');
  if (!sh || sh.getLastRow() === 0) return true;
  const vals = sh.getDataRange().getValues();
  for (let i=1;i<vals.length;i++) {
    const v = vals[i][0];
    if (!v) continue;
    const ds = v instanceof Date ? Utilities.formatDate(v,z,'yyyy-MM-dd') : String(v).slice(0,10);
    const closed = vals[i][2] === '' ? true : String(vals[i][2]).toUpperCase() !== 'NO';
    if (ds === ymd && closed) return false;
  }
  return true;
}

function runCloudRefresh_() {
  // Phase 1: cloud mirror/summary. The local PSJERP Bridge will update Google Sheets
  // after reading Legacy ERP. This function never calls clothes.exe or writes to Legacy ERP.
  // v0.4.4：Bridge 尚未接通前，狀態誠實寫「NOT_CONNECTED」，不再回 CLOUD_REFRESH_OK（規格 11.1：舊假成功狀態改成「尚未接通」）
  return {
    time: Utilities.formatDate(new Date(),tz_(),'yyyy-MM-dd HH:mm'),
    status: 'NOT_CONNECTED',
    note: 'PSJERP Bridge 尚未接通，今日未擷取 Legacy ERP 資料 / Bridge not connected yet — no ERP data was fetched today',
    legacy_write: false
  };
}

function buildDailySummary_(r) {
  return [
    '📊 <b>VRT ERP Daily Summary</b>',
    '',
    'Time: '+escapeHtml_(r.time),
    'Status: '+escapeHtml_(r.status)+(r.status==='NOT_CONNECTED'?' ⏸':''),
    (r.note ? escapeHtml_(r.note) : ''),
    'Legacy ERP write: NO',
    '',
    'ERP remains the official system of record.',
    'PROD 對照 / ERP link centre: '+APP.PROD_ERP_LINK,
    '📊 Dashboard: '+webBase_()+'#dashboard'
  ].join('\n');
}

function manualSyncNow() {
  const r = runCloudRefresh_();
  sendTelegram_(defaultChat_(), buildDailySummary_(r), buildMenuKeyboard_());
  log_('MANUAL_SYNC','OK',JSON.stringify(r));
  return r;
}

function log_(action, status, note) {
  const sh = ensureDataStore_().getSheetByName('SYNC_LOG');
  if (sh.getLastRow() === 0) sh.appendRow(['TIME','ACTION','STATUS','NOTE']);
  sh.appendRow([new Date(),action,status,note]);
}
function logTelegram_(action, chat, code, body) {
  const sh = ensureDataStore_().getSheetByName('TELEGRAM_LOG');
  if (sh.getLastRow() === 0) sh.appendRow(['TIME','ACTION','CHAT','HTTP','BODY']);
  sh.appendRow([new Date(),action,String(chat),code,String(body).slice(0,1000)]);
}
function escapeHtml_(s) {
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


/* ===================== v0.5 雲端同步（ERP 匯入資料 → Google Sheets） =====================
 * 只存「網頁匯入的 ERP 匯出檔」與雲端備註；不碰 clothes.exe / Legacy SQL。
 * 索引試算表：PSJERP_ERPDATA（第一次同步自動建立）
 *   ERP_FILES  每個匯入批次一列（key / 報表 / 範圍 / 筆數 / 版本 / sheet_id / tab）
 *   NOTES      雲端備註 / 標籤；TEMPLATES 欄位對應範本
 * 資料試算表（v0.6）：PSJERP_ERP_<資料集>，每個匯入批次一個分頁（分頁名 = 批次 key）
 */
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function syncKey_() { return String(cfg_('SYNC_KEY', '') || SYNC_KEY_DIRECT || '').trim(); }
function erpSS_() {
  const p = props_(); let ss = null; const id = p.getProperty('ERP_SHEET_ID');
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (!ss) { ss = SpreadsheetApp.create('PSJERP_ERPDATA'); p.setProperty('ERP_SHEET_ID', ss.getId()); }
  return ss;
}
const ERP_SHEETS = ['ORDERS','ORDERS_PROGRESS','BOM','PURCHASE','PURCHASE_PRICE','STOCK_MOVE','FABRIC','ACCESS','FG_STOCK','FG','SHIP','SMV','STYLE','LABOR_SUMMARY','PROD_ORDER','RECEIVING','INVOICE','AP','AP_SUM'];
const FILE_COLS = ['key','rep','sheet','fn','file','rows','label','range','asof','year','totals','checks','at','batch','version','cols','types','user','sheet_id','tab'];
const CELL_LIMIT = 9000000;   // Google 試算表上限 1,000 萬格，留 10% 空間
function sheetOf_(ss, name, header) {
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0 && header) { sh.getRange(1, 1, 1, header.length).setNumberFormat('@').setValues([header]); sh.setFrozenRows(1); }
  return sh;
}
function head_(sh) { const lc = sh.getLastColumn(); return lc ? sh.getRange(1, 1, 1, lc).getValues()[0].map(String) : []; }
function ensureCols_(sh, cols) {
  let h = head_(sh); if (!h.length) { h = ['_key']; sh.getRange(1, 1).setValue('_key'); sh.setFrozenRows(1); }
  const miss = cols.filter(c => h.indexOf(c) < 0);
  if (miss.length) { sh.getRange(1, h.length + 1, 1, miss.length).setNumberFormat('@').setValues([miss]); h = h.concat(miss); }
  return h;
}
function keyRows_(sh, key) {   // v0.5 舊格式：1-based row numbers whose _key == key
  const last = sh.getLastRow(); if (last < 2) return [];
  const col = sh.getRange(2, 1, last - 1, 1).getDisplayValues(); const out = [];
  for (let i = 0; i < col.length; i++) if (col[i][0] === key) out.push(i + 2);
  return out;
}
function deleteKey_(sh, key) {
  const rows = keyRows_(sh, key); let n = 0;
  if (rows.length && rows.length === sh.getLastRow() - 1) { sh.getRange(2, 1, rows.length, Math.max(1, sh.getLastColumn())).clearContent(); return rows.length; }
  for (let i = rows.length - 1; i >= 0; ) { let j = i; while (j > 0 && rows[j - 1] === rows[j] - 1) j--; sh.deleteRows(rows[j], rows[i] - rows[j] + 1); n += rows[i] - rows[j] + 1; i = j - 1; }
  return n;
}
function readTable_(sh) {
  if (!sh || sh.getLastRow() < 2) return [];
  const v = sh.getDataRange().getValues(); const h = v[0].map(String);
  return v.slice(1).map(r => { const o = {}; h.forEach((k, i) => o[k] = r[i] instanceof Date ? Utilities.formatDate(r[i], tz_(), 'yyyy-MM-dd HH:mm:ss') : r[i]); return o; });
}
/* ---------- v0.6：一種資料一個試算表、一個批次一個分頁 ---------- */
function tabName_(key) { return String(key).replace(/[\[\]\*\?\/\\:|']/g, '_').slice(0, 99); }
function cellsOf_(ss) { return ss.getSheets().reduce((s, sh) => s + sh.getMaxRows() * sh.getMaxColumns(), 0); }
function dsSS_(name, need) {   // 目前可寫入的資料集試算表；快滿就自動開下一本
  const p = props_(); const pk = 'SHEET_' + name; let ss = null; const id = p.getProperty(pk);
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; } }
  if (ss && need && cellsOf_(ss) + need > CELL_LIMIT) ss = null;
  if (!ss) {
    const n = Number(p.getProperty(pk + '_N') || 0) + 1;
    ss = SpreadsheetApp.create('PSJERP_ERP_' + name + (n > 1 ? '_' + n : ''));
    p.setProperty(pk, ss.getId()); p.setProperty(pk + '_N', String(n));
  }
  return ss;
}
function fileRow_(key) { const fs = erpSS_().getSheetByName('ERP_FILES'); if (!fs) return null; return readTable_(fs).find(f => String(f.key) === String(key)) || null; }
function dropTab_(meta) {
  if (!meta || !meta.sheet_id || !meta.tab) return 0;
  try { const ss = SpreadsheetApp.openById(meta.sheet_id); const sh = ss.getSheetByName(meta.tab); if (!sh) return 0; const n = Math.max(0, sh.getLastRow() - 1);
    if (ss.getSheets().length === 1) { sh.clear(); sh.setName('empty'); } else ss.deleteSheet(sh); return n; } catch (e) { return 0; }
}
function erpApi_(b) {
  const key0 = syncKey_();
  if (!key0) return {ok:false, error:'NO_SYNC_KEY', msg:'Apps Script 尚未設定同步密碼（SYNC_KEY_DIRECT）'};
  if (String(b.k || '') !== key0) return {ok:false, error:'BAD_KEY', msg:'同步密碼不對'};
  const a = String(b.action || '');
  const ss = erpSS_();
  if (a === 'erp_manifest') {
    return {ok:true, files:readTable_(ss.getSheetByName('ERP_FILES')), notes:readTable_(ss.getSheetByName('NOTES')), tpls:readTable_(ss.getSheetByName('TEMPLATES')), url:ss.getUrl(), time:now_()};
  }
  if (a === 'erp_get') {
    const off = Number(b.offset || 0), lim = Math.min(5000, Number(b.limit || 3000));
    const meta = fileRow_(b.key);
    if (meta && meta.sheet_id && meta.tab) {   // v0.6 格式
      const sh = SpreadsheetApp.openById(meta.sheet_id).getSheetByName(meta.tab); if (!sh) return {ok:true, cols:[], rows:[], total:0};
      const h = head_(sh); const total = Math.max(0, sh.getLastRow() - 1); const n = Math.max(0, Math.min(lim, total - off));
      const rows = n ? sh.getRange(2 + off, 1, n, h.length).getValues().map(r => r.map(x => x instanceof Date ? Utilities.formatDate(x, tz_(), 'yyyy-MM-dd') : x)) : [];
      return {ok:true, cols:h, rows:rows, total:total};
    }
    const sh = ss.getSheetByName(String(b.sheet || '')); if (!sh) return {ok:true, cols:[], rows:[], total:0};   // v0.5 舊格式
    const idx = keyRows_(sh, String(b.key)); const h = head_(sh); if (!idx.length) return {ok:true, cols:h.slice(1), rows:[], total:0};
    const part = idx.slice(off, off + lim); if (!part.length) return {ok:true, cols:h.slice(1), rows:[], total:idx.length};
    const first = part[0], lastR = part[part.length - 1]; const block = sh.getRange(first, 1, lastR - first + 1, h.length).getValues();
    const want = {}; part.forEach(r => want[r] = 1); const rows = [];
    block.forEach((r, i) => { if (want[first + i]) rows.push(r.slice(1).map(x => x instanceof Date ? Utilities.formatDate(x, tz_(), 'yyyy-MM-dd') : x)); });
    return {ok:true, cols:h.slice(1), rows:rows, total:idx.length};
  }
  if (a === 'erp_updates') {   // 最近的更新摘要
    const sh = ss.getSheetByName('UPDATE_LOG'); return {ok:true, rows: sh ? readTable_(sh).slice(-30).reverse() : []};
  }
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    if (a === 'erp_digest') {   // v0.7.2：每次匯入上傳後，網頁送來的更新摘要 → Telegram + UPDATE_LOG
      const text = String(b.text || '').slice(0, 3600); const files = b.files || [];
      const sumLine = files.length + ' 個檔，' + files.reduce((s, f) => s + (Number(f.rows) || 0), 0) + ' 列';
      const sh = sheetOf_(ss, 'UPDATE_LOG', ['time','summary','files','text']);
      sh.getRange(sh.getLastRow() + 1, 1, 1, 4).setNumberFormat('@').setValues([[now_(), sumLine, JSON.stringify(files).slice(0, 45000), text]]);
      let tg = null;
      try { tg = sendTelegram_(defaultChat_(), '📣 <b>VRT ERP 資料已更新</b>\n' + escapeHtml_(text), null).getResponseCode(); } catch (err) { log_('DIGEST','ERROR',String(err)); }
      log_('DIGEST','OK',sumLine);
      return {ok:true, telegram:tg};
    }
    if (a === 'erp_put') {
      const name = String(b.sheet); if (ERP_SHEETS.indexOf(name) < 0) return {ok:false, error:'BAD_SHEET', msg:'不認得的資料集：' + name};
      const key = String(b.key), cols = b.cols || [], types = b.types || [], rows = b.rows || [];
      const tab = tabName_(key); const cache = CacheService.getScriptCache(); const ck = 'put_' + Utilities.base64EncodeWebSafe(key).slice(0, 200);
      let sid = cache.get(ck), dss, sh, removed = 0;
      if (Number(b.part) === 0) {
        const old = fileRow_(key);
        if (old && old.sheet_id) removed = dropTab_(old);
        else { const legacy = ss.getSheetByName(name); if (legacy) removed = deleteKey_(legacy, key); }   // 清掉 v0.5 舊格式
        dss = dsSS_(name, (Number(b.total || rows.length) + 1) * Math.max(1, cols.length));
        sh = dss.getSheetByName(tab); if (sh) sh.clear(); else sh = dss.insertSheet(tab);
        const dflt = dss.getSheetByName('Sheet1') || dss.getSheetByName('工作表1') || dss.getSheetByName('empty'); if (dflt && dss.getSheets().length > 1) dss.deleteSheet(dflt);
        sh.getRange(1, 1, 1, cols.length).setNumberFormat('@').setValues([cols]); sh.setFrozenRows(1);
        sid = dss.getId(); cache.put(ck, sid, 21600);
      } else {
        if (!sid) { const m = fileRow_(key); sid = m && m.sheet_id; }
        if (!sid) return {ok:false, error:'PART_ORDER', msg:'請重新上傳（第一段遺失）'};
        dss = SpreadsheetApp.openById(sid); sh = dss.getSheetByName(tab);
        if (!sh) return {ok:false, error:'PART_ORDER', msg:'找不到分頁 ' + tab};
      }
      if (rows.length) {
        const start = sh.getLastRow() + 1;
        if (sh.getMaxRows() < start + rows.length) sh.insertRowsAfter(sh.getMaxRows(), start + rows.length - sh.getMaxRows());
        cols.forEach((c, j) => { if (types[j] !== 'n') sh.getRange(start, j + 1, rows.length, 1).setNumberFormat('@'); });
        sh.getRange(start, 1, rows.length, cols.length).setValues(rows.map(r => cols.map((c, j) => r[j] == null ? '' : r[j])));
      }
      let version = null;
      if (b.meta) {   // 最後一段：寫 ERP_FILES 索引
        const fs = sheetOf_(ss, 'ERP_FILES', FILE_COLS); ensureColsPlain_(fs, FILE_COLS); version = Utilities.formatDate(new Date(), tz_(), 'yyyyMMddHHmmss');
        const m = Object.assign({}, b.meta, {key:key, sheet:name, version:version, cols:JSON.stringify(cols), types:JSON.stringify(types), rows:Math.max(0, sh.getLastRow() - 1), sheet_id:sid, tab:tab});
        deleteKey_(fs, key);
        const h = head_(fs); const line = h.map(c => { const v = m[c]; return v == null ? '' : (typeof v === 'object' ? JSON.stringify(v) : v); });
        const r0 = fs.getLastRow() + 1; fs.getRange(r0, 1, 1, line.length).setNumberFormat('@').setValues([line]);
        cache.remove(ck);
      }
      return {ok:true, removed:removed, version:version};
    }
    if (a === 'erp_note') {
      const sh = sheetOf_(ss, 'NOTES', ['id','ds','notes','tags','at','user']);
      deleteKey_(sh, String(b.id));
      const r0 = sh.getLastRow() + 1; sh.getRange(r0, 1, 1, 6).setNumberFormat('@').setValues([[String(b.id), String(b.ds || ''), String(b.notes || ''), String(b.tags || ''), now_(), String(b.user || '')]]);
      return {ok:true};
    }
    if (a === 'erp_tpl') {   // 欄位對應範本（同一組欄名 = 同一個範本）
      const t = b.tpl || {}; const sh = sheetOf_(ss, 'TEMPLATES', ['sig','name','ds','map','at']);
      deleteKey_(sh, String(t.sig));
      const r0 = sh.getLastRow() + 1; sh.getRange(r0, 1, 1, 5).setNumberFormat('@').setValues([[String(t.sig), String(t.name || ''), String(t.ds || ''), String(t.map || '{}'), String(t.at || now_())]]);
      return {ok:true};
    }
    if (a === 'erp_drop') {   // 刪除一個匯入批次（Paul 清除錯誤匯入時用）
      const key = String(b.key); const m = fileRow_(key); let n = 0;
      if (m && m.sheet_id) n = dropTab_(m); else ERP_SHEETS.forEach(s => { const sh = ss.getSheetByName(s); if (sh) n += deleteKey_(sh, key); });
      const fs = ss.getSheetByName('ERP_FILES'); if (fs) deleteKey_(fs, key);
      return {ok:true, removed:n};
    }
  } finally { lock.releaseLock(); }
  return {ok:false, error:'BAD_ACTION'};
}
function ensureColsPlain_(sh, cols) { const h = head_(sh); const miss = cols.filter(c => h.indexOf(c) < 0); if (miss.length) sh.getRange(1, h.length + 1, 1, miss.length).setNumberFormat('@').setValues([miss]); }
/** 手動檢查：執行後看「執行記錄」會顯示雲端資料表網址與每個批次筆數。 */
function CHECK_CLOUD() {
  const ss = erpSS_(); const files = readTable_(ss.getSheetByName('ERP_FILES'));
  Logger.log('PSJERP_ERPDATA（索引）：' + ss.getUrl());
  ERP_SHEETS.forEach(n => { const id = props_().getProperty('SHEET_' + n); if (id) { try { const s = SpreadsheetApp.openById(id); Logger.log(n + '：' + s.getUrl() + ' · ' + s.getSheets().length + ' 個分頁 · 約 ' + Math.round(cellsOf_(s) / 10000) + ' 萬格'); } catch (e) {} } });
  files.forEach(f => Logger.log(f.fn + ' · ' + f.label + ' · ' + f.rows + ' 列 · ' + (f.tab ? '分頁 ' + f.tab : '舊格式') + ' · v' + f.version));
  return files.length + ' 個批次';
}
