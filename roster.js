/* 신청 명단 → 조 · 역할 (학생 화면과 교사 콘솔이 같이 쓴다) */
(function (W) {
  'use strict';
  var CFG = W.LAW_CONFIG || {};
  var GROUPS = CFG.groups || ['1조', '2조', '3조', '4조'];
  var ROLES = CFG.roles || ['민사 변호사', '형사 변호사', '세무사', '노무사'];
  var ROLEKEY = ['민사', '형사', '세무', '노무'];
  var MAP = CFG.caseOfGroup || [1, 2, 3, 4];

  function ordered(signups) {
    return Object.keys(signups || {}).map(function (id) { return Object.assign({ id: id }, signups[id]); })
      .sort(function (a, b) { return (a.at || 0) - (b.at || 0); });
  }
  /* 정원 안의 신청을 1조, 2조 … 로. 조원은 역할 순서(민사→형사→세무→노무)로 */
  function groups(signups) {
    return ordered(signups).slice(0, GROUPS.length).map(function (rec, i) {
      var ms = (rec.members || []).map(function (m, k) { return Object.assign({}, m, { r: ROLES.indexOf(m.role), lead: k === 0 }); });
      ms.sort(function (a, b) { return a.r - b.r; });
      return { g: i + 1, label: GROUPS[i], id: rec.id, at: rec.at, members: ms, caseId: MAP[i] || (i + 1) };
    });
  }
  function find(signups, sid) {
    var gs = groups(signups);
    for (var i = 0; i < gs.length; i++) {
      for (var k = 0; k < gs[i].members.length; k++) if (String(gs[i].members[k].sid) === String(sid)) return { group: gs[i], member: gs[i].members[k] };
    }
    return null;
  }
  /* 학번 20315 → 2학년 3반 15번 */
  function cls(sid) { var s = String(sid || ''); return s.length === 5 ? { grade: +s[0], cls: +s.slice(1, 3), no: +s.slice(3) } : { grade: 0, cls: 0, no: 0 }; }

  W.LAWROSTER = { GROUPS: GROUPS, ROLES: ROLES, ROLEKEY: ROLEKEY, ordered: ordered, groups: groups, find: find, cls: cls,
    caseOf: function (id) { return (W.LAW_CASES || []).find(function (c) { return c.id === id; }) || null; } };
})(window);
