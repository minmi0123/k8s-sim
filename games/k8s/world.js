// 쿠버네티스 회사: 무대(본사 · 층 · 직원) · 그리기 · 이름표 · 장부, 끝에 WORLD(엔진이 부르는 곳)
'use strict';

const LOOKS = {
  me:  { h: '#2f2a3a', t: '#f5b93a', p: '#46598f' },
  api: { h: '#7a4a2e', t: '#e8734a', p: '#5a4a6a' },
  rs:  { h: '#3a2a22', t: '#7cc27e', p: '#4f6a5a' },
  sch: { h: '#c9645a', t: '#c9a0e8', p: '#5a4a7a' },
  dep: { h: '#4a3428', t: '#5fb3b3', p: '#3d4a6a' },
  nc:  { h: '#2f2a3a', t: '#a8c66c', p: '#4f6a5a' },
  kub: { h: '#f5b93a', t: '#46598f', p: '#3d4a6a' }, // 노란 머리 = 안전모
  ep:  { h: '#5a3a2a', t: '#e89ac8', p: '#5a4a6a' },
  emp: [
    { h: '#5a3a2a', t: '#8fb8e8' }, { h: '#3a2a22', t: '#f29a9a' }, { h: '#a8693f', t: '#ffe27a' },
    { h: '#2f2a3a', t: '#9fd6c8' }, { h: '#7a4a2e', t: '#f7b6c8' }, { h: '#4a3428', t: '#c9c6d6' },
  ],
};

const SPR = {
  me: makePerson(LOOKS.me),
  api: makePerson(LOOKS.api),
  apiSleep: makePerson(LOOKS.api, SLEEP_TOP),
  rs: makePerson(LOOKS.rs),
  sch: makePerson(LOOKS.sch),
  dep: makePerson(LOOKS.dep),
  nc: makePerson(LOOKS.nc),
  ep: makePerson(LOOKS.ep),
  phone: makeSprite(['.ooooo.', 'oiiiiio', 'oio.oio', 'oo...oo']),
  heart: makeSprite(['.i.i.', 'iiiii', '.iii.', '..i..']),
  kub: makePerson(LOOKS.kub),
  emp: LOOKS.emp.map((l) => makePerson(l)),
  empSleep: LOOKS.emp.map((l) => makePerson(l, SLEEP_TOP)),
  desk: makeSprite([
    'oooooooooooooooo',
    'okkkkkkkkkkkkkko',
    'oooooooooooooooo',
    '.oko........oko.',
    '.oko........oko.',
    '.ooo........ooo.',
  ]),
  env: makeSprite(['oooooo', 'oowwoo', 'owoowo', 'owwwwo', 'oooooo']),
  bang: makeSprite(['.ooo.', 'owiwo', 'owiwo', 'owwwo', 'owiwo', '.ooo.', '..o..']),
  zz: makeSprite(['ooooo', '...o.', '..o..', '.o...', 'ooooo']),
  arrow: makeSprite(['iiiii', '.iii.', '..i..']),
};

// ===== 무대 (회사) =====

const ROOM_X = [8, 90, 172];      // 층(노드) 3개
const DESK_DX = [14, 38];         // 층마다 책상 2개 = 노드 용량
const DESK_FEET = 124;
const ROOMS = [
  { m: '1층', t: 'node-1' }, { m: '2층', t: 'node-2' }, { m: '3층', t: 'node-3' },
];
const NAMES = ['민지', '준호', '서연', '도윤', '하은', '지호', '수아', '예준', '지우', '시우', '유나', '건우'];
const RS_NAME = 'web-6d4f9c7b8';

function initState() {
  S = {
    A: {
      me:  { x: 226, feet: 58, dy: 0 },
      sch: { x: 12, feet: 58, dy: 0 },
      rs:  { x: 50, feet: 58, dy: 0 },
    },
    kub: ROOM_X.map((x0) => ({ x: x0 + 1, feet: 137, dy: 0 })),
    apiAwake: false,
    drawer: 0,
    rooms: ROOM_X.map(() => ({ win: false, taint: false })), // 창가 = 라벨, 공사 중 = taint
    pods: [], ledger: [], envs: [], rings: [], bangs: [], hearts: [], calls: [],
    names: new Set(),
    phase: 'idle', victim: null, fresh: null, target: null, plan: null, used: false,
  };
  SC.init();
  S.pods.forEach((p) => { p.state = 'run'; if (!p.noLedger) S.ledger.push({ id: p.id, node: p.node, st: 'run', rs: p.rs }); });
}

// 층 n 에서 쓰고 있는 책상 칸 수 (종료 중인 직원도 자리를 차지한다)
const seated = (p) => p.node != null && (p.state === 'run' || p.state === 'term');
const occ = (n) => S.pods.filter((p) => p.node === n && seated(p)).reduce((s, p) => s + p.size, 0);
const deskTaken = (n, d, except) => S.pods.some((p) => p !== except && p.node === n && seated(p) && (p.desk === d || p.desk2 === d));
const freeDesks = (n, except) => [0, 1].filter((d) => !deskTaken(n, d, except));

let podSeq = 0;
function addPod(node, desk) {
  const used = new Set(S.pods.map((p) => p.mn));   // 떠난 직원 이름도 한 판에선 다시 안 씀 (다 쓰면 지금 있는 사람만 피함)
  let free = NAMES.filter((n) => !used.has(n) && !S.names.has(n));
  if (!free.length) free = NAMES.filter((n) => !used.has(n));
  const mn = free[Math.floor(rnd() * free.length)];
  const sfx = Array.from({ length: 5 }, () => 'bcdfghjklmnpqrstvwxz2456789'[Math.floor(rnd() * 27)]).join('');
  S.names.add(mn);
  const p = {
    id: ++podSeq, mn, tn: `${RS_NAME}-${sfx}`, sfx, look: podSeq % LOOKS.emp.length,
    node, desk, desk2: null, size: 1, x: node == null ? 0 : deskX(node, desk), feet: DESK_FEET,
    state: 'none', alpha: 1, box: false, walking: false, dir: 'r',
  };
  S.pods.push(p);
  return p;
}
const deskX = (n, d) => ROOM_X[n] + DESK_DX[d] + 2;

const P = {
  me: () => [S.A.me.x + 6, S.A.me.feet - 20],
  rs: () => [S.A.rs.x + 6, S.A.rs.feet - 20],
  sch: () => [S.A.sch.x + 6, S.A.sch.feet - 20],
  dep: () => [S.A.dep.x + 6, S.A.dep.feet - 20],
  nc: () => [S.A.nc.x + 6, S.A.nc.feet - 20],
  ep: () => [S.A.ep.x + 6, S.A.ep.feet - 20],
  dns: () => [193, 46],
  sb: (n) => [ROOM_X[n] + 51, 86],
  api: () => [126, 42],
  kub: (n) => [S.kub[n].x + 6, S.kub[n].feet - 20],
  drawer: () => [161, 41],
};

// ===== 그리기 =====

function drawBG() {
  const o = PALETTE.o;
  rect(0, 0, W, 62, '#f3e6c8');               // 본사(컨트롤 플레인) 벽
  rect(0, 50, W, 12, '#e2cfa6');              // 본사 바닥
  rect(0, 50, W, 1, '#cdb68a');
  [[72, 8], [192, 8]].forEach(([x, y]) => {   // 창문
    rect(x - 1, y - 1, 22, 16, o); rect(x, y, 20, 14, '#bfe3f2');
    rect(x + 9, y, 2, 14, o); rect(x, y + 6, 20, 2, o);
  });
  rect(243, 25, 13, 34, o); rect(244, 26, 12, 33, '#a8693f'); rect(246, 42, 2, 2, '#f5b93a'); // 나 옆 문
  rect(0, 62, W, 6, '#b9a07a'); rect(0, 62, W, 1, o);
  rect(0, 68, W, H - 68, '#cdb68a');
  ROOM_X.forEach((x0, n) => {                 // 층(노드)
    rect(x0 - 1, 69, 78, 73, o); rect(x0, 70, 76, 71, '#efe2c6');
    rect(x0, 116, 76, 25, '#d8c099'); rect(x0, 116, 76, 1, '#c4a878');
    rect(x0 + 65, 95, 10, 21, o); rect(x0 + 66, 96, 8, 20, '#a8693f'); rect(x0 + 67, 105, 1, 2, '#f5b93a');
    const r = S.rooms[n];
    if (r.win) {                               // 창가 층 (라벨)
      rect(x0 + 29, 82, 20, 14, o); rect(x0 + 30, 83, 18, 12, '#bfe3f2');
      rect(x0 + 38, 83, 2, 12, o); rect(x0 + 30, 88, 18, 2, o);
    }
    if (r.taint || r.unreach || r.nrTaint || r.cordon) {   // taint: 위쪽 줄무늬 + 문에 X 테이프
      const tape = r.unreach ? '#e8434a' : r.nrTaint ? '#ff9a5a' : r.cordon ? '#8fb8e8' : '#f5b93a'; // 연락 두절 · 일 못 함 · 배치 금지 · 공사 중
      for (let x = 0; x < 76; x++) for (let y = 0; y < 3; y++) {
        rect(x0 + x, 70 + y, 1, 1, Math.floor((x + y) / 3) % 2 ? tape : '#3d2c3a');
      }
      for (let i = 0; i < 9; i++) {
        rect(x0 + 66 + i, 98 + i * 2, 1, 2, tape);
        rect(x0 + 74 - i, 98 + i * 2, 1, 2, tape);
      }
    }
  });
}

function drawCounter() {
  rect(103, 48, 48, 13, PALETTE.o);
  rect(104, 49, 46, 3, '#b07a5c');
  rect(104, 52, 46, 8, '#d9a877');
  rect(140, 46, 5, 2, PALETTE.o); rect(141, 45, 3, 1, '#f5b93a'); // 호출벨
}

function drawCabinet() {
  const o = PALETTE.o, x = 158, y = 30, w = 15;
  rect(x - 1, y - 1, w + 2, 31, o); rect(x, y, w, 29, '#c9c6d6');
  for (let i = 0; i < 3; i++) {
    const dy = y + 1 + i * 9;
    const out = S.drawer && i === 1 ? -5 : 0;   // 기록할 때 가운데 서랍이 열린다
    rect(x + 1 + out, dy, w - 2, 8, o); rect(x + 2 + out, dy + 1, w - 4, 6, '#e4e1ec');
    rect(x + 6 + out, dy + 3, 3, 1, o);
    if (out) { rect(x - 3, dy - 2, 5, 3, o); rect(x - 2, dy - 1, 3, 2, '#fffdf5'); }
  }
}

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
// 전화 신호: 지나간 길은 점선, 머리는 수화기
function pathAt(pts, p) {
  const seg = pts.length - 1, t = Math.min(seg - 1e-6, p * seg), i = Math.floor(t), q = t - i;
  return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * q, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * q];
}
function drawCall(pts, p) {
  for (let k = 0; k <= 120 && k / 120 <= p; k += 2) { const [x, y] = pathAt(pts, k / 120); rect(x, y, 1, 1, '#e8734a'); }
  const [x, y] = pathAt(pts, p);
  ctx.drawImage(SPR.phone, Math.round(x - 3), Math.round(y - 2));
}

function drawRing(r) {
  ctx.globalAlpha = r.a;
  ctx.fillStyle = PALETTE.i;
  for (let a = 0; a < Math.PI * 2; a += 0.04) {
    ctx.fillRect(Math.round(126 + Math.cos(a) * r.r), Math.round(40 + Math.sin(a) * r.r * 0.75), 1, 1);
  }
  ctx.globalAlpha = 1;
}

function draw() {
  drawBG();

  // 본사: 자리배치 담당 · 정원 담당 · 창구직원 · 장부 · 나
  const { me, sch, rs } = S.A;
  drawPerson(SPR.sch, sch.x, sch.feet + sch.dy);
  drawPerson(SPR.rs, rs.x, rs.feet + rs.dy);
  ctx.drawImage(SPR.desk, sch.x - 2, 51);
  ctx.drawImage(SPR.desk, rs.x - 2, 51);
  if (S.A.dep) {                    // 기획 담당은 장면 ③ 부터
    drawPerson(SPR.dep, S.A.dep.x, S.A.dep.feet + S.A.dep.dy);
    ctx.drawImage(SPR.desk, S.A.dep.x - 2, 51);
  }
  if (S.A.ep) {                     // 명단 담당은 장면 ⑦
    drawPerson(SPR.ep, S.A.ep.x, S.A.ep.feet + S.A.ep.dy);
    ctx.drawImage(SPR.desk, S.A.ep.x - 2, 51);
  }
  if (S.dns) drawDns();
  if (S.rules) drawSwitchboards();
  if (S.A.nc) {                     // 층 점검 담당은 장면 ④
    drawPerson(SPR.nc, S.A.nc.x, S.A.nc.feet + S.A.nc.dy);
    ctx.drawImage(SPR.desk, S.A.nc.x - 2, 51);
  }
  drawPerson(S.apiAwake ? SPR.api : SPR.apiSleep, 120, S.apiAwake ? 53 : 58);
  drawCounter();
  drawCabinet();
  drawPerson(SPR.me, me.x, me.feet + me.dy, { dir: 'l' });

  // 층: 직원(책상 뒤) → 책상 → 층 관리자
  S.pods.forEach((p) => {
    if (p.state === 'none' || p.state === 'gone') return;
    const shake = p.box && !p.walking && T % 24 < 12 ? 1 : 0;
    if (p.sink) {                   // 쓰러짐: 책상 뒤로 가라앉고, 책상 아래로는 안 보이게
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, DESK_FEET + 1); ctx.clip();
    }
    drawPerson((p.daze ? SPR.empSleep : SPR.emp)[p.look], p.x + shake, p.feet + (p.sink || 0), { walking: p.walking, dir: p.dir, alpha: p.alpha });
    if (p.sink) ctx.restore();
  });
  ROOM_X.forEach((x0) => DESK_DX.forEach((dx) => ctx.drawImage(SPR.desk, x0 + dx, 119)));
  S.pods.forEach((p) => {           // 2칸 쓰는 직원: 옆 책상에 서류 더미
    if (p.desk2 == null || p.state !== 'run') return;
    const x = ROOM_X[p.node] + DESK_DX[p.desk2];
    ctx.globalAlpha = p.alpha;
    rect(x + 4, 113, 8, 7, PALETTE.o); rect(x + 5, 114, 6, 5, '#fffdf5');
    rect(x + 5, 116, 6, 1, '#c9c6d6'); rect(x + 6, 111, 5, 2, PALETTE.o);
    ctx.globalAlpha = 1;
  });
  S.pods.forEach((p) => {           // 짐 상자는 책상보다 앞에 (가려지지 않게)
    if (!p.box || p.state === 'none' || p.state === 'gone') return;
    const shake = !p.walking && T % 24 < 12 ? 1 : 0;
    ctx.globalAlpha = p.alpha;
    rect(p.x + 2 + shake, p.feet - 8, 9, 7, PALETTE.o); rect(p.x + 3 + shake, p.feet - 7, 7, 5, '#c4905a');
    rect(p.x + 3 + shake, p.feet - 5, 7, 1, PALETTE.o);
    ctx.globalAlpha = 1;
  });
  S.pods.forEach((p) => {           // 장면 ⑥: 책상 위 매뉴얼 (색 = 판)
    if (!p.ver || p.box || p.node == null || p.state !== 'run') return;
    ctx.globalAlpha = p.alpha;
    rect(p.x + 8, p.feet - 9, 5, 4, PALETTE.o); rect(p.x + 9, p.feet - 8, 3, 2, VER_COL[p.ver]);
    ctx.globalAlpha = 1;
  });
  S.kub.forEach((k) => drawPerson(SPR.kub, k.x, k.feet + k.dy));
  ROOM_X.forEach((x0, n) => {       // 정전된 층은 어둡게
    const d = S.rooms[n].dark;
    if (!d) return;
    ctx.globalAlpha = 0.5 * d;
    rect(x0, 70, 76, 71, '#232046');
    ctx.globalAlpha = 1;
  });
  if (SC.clickRooms && S.phase === 'idle' && !S.used) {   // 클릭할 수 있는 층 표시
    const bob = Math.floor(T / 15) % 2;
    ROOM_X.forEach((x0, n) => { if (S.pods.some((p) => p.node === n && p.state === 'run')) ctx.drawImage(SPR.arrow, x0 + 36, 76 + bob); });
  }
  drawGauges();
  drawHearts();

  // 클릭할 수 있는 직원 표시
  if (SC.clickPods && S.phase === 'idle') {
    const bob = Math.floor(T / 15) % 2;
    S.pods.filter((p) => p.state === 'run').forEach((p) => ctx.drawImage(SPR.arrow, p.x + 4, p.feet - 23 + bob));
  }

  // 조는 창구직원
  if (!S.apiAwake) {
    const k = (T % 90) / 90;
    ctx.globalAlpha = 1 - k;
    ctx.drawImage(SPR.zz, 133 + Math.round(k * 4), 38 - Math.round(k * 10));
    ctx.globalAlpha = 1;
  }

  S.rings.forEach(drawRing);
  S.envs.forEach((e) => ctx.drawImage(SPR.env, Math.round(e.x - 3), Math.round(e.y - 2)));
  S.calls.forEach((c) => drawCall(c.pts, c.p));
  S.bangs.forEach((b) => ctx.drawImage(SPR.bang, Math.round(b.x - 2), Math.round(b.y - 14 - (Math.floor(T / 10) % 2))));
  drawEcho();
}

const STATIC_TAGS = [
  { txt: { m: '나(관리자)', t: 'kubectl' }, s: { m: '나', t: 'kubectl' }, at: () => [S.A.me.x + 6, S.A.me.feet - 18] },
  { txt: { m: '창구직원', t: 'kube-apiserver' }, s: { m: '창구', t: 'apiserver' }, at: () => [126, S.apiAwake ? 36 : 41] },
  { txt: { m: '장부', t: 'etcd' }, at: () => [165, 28] },
  { txt: { m: '정원 담당', t: 'ReplicaSet 컨트롤러' }, s: { m: '정원', t: 'RS' }, at: () => [S.A.rs.x + 6, S.A.rs.feet - 18] },
  { txt: { m: '기획 담당', t: 'Deployment 컨트롤러' }, s: { m: '기획', t: 'Deploy' }, at: () => S.A.dep && [S.A.dep.x + 6, S.A.dep.feet - 18] },
  { txt: { m: '층 점검 담당', t: 'Node 컨트롤러' }, s: { m: '점검', t: 'Node' }, at: () => S.A.nc && [S.A.nc.x + 6, S.A.nc.feet - 18] },
  { txt: { m: '명단 담당', t: 'EndpointSlice 컨트롤러' }, s: { m: '명단', t: 'EPS' }, at: () => S.A.ep && [S.A.ep.x + 6, S.A.ep.feet - 18] },
  { txt: { m: '번호 안내', t: 'CoreDNS' }, s: { m: '안내', t: 'DNS' }, at: () => S.dns && [193, 44] },
  ...ROOM_X.map((x0, n) => ({ txt: { m: '교환기', t: 'kube-proxy' }, at: () => S.rules && [x0 + 51, 81], cls: 'pod' })),
  { txt: { m: '자리배치 담당', t: 'kube-scheduler' }, s: { m: '배치', t: 'sched' }, at: () => [S.A.sch.x + 10, S.A.sch.feet - 18] },
  ...ROOM_X.map((x0, n) => ({ room: n, txt: ROOMS[n], at: () => [x0 + 2, 79], cls: 'room' })),
  ...ROOM_X.map((x0, n) => ({ txt: { m: '층 관리자', t: 'kubelet' }, s: { m: '관리자', t: 'kubelet' }, at: () => [S.kub[n].x + 7, S.kub[n].feet - 18] })),
  { txt: { m: '예약', t: 'requests' }, at: () => S.gauge && [ROOM_X[1] + 36, gaugeY(S.gauge.req) + 3], cls: 'pod' },
  { txt: { m: '칸막이', t: 'limits' }, at: () => S.gauge && [ROOM_X[1] + 36, gaugeY(S.gauge.lim) + 3], cls: 'pod' },
  { txt: { m: '서류', t: 'mem' }, at: () => S.gauge && [GAUGE.xs.mem + 2.5, 117], cls: 'pod' },
  { txt: { m: '손', t: 'cpu' }, at: () => S.gauge && [GAUGE.xs.cpu + 2.5, 117], cls: 'pod' },
];
STATIC_TAGS.forEach((s) => { s.el = makeTag(s.txt, s.cls, s.s); });

// 층 이름표: 창가 · 공사 중 표시가 장면마다 달라진다
function refreshRoomTags() {
  STATIC_TAGS.filter((s) => s.room != null).forEach((s) => {
    const n = s.room, r = S.rooms[n];
    s.el.dataset.m = ROOMS[n].m + (r.win ? ' · 창가' : '') + (r.taint ? ' · 공사 중' : '') + (r.unreach ? ' · 연락 두절' : '')
      + (r.nr ? ' · 일 못 함' : '') + (r.cordon ? ' · 배치 금지' : '');
    s.el.dataset.t = ROOMS[n].t + (r.win ? ' · window=yes' : '') + (r.taint ? ' · taint repair' : '') + (r.unreach ? ' · unreachable' : '')
      + (r.nr ? ' · not-ready' : '') + (r.cordon ? ' · cordoned' : '');
    s.el.textContent = s.el.dataset[MODE];
  });
}

const podTags = new Map();
const podLabel = (p) => {
  if (p.ip) return { m: `${p.mn}${p.team ? `(${p.team})` : ''} ☎${p.ext}`, t: p.team ? `client ${p.ip}` : p.ip };   // 장면 ⑦: 내선번호 = Pod IP
  const v = p.ver ? ` ${p.ver}` : '';
  return { m: p.mn + v, t: `…${p.sfx}${v}` };
};
function updateTags() {
  STATIC_TAGS.forEach((s) => {
    const pos = s.at();
    s.el.style.display = pos ? '' : 'none';
    if (pos) place(s.el, pos[0], pos[1]);
  });
  const alive = new Set();
  S.pods.forEach((p) => {
    if (p.state === 'none' || p.state === 'gone') return;
    alive.add(p.id);
    let el = podTags.get(p.id);
    if (!el) { el = makeTag(podLabel(p), 'pod'); podTags.set(p.id, el); }
    el.style.opacity = p.alpha;
    place(el, p.x + 6, p.feet + 8);   // 책상 아래 (머리 위는 클릭 화살표 자리)
  });
  podTags.forEach((el, id) => { if (!alive.has(id)) { el.remove(); podTags.delete(id); } });
}

// ===== 장부(etcd) 표 =====

const ST = {
  run:  { m: '근무', t: 'Running' },
  term: { m: '퇴사 예정', t: 'Terminating' },
  pend: { m: '자리 미정', t: 'Pending' },
  crt:  { m: '출근 준비', t: 'ContainerCreating' },
  nr:   { m: '연락 안 됨', t: 'Running (NotReady)' },
  nrp:  { m: '준비 안 됨', t: 'Running (NotReady)' },
  oom:  { m: '강제 퇴근', t: 'OOMKilled' },
  clb:  { m: '재시작 대기', t: 'CrashLoopBackOff' },
};
const stCell = (e) => {
  const b = ST[e.st];
  return e.restarts ? { m: `${b.m} (재시작 ${e.restarts})`, t: `${b.t} · RESTARTS ${e.restarts}` } : b;
};
// 정원표(ReplicaSet)는 매뉴얼 판(이미지)마다 하나 — 장면 ⑥ 에서 v2 · v3 가 생긴다
const RS_VER = { v1: RS_NAME, v2: 'web-7c5b8d9f6', v3: 'web-5f8d7c4b9' };
const VER_COL = { v1: '#8fb8e8', v2: '#7cc27e', v3: '#e8434a' };
function ledgerHead(e) {
  const r = e.ready || 0;
  if (e.kind === 'svc') return [{ m: '대표번호: 영업팀 ☎900', t: 'service/web' }, { m: '-', t: '-' }, { m: '대표번호', t: 'ClusterIP 10.96.0.15' }];
  if (e.kind === 'eps') {
    const k = S.eps.length;
    return [{ m: '└ 연결 명단', t: '└ endpointslice/web-x7k2p' }, { m: '-', t: '-' }, { m: `${k}명`, t: `${k} ready` }];
  }
  if (e.kind === 'dep') {
    const name = e.ver ? { m: `계획서: 영업팀 (매뉴얼 ${e.ver})`, t: `deployment/web (web:${e.ver})` } : { m: '계획서: 영업팀', t: 'deployment/web' };
    const st = { m: `근무 ${r}/3`, t: `READY ${r}/3` };
    if (e.fail) { st.m += ' · 진행 실패'; st.t += ' · 기한 초과'; }   // Progressing=False (ProgressDeadlineExceeded)
    return [name, { m: '-', t: '-' }, st];
  }
  const v = e.ver || 'v1', want = e.want == null ? 3 : e.want;
  return [{ m: `└ 정원표 (매뉴얼 ${v})`, t: `└ replicaset/${RS_VER[v]}` }, { m: '-', t: '-' }, { m: `근무 ${r}/${want}`, t: `ready ${r}/${want}` }];
}
let flash = [];
function renderLedger() {
  const tb = document.getElementById('lt');
  tb.innerHTML = '';
  const tree = S.ledger.some((e) => e.kind === 'rs');   // 정원표가 있으면 직원은 그 아래로
  const rows = [];
  S.ledger.forEach((e) => {
    if (e.rs) return;                                    // 소속 정원표 바로 아래에 붙인다
    rows.push(e);
    if (e.kind === 'rs') rows.push(...S.ledger.filter((q) => q.rs === e.id));
  });
  rows.forEach((e) => {
    let cells;
    if (e.kind === 'node') {
      const r = S.rooms[e.n];
      cells = [{ m: `${ROOMS[e.n].m} 출입 기록`, t: `node/${ROOMS[e.n].t}` }, { m: '-', t: '-' },
        r.unreach ? { m: '연락 두절', t: 'Unknown' } : r.nr ? { m: '일 못 함', t: 'NotReady' }
          : r.cordon ? { m: '배치 금지', t: 'Ready,SchedulingDisabled' } : { m: '정상', t: 'Ready' }];
    } else if (e.kind) {
      cells = ledgerHead(e);
    } else {
      const p = S.pods.find((q) => q.id === e.id);
      const pre = tree ? '\u3000└ ' : '';
      cells = [{ m: pre + p.mn, t: pre + p.tn }, e.node == null ? { m: '-', t: '<none>' } : ROOMS[e.node], stCell(e)];
    }
    const tr = document.createElement('tr');
    if (flash.includes(e.id)) tr.className = 'flash';
    else if (loopFlash.includes(e.id)) tr.className = 'flash-loop';
    cells.forEach((c) => {
      const td = document.createElement('td');
      td.textContent = L(c);
      tr.appendChild(td);
    });
    tb.appendChild(tr);
  });
  flash = [];
}

function podAt(x, y) {
  if (!SC.clickPods) return null;
  const pad = cv.clientWidth < 700 ? 4 : 0;   // 폰: 손가락으로 누르기 쉽게 (옆 책상과는 24 떨어져 안 겹침)
  return S.pods.find((p) => p.state === 'run' && x >= p.x - pad && x < p.x + 12 + pad && y >= p.feet - 17 - pad && y <= p.feet + pad);
}
function roomAt(x, y) {
  if (!SC.clickRooms || S.phase !== 'idle' || S.used) return null;
  const n = ROOM_X.findIndex((x0) => x >= x0 && x < x0 + 76 && y >= 69 && y <= 141);
  return n >= 0 && S.pods.some((p) => p.node === n && p.state === 'run') ? n : null;
}
function clickRoom(n) {
  if (n == null || S.phase !== 'idle' || S.used) return;   // 한 판에 한 층
  S.used = true;
  S.phase = 'run';
  S.down = n;
  runStep(1);
}
function toCanvas(e) { return [(e.offsetX / cv.clientWidth) * W, (e.offsetY / cv.clientHeight) * H]; }

function clickPod(p) {
  if (S.phase !== 'idle' || !p || p.state !== 'run') return;
  clearBubbles();
  S.phase = 'run';
  S.victim = p;
  S.fresh = null;
  runStep(1);
}

cv.addEventListener('click', (e) => {
  const [x, y] = toCanvas(e);
  if (SC.clickRooms) clickRoom(roomAt(x, y)); else clickPod(podAt(x, y));
});
cv.addEventListener('mousemove', (e) => {
  const [x, y] = toCanvas(e);
  cv.style.cursor = S.phase === 'idle' && (podAt(x, y) || roomAt(x, y) != null) ? 'pointer' : 'default';
});

// ===== 엔진이 부르는 곳 (engine/runner.js) =====
const WORLD = {
  init: () => initState(),                       // S 를 새로 만듦 (장면 init 포함)
  clear() {                                      // 화면 밖 HTML · 반짝임 정리
    podTags.forEach((el) => el.remove()); podTags.clear();
    loopFlash = []; flash = [];
  },
  refresh() {                                    // S 를 바꾼 뒤 이름표 · 장부 다시 그림
    refreshRoomTags();
    Object.assign($('lrs').dataset, SC.sub);
    $('lrs').textContent = L(SC.sub);
    renderLedger();
  },
  save: () => ({ podSeq }),                      // 다시보기 스냅숏에 S 말고 더 담을 것
  restore(w) { podSeq = w.podSeq; },
  beforeStep: () => stopEcho(),                  // 단계 시작 / 끝 (마지막 동작 반복)
  afterStep: () => startEcho(),
  autoOn() { if (loopFlash.length) { loopFlash = []; renderLedger(); } },
  mode() {                                       // 비유/용어 전환
    podTags.forEach((el, id) => { const p = S.pods.find((q) => q.id === id); if (p) el.textContent = L(podLabel(p)); });
    renderLedger();
  },
  tick() { if (SC.heartbeat) spawnHearts(); tickEcho(); },   // 매 프레임, 그리기 전
  draw: () => draw(),
  tags: () => updateTags(),
};
