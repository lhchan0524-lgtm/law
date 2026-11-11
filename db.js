/* ══════════════════════════════════════════════════════════════════════
   LAWDB — 화면들을 잇는 얇은 층
     · 파이어베이스가 설정돼 있으면 → 기기와 기기를 잇는다 (실시간)
     · 비어 있으면                 → 한 브라우저 안에서만 잇는다 (연습 모드)
   모의투자 프로젝트의 db.js와 같은 방식입니다.

   rooms/<방 이름>/
     signup   참가 신청        { id: { members:[{name,sid,role,career}], at } }
     state    진행 상태        { step, open, qr, timer, at }        ← 교사만 씀
     pub      공개한 해설      { '1-민사': {...}, '1-x0': {...} }   ← 교사만 씀
     op       전문가 의견서    { g1: { r0: {...} } }               ← 학생
     rep      합동 상담 보고서 { g1: {...} }                        ← 학생 (조장)
     thanks   고마운 점        { g1: { r0: { to, text } } }        ← 학생
     reflect  성찰 과제        { s20315: {...} }                   ← 학생
   ══════════════════════════════════════════════════════════════════════ */
(function (W) {
  'use strict';

  var CFG = W.LAW_CONFIG || {};
  var FB = CFG.firebase || {};
  var ROOM = String(CFG.roomId || 'room').replace(/[.#$\[\]\/]/g, '-');
  var USE_FB = !!(FB.databaseURL && FB.apiKey);
  var BR = ['signup', 'state', 'pub', 'op', 'rep', 'thanks', 'reflect'];

  var cbs = {}, cache = {};
  BR.forEach(function (b) { cbs[b] = []; cache[b] = undefined; });
  var statCbs = [], status = { state: USE_FB ? 'connecting' : 'local' };

  function fire(b) { cbs[b].forEach(function (f) { try { f(cache[b] || (b === 'state' || b === 'pub' ? null : {})); } catch (e) {} }); }
  function setStatus(s) { status = { state: s, at: Date.now() }; statCbs.forEach(function (f) { try { f(status); } catch (e) {} }); }
  function clean(v) { return v === undefined ? null : JSON.parse(JSON.stringify(v)); }
  function on(b) { return function (cb) { cbs[b].push(cb); if (cache[b] !== undefined) { try { cb(cache[b] || (b === 'state' || b === 'pub' ? null : {})); } catch (e) {} } }; }

  /* ── 연습 모드 ── */
  var LK = 'lawcounsel.room.' + ROOM + '.';
  var BC = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('lawcounsel.' + ROOM) : null;
  function lread(b) { try { var v = localStorage.getItem(LK + b); return v == null ? null : JSON.parse(v); } catch (e) { return null; } }
  function lput(b, v) {
    try { if (v == null) localStorage.removeItem(LK + b); else localStorage.setItem(LK + b, JSON.stringify(v)); } catch (e) {}
    if (BC) { try { BC.postMessage({ b: b, v: v }); } catch (e) {} }
    cache[b] = v; fire(b);
  }
  /* 'op/g1/r2' 처럼 갈래 안 깊은 곳을 고친다. 다른 창이 막 쓴 최신 값에서 시작한다. */
  function lset(path, val) {
    var parts = path.split('/'), b = parts.shift();
    if (!parts.length) { lput(b, val); return; }
    var root = lread(b) || {}, o = root;
    for (var i = 0; i < parts.length - 1; i++) { if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
    if (val == null) delete o[parts[parts.length - 1]]; else o[parts[parts.length - 1]] = val;
    lput(b, root);
  }
  if (!USE_FB) {
    if (BC) BC.onmessage = function (e) { var d = e.data || {}; if (BR.indexOf(d.b) >= 0) { cache[d.b] = d.v; fire(d.b); } };
    W.addEventListener('storage', function (e) {
      if (!e.key || e.key.indexOf(LK) !== 0) return;
      var b = e.key.slice(LK.length); if (BR.indexOf(b) < 0) return;
      try { cache[b] = e.newValue == null ? null : JSON.parse(e.newValue); } catch (x) { return; }
      fire(b);
    });
    setTimeout(function () { BR.forEach(function (b) { cache[b] = lread(b); fire(b); }); }, 0);
  }

  /* ── 파이어베이스 모드 ── */
  var fdb = null, pending = [];
  function loadScript(src) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = function () { rej(new Error(src)); };
      document.head.appendChild(s);
    });
  }
  function fbDo(f) { if (fdb) f(); else pending.push(f); }
  function R(path) { return fdb.ref('rooms/' + ROOM + (path ? '/' + path : '')); }
  if (USE_FB) {
    var V = 'https://www.gstatic.com/firebasejs/10.12.0/';
    loadScript(V + 'firebase-app-compat.js')
      .then(function () { return loadScript(V + 'firebase-database-compat.js'); })
      .then(function () {
        if (!W.firebase.apps.length) W.firebase.initializeApp(FB);
        fdb = W.firebase.database();
        BR.forEach(function (b) { R(b).on('value', function (s) { cache[b] = s.val(); fire(b); }); });
        fdb.ref('.info/connected').on('value', function (s) { setStatus(s.val() ? 'online' : 'offline'); });
        pending.splice(0).forEach(function (f) { f(); });
      })
      .catch(function () { setStatus('error'); });
  }
  function timeout(p) {
    return new Promise(function (res, rej) {
      var t = setTimeout(function () { rej(new Error('시간이 초과되었습니다.')); }, 12000);
      p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); });
    });
  }
  function write(path, val) {
    val = clean(val);
    if (USE_FB) return timeout(new Promise(function (res, rej) { fbDo(function () { (val == null ? R(path).remove() : R(path).set(val)).then(function () { res(true); }, rej); }); }));
    lset(path, val); return Promise.resolve(true);
  }
  function key(s) { return String(s).replace(/[^0-9A-Za-z가-힣_-]/g, ''); }

  W.LAWDB = {
    mode: USE_FB ? 'firebase' : 'local',
    roomId: ROOM,
    onStatus: function (cb) { statCbs.push(cb); try { cb(status); } catch (e) {} },

    /* 참가 신청 */
    onSignups: on('signup'),
    addSignup: function (rec) {
      var r = clean(Object.assign({}, rec, { at: Date.now() }));
      if (USE_FB) return timeout(new Promise(function (res, rej) { fbDo(function () { var k = R('signup').push(); k.set(r).then(function () { res(k.key); }, rej); }); }));
      var id = 'L' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      lset('signup/' + id, r); return Promise.resolve(id);
    },
    removeSignup: function (id) { return write('signup/' + key(id), null); },
    clearSignups: function () { return write('signup', null); },

    /* 진행 (교사) */
    onState: on('state'),
    setState: function (st) { return write('state', Object.assign({}, st, { at: Date.now() })); },
    onPub: on('pub'),
    setPub: function (p) { return write('pub', p); },

    /* 학생 제출 */
    onOps: on('op'),
    submitOp: function (g, r, rec) { return write('op/g' + g + '/r' + r, Object.assign({}, rec, { at: Date.now() })); },
    clearOp: function (g, r) { return write('op/g' + g + '/r' + r, null); },
    onReps: on('rep'),
    submitRep: function (g, rec) { return write('rep/g' + g, Object.assign({}, rec, { at: Date.now() })); },
    clearRep: function (g) { return write('rep/g' + g, null); },
    onThanks: on('thanks'),
    submitThanks: function (g, r, rec) { return write('thanks/g' + g + '/r' + r, Object.assign({}, rec, { at: Date.now() })); },
    onReflect: on('reflect'),
    submitReflect: function (sid, rec) { return write('reflect/s' + key(sid), Object.assign({}, rec, { at: Date.now() })); },
    clearReflect: function () { return write('reflect', null); },

    /* 진행만 처음으로 — 참가 신청 명단과 성찰지는 남긴다 */
    clearProgress: function () {
      return Promise.all(['state', 'pub', 'op', 'rep', 'thanks'].map(function (b) { return write(b, null); }));
    }
  };
})(window);
