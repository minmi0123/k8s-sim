// 엔진: 단계 진행 · 다시보기 · 비유/용어 · 장면 탭 · 루프. 게임 쪽은 WORLD 와 SCENEn 으로만 만남
'use strict';

// ===== 진행 =====
// 게임은 WORLD(무대 쪽 할 일)와 장면 객체 SCENEn 을 정해 둔다 — games/k8s/world.js 끝, scene1.js 참고

let SC = null;   // 지금 장면 (게임 main.js 가 처음 장면을 정함)
let cur = 0, busy = false;

function say(i) {
  const steps = SC.steps(), s = steps[i];
  $('lines').innerHTML = '';
  s[MODE].forEach((line) => { const p = document.createElement('p'); p.textContent = line; $('lines').appendChild(p); });
  $('clock').textContent = s.clock ? `⏱ ${s.clock}` : '';
  $('refText').textContent = s.ref;
  $('refLink').href = s.url;
  $('refLink').textContent = s.url.replace('https://', '');
  $('count').textContent = i === 0 ? '' : `${i} / ${steps.length - 1}`;
}

const lastStep = () => SC.steps().length - 1;

function updBtns() {
  $('next').disabled = busy || cur === 0 || cur >= lastStep();
  $('replay').disabled = cur === 0;
}

// 장면 ② 처럼 고르는 장면: 기다리는 동안 선택 칩을 보여 준다
function renderChoices() {
  const box = $('choices');
  box.innerHTML = '';
  if (!SC.choices || S.phase !== 'idle') return;
  SC.choices.forEach((c) => {
    const b = document.createElement('button');
    b.dataset.m = c.m; b.dataset.t = c.t;
    b.textContent = L(c);
    b.addEventListener('click', () => choose(c));
    box.appendChild(b);
  });
}

function choose(c) {
  if (S.phase !== 'idle') return;
  if (S.used) reset();
  S.used = true;
  S.plan = SC.plan(c);
  S.plan.choice = { m: c.m, t: c.t };
  S.phase = 'run';
  renderChoices();
  runStep(1);
}

async function runStep(i) {
  const g = gen;
  cur = i;
  say(i);
  WORLD.beforeStep();
  clearBubbles();
  snap = { S: structuredClone(S), seed, world: WORLD.save(), keeps: bubbles.filter((b) => b.keep).map((b) => b.args) };
  busy = true; updBtns();
  await SC.run[i]();
  if (g !== gen) return;
  busy = false;
  WORLD.afterStep();
  if (i === lastStep()) { S.phase = 'idle'; updBtns(); renderChoices(); return; }
  updBtns();
  if ($('auto').checked) {
    await wait(1500);
    if (g === gen && cur === i && !busy) next();
  }
}

function next() { if (!busy && cur >= 1 && cur < lastStep()) runStep(cur + 1); }

// 다시보기: 단계를 시작할 때 찍어 둔 상태로 돌려 같은 단계를 다시 돈다 (진행 중이어도 됨)
let snap = null;
function replay() {
  if (!snap || cur < 1) return;
  gen++;
  tweens.length = 0;
  clearBubbles(true);
  WORLD.clear();
  S = structuredClone(snap.S); seed = snap.seed; WORLD.restore(snap.world);
  snap.keeps.forEach((a) => bubble(...a));
  WORLD.refresh();
  renderChoices();
  runStep(cur);
}

function reset() {
  gen++;
  tweens.length = 0;
  clearBubbles(true);
  WORLD.clear();
  WORLD.init();
  WORLD.refresh();
  cur = 0; busy = false; snap = null;
  say(0); updBtns(); renderChoices();
}

$('next').addEventListener('click', next);
$('replay').addEventListener('click', replay);
$('reset').addEventListener('click', reset);
$('auto').addEventListener('change', () => {
  if ($('auto').checked) { WORLD.autoOn(); next(); } else if (!busy) WORLD.afterStep();
});

// ===== 비유 / 용어 =====

function setMode(m) {
  MODE = m;
  document.querySelectorAll('#mode button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  document.querySelectorAll('[data-m]').forEach((el) => { el.textContent = el.dataset[m]; });
  WORLD.mode();
  say(cur);
}
document.querySelectorAll('#mode button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));

function switchScene(sc) {
  SC = sc;
  SCENES.forEach((s) => s.btn.classList.toggle('on', s.sc === sc));
  const on = SCENES.find((s) => s.sc === sc).btn;
  on.parentNode.scrollLeft = on.offsetLeft - on.parentNode.offsetLeft - 8;
  reset();
}
// 장면 탭 (SCENES 는 게임 main.js)
function buildSceneTabs() {
  SCENES.forEach((s) => {
    const b = document.createElement('button');
    b.dataset.m = s.m; b.dataset.t = s.t;
    b.textContent = s.m;
    s.btn = b;
    if (s.sc) b.addEventListener('click', () => { if (SC !== s.sc) switchScene(s.sc); });
    else { b.disabled = true; b.title = '준비 중'; }
    $('scenes').appendChild(b);
  });
  SCENES[0].btn.classList.add('on');
}

// ===== 루프 =====

function frame(ts) {
  now += lastTs == null ? 0 : (ts - lastTs) * SPEED; lastTs = ts; T++;
  for (let i = tweens.length - 1; i >= 0; i--) {
    const w = tweens[i];
    const p = Math.min(1, (now - w.t0) / w.ms);
    w.fn(p);
    if (p >= 1) { tweens.splice(i, 1); w.res(); }
  }
  bubbles = bubbles.filter((b) => { if (now > b.until) { b.d.remove(); return false; } return true; });
  WORLD.tick();
  WORLD.draw();
  WORLD.tags();
  requestAnimationFrame(frame);
}
