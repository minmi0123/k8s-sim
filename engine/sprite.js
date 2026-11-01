// 엔진: 도트 그림 만들기 (글자 격자 → canvas), 사람 도트 틀
'use strict';

// ===== 도트 (dev-guide 도트.md 방식: 글자 1개 = 픽셀 1개) =====

const PALETTE = {
  o: '#3d2c3a', // 외곽선
  h: '#5a3a2a', // 머리카락
  s: '#f6cfae', // 피부
  c: '#f2a0a0', // 볼
  e: '#3d2c3a', // 눈
  m: '#c9645a', // 입
  t: '#8fb8e8', // 윗옷
  p: '#5a6a9a', // 바지
  b: '#5a4636', // 신발
  w: '#fffdf5', // 종이
  k: '#c4905a', // 나무
  i: '#e8434a', // 빨강 (느낌표·화살표)
};

function makeSprite(rows, colors = {}, flip = false) {
  const pal = { ...PALETTE, ...colors };
  const w = rows[0].length;
  rows.forEach((r, i) => { if (r.length !== w) console.warn('도트 줄 길이 다름', i, r); });
  const c = document.createElement('canvas');
  c.width = w;
  c.height = rows.length;
  const g = c.getContext('2d');
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || !pal[ch]) return;
    g.fillStyle = pal[ch];
    g.fillRect(flip ? w - 1 - x : x, y, 1, 1);
  }));
  return c;
}

// 사람 12x17 (머리·몸 15줄 + 다리 2줄)
const TOP = [
  '...oooooo...',
  '..ohhhhhho..',
  '.ohhhhhhhho.',
  '.ohhsssshho.',
  '.osssssssso.',
  '.osesssseso.',
  '.osesssseso.',
  '.ocssmmssco.',
  '..osssssso..',
  '...oottoo...',
  '..otttttto..',
  '.otttttttto.',
  '.osttttttso.',
  '.osttttttso.',
  '..oppppppo..',
];
// 조는 얼굴: 눈을 가로 줄로
const SLEEP_TOP = TOP.map((r, i) => (i === 5 ? '.osssssssso.' : i === 6 ? '.osossssoso.' : r));
const LEGS = {
  stand: ['...op..po...', '...ob..bo...'],
  a:     ['..op....po..', '..ob....bo..'],
  b:     ['....oppo....', '....obbo....'],
};

function makePerson(colors, top = TOP) {
  const frames = (flip) => ({
    stand: makeSprite([...top, ...LEGS.stand], colors, flip),
    walk: [makeSprite([...top, ...LEGS.a], colors, flip), makeSprite([...top, ...LEGS.b], colors, flip)],
  });
  return { right: frames(false), left: frames(true) };
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

function drawPerson(set, x, feet, { walking = false, dir = 'r', alpha = 1 } = {}) {
  const fr = set[dir === 'l' ? 'left' : 'right'];
  const img = walking ? fr.walk[Math.floor(T / 8) % 2] : fr.stand;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, Math.round(x), Math.round(feet - img.height + 1));
  ctx.globalAlpha = 1;
}

// 작은 도트 그림: r(x, y, w, h, 색) 으로 칠한다
function pix(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  fn((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); }, g);
  return c;
}
