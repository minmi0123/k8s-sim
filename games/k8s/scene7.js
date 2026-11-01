// 쿠버네티스 회사: 장면 ⑦ 대본
'use strict';

// ===== 장면 ⑦ 대표번호 연결 (대본) — Service · EndpointSlice · kube-proxy · CoreDNS =====

const URL_SVC = 'https://kubernetes.io/docs/concepts/services-networking/service/';
const URL_EPS = 'https://kubernetes.io/docs/concepts/services-networking/endpoint-slices/';
const URL_VIP = 'https://kubernetes.io/docs/reference/networking/virtual-ips/';
const URL_DNS = 'https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/';
const CHOICES7 = [
  { m: '대표번호 개설', t: 'Service 생성', k: 'open' },
  { m: '대표번호로 전화', t: 'Service 호출 (DNS → ClusterIP)', k: 'call' },
  { m: '직원 교체', t: 'Pod 교체 → EndpointSlice 갱신', k: 'swap' },
  { m: '바쁜 직원', t: 'readiness 실패 → 엔드포인트 제외', k: 'nr' },
];

function steps7() {
  const k = S.plan && S.plan.k, h = S.hero, N = h ? h.mn : '', E = h ? h.ext : '';
  const X = S.pods.filter((p) => p.ip && !p.team).slice(0, 3).map((p) => p.ext).join('·');
  const head = {
    m: ['영업팀 3명은 각자 내선번호(☎)가 있음. 직원이 바뀌면 번호도 바뀜.', '그래서 바뀌지 않는 대표번호 ☎900을 둠. 아래에서 고르면 시작됨.'],
    t: ['Pod마다 IP가 있지만, Pod가 바뀌면 IP도 바뀜.', 'Service가 바뀌지 않는 이름과 가상 IP(ClusterIP)를 줌. 아래에서 고르면 시작됨.'],
    ref: 'Service는 같은 일을 하는 Pod 묶음에 고정된 이름과 IP를 줌. 클라이언트는 Pod IP를 몰라도 됨. 층마다 벽의 교환기 = kube-proxy, 불 켜진 칸 = 규칙에 있는 연결 대상 수.',
    url: URL_SVC,
  };
  if (k === 'open') {
    return [head,
      {
        m: ['관리자가 대표번호 신청서(\'영업팀\' 표시가 붙은 직원 연결)를 창구에 냄.', '창구가 검사 후 대표번호 ☎900을 정해 장부에 적고 방송함.'],
        t: ['kubectl apply로 Service(selector: app=web)를 만듦.', 'apiserver가 ClusterIP 10.96.0.15를 할당해 저장하고 watch 이벤트가 나감.'],
        clock: C1,
        ref: 'Service를 만들면 컨트롤 플레인이 서비스 IP 대역에서 ClusterIP를 할당함. 이 IP는 어떤 네트워크 장치에도 붙어 있지 않은 가상 IP임.',
        url: URL_SVC,
      },
      {
        m: ['명단 담당: \'영업팀\' 표시가 붙고 준비된 직원만 골라 연결 명단을 만듦.', '총무팀 직원은 표시가 달라 빠짐.'],
        t: ['EndpointSlice 컨트롤러가 selector(app=web)에 맞는 Pod의 IP·준비 상태로 EndpointSlice를 만듦.', 'app=front Pod는 대상 아님.'],
        clock: C1,
        ref: 'selector가 있는 Service에는 컨트롤 플레인(EndpointSlice 컨트롤러)이 EndpointSlice를 자동으로 만듦. EndpointSlice의 ownerReference가 Service를 가리킴(장부의 └).',
        url: URL_EPS,
      },
      {
        m: [`층마다 교환기가 방송을 듣고 '☎900 → ${X} 중 하나' 규칙을 적어 둠.`, '모든 층에 같은 규칙 — 어느 층에서 걸어도 연결됨.'],
        t: ['모든 노드의 kube-proxy가 Service·EndpointSlice를 watch해 규칙(iptables 등)을 씀.', '어느 노드에서 ClusterIP로 보내도 같은 규칙이 적용됨.'],
        clock: C1,
        ref: 'kube-proxy는 모든 노드에서 돌며 Service와 EndpointSlice의 추가·삭제를 watch함. 리눅스 모드는 iptables(현재 기본)·ipvs·nftables.',
        url: `${URL_VIP}#proxy-mode-iptables`,
      },
      {
        m: ['번호 안내도 \'영업팀 = ☎900\'을 번호부에 올림.', '이제 이름(영업팀)만 알면 전화할 수 있음.', AGAIN.m],
        t: ['CoreDNS가 Service를 watch해 web.default.svc.cluster.local → 10.96.0.15 레코드를 제공함.', '클라이언트는 이름만 알면 됨.', AGAIN.t],
        clock: C1,
        ref: '클러스터 DNS(CoreDNS)는 Service마다 이름 → ClusterIP 레코드를 만듦. CoreDNS는 실제로는 클러스터 안의 Pod로 돎 — 그림에선 본사에 둠(단순화).',
        url: URL_DNS,
      },
    ];
  }
  if (k === 'call') {
    return [head,
      {
        m: ['총무팀 직원(3층)이 영업팀에 전화하려 함.', '먼저 번호 안내에 물어 대표번호 ☎900을 받음.'],
        t: ['클라이언트 Pod가 http://web 을 호출 → CoreDNS에 web의 IP를 물음.', '답: ClusterIP 10.96.0.15.'],
        clock: C1,
        ref: 'Pod의 /etc/resolv.conf는 클러스터 DNS를 가리킴. 같은 네임스페이스면 web, 다른 네임스페이스면 web.<네임스페이스>로 찾음(search 도메인).',
        url: URL_DNS,
      },
      {
        m: ['☎900으로 걸면 자기 층 교환기의 규칙이 명단 중 1명을 골라 바로 연결함.', '창구직원·장부는 전화 연결에 끼지 않음.'],
        t: ['패킷이 그 노드 커널의 규칙에서 Pod IP 하나로 목적지가 바뀌어(DNAT) 그 Pod로 직접 감.', 'apiserver·etcd는 데이터 경로에 없음. 다른 노드의 Pod로도 바로 감.'],
        clock: '실제 1밀리초 미만',
        ref: 'iptables 모드의 kube-proxy는 커널에 규칙만 심고 패킷을 직접 나르지 않음. 규칙이 엔드포인트 하나를 기본적으로 무작위로 골라 목적지를 바꿈. 노드 사이 전달은 Pod 네트워크(CNI)가 함.',
        url: `${URL_VIP}#proxy-mode-iptables`,
      },
      {
        m: ['다시 걸면 다른 직원이 받을 수 있음. 대표번호는 그대로, 받는 사람만 바뀜.', '전화가 여러 직원에게 나뉨(부하 분산).', AGAIN.m],
        t: ['새 연결마다 엔드포인트를 다시 고름 → 요청이 Pod들에 나뉨.', '한 연결(keep-alive) 안의 요청들은 같은 Pod로 감.', AGAIN.t],
        clock: C1,
        ref: '선택은 연결 단위임(커널 conntrack이 연결마다 고른 목적지를 기억). 그래서 오래 유지되는 연결은 한 Pod에 몰릴 수 있음.',
        url: URL_VIP,
      },
    ];
  }
  if (k === 'swap') {
    return [head,
      {
        m: [`관리자가 2층 직원(${N} ☎${E})을 퇴사 처리함 → 장부에 '퇴사 예정'.`, '명단 담당이 그 직원을 연결 대상에서 바로 뺌.'],
        t: ['Pod 삭제 → Terminating.', 'EndpointSlice 컨트롤러가 그 엔드포인트를 terminating으로 표시 → 새 연결 대상에서 빠짐.'],
        clock: C1,
        ref: '종료 중인 Pod는 EndpointSlice에 terminating으로 남고, 프록시는 보통 이런 엔드포인트를 무시함(그림에선 명단에서 뺌). 그동안 Pod는 정리(최대 30초)를 함.',
        url: `${URL_EPS}#conditions`,
      },
      {
        m: [`층마다 교환기가 규칙에서 ☎${E}를 뺌. 그사이 전화는 남은 2명에게만 감.`, '정리가 끝난 직원이 나감.'],
        t: ['각 노드의 kube-proxy가 규칙 갱신 → 남은 2개로만 연결.', '종료가 끝난 Pod는 삭제됨.'],
        clock: C1,
        ref: 'kube-proxy는 EndpointSlice 변화를 watch해 규칙을 고침. 갱신은 노드마다 따로 일어나서 아주 짧은 시차가 있을 수 있음.',
        url: URL_VIP,
      },
      {
        m: ['정원 담당이 신입을 뽑아 출근시킴(장면 ①과 같음).', '내선번호는 앉은 층에서 새로 받음(이전 직원 번호와 다름). 준비되면 \'근무\'.'],
        t: ['ReplicaSet이 새 Pod 생성 → 스케줄링 → kubelet 실행(장면 ①).', 'Pod IP는 노드에서 새로 할당됨(CNI) → 이전 IP와 다름. readiness 성공 → Ready.'],
        clock: '실제 수 초',
        ref: 'Pod IP는 Pod가 노드에서 만들어질 때 네트워크 플러그인(CNI)이 줌. Pod를 다시 만들면 IP가 바뀜 — 그래서 Service가 필요함.',
        url: URL_SVC,
      },
      {
        m: ['명단 담당이 신입을 명단에 넣고, 교환기들이 규칙을 고침.', '다시 3명.'],
        t: ['EndpointSlice에 새 IP 추가 → 모든 노드의 kube-proxy가 규칙 갱신.', '엔드포인트 다시 3개.'],
        clock: C1,
        ref: 'Ready가 된 Pod만 새 연결 대상이 됨. 준비되기 전에는 명단에 있어도 ready=false라 연결되지 않음.',
        url: `${URL_EPS}#conditions`,
      },
      {
        m: ['대표번호 ☎900은 처음부터 그대로. 거는 쪽은 직원이 바뀐 걸 몰라도 됨.', '이번 전화는 신입에게 연결됨.', AGAIN.m],
        t: ['ClusterIP는 그대로, 뒤의 Pod IP만 바뀜. 클라이언트는 이름·ClusterIP만 앎.', '새 연결이 새 Pod로 감.', AGAIN.t],
        clock: C1,
        ref: 'Service가 있으면 Pod가 바뀌어도 클라이언트 설정을 고칠 필요가 없음.',
        url: URL_SVC,
      },
    ];
  }
  if (k === 'nr') {
    return [head,
      {
        m: [`2층 직원(${N})이 바빠 "새 일 받을 수 있나?"에 ✗ → 장부 '준비 안 됨'(장면 ⑥).`, '자리에는 그대로 있음.'],
        t: ['readiness probe 실패 → Pod Ready=False(장면 ⑥).', 'Pod는 그대로 Running.'],
        clock: '실제 10초 간격으로 확인',
        ref: 'readiness 실패는 재시작을 일으키지 않음. Pod의 Ready 조건만 바뀜.',
        url: 'https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/#readiness-probe',
      },
      {
        m: ['명단 담당이 그 직원을 연결 대상에서 뺌 → 교환기 규칙에서도 빠짐.', '퇴사가 아니라 연결만 잠시 끊음.'],
        t: ['EndpointSlice의 그 엔드포인트가 ready=false → kube-proxy가 규칙에서 뺌.', 'Pod 삭제·재시작은 없음.'],
        clock: C1,
        ref: 'EndpointSlice의 serving/ready 조건은 Pod의 Ready를 따름. 프록시는 ready인 엔드포인트로만 새 연결을 보냄.',
        url: `${URL_EPS}#conditions`,
      },
      {
        m: ['전화를 걸면 남은 2명에게만 연결됨.', '바쁜 직원에게는 새 전화가 가지 않음.'],
        t: ['새 연결은 ready인 엔드포인트 2개로만 감.', 'Ready가 아닌 Pod로는 새 요청이 가지 않음.'],
        clock: C1,
        ref: '이미 맺어진 연결이 바로 끊기지는 않음. 새 연결만 다른 Pod로 감.',
        url: URL_VIP,
      },
      {
        m: ['다시 받을 수 있게 되면 명단·규칙에 돌아옴 → 다시 3명.', '바쁨(readiness)은 연결만 잠시 빼 둠 — 직원은 그대로.', AGAIN.m],
        t: ['readiness 다시 성공 → ready=true → kube-proxy 규칙에 복귀.', 'RESTARTS 0, Pod IP 그대로.', AGAIN.t],
        clock: C1,
        ref: 'readiness로 빠졌다 돌아오는 동안 Pod는 바뀌지 않으므로 IP도 그대로임.',
        url: `${URL_EPS}#conditions`,
      },
    ];
  }
  return [head];
}

function setIp(p) {   // 내선번호 = Pod IP. 층(노드)마다 따로 매김
  const o = S.ipNext[p.node]++;
  Object.assign(p, { ip: `10.244.${p.node + 1}.${o}`, ext: `${p.node + 1}${String(o).padStart(2, '0')}` });
}
function addPod7(node, desk) { const p = addPod(node, desk); setIp(p); return p; }
const extsOf = (ids) => ids.map((id) => S.pods.find((p) => p.id === id)).filter(Boolean).map((p) => p.ext).join('·');

async function phone(pts, ms) {   // 전화 신호가 길을 따라 간다
  S.echo = { k: 'call', pts };
  const c = { pts, p: 0 };
  S.calls.push(c);
  await tween(ms, (p) => { c.p = p; });
  S.calls.splice(S.calls.indexOf(c), 1);
}
async function sbUpdate() {   // 층마다 교환기가 새 명단대로 규칙을 고친다
  for (let n = 0; n < 3; n++) {
    S.rules[n] = S.eps.slice();
    S.sbFlash[n] = now + 900;
    bubble(ROOM_X[n] + 51, 76, { m: S.eps.length ? `☎900 → ${extsOf(S.eps)}` : '규칙 없음', t: `규칙 ${S.eps.length}개` }, Infinity, 'ok');
    await wait(300);
  }
  await wait(400);
}
async function epsUpdate(change, note) {   // 명단 담당 → 창구 → 장부의 연결 명단 → 교환기들에 방송
  await hop(S.A.ep);
  bubble(S.A.ep.x + 6, 26, note, 1800);
  await wait(400);
  await fly(P.ep(), P.api(), 800);
  await receive(false);
  await record(() => { change(); return 'eps'; });
  await broadcast([0, 1, 2].map((n) => P.sb(n)));
  await doze();
}
async function report7(p, st) {   // 층 관리자 보고 → 명단 담당이 방송을 들음
  await fly(P.kub(p.node), P.api(), 800);
  await receive(false);
  await record(() => { entry(p.id).st = st; return p.id; });
  await broadcast([P.ep()]);
  await doze();
}
async function lookup() {
  const c = S.caller;
  bubble(...podTop(c), { m: '영업팀 번호는?', t: 'web 의 IP?' }, Infinity, 'no');
  await phone([podTop(c), P.dns()], 900);
  S.dnsFlash = now + 900;
  bubble(193, 37, { m: '영업팀 = ☎900', t: 'web → 10.96.0.15' }, Infinity, 'ok');
  await wait(500);
  await phone([P.dns(), podTop(c)], 700);
}
async function dial({ avoid, prefer } = {}) {   // ☎900 → 거는 사람 층의 교환기 → 규칙대로 1명
  const c = S.caller, rules = S.rules[c.node];
  let cand = prefer != null && rules.includes(prefer) ? [prefer] : rules.filter((id) => id !== avoid);
  if (!cand.length) cand = rules;
  const pick = cand[Math.floor(rnd() * cand.length)];   // 먼저 뽑고 찾는다 (find 안에서 뽑으면 직원마다 다시 뽑힘)
  const t = S.pods.find((p) => p.id === pick);
  bubble(...podTop(c), { m: '☎900 걸기', t: '→ 10.96.0.15' }, Infinity);
  await phone([podTop(c), P.sb(c.node)], 500);
  bubble(ROOM_X[c.node] + 51, 76, { m: `→ ☎${t.ext}`, t: `→ ${t.ip}` }, Infinity, 'ok');
  await wait(350);
  await phone([P.sb(c.node), podTop(t)], 800);
  bubble(...podTop(t), { m: '여보세요 ✓', t: '200 OK' }, Infinity, 'ok');
  await wait(700);
  return t;
}

const R7 = {
  open: [
    async () => {
      bubble(S.A.me.x + 6, 31, { m: '대표번호 신청 (영업팀)', t: 'Service selector app=web' });
      await hop(S.A.me);
      await fly(P.me(), P.api(), 1000);
      await receive(true);
      await record(() => { S.ledger.unshift({ id: 'svc', kind: 'svc' }); return 'svc'; });
      bubble(165, 20, { m: '☎900 배정', t: 'ClusterIP 10.96.0.15' }, Infinity, 'ok');
      await broadcast([P.ep(), P.dns(), ...[0, 1, 2].map((n) => P.sb(n))]);
      await doze();
    },
    async () => {
      S.pods.forEach((p) => bubble(...podTop(p), p.team ? { m: '✗ 총무팀', t: '✗ app=front' } : { m: '✓ 영업팀', t: '✓ app=web' }, 2200, p.team ? 'no' : 'ok'));
      await wait(900);
      await epsUpdate(() => {
        S.eps = S.pods.filter((p) => !p.team).map((p) => p.id);
        S.ledger.splice(1, 0, { id: 'eps', kind: 'eps' });
      }, { m: '명단 작성 (3명)', t: 'EndpointSlice 생성' });
    },
    sbUpdate,
    async () => {
      S.dnsFlash = now + 1500;
      bubble(193, 37, { m: '번호부: 영업팀 = ☎900', t: 'web.default.svc → 10.96.0.15' }, Infinity, 'ok');
      await wait(900);
    },
  ],
  call: [
    lookup,
    async () => { S.lastT = await dial(); },
    async () => {
      for (let i = 0; i < 2; i++) { clearBubbles(); S.lastT = await dial({ avoid: S.lastT && S.lastT.id }); }
    },
  ],
  swap: [
    async () => {
      const v = S.hero;
      await hop(S.A.me);
      await fly(P.me(), P.api(), 900);
      await receive(false);
      v.state = 'term'; v.box = true;
      await record(() => { entry(v.id).st = 'term'; return v.id; });
      await broadcast([P.kub(v.node), P.rs(), P.ep()]);
      await doze();
      await epsUpdate(() => { S.eps = S.eps.filter((id) => id !== v.id); }, { m: `☎${v.ext} 연결 대상에서 뺌`, t: `${v.ip} terminating` });
    },
    async () => {
      await sbUpdate();
      await leave6(S.hero);
    },
    async () => {
      await hop(S.A.rs);
      await fly(P.rs(), P.api(), 700);
      await receive(false);
      const f = addPod(null, null);
      S.fresh = f;
      await record(() => { S.ledger.push({ id: f.id, node: null, st: 'pend' }); return f.id; });
      await broadcast([P.sch()]);
      const n = freestRoom();
      await hop(S.A.sch);
      await fly(P.sch(), P.api(), 600);
      await receive(false);
      f.node = n;
      f.desk = freeDesks(n, f)[0];
      setIp(f);
      await record(() => { Object.assign(entry(f.id), { node: n, st: 'crt' }); return f.id; });
      await broadcast([P.kub(n)]);
      await doze();
      await hop(S.kub[n]);
      Object.assign(f, { x: ROOM_X[n] + 62, feet: DESK_FEET, state: 'run', alpha: 1 });
      await walk(f, deskX(n, f.desk), 1100);
      f.dir = 'r';
      await probe(f, ASK_READY, { m: '✓ 됐음', t: '✓ 200 OK' }, true, 700);
      await report7(f, 'run');
      bubble(...podTop(f), { m: `새 번호 ☎${f.ext}`, t: `새 IP ${f.ip}` }, Infinity, 'ok');
    },
    async () => {
      const f = S.fresh;
      await epsUpdate(() => { S.eps.push(f.id); }, { m: `☎${f.ext} 명단에 추가`, t: `${f.ip} 추가` });
      await sbUpdate();
    },
    async () => { await dial({ prefer: S.fresh.id }); },
  ],
  nr: [
    async () => {
      await probe(S.hero, { m: '새 일 받을 수 있나?', t: 'GET /ready' }, { m: '✗ 지금은 안 됨', t: '✗ 503' }, false);
      await hop(S.kub[S.hero.node]);
      await report7(S.hero, 'nrp');
      bubble(...podTop(S.hero), { m: '준비 안 됨', t: 'Ready=False' }, Infinity, 'no');
    },
    async () => {
      const h = S.hero;
      await epsUpdate(() => { S.eps = S.eps.filter((id) => id !== h.id); }, { m: `☎${h.ext} 연결 대상에서 뺌`, t: `${h.ip} ready=false` });
      await sbUpdate();
    },
    async () => {
      for (let i = 0; i < 2; i++) { clearBubbles(); S.lastT = await dial({ avoid: S.lastT && S.lastT.id }); }
      bubble(...podTop(S.hero), { m: '전화 안 옴', t: '새 연결 없음' }, Infinity, 'no');
    },
    async () => {
      const h = S.hero;
      await probe(h, { m: '새 일 받을 수 있나?', t: 'GET /ready' }, { m: '✓ 이제 됨', t: '✓ 200 OK' }, true);
      await hop(S.kub[h.node]);
      await report7(h, 'run');
      await epsUpdate(() => { S.eps.push(h.id); }, { m: `☎${h.ext} 다시 추가`, t: `${h.ip} ready=true` });
      await sbUpdate();
    },
  ],
};

// 장면 ⑦: 번호 안내(CoreDNS) — 번호부와 전화기
function drawDns() {
  const on = S.dnsFlash > now && T % 12 < 6;
  ctx.drawImage(SPR.desk, 185, 51);
  rect(187, 46, 7, 5, PALETTE.o); rect(188, 47, 5, 3, on ? '#ffe27a' : '#f5b93a');
  rect(196, 47, 6, 4, PALETTE.o); rect(197, 48, 4, 2, '#e8434a');
}
// 층마다 교환기(kube-proxy) — 불 켜진 칸 = 규칙에 있는 연결 대상 수
function drawSwitchboards() {
  ROOM_X.forEach((x0, n) => {
    const x = x0 + 44, y = 83, on = S.sbFlash[n] > now && T % 12 < 6;
    rect(x - 1, y - 1, 16, 10, PALETTE.o); rect(x, y, 14, 8, on ? '#ffe27a' : '#c9c6d6');
    for (let i = 0; i < 4; i++) rect(x + 2 + i * 3, y + 3, 2, 2, i < S.rules[n].length ? '#4f9a7a' : '#8a7a6a');
  });
}

function drawHQ7() {               // 명단 담당 · 번호 안내 · 교환기
  drawPerson(SPR.ep, S.A.ep.x, S.A.ep.feet + S.A.ep.dy);
  ctx.drawImage(SPR.desk, S.A.ep.x - 2, 51);
  drawDns();
  if (S.rules) drawSwitchboards();
}

const SCENE7 = {
  clickPods: false,
  sub: { m: '장부는 창구직원만 씀 · ☎ = 내선번호', t: 'etcd는 apiserver만 씀 · 이름표 = Pod IP' },
  choices: CHOICES7,
  drawHQ: drawHQ7,
  drawFx: () => S.calls.forEach((c) => drawCall(c.pts, c.p)),
  tags: [
    { txt: { m: '명단 담당', t: 'EndpointSlice 컨트롤러' }, s: { m: '명단', t: 'EPS' }, at: () => S.A.ep && [S.A.ep.x + 6, S.A.ep.feet - 18] },
    { txt: { m: '번호 안내', t: 'CoreDNS' }, s: { m: '안내', t: 'DNS' }, at: () => S.dns && [193, 44] },
    ...ROOM_X.map((x0, n) => ({ txt: { m: '교환기', t: 'kube-proxy' }, at: () => S.rules && [x0 + 51, 81], cls: 'pod' })),
  ],
  plan: (c) => {
    if (c.k === 'open') {           // 대표번호가 없던 때부터
      S.ledger = S.ledger.filter((e) => e.kind !== 'svc' && e.kind !== 'eps');
      S.eps = []; S.rules = [[], [], []];
      renderLedger();
    }
    return { k: c.k };
  },
  init() {
    S.A.ep = { x: 86, feet: 58, dy: 0 };
    S.dns = true; S.dnsFlash = 0; S.ipNext = [5, 5, 5]; S.sbFlash = [0, 0, 0];
    [0, 1, 2].forEach((n) => addPod7(n, 0));
    const c = addPod7(2, 1);
    Object.assign(c, { team: '총무', noLedger: true, look: 5 });
    S.caller = c; S.hero = S.pods[1];
    S.eps = S.pods.filter((p) => !p.team).map((p) => p.id);
    S.rules = [0, 1, 2].map(() => S.eps.slice());
    S.ledger.push({ id: 'svc', kind: 'svc' }, { id: 'eps', kind: 'eps' });
  },
  steps: steps7,
  run: [null, 1, 2, 3, 4, 5].map((i) => i && (() => R7[S.plan.k][i - 1]())),
};
