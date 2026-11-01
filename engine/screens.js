// 엔진: 처음 화면 · 도감 화면
'use strict';

// ===== 처음 화면 · 도감 (내용은 게임 dex.js: DEX · DEX_GROUPS · drawTitle) =====

let screen = 'home', dexFrom = 'home';
function show(name) {
  screen = name;
  $('home').hidden = name !== 'home';
  $('dex').hidden = name !== 'dex';
  $('simScreen').hidden = name !== 'sim';
  window.scrollTo(0, 0);
  if (name === 'dex') { spyHold = 0; dexNavOn(0); }
}

const CIRC = '①②③④⑤⑥⑦';
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
      add('ds', e.d);
      const scs = add('scs', e.sc === ALL ? '모든 장면' : '나오는 장면');
      if (e.sc !== ALL) e.sc.forEach((n) => {
        const b = document.createElement('button');
        b.textContent = CIRC[n - 1];
        b.title = SCENES[n - 1].m;
        b.addEventListener('click', () => openScene(n));
        scs.appendChild(b);
      });
      it.appendChild(tx);
      list.appendChild(it);
    });
    box.appendChild(list);
  });
  $('dexCount').textContent = `용어 ${DEX.length}개`;
}

function initScreens() {
  $('startSub').textContent = `장면 ${SCENES.length}개`;
  $('dexSub').textContent = `용어 ${DEX.length}개`;
  $('goStart').addEventListener('click', () => show('sim'));
  $('goDex').addEventListener('click', () => { dexFrom = 'home'; show('dex'); });
  $('toDex').addEventListener('click', () => { dexFrom = 'sim'; show('dex'); });
  $('toHome').addEventListener('click', () => show('home'));
  $('dexBack').addEventListener('click', () => show(dexFrom));
  renderDex();
}
