// 쿠버네티스 회사: 처음 화면 그림 · 도감 내용
'use strict';

const DEX_GROUPS = ['사람', '장소·물건', '표시·상태'];

// 처음 화면 그림: 회사 건물(위 = 본사, 아래 = 층 3개) 옆에 나(관리자)
function drawTitle() {
  const g = $('titleCv').getContext('2d');
  g.imageSmoothingEnabled = false;
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  const O = PALETTE.o;
  r(0, 0, 160, 120, '#a9d3ec');                                    // 하늘
  r(128, 10, 12, 12, '#ffe27a'); r(126, 12, 16, 8, '#ffe27a'); r(130, 8, 8, 16, '#ffe27a');
  r(100, 30, 22, 5, '#fffdf5'); r(95, 33, 34, 4, '#fffdf5');       // 구름
  r(0, 104, 160, 16, '#a3a0ab'); r(0, 104, 160, 1, O);              // 길
  for (let x = 8; x < 160; x += 16) r(x, 105, 1, 15, '#94919e');
  // 간판 K8S
  r(38, 8, 34, 13, O); r(39, 9, 32, 11, '#e8734a');
  const GLYPH = [['1.1', '1.1', '11.', '1.1', '1.1'], ['111', '1.1', '111', '1.1', '111'], ['111', '1..', '111', '..1', '111']];
  GLYPH.forEach((rows, i) => rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '1') r(44 + i * 8 + x * 2, 10 + y * 2, 2, 2, '#fffdf5');
  })));
  // 건물
  r(12, 20, 86, 85, O);
  r(13, 21, 84, 26, '#f3e6c8');                                    // 본사
  r(13, 48, 84, 2, '#b9a07a');                                     // 본사와 층 사이
  [[13, 27], [41, 27], [69, 28]].forEach(([x, w]) => r(x, 51, w, 53, '#efe2c6'));   // 층 3개
  const win = (x, y, who) => {
    r(x - 1, y - 1, 14, 11, O); r(x, y, 12, 9, '#bfe3f2');
    if (who) { r(x + 4, y + 2, 4, 2, who.h); r(x + 4, y + 4, 4, 3, PALETTE.s); r(x + 3, y + 7, 6, 2, who.t); }
  };
  win(20, 28, LOOKS.sch); win(49, 28, LOOKS.api); win(78, 28, LOOKS.rs);
  const E = LOOKS.emp;
  win(20, 58, E[0]); win(20, 80, E[1]);
  win(48, 58, E[2]);
  win(76, 58, null); win(76, 80, E[3]);
  r(46, 83, 16, 21, O); r(47, 84, 14, 20, '#8fc4e4'); r(54, 84, 1, 20, O);   // 문
  r(51, 93, 2, 1, O); r(56, 93, 2, 1, O);
  g.drawImage(SPR.me.left.stand, 114, 70, 24, 34);                 // 나(관리자), 두 배 크기
}

// ----- 도감 그림 -----
const O_ = PALETTE.o;
const bld = (hi) => pix(19, 12, (r) => {
  r(0, 0, 19, 12, O_);
  r(1, 1, 17, 4, hi === 'top' ? '#ffe27a' : '#f3e6c8');
  r(3, 2, 2, 2, '#bfe3f2'); r(14, 2, 2, 2, '#bfe3f2');
  [1, 7, 13].forEach((x, i) => {
    r(x, 6, 5, 5, hi === 'room' && i === 0 ? '#ffe27a' : '#efe2c6');
    r(x + 1, 7, 2, 1, PALETTE.s); r(x + 1, 8, 2, 2, '#8fb8e8');
  });
});
const paper = (band, mark) => pix(10, 13, (r) => {
  r(0, 0, 10, 13, O_); r(1, 1, 8, 11, '#fffdf5'); r(1, 1, 8, 3, band);
  [6, 8, 10].forEach((y, i) => r(2, y, i === 2 ? 4 : 6, 1, '#c9c6d6'));
  if (mark === 'dots') [6, 8, 10].forEach((y) => r(2, y, 1, 1, '#4f9a7a'));
  if (mark === 'check') { r(4, 9, 1, 1, '#4f9a7a'); r(5, 10, 1, 1, '#4f9a7a'); r(6, 9, 1, 1, '#4f9a7a'); r(7, 8, 1, 1, '#4f9a7a'); r(8, 7, 1, 1, '#4f9a7a'); }
});
const door = (tape) => pix(16, 16, (r) => {
  r(0, 3, 16, 13, O_); r(1, 4, 14, 12, '#efe2c6');
  r(4, 6, 8, 10, O_); r(5, 7, 6, 9, '#a8693f');
  for (let x = 0; x < 16; x++) for (let y = 0; y < 3; y++) r(x, y, 1, 1, Math.floor((x + y) / 3) % 2 ? tape : O_);
  for (let i = 0; i < 4; i++) { r(5 + i, 8 + i * 2, 1, 2, tape); r(10 - i, 8 + i * 2, 1, 2, tape); }
});
const gauge = (col, y) => pix(14, 16, (r) => {
  r(3, 0, 8, 16, O_); r(4, 1, 6, 14, '#efe2c6'); r(4, 9, 6, 6, '#8fb8e8'); r(0, y, 14, 1, col);
});
const book = (r, x, y, col) => { r(x, y, 4, 12 - y, O_); r(x + 1, y + 1, 2, 10 - y, col); };
const QM = (col) => makeSprite(['.iii.', 'i...i', '...i.', '..i..', '.....', '..i..'], { i: col });
const CHECK = makeSprite(['....g', '...g.', 'g.g..', '.g...'], { g: '#4f9a7a' });
const PHONE = ['.ooooo.', 'oiiiiio', 'oio.oio', 'oo...oo'];
const stand = (set) => set.right.stand;
const withMark = (person, mark, mx = 16, my = 2) => pix(24, 20, (r, g) => { g.drawImage(person, 3, 2); g.drawImage(mark, mx, my); });
const lying = (zz) => pix(24, 20, (r, g) => {
  g.save(); g.translate(2, 18); g.rotate(-Math.PI / 2); g.drawImage(stand(SPR.empSleep[1]), 0, 0); g.restore();
  if (zz) g.drawImage(SPR.zz, 17, 1);
});

const ALL = 'all';
const DEX = [
  // 사람
  { g: '사람', m: '직원', t: 'Pod', art: () => stand(SPR.emp[0]), sc: ALL,
    d: '실제로 일하는 단위. 그만두면 같은 사람이 돌아오지 않고, 이름·내선번호가 다른 새 직원이 들어옴.' },
  { g: '사람', m: '나(관리자)', t: 'kubectl', art: () => stand(SPR.me), sc: [1, 3, 4, 6, 7],
    d: '원하는 상태를 서류로 써서 창구에 냄. 직원을 직접 뽑거나 앉히지 않음.' },
  { g: '사람', m: '창구직원', t: 'kube-apiserver', art: () => stand(SPR.api), sc: ALL,
    d: '모든 서류가 지나가는 입구. 서류 검사(인증·인가·어드미션)는 깐깐하지만, 결정은 안 하고 장부에 적고 알리기만 함.' },
  { g: '사람', m: '자리배치 담당', t: 'kube-scheduler', art: () => stand(SPR.sch), sc: [1, 2, 3, 4, 6, 7],
    d: '층이 정해지지 않은 직원에게 층을 정해 줌. 조건이 안 맞는 층은 거르고, 남은 층에 점수를 매겨 고름.' },
  { g: '사람', m: '정원 담당', t: 'ReplicaSet 컨트롤러', art: () => stand(SPR.rs), sc: [1, 3, 4, 6, 7],
    d: '정원표의 인원과 실제 직원 수를 맞춤. 모자라면 새 직원을 요청하고, 넘치면 내보냄.' },
  { g: '사람', m: '기획 담당', t: 'Deployment 컨트롤러', art: () => stand(SPR.dep), sc: [3, 6],
    d: '운영 계획서를 보고 정원표를 만듦. 매뉴얼이 바뀌면 새 정원표를 만들어 직원을 조금씩 옮김.' },
  { g: '사람', m: '층 관리자', t: 'kubelet', art: () => stand(SPR.kub), sc: ALL,
    d: '층마다 한 명. 배정된 직원을 실제로 앉히고 상태를 확인함. 쓰러진 직원은 같은 자리에서 다시 일으킴.' },
  { g: '사람', m: '층 점검 담당', t: 'Node 컨트롤러', art: () => stand(SPR.nc), sc: [4],
    d: '층마다 오는 살아있음 신호(♥)를 지켜봄. 신호가 끊기면 그 층을 연락 두절로 표시함.' },
  { g: '사람', m: '명단 담당', t: 'EndpointSlice 컨트롤러', art: () => stand(SPR.ep), sc: [7],
    d: '대표번호로 연결할 직원 명단을 고침. 준비 안 된 직원은 명단에서 뺌.' },
  { g: '사람', m: '번호 안내', t: 'CoreDNS', sc: [7],
    art: () => pix(18, 11, (r, g) => { g.drawImage(SPR.desk, 1, 5); r(3, 0, 7, 5, O_); r(4, 1, 5, 3, '#f5b93a'); r(12, 1, 6, 4, O_); r(13, 2, 4, 2, '#e8434a'); }),
    d: '부서 이름을 물으면 대표번호를 알려 줌. 그림에선 본사에 앉혔지만 실제로는 이것도 Pod임.' },

  // 장소·물건
  { g: '장소·물건', m: '회사', t: '클러스터', art: () => bld(null), sc: ALL,
    d: '본사와 층 전체. 쿠버네티스가 관리하는 범위.' },
  { g: '장소·물건', m: '본사', t: '컨트롤 플레인', art: () => bld('top'), sc: ALL,
    d: '판단하고 기록하는 담당자들이 모인 곳(그림 위쪽). 일하는 직원은 아래 층에서 일함.' },
  { g: '장소·물건', m: '층', t: '노드', art: () => bld('room'), sc: ALL,
    d: '직원이 실제로 일하는 곳(서버 한 대). 책상 수만큼만 앉을 수 있음.' },
  { g: '장소·물건', m: '책상', t: '노드 자원', art: () => SPR.desk, sc: [1, 2, 3],
    d: '층마다 2개 = 층 용량. 실제 사용량이 아니라 예약(requests) 합계로 셈.' },
  { g: '장소·물건', m: '장부', t: 'etcd', sc: ALL,
    art: () => pix(11, 16, (r) => { r(0, 0, 11, 16, O_); r(1, 1, 9, 14, '#c9c6d6'); [1, 6, 11].forEach((y) => { r(1, y, 9, 4, O_); r(2, y + 1, 7, 2, '#e4e1ec'); r(4, y + 2, 3, 1, O_); }); }),
    d: '회사의 모든 기록. 창구직원만 쓰고, 다른 담당자는 창구를 통해서만 봄.' },
  { g: '장소·물건', m: '서류 봉투', t: 'API 요청', art: () => SPR.env, sc: ALL,
    d: '담당자 사이를 오가는 서류. 누가 보내든 반드시 창구를 거침.' },
  { g: '장소·물건', m: '사내 방송', t: 'watch', sc: ALL,
    art: () => pix(20, 16, (r, g) => { for (let a = 0; a < Math.PI * 2; a += 0.3) r(Math.round(10 + Math.cos(a) * 9), Math.round(8 + Math.sin(a) * 7), 1, 1, '#e8434a'); g.drawImage(SPR.bang, 8, 4); }),
    d: '장부가 바뀌면 창구직원이 알림. 듣고 있던 담당자 머리 위에 ! 가 뜨고 움직임.' },
  { g: '장소·물건', m: '운영 계획서', t: 'Deployment', art: () => paper('#5fb3b3'), sc: [3, 6],
    d: '몇 명을 어떤 매뉴얼로 둘지 적은 계획. 직원을 직접 만들지 않고 정원표를 통해 만듦.' },
  { g: '장소·물건', m: '정원표', t: 'ReplicaSet', art: () => paper('#7cc27e'), sc: [1, 3, 6],
    d: '매뉴얼 판마다 하나. 옛 정원표는 0명으로 남겨 두고, 되돌릴 때 다시 씀.' },
  { g: '장소·물건', m: '매뉴얼', t: '컨테이너 이미지', sc: [3, 6],
    art: () => pix(14, 12, (r) => { book(r, 0, 2, VER_COL.v1); book(r, 5, 0, VER_COL.v2); book(r, 10, 3, VER_COL.v3); }),
    d: '직원이 일하는 방법(v1·v2·v3). 판이 바뀌면 직원을 고치지 않고 새 직원으로 교체함.' },
  { g: '장소·물건', m: '대표번호', t: 'Service', art: () => makeSprite(PHONE), sc: [7],
    d: '부서의 고정 번호(ClusterIP). 받는 직원이 바뀌어도 번호는 그대로임.' },
  { g: '장소·물건', m: '내선번호', t: 'Pod IP', art: () => makeSprite(PHONE, { i: '#8fb8e8' }), sc: [7],
    d: '직원마다 다른 번호. 새 직원이 오면 번호도 바뀜.' },
  { g: '장소·물건', m: '연결 명단', t: 'EndpointSlice', art: () => paper('#e89ac8', 'dots'), sc: [7],
    d: '대표번호로 받을 수 있는 직원들의 내선번호 목록.' },
  { g: '장소·물건', m: '교환기', t: 'kube-proxy', sc: [7],
    art: () => pix(16, 10, (r) => { r(0, 0, 16, 10, O_); r(1, 1, 14, 8, '#c9c6d6'); for (let i = 0; i < 4; i++) r(3 + i * 3, 4, 2, 2, i < 3 ? '#4f9a7a' : '#8a7a6a'); }),
    d: '층마다 하나. 명단대로 연결 규칙을 써 둠. 전화는 교환기를 거치지 않고 규칙대로 바로 감.' },

  // 표시·상태
  { g: '표시·상태', m: '창가', t: '노드 라벨', sc: [2],
    art: () => pix(20, 14, (r) => { r(0, 0, 20, 14, O_); r(1, 1, 18, 12, '#bfe3f2'); r(9, 1, 2, 12, O_); r(1, 6, 18, 2, O_); }),
    d: '층에 붙인 특징 표시. 창가를 원하는 직원은 창가 층에만 앉음.' },
  { g: '표시·상태', m: '공사 중 줄무늬', t: 'taint', art: () => door('#f5b93a'), sc: [2],
    d: '이 층엔 오지 말라는 표시. 허가증이 없는 직원은 배치되지 않음.' },
  { g: '표시·상태', m: '공사 허가증', t: 'toleration', art: () => paper('#f5b93a', 'check'), sc: [2],
    d: '줄무늬 층에도 앉을 수 있다는 허가. 그 층으로 보내 주지는 않음.' },
  { g: '표시·상태', m: '로비 대기', t: 'Pending', sc: [2],
    art: () => pix(24, 20, (r, g) => { g.globalAlpha = 0.45; g.drawImage(stand(SPR.emp[2]), 6, 2); }),
    d: '앉을 층이 없어 로비에서 기다리는 상태. 조건이 맞는 자리가 생기면 배치됨.' },
  { g: '표시·상태', m: '살아있음 신호 ♥', t: 'Lease 갱신', art: () => SPR.heart, sc: [4],
    d: '층 관리자가 10초마다 보내는 신호. 끊기면 층 점검 담당이 알아챔.' },
  { g: '표시·상태', m: '빨간 출입 금지', t: 'unreachable taint', art: () => door('#e8434a'), sc: [4],
    d: '연락이 끊긴 층 표시. 5분 기다린 뒤 그 층 직원은 퇴사 처리되고, 다른 층에 새 직원을 뽑음.' },
  { g: '표시·상태', m: '일 못 함 보고', t: 'NotReady', art: () => door('#ff9a5a'), sc: [4],
    d: '층 관리자가 "일 못 함"을 알린 상태(주황 줄무늬). 5분 뒤 다른 층에 새 직원을 뽑음.' },
  { g: '표시·상태', m: '배치 금지', t: 'cordon', art: () => door('#8fb8e8'), sc: [4],
    d: '새 직원을 보내지 않는다는 표시(파란 줄무늬). 있던 직원은 그대로 일함.' },
  { g: '표시·상태', m: '예약 크기', t: 'requests', art: () => gauge('#4f9a7a', 8), sc: [5],
    d: '직원이 쓰겠다고 예약한 양(초록 줄). 자리배치 담당은 이 값만 보고 층을 정함.' },
  { g: '표시·상태', m: '칸막이', t: 'limits', art: () => gauge('#e8434a', 4), sc: [5],
    d: '넘을 수 없는 한도(빨간 줄). 서류(메모리)가 넘치면 쓰러지고, 손(CPU)이 넘치면 느려지기만 함.' },
  { g: '표시·상태', m: '쓰러짐', t: 'OOMKilled', art: () => lying(false), sc: [5],
    d: '메모리 한도를 넘겨 컨테이너가 강제로 끝남. 퇴사가 아니라 같은 자리에서 다시 일어남.' },
  { g: '표시·상태', m: '재시작 대기', t: 'CrashLoopBackOff', art: () => lying(true), sc: [5],
    d: '계속 쓰러지면 다시 일으키기 전 기다림이 10→20→40초… 로 늘어남. 최대 5분.' },
  { g: '표시·상태', m: '출근 확인', t: 'startup probe', art: () => withMark(stand(SPR.emp[3]), CHECK, 17, 3), sc: [6],
    d: '처음 일을 시작했는지 확인함. 이게 끝나기 전엔 다른 확인을 안 함.' },
  { g: '표시·상태', m: '"괜찮나?"', t: 'liveness probe', art: () => withMark(stand(SPR.empSleep[4]), QM('#e8434a')), sc: [6],
    d: '멍해져 답이 없으면(3번 실패) 다시 깨움 = 컨테이너 재시작.' },
  { g: '표시·상태', m: '"준비 됐나?"', t: 'readiness probe', art: () => withMark(stand(SPR.emp[5]), QM('#4f9a7a')), sc: [6, 7],
    d: '바빠서 준비 안 됐다고 하면 새 일(전화)만 안 보냄. 재시작은 안 함.' },
  { g: '표시·상태', m: '진행 실패', t: 'ProgressDeadlineExceeded', sc: [6],
    art: () => pix(13, 13, (r) => { r(1, 1, 11, 11, '#e8434a'); r(2, 2, 9, 9, '#fffdf5'); r(6, 3, 1, 4, O_); r(6, 6, 3, 1, O_); }),
    d: '정해진 시간(기본 10분) 안에 교체가 안 끝남. 기록만 하고 자동으로 되돌리지 않음.' },
  { g: '표시·상태', m: '되돌리기', t: 'rollout undo', sc: [6],
    art: () => pix(22, 12, (r) => { book(r, 0, 1, VER_COL.v1); book(r, 18, 1, VER_COL.v3); r(7, 6, 8, 1, O_); r(8, 5, 1, 3, O_); r(9, 4, 1, 5, O_); }),
    d: '옛 정원표를 다시 늘려 이전 매뉴얼로 돌아감.' },
];
