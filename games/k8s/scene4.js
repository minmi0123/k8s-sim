// 쿠버네티스 회사: 장면 ④ 대본
'use strict';

// ===== 장면 ④ 층 정전 (대본) — 정전 / 일 못 함 / 계획 정전 세 갈래, 대상은 1층 =====

const URL_NODES = 'https://kubernetes.io/docs/concepts/architecture/nodes/';
const URL_DRAIN = 'https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/';
const URL_TAINT_EVICT = 'https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/#taint-based-evictions';
const CHOICES4 = [
  { m: '정전 (연락 두절)', t: '노드 다운 → Unknown', k: 'down' },
  { m: '일 못 함 보고', t: 'kubelet 보고 → NotReady', k: 'nr' },
  { m: '계획 정전 (미리 비우기)', t: 'kubectl drain', k: 'drain' },
];
const AGAIN4 = { m: '다른 경우를 골라 비교해 볼 수 있음.', t: '다른 경우를 골라 비교해 볼 수 있음.' };

function steps4() {
  const n = S.down, R = n == null ? ROOMS[0] : ROOMS[n];
  const k = n == null ? 0 : S.pods.filter((p) => p.node === n && (p.state === 'run' || p.state === 'term')).length;
  const head = {
    m: ['층 관리자들이 주기적으로 \'살아있음\' 신호(♥)를 창구에 보냄.', '아래에서 1층에 일어날 일을 고르면 시작됨. 결말은 같고 과정이 다름.'],
    t: ['각 kubelet이 주기적으로 Lease를 갱신함(하트비트).', '아래에서 node-1에 일어날 일을 고르면 시작됨. 결말은 같고 과정이 다름.'],
    clock: '실제 10초 간격 (화면은 빠르게)',
    ref: '노드의 하트비트는 두 가지: Node .status 갱신과 kube-node-lease 네임스페이스의 Lease 갱신. kubelet은 Lease를 기본 10초마다 갱신함.',
    url: `${URL_NODES}#heartbeats`,
  };
  const rsStep = {
    m: [`정원 담당: 퇴사 예정자를 빼고 셈 → 원함 3 / 실제 ${3 - k}.`, `신입 ${k}명 채용 요청. 신입은 로비에서 대기함.`],
    t: [`ReplicaSet 컨트롤러: 삭제 중인 Pod를 빼고 셈 → 3 / ${3 - k}.`, `새 Pod ${k}개 생성 요청(Pending).`],
    clock: C1,
    ref: 'ReplicaSet 컨트롤러는 deletionTimestamp가 있는 Pod를 실행 중 개수에서 뺌 → 기존 Pod가 아직 지워지지 않았어도 새 Pod를 요청함.',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/',
  };
  const k4 = S.plan && S.plan.k;

  if (k4 === 'down') {
    return [head,
      {
        m: [`${R.m}이 정전됨. 그 층 관리자의 신호가 끊김.`, '본사는 아직 모름. 장부에는 여전히 \'정상\'.'],
        t: [`${R.t} 장애 → kubelet의 Lease 갱신이 멈춤.`, '컨트롤 플레인은 아직 모름. etcd에는 여전히 Ready.'],
        ref: '장애가 났다고 알려 주는 쪽은 없음. 신호가 끊긴 것을 컨트롤 플레인이 스스로 알아채야 함.',
        url: `${URL_NODES}#heartbeats`,
      },
      {
        m: [`층 점검 담당: ${R.m} 신호가 일정 시간 넘게 없음 → \'연락 두절\'로 기록함.`, `${R.m}에 출입 금지 표시가 붙어, 새 직원은 그 층에 배정되지 않음.`],
        t: ['Node 컨트롤러: 유예 시간 동안 갱신 없음 → Ready 조건을 Unknown으로 바꿈.', 'unreachable taint가 붙어 스케줄러가 이 노드를 피함. 그 노드 Pod는 NotReady.'],
        clock: '실제 약 50초 (node-monitor-grace-period 기본값)',
        ref: 'Node 컨트롤러는 기본 5초마다 노드 상태를 확인함. --node-monitor-grace-period(현재 문서 기본 50초, 예전 버전은 40초) 동안 응답이 없으면 Ready를 Unknown으로 바꾸고 node.kubernetes.io/unreachable taint를 붙임.',
        url: `${URL_NODES}#node-controller`,
      },
      {
        m: ['바로 내보내지 않고 5분을 기다림. 잠깐 끊긴 것일 수도 있기 때문.', '5분이 지나도 그대로면 그 층 직원을 퇴사 처리함(장부에만).'],
        t: ['Pod에 자동으로 붙는 toleration(unreachable, 300초) 동안 기다림.', '300초 후 taint 기반 축출로 Pod 삭제가 요청됨(deletionTimestamp).'],
        clock: '실제 5분 (기본값)',
        ref: 'Kubernetes는 not-ready·unreachable taint에 대한 toleration(tolerationSeconds=300)을 Pod에 자동으로 붙임 → 문제 감지 후 5분간 노드에 남음. 1.29부터 축출은 kube-controller-manager 안의 별도 taint-eviction-controller가 함.',
        url: URL_TAINT_EVICT,
      },
      rsStep,
      {
        m: ['자리배치 담당: 출입 금지 층은 빼고 배정함.', '정전된 층 직원이 \'이사\'하는 게 아니라, 다른 층에 새 직원이 오는 것.'],
        t: ['kube-scheduler: unreachable taint가 있는 노드는 필터에서 제외됨.', 'Pod가 옮겨지는 게 아니라 다른 노드에 새 Pod가 생기는 것(이름·IP 다름).'],
        clock: C1,
        ref: 'Node 컨트롤러가 노드 문제에 맞는 taint를 붙이므로 스케줄러는 비정상 노드에 Pod를 놓지 않음.',
        url: `${URL_NODES}#node-controller`,
      },
      {
        m: ['층 관리자가 신입을 앉힘 → 정원 3명 회복.', '정전된 층 직원은 \'퇴사 예정\'인 채로 남음. 층이 복구되어야 정리됨.', AGAIN4.m],
        t: ['kubelet이 새 Pod를 실행 → 3/3 회복.', '장애 노드의 Pod는 Terminating으로 남음. 노드가 돌아오거나 Node를 지워야 정리됨.', AGAIN4.t],
        clock: '실제 수 초',
        ref: '삭제 완료는 그 노드의 kubelet이 확인해야 하는데, 연락이 끊긴 노드는 확인하지 못함 → Terminating 유지. 그동안 실제 컨테이너가 그 노드에서 계속 돌고 있을 수도 있음.',
        url: 'https://kubernetes.io/docs/tasks/run-application/force-delete-stateful-set-pod/',
      },
    ];
  }

  if (k4 === 'nr') {
    return [head,
      {
        m: [`${R.m} 관리자: "우리 층 지금 일 못 함"이라고 창구에 직접 보고함.`, '♥ 신호는 계속 옴 — 연락은 되는 상태.'],
        t: ['kubelet이 Node 조건 Ready=False를 보고함(예: 네트워크 플러그인 미준비).', 'Lease 갱신은 계속됨 — 연결은 살아 있음.'],
        clock: C1,
        ref: 'kubelet은 노드 상태(Conditions)를 Node .status에 보고함. 런타임·네트워크 플러그인 등이 준비되지 않으면 Ready=False(NotReady). 연락이 끊겨 아무도 모르는 Unknown과 다름.',
        url: 'https://kubernetes.io/docs/reference/node/node-status/#condition',
      },
      {
        m: [`층 점검 담당이 보고를 보고 ${R.m}에 출입 금지 표시를 붙임.`, `새 직원은 ${R.m}에 배정되지 않음.`],
        t: ['Node 컨트롤러가 not-ready taint(NoSchedule·NoExecute)를 붙임.', '스케줄러가 이 노드를 피하고, 그 노드 Pod는 NotReady가 됨.'],
        clock: C1,
        ref: 'node.kubernetes.io/not-ready taint는 NodeCondition Ready가 False일 때 붙음. 문제가 풀리면 kubelet이나 Node 컨트롤러가 taint를 뗌.',
        url: URL_TAINT_EVICT,
      },
      {
        m: ['5분을 기다린 뒤 그 층 직원을 퇴사 처리함.', '이번엔 층 관리자와 연락이 되니, 층 관리자가 짐 싸기를 시작시킴.'],
        t: ['tolerationSeconds 300 후 축출 → Pod 삭제 요청(deletionTimestamp).', 'kubelet이 연결되어 있어 컨테이너 종료를 진행함.'],
        clock: '실제 5분 (기본값)',
        ref: 'not-ready taint에도 300초 toleration이 자동으로 붙음. kubelet이 API와 연결되어 있으면 삭제된 Pod의 종료를 처리해 삭제가 끝남(원인에 따라 종료가 늦어질 수는 있음).',
        url: URL_TAINT_EVICT,
      },
      rsStep,
      {
        m: ['자리배치 담당: 출입 금지 층은 빼고 배정함.', '이사가 아니라, 다른 층에 새 직원이 오는 것.'],
        t: ['kube-scheduler: not-ready taint가 있는 노드는 제외됨.', 'Pod가 옮겨지는 게 아니라 다른 노드에 새 Pod가 생김.'],
        clock: C1,
        ref: 'Node 컨트롤러가 붙인 not-ready taint(NoSchedule) 때문에 스케줄러는 이 노드에 Pod를 놓지 않음.',
        url: `${URL_NODES}#node-controller`,
      },
      {
        m: ['새 직원이 앉아 정원 3명 회복. 그 층 직원은 정리 후 나가고 장부에서 지워짐.', '정전과 달리 \'퇴사 예정\'이 남지 않음 — 연락이 됐기 때문.', AGAIN4.m],
        t: ['새 Pod Running → 3/3. 기존 Pod는 종료 후 etcd에서 삭제됨.', 'Unknown과 달리 Terminating이 남지 않음 — kubelet이 확인해 줬기 때문.', AGAIN4.t],
        clock: '실제 수 초 ~ 30초 (정리 시간)',
        ref: '연결된 kubelet은 컨테이너 종료가 끝나면 Pod 삭제를 마무리함. 연락이 끊긴 정전(Unknown) 갈래와 비교해 볼 것.',
        url: `${URL_LIFE}#pod-termination`,
      },
    ];
  }

  if (k4 === 'drain') {
    return [head,
      {
        m: [`관리자가 "${R.m} 점검 예정, 새 배치 금지"를 창구에 냄.`, `${R.m}에 배치 금지 표시가 붙음. 기존 직원은 아직 그대로.`],
        t: ['kubectl drain이 먼저 cordon함 → Node에 unschedulable 표시.', 'unschedulable taint(NoSchedule)가 붙음. 기존 Pod는 그대로.'],
        clock: C1,
        ref: 'cordon은 Node의 spec.unschedulable을 true로 바꿈 → node.kubernetes.io/unschedulable:NoSchedule taint. drain은 cordon한 뒤 Pod를 축출함.',
        url: URL_DRAIN,
      },
      {
        m: [`관리자가 ${R.m} 직원들의 퇴사(이동) 요청을 하나씩 냄.`, '5분 기다림 없이 바로, 정리할 시간(최대 30초)을 주고 내보냄.'],
        t: ['drain이 Pod마다 Eviction 요청을 보냄(PodDisruptionBudget을 지킴).', 'Pod에 deletionTimestamp → kubelet이 SIGTERM으로 정상 종료.'],
        clock: '실제 수 초 ~ 30초 (정리 시간)',
        ref: 'drain은 Eviction API를 쓰므로 PodDisruptionBudget(동시에 몇 개까지 내려가도 되나)을 지킴. 각 Pod는 정상 종료 유예 시간을 받음.',
        url: URL_DRAIN,
      },
      rsStep,
      {
        m: ['자리배치 담당: 배치 금지 층은 빼고 배정함.', '이사가 아니라, 다른 층에 새 직원이 오는 것.'],
        t: ['kube-scheduler: unschedulable 노드는 제외됨.', 'Pod가 옮겨지는 게 아니라 다른 노드에 새 Pod가 생김.'],
        clock: C1,
        ref: 'unschedulable taint(NoSchedule) 때문에 스케줄러는 cordon된 노드에 새 Pod를 놓지 않음.',
        url: URL_DRAIN,
      },
      {
        m: [`새 직원이 앉고, ${R.m} 직원은 정리 후 나감. ${R.m}이 비어 점검할 수 있음.`, '장애와 달리 기다림도, 남는 \'퇴사 예정\'도 없음.', AGAIN4.m],
        t: ['새 Pod Running → 3/3. 기존 Pod 삭제 완료 → node-1이 비어 작업 가능.', '점검이 끝나면 kubectl uncordon으로 배치 금지를 풂.', AGAIN4.t],
        clock: '실제 수 초 ~ 30초 (정리 시간)',
        ref: '계획된 작업은 drain으로 미리 비우는 것이 기본. 끝나면 uncordon으로 다시 배치를 허용함.',
        url: URL_DRAIN,
      },
    ];
  }
  return [head];
}

// 공통 연출: 정원 담당 → 신입 요청 / 배정(막힌 층 제외) / 출근 (+ 기존 직원 퇴장)
async function rsRequest4() {
  const k = S.victims.length;
  bubble(S.A.rs.x + 6, 26, { m: `원함 3 / 실제 ${3 - k}`, t: `spec 3 / 실제 ${3 - k}` });
  await hop(S.A.rs);
  await wait(400);
  await fly(P.rs(), P.api(), 900);
  await receive(false);
  const fs = LOBBY3.slice(0, k).map((x) => {
    const f = addPod(null, null);
    Object.assign(f, { x, feet: 58, dir: 'l', state: 'lobby', alpha: 0 });
    return f;
  });
  S.fresh3 = fs;
  await record(() => { fs.forEach((f) => S.ledger.push({ id: f.id, node: null, st: 'pend' })); return fs.map((f) => f.id); });
  await tween(300, (q) => fs.forEach((f) => { f.alpha = q; }));
  await broadcast([P.sch()]);
  await doze();
}

async function schedule4(blocked) {
  const fs = S.fresh3, cnt = [0, 0, 0];
  await hop(S.A.sch);
  bubble(ROOM_X[S.down] + 38, 100, blocked, Infinity, 'no');
  await wait(400);
  for (const f of fs) {
    const free = cnt.map((c, n) => (n === S.down ? -1 : 2 - occ(n) - c));
    const best = Math.max(...free);
    const top = free.map((v, n) => (v === best && v > 0 ? n : -1)).filter((n) => n >= 0);
    const n = top[Math.floor(rnd() * top.length)];
    f.target = n;
    f.desk = freeDesks(n, f)[cnt[n]];
    cnt[n]++;
    bubble(ROOM_X[n] + 38, 100 - (cnt[n] - 1) * 8, { m: `✓ ${f.mn} 배정`, t: `✓ …${f.sfx}` }, Infinity, 'ok');
    await wait(450);
  }
  for (let i = 0; i < fs.length; i++) await fly(P.sch(), P.api(), 450);
  await receive(false);
  await record(() => {
    fs.forEach((f) => { f.node = f.target; Object.assign(entry(f.id), { node: f.target, st: 'crt' }); });
    return fs.map((f) => f.id);
  });
  await broadcast([...new Set(fs.map((f) => f.node))].map((n) => P.kub(n)));
  await doze();
}

async function seat4(oldLeave) {
  const fs = S.fresh3, used = [...new Set(fs.map((f) => f.node))];
  await Promise.all(used.map((n) => hop(S.kub[n])));
  await tween(300, (q) => fs.forEach((f) => { f.alpha = 1 - q; }));
  fs.forEach((f) => Object.assign(f, { x: ROOM_X[f.node] + 62, feet: DESK_FEET, state: 'run', alpha: 1 }));
  await Promise.all(fs.map((f) => walk(f, deskX(f.node, f.desk), 1200)));
  fs.forEach((f) => { f.dir = 'r'; });
  await wait(200);
  await Promise.all(used.map((n, i) => wait(i * 150).then(() => fly(P.kub(n), P.api(), 900))));
  await receive(false);
  await record(() => { fs.forEach((f) => { entry(f.id).st = 'run'; }); return fs.map((f) => f.id); });
  await doze();
  if (oldLeave) {                   // 연락이 되는 층: 기존 직원이 정리 후 나가고 장부에서 지워짐
    const vs = S.victims;
    await Promise.all(vs.map((v) => walk(v, ROOM_X[v.node] + 62, 1000)));
    await tween(400, (q) => vs.forEach((v) => { v.alpha = 1 - q; }));
    vs.forEach((v) => { v.state = 'gone'; });
    await fly(P.kub(S.down), P.api(), 900);
    await receive(false);
    await record(() => { S.ledger = S.ledger.filter((e) => !vs.some((v) => v.id === e.id)); return null; });
    await doze();
    S.pods = S.pods.filter((p) => p.state !== 'gone');
  }
  bubble(S.A.rs.x + 6, 26, { m: '원함 3 / 실제 3 ✓', t: 'spec 3 / 실제 3 ✓' }, Infinity, 'ok');
}

// 퇴사 처리(축출): 장부에 퇴사 예정 → 정원 담당(과 연락되면 층 관리자)에게 방송
async function evict4(from, packing) {
  const n = S.down, vs = S.pods.filter((p) => p.node === n && p.state === 'run');
  S.victims = vs;
  await fly(from, P.api(), 900);
  await receive(false);
  vs.forEach((v) => { v.state = 'term'; v.box = packing; });
  await record(() => { vs.forEach((v) => { entry(v.id).st = 'term'; }); return vs.map((v) => v.id); });
  await broadcast(packing ? [P.kub(n), P.rs()] : [P.rs()]);
  await doze();
}

const ROOMPODS = () => S.pods.filter((p) => p.node === S.down && p.state === 'run');

const R4 = {
  down: [
    async () => { // 1. 정전 → 하트 멈춤
      const n = S.down, r = S.rooms[n];
      r.down = true;
      await tween(600, (q) => { r.dark = q; });
      bubble(ROOM_X[n] + 38, 100, { m: '정전!', t: '노드 장애' }, Infinity, 'no');
      await wait(1500);
    },
    async () => { // 2. 신호 확인 → 연락 두절 · 출입 금지(taint)
      const n = S.down;
      await hop(S.A.nc);
      for (let m = 0; m < 3; m++) {
        bubble(ROOM_X[m] + 38, 100, m === n ? { m: '✗ 신호 없음', t: '✗ Lease 갱신 없음' } : { m: '♥ 신호 ✓', t: '♥ Lease ✓' }, Infinity, m === n ? 'no' : 'ok');
        await wait(350);
      }
      await wait(400);
      await fly(P.nc(), P.api(), 900);
      await receive(false);
      const vs = ROOMPODS();
      await record(() => {
        S.rooms[n].unreach = true;
        refreshRoomTags();
        vs.forEach((v) => { entry(v.id).st = 'nr'; });
        return ['node' + n, ...vs.map((v) => v.id)];
      });
      await broadcast([P.sch()]);
      await doze();
    },
    async () => { // 3. 5분 대기 → 퇴사 처리 (장부에만)
      bubble(ROOM_X[S.down] + 38, 100, { m: '⏱ 5분 기다리는 중…', t: '⏱ tolerationSeconds 300' }, Infinity, 'no');
      await wait(1800);
      await hop(S.A.nc);
      await evict4(P.nc(), false);
    },
    rsRequest4,
    () => schedule4({ m: '✗ 출입 금지', t: '✗ taint unreachable' }),
    () => seat4(false),
  ],
  nr: [
    async () => { // 1. 층 관리자가 "일 못 함" 직접 보고 (♥ 는 계속)
      const n = S.down, r = S.rooms[n];
      bubble(ROOM_X[n] + 38, 100, { m: '⚠ 일 못 함', t: '⚠ Ready=False' }, Infinity, 'no');
      await tween(500, (q) => { r.dark = q * 0.45; });
      await hop(S.kub[n]);
      await fly(P.kub(n), P.api(), 1000);
      await receive(false);
      await record(() => { r.nr = true; refreshRoomTags(); return 'node' + n; });
      await broadcast([P.nc()]);
      await doze();
    },
    async () => { // 2. 층 점검 담당 → 출입 금지(not-ready taint), 직원은 준비 안 됨
      const n = S.down, vs = ROOMPODS();
      await hop(S.A.nc);
      await fly(P.nc(), P.api(), 900);
      await receive(false);
      await record(() => {
        S.rooms[n].nrTaint = true;
        vs.forEach((v) => { entry(v.id).st = 'nrp'; });
        return ['node' + n, ...vs.map((v) => v.id)];
      });
      await broadcast([P.sch()]);
      await doze();
    },
    async () => { // 3. 5분 대기 → 퇴사 처리, 층 관리자가 짐 싸기 시작
      bubble(ROOM_X[S.down] + 38, 100, { m: '⏱ 5분 기다리는 중…', t: '⏱ tolerationSeconds 300' }, Infinity, 'no');
      await wait(1800);
      await hop(S.A.nc);
      await evict4(P.nc(), true);
    },
    rsRequest4,
    () => schedule4({ m: '✗ 출입 금지', t: '✗ taint not-ready' }),
    () => seat4(true),
  ],
  drain: [
    async () => { // 1. cordon: 배치 금지
      const n = S.down;
      await hop(S.A.me);
      await fly(P.me(), P.api(), 1000);
      await receive(true);
      await record(() => { S.rooms[n].cordon = true; refreshRoomTags(); return 'node' + n; });
      await broadcast([P.sch()]);
      await doze();
    },
    async () => { // 2. Pod 마다 Eviction → 짐 싸기
      await hop(S.A.me);
      await fly(P.me(), P.api(), 700);
      await evict4(P.me(), true);
    },
    rsRequest4,
    () => schedule4({ m: '✗ 배치 금지', t: '✗ unschedulable' }),
    () => seat4(true),
  ],
};

const SCENE4 = {
  clickPods: false,
  heartbeat: true,
  sub: { m: '장부는 창구직원만 씀 · 층 출입 기록 = 층 상태', t: 'etcd는 apiserver만 씀 · node = Node 오브젝트' },
  choices: CHOICES4,
  plan: (c) => { S.down = 0; return { k: c.k }; },
  init() {
    S.A.nc = { x: 86, feet: 58, dy: 0 };
    S.down = null; S.victims = null;
    ROOM_X.forEach((_, n) => S.ledger.push({ id: 'node' + n, kind: 'node', n }));
    addPod(0, 0); addPod(0, 1); addPod(1, 0);
  },
  steps: steps4,
  run: [null, 1, 2, 3, 4, 5, 6].map((i) => i && (() => R4[S.plan.k][i - 1]())),
};
