// 엔진: 캔버스 위 HTML 이름표 · 말풍선
'use strict';

// ===== 이름표 · 말풍선 (캔버스 밖 HTML — 한글은 캔버스에서 못 읽는다) =====

const stage = document.getElementById('stage');
const place = (el, x, y) => { el.style.left = `${(x / W) * 100}%`; el.style.top = `${(y / H) * 100}%`; };

function makeTag(txt, cls = '', short) {
  const d = document.createElement('div');
  d.className = `tag ${cls}`;
  const part = (o, c) => {
    const sp = document.createElement('span');
    sp.className = c; sp.dataset.m = o.m; sp.dataset.t = o.t; sp.textContent = L(o);
    d.appendChild(sp);
  };
  if (short) { part(txt, 'full'); part(short, 'short'); }   // 폰(좁은 화면)에선 짧은 이름만 보임 — CSS 가 고름
  else { d.dataset.m = txt.m; d.dataset.t = txt.t; d.textContent = L(txt); }
  stage.appendChild(d);
  return d;
}

let bubbles = [];
function bubble(x, y, txt, ms = Infinity, cls = '', keep = false) {
  const d = document.createElement('div');
  d.className = `bub ${cls}`;
  d.dataset.m = txt.m; d.dataset.t = txt.t;
  d.textContent = L(txt);
  place(d, x, y);
  stage.appendChild(d);
  bubbles.push({ d, until: now + ms, keep, args: [x, y, txt, ms, cls, keep] });
}
function clearBubbles(all = false) {
  bubbles = bubbles.filter((b) => { if (all || !b.keep) { b.d.remove(); return false; } return true; });
}
