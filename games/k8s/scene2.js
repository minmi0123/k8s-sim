// 쿠버네티스 회사: 장면 ② 대본
'use strict';

// ===== 장면 ② 신입 자리 배치 (대본) =====

const URL_SCHED = 'https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/';
const CHOICES2 = [
  { m: '보통 신입 · 1칸', t: 'requests cpu 1', req: { size: 1, win: false, tol: false } },
  { m: '큰 업무 신입 · 2칸', t: 'requests cpu 2', req: { size: 2, win: false, tol: false } },
  { m: '창가 희망 신입', t: 'nodeSelector window=yes', req: { size: 1, win: true, tol: false } },
  { m: '공사 허가증 신입', t: 'toleration repair', req: { size: 1, win: false, tol: true } },
  { m: '창가 희망 · 2칸', t: 'nodeSelector + cpu 2', req: { size: 2, win: true, tol: false } },
];
const WHY = {
  taint: { m: '✗ 공사 중', t: '✗ taint 미허용' },
  win:   { m: '✗ 창가 아님', t: '✗ 라벨 불일치' },
  size:  { m: '✗ 칸 부족', t: '✗ 자원 부족' },
};

// 거르기(필터) → 점수(남는 칸) → 최고점, 동점이면 무작위
function plan2(req) {
  const rooms = ROOM_X.map((_, n) => {
    const r = S.rooms[n], free = 2 - occ(n);
    const why = r.taint && !req.tol ? 'taint' : req.win && !r.win ? 'win' : free < req.size ? 'size' : null;
    return { n, why, tolPass: r.taint && req.tol, score: why ? null : free - req.size };
  });
  const cands = rooms.filter((r) => !r.why);
  const best = Math.max(...cands.map((r) => r.score));
  const top = cands.filter((r) => r.score === best);
  return { req, rooms, cands, target: top.length ? top[Math.floor(rnd() * top.length)].n : null };
}

function steps2() {
  const pl = S.plan, ok = !pl || pl.cands.length > 0, tol = pl && pl.req.tol;
  const head = [
    {
      m: ['신입 1명이 들어올 예정임. 층마다 사정이 다름.', '아래에서 신입을 고르면 자리 배치가 시작됨.'],
      t: ['Pod 1개가 새로 생길 예정임. 노드마다 라벨·taint·여유가 다름.', '아래에서 Pod 조건을 고르면 스케줄링이 시작됨.'],
      ref: 'kube-scheduler는 노드가 정해지지 않은 Pod를 찾아 실행할 노드를 정함. 이 장면의 층 사정: 1층 = 창가, 2층 = 일반, 3층 = 창가 + 공사 중. 층마다 책상 2칸.',
      url: URL_SCHED,
    },
    {
      m: ['정원 담당의 요청으로 신입이 장부에 \'자리 미정\'으로 올라옴.', '신입은 로비에서 대기함. 방송을 들은 자리배치 담당이 일을 시작함.'],
      t: ['Pod가 nodeName 없이 저장됨(Pending).', 'kube-scheduler가 watch로 감지해 스케줄링 큐에 넣음.'],
      clock: C1,
      ref: '스케줄러는 nodeName이 빈 Pod를 watch하다가 큐에 넣고 하나씩 처리함. 로비 = 아직 어느 노드에도 없는 Pod.',
      url: URL_SCHED,
    },
    {
      m: ['1단계 거르기: 조건이 안 맞는 층을 뺌.', '공사 중(허가증 없음) · 창가 아님 · 칸 부족이면 탈락.'],
      t: ['필터링: Pod를 놓을 수 없는 노드를 뺌.', 'taint 미허용 · 라벨 불일치 · 자원 부족이면 제외.'],
      clock: C1,
      ref: '필터 플러그인 예: TaintToleration(taint를 허용하나), NodeAffinity(nodeSelector 라벨이 맞나), NodeResourcesFit(requests만큼 남았나). 칸은 실제 사용량이 아니라 requests 합계로 셈. 하나라도 실패하면 그 노드는 후보에서 빠짐.',
      url: 'https://kubernetes.io/docs/reference/scheduling/config/#scheduling-plugins',
    },
  ];
  if (!ok) {
    return [...head,
      {
        m: ['남은 층이 없음 → 배치할 수 없음.', '신입은 \'자리 미정\' 그대로 로비에서 대기함.'],
        t: ['후보 노드가 0개 → 스케줄링 실패.', 'Pod는 Pending으로 남고 FailedScheduling 이벤트가 기록됨.'],
        ref: '배치할 노드가 없으면 Pod는 Pending(unschedulable)으로 남음. kubectl describe pod의 Events에 FailedScheduling과 탈락 이유가 나옴.',
        url: URL_SCHED,
      },
      {
        m: ['층 사정이 바뀌면(자리가 나거나 공사가 끝나면) 다시 시도함.', '다른 신입을 골라 다시 해 볼 수 있음.'],
        t: ['클러스터 상태가 바뀌면 스케줄러가 다시 시도함.', '다른 조건을 골라 다시 해 볼 수 있음.'],
        ref: '스케줄하지 못한 Pod는 대기열에 있다가, 노드 추가·Pod 삭제 같은 변화가 생기면 다시 시도됨.',
        url: URL_SCHED,
      },
    ];
  }
  return [...head,
    {
      m: ['2단계 점수: 남은 층에 점수를 매기고 가장 높은 층을 고름.', '배치 후 남는 칸이 많을수록 높음. 같으면 무작위.',
        ...(tol ? ['허가증은 들어가게 해 줄 뿐, 그 층으로 보내 주지 않음.'] : [])],
      t: ['스코어링: 남은 노드에 점수를 매겨 최고점을 고름.', '여유가 많을수록 높음(단순화). 동점이면 무작위.',
        ...(tol ? ['toleration은 허용만 할 뿐, 그 노드로 끌어당기지 않음.'] : [])],
      clock: C1,
      ref: '기본 점수는 여러 플러그인(자원 여유, 분산, 이미지 보유 등)의 합임. 이 시뮬레이터는 "배치 후 남는 칸"(NodeResourcesFit의 기본 방식 LeastAllocated와 같은 방향)으로 단순화함. 동점이면 무작위. toleration은 taint가 있는 노드를 허용할 뿐, 그 노드에 배치되는 것을 보장하지 않음.',
      url: tol ? 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/' : URL_SCHED,
    },
    {
      m: ['자리배치 담당이 배정 결과를 창구에 냄.', '장부에 층이 적힘(바인딩). 자리배치 담당은 여기까지만 함.'],
      t: ['Binding 요청으로 Pod의 nodeName이 기록됨.', '스케줄러의 일은 여기까지임 — 실행은 하지 않음.'],
      clock: C1,
      ref: '스케줄러는 고른 노드를 API 서버에 Binding으로 알림. 이 과정을 바인딩이라 함. 컨테이너 실행은 그 노드의 kubelet이 함.',
      url: URL_SCHED,
    },
    {
      m: ['층 관리자가 방송을 듣고 신입을 자리에 앉힘. 장부에 \'근무\'로 적힘.', '배정(자리배치 담당)과 앉히기(층 관리자)는 다른 사람이 함.', '다른 신입을 골라 다시 해 볼 수 있음.'],
      t: ['해당 노드의 kubelet이 컨테이너를 띄우고 Running을 보고함.', '배정(scheduler)과 실행(kubelet)은 다른 구성요소가 함.', '다른 조건을 골라 다시 해 볼 수 있음.'],
      clock: '실제 수 초 (이미지 받기에 따라 다름)',
      ref: 'kubelet은 자기 노드에 배정된 Pod를 watch하다가 컨테이너 런타임(CRI)으로 컨테이너를 실행하고, 상태를 apiserver에 보고함.',
      url: 'https://kubernetes.io/docs/concepts/overview/components/#kubelet',
    },
  ];
}

const LOBBY = { x: 200, feet: 58 };

function showFilter(r) {
  const x = ROOM_X[r.n] + 38;
  if (r.why) bubble(x, 106, WHY[r.why], Infinity, 'no');
  else bubble(x, 106, r.tolPass ? { m: '✓ 허가증 있음', t: '✓ toleration' } : { m: '✓ 통과', t: '✓ 통과' }, Infinity, 'ok');
}
const showPick = () => bubble(ROOM_X[S.plan.target] + 38, 92, { m: '✓ 배정', t: '✓ 선택' }, Infinity, 'ok');

const RUN2 = [
  null,
  async () => { // 1. 장부에 '자리 미정' 신입 → 로비 대기
    await hop(S.A.rs);
    await fly(P.rs(), P.api(), 900);
    await receive(false);
    const f = addPod(null, null);
    Object.assign(f, { size: S.plan.req.size, x: LOBBY.x, feet: LOBBY.feet, dir: 'l', state: 'lobby', alpha: 0 });
    S.fresh = f;
    await record(() => { S.ledger.push({ id: f.id, node: null, st: 'pend' }); return f.id; });
    await tween(300, (p) => { f.alpha = p; });
    bubble(LOBBY.x + 6, 31, S.plan.choice, Infinity, '', true);
    await broadcast([P.sch()]);
    await doze();
  },
  async () => { // 2. 거르기
    await hop(S.A.sch);
    for (const r of S.plan.rooms) { showFilter(r); await wait(450); }
    await wait(300);
  },
  async () => { // 3. 점수 (또는 후보 없음)
    const pl = S.plan;
    pl.rooms.filter((r) => r.why).forEach(showFilter);
    if (!pl.cands.length) {
      await wait(400);
      bubble(S.A.sch.x + 18, 26, { m: '배치할 층 없음', t: '후보 노드 0개' }, Infinity, 'no');
      await hop(S.A.sch);
      await wait(400);
      return;
    }
    for (const r of pl.cands) {
      bubble(ROOM_X[r.n] + 38, 106, { m: `남는 칸 ${r.score}`, t: `점수 ${r.score}` });
      await wait(400);
    }
    await wait(300);
    showPick();
    await hop(S.A.sch);
    await wait(400);
  },
  async () => { // 4. 바인딩 (또는 대기)
    const pl = S.plan, f = S.fresh;
    pl.rooms.filter((r) => r.why).forEach(showFilter);
    if (!pl.cands.length) {
      await wait(400);
      bubble(S.A.sch.x + 18, 26, { m: '자리 나면 다시 시도', t: 'FailedScheduling' }, Infinity, 'no');
      await wait(400);
      return;
    }
    showPick();
    await hop(S.A.sch);
    await fly(P.sch(), P.api(), 900);
    await receive(false);
    const fd = freeDesks(pl.target, f);
    Object.assign(f, { node: pl.target, desk: fd[0], desk2: f.size === 2 ? fd[1] : null });
    await record(() => { const e = entry(f.id); e.node = pl.target; e.st = 'crt'; return f.id; });
    await broadcast([P.kub(pl.target)]);
    await doze();
  },
  async () => { // 5. 층 관리자가 앉힘 → 근무 보고
    const f = S.fresh, n = S.plan.target;
    showPick();
    await hop(S.kub[n]);
    await tween(300, (p) => { f.alpha = 1 - p; });
    Object.assign(f, { x: ROOM_X[n] + 62, feet: DESK_FEET, state: 'run', alpha: 1 });
    await walk(f, deskX(n, f.desk), 1200);
    f.dir = 'r';
    await wait(200);
    await fly(P.kub(n), P.api(), 1000);
    await receive(false);
    await record(() => { entry(f.id).st = 'run'; return f.id; });
    await doze();
  },
];

const SCENE2 = {
  clickPods: false,
  plan: (c) => plan2(c.req),
  sub: { m: '장부는 창구직원만 씀', t: 'etcd는 apiserver만 씀' },
  choices: CHOICES2,
  init() {
    S.rooms[0].win = true;
    S.rooms[2].win = true; S.rooms[2].taint = true;
    addPod(0, 0);
  },
  steps: steps2,
  run: RUN2,
};
