// 엔진: 공용 상태(S · 모드 · 난수) · 연출 시계 · 트윈. 다른 게임에도 그대로 씀
'use strict';

const $ = (id) => document.getElementById(id);

// ===== 무대 캔버스 (크기는 index.html 의 canvas 가 정함) =====
const cv = $('cv');
const ctx = cv.getContext('2d');
const W = cv.width, H = cv.height;

let MODE = 'm';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : o[MODE]);

let S;      // 장면 상태
let gen = 0; // 처음부터를 누르면 올라감 → 진행 중이던 연출은 버려진다

// 난수는 씨앗에서 뽑는다 → 다시보기 때 같은 씨앗으로 돌리면 같은 결과(같은 층·같은 이름)가 나온다
let seed = Date.now() | 0;
function rnd() {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ===== 연출 시계 · 트윈 =====

// 연출 시계. 점검(tests/smoke.cjs)은 ?speed=30 으로 빨리 돌린다 — 평소엔 1
const SPEED = Number(new URLSearchParams(location.search).get('speed')) || 1;
let now = 0, lastTs = null, T = 0;
const tweens = [];
function tween(ms, fn) { return new Promise((res) => tweens.push({ t0: now, ms, fn, res })); }
const wait = (ms) => tween(ms, () => {});
const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2);
