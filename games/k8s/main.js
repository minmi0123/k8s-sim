// 쿠버네티스 회사: 장면 목록 · 시작 · 점검용 window.sim
'use strict';

// ===== 장면 목록 · 시작 =====

const SCENES = [
  { m: '① 퇴사 → 재채용', t: '① Pod 삭제 → 재생성', sc: SCENE1 },
  { m: '② 신입 자리 배치', t: '② 스케줄링', sc: SCENE2 },
  { m: '③ 채용 요청서 따라가기', t: '③ apply → Pod 실행', sc: SCENE3 },
  { m: '④ 층 정전', t: '④ 노드 장애', sc: SCENE4 },
  { m: '⑤ 책상 크기 초과', t: '⑤ limits · OOMKilled', sc: SCENE5 },
  { m: '⑥ 업무 매뉴얼 개정', t: '⑥ 롤링 업데이트 · 프로브', sc: SCENE6 },
  { m: '⑦ 대표번호 연결', t: '⑦ Service · DNS', sc: SCENE7 },
];
SC = SCENE1;
buildSceneTabs();
initScreens();
drawTitle();
reset();
setMode('m');
requestAnimationFrame(frame);

window.sim = {
  get S() { return S; }, setMode, next, replay, reset, clickPod, choose, CHOICES2,
  scene: (i) => { show('sim'); switchScene(SCENES[i - 1].sc); }, show, get screen() { return screen; }, DEX,
  get cur() { return cur; }, get busy() { return busy; },
  get last() { return lastStep(); }, set seed(v) { seed = v | 0; },   // 점검용
};
