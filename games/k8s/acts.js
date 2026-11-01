// 쿠버네티스 회사: 장면 공용 연출 (봉투 · 도장 · 장부 기록 · 방송 · 걷기 · 마지막 동작 반복)
'use strict';

// ===== 장면 공용 =====

const C1 = '실제 1초 미만';
const entry = (id) => S.ledger.find((e) => e.id === id);

// ===== 연출 도구 (회사 비유: 봉투 · 도장 · 장부 · 방송) =====

async function fly(from, to, ms = 800) {
  S.echo = { k: 'fly', from, to };
  const e = { x: from[0], y: from[1] };
  S.envs.push(e);
  await tween(ms, (p) => {
    const q = ease(p);
    e.x = from[0] + (to[0] - from[0]) * q;
    e.y = from[1] + (to[1] - from[1]) * q - Math.sin(Math.PI * p) * 10;
  });
  S.envs.splice(S.envs.indexOf(e), 1);
}

function hop(a) { S.echo = { k: 'hop', a }; return tween(320, (p) => { a.dy = -Math.round(Math.sin(Math.PI * p) * 3); }); }

function bang(pos, ms = 1500) {
  const b = { x: pos[0], y: pos[1] };
  S.bangs.push(b);
  wait(ms).then(() => { const i = S.bangs.indexOf(b); if (i >= 0) S.bangs.splice(i, 1); });
}

// 창구가 서류를 받는다: 벌떡 일어나 검사 도장
async function receive(full) {
  S.apiAwake = true;
  await wait(250);
  const items = full
    ? [{ m: '신분 ✓', t: '인증 ✓' }, { m: '권한 ✓', t: '인가 ✓' }, { m: '양식 ✓', t: '어드미션 ✓' }]
    : [{ m: '검사 ✓', t: '인증·인가·어드미션 ✓' }];
  const xs = full ? [100, 126, 152] : [126];
  S.echo = { k: 'stamp', items, xs };
  for (let i = 0; i < items.length; i++) {
    bubble(xs[i], 24, items[i], full ? 2600 : 1300, 'ok');
    await wait(full ? 500 : 400);
  }
}

// 장부에 적는다: 서랍이 열리고 표 줄이 반짝
async function record(change) {
  await fly([132, 42], P.drawer(), 450);
  S.drawer = 1;
  const changed = change();
  flash = changed == null ? [] : [].concat(changed);
  S.echo = { k: 'rec', ids: flash.slice() };
  renderLedger();
  await wait(400);
  S.drawer = 0;
}

// 장부가 바뀌었다고 방송(watch) → 듣는 사람 머리 위에 !
async function broadcast(listeners) {
  S.echo = { k: 'ring', listeners };
  const r = { r: 4, a: 1 };
  S.rings.push(r);
  await tween(750, (p) => { r.r = 4 + p * 80; r.a = 1 - p; });
  S.rings.splice(S.rings.indexOf(r), 1);
  listeners.forEach((pos) => bang(pos));
  await wait(500);
}



// 단계가 끝나고 「다음」을 기다리는 동안 마지막 동작을 반복한다 (자동 재생 중에는 안 함)
let loopFlash = [];
const echoOn = () => S.echo && !busy && !$('auto').checked;
const echoPhase = () => (T % 84) / 84;

function startEcho() {
  const E = S.echo;
  if (!E || $('auto').checked) return;
  if (E.k === 'rec' && E.ids.length) { loopFlash = E.ids; renderLedger(); }
  if (E.k === 'stamp') E.items.forEach((it, i) => bubble(E.xs[i], 24, it, Infinity, 'ok'));
}

function stopEcho() {
  const E = S.echo;
  if (E && E.k === 'hop') E.a.dy = 0;
  if (E && E.k === 'rec') S.drawer = 0;
  S.echo = null;
  if (loopFlash.length) { loopFlash = []; renderLedger(); }
}

function tickEcho() {
  const E = S.echo;
  if (!E || !echoOn()) return;
  const ph = echoPhase();
  if (E.k === 'hop') E.a.dy = ph < 0.4 ? -Math.round(Math.sin((Math.PI * ph) / 0.4) * 3) : 0;
  if (E.k === 'rec') S.drawer = ph < 0.3 ? 1 : 0;
}

function drawEcho() {
  const E = S.echo;
  if (!E || !echoOn()) return;
  const ph = echoPhase();
  if (E.k === 'ring') {
    drawRing({ r: 4 + ph * 80, a: 1 - ph });
    E.listeners.forEach(([x, y]) => ctx.drawImage(SPR.bang, Math.round(x - 2), Math.round(y - 14 - (Math.floor(T / 10) % 2))));
  }
  if (E.k === 'call') drawCall(E.pts, Math.min(1, ph * 1.25));
  if (E.k === 'fly') {
    const q = ease(Math.min(1, ph * 1.25));
    const x = E.from[0] + (E.to[0] - E.from[0]) * q;
    const y = E.from[1] + (E.to[1] - E.from[1]) * q - Math.sin(Math.PI * Math.min(1, ph * 1.25)) * 10;
    ctx.drawImage(SPR.env, Math.round(x - 3), Math.round(y - 2));
  }
}

async function doze() { await wait(300); S.apiAwake = false; }

async function walk(p, toX, ms) {
  const x0 = p.x;
  p.walking = true;
  p.dir = toX < x0 ? 'l' : 'r';
  await tween(ms, (q) => { p.x = x0 + (toX - x0) * q; });
  p.walking = false;
}
