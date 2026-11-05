// 엔진: 처음 화면 · 도감 화면 · 살펴보기 화면
'use strict';

// ===== 처음 화면 · 도감 (내용은 게임 dex.js: DEX · DEX_GROUPS · drawTitle) =====

let screen = 'home', dexFrom = 'home';
function show(name) {
  screen = name;
  $('home').hidden = name !== 'home';
  $('dex').hidden = name !== 'dex';
  $('simScreen').hidden = name !== 'sim';
  $('tour').hidden = name !== 'tour';
  window.scrollTo(0, 0);
  if (name === 'dex') { spyHold = 0; dexNavOn(0); }
  if (name === 'tour') renderTour(tourAt);
  closeCard();
}

const CIRC = '①②③④⑤⑥⑦';
const lines = (x) => x.replace(/([.?!]) +/g, '$1\n');   // 문장마다 줄을 바꿈 (CSS pre-line)
let spyHold = 0;
const dexNavOn = (i) => [...$('dexNav').children].forEach((b, k) => b.classList.toggle('on', k === i));
function dexSpy() {   // 머리 바로 아래를 지난 마지막 묶음을 켬. 맨 끝이면 마지막 묶음
  if (screen !== 'dex' || performance.now() < spyHold) return;
  const line = $('dex').querySelector('.dexhead').getBoundingClientRect().bottom + 8;
  const hs = [...$('dexBody').querySelectorAll('h3')];
  let on = 0;
  hs.forEach((h, k) => { if (h.getBoundingClientRect().top <= line) on = k; });
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) on = hs.length - 1;
  dexNavOn(on);
}
window.addEventListener('scroll', dexSpy, { passive: true });
function dexArt(src) {   // 24x20 칸 가운데에. 작은 그림은 두 배로
  const c = document.createElement('canvas');
  c.width = 24; c.height = 20;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  const k = src.width * 2 <= 24 && src.height * 2 <= 20 ? 2 : 1;
  const w = src.width * k, h = src.height * k;
  g.drawImage(src, Math.floor((24 - w) / 2), Math.floor((20 - h) / 2), w, h);
  return c;
}
function openScene(n) {
  if (SC !== SCENES[n - 1].sc) switchScene(SCENES[n - 1].sc);
  show('sim');
}
function renderDex() {
  const box = $('dexBody');
  box.innerHTML = '';
  $('dexNav').innerHTML = '';
  DEX_GROUPS.forEach((grp, i) => {
    const h = document.createElement('h3');
    h.textContent = grp;
    box.appendChild(h);
    const nb = document.createElement('button');
    nb.textContent = grp;
    nb.addEventListener('click', () => {
      spyHold = performance.now() + 900;   // 부드럽게 내려가는 동안 중간 묶음이 켜지지 않게
      dexNavOn(i);
      window.scrollTo({ top: h.getBoundingClientRect().top + window.scrollY - $('dex').querySelector('.dexhead').offsetHeight - 4, behavior: 'smooth' });
    });
    $('dexNav').appendChild(nb);
    const list = document.createElement('div');
    list.className = 'dexlist';
    DEX.filter((e) => e.g === grp).forEach((e) => {
      const it = document.createElement('div');
      it.className = 'dexit';
      const art = dexArt(e.art());
      art.className = 'art';
      it.appendChild(art);
      const tx = document.createElement('div');
      const add = (cls, text) => { const d = document.createElement('div'); d.className = cls; d.textContent = text; tx.appendChild(d); return d; };
      add('nm', e.m);
      add('tm', e.t);
      add('ds', e.d);   // 나오는 장면은 목록엔 안 둠 — 카드에서 (2026-11-05 사용자 요청)
      it.appendChild(tx);
      const k = dexOrder.push(e) - 1;
      it.addEventListener('click', () => openCard(k));   // 누르면 하나를 크게 (카드)
      list.appendChild(it);
    });
    box.appendChild(list);
  });
  $('dexCount').textContent = `용어 ${DEX.length}개`;
}

// 도감 카드: 큰 도트 · 이름 · 긴 설명(비유 e.l / 용어 e.lt, 없으면 e.d) · ◀ ▶ 로 옆 항목
const dexOrder = [];   // 목록에 보이는 순서 (묶음 순)
let cardAt = -1;
function openCard(k) {
  cardAt = k;
  const e = dexOrder[k], c = $('dexCard');
  const inGrp = dexOrder.filter((q) => q.g === e.g);
  $('cardKick').textContent = `${e.g} · ${inGrp.indexOf(e) + 1} / ${inGrp.length}`;
  const art = $('cardArt'), src = e.art(), z = Math.max(1, Math.floor(Math.min(40 / src.width, 30 / src.height)));
  art.width = 48; art.height = 36;   // 작은 그림은 크게 키워 가운데에 (도트 그대로)
  const g = art.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(src, Math.floor((48 - src.width * z) / 2), Math.floor((36 - src.height * z) / 2), src.width * z, src.height * z);
  $('cardName').textContent = e.m;
  $('cardTerm').textContent = e.t;
  const tx = e.l || e.d;
  bothTxt($('cardText'), { m: lines(tx), t: lines(e.lt || tx) });   // 비유판 l / 용어판 lt — 스위치로 하나만
  const pv = dexOrder[k - 1], nx = dexOrder[k + 1];
  $('cardPrev').disabled = !pv; $('cardPrev').textContent = pv ? `◀ ${pv.m}` : '◀';
  $('cardNext').disabled = !nx; $('cardNext').textContent = nx ? `${nx.m} ▶` : '▶';
  c.hidden = false;
  document.body.classList.add('noscroll');
}
function closeCard() {
  cardAt = -1;
  $('dexCard').hidden = true;
  document.body.classList.remove('noscroll');
}
const cardGo = (d) => { const k = cardAt + d; if (cardAt >= 0 && dexOrder[k]) openCard(k); };

// ===== 살펴보기 (내용은 게임 tour.js: TOUR · TERM — 그림은 slide.pic() 이 준다) =====

let tourAt = 0;
const tourPics = [];
const el = (tag, cls, text) => { const d = document.createElement(tag); if (cls) d.className = cls; if (text != null) d.textContent = text; return d; };
const bothTxt = (d, o) => { d.dataset.m = o.m; d.dataset.t = o.t; d.textContent = L(o); return d; };   // 비유/용어 전환(setMode)이 바꿔 줌
function sceneBtns(box, list, long) {
  list.forEach((n) => {
    const b = long ? bothTxt(el('button'), SCENES[n - 1]) : el('button', '', CIRC[n - 1]);
    b.title = SCENES[n - 1].m;
    b.addEventListener('click', () => openScene(n));
    box.appendChild(b);
  });
}
function drawTourPic(pic) {   // 그 장의 요소만 밝게: 전체를 흐리게 덮고 hl 칸만 원래 그림으로 되살린 뒤 테두리
  const g = $('tourCv').getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(pic.img, 0, 0);
  const hl = pic.hl || [];
  if (hl.length && pic.dim !== false) {
    g.fillStyle = 'rgba(61, 44, 58, .55)';
    g.fillRect(0, 0, W, H);
    hl.forEach(([x, y, w, h]) => g.drawImage(pic.img, x, y, w, h, x, y, w, h));
  }
  g.fillStyle = '#e8734a';
  hl.forEach(([x, y, w, h]) => { g.fillRect(x - 1, y - 1, w + 2, 1); g.fillRect(x - 1, y + h, w + 2, 1); g.fillRect(x - 1, y, 1, h); g.fillRect(x + w, y, 1, h); });
  const st = $('tourStage');
  st.querySelectorAll('.tag').forEach((d) => d.remove());
  pic.tags.forEach((t) => { const d = makeTag(t.txt, t.cls, t.s); st.appendChild(d); place(d, t.at[0], t.at[1]); });
}
function openTerm(k, btn) {
  const box = $('tourTerm');
  const same = !box.hidden && box.dataset.k === k;
  $('tourTerms').querySelectorAll('button').forEach((b) => b.classList.toggle('on', !same && b === btn));
  box.hidden = same;
  if (same) return;
  const t = TERM[k];
  box.dataset.k = k;
  box.innerHTML = '';
  const h = el('div', 'tph');
  h.appendChild(el('b', '', t.q));
  const x = el('button', '', '닫기 ✕');
  x.addEventListener('click', () => openTerm(k));
  h.appendChild(x);
  box.appendChild(h);
  box.appendChild(el('p', 'def', t.def));
  const ana = el('p', 'ana');
  ana.appendChild(el('span', '', '비유'));
  ana.appendChild(document.createTextNode(t.ana));
  box.appendChild(ana);
  box.appendChild(el('p', 'more', t.more));
  if (t.sc.length) { const scs = el('div', 'scs', '장면에서 보기'); sceneBtns(scs, t.sc); box.appendChild(scs); }
}
function renderTour(i) {
  tourAt = i;
  const s = TOUR[i];
  $('tourKick').textContent = s.kick;
  $('tourTitle').textContent = s.title;
  bothTxt($('tourBody'), { m: lines(s.body.m), t: lines(s.body.t) });
  drawTourPic(tourPics[i] || (tourPics[i] = s.pic()));
  $('tourTerms').innerHTML = '';
  s.terms.forEach((k) => {
    const b = el('button', '', TERM[k].q);
    b.addEventListener('click', () => openTerm(k, b));
    $('tourTerms').appendChild(b);
  });
  $('tourTerm').hidden = true;
  const sc = $('tourScenes');
  sc.innerHTML = '';
  sc.hidden = !s.scenes;
  if (s.scenes) sceneBtns(sc, SCENES.map((_, k) => k + 1), true);
  [...$('tourDots').children].forEach((d, k) => d.classList.toggle('on', k === i));
  $('tourPrev').disabled = i === 0;
  $('tourNext').disabled = i === TOUR.length - 1;
}
const tourGo = (d) => { const i = tourAt + d; if (i >= 0 && i < TOUR.length) renderTour(i); };

function initScreens() {
  $('startSub').textContent = `장면 ${SCENES.length}개 · 직접 해 보기`;
  $('dexSub').textContent = `용어 ${DEX.length}개 · 하나씩 넘겨 보기`;
  $('goStart').addEventListener('click', () => show('sim'));
  $('goDex').addEventListener('click', () => { dexFrom = 'home'; show('dex'); });
  $('toDex').addEventListener('click', () => { dexFrom = 'sim'; show('dex'); });
  $('toHome').addEventListener('click', () => show('home'));
  $('dexBack').addEventListener('click', () => show(dexFrom));
  renderDex();
  $('tourSub').textContent = `${TOUR.length}장 · 전체 구조 이해`;
  $('goTour').addEventListener('click', () => show('tour'));
  $('tourBack').addEventListener('click', () => show('home'));
  $('tourPrev').addEventListener('click', () => tourGo(-1));
  $('tourNext').addEventListener('click', () => tourGo(1));
  TOUR.forEach((_, k) => {
    const d = el('button');
    d.title = TOUR[k].kick;
    d.addEventListener('click', () => renderTour(k));
    $('tourDots').appendChild(d);
  });
  $('cardClose').addEventListener('click', closeCard);
  $('dexCard').addEventListener('click', (e) => { if (e.target === $('dexCard')) closeCard(); });   // 카드 밖(어두운 곳)을 눌러도 닫힘
  $('cardPrev').addEventListener('click', () => cardGo(-1));
  $('cardNext').addEventListener('click', () => cardGo(1));
  document.addEventListener('keydown', (e) => {
    const go = screen === 'tour' ? tourGo : screen === 'dex' && cardAt >= 0 ? cardGo : null;
    if (!go) return;
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'Escape' && screen === 'dex') closeCard();
  });
}
