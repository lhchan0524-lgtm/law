/* ══════════════════════════════════════════════════════════════════════
   LAWREC — 학생 한 명의 활동 기록으로 창체 특기사항 초안을 만든다
     · 자율·자치활동용 / 진로활동용 두 가지
     · 근거: 교사 관찰(태그·메모) > 의견서·역할·회의 기록 > 학생 성찰(보조)
     · 외부로 보내지 않는다 — 이 파일 안의 틀로만 조합한다
     · 초안일 뿐이다: 담임 선생님이 학생을 아는 만큼 고쳐 쓴다
   ══════════════════════════════════════════════════════════════════════ */
(function (W) {
  'use strict';

  function josa(word, a, b) {
    const w = String(word || '').replace(/[^가-힣A-Za-z0-9]+$/, '');
    const c = w.charCodeAt(w.length - 1);
    if (c >= 0xAC00 && c <= 0xD7A3) return word + (((c - 0xAC00) % 28) ? a : b);
    return word + (/[013678]$/.test(w) ? a : b);
  }
  function bytes(t) { let n = 0; for (const ch of String(t || '')) n += ch === '\n' ? 2 : (ch.charCodeAt(0) > 127 ? 3 : 1); return n; }
  const chars = (t) => [...String(t || '').replace(/\n/g, '')].length;

  /* 생활기록부에 쓰면 안 되는 말 — 대회 성격·순위, 실제 상호 */
  const BAN = ['대회', '우승', '준우승', '순위', '등수', '1위', '2위', '3위', '수상', '시상', '상금', '입상', '최우수', '우수상', '장려상'];
  function banned(t) { return BAN.filter((w) => String(t || '').indexOf(w) >= 0); }

  function grams(t) { const s = String(t || '').replace(/\s+/g, ''); const g = new Set(); for (let i = 0; i + 3 <= s.length; i++) g.add(s.slice(i, i + 3)); return g; }
  function similarity(a, b) { const A = grams(a), B = grams(b); if (!A.size || !B.size) return 0; let n = 0; A.forEach((x) => { if (B.has(x)) n++; }); return n / (A.size + B.size - n); }
  function pick(list, seed, k) { let h = 7; const s = String(seed) + '|' + k; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return list[h % list.length]; }

  /* 역할이 하는 일 — 진로 초안 첫머리 */
  const JOB = {
    '민사 변호사': ['사람 사이의 계약과 손해배상 문제를 다루는 민사 변호사', '계약·손해배상처럼 개인 사이의 권리와 의무를 다루는 민사 변호사'],
    '형사 변호사': ['어떤 행위가 범죄의 요건에 해당하는지 따지는 형사 변호사', '행위가 처벌 대상인지 법의 요건에 비추어 판단하는 형사 변호사'],
    '세무사': ['소득과 재산의 종류에 따라 세금 문제를 판단하는 세무사', '돈의 성격을 가려 세금을 내야 하는지, 돌려받을 수 있는지를 판단하는 세무사'],
    '노무사': ['일하는 사람과 고용한 사람 사이의 권리와 의무를 판단하는 노무사', '근로계약과 임금, 근로시간을 법에 비추어 판단하는 노무사']
  };

  /* 교사 관찰 태그 → 문장 (학업 · 인성 요소) */
  const TAG = {
    '조문 근거 제시':    ['법령에서 조문을 직접 찾아 판단마다 근거를 먼저 제시함.', '막연한 생각 대신 조문을 근거로 들어 자신의 판단을 설명함.'],
    '쟁점 정리 주도':    ['의뢰인의 사연에서 쟁점을 가려내 조원들이 무엇을 따져야 하는지 정리함.', '얽혀 있는 문제들을 쟁점별로 나누어 회의의 순서를 제안함.'],
    '다른 분야와 연결':  ['자신이 맡은 분야의 결론이 다른 분야의 판단에 따라 달라지는 지점을 찾아 연결함.', '다른 전문가의 판단을 자신의 쟁점과 이어 의뢰인에게 통합된 조언을 만드는 데 기여함.'],
    '공감하는 조언':     ['의뢰인의 걱정을 먼저 헤아린 뒤 해야 할 일을 쉬운 말로 안내하여 상대의 처지를 생각하는 태도를 보임.', '법을 모르는 의뢰인의 입장에서 조언을 다듬어 공감하는 태도를 보임.'],
    '끝까지 경청':       ['다른 의견을 끝까지 듣고 질문하며 근거를 비교하는 열린 태도를 보임.', '조원의 의견을 끝까지 경청한 뒤 자신의 생각을 덧붙여 논의를 이어 감.'],
    '판단을 고침':       ['새로운 증거와 조원의 근거를 받아들여 처음 판단을 스스로 고치는 유연함을 보임.', '자신의 판단이 근거와 맞지 않음을 알아차리고 수정하는 열린 태도를 보임.'],
    '조원 도움':         ['조문 검색에 어려움을 겪는 조원에게 찾는 방법을 알려 주어 조 전체가 시간 안에 의견서를 마치도록 도움.', '어려워하는 조원을 도와 함께 결론에 이르도록 이끎.'],
    '추가 쟁점 탐구':    ['필수 쟁점을 해결한 뒤 남은 시간에 추가 쟁점까지 스스로 탐구함.', '주어진 쟁점에 그치지 않고 관련된 문제를 더 찾아 검토함.']
  };
  const TAGS = Object.keys(TAG);
  const CAREER_TAGS = ['조문 근거 제시', '다른 분야와 연결', '추가 쟁점 탐구', '판단을 고침'];

  function q(t) { return String(t || '').replace(/\s+/g, ' ').trim().replace(/[?？]$/, ''); }
  function law(op) {
    const L = ((op && op.laws) || []).filter((x) => x && String(x.name || '').trim());
    return L.map((x) => q(x.name) + (x.art ? ' ' + q(x.art) : '')).slice(0, 2);
  }
  function memo(t) { t = q(t); if (!t) return ''; return /[.다함음됨임]$/.test(t) ? (/[.]$/.test(t) ? t : t + '.') : t + '.'; }
  function fit(parts, max) {
    let out = '';
    for (const p of parts) { if (!p) continue; const next = out ? out + ' ' + p : p; if (chars(next) > max) continue; out = next; }
    return out;
  }

  /* S = { name, sid, role, client, caseTitle, must, more, when, op, obs:{tags,memo}, thanks:{text,from}, did, reflect:{ans,career}, follow, program } */
  function auto(S, max) {
    const seed = S.sid, P = S.program || '생활법률 합동상담', L = law(S.op), tags = (S.obs && S.obs.tags) || [];
    const parts = [];
    parts.push((S.when ? S.when + ' ' : '') + '\'' + P + '\'에서 ' + josa(S.role, '을', '를') + ' 맡아 ' + (S.client ? S.client + '의 사연 가운데 ' : '') + '\'' + q(S.must) + '\'라는 쟁점을 검토함.');
    if (L.length) parts.push(pick([
      josa(L.length > 1 ? josa(L[0], '과', '와') + ' ' + L[1] : L[0], '을', '를') + ' 직접 찾아 판단의 근거로 제시하고, 증거와 조문을 연결해 의뢰인에게 할 조언을 정리함.',
      '국가법령정보센터에서 ' + josa(L[0], '을', '를') + ' 찾아 증거와 연결하고, 이를 바탕으로 의뢰인이 지금 해야 할 일을 안내함.'], seed, 'law'));
    tags.filter((t) => TAG[t]).slice(0, 3).forEach((t) => parts.push(pick(TAG[t], seed, t)));
    if (S.obs && S.obs.memo) parts.push(memo(S.obs.memo));
    if (S.did && q(S.did).length >= 8 && !tags.length) parts.push('합동 상담 회의에서 조원들과 쟁점별 결론을 맞추고 의뢰인이 먼저 할 일의 순서를 정하는 데 참여함.');
    if (S.thanks && q(S.thanks.text).length >= 8) parts.push(pick(['조원의 상호 평가에서 회의에 기여한 점을 구체적으로 인정받을 만큼 협력적인 태도를 보임.', '함께한 조원에게서 회의를 도운 점을 구체적으로 평가받는 등 협력하는 태도를 보임.'], seed, 'thx'));
    const a4 = S.reflect && S.reflect.ans && q(S.reflect.ans[3]);
    if (a4 && a4.length >= 15) parts.push(pick(['활동 후 성찰에서 법이 약한 처지의 사람을 보호하는 방식에 주목하고, 전문가가 갖추어야 할 태도를 스스로 정리함.', '활동을 돌아보며 법이 사회적 약자를 보호하는 장치를 발견하고 의뢰인의 처지를 먼저 이해하려는 자세를 다짐함.'], seed, 'r4'));
    return fit(parts, max);
  }

  function career(S, max) {
    const seed = S.sid, P = S.program || '생활법률 합동상담', L = law(S.op), tags = (S.obs && S.obs.tags) || [];
    const want = q((S.reflect && S.reflect.career) || S.career);
    const parts = [];
    parts.push((want ? josa(want, '을', '를') + ' 희망하는 학생으로, ' : '') + (S.when ? S.when + ' ' : '') + '\'' + P + '\'에서 ' + pick(JOB[S.role] || [S.role], seed, 'job') + ' 역할을 맡음.');
    parts.push('\'' + q(S.must) + '\'라는 의뢰인의 문제를 ' + (L.length ? josa(L.join(', '), '을', '를') + ' 근거로 ' : '') + '검토하며 실제 전문가가 사실관계를 증거로 확인하고 법 조문에 비추어 판단하는 과정을 경험함.');
    if (S.op && q(S.op.more).length >= 15 && S.more) parts.push('추가 쟁점인 \'' + q(S.more) + '\'까지 스스로 탐구함.');
    tags.filter((t) => CAREER_TAGS.indexOf(t) >= 0).slice(0, 2).forEach((t) => parts.push(pick(TAG[t], seed, 'c' + t)));
    if (S.obs && S.obs.memo && !tags.length) parts.push(memo(S.obs.memo));
    const a5 = S.reflect && S.reflect.ans && q(S.reflect.ans[4]);
    if (a5 && a5.length >= 15) parts.push(pick(['활동 후 성찰에서 맡은 역할의 업무가 자신의 진로와 이어지는 지점을 구체적으로 정리함.', '활동을 돌아보며 오늘 경험한 업무와 희망 진로의 관련성을 스스로 탐색함.'], seed, 'r5'));
    const a3 = S.reflect && S.reflect.ans && q(S.reflect.ans[2]);
    if (a3 && a3.length >= 15) parts.push('다른 분야 전문가의 판단을 들으며 하나의 문제에 여러 법이 함께 작용함을 이해함.');
    if (S.follow && q(S.follow)) parts.push(memo(S.follow));
    return fit(parts, max);
  }

  W.LAWREC = { TAGS: TAGS, build: function (S, lim) { lim = lim || {}; return { auto: auto(S, lim.autoMax || 500), career: career(S, lim.careerMax || 700) }; },
    chars: chars, bytes: bytes, banned: banned, similarity: similarity };
})(window);
