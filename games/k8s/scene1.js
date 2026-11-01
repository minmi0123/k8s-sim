// 쿠버네티스 회사: 장면 ① 대본
'use strict';

// ===== 장면 ① 퇴사 → 재채용 (대본) =====

const STEPS = [
  {
    m: ['정원 3명, 직원 3명이 근무 중임.', '직원 한 명을 클릭하면 퇴사 처리가 시작됨.'],
    t: ['ReplicaSet replicas: 3, Pod 3개가 Running 상태임.', 'Pod를 클릭하면 삭제 요청이 시작됨.'],
    ref: 'ReplicaSet은 정해진 개수의 Pod가 항상 실행되도록 유지함. 참고: 컨테이너가 죽었다가 다시 켜지는 것(재시작)은 Pod 교체가 아님 — 같은 Pod 안에서 kubelet이 다시 켬.',
    url: 'https://kubernetes.io/docs/concepts/workloads/controllers/replicaset/',
  },
  {
    m: ['관리자가 창구에 퇴사 서류를 냄.', '서류는 무조건 창구로만 들어감.'],
    t: ['kubectl delete pod 요청이 kube-apiserver로 감.', '모든 요청은 apiserver로만 들어감.'],
    clock: C1,
    ref: 'kube-apiserver는 컨트롤 플레인의 프런트엔드임. 다른 구성요소도 etcd에 직접 접근하지 않고 apiserver를 거침.',
    url: 'https://kubernetes.io/docs/concepts/overview/components/',
  },
  {
    m: ['창구직원이 일어나 신분·권한·양식을 검사함.', '검사만 하고, 무엇을 할지는 판단하지 않음.'],
    t: ['인증 → 인가 → 어드미션 순서로 검사함.', 'apiserver는 검사·저장만 하고 결정하지 않음.'],
    clock: C1,
    ref: '요청은 인증(Authentication) → 인가(Authorization) → 어드미션 컨트롤(Admission Control)을 거친 뒤에 저장됨.',
    url: 'https://kubernetes.io/docs/concepts/security/controlling-access/',
  },
  {
    m: ['장부에 \'퇴사 예정\'을 적음. 장부는 창구직원만 씀.', '장부가 바뀌었다고 사내 방송을 함.'],
    t: ['etcd에 deletionTimestamp가 기록됨. etcd는 apiserver만 씀.', 'watch 중인 구성요소에 변경 이벤트가 전달됨.'],
    clock: C1,
    ref: 'Pod 삭제 요청은 바로 지우지 않고 deletionTimestamp를 기록해 종료 중(Terminating) 상태로 만듦. 구성요소들은 폴링 대신 watch로 변경을 계속 받아 봄.',
    url: 'https://kubernetes.io/docs/reference/using-api/api-concepts/#efficient-detection-of-changes',
  },
  {
    m: ['층 관리자: 해당 직원의 퇴근 정리를 시작함.', '정원 담당: 퇴사 예정자를 빼고 셈 → 원함 3 / 실제 2.'],
    t: ['kubelet: 컨테이너에 SIGTERM을 보냄.', 'ReplicaSet 컨트롤러: 종료 중인 Pod를 빼고 셈 → 3 / 2.'],
    clock: '실제 정리 시간: 최대 30초 (기본값)',
    ref: 'kubelet은 컨테이너에 TERM 신호를 보내고 유예 시간(기본 30초)을 기다림. ReplicaSet 컨트롤러는 deletionTimestamp가 있는 Pod를 실행 중 개수에서 뺌(컨트롤러 소스의 활성 Pod 필터 기준). 그래서 정리가 끝나기 전에 바로 새 Pod를 요청함.',
    url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination',
  },
  {
    m: ['정원 담당이 신입 1명 채용 요청서를 냄.', '창구가 검사 후 장부에 \'자리 미정\'으로 등록함.'],
    t: ['컨트롤러가 Pod 템플릿으로 새 Pod 생성을 요청함.', 'etcd에 nodeName이 빈 Pending Pod가 저장됨.'],
    clock: C1,
    ref: '컨트롤러는 원하는 상태와 현재 상태를 비교해, apiserver에 요청을 보내 차이를 줄임. 조정 루프: 원하는 상태 읽기 → 실제 상태 보기 → 차이 계산 → 행동 → watch로 다음 변화 기다리기.',
    url: 'https://kubernetes.io/docs/concepts/architecture/controller/',
  },
  {
    m: ['자리배치 담당이 방송을 듣고 층을 고름.', '빈자리 없는 층은 빼고, 여유가 많은 층에 배정함.', '정리 중인 직원도 아직 자리를 차지함.'],
    t: ['kube-scheduler가 필터링 → 점수 매기기로 노드를 고름.', 'Binding으로 nodeName이 기록됨.', '종료 중인 Pod도 아직 노드 자원을 씀.'],
    clock: C1,
    ref: '필터링으로 Pod를 놓을 수 없는 노드를 빼고, 남은 노드에 점수를 매겨 가장 높은 곳을 고름. 점수가 같으면 그중 무작위로 고름. (이 시뮬레이터는 점수를 빈자리 수로 단순화함.) 종료 중인 Pod는 삭제가 끝날 때까지 노드 자원을 차지함.',
    url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/kube-scheduler/',
  },
  {
    m: ['층 관리자가 방송을 듣고 신입을 자리에 앉힘.', '근무 시작을 보고하고, 장부에 \'근무\'로 적힘.', '이때 잠깐 4명이 있음(1명은 정리 중).'],
    t: ['kubelet이 컨테이너 런타임으로 컨테이너를 띄움.', 'status를 Running으로 보고함.', '이때 잠깐 Pod가 4개임(1개는 Terminating).'],
    clock: '실제 수 초 (이미지 받기에 따라 다름)',
    ref: 'kubelet은 자기 노드에 배정된 Pod를 watch하다가 컨테이너 런타임(CRI)으로 컨테이너를 실행하고, 상태를 apiserver에 보고함.',
    url: 'https://kubernetes.io/docs/concepts/overview/components/#kubelet',
  },
  {
    m: ['정리가 끝난 직원이 나가고, 장부에서 지워짐.', '정원 3명 회복. 신입은 이름이 다른 새 직원임.', '다른 직원을 클릭하면 다시 해 볼 수 있음.'],
    t: ['종료가 끝난 Pod는 etcd에서 삭제됨.', 'replicas 3 회복. 새 Pod는 이름·IP가 다름.', '다른 Pod를 클릭하면 다시 해 볼 수 있음.'],
    clock: '정리 시작 후 최대 30초',
    ref: '컨테이너 종료가 끝나면 kubelet의 마지막 요청으로 Pod 오브젝트가 API에서 삭제됨. 새 Pod는 ReplicaSet이 따로 만든 오브젝트라 이름·IP가 다름.',
    url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination',
  },
];

const RUN = [
  null,
  async () => { // 1. 퇴사 서류 → 창구
    await hop(S.A.me);
    await fly(P.me(), P.api(), 1000);
    S.apiAwake = true;
    await wait(300);
  },
  async () => { // 2. 검사
    await receive(true);
    await wait(400);
  },
  async () => { // 3. 장부 기록 + 방송
    const v = S.victim;
    await record(() => { entry(v.id).st = 'term'; return v.id; });
    await broadcast([P.kub(v.node), P.rs()]);
    await doze();
  },
  async () => { // 4. 퇴근 정리 시작 · 정원 다시 세기
    const v = S.victim;
    v.state = 'term'; v.box = true;
    bubble(v.x + 6, v.feet - 22, { m: '정리 중…', t: 'SIGTERM' }, Infinity, 'no');
    await wait(500);
    bubble(S.A.rs.x + 6, 26, { m: '원함 3 / 실제 2', t: 'spec 3 / 실제 2' });
    await hop(S.A.rs);
    await wait(700);
  },
  async () => { // 5. 채용 요청 → 장부에 '자리 미정'
    await hop(S.A.rs);
    await fly(P.rs(), P.api(), 900);
    await receive(false);
    const f = addPod(null, null);
    S.fresh = f;
    await record(() => { S.ledger.push({ id: f.id, node: null, st: 'pend' }); return f.id; });
    await broadcast([P.sch()]);
    await doze();
  },
  async () => { // 6. 자리 배치
    const free = ROOM_X.map((_, n) => 2 - occ(n));
    const best = Math.max(...free);
    const cand = free.map((f, n) => (f === best && f > 0 ? n : -1)).filter((n) => n >= 0);
    const target = cand[Math.floor(rnd() * cand.length)];
    for (let n = 0; n < 3; n++) {
      if (free[n] <= 0) bubble(ROOM_X[n] + 38, 94, { m: '✗ 빈자리 없음', t: '✗ 필터 탈락' }, Infinity, 'no');
      else bubble(ROOM_X[n] + 38, 94, { m: `여유 ${free[n]}`, t: `점수 ${free[n]}` });
      await wait(350);
    }
    await wait(300);
    bubble(ROOM_X[target] + 38, 84, { m: '✓ 배정', t: '✓ 선택' }, Infinity, 'ok');
    await hop(S.A.sch);
    await fly(P.sch(), P.api(), 900);
    await receive(false);
    const f = S.fresh;
    f.node = target;
    f.desk = freeDesks(target, f)[0];
    S.target = target;
    await record(() => { const e = entry(f.id); e.node = target; e.st = 'crt'; return f.id; });
    await broadcast([P.kub(target)]);
    await doze();
  },
  async () => { // 7. 신입 출근 → 근무 보고
    const f = S.fresh, n = S.target;
    await hop(S.kub[n]);
    f.x = ROOM_X[n] + 62; f.feet = DESK_FEET; f.state = 'run';
    await walk(f, deskX(n, f.desk), 1200);
    f.dir = 'r';
    await wait(200);
    await fly(P.kub(n), P.api(), 1000);
    await receive(false);
    await record(() => { entry(f.id).st = 'run'; return f.id; });
    await doze();
  },
  async () => { // 8. 퇴사자 퇴장 → 장부에서 삭제
    const v = S.victim;
    clearBubbles();
    await walk(v, ROOM_X[v.node] + 62, 1000);
    await tween(400, (p) => { v.alpha = 1 - p; });
    v.state = 'gone';
    await fly(P.kub(v.node), P.api(), 1000);
    await receive(false);
    await record(() => { S.ledger = S.ledger.filter((e) => e.id !== v.id); return null; });
    await doze();
    bubble(S.A.rs.x + 6, 26, { m: '원함 3 / 실제 3 ✓', t: 'spec 3 / 실제 3 ✓' }, Infinity, 'ok');
    S.pods = S.pods.filter((p) => p.state !== 'gone');
  },
];

const SCENE1 = {
  clickPods: true,
  sub: { m: '정원: 3명 · 장부는 창구직원만 씀', t: 'ReplicaSet replicas: 3 · etcd는 apiserver만 씀' },
  init() { addPod(0, 0); addPod(0, 1); addPod(1, 0); },
  steps: () => STEPS,
  run: RUN,
};
