/* PSJ 生產連動 psj-links.js v1（2026-11-23 Paul）
 * 生產的頁面（PSJERP 生產頁、生產平台的車縫日／週／月／年報）點某一條線、某一天（或某一段期間）→
 * 直接看 PSJHR 那段時間的出勤人員：這條線的車工／組長／助理，以及同一段時間全廠的品管、包裝（整燙）、裁剪。
 * 資料：同一台裝置上 PSJHR 存的本機資料（IndexedDB 'psjhr'：db_v1 的 empdet＝組別／職位，bat|<月> 的每日上下班），
 * 照片也從 PSJHR 拿（photo|工號）。只讀，不改任何資料；這台裝置沒開過 PSJHR 就顯示「先開一次 PSJHR」。
 * 用法：PSJLinks.open({line:'LINE3', from:'2026-11-20', to:'2026-11-20', title:'…'})
 *       PSJLinks.sectionHtml(...) 給別的卡片嵌一小段（人數長條＋按鈕）
 */
(function (g) {
  'use strict';
  if (g.PSJLinks) return;
  var doc = g.document;
  function E(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function lang() { try { var l = localStorage.getItem('psjhr_lang') || localStorage.getItem('lang') || ''; if (/^"?1"?$/.test(l) || /^en/i.test(l)) return 'en'; if (/^"?2"?$/.test(l) || /^km/i.test(l)) return 'km'; } catch (e) {} return 'zh'; }
  function L(zh, en, km) { var l = lang(); return l === 'en' ? en : l === 'km' ? (km || en) : zh; }

  /* ---------- PSJHR 本機資料 ---------- */
  var DBP = null, EMP = null, FILES = null, BAT = {};
  function idb() {
    if (DBP) return DBP;
    DBP = new Promise(function (res) {
      try { var q = indexedDB.open('psjhr', 1); q.onupgradeneeded = function () { try { q.result.createObjectStore('kv'); } catch (e) {} }; q.onsuccess = function () { res(q.result); }; q.onerror = function () { res(null); }; q.onblocked = function () { res(null); }; } catch (e) { res(null); }
    });
    return DBP;
  }
  function get(k) {
    return idb().then(function (db) {
      return new Promise(function (res) {
        if (!db) return res(null);
        try { var t = db.transaction('kv').objectStore('kv').get(k); t.onsuccess = function () { res(t.result || null); }; t.onerror = function () { res(null); }; } catch (e) { res(null); }
      });
    });
  }
  function lineOf(s) { var m = String(s || '').toUpperCase().replace(/\s+/g, '').match(/^(?:SEWING)?(?:LINE|L)0*(\d{1,2})$/); return m ? 'LINE' + (+m[1]) : ''; }
  /* 組別 → 類別 */
  function catOf(grp, pos) {
    var G = String(grp || '').toUpperCase(), P = String(pos || '');
    if (lineOf(G)) return 'line';
    if (/^QC/.test(G)) return 'qc';
    if (/^PACKING|FINISH|IRON|整燙|包裝/.test(G) || /iron|press|finish|packing/i.test(P)) return 'pack';
    if (/^CUTTING|MARKER/.test(G)) return 'cut';
    if (/SERVICE ON LINE|SUPERVISOR SEWING|TRAINING LINE|SAMPLE LINE|MECHANIC|M&E|IE$|^PC$|PRODUCTION|WAREHOUSE/.test(G)) return 'sup';
    return 'other';
  }
  var CATS = { line: ['🧵', '這條線', 'This line'], qc: ['🔍', '品管 QC', 'QC'], pack: ['📦', '包裝／整燙', 'Packing / pressing'], cut: ['✂️', '裁剪', 'Cutting'], sup: ['🛠', '生產支援', 'Production support'] };
  function load() {
    if (EMP) return Promise.resolve(true);
    return get('db_v1').then(function (d) {
      if (!d) return false;
      EMP = {};
      (d.empdet || []).forEach(function (r) { if (r && r.emp_no != null) EMP[String(r.emp_no)] = { no: String(r.emp_no), name: r.name || '', en: r.name_en || '', grp: r.group || '', pos: r.position || '', join: r.join_date || '', sex: r.sex || '' }; });
      (d.emp || []).forEach(function (r) { var k = String(r.emp_no); if (!EMP[k]) EMP[k] = { no: k, name: r.name || '', grp: '', pos: '', join: r.join_date || '' }; });
      FILES = (d.hrfiles || []).filter(function (f) { return f && f.rep === 'att' && f.range && f.range[0]; });
      return true;
    });
  }
  function batch(key) {
    if (BAT[key]) return Promise.resolve(BAT[key]);
    return get('bat|' + key).then(function (b) {
      var rows = [];
      if (b && b.rows) { var C = b.cols || []; var ix = function (n) { return C.indexOf(n); }; var iNo = ix('emp_no'), iD = ix('date'), iIn = ix('time_in'), iOut = ix('time_out'), iH = ix('hrs_actual');
        b.rows.forEach(function (a) { rows.push({ no: String(a[iNo]), date: String(a[iD] || '').slice(0, 10), tin: a[iIn] || '', tout: a[iOut] || '', hrs: +a[iH] || 0 }); }); }
      BAT[key] = rows; return rows;
    });
  }
  /* 期間內有上班（有刷卡）的人：{工號: {days, tin, tout, hrs}} */
  function present(from, to) {
    var fs = FILES.filter(function (f) { return f.range[0] <= to && (f.range[1] || f.range[0]) >= from; });
    return Promise.all(fs.map(function (f) { return batch(f.key); })).then(function (all) {
      var P = {}, days = {};
      all.forEach(function (rows) { rows.forEach(function (r) {
        if (r.date < from || r.date > to || !(r.tin || r.tout)) return;
        var p = P[r.no] || (P[r.no] = { days: {}, tin: r.tin, tout: r.tout, hrs: 0 }); p.days[r.date] = 1; p.hrs += r.hrs; days[r.date] = 1; if (from === to) { p.tin = r.tin; p.tout = r.tout; }
      }); });
      Object.keys(P).forEach(function (k) { P[k].n = Object.keys(P[k].days).length; });
      return { P: P, nDays: Object.keys(days).length, files: fs.length };
    });
  }
  /* 主計算：回傳各類別的人（已排序） */
  function staff(o) {
    return load().then(function (ok) {
      if (!ok) return { ok: false };
      return present(o.from, o.to).then(function (pr) {
        var line = lineOf(o.line), last = FILES.reduce(function (m, f) { var e = f.range[1] || f.range[0]; return e > m ? e : m; }, ''), out = { ok: true, line: line, from: o.from, to: o.to, nDays: pr.nDays, files: pr.files, cats: {}, last: last };
        Object.keys(pr.P).forEach(function (no) {
          var e = EMP[no] || { no: no, name: '', grp: '', pos: '' }, c = catOf(e.grp, e.pos);
          if (c === 'line') { if (!line || lineOf(e.grp) !== line) { if (line) return; } }
          if (c === 'other') return;
          (out.cats[c] = out.cats[c] || []).push({ e: e, p: pr.P[no] });
        });
        Object.keys(out.cats).forEach(function (c) { out.cats[c].sort(function (a, b) { return String(a.e.pos).localeCompare(String(b.e.pos)) || String(a.e.grp).localeCompare(String(b.e.grp)) || a.e.no.localeCompare(b.e.no, undefined, { numeric: true }); }); });
        return out;
      });
    });
  }

  /* ---------- 畫面 ---------- */
  var CSS = '#psjl{position:fixed;inset:0;z-index:2147482000;background:rgba(15,23,42,.42);display:none;align-items:flex-end;justify-content:center}#psjl.on{display:flex}' +
    '#psjl .pl-bx{background:var(--vc-bg,#f4f7fb);width:100%;max-width:980px;height:94vh;border-radius:18px 18px 0 0;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 -10px 40px rgba(15,23,42,.3);font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;color:#1f2937}' +
    '@media(min-width:760px){#psjl{align-items:center}#psjl .pl-bx{height:90vh;border-radius:18px}}' +
    '#psjl .pl-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(15,23,42,.1);background:rgba(255,255,255,.7)}#psjl .pl-hd b{flex:1;min-width:0;font-size:15px}#psjl .pl-hd small{display:block;font-weight:500;color:#64748b;font-size:12px}' +
    '#psjl .pl-x{border:1px solid #cbd5e1;background:#fff;border-radius:10px;width:38px;height:38px;font-size:17px;cursor:pointer}' +
    '#psjl .pl-bd{flex:1;overflow:auto;padding:12px 14px 40vh;-webkit-overflow-scrolling:touch}' +
    '#psjl .pl-card{background:#fff;border:1px solid rgba(15,23,42,.12);border-radius:14px;padding:12px 14px;margin:0 0 12px;box-shadow:0 6px 16px rgba(15,23,42,.08)}' +
    '#psjl .pl-nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:0 0 10px}#psjl .pl-n{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:8px 10px}#psjl .pl-n i{display:block;font-style:normal;font-size:12px;color:#64748b}#psjl .pl-n b{font-size:24px;color:#0f172a}' +
    '#psjl .pl-bar{display:grid;grid-template-columns:minmax(120px,30%) 1fr auto;gap:10px;align-items:center;width:100%;text-align:left;border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:7px 10px;margin:0 0 6px;cursor:pointer;font:inherit;color:inherit}#psjl .pl-bar:hover{background:#f1f5f9}' +
    '#psjl .pl-bar .t{height:10px;border-radius:5px;background:#e2e8f0;overflow:hidden}#psjl .pl-bar .t i{display:block;height:100%;border-radius:5px;background:#3b82f6}#psjl .pl-bar .v{font-weight:700;font-variant-numeric:tabular-nums}' +
    '#psjl .pl-sec{margin:16px 0 6px;font-weight:800;font-size:14px;color:#334155;scroll-margin-top:8px}' +
    '#psjl .pl-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px}' +
    '#psjl .pl-p{display:flex;gap:10px;align-items:center;background:#fff;border:1px solid rgba(15,23,42,.12);border-radius:12px;padding:9px 10px;box-shadow:0 3px 8px rgba(15,23,42,.06)}' +
    '#psjl .pl-ph{width:48px;height:48px;border-radius:10px;background:#e2e8f0 center/cover no-repeat;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:22px}' +
    '#psjl .pl-p .m{min-width:0;flex:1}#psjl .pl-p .no{color:#1e40af;font-weight:700;font-variant-numeric:tabular-nums;font-size:12px}#psjl .pl-p .nm{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}#psjl .pl-p .sb{font-size:12px;color:#64748b}' +
    '#psjl .pl-p .r{text-align:right;font-variant-numeric:tabular-nums;font-size:12px;color:#334155;white-space:nowrap}' +
    '#psjl .pl-note{color:#64748b;font-size:12.5px;margin:4px 0 0}' +
    '.psjl-in{margin:10px 0 0;padding:10px 12px;border:1px dashed #93c5fd;border-radius:12px;background:rgba(239,246,255,.7)}.psjl-in .h{font-weight:700;font-size:13px;color:#1e3a8a;margin:0 0 6px}.psjl-in button{border:1px solid #bfdbfe;background:#fff;border-radius:999px;padding:5px 11px;margin:3px 4px 0 0;cursor:pointer;font:600 12.5px system-ui;color:#1e3a8a}';
  function css() { if (doc.getElementById('psjl-css')) return; var s = doc.createElement('style'); s.id = 'psjl-css'; s.textContent = CSS; (doc.head || doc.documentElement).appendChild(s); }
  var el = null;
  function ensure() {
    if (el) return el; css();
    el = doc.createElement('div'); el.id = 'psjl'; el.setAttribute('data-nobrick', '1');
    el.innerHTML = '<div class="pl-bx"><div class="pl-hd"><b><span class="pl-tt"></span><small class="pl-sub"></small></b><button class="pl-x" type="button" aria-label="close">✕</button></div><div class="pl-bd"></div></div>';
    el.addEventListener('click', function (e) {
      if (e.target === el || e.target.closest('.pl-x')) { el.classList.remove('on'); return; }
      var j = e.target.closest('[data-jump]'); if (j && LAST) { var d = j.getAttribute('data-jump'); open({ line: LAST.line, from: d, to: d, ops: null }); return; }
      var b = e.target.closest('[data-go]'); if (b) { var t = el.querySelector('#pl-' + b.getAttribute('data-go')); if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && el.classList.contains('on')) el.classList.remove('on'); });
    doc.body.appendChild(el); return el;
  }
  function photo(no, node) { get('photo|' + no).then(function (d) { var u = d && (d.data || d.url || (typeof d === 'string' ? d : '')); if (u && /^(data:|https?:|blob:)/.test(u)) { node.style.backgroundImage = 'url("' + u.replace(/"/g, '%22') + '")'; node.textContent = ''; } }); }
  function period(o) { return o.from === o.to ? o.from : o.from + ' ～ ' + o.to; }
  function render(o, r) {
    var B = el.querySelector('.pl-bd');
    if (!r.ok) { B.innerHTML = '<div class="pl-card">⚠️ ' + E(L('這台裝置還沒有 PSJHR 的資料。請先在這台裝置開一次 PSJHR（員工、出勤會自動下載），再回來點。', 'No PSJHR data on this device yet. Open PSJHR once on this device, then try again.', 'សូមបើក PSJHR ម្តងសិន')) + '</div>'; return; }
    var order = ['line', 'qc', 'pack', 'cut', 'sup'], have = order.filter(function (c) { return (r.cats[c] || []).length; });
    var single = o.from === o.to, mx = Math.max.apply(null, have.map(function (c) { return r.cats[c].length; }).concat([1]));
    var lineN = (r.cats.line || []).length, sewOp = (r.cats.line || []).filter(function (x) { return /sewing operator/i.test(x.e.pos); }).length;
    var h = '<div class="pl-card"><div class="pl-nums">' +
      (r.line ? '<div class="pl-n"><i>🧵 ' + E(r.line) + ' ' + E(L('出勤人數', 'present')) + '</i><b>' + lineN + '</b></div><div class="pl-n"><i>👤 ' + E(L('其中車工', 'Sewing operators')) + '</i><b>' + sewOp + '</b></div>' : '') +
      (o.ops != null ? '<div class="pl-n"><i>🏭 ' + E(L('生產報表的人數', 'Operators in production report')) + '</i><b>' + E(o.ops) + '</b></div>' : '') +
      '<div class="pl-n"><i>📅 ' + E(L('有出勤資料的天數', 'Days with attendance')) + '</i><b>' + r.nDays + '</b></div></div>';
    h += '<div class="pl-note" style="margin:0 0 8px">' + E(L('人數＝這段時間有刷卡上班的人（PSJHR）。點一條直接跳到那一群人，往下滑會一路接下去。', 'Headcount = people who clocked in during this period (PSJHR). Tap a bar to jump; keep scrolling to go through all.')) + '</div>';
    have.forEach(function (c) { var n = r.cats[c].length, C = CATS[c]; h += '<button type="button" class="pl-bar" data-go="' + c + '"><span>' + C[0] + ' ' + E(c === 'line' && r.line ? r.line : L(C[1], C[2])) + '</span><span class="t"><i style="width:' + Math.max(3, Math.round(n / mx * 100)) + '%"></i></span><span class="v">' + n + ' ' + E(L('人', 'ppl')) + '</span></button>'; });
    if (!have.length) { h += '<div class="pl-note">' + E(L('這段時間 PSJHR 還沒有出勤資料', 'No PSJHR attendance for this period yet')) + (r.last ? E(L('（PSJHR 出勤目前匯入到 ', ' (PSJHR attendance is imported up to ') + r.last + L('）', ')')) : '') + '。</div>';
      if (r.last && r.last < o.from) h += '<button type="button" class="pl-bar" data-jump="' + E(r.last) + '" style="margin-top:8px"><span>👉 ' + E(L('看最近有出勤的那一天 ', 'Show the latest day with attendance ') + r.last) + '</span><span></span><span class="v">›</span></button>'; }
    h += '</div>';
    have.forEach(function (c) {
      var C = CATS[c];
      h += '<div class="pl-sec" id="pl-' + c + '">' + C[0] + ' ' + E(c === 'line' && r.line ? r.line : L(C[1], C[2])) + ' · ' + r.cats[c].length + ' ' + E(L('人', 'ppl')) + '</div><div class="pl-grid">';
      r.cats[c].forEach(function (x) {
        var e = x.e, p = x.p;
        h += '<div class="pl-p"><div class="pl-ph" data-ph="' + E(e.no) + '">👤</div><div class="m"><div class="no">' + E(e.no) + '</div><div class="nm">' + E(e.name || e.en || '—') + '</div><div class="sb">' + E([e.grp, e.pos].filter(Boolean).join(' · ')) + '</div></div>' +
          '<div class="r">' + (single ? E((p.tin || '—') + ' – ' + (p.tout || '—')) : E(p.n + ' ' + L('天', 'd'))) + '<br>' + E((Math.round(p.hrs * 10) / 10) + 'h') + '</div></div>';
      });
      h += '</div>';
    });
    B.innerHTML = h;
    var ph = [].slice.call(B.querySelectorAll('[data-ph]'));
    var io = 'IntersectionObserver' in g ? new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { io.unobserve(x.target); photo(x.target.getAttribute('data-ph'), x.target); } }); }, { root: B, rootMargin: '200px' }) : null;
    ph.forEach(function (n) { if (io) io.observe(n); else photo(n.getAttribute('data-ph'), n); });
  }
  var LAST = null;
  function open(o) {
    o = o || {}; if (!o.from) return; o.to = o.to || o.from; LAST = o;
    ensure(); el.classList.add('on');
    el.querySelector('.pl-tt').textContent = (o.title || ((lineOf(o.line) || L('全廠', 'Factory')) + ' · ' + period(o))) + ' · ' + L('出勤人員', 'Staff present');
    el.querySelector('.pl-sub').textContent = L('資料來源：PSJHR（這台裝置上的出勤與員工資料）', 'Source: PSJHR attendance and staff on this device');
    el.querySelector('.pl-bd').innerHTML = '<div class="pl-card">⏳ ' + E(L('讀取 PSJHR 出勤…', 'Reading PSJHR attendance…')) + '</div>';
    staff(o).then(function (r) { render(o, r); }, function (e) { el.querySelector('.pl-bd').innerHTML = '<div class="pl-card">⚠️ ' + E(e && e.message || e) + '</div>'; });
  }
  /* 期間文字 → [from,to]：2026-11-20、2026-11、2026、2026-W47、11/20 */
  function rangeOf(s, yr) {
    s = String(s || '').trim(); var m;
    if ((m = s.match(/(20\d\d)-(\d{2})-(\d{2})\s*[~～至-]\s*(20\d\d)-(\d{2})-(\d{2})/))) return [m[1] + '-' + m[2] + '-' + m[3], m[4] + '-' + m[5] + '-' + m[6]];
    if ((m = s.match(/(20\d\d)[-\/.](\d{1,2})[-\/.](\d{1,2})/))) { var d = m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2); return [d, d]; }
    if ((m = s.match(/(20\d\d)[-\/.年](\d{1,2})(?!\d)/))) { var y = +m[1], mo = +m[2], last = new Date(y, mo, 0).getDate(); return [y + '-' + ('0' + mo).slice(-2) + '-01', y + '-' + ('0' + mo).slice(-2) + '-' + last]; }
    if ((m = s.match(/^(20\d\d)$/))) return [m[1] + '-01-01', m[1] + '-12-31'];
    if (yr && (m = s.match(/^(\d{1,2})\/(\d{1,2})/))) { var d2 = yr + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2); return [d2, d2]; }
    return null;
  }
  /* 給別的卡片嵌一段：按了開人員卡 */
  function sectionHtml(o) {
    if (!o || !o.from) return '';
    var key = 'psjl' + Math.random().toString(36).slice(2, 8); REG[key] = o;
    return '<div class="psjl-in"><div class="h">👥 ' + E((lineOf(o.line) || L('全廠', 'Factory')) + ' · ' + period(o)) + ' · ' + E(L('PSJHR 出勤人員', 'Staff present (PSJHR)')) + '</div><button type="button" data-psjl="' + key + '">🧵 ' + E(L('這條線的車工、組長', 'This line’s operators')) + ' ›</button><button type="button" data-psjl="' + key + '">🔍📦✂️ ' + E(L('品管、包裝、裁剪', 'QC, packing, cutting')) + ' ›</button></div>';
  }
  var REG = {};
  doc.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('[data-psjl]'); if (!b) return; var o = REG[b.getAttribute('data-psjl')]; if (o) { e.preventDefault(); e.stopPropagation(); css(); open(o); } }, true);
  g.PSJLinks = { open: open, staff: staff, rangeOf: rangeOf, lineOf: lineOf, sectionHtml: sectionHtml, version: 1 };
})(window);
