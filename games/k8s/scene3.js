// 쿠버네티스 회사: 장면 ③ 대본
'use strict';

// ===== 장면 ③ 채용 요청서 따라가기 (대본) =====

const URL_DEPLOY = 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/';
const PLAN3 = { m: '영업팀 · 3명 · 매뉴얼 v1', t: 'replicas: 3 · image: web:v1' };
const LOBBY3 = [186, 199, 212];

const STEPS3 = [
  {
    m: ['아직 영업팀 직원이 없음.', '아래 버튼으로 운영 계획서를 내면, 누가 무엇을 하는지 순서대로 보임.'],
    t: ['아직 web Deployment가 없음.', 'kubectl apply로 Deployment를 만들면 구성요소들의 동작이 순서대로 보임.'],
    ref: 'Deployment는 원하는 상태(복제 수, 컨테이너 이미지 등)를 선언하는 오브젝트임. Deployment → ReplicaSet → Pod 순서로 관리됨.',
    url: URL_DEPLOY,
  },
  {
    m: ['관리자가 운영 계획서(영업팀 3명, 매뉴얼 v1)를 창구에 냄.', '창구가 검사 후 장부에 적고 방송함. 계획서만 적혔을 뿐, 직원은 아직 0명.'],
    t: ['kubectl apply가 Deployment를 kube-apiserver에 보냄.', '검사 후 etcd에 저장되고 watch 이벤트가 나감. 아직 Pod는 0개.'],
    clock: C1,
    ref: 'apiserver는 인증·인가·어드미션을 거쳐 오브젝트를 etcd에 저장할 뿐, Pod를 만들지 않음. 실제 일은 watch 하던 컨트롤러들이 함.',
    url: 'https://kubernetes.io/docs/concepts/overview/components/',
  },
  {
    m: ['기획 담당이 방송을 듣고, 매뉴얼 v1용 정원표를 만들어 창구에 냄.', '장부에 정원표가 적힘. 기획 담당은 직원을 직접 뽑지 않음.'],
    t: ['Deployment 컨트롤러가 ReplicaSet 생성을 요청함.', 'Deployment는 Pod를 직접 만들지 않고 ReplicaSet을 통해 관리함.'],
    clock: C1,
    ref: 'Deployment 컨트롤러는 Pod 템플릿마다 ReplicaSet을 만들고, 이름 끝에 pod-template-hash를 붙임(예: web-6d4f9c7b8). 매뉴얼(이미지)이 바뀌면 새 정원표가 생김 → 장면 ⑥.',
    url: URL_DEPLOY,
  },
  {
    m: ['정원 담당: 원함 3 / 실제 0 → 신입 3명 채용 요청.', '장부에 \'자리 미정\' 3명이 적히고, 신입들은 로비에서 대기함.'],
    t: ['ReplicaSet 컨트롤러: 3 / 0 → Pod 3개 생성 요청.', 'nodeName 없는 Pending Pod 3개가 etcd에 저장됨.'],
    clock: C1,
    ref: 'ReplicaSet 컨트롤러가 부족한 수만큼 Pod를 만듦. 각 Pod의 metadata.ownerReferences에 이 ReplicaSet이 적힘.',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/',
  },
  {
    m: ['자리배치 담당이 한 명씩 층을 정함.', '여유 많은 층부터 고르니 세 층에 고르게 퍼짐. 장부에 층이 적힘(바인딩).'],
    t: ['kube-scheduler가 Pod를 하나씩 노드에 Binding함.', '빈 노드 점수가 높아 노드마다 고르게 퍼짐.'],
    clock: C1,
    ref: 'kube-scheduler는 Pod를 하나씩 처리함. 자원 여유 점수와 기본 분산 규칙(같은 워크로드의 Pod를 노드에 퍼뜨림) 때문에 보통 노드에 고르게 놓임.',
    url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/topology-spread-constraints/',
  },
  {
    m: ['층 관리자들이 매뉴얼 v1을 받아 온 뒤 신입을 각자 자리에 앉힘.', '근무 시작을 보고하고, 장부에 \'근무\'로 적힘.'],
    t: ['각 노드의 kubelet이 이미지(web:v1)를 받고 컨테이너를 띄움.', 'Pod status가 Running으로 보고됨.'],
    clock: '실제 수 초 ~ 수십 초 (이미지 크기에 따라)',
    ref: 'kubelet은 이미지를 받고(노드에 이미 있으면 imagePullPolicy에 따라 생략) 컨테이너 런타임으로 컨테이너를 띄운 뒤 상태를 보고함.',
    url: 'https://kubernetes.io/docs/concepts/containers/images/',
  },
  {
    m: ['정원 담당은 정원표에, 기획 담당은 계획서에 \'3/3\'을 적음.', '계획서 → 정원표 → 직원으로 이어져 있음(장부의 └).', '아래 버튼으로 다시 볼 수 있음.'],
    t: ['ReplicaSet·Deployment 컨트롤러가 각자 status를 갱신함 → READY 3/3.', 'ownerReferences: Pod → ReplicaSet → Deployment.', '아래 버튼으로 다시 볼 수 있음.'],
    clock: C1,
    ref: 'status는 각 컨트롤러가 갱신함. 하위 오브젝트의 metadata.ownerReferences가 상위를 가리킴(Pod → ReplicaSet → Deployment). 상위를 지우면 가비지 컬렉션이 하위도 지움.',
    url: 'https://kubernetes.io/docs/concepts/architecture/garbage-collection/',
  },
];

const RUN3 = [
  null,
  async () => { // 1. 계획서 → 창구 → 장부
    bubble(S.A.me.x + 6, 31, PLAN3, Infinity, '', true);
    await hop(S.A.me);
    await fly(P.me(), P.api(), 1000);
    await receive(true);
    await record(() => { S.ledger.push({ id: 'dep', kind: 'dep', ready: 0 }); return 'dep'; });
    await broadcast([P.dep()]);
    await doze();
  },
  async () => { // 2. 기획 담당 → 정원표
    await hop(S.A.dep);
    bubble(S.A.dep.x + 6, 26, { m: '정원표 v1 작성', t: 'ReplicaSet 생성' }, 1800);
    await wait(500);
    await fly(P.dep(), P.api(), 900);
    await receive(false);
    await record(() => { S.ledger.push({ id: 'rs', kind: 'rs', ready: 0 }); return 'rs'; });
    await broadcast([P.rs()]);
    await doze();
  },
  async () => { // 3. 정원 담당 → 신입 3명 (로비 대기)
    bubble(S.A.rs.x + 6, 26, { m: '원함 3 / 실제 0', t: 'spec 3 / 실제 0' });
    await hop(S.A.rs);
    await wait(400);
    await fly(P.rs(), P.api(), 900);
    await receive(false);
    const fs = LOBBY3.map((x) => {
      const f = addPod(null, null);
      Object.assign(f, { x, feet: 58, dir: 'l', state: 'lobby', alpha: 0 });
      return f;
    });
    S.fresh3 = fs;
    await record(() => { fs.forEach((f) => S.ledger.push({ id: f.id, node: null, st: 'pend' })); return fs.map((f) => f.id); });
    await tween(300, (q) => fs.forEach((f) => { f.alpha = q; }));
    await broadcast([P.sch()]);
    await doze();
  },
  async () => { // 4. 한 명씩 자리 배치 → 바인딩
    const fs = S.fresh3, cnt = [0, 0, 0];
    await hop(S.A.sch);
    for (const f of fs) {
      const free = cnt.map((c, n) => 2 - occ(n) - c);
      const best = Math.max(...free);
      const top = free.map((v, n) => (v === best ? n : -1)).filter((n) => n >= 0);
      const n = top[Math.floor(rnd() * top.length)];
      f.target = n;
      f.desk = freeDesks(n, f)[cnt[n]];
      cnt[n]++;
      bubble(ROOM_X[n] + 38, 100, { m: `✓ ${f.mn} 배정`, t: `✓ …${f.sfx}` }, Infinity, 'ok');
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
  },
  async () => { // 5. 층 관리자: 매뉴얼 받기 → 앉히기 → 보고
    const fs = S.fresh3, used = [...new Set(fs.map((f) => f.node))];
    await Promise.all(used.map((n) => hop(S.kub[n])));
    used.forEach((n) => bubble(ROOM_X[n] + 38, 100, { m: '매뉴얼 v1 받는 중', t: 'pull web:v1' }, 1500, 'no'));
    await wait(1500);
    await tween(300, (q) => fs.forEach((f) => { f.alpha = 1 - q; }));
    fs.forEach((f) => Object.assign(f, { x: ROOM_X[f.node] + 62, feet: DESK_FEET, state: 'run', alpha: 1 }));
    await Promise.all(fs.map((f) => walk(f, deskX(f.node, f.desk), 1200)));
    fs.forEach((f) => { f.dir = 'r'; });
    await wait(200);
    await Promise.all(used.map((n, i) => wait(i * 150).then(() => fly(P.kub(n), P.api(), 900))));
    await receive(false);
    await record(() => { fs.forEach((f) => { entry(f.id).st = 'run'; }); return fs.map((f) => f.id); });
    await doze();
  },
  async () => { // 6. 정원표 · 계획서 status 갱신
    await hop(S.A.rs);
    await fly(P.rs(), P.api(), 900);
    await receive(false);
    await record(() => { entry('rs').ready = 3; return 'rs'; });
    await hop(S.A.dep);
    await fly(P.dep(), P.api(), 900);
    await receive(false);
    await record(() => { entry('dep').ready = 3; return 'dep'; });
    await doze();
    bubble(S.A.dep.x + 6, 26, { m: '계획 완료 3/3 ✓', t: 'READY 3/3 ✓' }, Infinity, 'ok');
  },
];

const SCENE3 = {
  clickPods: false,
  sub: { m: '장부는 창구직원만 씀 · └ = 누구 소속인지', t: 'etcd는 apiserver만 씀 · └ = ownerReferences' },
  choices: [{ m: '영업팀 운영 계획서 제출', t: 'kubectl apply -f web.yaml' }],
  plan: () => ({}),
  init() { S.A.dep = { x: 86, feet: 58, dy: 0 }; },
  steps: () => STEPS3,
  run: RUN3,
};
