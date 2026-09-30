/* 球の体積 ── Canvas アニメーション（動画） */
(() => {
  'use strict';

  const canvas = document.getElementById('stage');
  const ctx = canvas.getContext('2d');
  const W = 800, H = 450;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const FONT = '"Zen Maru Gothic","Hiragino Maru Gothic ProN","Hiragino Sans","Yu Gothic",sans-serif';
  const C = {
    ink: '#2b3a55', muted: '#6b7a99',
    water: '#4fb0ff', waterDark: '#2f8fe0',
    glass: 'rgba(215,236,255,0.55)', outline: '#3b5577',
    orange: '#ff8a3d', pink: '#ff5c8a', green: '#3cbf7c', greenLight: '#7ee0a8',
    purple: '#8e6cf0', yellow: '#ffd24d',
    bgTop: '#fff9ec', bgBot: '#e8f4ff',
  };

  /* ---------- 数学ヘルパー ---------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
  const seg = (p, a, b) => ease((p - a) / (b - a));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- 描画ヘルパー ---------- */
  function setFont(size, weight = 700) { ctx.font = `${weight} ${size}px ${FONT}`; }

  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  // tokens: 文字列 | {s:'文字', color} | {f:[分子, 分母], color}
  function fracWidth(t, size) {
    const fs = size * 0.8;
    setFont(fs);
    return Math.max(ctx.measureText(String(t.f[0])).width, ctx.measureText(String(t.f[1])).width) + size * 0.3;
  }
  function measureTokens(tokens, size) {
    let w = 0;
    for (const t of tokens) {
      if (typeof t === 'string') { setFont(size); w += ctx.measureText(t).width; }
      else if (t.f) { w += fracWidth(t, size); }
      else { setFont(size); w += ctx.measureText(t.s).width; }
    }
    return w;
  }
  function line(tokens, x, y, { size = 24, align = 'center', color = C.ink, alpha = 1, bg = null, border = null } = {}) {
    if (typeof tokens === 'string') tokens = [tokens];
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.textBaseline = 'middle';
    const w = measureTokens(tokens, size);
    const hasFrac = tokens.some(t => t.f);
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    if (bg || border) {
      const ph = hasFrac ? size * 1.1 : size * 0.8;
      roundRect(cx - 16, y - ph, w + 32, ph * 2, 14);
      if (bg) { ctx.fillStyle = bg; ctx.fill(); }
      if (border) { ctx.lineWidth = 4; ctx.strokeStyle = border; ctx.stroke(); }
    }
    ctx.textAlign = 'left';
    for (const t of tokens) {
      if (typeof t === 'string') {
        setFont(size); ctx.fillStyle = color; ctx.fillText(t, cx, y); cx += ctx.measureText(t).width;
      } else if (t.f) {
        const fs = size * 0.8, fw = fracWidth(t, size), col = t.color || color;
        setFont(fs); ctx.fillStyle = col; ctx.textAlign = 'center';
        ctx.fillText(String(t.f[0]), cx + fw / 2, y - fs * 0.58);
        ctx.fillText(String(t.f[1]), cx + fw / 2, y + fs * 0.62);
        ctx.beginPath(); ctx.moveTo(cx + size * 0.08, y); ctx.lineTo(cx + fw - size * 0.08, y);
        ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
        ctx.textAlign = 'left'; cx += fw;
      } else {
        setFont(size); ctx.fillStyle = t.color || color; ctx.fillText(t.s, cx, y); cx += ctx.measureText(t.s).width;
      }
    }
    ctx.restore();
  }

  function background() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, C.bgTop); g.addColorStop(1, C.bgBot);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  function sceneTitle(s) { line(s, 26, 36, { size: 19, align: 'left', color: '#fff', bg: C.ink }); }

  function drawSphere(cx, cy, r, level = 0, { fill = null } = {}) {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (fill) {
      const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
      g.addColorStop(0, '#ffd0a8'); g.addColorStop(1, fill);
      ctx.fillStyle = g;
    } else ctx.fillStyle = C.glass;
    ctx.fill();
    if (level > 0) {
      ctx.save(); ctx.clip();
      const top = cy + r - level * 2 * r;
      ctx.fillStyle = C.water; ctx.fillRect(cx - r, top, 2 * r, 2 * r + 2);
      const half = Math.sqrt(Math.max(0, r * r - (top - cy) * (top - cy)));
      if (half > 1) {
        ctx.beginPath(); ctx.ellipse(cx, top, half, half * 0.22, 0, 0, Math.PI * 2);
        ctx.fillStyle = C.waterDark; ctx.fill();
      }
      ctx.restore();
    }
    ctx.beginPath(); ctx.ellipse(cx - r * 0.42, cy - r * 0.45, r * 0.16, r * 0.28, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = 4; ctx.strokeStyle = C.outline; ctx.stroke();
    ctx.restore();
  }

  // layers: [{from, to, color}] 体積の割合（0〜1）で指定
  function drawCylinder(cx, top, r, h, level = 0, { layers = null, marks = [], baseHighlight = 0 } = {}) {
    const ry = r * 0.28, bottom = top + h;
    ctx.save();
    // 本体（ガラス）
    ctx.beginPath(); ctx.moveTo(cx - r, top); ctx.lineTo(cx - r, bottom);
    ctx.ellipse(cx, bottom, r, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + r, top); ctx.closePath();
    ctx.fillStyle = C.glass; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, top, r, ry, 0, 0, Math.PI * 2); ctx.fillStyle = C.glass; ctx.fill();
    // 水
    const ls = layers || (level > 0 ? [{ from: 0, to: level, color: C.water }] : []);
    for (const L of ls) {
      if (L.to <= L.from) continue;
      const y1 = bottom - L.to * h, y0 = bottom - L.from * h;
      ctx.beginPath(); ctx.moveTo(cx - r, y1); ctx.lineTo(cx - r, y0);
      ctx.ellipse(cx, y0, r, ry, 0, Math.PI, 0, true); ctx.lineTo(cx + r, y1); ctx.closePath();
      ctx.fillStyle = L.color; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, y1, r, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = shade(L.color); ctx.fill();
    }
    // 底面ハイライト
    if (baseHighlight > 0) {
      ctx.save(); ctx.globalAlpha *= baseHighlight;
      ctx.beginPath(); ctx.ellipse(cx, bottom, r, ry, 0, 0, Math.PI * 2);
      ctx.fillStyle = C.pink; ctx.fill(); ctx.restore();
    }
    // 輪郭
    ctx.lineWidth = 4; ctx.strokeStyle = C.outline;
    ctx.beginPath(); ctx.moveTo(cx - r, top); ctx.lineTo(cx - r, bottom); ctx.moveTo(cx + r, top); ctx.lineTo(cx + r, bottom); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, bottom, r, ry, 0, 0, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, top, r, ry, 0, 0, Math.PI * 2); ctx.stroke();
    // 目もり
    for (const m of marks) {
      const y = bottom - m.f * h;
      ctx.save(); ctx.globalAlpha *= (m.alpha ?? 1);
      ctx.setLineDash([8, 6]); ctx.lineWidth = 3; ctx.strokeStyle = C.orange;
      ctx.beginPath(); ctx.moveTo(cx - r, y); ctx.lineTo(cx + r, y); ctx.stroke();
      ctx.restore();
      line(m.l, cx + r + 14, y, { size: 18, align: 'left', color: C.orange, alpha: m.alpha ?? 1, bg: 'rgba(255,255,255,0.9)' });
    }
    ctx.restore();
  }
  function shade(color) {
    if (color === C.water) return C.waterDark;
    if (color === C.greenLight) return '#4fcf8a';
    return color;
  }

  // 逆さ円すい（入れ物）。hf = 水の高さの割合
  function drawCone(cx, rimY, r, h, hf = 0) {
    const ry = r * 0.28, apexY = rimY + h;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(cx - r, rimY); ctx.lineTo(cx, apexY); ctx.lineTo(cx + r, rimY);
    ctx.ellipse(cx, rimY, r, ry, 0, 0, Math.PI, false); ctx.closePath();
    ctx.fillStyle = C.glass; ctx.fill();
    if (hf > 0) {
      const wy = apexY - hf * h, wr = r * hf;
      ctx.beginPath(); ctx.moveTo(cx - wr, wy); ctx.lineTo(cx, apexY); ctx.lineTo(cx + wr, wy);
      ctx.ellipse(cx, wy, wr, wr * 0.28, 0, 0, Math.PI, false); ctx.closePath();
      ctx.fillStyle = C.greenLight; ctx.fill();
      ctx.beginPath(); ctx.ellipse(cx, wy, wr, wr * 0.28, 0, 0, Math.PI * 2); ctx.fillStyle = '#4fcf8a'; ctx.fill();
    }
    ctx.lineWidth = 4; ctx.strokeStyle = C.outline;
    ctx.beginPath(); ctx.moveTo(cx - r, rimY); ctx.lineTo(cx, apexY); ctx.lineTo(cx + r, rimY); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx, rimY, r, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  function stream(x1, y1, x2, y2, color = C.water) {
    ctx.save();
    ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.bezierCurveTo(x1, y1 + 60, x2, y2 - 110, x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function dim(x1, y1, x2, y2, label, { color = C.pink, alpha = 1, off = 0, size = 18 } = {}) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L * 8, ny = dx / L * 8;
    ctx.beginPath();
    ctx.moveTo(x1 + nx, y1 + ny); ctx.lineTo(x1 - nx, y1 - ny);
    ctx.moveTo(x2 + nx, y2 + ny); ctx.lineTo(x2 - nx, y2 - ny);
    ctx.stroke();
    ctx.restore();
    if (label) {
      const vertical = Math.abs(dx) < 1;
      line(label, (x1 + x2) / 2 + (vertical ? off : 0), (y1 + y2) / 2 + (vertical ? 0 : off),
        { size, color, alpha, align: vertical ? 'left' : 'center', bg: 'rgba(255,255,255,0.9)' });
    }
  }

  function formulaBox(x, y, alpha, scale = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.globalAlpha *= alpha;
    roundRect(-370, -46, 740, 92, 22);
    ctx.fillStyle = '#fff'; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = C.purple; ctx.stroke();
    line(['球の体積 = ', { s: '半径×半径×半径', color: C.purple }, ' × 3.14 × ', { f: [4, 3], color: C.orange }], 0, 0, { size: 28 });
    ctx.restore();
  }

  /* ---------- 共通レイアウト ---------- */
  const R = 80;
  const CYL = { cx: 560, top: 260, r: R, h: 2 * R };
  const MARKS = [{ f: 1 / 3, l: '3分の1' }, { f: 2 / 3, l: '3分の2' }, { f: 1, l: 'いっぱい' }];

  /* ---------- シーン ---------- */
  const scenes = [
    {
      title: 'はじまり', dur: 3.5,
      caption: '「<ruby>球<rt>きゅう</rt></ruby>の<ruby>体積<rt>たいせき</rt></ruby>のひみつ」を いっしょに見ていこう！',
      narration: 'きゅうの たいせきの ひみつを、いっしょに 見ていこう！',
      draw(p, t) {
        background();
        const cy = 320 - Math.abs(Math.sin(t * 3)) * 70;
        ctx.save(); ctx.globalAlpha = 0.25; ctx.beginPath();
        ctx.ellipse(400, 395, 70 * (1 - (320 - cy) / 300), 12, 0, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore();
        drawSphere(400, cy, 70, 0, { fill: C.orange });
        line('球の体積の ひみつ', 400, 100, { size: 48, alpha: seg(p, 0, 0.3) });
        line('ボールの中には どれくらい 入る？', 400, 160, { size: 24, color: C.muted, alpha: seg(p, 0.2, 0.5) });
      },
    },
    {
      title: '体積ってなに？', dur: 7,
      caption: 'ボールの中に入る水の量が「体積」。球の体積は、どうやって<ruby>求<rt>もと</rt></ruby>めるのかな？',
      narration: 'ボールの中に 入る 水の量が、たいせき。きゅうの たいせきは、どうやって もとめるのかな？',
      draw(p, t) {
        background(); sceneTitle('体積って なに？');
        const lv = seg(p, 0.2, 0.8);
        line('ボールの 中に 水は どれだけ 入るかな？', 400, 95, { size: 28 });
        // 水のしずく
        if (p > 0.15 && p < 0.8) {
          ctx.save(); ctx.fillStyle = C.water;
          for (let i = 0; i < 3; i++) {
            const y = 130 + ((t * 260 + i * 45) % 130);
            ctx.beginPath(); ctx.ellipse(400 + (i - 1) * 6, y, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
        drawSphere(400, 265, 100, lv);
        line('この 水の量を「体積」と いうよ', 400, 415, { size: 26, color: C.waterDark, alpha: seg(p, 0.82, 0.95), bg: '#fff' });
      },
    },
    {
      title: 'ぴったりの入れ物', dur: 8,
      caption: '球がぴったり入る<ruby>円柱<rt>えんちゅう</rt></ruby>を用意するよ。はばも高さも「<ruby>半径<rt>はんけい</rt></ruby>×2」になっているね。',
      narration: 'きゅうが ぴったり入る えんちゅうを 用意するよ。はばも 高さも、はんけい かける 2 に なっているね。',
      draw(p) {
        background(); sceneTitle('ぴったりの 入れ物');
        const cyl = { cx: 540, top: 200, r: R, h: 2 * R };
        ctx.save(); ctx.globalAlpha = seg(p, 0, 0.25);
        drawCylinder(cyl.cx, cyl.top, cyl.r, cyl.h, 0); ctx.restore();
        const m = seg(p, 0.35, 0.65);
        const sx = lerp(220, cyl.cx, m), sy = cyl.top + R;
        drawSphere(sx, sy, R, 0, { fill: 'rgba(255,138,61,0.7)' });
        line('ボールが ぴったり 入る 円柱を 用意するよ', 400, 95, { size: 26 });
        const d = seg(p, 0.7, 0.9);
        if (d > 0) {
          dim(cyl.cx - R, cyl.top - 45, cyl.cx + R, cyl.top - 45, 'はば = 半径×2', { alpha: d, off: -28 });
          dim(cyl.cx + R + 36, cyl.top, cyl.cx + R + 36, cyl.top + 2 * R, '高さ = 半径×2', { alpha: d, off: 14, color: C.green });
          ctx.save(); ctx.globalAlpha = d; ctx.strokeStyle = C.purple; ctx.lineWidth = 5; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + R, sy); ctx.stroke();
          ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fillStyle = C.purple; ctx.fill(); ctx.restore();
          line('半径', sx + R / 2, sy - 22, { size: 18, color: C.purple, alpha: d, bg: 'rgba(255,255,255,0.9)' });
        }
      },
    },
    {
      title: '水の実験', dur: 10,
      caption: '球いっぱいの水を円柱にうつすと、ちょうど円柱の「3分の2」まで入るんだ！これが いちばん大事な発見。',
      narration: 'きゅう いっぱいの 水を えんちゅうに うつすと、ちょうど えんちゅうの 三分の二まで 入るんだ！これが いちばん 大事な はっけん。',
      draw(p) {
        background(); sceneTitle('実験！ 水を うつしてみよう');
        const q = seg(p, 0.15, 0.65);
        const ma = seg(p, 0.68, 0.82);
        const marks = ma > 0 ? MARKS.map(m => ({ ...m, alpha: ma })) : [];
        drawCylinder(CYL.cx, CYL.top, CYL.r, CYL.h, q * 2 / 3, { marks });
        if (q > 0 && q < 1) stream(230, 150 + R, CYL.cx, CYL.top);
        drawSphere(230, 150, R, 1 - q);
        line('ボールの 水を 円柱に うつすと…', 560, 120, { size: 22 });
        line('ちょうど 3分の2 まで！', 230, 320, { size: 30, color: C.orange, alpha: seg(p, 0.75, 0.9), bg: '#fff', border: C.orange });
      },
    },
    {
      title: '円柱の体積', dur: 10,
      caption: '円柱の体積は「<span class="pink">底面積</span>×<span class="green">高さ</span>」。底面積は「半径×半径×3.14」、高さは「半径×2」だから、円柱の体積 ＝ 半径×半径×半径×3.14×2 になるよ。',
      narration: 'えんちゅうの たいせきは、ていめんせき かける 高さ。ていめんせきは はんけい かける はんけい かける 3.14、高さは はんけい かける 2 だから、えんちゅうの たいせきは、はんけい かける はんけい かける はんけい かける 3.14 かける 2 に なるよ。',
      draw(p) {
        background(); sceneTitle('円柱の 体積は？');
        const c = { cx: 125, top: 130, r: 65, h: 130 };
        drawCylinder(c.cx, c.top, c.r, c.h, 0, { baseHighlight: 0.7 * seg(p, 0.22, 0.35) });
        line('底面', c.cx, c.top + c.h + 40, { size: 16, color: C.pink, alpha: seg(p, 0.22, 0.35) });
        dim(c.cx + c.r + 30, c.top, c.cx + c.r + 30, c.top + c.h, '高さ', { color: C.green, off: 10, alpha: seg(p, 0.42, 0.55), size: 16 });
        const X = 250;
        line(['円柱の体積 = ', { s: '底面積', color: C.pink }, ' × ', { s: '高さ', color: C.green }], X, 110, { size: 28, align: 'left', alpha: seg(p, 0.03, 0.18) });
        line([{ s: '底面積', color: C.pink }, ' = 半径 × 半径 × 3.14'], X + 30, 180, { size: 24, align: 'left', alpha: seg(p, 0.22, 0.35) });
        line([{ s: '高さ', color: C.green }, ' = 半径 × 2'], X + 30, 240, { size: 24, align: 'left', alpha: seg(p, 0.42, 0.55) });
        line(['円柱の体積 = ', { s: '半径×半径×3.14', color: C.pink }, ' × ', { s: '半径×2', color: C.green }], X, 320, { size: 24, align: 'left', alpha: seg(p, 0.62, 0.75) });
        line('= 半径×半径×半径 × 3.14 × 2', X + 40, 395, { size: 26, align: 'left', alpha: seg(p, 0.8, 0.93), bg: '#fff' });
      },
    },
    {
      title: '球の体積', dur: 11,
      caption: '球の体積はその3分の2。「×2×2/3」は「×4/3」と同じだから、<b>球の体積 ＝ 半径×半径×半径×3.14×4/3</b>！',
      narration: 'きゅうの たいせきは、その 三分の二。かける 2 かける 三分の二 は、かける 三分の四 と 同じだから、きゅうの たいせきは、はんけい かける はんけい かける はんけい かける 3.14 かける 三分の四！',
      draw(p) {
        background(); sceneTitle('球の 体積は？');
        line(['球の体積 = 円柱の体積 × ', { f: [2, 3], color: C.orange }], 400, 105, { size: 30, alpha: seg(p, 0.02, 0.15) });
        line(['= 半径×半径×半径 × 3.14 × ', { s: '2', color: C.pink }, ' × ', { f: [2, 3], color: C.orange }], 400, 185, { size: 26, alpha: seg(p, 0.2, 0.33) });
        line([{ s: '2', color: C.pink }, ' × ', { f: [2, 3], color: C.orange }, ' = ', { f: [4, 3], color: C.purple }, '  だから…'], 400, 262, { size: 26, alpha: seg(p, 0.4, 0.53) });
        const s = seg(p, 0.6, 0.75);
        formulaBox(400, 365, s, 0.8 + 0.2 * s);
      },
    },
    {
      title: 'おまけ：円すい', dur: 9,
      caption: 'おまけ。同じ大きさの円すいの水を入れると、のこりの3分の1がぴったりうまるよ。<b>円すい：球：円柱 ＝ 1：2：3</b>！',
      narration: 'おまけ。同じ 大きさの えんすいの 水を 入れると、のこりの 三分の一が ぴったり うまるよ。えんすい たい きゅう たい えんちゅう は、いち たい に たい さん！',
      draw(p) {
        background(); sceneTitle('おまけ： 円すいも 入れてみよう');
        const q = seg(p, 0.15, 0.6);
        drawCylinder(CYL.cx, CYL.top, CYL.r, CYL.h, 0, {
          marks: MARKS,
          layers: [{ from: 0, to: 2 / 3, color: C.water }, { from: 2 / 3, to: 2 / 3 + q / 3, color: C.greenLight }],
        });
        if (q > 0 && q < 1) stream(230, 240, CYL.cx, CYL.top, C.greenLight);
        drawCone(230, 80, R, 2 * R, Math.cbrt(1 - q));
        line('円すいの 水は のこりの', 230, 290, { size: 22, alpha: seg(p, 0.62, 0.75) });
        line('3分の1 に ぴったり！', 230, 330, { size: 26, color: '#2f9f5a', alpha: seg(p, 0.62, 0.75) });
        line('円すい : 球 : 円柱 = 1 : 2 : 3', 230, 405, { size: 24, alpha: seg(p, 0.78, 0.92), bg: '#fff', border: C.green });
      },
    },
    {
      title: 'まとめ', dur: 9,
      caption: 'まとめ。球の体積は「ぴったり入る円柱の3分の2」。今から2200年以上前に<b>アルキメデス</b>が見つけたひみつだよ。',
      narration: 'まとめ。きゅうの たいせきは、ぴったり 入る えんちゅうの 三分の二。今から 2200年 以上前に、アルキメデスが 見つけた ひみつだよ。',
      draw(p) {
        background(); sceneTitle('まとめ');
        ctx.save(); ctx.globalAlpha = seg(p, 0, 0.2);
        drawCylinder(120, 110, 60, 120, 0);
        drawSphere(120, 170, 60, 0, { fill: 'rgba(255,138,61,0.75)' });
        ctx.restore();
        line('球は、ぴったり 入る 円柱の', 470, 100, { size: 26, alpha: seg(p, 0.05, 0.2) });
        line([{ f: [2, 3], color: C.orange }, ' の 体積'], 470, 160, { size: 28, alpha: seg(p, 0.12, 0.27) });
        formulaBox(400, 270, seg(p, 0.3, 0.45));
        line('2200年以上前に アルキメデスが 見つけた ひみつだよ', 400, 350, { size: 21, color: C.muted, alpha: seg(p, 0.55, 0.68) });
        line('アルキメデスは この発見が 大のお気に入りで、', 400, 392, { size: 19, color: C.muted, alpha: seg(p, 0.7, 0.83) });
        line('お墓に「球と円柱」の 絵を きざんでもらったんだって！', 400, 422, { size: 19, color: C.muted, alpha: seg(p, 0.7, 0.83) });
      },
    },
  ];

  /* ---------- プレイヤー ---------- */
  const total = scenes.reduce((a, s) => a + s.dur, 0);
  const starts = scenes.reduce((arr, s, i) => { arr.push(i ? arr[i - 1] + scenes[i - 1].dur : 0); return arr; }, []);

  const $ = id => document.getElementById(id);
  const bigPlay = $('bigPlay'), btnPlay = $('btnPlay'), btnPrev = $('btnPrev'), btnNext = $('btnNext'),
    btnRestart = $('btnRestart'), chkVoice = $('chkVoice'), seek = $('seek'), timeEl = $('time'),
    captionEl = $('caption'), chaptersEl = $('chapters');

  let cur = 0, playing = false, lastTs = null, lastScene = -1, ended = false;

  seek.max = total.toFixed(1);

  scenes.forEach((s, i) => {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.textContent = `${i + 1}. ${s.title}`;
    b.addEventListener('click', () => { cur = starts[i]; ended = false; lastScene = -1; render(); if (!playing) speakScene(i, true); });
    li.appendChild(b); chaptersEl.appendChild(li);
  });

  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

  function sceneAt(time) {
    for (let i = scenes.length - 1; i >= 0; i--) if (time >= starts[i]) return { i, local: time - starts[i] };
    return { i: 0, local: 0 };
  }

  function render() {
    const { i, local } = sceneAt(clamp(cur, 0, total));
    const s = scenes[i];
    s.draw(clamp(local / s.dur, 0, 1), local);
    if (i !== lastScene) {
      lastScene = i;
      captionEl.innerHTML = s.caption;
      chaptersEl.querySelectorAll('button').forEach((b, k) => b.classList.toggle('active', k === i));
      if (playing) speakScene(i);
    }
    seek.value = cur;
    timeEl.textContent = `${fmt(cur)} / ${fmt(total)}`;
  }

  function tick(ts) {
    if (!playing) return;
    if (lastTs != null) cur += (ts - lastTs) / 1000;
    lastTs = ts;
    if (cur >= total) { cur = total; render(); stop(true); return; }
    render();
    requestAnimationFrame(tick);
  }

  function play() {
    if (ended || cur >= total) { cur = 0; lastScene = -1; ended = false; }
    playing = true; lastTs = null;
    bigPlay.classList.add('hidden');
    btnPlay.textContent = '❚❚ 一時停止';
    render();
    requestAnimationFrame(tick);
  }
  function stop(isEnd = false) {
    playing = false; lastTs = null;
    ended = isEnd;
    btnPlay.textContent = '▶ 再生';
    bigPlay.classList.remove('hidden');
    bigPlay.querySelector('small').textContent = isEnd ? 'もういちど' : 'さいせい';
    if (window.speechSynthesis) speechSynthesis.cancel();
  }

  bigPlay.addEventListener('click', play);
  btnPlay.addEventListener('click', () => (playing ? stop() : play()));
  btnRestart.addEventListener('click', () => { cur = 0; lastScene = -1; ended = false; play(); });
  btnPrev.addEventListener('click', () => {
    const { i, local } = sceneAt(cur);
    cur = starts[local > 1.5 ? i : Math.max(0, i - 1)]; lastScene = -1; ended = false; render();
  });
  btnNext.addEventListener('click', () => {
    const { i } = sceneAt(cur);
    if (i < scenes.length - 1) { cur = starts[i + 1]; lastScene = -1; ended = false; render(); }
  });
  seek.addEventListener('input', () => { cur = parseFloat(seek.value); ended = false; render(); });

  /* ---------- よみあげ ---------- */
  function speakScene(i, force = false) {
    if (!window.speechSynthesis || !chkVoice.checked) return;
    if (!force && !playing) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(scenes[i].narration);
    u.lang = 'ja-JP'; u.rate = 0.95;
    const v = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('ja'));
    if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  chkVoice.addEventListener('change', () => { if (!chkVoice.checked && window.speechSynthesis) speechSynthesis.cancel(); });

  /* ---------- 初期描画 ---------- */
  render();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);
})();
