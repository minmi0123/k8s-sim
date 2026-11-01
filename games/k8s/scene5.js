// 쿠버네티스 회사: 장면 ⑤ 대본
'use strict';

// ===== 장면 ⑤ 책상 크기 초과 (대본) =====

const URL_RES = 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/';
const URL_LIFE = 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/';
const CHOICES5 = [
  { m: '서류 조금 더', t: '메모리 requests 초과 (limits 안)', k: 'a' },
  { m: '서류 폭탄', t: '메모리 limits 초과', k: 'b' },
  { m: '일 폭주', t: 'CPU limits 초과', k: 'c' },
  { m: '서류 폭탄 반복', t: '메모리 limits 계속 초과', k: 'd' },
];
const AGAIN = { m: '다른 일을 골라 다시 해 볼 수 있음.', t: '다른 부하를 골라 다시 해 볼 수 있음.' };

const OOM_STEP = {
  m: ['서류가 칸막이를 넘음 → 그 자리에서 쓰러짐(강제 퇴근).', '칸막이는 건물 규칙(리눅스 커널)이 지켜서 예외가 없음.'],
  t: ['메모리가 limits를 넘음 → 커널 OOM killer가 컨테이너 프로세스를 죽임.', 'cgroup 메모리 상한은 커널이 강제함. 종료 코드 137, 이유 OOMKilled.'],
  clock: C1,
  ref: 'limits는 컨테이너 런타임이 리눅스 cgroup에 설정하고 커널이 강제함. 메모리 한도를 넘으면 OOM killer가 프로세스를 종료함(종료 코드 137 = 128 + SIGKILL 9).',
  url: `${URL_RES}#how-pods-with-resource-limits-are-run`,
};

function steps5() {
  const N = S.hero ? S.hero.mn : '';
  const head = {
    m: [`2층 직원(${N})의 책상에는 예약 크기와 칸막이가 정해져 있음 (옆 막대).`, '아래에서 일을 고르면 무슨 일이 생기는지 보임.'],
    t: ['Pod 컨테이너에 requests(mem 128Mi · cpu 250m)와 limits(mem 256Mi · cpu 500m)가 있음.', '아래에서 부하 종류를 고르면 결과가 보임.'],
    ref: 'requests = 스케줄러가 자리를 잡을 때 보는 값(최소 보장). limits = 넘을 수 없는 상한. 초록 줄 = requests, 빨간 줄 = limits.',
    url: URL_RES,
  };
  const k = S.plan && S.plan.k;
  if (k === 'a') {
    return [head,
      {
        m: ['직원이 서류를 예약보다 많이 쌓음. 칸막이 안이라 괜찮음.', '예약은 최소 보장일 뿐, 칸막이까지는 더 써도 됨.'],
        t: ['메모리 사용량이 requests를 넘었지만 limits 안임 → 문제없음.', 'requests는 스케줄링·보장 기준, 실제 사용은 limits까지 가능.'],
        ref: 'requests는 스케줄링과 최소 보장의 기준이고, 노드에 여유가 있으면 limits까지 더 쓸 수 있음.',
        url: URL_RES,
      },
      {
        m: ['장부에는 바뀐 것이 없음. 계속 근무 중.', '단, 층 전체 메모리가 모자라면 예약을 넘게 쓴 직원부터 내보내질 수 있음.', AGAIN.m],
        t: ['Pod status 변화 없음(Running).', '단, 노드 메모리 압박 시 requests를 넘게 쓰는 Pod가 먼저 축출 대상이 됨.', AGAIN.t],
        ref: '노드 메모리가 부족해지면 kubelet이 Pod를 축출함. 사용량이 requests를 넘는지가 축출 순서의 첫 기준임.',
        url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/',
      },
    ];
  }
  if (k === 'b') {
    return [head, OOM_STEP,
      {
        m: ['층 관리자가 쓰러진 것을 보고 창구에 보고함.', '장부: \'강제 퇴근\'. 아직 퇴사는 아님.'],
        t: ['kubelet이 컨테이너 종료를 감지해 status를 보고함.', '컨테이너 상태: Terminated (OOMKilled, 137).'],
        clock: C1,
        ref: 'kubelet은 컨테이너 상태를 감시하다가 종료되면 이유(OOMKilled)와 종료 코드를 Pod status에 기록함.',
        url: `${URL_LIFE}#container-states`,
      },
      {
        m: ['층 관리자가 같은 자리에서 직원을 다시 일으킴 → 재시작 1회.', '퇴사가 아님 — 이름·자리 그대로(같은 Pod). 쌓던 서류(메모리)만 사라짐.', AGAIN.m],
        t: ['kubelet이 restartPolicy: Always에 따라 같은 Pod 안에서 컨테이너를 다시 띄움.', 'Pod 이름·IP 그대로, RESTARTS +1. 컨트롤러·스케줄러는 관여 안 함.', AGAIN.t],
        ref: '컨테이너 재시작은 그 노드의 kubelet이 함. ReplicaSet이 새 Pod를 만드는 장면 ①(Pod 삭제)과 다름. 메모리 내용은 사라짐.',
        url: `${URL_LIFE}#restart-policy`,
      },
    ];
  }
  if (k === 'c') {
    return [head,
      {
        m: ['손이 칸막이 속도 이상으로 빨라질 수 없음 → 일이 밀려 느려짐.', 'CPU는 넘쳐도 쓰러지지 않음. 메모리와 다른 점.'],
        t: ['CPU가 limits에 닿으면 쓰로틀링됨(CFS 쿼터) → 느려질 뿐 죽지 않음.', 'CPU는 압축 가능한 자원, 메모리는 압축 불가능한 자원.'],
        ref: 'CPU limits는 커널의 CFS 대역폭 제한(쿼터)으로 걸림. 한도를 다 쓰면 그 주기 동안 실행이 멈춤(쓰로틀링). 메모리처럼 프로세스를 죽이지 않음.',
        url: `${URL_RES}#how-pods-with-resource-limits-are-run`,
      },
      {
        m: ['장부에는 아무 표시도 없음. 계속 \'근무\'.', '느려진 것은 장부로는 안 보임 — 응답 시간 같은 지표로 봐야 함.', AGAIN.m],
        t: ['Pod status는 Running 그대로. 쓰로틀링은 status에 안 나옴.', 'cgroup 통계(throttled 시간)나 모니터링 지표로 확인해야 함.', AGAIN.t],
        ref: '쓰로틀링은 Pod 상태를 바꾸지 않음. 컨테이너 cgroup의 CPU 통계(throttled 횟수·시간)나 메트릭으로 확인함.',
        url: URL_RES,
      },
    ];
  }
  if (k === 'd') {
    return [head, OOM_STEP,
      {
        m: ['다시 일으켜도 또 칸막이를 넘음 → 또 쓰러짐.', '다시 일으키기까지 기다리는 시간이 점점 길어짐: 10초 → 20초 → 40초 …'],
        t: ['재시작해도 또 OOMKilled → kubelet이 재시작을 지수 백오프로 미룸.', '10초 → 20초 → 40초 … 최대 5분.'],
        clock: '실제 10초 → 20초 → 40초 (최대 5분)',
        ref: 'kubelet은 반복해서 죽는 컨테이너의 재시작을 10초부터 두 배씩 늘려 최대 5분까지 미룸. 10분간 문제없이 돌면 초기화됨.',
        url: `${URL_LIFE}#container-restarts`,
      },
      {
        m: ['장부: \'재시작 대기\'(재시작 3회). 서류량이나 칸막이 크기를 고쳐야 끝남.', '정원 담당은 아무것도 안 함 — 직원 수는 그대로 3명이기 때문.', AGAIN.m],
        t: ['status: CrashLoopBackOff, RESTARTS 3. limits를 늘리거나 메모리 사용을 줄여야 해결됨.', 'ReplicaSet은 관여 안 함 — Pod 수는 그대로 3개.', AGAIN.t],
        ref: 'CrashLoopBackOff는 컨테이너가 반복해서 죽어 kubelet이 재시작을 미루고 있는 상태. Pod는 지워지지 않으므로 ReplicaSet은 새 Pod를 만들지 않음.',
        url: `${URL_LIFE}#container-restarts`,
      },
    ];
  }
  return [head];
}

const gaugeTo = (k, v, ms) => { const a = S.gauge[k]; return tween(ms, (q) => { S.gauge[k] = a + (v - a) * ease(q); }); };
const heroTop = () => [S.hero.x + 2, S.hero.feet - 20];
const sinkTo = (v, ms) => { const a = S.hero.sink || 0; return tween(ms, (q) => { S.hero.sink = Math.round(a + (v - a) * q); }); };

async function oomFall() {
  await gaugeTo('mem', 0.95, 1400);
  bubble(GAUGE.xs.mem + 2, 76, { m: '칸막이 초과!', t: 'limit 초과!' }, Infinity, 'no');
  await wait(300);
  await sinkTo(8, 300);
  bubble(...heroTop(), { m: '쿵!', t: 'OOMKilled (137)' }, Infinity, 'no');
  await wait(600);
}
async function report5(st, addRestart, flyMs = 1000) {
  await fly(P.kub(1), P.api(), flyMs);
  await receive(false);
  await record(() => {
    const e = entry(S.hero.id);
    e.st = st;
    if (addRestart) e.restarts = (e.restarts || 0) + 1;
    return S.hero.id;
  });
}
async function riseAgain() {
  await hop(S.kub[1]);
  await Promise.all([sinkTo(0, 300), gaugeTo('mem', 0.15, 300)]);
}

const R5 = {
  a: [
    async () => {
      await gaugeTo('mem', 0.6, 1400);
      bubble(GAUGE.xs.mem + 2, 76, { m: '✓ 칸막이 안', t: '✓ limits 안' }, Infinity, 'ok');
      await wait(500);
    },
    async () => {
      bubble(165, 24, { m: '장부 그대로', t: 'status 그대로' }, Infinity, 'ok');
      await wait(600);
    },
  ],
  b: [
    oomFall,
    async () => { await hop(S.kub[1]); await report5('oom', false); await doze(); },
    async () => {
      await riseAgain();
      await report5('run', true);
      await doze();
      bubble(...heroTop(), { m: '재시작 1회', t: 'RESTARTS 1' }, Infinity, 'ok');
    },
  ],
  c: [
    async () => {
      await gaugeTo('cpu', 0.75, 1000);
      S.gauge.thr = true;
      bubble(GAUGE.xs.cpu + 2, 76, { m: '더 못 빨라짐', t: 'throttled' }, Infinity, 'no');
      bubble(...heroTop(), { m: '느려짐…', t: '느려짐…' }, Infinity, 'no');
      await wait(800);
    },
    async () => {
      bubble(165, 24, { m: '장부 그대로', t: 'status 그대로' }, Infinity, 'ok');
      await wait(600);
    },
  ],
  d: [
    oomFall,
    async () => {
      await hop(S.kub[1]);
      await report5('oom', false, 700);
      for (const sec of [10, 20, 40]) {
        clearBubbles();
        bubble(...heroTop(), { m: `⏱ ${sec}초 대기`, t: `back-off ${sec}s` }, Infinity, 'no');
        await wait(900);
        await riseAgain();
        await report5('run', true, 450);
        await gaugeTo('mem', 0.95, 700);
        await sinkTo(8, 250);
        await report5('clb', false, 450);
      }
      await doze();
    },
    async () => {
      bubble(...heroTop(), { m: '재시작 대기 (3회)', t: 'CrashLoopBackOff' }, Infinity, 'no');
      bubble(S.A.rs.x + 6, 26, { m: '직원 수 그대로 3명', t: 'Pod 수 그대로 3' }, Infinity, 'ok');
      await wait(600);
    },
  ],
};

const SCENE5 = {
  clickPods: false,
  sub: { m: '장부는 창구직원만 씀 · 괄호 = 재시작 횟수', t: 'etcd는 apiserver만 씀 · RESTARTS = 재시작 횟수' },
  choices: CHOICES5,
  plan: (c) => ({ k: c.k }),
  init() {
    addPod(0, 0);
    S.hero = addPod(1, 0);
    addPod(2, 0);
    S.gauge = { mem: 0.3, cpu: 0.3, req: 0.4, lim: 0.75, thr: false };
  },
  steps: steps5,
  run: [null, 1, 2, 3].map((i) => i && (() => R5[S.plan.k][i - 1]())),
};
