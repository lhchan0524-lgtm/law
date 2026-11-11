/* 활동 단계 — 교사 콘솔 · 공지 화면 · 학생 화면이 같이 쓴다 */
(function (W) {
  'use strict';
  var G = ((W.LAW_CONFIG || {}).groups) || ['1조', '2조', '3조', '4조'];
  var S = [
    { key: 'wait', name: '시작 전', min: 0,
      say: '오늘 여러분은 법률·세무 합동 상담소의 전문가입니다.',
      list: ['공지 화면의 QR을 찍어 <mark>의견서 작성기</mark>에 들어오세요.', '내 조와 이름을 고르고, 학번으로 확인합니다.', '들어오면 선생님이 시작할 때까지 기다립니다.'] },
    { key: 'intake', name: '의뢰가 접수되었습니다', min: 3,
      say: '이 사연에는 법 네 분야가 모두 얽혀 있습니다.',
      list: ['조마다 <mark>다른 의뢰인</mark>이 상담 신청서를 보냈습니다.', '휴대폰의 <mark>사연</mark> 탭과 종이 증거 자료를 함께 읽습니다.', '의견서 탭에서 내 역할의 <mark>필수 쟁점</mark>을 확인하세요.'] },
    { key: 'solo', name: '전문가별 개인 검토', min: 25,
      list: ['<mark>필수 쟁점</mark>부터 해결하고, "더 찾아보기"는 시간이 남으면 도전합니다.', '국가법령정보센터에서 조문을 찾습니다. 조문은 <mark>필수 1개</mark>면 충분합니다.', '<mark>판단 단서</mark>와 <mark>개념 카드</mark>를 활용하고, 조문은 내 말로 옮겨 적으세요.', '조언은 <mark>의뢰인의 걱정을 알아주는 말</mark>로 시작합니다. 다 쓰면 [제출].'] },
    { key: 'meet', name: '합동 상담 회의', min: 12,
      list: ['보고서 탭에서 조원들의 의견서를 읽고, <mark>혼자서는 답이 안 나오는 문제</mark> 두 개를 찾습니다.', '의뢰인이 <mark>가장 먼저 해야 할 일 3가지</mark>와 그 순서의 이유를 정합니다.', '다른 전문가의 의견을 <mark>끝까지 듣고</mark>, 결론이 갈리면 근거를 비교해 조율합니다.', '회의에서 내가 한 일을 적고, <mark>다음 역할 친구에게 고마운 점</mark>을 한 줄 써 줍니다.'] }
  ];
  G.forEach(function (g, i) {
    S.push({ key: 'pres', group: i + 1, name: g + ' 발표', min: 2,
      list: ['"의뢰인 ○○ 씨는 ~한 상황입니다."로 <mark>30초</mark> 동안 사연을 소개합니다.', '"가장 먼저 할 일은 첫째, 둘째, 셋째"로 <mark>1분 30초</mark> 동안 조언합니다.', '듣는 조는 다른 의뢰인이라면 무엇이 달랐을지 생각해 보세요.'] });
  });
  S.push({ key: 'end', name: '마무리', min: 2,
    list: ['의견서와 합동 상담 보고서가 모두 제출됐는지 확인합니다.', '휴대폰의 <mark>해설</mark> 탭에서 공개된 해설을 내 의견서와 비교해 보세요.', '공지 화면의 QR로 <mark>성찰 과제</mark>를 열고, 다음 시간까지 제출합니다.'] });

  function at(i) { return S[Math.max(0, Math.min(S.length - 1, i || 0))]; }
  W.LAWSTEPS = {
    list: S,
    at: at,
    /* 무엇을 낼 수 있나 — 교사가 [제출 다시 열기]를 켜면 모두 열린다 */
    can: function (st, what) {
      st = st || {}; var i = st.step || 0, k = at(i).key;
      if (st.reopen) return true;
      if (what === 'read') return i >= 1;
      if (what === 'op') return i >= 1 && i <= 3;
      if (what === 'rep') return i >= 2 && k !== 'end';
      if (what === 'thanks') return i >= 3;
      return false;
    }
  };
})(window);
