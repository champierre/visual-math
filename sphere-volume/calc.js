/* 球の体積 計算機 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const input = $('radius'), stepsEl = $('calcSteps'), resultEl = $('calcResult'), presetsEl = $('presets');
  const ball = $('previewBall'), previewR = $('previewR'), previewText = $('previewText');

  const presets = [
    { n: '🏓 ピンポン玉', r: 2 },
    { n: '⛳ ゴルフボール', r: 2.1 },
    { n: '🎾 テニスボール', r: 3.3 },
    { n: '⚾ 野球のボール', r: 3.6 },
    { n: '⚽ サッカーボール', r: 11 },
    { n: '🏀 バスケットボール', r: 12 },
  ];
  presets.forEach(p => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = `${p.n}（半径 ${p.r}cm）`;
    b.addEventListener('click', () => { input.value = p.r; update(); });
    presetsEl.appendChild(b);
  });

  const fmt = v => {
    const s = (Math.round(v * 100) / 100).toLocaleString('ja-JP', { maximumFractionDigits: 2 });
    return s;
  };

  function update() {
    let r = parseFloat(input.value);
    if (!isFinite(r) || r <= 0) { stepsEl.innerHTML = ''; resultEl.innerHTML = '<p class="ans">半径を入れてね</p>'; return; }
    r = Math.round(r * 100) / 100;
    const r3 = r * r * r;
    const a = r3 * 3.14;
    const b = a * 4;
    const v = b / 3;

    stepsEl.innerHTML = `
      <li>半径×半径×半径 ＝ ${fmt(r)} × ${fmt(r)} × ${fmt(r)} ＝ <span class="v">${fmt(r3)}</span></li>
      <li>× 3.14 ＝ ${fmt(r3)} × 3.14 ＝ <span class="v">${fmt(a)}</span></li>
      <li>× 4 ＝ ${fmt(a)} × 4 ＝ <span class="v">${fmt(b)}</span></li>
      <li>÷ 3 ＝ ${fmt(b)} ÷ 3 ＝ <span class="v">${fmt(v)}</span> <span class="k">（×4÷3 ＝ 4/3 倍 するということ）</span></li>`;

    let cmp;
    if (v >= 1000) cmp = `1L の牛乳パック（1000cm³）約 <b>${fmt(v / 1000)}</b> 本分！`;
    else cmp = `コップ1ぱい（200cm³）の 約 <b>${fmt(v / 200)}</b> ぱい分！`;
    resultEl.innerHTML = `<p class="ans">半径 ${fmt(r)}cm の球の体積 ＝ 約 ${fmt(v)} cm³</p><p class="cmp">${cmp}</p>`;

    const px = Math.max(8, Math.min(112, r * 8));
    ball.setAttribute('r', px);
    previewR.setAttribute('x2', 130 + px);
    previewText.textContent = `半径 ${fmt(r)} cm`;
  }

  input.addEventListener('input', update);
  update();
})();
