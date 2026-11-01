// 쿠버네티스 회사: 장면 ⑥ 대본
'use strict';

// ===== 장면 ⑥ 업무 매뉴얼 개정 (대본) — 롤링 업데이트 · 롤백 · 프로브 =====

const URL_PROBE = 'https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/';
const CHOICES6 = [
  { m: '매뉴얼 v2로 개정', t: 'image web:v2 (롤링 업데이트)', k: 'a' },
  { m: '잘못된 매뉴얼 v3', t: 'image web:v3 (준비 실패 → 롤백)', k: 'b' },
  { m: '일하다 멍해짐', t: 'liveness probe 실패', k: 'c' },
  { m: '잠깐 바쁨', t: 'readiness probe 실패', k: 'd' },
];

function steps6() {
  const k = S.plan && S.plan.k, N = S.hero ? S.hero.mn : '', V = k === 'b' ? 'v3' : 'v2';
  const head = {
    m: ['영업팀 3명이 매뉴얼 v1로 근무 중임. 책상 위 책 색 = 매뉴얼 판(파랑 v1).', '아래에서 일을 고르면 시작됨.'],
    t: ['Deployment web: replicas 3, image web:v1. 책 색 = 이미지 버전(파랑 v1).', '아래에서 상황을 고르면 시작됨.'],
    ref: 'Deployment의 Pod 템플릿(이미지 등)이 바뀌면 롤링 업데이트가 일어남. 프로브는 kubelet이 컨테이너에 주기적으로 묻는 점검임(readiness·liveness·startup).',
    url: URL_DEPLOY,
  };
  const edit = {
    m: [`관리자가 계획서의 매뉴얼을 ${V}로 고쳐 창구에 냄.`, '창구가 장부의 계획서를 고치고 방송함. 직원은 아직 그대로.'],
    t: [`kubectl set image로 Deployment의 Pod 템플릿 image가 web:${V}로 바뀜.`, 'etcd에 저장되고 watch 이벤트가 나감. Pod는 아직 그대로.'],
    clock: C1,
    ref: '롤아웃은 Deployment의 Pod 템플릿(.spec.template)이 바뀔 때만 일어남. replicas만 바꾸는 것(스케일)은 롤아웃이 아님.',
    url: `${URL_DEPLOY}#updating-a-deployment`,
  };
  const newRs = {
    m: [`기획 담당: 매뉴얼이 바뀜 → ${V}용 새 정원표를 1명으로 만듦.`, '기존 v1 정원표는 그대로 3명. 정원보다 1명까지만 더 둘 수 있기 때문.'],
    t: ['Deployment 컨트롤러가 새 템플릿용 ReplicaSet을 replicas 1로 만듦.', '이전 ReplicaSet은 3 그대로. maxSurge 25% → 3개 기준 1개까지 초과 허용.'],
    clock: C1,
    ref: '기본 전략은 RollingUpdate. maxSurge 25%(올림 → 1), maxUnavailable 25%(내림 → 0). 그래서 3개 기준으로 잠깐 4개까지 늘고, 준비된 Pod가 3개 밑으로 내려가지 않음.',
    url: `${URL_DEPLOY}#rolling-update-deployment`,
  };
  const newPod = {
    m: [`정원 담당이 ${V} 신입 1명을 뽑고, 자리배치를 거쳐 출근함.`, '출근은 했지만 아직 \'준비 안 됨\' — 새 매뉴얼을 익히는 중.'],
    t: ['ReplicaSet 컨트롤러 → Pod 생성 → 스케줄링 → kubelet이 컨테이너 실행.', `web:${V} 컨테이너는 Running이지만 readiness 성공 전이라 Ready가 아님.`],
    clock: '실제 수 초 ~ 수십 초',
    ref: '생성 → 바인딩 → 실행 과정은 장면 ①~③과 같아서 줄여 보여 줌. Running이어도 readiness probe가 성공하기 전에는 Ready가 아님.',
    url: `${URL_PROBE}#readiness-probe`,
  };

  if (k === 'a') {
    return [head, edit, newRs, newPod,
      {
        m: ['층 관리자가 신입에게 "일할 준비 됐나?"를 물음 → 됐음 ✓.', '장부에 \'근무\'로 적힘. 이 순간 일하는 직원은 4명(1명 초과 허용 범위).'],
        t: ['kubelet의 readiness probe(예: HTTP GET /ready) 성공 → Pod Ready.', 'READY 4/3 — maxSurge 범위 안에서 잠깐 1개 많음.'],
        clock: '실제 10초 간격으로 확인 (periodSeconds 기본값)',
        ref: 'readiness probe는 요청을 받을 준비가 됐는지 확인함. 실패해도 재시작하지 않고 Service 연결 대상에서만 뺌(장면 ⑦). 정원표·계획서 숫자는 실제로는 각 컨트롤러가 갱신함 — 여기선 함께 바뀌게 단순화.',
        url: `${URL_PROBE}#readiness-probe`,
      },
      {
        m: ['기획 담당: v2 1명이 준비됨 → v1 정원표를 3명 → 2명으로 줄임.', '정원 담당이 v1 직원 1명을 퇴사 처리함. 같은 층에 팀원이 많은 쪽부터.'],
        t: ['Deployment 컨트롤러가 이전 ReplicaSet replicas를 3 → 2로 줄임.', 'ReplicaSet 컨트롤러가 v1 Pod 1개 삭제. 같은 노드에 관련 Pod가 많은 쪽부터.'],
        clock: C1,
        ref: '새 Pod가 Ready가 되어야 옛 Pod를 줄임(maxUnavailable 0) → 준비된 Pod가 3개 밑으로 안 내려감. 줄일 Pod는 ReplicaSet 컨트롤러가 고름(준비 안 된 것, 같은 노드에 관련 Pod가 많은 것, 최근에 생긴 것 등의 순).',
        url: `${URL_DEPLOY}#rolling-update-deployment`,
      },
      {
        m: ['같은 과정을 두 번 더 반복함(빠르게 보여 줌): v2 1명 준비 → v1 1명 퇴사.', 'v2가 3명, v1이 0명이 되면 끝.'],
        t: ['롤아웃이 끝날 때까지 반복(빠르게 보여 줌): 새 ReplicaSet +1 → Ready 확인 → 이전 ReplicaSet −1.', '새 ReplicaSet 3/3, 이전 ReplicaSet 0.'],
        clock: '실제 수십 초 ~ 수 분 (Pod 수 · 준비 시간에 따라)',
        ref: 'Deployment 컨트롤러는 maxSurge·maxUnavailable 범위 안에서 새 ReplicaSet을 늘리고 이전 ReplicaSet을 줄이기를 반복함.',
        url: `${URL_DEPLOY}#rolling-update-deployment`,
      },
      {
        m: ['개정 끝. 일하는 직원이 3명 밑으로 내려간 적이 없음.', 'v1 정원표는 0명으로 장부에 남겨 둠 — 되돌릴 때 씀.', AGAIN.m],
        t: ['롤아웃 완료. 준비된 Pod가 3개 밑으로 내려간 적 없음(무중단).', '이전 ReplicaSet은 replicas 0으로 남음 → kubectl rollout undo에 쓰임.', AGAIN.t],
        ref: '이전 ReplicaSet은 revisionHistoryLimit(기본 10)개까지 남겨 둠. kubectl rollout undo는 이전 판의 템플릿으로 되돌림.',
        url: `${URL_DEPLOY}#rolling-back-a-deployment`,
      },
    ];
  }
  if (k === 'b') {
    return [head, edit, newRs, newPod,
      {
        m: ['"일할 준비 됐나?"를 물어도 계속 아님 ✗ — v3에 오류가 있음.', '기획 담당은 v1을 줄이지 않음. v1 3명이 계속 일하므로 업무는 멈추지 않음.'],
        t: ['readiness probe가 계속 실패 → Ready가 안 됨.', 'maxUnavailable 0 → 이전 Pod를 줄이지 않음. v1 Pod 3개로 계속 서비스. 롤아웃 정지.'],
        clock: '실제 10초마다 다시 확인',
        ref: '롤링 업데이트는 새 Pod가 Ready가 되어야 다음으로 넘어감. 그래서 잘못된 판이 전체로 퍼지지 않음.',
        url: `${URL_DEPLOY}#rolling-update-deployment`,
      },
      {
        m: ['정해진 시간이 지나도 진척이 없음 → 계획서에 \'진행 실패\'가 적힘.', '스스로 되돌리지는 않음. 표시만 함.'],
        t: ['progressDeadlineSeconds 초과 → Progressing=False (ProgressDeadlineExceeded).', '쿠버네티스는 자동 롤백을 하지 않음. 상태만 기록함.'],
        clock: '실제 10분 (progressDeadlineSeconds 기본 600초)',
        ref: '정해진 시간 안에 진척이 없으면 Deployment 컨트롤러가 condition(type Progressing, status False, reason ProgressDeadlineExceeded)을 기록함. 그 외 조치는 하지 않음 — 되돌리기는 사람이나 외부 도구가 함.',
        url: `${URL_DEPLOY}#failed-deployment`,
      },
      {
        m: ['관리자가 \'되돌리기\'를 냄 → 계획서의 매뉴얼이 v1로 돌아감.', '기획 담당이 v3 정원표를 0명으로 → v3 신입 퇴사. v1 정원표는 그대로 3명.'],
        t: ['kubectl rollout undo → 템플릿이 이전 판(web:v1)으로 돌아감.', 'v1 ReplicaSet을 새로 만들지 않고 다시 씀. v3 ReplicaSet은 0 → Pod 삭제.'],
        clock: C1,
        ref: 'rollout undo는 이전 revision의 템플릿을 Deployment에 다시 적음. 같은 템플릿의 ReplicaSet이 이미 있으면 새로 만들지 않고 그것을 씀.',
        url: `${URL_DEPLOY}#rolling-back-a-deployment`,
      },
      {
        m: ['원래대로 v1 3명. v3 직원은 준비가 안 돼 실제 업무를 한 번도 맡지 않았음.', 'v3 정원표는 0명으로 남음.', AGAIN.m],
        t: ['v1 ReplicaSet 3/3. Ready가 안 된 v3 Pod에는 요청이 가지 않았음.', 'v3 ReplicaSet은 replicas 0으로 이력에 남음.', AGAIN.t],
        ref: 'Ready가 아닌 Pod는 Service 대상에서 빠지므로 요청을 받지 않음(장면 ⑦). readiness probe가 잘못된 배포를 막는 안전장치가 됨.',
        url: `${URL_PROBE}#readiness-probe`,
      },
    ];
  }
  if (k === 'c') {
    return [head,
      {
        m: [`2층 직원(${N})이 일하다 멍해짐. 자리에는 있지만 아무 일도 안 함.`, '쓰러진 게 아니라서(⑤와 다름) 저절로 다시 일으켜지지 않음.'],
        t: ['컨테이너 프로세스는 살아 있지만 응답하지 않음(교착 상태 등).', '프로세스가 종료되지 않았으므로 restartPolicy만으로는 재시작되지 않음.'],
        ref: 'restartPolicy는 컨테이너가 종료됐을 때만 동작함. 살아 있지만 고장 난 상태는 liveness probe로 알아내야 함.',
        url: `${URL_PROBE}#liveness-probe`,
      },
      {
        m: ['층 관리자가 주기적으로 "괜찮나?"를 물음 → 대답 없음 ✗.', '3번 연속 대답이 없으면 고장으로 판단함.'],
        t: ['kubelet의 liveness probe가 실패함.', 'failureThreshold(기본 3)번 연속 실패 → 컨테이너를 재시작하기로 함.'],
        clock: '실제 약 30초 (10초 간격 × 3번)',
        ref: 'liveness probe가 정해진 횟수(failureThreshold 기본 3, periodSeconds 기본 10초)만큼 연속 실패하면 kubelet이 컨테이너를 재시작함.',
        url: `${URL_PROBE}#liveness-probe`,
      },
      {
        m: ['층 관리자가 같은 자리에서 직원을 다시 깨움 → 재시작 1회. 퇴사 아님.', '출근 준비가 오래 걸리는 직원은 \'출근 확인\'이 끝날 때까지 이 점검을 미룸.', AGAIN.m],
        t: ['kubelet이 컨테이너를 죽이고 다시 띄움 → RESTARTS +1. Pod는 그대로.', '시작이 느린 앱은 startup probe가 성공할 때까지 liveness를 미룸.', AGAIN.t],
        ref: 'liveness 실패는 ⑤의 OOMKilled처럼 같은 Pod 안의 컨테이너 재시작으로 이어짐. startup probe를 두면 그것이 성공하기 전에는 liveness·readiness 검사를 하지 않음 → 시작 중에 재시작되는 일을 막음.',
        url: `${URL_PROBE}#startup-probe`,
      },
    ];
  }
  if (k === 'd') {
    return [head,
      {
        m: [`2층 직원(${N})이 잠깐 일이 밀려 새 일을 받을 여유가 없음.`, '멍한 게 아니라 바쁜 것. 곧 괜찮아짐.'],
        t: ['컨테이너가 일시적으로 바빠 readiness 검사에 실패를 돌려줌.', '예: 의존 서비스 대기, 캐시 다시 채우기.'],
        ref: 'readiness는 "지금 요청을 받을 수 있나"를 묻는 것. 살아 있는지(liveness)와는 다른 질문임.',
        url: `${URL_PROBE}#readiness-probe`,
      },
      {
        m: ['층 관리자가 "새 일 받을 수 있나?"를 물음 → 아니오 ✗.', '장부에 \'준비 안 됨\'. 깨우거나 내보내지 않고, 새 일만 안 보냄.'],
        t: ['readiness probe 실패 → Ready=False. 재시작하지 않음.', 'Service 연결 대상에서 빠져 새 요청이 안 감(장면 ⑦).'],
        clock: '실제 10초 간격으로 확인',
        ref: 'readiness probe가 실패하면 EndpointSlice 컨트롤러가 이 Pod의 IP를 Service의 EndpointSlice에서 뺌. 컨테이너는 재시작되지 않음.',
        url: `${URL_PROBE}#readiness-probe`,
      },
      {
        m: ['일이 줄자 다시 "받을 수 있음" ✓ → 장부에 \'근무\'. 재시작 0회.', '멍함(liveness) = 다시 깨움, 바쁨(readiness) = 잠깐 빼 둠.', AGAIN.m],
        t: ['readiness 다시 성공 → Ready=True, Service 대상에 복귀. RESTARTS 0.', 'liveness 실패 = 재시작, readiness 실패 = 요청에서만 제외.', AGAIN.t],
        ref: '두 프로브는 따로 설정하고, 결과도 따로 처리됨(liveness → 재시작, readiness → 엔드포인트 제외).',
        url: `${URL_PROBE}#when-to-use-each-probe`,
      },
    ];
  }
  return [head];
}

function addPod6(node, desk, ver) {
  const p = addPod(node, desk);
  Object.assign(p, { ver, rs: 'rs' + ver, tn: `${RS_VER[ver]}-${p.sfx}` });
  return p;
}
const VERS = (v) => S.pods.filter((p) => p.ver === v && p.state === 'run');
// 정원표 · 계획서의 근무 수를 장부의 직원 줄로 다시 센다 (실제로는 각 컨트롤러가 갱신 — 단순화)
function sync6() {
  let sum = 0;
  S.ledger.filter((e) => e.kind === 'rs').forEach((r) => {
    r.ready = S.ledger.filter((q) => q.rs === r.id && q.st === 'run').length;
    sum += r.ready;
  });
  const d = entry('dep');
  if (d) d.ready = sum;
}
function freestRoom() {   // 가장 비어 있는 층, 같으면 무작위
  const free = ROOM_X.map((_, n) => 2 - occ(n));
  const best = Math.max(...free);
  const top = free.map((v, n) => (v === best ? n : -1)).filter((n) => n >= 0);
  return top[Math.floor(rnd() * top.length)];
}
function pickVictim(v) {  // 같은 층에 팀원이 많은 쪽부터, 같으면 무작위
  const vs = VERS(v), cnt = (p) => S.pods.filter((q) => q.node === p.node && seated(q)).length;
  const best = Math.max(...vs.map(cnt));
  const top = vs.filter((p) => cnt(p) === best);
  return top[Math.floor(rnd() * top.length)];
}
const podTop = (p) => [p.x + 6, p.feet - 21];

// 프로브: 층 관리자가 묻고 직원이 답한다
async function probe(p, q, ans, ok, ms = 900) {
  bubble(S.kub[p.node].x + 9, 97, q, ms + 350);
  await wait(350);
  bubble(...podTop(p), ans, ms, ok ? 'ok' : 'no');
  await wait(ms);
}
const ASK_READY = { m: '준비 됐나?', t: 'GET /ready' };

async function edit6(v) {
  bubble(S.A.me.x + 6, 31, { m: `매뉴얼 ${v}로 개정`, t: `image: web:${v}` });
  await hop(S.A.me);
  await fly(P.me(), P.api(), 1000);
  await receive(true);
  await record(() => { entry('dep').ver = v; return 'dep'; });
  await broadcast([P.dep()]);
  await doze();
}
async function newRs6(v) {
  await hop(S.A.dep);
  bubble(S.A.dep.x + 6, 26, { m: `정원표 ${v} 작성 (1명)`, t: `ReplicaSet ${v} · replicas 1` }, 1800);
  await wait(500);
  await fly(P.dep(), P.api(), 900);
  await receive(false);
  await record(() => { S.ledger.push({ id: 'rs' + v, kind: 'rs', ver: v, want: 1, ready: 0 }); return 'rs' + v; });
  await broadcast([P.rs()]);
  await doze();
}
async function hire6(v) {  // 신입 1명: 채용 요청 → 배정 → 출근 (준비 안 됨)
  await hop(S.A.rs);
  await fly(P.rs(), P.api(), 700);
  await receive(false);
  const f = addPod6(null, null, v);
  S.fresh = f;
  await record(() => { S.ledger.push({ id: f.id, node: null, st: 'pend', rs: f.rs }); return f.id; });
  await broadcast([P.sch()]);
  const n = freestRoom();
  await hop(S.A.sch);
  bubble(ROOM_X[n] + 38, 100, { m: `✓ ${f.mn} 배정`, t: `✓ …${f.sfx}` }, 1500, 'ok');
  await fly(P.sch(), P.api(), 700);
  await receive(false);
  f.node = n;
  f.desk = freeDesks(n, f)[0];
  await record(() => { Object.assign(entry(f.id), { node: n, st: 'crt' }); return f.id; });
  await broadcast([P.kub(n)]);
  await doze();
  await hop(S.kub[n]);
  bubble(ROOM_X[n] + 38, 100, { m: `매뉴얼 ${v} 받는 중`, t: `pull web:${v}` }, 1200, 'no');
  await wait(1000);
  Object.assign(f, { x: ROOM_X[n] + 62, feet: DESK_FEET, state: 'run', alpha: 1 });
  await walk(f, deskX(n, f.desk), 1200);
  f.dir = 'r';
  await fly(P.kub(n), P.api(), 800);
  await receive(false);
  await record(() => { entry(f.id).st = 'nrp'; return f.id; });
  await doze();
  bubble(...podTop(f), { m: '익히는 중…', t: 'Ready 아님' }, Infinity, 'no');
}
async function report6(p, st, restart = false) {
  await fly(P.kub(p.node), P.api(), 800);
  await receive(false);
  await record(() => {
    const e = entry(p.id);
    e.st = st;
    if (restart) e.restarts = (e.restarts || 0) + 1;
    sync6();
    return p.id;
  });
  await doze();
}
async function leave6(v) {  // 정리 후 퇴장 → 장부에서 삭제
  await walk(v, ROOM_X[v.node] + 62, 900);
  await tween(300, (q) => { v.alpha = 1 - q; });
  v.state = 'gone';
  await fly(P.kub(v.node), P.api(), 700);
  await receive(false);
  await record(() => { S.ledger = S.ledger.filter((e) => e.id !== v.id); sync6(); return null; });
  await doze();
  S.pods = S.pods.filter((p) => p.state !== 'gone');
}
async function scale6(v, want, ms = 900) {  // 기획 담당이 정원표 인원을 바꾼다
  const r = entry('rs' + v);
  await hop(S.A.dep);
  bubble(S.A.dep.x + 6, 26, { m: `${v} 정원표 ${r.want} → ${want}`, t: `${v} replicas ${r.want} → ${want}` }, ms + 900);
  await fly(P.dep(), P.api(), ms);
  await receive(false);
  await record(() => { r.want = want; return r.id; });
  await broadcast([P.rs()]);
}
async function fire6(p, ms = 900) {  // 정원 담당이 직원 1명 퇴사 처리 → 층 관리자가 정리
  await hop(S.A.rs);
  await fly(P.rs(), P.api(), ms);
  await receive(false);
  p.state = 'term'; p.box = true;
  await record(() => { entry(p.id).st = 'term'; sync6(); return p.id; });
  await broadcast([P.kub(p.node)]);
  await doze();
  await leave6(p);
}
async function round6() {  // 같은 과정을 몰아서 빠르게: v2 +1 → 출근 → 준비 확인 → v1 −1 → 퇴사
  const r2 = entry('rsv2'), r1 = entry('rsv1');
  bubble(S.A.dep.x + 6, 26, { m: `정원표 v2 ${r2.want + 1}명 · v1 ${r1.want - 1}명`, t: `v2 ${r2.want + 1} · v1 ${r1.want - 1}` }, 2600);
  await hop(S.A.dep);
  const n = freestRoom();
  const f = addPod6(n, freeDesks(n)[0], 'v2');
  quick(() => { r2.want += 1; S.ledger.push({ id: f.id, node: n, st: 'nrp', rs: f.rs }); return [r2.id, f.id]; });
  Object.assign(f, { x: ROOM_X[n] + 62, state: 'run' });
  await walk(f, deskX(n, f.desk), 800);
  f.dir = 'r';
  await probe(f, ASK_READY, { m: '✓ 됐음', t: '✓ 200 OK' }, true, 500);
  quick(() => { entry(f.id).st = 'run'; sync6(); return f.id; });
  await wait(300);
  const v = pickVictim('v1');
  v.state = 'term'; v.box = true;
  quick(() => { r1.want -= 1; entry(v.id).st = 'term'; sync6(); return [r1.id, v.id]; });
  await walk(v, ROOM_X[v.node] + 62, 800);
  await tween(300, (q) => { v.alpha = 1 - q; });
  v.state = 'gone';
  quick(() => { S.ledger = S.ledger.filter((e) => e.id !== v.id); sync6(); return null; });
  S.pods = S.pods.filter((p) => p.state !== 'gone');
}
// 몰아서 보여 줄 때: 봉투·도장 없이 장부만 바로 고친다
function quick(change) { const ids = change(); flash = ids == null ? [] : [].concat(ids); renderLedger(); }

const R6 = {
  a: [
    () => edit6('v2'),
    () => newRs6('v2'),
    () => hire6('v2'),
    async () => {
      const f = S.fresh;
      await probe(f, ASK_READY, { m: '✓ 됐음', t: '✓ 200 OK' }, true);
      await hop(S.kub[f.node]);
      await report6(f, 'run');
      bubble(...podTop(f), { m: '✓ 준비됨', t: '✓ Ready' }, Infinity, 'ok');
    },
    async () => {
      await scale6('v1', 2);
      await doze();
      await fire6(pickVictim('v1'));
    },
    async () => {
      await round6();
      await round6();
    },
    async () => {
      bubble(S.A.dep.x + 6, 26, { m: '개정 완료 v2 3/3 ✓', t: 'rollout 완료 ✓' }, Infinity, 'ok');
      await wait(400);
      bubble(165, 24, { m: 'v1 정원표 0명 보관', t: '이전 ReplicaSet 보관' }, Infinity, 'ok');
      await wait(600);
    },
  ],
  b: [
    () => edit6('v3'),
    () => newRs6('v3'),
    () => hire6('v3'),
    async () => {
      const f = S.fresh;
      for (let i = 0; i < 3; i++) await probe(f, ASK_READY, { m: '✗ 아직…', t: '✗ 503' }, false, 700);
      bubble(...podTop(f), { m: '준비 안 됨', t: 'Ready 아님' }, Infinity, 'no');
      await hop(S.A.dep);
      bubble(S.A.dep.x + 6, 26, { m: 'v1 줄이지 않음', t: '이전 RS 유지' }, Infinity, 'no');
      await wait(600);
    },
    async () => {
      bubble(S.A.dep.x + 6, 26, { m: '⏱ 진척 없음 10분', t: '⏱ 600초 초과' }, Infinity, 'no');
      await wait(1200);
      await hop(S.A.dep);
      await fly(P.dep(), P.api(), 900);
      await receive(false);
      await record(() => { entry('dep').fail = true; return 'dep'; });
      await doze();
    },
    async () => {
      bubble(S.A.me.x + 6, 31, { m: '되돌리기', t: 'rollout undo' });
      await hop(S.A.me);
      await fly(P.me(), P.api(), 1000);
      await receive(true);
      await record(() => { const d = entry('dep'); d.ver = 'v1'; d.fail = false; return 'dep'; });
      await broadcast([P.dep()]);
      await doze();
      await scale6('v3', 0);
      await doze();
      await fire6(S.fresh);
    },
    async () => {
      bubble(S.A.dep.x + 6, 26, { m: 'v1 3/3 그대로 ✓', t: 'v1 RS 3/3 ✓' }, Infinity, 'ok');
      await wait(400);
      bubble(165, 24, { m: 'v3 정원표 0명 보관', t: 'v3 ReplicaSet 보관' }, Infinity, 'ok');
      await wait(600);
    },
  ],
  c: [
    async () => {
      S.hero.daze = true;
      bubble(...podTop(S.hero), { m: '멍…', t: '응답 없음' }, Infinity, 'no');
      await wait(1200);
    },
    async () => {
      for (let i = 1; i <= 3; i++) {
        await probe(S.hero, { m: '괜찮나?', t: 'GET /healthz' }, { m: `… ✗ ${i}/3`, t: `✗ 실패 ${i}/3` }, false, 700);
      }
      bubble(S.kub[1].x + 9, 97, { m: '다시 깨움!', t: '재시작 결정' }, Infinity, 'no');
      await hop(S.kub[1]);
    },
    async () => {
      await hop(S.kub[1]);
      await sinkTo(8, 300);
      await wait(400);
      S.hero.daze = false;
      await sinkTo(0, 300);
      await report6(S.hero, 'run', true);
      bubble(...podTop(S.hero), { m: '재시작 1회', t: 'RESTARTS 1' }, Infinity, 'ok');
    },
  ],
  d: [
    async () => {
      bubble(...podTop(S.hero), { m: '바빠요!', t: '처리 중…' }, Infinity, 'no');
      await wait(1000);
    },
    async () => {
      await probe(S.hero, { m: '새 일 받을 수 있나?', t: 'GET /ready' }, { m: '✗ 지금은 안 됨', t: '✗ 503' }, false);
      await hop(S.kub[1]);
      await report6(S.hero, 'nrp');
      bubble(...podTop(S.hero), { m: '준비 안 됨 (재시작 없음)', t: 'Ready=False' }, Infinity, 'no');
    },
    async () => {
      await wait(500);
      await probe(S.hero, { m: '새 일 받을 수 있나?', t: 'GET /ready' }, { m: '✓ 이제 됨', t: '✓ 200 OK' }, true);
      await hop(S.kub[1]);
      await report6(S.hero, 'run');
      bubble(...podTop(S.hero), { m: '재시작 0회', t: 'RESTARTS 0' }, Infinity, 'ok');
    },
  ],
};

const SCENE6 = {
  clickPods: false,
  sub: { m: '장부는 창구직원만 씀 · 책 색 = 매뉴얼 판', t: 'etcd는 apiserver만 씀 · 책 색 = image 버전' },
  choices: CHOICES6,
  plan: (c) => ({ k: c.k }),
  init() {
    S.A.dep = { x: 86, feet: 58, dy: 0 };
    S.ledger.push({ id: 'dep', kind: 'dep', ver: 'v1', ready: 3 }, { id: 'rsv1', kind: 'rs', ver: 'v1', want: 3, ready: 3 });
    [0, 1, 2].forEach((n) => addPod6(n, 0, 'v1'));
    S.hero = S.pods[1];
  },
  steps: steps6,
  run: [null, 1, 2, 3, 4, 5, 6, 7].map((i) => i && (() => R6[S.plan.k][i - 1]())),
};
