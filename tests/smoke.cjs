// 자동 점검: 모든 장면 · 모든 갈래를 끝까지 돌려 결과를 기준(baseline.json)과 비교한다.
//   node tests/smoke.cjs            점검
//   node tests/smoke.cjs --update   지금 결과를 기준으로 저장 (동작을 일부러 바꿨을 때만)
// 갈래마다 두 번 돈다: A = 비유 모드, B = 용어 모드 + 2단계에서 다시보기. 둘이 같아야 한다(모드·다시보기가 결과를 안 바꿈).
// 브라우저: 설치된 Chrome 을 쓴다. playwright 는 전역 @playwright/mcp 안의 것을 빌려 쓴다.
'use strict';
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* 아래로 */ }
  const g = execSync('npm root -g').toString().trim();
  return require(path.join(g, '@playwright', 'mcp', 'node_modules', 'playwright'));
}

const ROOT = path.resolve(__dirname, '..');
const BASE = path.join(__dirname, 'baseline.json');
const URL = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') + '?speed=30';
const SEED = 20261101;

// 페이지 안에서 도는 코드: 갈래 하나를 끝까지 돌리고 결과를 돌려준다
async function runCase(arg) {
  const { scene, idx, mode, replayAt, seed } = arg;
  const $ = (id) => document.getElementById(id);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const read = () => ({
    lines: $('lines').textContent,
    ledger: [...$('lt').rows].map((r) => [...r.cells].map((c) => c.textContent).join(' | ')),
  });
  $('auto').checked = false;
  sim.setMode(mode);
  sim.seed = seed;
  sim.scene(scene);
  $('auto').checked = true;
  const chips = document.querySelectorAll('#choices button');
  if (chips.length) chips[idx].click();
  else sim.clickPod(sim.S.pods.filter((p) => p.state === 'run')[idx]);
  let replayed = false;
  const t0 = performance.now();
  for (;;) {
    await sleep(15);
    if (replayAt && !replayed && sim.cur === replayAt && sim.busy) { await sleep(40); sim.replay(); replayed = true; }
    if (sim.cur === sim.last && !sim.busy) break;
    if (performance.now() - t0 > 60000) return { error: `timeout at step ${sim.cur}` };
  }
  $('auto').checked = false;
  sim.setMode('m'); const m = read();
  sim.setMode('t'); const t = read();
  sim.setMode('m');
  return {
    steps: sim.last,
    replayed,
    pods: sim.S.pods.filter((p) => p.state !== 'none').map((p) => [p.mn, p.tn, p.node, p.state, p.ver || '', p.ip || '', p.ext || ''].join('/')),
    m, t,
  };
}

(async () => {
  const update = process.argv.includes('--update');
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch({ channel: 'chrome' });
  const page = await browser.newPage({ viewport: { width: 1100, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(URL);
  await page.evaluate(() => sim.show('sim'));

  // 갈래 목록: 칩이 있으면 칩마다, 없으면 클릭할 수 있는 직원마다
  const cases = [];
  for (let scene = 1; scene <= 7; scene++) {
    const n = await page.evaluate((s) => {
      sim.scene(s);
      const k = document.querySelectorAll('#choices button').length;
      return k || sim.S.pods.filter((p) => p.state === 'run').length;
    }, scene);
    for (let idx = 0; idx < n; idx++) cases.push({ scene, idx });
  }

  const result = {};
  const fails = [];
  for (const c of cases) {
    const key = `${c.scene}-${c.idx}`;
    const a = await page.evaluate(runCase, { ...c, mode: 'm', replayAt: 0, seed: SEED });
    const b = await page.evaluate(runCase, { ...c, mode: 't', replayAt: 2, seed: SEED });
    result[key] = a;
    const same = (x, y) => JSON.stringify({ ...x, replayed: 0 }) === JSON.stringify({ ...y, replayed: 0 });
    let msg = 'ok';
    if (a.error || b.error) msg = `오류: ${a.error || b.error}`;
    else if (!same(a, b)) msg = '다시보기·용어 모드 결과가 다름';
    if (msg !== 'ok') fails.push(`${key} ${msg}`);
    console.log(`장면 ${c.scene} 갈래 ${c.idx}: ${msg}${b.replayed ? '' : ' (다시보기 안 함 — 단계가 짧음)'}`);
  }

  if (update) {
    fs.writeFileSync(BASE, JSON.stringify(result, null, 1) + '\n');
    console.log(`기준 저장: ${Object.keys(result).length}개`);
  } else if (fs.existsSync(BASE)) {
    const base = JSON.parse(fs.readFileSync(BASE, 'utf8'));
    const keys = new Set([...Object.keys(base), ...Object.keys(result)]);
    keys.forEach((k) => {
      if (JSON.stringify(base[k]) !== JSON.stringify(result[k])) fails.push(`${k} 기준과 다름`);
    });
  } else {
    fails.push('기준 없음 — 먼저 --update');
  }
  errors.forEach((e) => fails.push(`브라우저 오류: ${e}`));
  await browser.close();
  console.log(fails.length ? `\n실패 ${fails.length}건\n- ${fails.join('\n- ')}` : `\n전부 통과 (${cases.length}갈래)`);
  process.exit(fails.length ? 1 : 0);
})();
