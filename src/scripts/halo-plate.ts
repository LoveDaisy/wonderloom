import { BIN_COUNT, BIN_WIDTH, DeviationHistogram, cieXYZ, deviation, encodeSrgb, hexagon, iceIndex, trace, xyzToLinearSrgb, type Vec } from '../lib/halo-optics';

const root = document.querySelector<HTMLElement>('[data-halo-plate]');
if (root) {
  const crystalCanvas = root.querySelector<HTMLCanvasElement>('[data-plate-crystal]')!;
  const skyCanvas = root.querySelector<HTMLCanvasElement>('[data-plate-sky]')!;
  const histCanvas = root.querySelector<HTMLCanvasElement>('[data-plate-histogram]')!;
  const slider = root.querySelector<HTMLInputElement>('[data-plate-angle]')!;
  const toggle = root.querySelector<HTMLButtonElement>('[data-plate-toggle]')!;
  const readout = (name: string) => root.querySelector<HTMLElement>(`[data-readout="${name}"]`)!;
  const out = { angle: readout('angle'), ray: readout('ray'), traced: readout('traced'), peak: readout('peak') };
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const style = getComputedStyle(root);
  const token = (name: string) => style.getPropertyValue(name).trim();
  const mono = `10.5px ${token('--cy-mono') || 'Menlo, monospace'}`;

  const histogram = new DeviationHistogram();
  const SAMPLE_LIMIT = 400_000;
  const MAX_SKY_DEVIATION = 32;
  let theta = 17 * Math.PI / 180;
  let paused = false;
  let visible = false;
  let frame = 0;
  let previous = 0;
  let lastPaint = -Infinity;
  let skyDirty = true;
  let pending = 0;
  // 六角对称，转过 60° 即一个周期；约 24 秒一周期。
  const TURN_SPEED = Math.PI / 3 / 24000;

  root.classList.add('is-live');

  // 画布按 CSS 尺寸与像素比重设，绘制坐标统一用 CSS 像素。
  const fit = (canvas: HTMLCanvasElement) => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(width * ratio));
    canvas.height = Math.max(1, Math.round(height * ratio));
    const context = canvas.getContext('2d')!;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { context, width, height };
  };
  let crystal = fit(crystalCanvas), sky = fit(skyCanvas), hist = fit(histCanvas);

  const spectral = (nm: number, alpha: number) => {
    const [r, g, b] = xyzToLinearSrgb(...cieXYZ(nm));
    const top = Math.max(r, g, b, 1e-6);
    return `rgba(${[r, g, b].map((v) => Math.round(encodeSrgb(Math.max(0, v) / top) * 255)).join(',')},${alpha})`;
  };
  const exitColours = [[455, spectral(455, .7)], [540, spectral(540, .62)], [625, spectral(625, .7)]] as const;

  function drawCrystal() {
    const { context: c, width: w, height: h } = crystal;
    c.clearRect(0, 0, w, h);
    const radius = Math.min(h * .3, w * .2);
    const cx = w * .46, cy = h * .5;
    const poly = hexagon(0, 0, 1, theta);
    const toPx = (p: Vec): Vec => [cx + p[0] * radius, cy + p[1] * radius];
    const warpGap = 30;
    const warp = (odd: boolean) => {
      c.strokeStyle = 'rgba(220, 232, 240, .05)';
      c.lineWidth = 1;
      c.beginPath();
      for (let x = warpGap / 2, i = 0; x < w; x += warpGap, i++) if ((i % 2 === 1) === odd) { c.moveTo(x + .5, 0); c.lineTo(x + .5, h); }
      c.stroke();
    };
    warp(false);

    const rays = 15;
    let minimum = Infinity;
    c.lineCap = 'round';
    for (let i = 0; i < rays; i++) {
      const y = -.92 + 1.84 * i / (rays - 1);
      const origin: Vec = [-cx / radius - 1, y];
      const main = trace(poly, [0, 0], origin, [1, 0], iceIndex(550));
      c.strokeStyle = 'rgba(226, 236, 240, .34)';
      c.lineWidth = 1;
      c.beginPath();
      const start = toPx(origin);
      c.moveTo(start[0], start[1]);
      if (!main) { c.lineTo(w, start[1]); c.stroke(); continue; }
      const entry = toPx(main.points[1]);
      c.lineTo(entry[0], entry[1]);
      c.stroke();
      c.strokeStyle = 'rgba(244, 248, 250, .86)';
      c.lineWidth = 1.2;
      c.beginPath();
      main.points.slice(1).map(toPx).forEach(([x, py], index) => index ? c.lineTo(x, py) : c.moveTo(x, py));
      c.stroke();
      const bend = deviation(main.exit);
      if (bend > 1 && bend < minimum) minimum = bend;
      c.globalCompositeOperation = 'lighter';
      c.lineWidth = 1.1;
      for (const [nm, colour] of exitColours) {
        const path = trace(poly, [0, 0], origin, [1, 0], iceIndex(nm));
        if (!path) continue;
        const last = path.points[path.points.length - 1];
        const a = toPx(last), b = toPx([last[0] + path.exit[0] * 40, last[1] + path.exit[1] * 40]);
        c.strokeStyle = colour;
        c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
      }
      c.globalCompositeOperation = 'source-over';
    }

    // 奇数经线压在光线之上：先擦出缝，再画线，得到一上一下的交织。
    c.globalCompositeOperation = 'destination-out';
    c.lineWidth = 3;
    c.strokeStyle = '#000';
    c.beginPath();
    for (let x = warpGap / 2, i = 0; x < w; x += warpGap, i++) if (i % 2) { c.moveTo(x + .5, 0); c.lineTo(x + .5, h); }
    c.stroke();
    c.globalCompositeOperation = 'source-over';
    warp(true);

    const corners = poly.map(toPx);
    c.beginPath();
    corners.forEach(([x, py], index) => index ? c.lineTo(x, py) : c.moveTo(x, py));
    c.closePath();
    c.fillStyle = 'rgba(214, 230, 240, .08)';
    c.fill();
    c.strokeStyle = 'rgba(244, 248, 250, .92)';
    c.lineWidth = 1.25;
    c.stroke();

    const degrees = ((theta * 180 / Math.PI) % 60 + 60) % 60;
    out.angle.textContent = `${degrees.toFixed(1)}°`;
    slider.value = degrees.toFixed(1);
    out.ray.textContent = Number.isFinite(minimum) ? `${minimum.toFixed(1)}°` : '—';
  }

  // 天空：以太阳为圆心，半径即偏折角。二维直方图除以 sin(偏折角) 换算成单位立体角的亮度。
  const skyRes = 220;
  const skyImage = new ImageData(skyRes, skyRes);
  const skyBuffer = document.createElement('canvas');
  skyBuffer.width = skyBuffer.height = skyRes;
  const skyBins = new Int32Array(skyRes * skyRes);
  const skyRadial = new Float32Array(skyRes * skyRes);
  for (let j = 0; j < skyRes; j++) for (let i = 0; i < skyRes; i++) {
    const r = Math.hypot(i + .5 - skyRes / 2, j + .5 - skyRes / 2) / (skyRes / 2);
    const angle = r * MAX_SKY_DEVIATION;
    skyRadial[j * skyRes + i] = r;
    skyBins[j * skyRes + i] = r > 1 ? -1 : Math.floor(angle / BIN_WIDTH);
  }
  const skyLinear = [0.0116, 0.0423, 0.1046];
  const radiance = new Float64Array(BIN_COUNT * 3);

  function drawSky() {
    const xyz = histogram.xyz;
    let peak = 0;
    for (let bin = 0; bin < BIN_COUNT; bin++) {
      const angle = (bin + .5) * BIN_WIDTH;
      for (let k = 0; k < 3; k++) {
        let sum = 0, weight = 0;
        for (let o = -3; o <= 3; o++) { const b = bin + o; if (b < 0 || b >= BIN_COUNT) continue; const wgt = 4 - Math.abs(o); sum += xyz[b * 3 + k] * wgt; weight += wgt; }
        radiance[bin * 3 + k] = angle < 2 ? 0 : sum / weight / Math.sin(angle * Math.PI / 180);
      }
      if (angle > 5 && angle < MAX_SKY_DEVIATION && radiance[bin * 3 + 1] > peak) peak = radiance[bin * 3 + 1];
    }
    const exposure = peak > 0 ? 1.25 / peak : 0;
    const data = skyImage.data;
    for (let p = 0; p < skyBins.length; p++) {
      const bin = skyBins[p];
      const fade = Math.min(1, Math.max(0, (1 - skyRadial[p]) / .06));
      let r = skyLinear[0], g = skyLinear[1], b = skyLinear[2];
      if (bin >= 0 && exposure) {
        const [lr, lg, lb] = xyzToLinearSrgb(radiance[bin * 3] * exposure, radiance[bin * 3 + 1] * exposure, radiance[bin * 3 + 2] * exposure);
        r += (1 - Math.exp(-Math.max(0, lr))) * fade;
        g += (1 - Math.exp(-Math.max(0, lg))) * fade;
        b += (1 - Math.exp(-Math.max(0, lb))) * fade;
      }
      data[p * 4] = encodeSrgb(r) * 255;
      data[p * 4 + 1] = encodeSrgb(g) * 255;
      data[p * 4 + 2] = encodeSrgb(b) * 255;
      data[p * 4 + 3] = bin >= 0 ? 255 : 0;
    }
    skyBuffer.getContext('2d')!.putImageData(skyImage, 0, 0);
    const { context: c, width: w, height: h } = sky;
    const size = Math.min(w, h);
    const ox = (w - size) / 2, oy = (h - size) / 2;
    c.clearRect(0, 0, w, h);
    c.imageSmoothingEnabled = true;
    c.drawImage(skyBuffer, ox, oy, size, size);
    const cx = ox + size / 2, cy = oy + size / 2;
    const glow = c.createRadialGradient(cx, cy, 0, cx, cy, size * .09);
    glow.addColorStop(0, 'rgba(255, 252, 240, 1)');
    glow.addColorStop(.18, 'rgba(255, 248, 226, .9)');
    glow.addColorStop(1, 'rgba(255, 248, 226, 0)');
    c.fillStyle = glow;
    c.beginPath(); c.arc(cx, cy, size * .09, 0, Math.PI * 2); c.fill();
    // 量角刻度：沿水平半径每 5° 一格，便于读出圈的大小。
    const perDegree = size / 2 / MAX_SKY_DEVIATION;
    c.strokeStyle = 'rgba(220, 232, 240, .42)';
    c.fillStyle = 'rgba(220, 232, 240, .62)';
    c.lineWidth = 1;
    c.font = mono;
    c.textAlign = 'center';
    c.beginPath();
    c.moveTo(cx, cy + size / 2 - 1); c.lineTo(cx + size / 2, cy + size / 2 - 1);
    for (let d = 0; d <= 30; d += 5) { const x = cx + d * perDegree; c.moveTo(x, cy + size / 2 - 1); c.lineTo(x, cy + size / 2 - (d % 10 ? 5 : 9)); }
    c.stroke();
    for (let d = 10; d <= 30; d += 10) c.fillText(`${d}°`, cx + d * perDegree, cy + size / 2 - 13);
    skyDirty = false;
  }

  function drawHistogram() {
    const { context: c, width: w, height: h } = hist;
    c.clearRect(0, 0, w, h);
    const maxAngle = 46, base = h - 16;
    const columns = Math.max(1, Math.floor(w));
    const values = new Float64Array(columns * 3);
    let top = 0;
    for (let bin = Math.round(2 / BIN_WIDTH); bin < maxAngle / BIN_WIDTH; bin++) {
      const column = Math.floor((bin * BIN_WIDTH) / maxAngle * columns);
      for (let k = 0; k < 3; k++) values[column * 3 + k] += histogram.xyz[bin * 3 + k];
    }
    for (let i = 0; i < columns; i++) top = Math.max(top, values[i * 3 + 1]);
    if (top > 0) for (let i = 0; i < columns; i++) {
      const y = values[i * 3 + 1];
      if (!y) continue;
      const [r, g, b] = xyzToLinearSrgb(values[i * 3], y, values[i * 3 + 2]);
      const m = Math.max(r, g, b, 1e-9);
      c.fillStyle = `rgb(${[r, g, b].map((v) => Math.round(encodeSrgb(Math.max(0, v) / m) * 235)).join(',')})`;
      const height = Math.max(1, (base - 6) * y / top);
      c.fillRect(i, base - height, 1, height);
    }
    c.strokeStyle = 'rgba(220, 232, 240, .42)';
    c.fillStyle = 'rgba(220, 232, 240, .62)';
    c.font = mono;
    c.textAlign = 'center';
    c.beginPath();
    c.moveTo(0, base + .5); c.lineTo(w, base + .5);
    for (let d = 0; d <= 40; d += 10) { const x = d / maxAngle * w; c.moveTo(x + .5, base); c.lineTo(x + .5, base + 4); }
    c.stroke();
    for (let d = 10; d <= 40; d += 10) c.fillText(`${d}°`, d / maxAngle * w, h - 2);
    const peak = histogram.peak();
    out.traced.textContent = histogram.traced.toLocaleString('zh-CN');
    if (peak && histogram.traced > 4000) {
      out.peak.textContent = `${peak.angle.toFixed(1)}°`;
      const x = peak.angle / maxAngle * w;
      c.strokeStyle = token('--cy-brass') || '#c9a04a';
      c.beginPath(); c.moveTo(x + .5, 0); c.lineTo(x + .5, base); c.stroke();
    }
  }

  const drawAll = () => { drawCrystal(); if (skyDirty) drawSky(); drawHistogram(); };

  const canRun = () => visible && !reduced.matches && !document.hidden;
  const tick = (time: number) => {
    frame = 0;
    if (!canRun()) return;
    const delta = previous ? Math.min(time - previous, 100) : 0;
    previous = time;
    pending += delta;
    if (time - lastPaint >= 1000 / 30) {
      if (!paused) theta += pending * TURN_SPEED;
      pending = 0;
      if (histogram.traced < SAMPLE_LIMIT) { histogram.sample(420); skyDirty = true; }
      drawAll();
      lastPaint = time;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    toggle.hidden = reduced.matches;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.textContent = paused ? '继续转动' : '暂停转动';
    if (canRun()) { if (!frame) { previous = 0; frame = requestAnimationFrame(tick); } }
    else { cancelAnimationFrame(frame); frame = 0; }
  };

  // 减少动态效果时不播放：分批算完一组静态结果后画一次。
  const settle = () => {
    if (histogram.traced >= 160_000) { skyDirty = true; drawAll(); return; }
    histogram.sample(20_000);
    setTimeout(settle, 0);
  };

  slider.addEventListener('input', () => {
    paused = true;
    theta = Number(slider.value) * Math.PI / 180;
    sync();
    drawCrystal();
  });
  let dragX: number | null = null;
  crystalCanvas.addEventListener('pointerdown', (event) => { dragX = event.clientX; crystalCanvas.setPointerCapture(event.pointerId); paused = true; sync(); });
  crystalCanvas.addEventListener('pointermove', (event) => {
    if (dragX === null) return;
    theta += (event.clientX - dragX) * .006;
    dragX = event.clientX;
    drawCrystal();
  });
  const release = () => { dragX = null; };
  crystalCanvas.addEventListener('pointerup', release);
  crystalCanvas.addEventListener('pointercancel', release);
  toggle.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', () => { sync(); if (reduced.matches) settle(); });
  document.addEventListener('visibilitychange', sync);
  new ResizeObserver(() => { crystal = fit(crystalCanvas); sky = fit(skyCanvas); hist = fit(histCanvas); skyDirty = true; drawAll(); }).observe(root);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(root);
  drawAll();
  if (reduced.matches) settle();
  sync();
}
