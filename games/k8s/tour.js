// 쿠버네티스 회사: 살펴보기(넘겨 보는 공부 화면) 내용 — 그림은 장면 무대를 멈춰서 찍는다
'use strict';

// 무대 한 장 찍기: 장면 상태를 잠깐 바꿔 draw() 하고 되돌린다 (씨앗 · 직원 번호도 되돌림 → 장면 · 다시보기에 영향 없음)
const TOUR_SC = { init() { addPod(0, 0); addPod(0, 1); addPod(1, 0); } };   // 장면 ① 처럼, 클릭 화살표 없이
function tourShot(sc, setup) {
  const keep = { S, SC, seed, podSeq };
  seed = 20261105; podSeq = 0; SC = sc;
  initState();
  S.apiAwake = true;
  if (setup) setup();
  draw();
  const img = document.createElement('canvas');
  img.width = W; img.height = H;
  img.getContext('2d').drawImage(cv, 0, 0);
  const shot = { img, pods: S.pods.filter((p) => p.state === 'run'), A: S.A, kub: S.kub };
  ({ S, SC, seed, podSeq } = keep);
  return shot;
}

// 그림 위 이름표 모양: { txt, s?, at: [x, y], cls? } — 장면 이름표와 같음
const tagMe = { txt: { m: '나(관리자)', t: 'kubectl' }, s: { m: '나', t: 'kubectl' }, at: [232, 40] };
const tagApi = { txt: { m: '창구직원', t: 'kube-apiserver' }, s: { m: '창구', t: 'apiserver' }, at: [126, 36] };
const tagEtcd = { txt: { m: '장부', t: 'etcd' }, at: [165, 28] };
const tagRs = { txt: { m: '정원 담당', t: 'ReplicaSet 컨트롤러' }, s: { m: '정원', t: 'RS' }, at: [56, 40] };
const tagSch = { txt: { m: '자리배치 담당', t: 'kube-scheduler' }, s: { m: '배치', t: 'sched' }, at: [22, 40] };
const tagRooms = ROOM_X.map((x0, n) => ({ txt: ROOMS[n], at: [x0 + 2, 79], cls: 'room' }));
const tagKubs = ROOM_X.map((x0) => ({ txt: { m: '층 관리자', t: 'kubelet' }, s: { m: '관리자', t: 'kubelet' }, at: [x0 + 8, 119] }));
const tagPods = (shot) => shot.pods.map((p) => ({ txt: podLabel(p), at: [p.x + 6, p.feet + 8], cls: 'pod' }));
const num = (k, tag) => ({ ...tag, txt: { m: `${k} ${tag.txt.m}`, t: `${k} ${tag.txt.t}` }, s: tag.s && { m: `${k} ${tag.s.m}`, t: `${k} ${tag.s.t}` } });
const boxPod = (p) => [p.x - 3, p.feet - 18, 18, 20];   // 직원 + 책상

// 「~란?」 패널: 한 줄 정의 · 비유 · 자세히 · 나오는 장면 (스위치와 상관없이 둘 다 보여 줌)
const TERM = {
  cluster: { q: '클러스터란?', def: 'Pod를 실행하는 노드들과, 이를 관리하는 컨트롤 플레인을 묶은 것입니다.', ana: '회사 전체 — 본사와 여러 층',
    more: '컨트롤 플레인은 apiserver·etcd·scheduler·controller-manager로 이루어져 있습니다. 워커 노드에는 kubelet·kube-proxy·컨테이너 런타임이 있습니다. 사용자는 apiserver하고만 이야기합니다.', sc: [] },
  node: { q: '노드란?', def: 'Pod가 실행되는 머신 한 대(물리 서버 또는 VM)입니다.', ana: '층',
    more: '노드마다 CPU·메모리가 정해져 있습니다. 노드에 장애가 나도 Pod는 옮겨지지 않고, 다른 노드에 새로 만들어집니다.', sc: [4] },
  pod: { q: '파드란?', def: '컨테이너를 하나 이상 묶어 실행하는 가장 작은 단위입니다.', ana: '직원',
    more: '한 Pod 안의 컨테이너는 같은 노드에서 같은 IP를 씁니다. 보통 직접 만들지 않고 ReplicaSet·Deployment가 만듭니다. 컨테이너가 죽으면 같은 Pod 안에서 다시 켜지고(장면 ⑤), Pod가 지워지면 새 Pod가 생깁니다(장면 ①).', sc: [1, 5] },
  api: { q: 'apiserver란?', def: '클러스터의 모든 요청을 받는 유일한 창구입니다.', ana: '창구직원',
    more: '인증(누구인가), 인가(해도 되는가), 어드미션(규칙에 맞는가)을 검사합니다. 통과한 내용을 etcd에 저장하고, 다른 구성 요소는 watch로 바뀐 것을 받습니다.', sc: [3] },
  etcd: { q: 'etcd란?', def: '클러스터의 상태를 저장하는 키-값 저장소입니다.', ana: '장부',
    more: 'apiserver만 직접 읽고 씁니다. etcd를 잃으면 클러스터 상태를 잃기 때문에 백업 대상입니다.', sc: [] },
  ctrl: { q: '컨트롤러란?', def: '원하는 상태와 현재 상태를 비교해, 차이를 메우는 반복 작업입니다.', ana: '정원 담당·기획 담당',
    more: 'kube-controller-manager 안에 ReplicaSet·Deployment·Node·EndpointSlice 컨트롤러 등이 들어 있습니다. 컨테이너를 직접 실행하지 않고, 오브젝트를 만들고 지우기만 합니다.', sc: [1, 3] },
  sched: { q: '스케줄러란?', def: '아직 노드가 정해지지 않은 Pod에 노드를 정해 주는 구성 요소입니다.', ana: '자리배치 담당',
    more: '갈 수 없는 노드(자원 부족·taint·라벨 조건)를 먼저 빼고, 남은 노드에 점수를 매겨 하나를 고릅니다. 맞는 노드가 없으면 Pending입니다.', sc: [2] },
  kubelet: { q: 'kubelet이란?', def: '노드마다 돌면서 그 노드의 Pod를 실제로 실행하는 에이전트입니다.', ana: '층 관리자',
    more: '실행은 컨테이너 런타임에 맡깁니다. 프로브를 검사하고 컨테이너를 다시 켭니다(장면 ⑤ ⑥). Lease 갱신이 끊기면 노드 장애로 봅니다(장면 ④).', sc: [4, 5, 6] },
  svc: { q: 'Service란?', def: '바뀌는 Pod들 앞에 고정된 주소 하나를 두는 오브젝트입니다.', ana: '대표번호',
    more: 'label selector로 Pod를 고릅니다. EndpointSlice에는 Pod마다 ready 여부가 적히고, ready인 Pod만 요청을 받습니다. CoreDNS가 이름을 ClusterIP로 알려 줍니다(번호 안내).', sc: [7] },
};

// 슬라이드: kick(번호 · 분류) · title(질문) · body(비유/용어) · terms · pic() → { img, hl?, dim?, tags } · scenes(마지막 장)
const TOUR = [
  { kick: '01 · 한눈에', title: '직원 한 명은 어떻게 자리에 앉을까',
    body: {
      m: '나는 "직원 3명"이라고 적은 요청서를 창구에 냅니다. 정원 담당이 모자란 인원만큼 채용 서류를 올리고, 자리배치 담당이 층을 정하고, 층 관리자가 직원을 앉힙니다. 담당자끼리는 서로 말하지 않습니다. 모두 창구를 거쳐 장부만 봅니다. 다음 장부터 한 명씩 자세히 봅니다.',
      t: 'kubectl로 replicas: 3인 ReplicaSet을 apiserver에 보냅니다. ReplicaSet 컨트롤러가 모자란 수만큼 Pod를 만들고, kube-scheduler가 Pod를 둘 노드를 정하고, 그 노드의 kubelet이 컨테이너를 실행합니다. 구성 요소끼리는 서로 직접 부르지 않습니다. 모두 apiserver를 watch하며 바뀐 것을 봅니다. 다음 장부터 하나씩 자세히 봅니다.',
    },
    terms: [],
    pic: () => {
      const s = tourShot(TOUR_SC);
      return { img: s.img, tags: [num('①', tagMe), num('②', tagApi), tagEtcd, num('③', tagRs), { ...num('④', tagSch), at: [22, 30] }, num('⑤', tagKubs[2])] };
    } },
  { kick: '02 · 회사', title: '회사는 무엇을 대신 해 줄까',
    body: {
      m: '회사는 본사와 여러 층으로 이루어져 있습니다. 나는 "이렇게 되어 있으면 좋겠다"만 적습니다. 그러면 회사가 지금 모습을 적힌 모습에 계속 맞춥니다.',
      t: '클러스터는 컨트롤 플레인과 여러 워커 노드로 이루어져 있습니다. 사용자는 원하는 상태를 오브젝트로 적습니다. 그러면 컨트롤러가 현재 상태를 원하는 상태에 계속 맞춥니다.',
    },
    terms: ['cluster'],
    pic: () => {
      const s = tourShot(TOUR_SC);
      return { img: s.img, dim: false, hl: [[1, 1, 254, 60], [1, 64, 254, 79]],
        tags: [{ txt: { m: '본사', t: '컨트롤 플레인' }, at: [128, 16], cls: 'big' }, { txt: { m: '층들', t: '워커 노드' }, at: [128, 102], cls: 'big' }] };
    } },
  { kick: '03 · 층', title: '직원은 어디에 앉을까',
    body: {
      m: '층마다 책상 수가 정해져 있습니다. 직원은 빈 책상이 있는 층에만 앉을 수 있습니다. 빈 책상이 없으면 로비에서 기다립니다.',
      t: '노드는 Pod가 실행되는 머신(물리 서버 또는 VM)입니다. 스케줄러는 Pod의 requests와 노드의 남은 자원을 비교해, 들어갈 수 있는 노드만 고릅니다. 맞는 노드가 없으면 Pod는 Pending으로 남습니다.',
    },
    terms: ['node'],
    pic: () => {
      const s = tourShot(TOUR_SC);
      return { img: s.img, hl: ROOM_X.map((x0) => [x0 - 1, 69, 78, 73]),
        tags: [...tagRooms, { txt: { m: '빈 책상 2개', t: '남은 CPU·메모리' }, s: { m: '빈 책상', t: '남은 자원' }, at: [210, 116] }] };
    } },
  { kick: '04 · 직원', title: '일은 누가 할까',
    body: {
      m: '직원은 매뉴얼대로 일합니다. 직원은 다른 층으로 이사하지 않습니다. 직원이 그만두면 새 직원을 뽑는데, 이름도 내선번호도 달라집니다.',
      t: 'Pod는 컨테이너 이미지를 실행하는 가장 작은 배포 단위입니다. Pod는 다른 노드로 옮겨지지 않습니다. Pod가 지워지면 컨트롤러가 새 Pod를 만드는데, 이름도 IP도 달라집니다.',
    },
    terms: ['pod'],
    pic: () => {
      const s = tourShot(TOUR_SC, () => S.pods.forEach((p) => { p.ver = 'v1'; }));   // 책상 위 매뉴얼
      return { img: s.img, hl: s.pods.map(boxPod), tags: tagPods(s) };
    } },
  { kick: '05 · 창구', title: '모든 요청은 누구를 거칠까',
    body: {
      m: '창구직원은 서류 검사만 깐깐하게 하고, 무엇을 할지는 정하지 않습니다. 장부는 창구직원만 씁니다. 다른 담당자들은 창구에 물어서 장부를 봅니다.',
      t: 'kube-apiserver는 요청의 인증·인가·어드미션 검사만 하고, 무엇을 할지는 정하지 않습니다. etcd는 apiserver만 직접 읽고 씁니다. 다른 구성 요소는 apiserver를 거쳐 상태를 읽고 씁니다.',
    },
    terms: ['api', 'etcd'],
    pic: () => {
      const s = tourShot(TOUR_SC);
      return { img: s.img, hl: [[102, 34, 50, 28], [156, 28, 19, 33]], tags: [tagApi, tagEtcd] };
    } },
  { kick: '06 · 담당자', title: '누가 무엇을 정할까',
    body: {
      m: '정원 담당은 장부에 적힌 인원을 정원과 비교해, 모자라면 채용 서류를 올립니다. 자리배치 담당은 직원이 앉을 층만 정하고, 직접 데려가지는 않습니다.',
      t: 'ReplicaSet 컨트롤러는 실제 Pod 수를 replicas와 비교해, 모자라면 Pod를 만듭니다. kube-scheduler는 Pod를 둘 노드만 정하고(바인딩), 실행은 하지 않습니다.',
    },
    terms: ['ctrl', 'sched'],
    pic: () => {
      const s = tourShot(TOUR_SC);
      return { img: s.img, hl: [[8, 38, 22, 24], [46, 38, 22, 24]], tags: [tagSch, tagRs] };
    } },
  { kick: '07 · 층 관리자', title: '직원을 실제로 앉히는 건 누구일까',
    body: {
      m: '층마다 관리자가 한 명씩 있습니다. 관리자는 자기 층에 배정된 직원을 앉히고, 층이 살아 있다는 신호를 본사에 계속 보냅니다.',
      t: 'kubelet은 노드마다 하나씩 있습니다. kubelet은 그 노드에 배정된 Pod의 컨테이너를 실행하고, Lease를 갱신해 노드가 살아 있음을 알립니다.',
    },
    terms: ['kubelet'],
    pic: () => {
      const s = tourShot(TOUR_SC);
      return { img: s.img, hl: s.kub.map((k) => [k.x - 1, k.feet - 18, 14, 19]), tags: tagKubs };
    } },
  { kick: '08 · 대표번호', title: '직원이 바뀌어도 어떻게 연락할까',
    body: {
      m: '직원이 바뀌면 내선번호도 바뀝니다. 그래서 대표번호를 하나 두고, 명단 담당이 지금 일할 수 있는 직원 명단을 맞춰 둡니다. 전화가 오면 교환기가 명단에 있는 직원 중 한 명에게 연결합니다.',
      t: 'Pod를 다시 만들면 Pod IP가 바뀝니다. 그래서 Service가 바뀌지 않는 ClusterIP를 하나 두고, EndpointSlice 컨트롤러가 Ready인 Pod 목록을 맞춰 둡니다. 각 노드의 kube-proxy가 만든 규칙이 요청을 그중 한 Pod로 보냅니다.',
    },
    terms: ['svc'],
    pic: () => {
      const s = tourShot(SCENE7, () => { S.pods = S.pods.filter((p) => !p.team); });   // 총무팀 직원(전화 거는 쪽)은 빼고
      return { img: s.img, hl: [[82, 38, 22, 24], [184, 43, 22, 19], ...ROOM_X.map((x0) => [x0 + 42, 81, 18, 12])],
        tags: [{ txt: { m: '명단 담당', t: 'EndpointSlice 컨트롤러' }, s: { m: '명단', t: 'EPS' }, at: [92, 40] },
          { txt: { m: '번호 안내', t: 'CoreDNS' }, s: { m: '안내', t: 'DNS' }, at: [193, 44] },
          ...ROOM_X.map((x0) => ({ txt: { m: '교환기', t: 'kube-proxy' }, at: [x0 + 51, 81], cls: 'pod' })), ...tagPods(s)] };
    } },
  { kick: '09 · 장면에서', title: '이제 무엇을 볼까',
    body: {
      m: '장면에서 직접 움직여 보며 확인합니다. 아래에서 보고 싶은 장면을 누르세요.',
      t: '장면에서 직접 움직여 보며 확인합니다. 아래에서 보고 싶은 장면을 누르세요.',
    },
    terms: [], scenes: true,
    pic: () => ({ img: tourShot(TOUR_SC).img, tags: [] }) },
];
