/* ステップ3：切る高さを動かして切り口をくらべる */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const slider = $('slH'); if (!slider) return;
  const RU = 5, PX = 20, S = 0.55;            // 半径5、1単位=20px、上から見た図の縮尺
  const L = { cx: 150, base: 150 }, Rr = { cx: 470, base: 150 }, TOPY = 265;
  const fmt = v => (Math.round(v * 100) / 100).toString();

  function update() {
    const h = parseFloat(slider.value);
    const a2 = RU * RU - h * h, a = Math.sqrt(Math.max(0, a2));
    const y = L.base - h * PX, apx = a * PX, hpx = h * PX, Rpx = RU * PX;
    $('slVal').textContent = fmt(h);
    // 横から見た切り口
    $('slLineL').setAttribute('x1', L.cx - apx); $('slLineL').setAttribute('x2', L.cx + apx);
    $('slLineL').setAttribute('y1', y); $('slLineL').setAttribute('y2', y);
    $('slLineR1').setAttribute('x1', Rr.cx - Rpx); $('slLineR1').setAttribute('x2', Rr.cx - hpx);
    $('slLineR1').setAttribute('y1', y); $('slLineR1').setAttribute('y2', y);
    $('slLineR2').setAttribute('x1', Rr.cx + hpx); $('slLineR2').setAttribute('x2', Rr.cx + Rpx);
    $('slLineR2').setAttribute('y1', y); $('slLineR2').setAttribute('y2', y);
    $('slHText').setAttribute('y', y + 4); $('slHText').textContent = `高さ ${fmt(h)}`;
    // 直角三角形
    const tri = $('slTri');
    tri.setAttribute('points', `${L.cx},${L.base} ${L.cx},${y} ${L.cx + apx},${y}`);
    tri.style.opacity = (h > 0 && h < RU) ? 1 : 0;
    $('slTriA').setAttribute('x', L.cx + apx / 2); $('slTriA').setAttribute('y', y + 18); $('slTriA').textContent = fmt(a);
    $('slTriH').setAttribute('y', (L.base + y) / 2 + 5); $('slTriH').textContent = fmt(h);
    $('slTriR').setAttribute('x', L.cx + apx / 2 + 22); $('slTriR').setAttribute('y', (L.base + y) / 2 - 8);
    [$('slTriA'), $('slTriH'), $('slTriR')].forEach(e => e.style.opacity = tri.style.opacity);
    // 上から見た図
    $('slCircle').setAttribute('r', Math.max(0.5, apx * S));
    const Ro = Rpx * S, Ri = Math.max(0.01, hpx * S), cx = Rr.cx, cy = TOPY;
    $('slRing').setAttribute('d',
      `M${cx - Ro},${cy} a${Ro},${Ro} 0 1,0 ${2 * Ro},0 a${Ro},${Ro} 0 1,0 ${-2 * Ro},0 Z ` +
      `M${cx - Ri},${cy} a${Ri},${Ri} 0 1,0 ${2 * Ri},0 a${Ri},${Ri} 0 1,0 ${-2 * Ri},0 Z`);
    // 広さ
    $('slAreaL').textContent = `${fmt(a)}×${fmt(a)}×3.14 ＝ ${fmt(a2)}×3.14`;
    $('slAreaR').textContent = `5×5×3.14 − ${fmt(h)}×${fmt(h)}×3.14 ＝ ${fmt(a2)}×3.14`;
  }
  slider.addEventListener('input', update);
  update();
})();
