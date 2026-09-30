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

  /* ---------- 断面図ヘルパー ---------- */
  // 半球（横から見た図）。h: 切り口の高さ(px)
  function hemiSide(cx, baseY, R, { h = null, alpha = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(cx, baseY, R, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = 'rgba(255,138,61,0.55)'; ctx.fill();
    ctx.lineWidth = 4; ctx.strokeStyle = C.outline; ctx.stroke();
    if (h != null) {
      const a = Math.sqrt(Math.max(0, R * R - h * h)), y = baseY - h;
      ctx.strokeStyle = C.pink; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - a, y); ctx.lineTo(cx + a, y); ctx.stroke();
    }
    ctx.restore();
  }
  // 円柱から円すいをくりぬいた形（横から見た図）
  function carvedSide(cx, baseY, R, { h = null, alpha = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.rect(cx - R, baseY - R, 2 * R, R);
    ctx.moveTo(cx - R, baseY - R); ctx.lineTo(cx, baseY); ctx.lineTo(cx + R, baseY - R); ctx.closePath();
    ctx.fillStyle = 'rgba(79,176,255,0.6)'; ctx.fill('evenodd');
    ctx.lineWidth = 4; ctx.strokeStyle = C.outline;
    ctx.beginPath(); ctx.rect(cx - R, baseY - R, 2 * R, R); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - R, baseY - R); ctx.lineTo(cx, baseY); ctx.lineTo(cx + R, baseY - R); ctx.stroke();
    if (h != null) {
      const y = baseY - h;
      ctx.strokeStyle = C.pink; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - R, y); ctx.lineTo(cx - h, y); ctx.moveTo(cx + h, y); ctx.lineTo(cx + R, y); ctx.stroke();
    }
    ctx.restore();
  }
  function topCircle(cx, cy, a, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(a, 0.5), 0, Math.PI * 2);
    ctx.fillStyle = C.pink; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.outline; ctx.stroke();
    ctx.restore();
  }
  function topRing(cx, cy, R, h, alpha = 1) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.moveTo(cx + h, cy); ctx.arc(cx, cy, Math.max(h, 0.01), 0, Math.PI * 2, true);
    ctx.fillStyle = C.pink; ctx.fill('evenodd');
    ctx.lineWidth = 3; ctx.strokeStyle = C.outline;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    if (h > 0.5) { ctx.beginPath(); ctx.arc(cx, cy, h, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
  // 直角三角形（半球の中）
  function rightTriangle(cx, baseY, R, h, alpha, labels) {
    if (alpha <= 0) return;
    const a = Math.sqrt(Math.max(0, R * R - h * h)), y = baseY - h;
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.moveTo(cx, baseY); ctx.lineTo(cx, y); ctx.lineTo(cx + a, y); ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = C.purple; ctx.stroke();
    ctx.restore();
    if (labels) {
      line(labels[0], cx + a / 2 + 12, y + 18 + (labels[3] || 0), { size: 17, color: C.purple, alpha, bg: 'rgba(255,255,255,0.9)' });
      line(labels[1], cx - 26, (baseY + y) / 2, { size: 17, color: C.green, alpha, bg: 'rgba(255,255,255,0.9)' });
      line(labels[2], cx + a / 2 + 26, (baseY + y) / 2 - 8, { size: 17, color: C.orange, alpha, bg: 'rgba(255,255,255,0.9)' });
    }
  }
  // 立方体を3つのピラミッドに分ける図
  function cubePyramids(x0, y0, s, dx, dy, fills) {
    const FTL = [x0, y0], FTR = [x0 + s, y0], FBR = [x0 + s, y0 + s], FBL = [x0, y0 + s];
    const BTL = [x0 + dx, y0 + dy], APEX = [x0 + s + dx, y0 + dy], BBR = [x0 + s + dx, y0 + s + dy];
    const poly = (pts, color, a) => {
      ctx.save(); ctx.globalAlpha *= a;
      ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.restore();
    };
    const base = 'rgba(215,236,255,0.6)';
    poly([FTL, FTR, FBR, FBL], base, 1); poly([FTL, BTL, APEX, FTR], base, 1); poly([FTR, APEX, BBR, FBR], base, 1);
    // A: 前の面が底 / B: 左の面が底 / C: 下の面が底
    poly([FTL, FTR, FBR, FBL], C.orange, fills[0] * 0.75);
    poly([FTL, FTR, APEX], C.orange, fills[0] * 0.75);
    poly([FTR, FBR, APEX], C.orange, fills[0] * 0.75);
    poly([FTL, BTL, APEX], C.green, fills[1] * 0.75);
    poly([FBR, BBR, APEX], C.purple, fills[2] * 0.75);
    ctx.save(); ctx.lineWidth = 3; ctx.strokeStyle = C.outline; ctx.lineJoin = 'round';
    const seg2 = (p1, p2, a = 1) => { ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); ctx.restore(); };
    [[FTL, FTR], [FTR, FBR], [FBR, FBL], [FBL, FTL], [FTL, BTL], [BTL, APEX], [APEX, FTR], [APEX, BBR], [BBR, FBR]].forEach(e => seg2(e[0], e[1]));
    seg2(FTL, APEX, Math.max(fills[0], fills[1])); seg2(FBR, APEX, Math.max(fills[0], fills[2]));
    ctx.restore();
  }
  function uprightCone(cx, top, r, h, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha;
    const ry = r * 0.28, bottom = top + h;
    ctx.beginPath(); ctx.moveTo(cx, top); ctx.lineTo(cx - r, bottom); ctx.ellipse(cx, bottom, r, ry, 0, Math.PI, 0, true); ctx.closePath();
    ctx.fillStyle = 'rgba(126,224,168,0.8)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = C.outline; ctx.stroke();
    ctx.restore();
  }
  function star() { return { s: '★', color: C.purple }; }

  /* ---------- 共通レイアウト ---------- */
  const R = 100;                 // 半径 5 を 100px で描く（1 = 20px）
  const U = 20;
  const HEMI = { cx: 200, baseY: 240 };
  const CARV = { cx: 600, baseY: 240 };
  const TOPY = 322, TS = 0.5;    // 上から見た図の位置と縮尺

  function compareFigures(h, { tops = 1, labels = 1 } = {}) {
    line('半球（球の半分）', HEMI.cx, 100, { size: 18, alpha: labels, color: C.muted });
    line('円柱 から 円すい を くりぬいた形', CARV.cx, 100, { size: 18, alpha: labels, color: C.muted });
    hemiSide(HEMI.cx, HEMI.baseY, R, { h });
    carvedSide(CARV.cx, CARV.baseY, R, { h });
    if (tops > 0 && h != null) {
      const a = Math.sqrt(Math.max(0, R * R - h * h));
      topCircle(HEMI.cx, TOPY, a * TS, tops);
      topRing(CARV.cx, TOPY, R * TS, h * TS, tops);
      line('切り口を 上から見ると', 400, TOPY - 30, { size: 15, color: C.muted, alpha: tops });
      ctx.save(); ctx.globalAlpha *= tops; ctx.setLineDash([6, 6]); ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(HEMI.cx, HEMI.baseY - h + 6); ctx.lineTo(HEMI.cx, TOPY - R * TS - 6);
      ctx.moveTo(CARV.cx, CARV.baseY - h + 6); ctx.lineTo(CARV.cx, TOPY - R * TS - 6); ctx.stroke(); ctx.restore();
    }
  }

  /* ---------- シーン ---------- */
  const scenes = [
    {
      title: 'はじまり', dur: 3.5,
      caption: '「<ruby>球<rt>きゅう</rt></ruby>の<ruby>体積<rt>たいせき</rt></ruby>のひみつ」を、理由もいっしょに見ていこう！',
      narration: 'きゅうの たいせきの ひみつを、理由も いっしょに 見ていこう！',
      draw(p, t) {
        background();
        const cy = 320 - Math.abs(Math.sin(t * 3)) * 70;
        ctx.save(); ctx.globalAlpha = 0.25; ctx.beginPath();
        ctx.ellipse(400, 395, 70 * (1 - (320 - cy) / 300), 12, 0, 0, Math.PI * 2); ctx.fillStyle = C.ink; ctx.fill(); ctx.restore();
        drawSphere(400, cy, 70, 0, { fill: C.orange });
        line('球の体積の ひみつ', 400, 100, { size: 48, alpha: seg(p, 0, 0.3) });
        line('なぜ その公式に なるのか、理由まで わかる！', 400, 160, { size: 24, color: C.muted, alpha: seg(p, 0.2, 0.5) });
      },
    },
    {
      title: '今日のゴール', dur: 7,
      caption: 'ボールの中に入る水の量が「体積」。今日は球の体積を「なぜそうなるか」までわかるように<ruby>求<rt>もと</rt></ruby>めるよ。',
      narration: 'ボールの中に 入る 水の量が、たいせき。今日は きゅうの たいせきを、なぜ そうなるかまで わかるように もとめるよ。',
      draw(p, t) {
        background(); sceneTitle('今日の ゴール');
        const lv = seg(p, 0.15, 0.6);
        line('ボールの 中に 入る 水の量 ＝「体積」', 400, 95, { size: 27 });
        if (p > 0.1 && p < 0.6) {
          ctx.save(); ctx.fillStyle = C.water;
          for (let i = 0; i < 3; i++) {
            const y = 130 + ((t * 260 + i * 45) % 120);
            ctx.beginPath(); ctx.ellipse(400 + (i - 1) * 6, y, 5, 8, 0, 0, Math.PI * 2); ctx.fill();
          }
          ctx.restore();
        }
        drawSphere(400, 255, 95, lv);
        const d = seg(p, 0.62, 0.75);
        ctx.save(); ctx.globalAlpha = d; ctx.strokeStyle = C.purple; ctx.lineWidth = 5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(400, 255); ctx.lineTo(495, 255); ctx.stroke();
        ctx.beginPath(); ctx.arc(400, 255, 6, 0, 7); ctx.fillStyle = C.purple; ctx.fill(); ctx.restore();
        line('半径', 447, 233, { size: 18, color: C.purple, alpha: d, bg: 'rgba(255,255,255,0.9)' });
        line('半径から 体積を 計算する 方法を、理由つきで 見つけよう', 400, 410, { size: 23, color: C.waterDark, alpha: seg(p, 0.75, 0.9), bg: '#fff' });
      },
    },
    {
      title: '道具1：円柱', dur: 7,
      caption: '使う道具その1。<ruby>円柱<rt>えんちゅう</rt></ruby>の体積は「底面積×高さ」＝「半径×半径×3.14×高さ」。',
      narration: '使う道具、その1。えんちゅうの たいせきは、ていめんせき かける 高さ。つまり、はんけい かける はんけい かける 3.14 かける 高さ。',
      draw(p) {
        background(); sceneTitle('道具1： 円柱の 体積');
        const c = { cx: 170, top: 150, r: 90, h: 150 };
        drawCylinder(c.cx, c.top, c.r, c.h, 0, { baseHighlight: 0.7 * seg(p, 0.3, 0.45) });
        line('底面', c.cx, c.top + c.h + 45, { size: 16, color: C.pink, alpha: seg(p, 0.3, 0.45) });
        dim(c.cx + c.r + 30, c.top, c.cx + c.r + 30, c.top + c.h, '高さ', { color: C.green, off: 10, alpha: seg(p, 0.5, 0.65), size: 16 });
        const X = 330;
        line(['円柱の体積 = ', { s: '底面積', color: C.pink }, ' × ', { s: '高さ', color: C.green }], X, 130, { size: 28, align: 'left', alpha: seg(p, 0.05, 0.2) });
        line([{ s: '底面積', color: C.pink }, ' = 半径 × 半径 × 3.14'], X + 30, 210, { size: 24, align: 'left', alpha: seg(p, 0.3, 0.45) });
        line(['円柱の体積 = ', { s: '半径×半径×3.14', color: C.pink }, ' × ', { s: '高さ', color: C.green }], X, 300, { size: 24, align: 'left', alpha: seg(p, 0.55, 0.7), bg: '#fff' });
        line('これは もう 知っているね', 560, 400, { size: 20, color: C.muted, alpha: seg(p, 0.75, 0.9) });
      },
    },
    {
      title: '道具2：円すい', dur: 12,
      caption: '道具その2。箱（立方体）は同じ形のピラミッド3つに分けられるから、ピラミッドは箱の3分の1。円すいも同じ理由で<ruby>円柱<rt>えんちゅう</rt></ruby>の3分の1だよ。',
      narration: '道具、その2。箱は、同じ形の ピラミッド 3つに 分けられる。だから ピラミッドは 箱の 三分の一。えんすいも 同じ理由で、えんちゅうの 三分の一だよ。',
      draw(p) {
        background(); sceneTitle('道具2： 円すいは 円柱の 3分の1');
        const fills = [seg(p, 0.25, 0.35), seg(p, 0.38, 0.48), seg(p, 0.51, 0.61)];
        ctx.save(); ctx.globalAlpha = seg(p, 0, 0.15);
        cubePyramids(80, 190, 150, 60, -50, fills); ctx.restore();
        line('箱（立方体）を', 200, 95, { size: 20, alpha: seg(p, 0, 0.15) });
        line('同じ形の ピラミッド 3つに 分けられる！', 200, 380, { size: 20, alpha: seg(p, 0.55, 0.65) });
        line('ピラミッド 1つ = 箱 ÷ 3', 200, 420, { size: 24, color: C.orange, alpha: seg(p, 0.62, 0.72), bg: '#fff' });
        // 円すい
        const a2 = seg(p, 0.72, 0.85);
        ctx.save(); ctx.globalAlpha = a2;
        drawCylinder(590, 150, 75, 150, 0);
        uprightCone(590, 150, 75, 150);
        ctx.restore();
        line('円すいも 同じ理由で', 590, 95, { size: 20, alpha: a2 });
        line('円すい = 円柱 ÷ 3', 590, 380, { size: 24, color: '#2f9f5a', alpha: seg(p, 0.85, 0.95), bg: '#fff' });
        line('（円柱と 底面・高さが 同じとき）', 590, 420, { size: 16, color: C.muted, alpha: seg(p, 0.85, 0.95) });
      },
    },
    {
      title: '作戦：半分にして比べる', dur: 10,
      caption: '作戦。球を半分に切った「半球」と、「円柱から円すいをくりぬいた形」（どちらも高さ＝半径）をくらべるよ。じつはこの2つ、体積が同じ！',
      narration: '作戦。きゅうを 半分に切った はんきゅうと、えんちゅうから えんすいを くりぬいた形を くらべるよ。じつは この2つ、たいせきが 同じ！ ほんとかな？',
      draw(p) {
        background(); sceneTitle('作戦： 半分にして くらべる');
        // 球 → 半球
        const cut = seg(p, 0.15, 0.35);
        ctx.save(); ctx.globalAlpha = 1 - cut;
        ctx.beginPath(); ctx.arc(HEMI.cx, HEMI.baseY, R, 0, Math.PI); ctx.closePath();
        ctx.fillStyle = 'rgba(255,138,61,0.55)'; ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = C.outline; ctx.stroke(); ctx.restore();
        hemiSide(HEMI.cx, HEMI.baseY, R);
        line('球を 半分に 切る → 半球', HEMI.cx, 100, { size: 20, alpha: seg(p, 0.3, 0.42) });
        // くりぬき円柱
        const b = seg(p, 0.42, 0.6);
        ctx.save(); ctx.globalAlpha = b;
        carvedSide(CARV.cx, CARV.baseY, R); ctx.restore();
        line('円柱 から 円すい を くりぬく', CARV.cx, 100, { size: 20, alpha: b });
        dim(CARV.cx + R + 30, CARV.baseY - R, CARV.cx + R + 30, CARV.baseY, '', { color: C.green, alpha: b });
        line('半径', CARV.cx + R + 60, CARV.baseY - R / 2, { size: 15, color: C.green, alpha: b, bg: 'rgba(255,255,255,0.9)' });
        dim(HEMI.cx - R - 30, HEMI.baseY - R, HEMI.cx - R - 30, HEMI.baseY, '', { color: C.green, alpha: seg(p, 0.3, 0.42) });
        line('半径', HEMI.cx - R - 60, HEMI.baseY - R / 2, { size: 15, color: C.green, alpha: seg(p, 0.3, 0.42), bg: 'rgba(255,255,255,0.9)' });
        line('この2つ、じつは 体積が おなじ！', 400, 320, { size: 28, color: C.orange, alpha: seg(p, 0.65, 0.78), bg: '#fff', border: C.orange });
        line('ほんとかな？ うすく 切って たしかめよう', 400, 400, { size: 22, color: C.muted, alpha: seg(p, 0.82, 0.95) });
      },
    },
    {
      title: 'うすく切って比べる', dur: 16,
      caption: '半径5の場合で、下から高さ3のところをうすく切ってみよう。半球の切り口は円、くりぬき円柱の切り口はドーナツ。直角三角形の3・4・5から、円の半径は4。広さを計算すると……どちらも「16×3.14」で同じ！',
      narration: 'はんけい 5の場合で、下から 高さ3の ところを うすく 切ってみよう。はんきゅうの 切り口は 円、くりぬき えんちゅうの 切り口は ドーナツ。直角三角形の 3、4、5 から、円の はんけいは 4。広さを 計算すると、どちらも 16 かける 3.14 で 同じ！',
      draw(p) {
        background(); sceneTitle('うすく 切って くらべる（半径 5 のとき）');
        const h = 3 * U * seg(p, 0.08, 0.3);
        const tops = seg(p, 0.32, 0.42);
        compareFigures(h, { tops, labels: 1 });
        const tri = seg(p, 0.42, 0.52);
        rightTriangle(HEMI.cx, HEMI.baseY, R, h, tri, ['4', '3', '5']);
        line('高さ 3', CARV.cx + R + 20, CARV.baseY - h, { size: 16, color: C.green, align: 'left', alpha: seg(p, 0.25, 0.35), bg: 'rgba(255,255,255,0.9)' });
        line('3・4・5 の 直角三角形 → 円の半径は 4', 400, 124, { size: 17, color: C.purple, alpha: tri, bg: 'rgba(255,255,255,0.9)' });
        // 計算
        const c1 = seg(p, 0.55, 0.65), c2 = seg(p, 0.68, 0.78);
        line('円の広さ = 4×4×3.14', HEMI.cx, 398, { size: 18, alpha: c1 });
        line('= 16×3.14', HEMI.cx, 426, { size: 20, color: C.pink, alpha: c1 });
        line('ドーナツの広さ = 5×5×3.14 − 3×3×3.14', CARV.cx, 398, { size: 18, alpha: c2 });
        line('= (25 − 9)×3.14 = 16×3.14', CARV.cx, 426, { size: 20, color: C.pink, alpha: c2 });
        line('おなじ！', 400, 330, { size: 30, color: C.orange, alpha: seg(p, 0.82, 0.92), bg: '#fff', border: C.orange });
      },
    },
    {
      title: 'どの高さでも同じ', dur: 13,
      caption: '高さを変えても、切り口の広さはいつも同じ（高さ0なら25と25、高さ4なら9と9…）。切り口がぜんぶ同じなら、うすい板を積み上げた体積も同じ。だから「半球 ＝ 円柱 − 円すい」！',
      narration: '高さを 変えても、切り口の 広さは いつも 同じ。切り口が ぜんぶ 同じなら、うすい板を つみあげた たいせきも 同じ。だから、はんきゅうは、えんちゅう ひく えんすい！',
      draw(p, t) {
        background(); sceneTitle('どの 高さでも 切り口は おなじ');
        const h = R * (0.5 - 0.5 * Math.cos(t * 1.1));
        compareFigures(h, { tops: 1, labels: 0.9 });
        const rows = [['高さ 0', '25', '25'], ['高さ 3', '16', '16'], ['高さ 4', '9', '9'], ['高さ 5', '0', '0']];
        line('切り口の広さ（×3.14）', 400, 122, { size: 14, color: C.muted, alpha: seg(p, 0.05, 0.15) });
        line(['円', '　　', 'ドーナツ'], 415, 146, { size: 14, color: C.muted, alpha: seg(p, 0.05, 0.15) });
        rows.forEach((r, i) => {
          const a = seg(p, 0.15 + i * 0.12, 0.25 + i * 0.12);
          line([r[0] + '：', { s: r[1], color: C.pink }, ' ＝ ', { s: r[2], color: C.pink }], 400, 174 + i * 28, { size: 17, alpha: a });
        });
        line('切り口が ぜんぶ 同じ → うすい板を つみあげた 体積も 同じ！', 400, 400, { size: 20, alpha: seg(p, 0.65, 0.78), bg: '#fff' });
        line('半球 = 円柱 − 円すい', 400, 435, { size: 22, color: C.orange, alpha: seg(p, 0.8, 0.92) });
      },
    },
    {
      title: '計算しよう', dur: 13,
      caption: '「半径×半径×半径×3.14」を★とおくと、円柱＝★、円すい＝★÷3。半球＝★−★÷3＝★×2/3。球はその2倍だから <b>★×4/3</b>！',
      narration: 'はんけい かける はんけい かける はんけい かける 3.14 を、ほし と おくと、えんちゅうは ほし、えんすいは ほし わる 3。はんきゅうは、ほし ひく ほし わる 3 で、ほし かける 三分の二。きゅうは その 2倍だから、ほし かける 三分の四！',
      draw(p) {
        background(); sceneTitle('計算しよう（高さ ＝ 半径）');
        line(['円柱 = 半径×半径×3.14 × 半径 = ', star()], 400, 95, { size: 24, alpha: seg(p, 0.02, 0.12) });
        line(['（半径×半径×半径×3.14 を ', star(), ' と 書くよ）'], 400, 130, { size: 16, color: C.muted, alpha: seg(p, 0.02, 0.12) });
        line(['円すい = 円柱 ÷ 3 = ', star(), ' × ', { f: [1, 3], color: C.green }], 400, 180, { size: 24, alpha: seg(p, 0.18, 0.28) });
        line(['半球 = 円柱 − 円すい = ', star(), ' − ', star(), ' × ', { f: [1, 3], color: C.green }, ' = ', star(), ' × ', { f: [2, 3], color: C.orange }], 400, 240, { size: 24, alpha: seg(p, 0.35, 0.45) });
        line(['球 = 半球 × 2 = ', star(), ' × ', { f: [4, 3], color: C.orange }], 400, 300, { size: 26, alpha: seg(p, 0.52, 0.62) });
        const s = seg(p, 0.7, 0.82);
        formulaBox(400, 385, s, 0.8 + 0.2 * s);
      },
    },
    {
      title: 'まとめ', dur: 9,
      caption: 'まとめ。半球は「円柱−円すい」と切り口がいつも同じだから体積も同じ。だから球の体積は <b>半径×半径×半径×3.14×4/3</b>。2200年以上前に<b>アルキメデス</b>が見つけたひみつだよ。',
      narration: 'まとめ。はんきゅうは、えんちゅう ひく えんすいと 切り口が いつも 同じだから、たいせきも 同じ。だから きゅうの たいせきは、はんけい かける はんけい かける はんけい かける 3.14 かける 三分の四。2200年 以上前に、アルキメデスが 見つけた ひみつだよ。',
      draw(p) {
        background(); sceneTitle('まとめ');
        ctx.save(); ctx.globalAlpha = seg(p, 0, 0.2);
        hemiSide(110, 200, 60); line('=', 200, 170, { size: 30 }); carvedSide(290, 200, 60);
        ctx.restore();
        line('半球 と「円柱 − 円すい」は', 560, 130, { size: 24, alpha: seg(p, 0.05, 0.2) });
        line('切り口が いつも 同じ → 体積も 同じ', 560, 175, { size: 22, alpha: seg(p, 0.12, 0.27) });
        formulaBox(400, 290, seg(p, 0.3, 0.45));
        line('2200年以上前に アルキメデスが 見つけた ひみつだよ', 400, 370, { size: 21, color: C.muted, alpha: seg(p, 0.55, 0.68) });
        line('アルキメデスは この発見が 大のお気に入りで、', 400, 402, { size: 18, color: C.muted, alpha: seg(p, 0.7, 0.83) });
        line('お墓に「球と円柱」の絵を きざんでもらったんだって！', 400, 430, { size: 18, color: C.muted, alpha: seg(p, 0.7, 0.83) });
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
