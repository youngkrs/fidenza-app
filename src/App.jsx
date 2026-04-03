import { useState, useRef, useEffect, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   FIDENZA-STYLE GENERATIVE ART ENGINE — 16-STEP ALGORITHM
   ═══════════════════════════════════════════════════════════════ */

function createNoise(seed) {
  const p = new Uint8Array(512);
  let s = seed;
  const rn = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const pm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rn() * (i + 1)); [pm[i], pm[j]] = [pm[j], pm[i]]; }
  for (let i = 0; i < 512; i++) p[i] = pm[i & 255];
  const g2 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  const fd = t => t*t*t*(t*(t*6-15)+10);
  const lp = (a,b,t) => a+t*(b-a);
  const d2 = (g,x,y) => g[0]*x+g[1]*y;
  function base(x,y) {
    const X=Math.floor(x)&255,Y=Math.floor(y)&255,xf=x-Math.floor(x),yf=y-Math.floor(y),u=fd(xf),v=fd(yf);
    return lp(lp(d2(g2[p[p[X]+Y]&7],xf,yf),d2(g2[p[p[X+1]+Y]&7],xf-1,yf),u),
              lp(d2(g2[p[p[X]+Y+1]&7],xf,yf-1),d2(g2[p[p[X+1]+Y+1]&7],xf-1,yf-1),u),v);
  }
  return (x,y,oct=3,per=0.5) => {
    let t=0,f=1,a=1,m=0;
    for(let o=0;o<oct;o++){t+=base(x*f,y*f)*a;m+=a;a*=per;f*=2;}
    return t/m;
  };
}

function createRNG(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

// Gaussian via Box-Muller
function makeGauss(rng) {
  return () => {
    let u = 0, v = 0;
    while (u === 0) u = rng();
    while (v === 0) v = rng();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
}

/* ── Palettes ── */
const PALETTES = [
  {name:"Warm Sunset",bg:"#F5F0E8",colors:[{c:"#D94F3D",w:.3},{c:"#E8A44A",w:.25},{c:"#2B4C6F",w:.2},{c:"#F2D680",w:.15},{c:"#1A1A2E",w:.1}]},
  {name:"Ocean Depths",bg:"#F7F3ED",colors:[{c:"#1B4965",w:.3},{c:"#5FA8D3",w:.25},{c:"#BEE9E8",w:.15},{c:"#CAE9FF",w:.1},{c:"#D94F3D",w:.2}]},
  {name:"Earth Tones",bg:"#FAF6F0",colors:[{c:"#8B5E3C",w:.25},{c:"#D4A76A",w:.2},{c:"#2D5016",w:.25},{c:"#F4E2C1",w:.15},{c:"#3B1F0B",w:.15}]},
  {name:"Vivid Pop",bg:"#FEFAF4",colors:[{c:"#FF3366",w:.25},{c:"#33CCCC",w:.2},{c:"#FFCC00",w:.2},{c:"#6633FF",w:.2},{c:"#111111",w:.15}]},
  {name:"Muted Pastels",bg:"#F0EDE8",colors:[{c:"#C9B1A0",w:.25},{c:"#A3C4BC",w:.25},{c:"#E8D5B7",w:.2},{c:"#7B9E87",w:.15},{c:"#D4817A",w:.15}]},
  {name:"Midnight",bg:"#1A1A2E",colors:[{c:"#E94560",w:.25},{c:"#0F3460",w:.2},{c:"#16213E",w:.15},{c:"#F5E6CA",w:.25},{c:"#533483",w:.15}]},
  {name:"Terracotta",bg:"#F5EDE3",colors:[{c:"#C1440E",w:.3},{c:"#E77D5A",w:.2},{c:"#2C3E50",w:.2},{c:"#F0C27F",w:.15},{c:"#1A1A1A",w:.15}]},
  {name:"Cool Minimal",bg:"#F8F9FA",colors:[{c:"#2D3436",w:.35},{c:"#636E72",w:.25},{c:"#B2BEC3",w:.15},{c:"#DFE6E9",w:.1},{c:"#E17055",w:.15}]},
  {name:"Golden Hour",bg:"#FDF5E6",colors:[{c:"#D4A03E",w:.3},{c:"#C0392B",w:.2},{c:"#2C3E50",w:.2},{c:"#E8C16D",w:.15},{c:"#1B2631",w:.15}]},
  {name:"Sage & Rust",bg:"#F0EDEA",colors:[{c:"#6B8F71",w:.25},{c:"#B85042",w:.25},{c:"#E7D8C9",w:.15},{c:"#2B3A33",w:.2},{c:"#D4A574",w:.15}]},
  {name:"Indigo Dream",bg:"#F4F1EC",colors:[{c:"#3D405B",w:.3},{c:"#E07A5F",w:.25},{c:"#81B29A",w:.2},{c:"#F2CC8F",w:.15},{c:"#F4F1DE",w:.1}]},
  {name:"Noir",bg:"#F5F2ED",colors:[{c:"#1A1A1A",w:.4},{c:"#333333",w:.25},{c:"#666666",w:.15},{c:"#999999",w:.1},{c:"#CC3333",w:.1}]},
  {name:"Candy",bg:"#FFF8F0",colors:[{c:"#FF6B6B",w:.25},{c:"#4ECDC4",w:.25},{c:"#FFE66D",w:.2},{c:"#FF8B94",w:.15},{c:"#2C3E50",w:.15}]},
  {name:"Forest",bg:"#F2F0EB",colors:[{c:"#1B4332",w:.3},{c:"#2D6A4F",w:.2},{c:"#52B788",w:.2},{c:"#D8F3DC",w:.15},{c:"#8B4513",w:.15}]},
  {name:"Luxe",bg:"#E0D7C5",colors:[
    {c:"#D1292F",w:.09},{c:"#DB4E53",w:.07},{c:"#E57D32",w:.08},{c:"#ED8F4B",w:.06},
    {c:"#FCBC19",w:.07},{c:"#FCD164",w:.06},{c:"#29A591",w:.07},{c:"#3F8C45",w:.05},
    {c:"#84CCC0",w:.06},{c:"#315E8C",w:.08},{c:"#1F3259",w:.06},{c:"#543E2E",w:.06},
    {c:"#F7B0A0",w:.05},{c:"#E0AC86",w:.05},{c:"#191919",w:.05},{c:"#F9F8F4",w:.04},
  ]},
  {name:"Luxe-Derived",bg:"#E0D7C5",colors:[
    {c:"#D1292F",w:.2},{c:"#315E8C",w:.2},{c:"#FCBC19",w:.15},
    {c:"#29A591",w:.15},{c:"#543E2E",w:.15},{c:"#F9F8F4",w:.15},
  ]},
];

const STROKE_NAMES = ["Filled","Super Blocks","Outlined","Soft Shapes","Hatched"];
const ANGLE_NAMES = ["Smooth","Sharp","Angular","Rigid"];
const ANGLE_SNAPS = {Smooth:0,Sharp:Math.PI*.2,Angular:Math.PI*.25,Rigid:Math.PI*.5};
const SPIRAL_NAMES = ["None","Gentle","Strong","Vortex"];
const SPIRAL_STR = {None:0,Gentle:.3,Strong:.7,Vortex:1.2};

function wc(opts, rng) {
  const r = rng(); let s = 0;
  for (const o of opts) { s += o.w; if (r <= s) return o; }
  return opts[opts.length - 1];
}
function pickColor(pal, rng) { return wc(pal.colors, rng).c; }

/* ── Seed defaults ── */
function seedDefaults(seed) {
  const r = createRNG(seed);
  const thickPresets = [
    {center:6,spread:3,w:.08},{center:16,spread:8,w:.15},
    {center:35,spread:15,w:.30},{center:50,spread:20,w:.32},
    {center:75,spread:25,w:.10},{center:20,spread:1,w:.05},
  ];
  const turbPresets = [{v:0,w:.08},{v:.6,w:.25},{v:1.2,w:.35},{v:2.5,w:.22},{v:4,w:.1}];
  const tp = wc(thickPresets, r);
  const tb = wc(turbPresets, r);
  return {
    palette: Math.floor(r() * PALETTES.length),
    thickCenter: tp.center, thickSpread: tp.spread, thickVariation: 0.6 + r() * 0.3,
    thickFloor: 3, thickMult: 1.0,
    turbulence: tb.v,
    stroke: STROKE_NAMES[Math.floor(r() * 5)],
    angle: ANGLE_NAMES[Math.floor(r() * 4)],
    spiral: SPIRAL_NAMES[Math.floor(r() * 4)],
    gap: 0.8 + r() * 2.5, density: 0.5 + r() * 1.5,
    curveLen: 20 + Math.floor(r() * 70), fillPasses: 1 + Math.floor(r() * 2),
    segProb: 0.75 + r() * 0.2, segMin: 2, segMax: 2 + Math.floor(r() * 3),
    segEndBias: 0.6 + r() * 0.3, segCoherence: 0.3 + r() * 0.4,
    segOutline: 1.0 + r() * 1.5,
    octaves: 2 + Math.floor(r() * 3), persistence: 0.35 + r() * 0.35,
  };
}

/* ═══════════════════════════════════════════════════════════════
   RENDER ENGINE — returns shapes data for SVG export
   ═══════════════════════════════════════════════════════════════ */
function computeShapes(seed, cfg, W, H) {
  const rng = createRNG(seed + 7);
  const gauss = makeGauss(rng);
  const noise = createNoise(seed);
  const pal = PALETTES[cfg.palette];

  const res = Math.max(3, Math.floor(W * 0.004));
  const mgn = W * 0.5;
  const gL = -mgn, gT = -mgn;
  const cols = Math.ceil((W + mgn * 2) / res) + 1;
  const rows = Math.ceil((H + mgn * 2) / res) + 1;
  const grid = new Float32Array(cols * rows);
  const spiralStr = SPIRAL_STR[cfg.spiral] || 0;
  const snap = ANGLE_SNAPS[cfg.angle] || 0;
  const sCx = W / 2, sCy = H / 2;

  const baseRng = createRNG(seed + 99);
  const domAngle = baseRng() * Math.PI * 2;
  const nFreq = 0.0008 + cfg.turbulence * 0.0003;
  const nAmp = cfg.turbulence === 0 ? 0.15 : (0.3 + cfg.turbulence * 0.35);

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const wx = gL + c * res, wy = gT + r * res;
      const nx = wx * nFreq, ny = wy * nFreq;
      const n1 = noise(nx, ny, cfg.octaves, cfg.persistence);
      const n2 = noise(nx * 0.3 + 100, ny * 0.3 + 100, 2, 0.5);
      let a = domAngle + n1 * Math.PI * nAmp + n2 * Math.PI * nAmp * 0.4;
      if (spiralStr > 0) {
        const sa = Math.atan2(wy - sCy, wx - sCx) + Math.PI / 2;
        a = a * (1 - spiralStr) + sa * spiralStr;
      }
      if (snap > 0) a = Math.round(a / snap) * snap;
      grid[c * rows + r] = a;
    }
  }

  function lerpA(a1, a2, t) {
    let d = a2 - a1;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return a1 + d * t;
  }
  function getA(x, y) {
    const fx = (x - gL) / res, fy = (y - gT) / res;
    const c0 = Math.floor(fx), r0 = Math.floor(fy);
    if (c0 < 0 || c0 >= cols - 1 || r0 < 0 || r0 >= rows - 1) return domAngle;
    const tx = fx - c0, ty = fy - r0;
    const top = lerpA(grid[c0 * rows + r0], grid[(c0 + 1) * rows + r0], tx);
    const bot = lerpA(grid[c0 * rows + r0 + 1], grid[(c0 + 1) * rows + r0 + 1], tx);
    return lerpA(top, bot, ty);
  }

  function trace(sx, sy, mxS) {
    const pts = []; let x = sx, y = sy;
    const sl = Math.max(1, W * 0.002);
    for (let i = 0; i < mxS; i++) {
      pts.push({ x, y });
      const a = getA(x, y);
      x += Math.cos(a) * sl; y += Math.sin(a) * sl;
      if (x < -mgn || x > W + mgn || y < -mgn || y > H + mgn) break;
    }
    return pts;
  }

  function makeGeo(pts, th) {
    const hw = th / 2, L = [], R = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]; let ang;
      if (i === 0) ang = Math.atan2(pts[1].y - p.y, pts[1].x - p.x);
      else if (i === pts.length - 1) ang = Math.atan2(p.y - pts[i-1].y, p.x - pts[i-1].x);
      else {
        const a1 = Math.atan2(p.y - pts[i-1].y, p.x - pts[i-1].x);
        const a2 = Math.atan2(pts[i+1].y - p.y, pts[i+1].x - p.x);
        let dd = a2 - a1; while (dd > Math.PI) dd -= Math.PI*2; while (dd < -Math.PI) dd += Math.PI*2;
        ang = a1 + dd * 0.5;
      }
      const pp = ang + Math.PI / 2;
      L.push({ x: p.x + Math.cos(pp) * hw, y: p.y + Math.sin(pp) * hw });
      R.push({ x: p.x - Math.cos(pp) * hw, y: p.y - Math.sin(pp) * hw });
    }
    return { left: L, right: R };
  }

  const cellSz = Math.max(3, Math.floor(2 + cfg.gap * 1.5));
  const hC = Math.ceil(W / cellSz) + 2, hR = Math.ceil(H / cellSz) + 2;
  const occ = new Uint8Array(hC * hR);
  function hM(x, y, rd) {
    const c1 = Math.max(0, Math.floor((x-rd)/cellSz)), c2 = Math.min(hC-1, Math.floor((x+rd)/cellSz));
    const r1 = Math.max(0, Math.floor((y-rd)/cellSz)), r2 = Math.min(hR-1, Math.floor((y+rd)/cellSz));
    for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) occ[c * hR + r] = 1;
  }
  function hQ(x, y, rd) {
    const c1 = Math.max(0, Math.floor((x-rd)/cellSz)), c2 = Math.min(hC-1, Math.floor((x+rd)/cellSz));
    const r1 = Math.max(0, Math.floor((y-rd)/cellSz)), r2 = Math.min(hR-1, Math.floor((y+rd)/cellSz));
    for (let c = c1; c <= c2; c++) for (let r = r1; r <= r2; r++) if (occ[c * hR + r]) return true;
    return false;
  }

  const gV = cfg.gap;
  function gapR(hw) { return hw + 1 + gV * 2; }
  function colR(hw) { return hw + 0.5 + gV * 1.2; }

  function segmentShape(pts) {
    if (rng() > cfg.segProb) return null;
    const nSegs = cfg.segMin + Math.floor(rng() * (cfg.segMax - cfg.segMin + 1));
    if (nSegs < 2 || pts.length < nSegs * 3) return null;
    const len = pts.length;
    const splits = [0];
    for (let i = 1; i < nSegs; i++) {
      const even = (i / nSegs) * len;
      let biased;
      if (i <= nSegs / 2) biased = even * (1 - cfg.segEndBias) + (len * 0.15 * i / (nSegs/2)) * cfg.segEndBias;
      else biased = even * (1 - cfg.segEndBias) + (len - len * 0.15 * (nSegs - i) / (nSegs/2)) * cfg.segEndBias;
      splits.push(Math.max(2, Math.min(len - 2, Math.floor(biased + (rng() - 0.5) * len * 0.1))));
    }
    splits.push(len);
    splits.sort((a, b) => a - b);
    const colors = [];
    let pair = null;
    if (cfg.segCoherence > 0.5 && rng() < cfg.segCoherence) pair = [pickColor(pal, rng), pickColor(pal, rng)];
    for (let i = 0; i < nSegs; i++) {
      colors.push(pair && rng() < cfg.segCoherence ? pair[Math.floor(rng() * 2)] : pickColor(pal, rng));
    }
    return { splits, colors };
  }

  const shapes = [];
  const baseAtt = Math.floor(W * H * cfg.density * 0.002);
  for (let pass = 0; pass < cfg.fillPasses; pass++) {
    const att = pass === 0 ? baseAtt : Math.floor(baseAtt * 0.6);
    for (let a = 0; a < att; a++) {
      const sx = rng() * W, sy = rng() * H;
      const rawTh = Math.max(cfg.thickFloor, cfg.thickCenter + gauss() * cfg.thickSpread * cfg.thickVariation);
      const th = rawTh * cfg.thickMult;
      const hw = th / 2;
      if (hQ(sx, sy, colR(hw))) continue;
      const pts = trace(sx, sy, cfg.curveLen + Math.floor(rng() * 30));
      if (pts.length < 3) continue;
      const vp = [];
      for (const pt of pts) {
        const on = pt.x >= 0 && pt.x <= W && pt.y >= 0 && pt.y <= H;
        if (on && hQ(pt.x, pt.y, colR(hw))) break;
        vp.push(pt);
      }
      if (vp.length < 3) continue;
      for (const pt of vp) if (pt.x >= -10 && pt.x <= W+10 && pt.y >= -10 && pt.y <= H+10) hM(pt.x, pt.y, gapR(hw));
      const seg = segmentShape(vp);
      shapes.push({ pts: vp, th, seg: seg || { splits: [0, vp.length], colors: [pickColor(pal, rng)] } });
    }
  }

  return { shapes, makeGeo, pal, rng };
}

// Canvas renderer
function render(canvas, seed, cfg) {
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;
  const { shapes, makeGeo, pal, rng } = computeShapes(seed, cfg, W, H);

  ctx.fillStyle = pal.bg;
  ctx.fillRect(0, 0, W, H);

  function bp(g) {
    ctx.beginPath();
    ctx.moveTo(g.left[0].x, g.left[0].y);
    for (let i = 1; i < g.left.length; i++) ctx.lineTo(g.left[i].x, g.left[i].y);
    for (let i = g.right.length - 1; i >= 0; i--) ctx.lineTo(g.right[i].x, g.right[i].y);
    ctx.closePath();
  }

  function renderSeg(sp, th, color) {
    if (sp.length < 2) return;
    const g = makeGeo(sp, th);
    if (cfg.stroke === "Filled") { bp(g); ctx.fillStyle = color; ctx.fill(); }
    else if (cfg.stroke === "Outlined") { bp(g); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, th * 0.06); ctx.stroke(); }
    else if (cfg.stroke === "Super Blocks") {
      const bs = Math.max(3, th * 0.36);
      for (let i = 0; i < sp.length; i++) {
        const pt = sp[i];
        const an = i < sp.length-1 ? Math.atan2(sp[i+1].y-pt.y, sp[i+1].x-pt.x) : Math.atan2(pt.y-sp[Math.max(0,i-1)].y, pt.x-sp[Math.max(0,i-1)].x);
        const pp = an + Math.PI/2;
        const st = Math.ceil(th / bs);
        for (let ss = -st/2; ss < st/2; ss++) {
          ctx.save();
          ctx.translate(pt.x + Math.cos(pp)*ss*bs, pt.y + Math.sin(pp)*ss*bs);
          ctx.rotate(an);
          ctx.fillStyle = rng() > 0.7 ? pickColor(pal, rng) : color;
          ctx.fillRect(-bs/2, -bs/2, bs*0.86, bs*0.86);
          ctx.restore();
        }
      }
    }
    else if (cfg.stroke === "Soft Shapes") {
      ctx.save(); bp(g); ctx.clip();
      const cr = parseInt(color.slice(1,3),16), cg = parseInt(color.slice(3,5),16), cb = parseInt(color.slice(5,7),16);
      const nl = Math.max(8, Math.floor(th * 2));
      for (let l = 0; l < nl; l++) {
        const t = l / nl;
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${0.1+rng()*0.4})`;
        ctx.lineWidth = 0.4 + rng() * 0.5;
        ctx.beginPath();
        for (let i = 0; i < g.left.length; i++) {
          const x = g.left[i].x + (g.right[i].x - g.left[i].x) * t + (rng()-0.5)*2.5;
          const y = g.left[i].y + (g.right[i].y - g.left[i].y) * t + (rng()-0.5)*2.5;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    else if (cfg.stroke === "Hatched") {
      ctx.save(); bp(g); ctx.clip();
      ctx.strokeStyle = color; ctx.lineWidth = 0.7;
      const spc = 2 + rng() * 3, ha = rng() * Math.PI;
      let mnX=1e9, mxX=-1e9, mnY=1e9, mxY=-1e9;
      for (const pt of [...g.left,...g.right]) { mnX=Math.min(mnX,pt.x); mxX=Math.max(mxX,pt.x); mnY=Math.min(mnY,pt.y); mxY=Math.max(mxY,pt.y); }
      const dg = Math.sqrt((mxX-mnX)**2+(mxY-mnY)**2);
      const cx = (mnX+mxX)/2, cy = (mnY+mxY)/2;
      const cs = Math.cos(ha), sn = Math.sin(ha);
      for (let dd = -dg/2; dd < dg/2; dd += spc) {
        ctx.beginPath();
        ctx.moveTo(cx+cs*(-dg)-sn*dd, cy+sn*(-dg)+cs*dd);
        ctx.lineTo(cx+cs*dg-sn*dd, cy+sn*dg+cs*dd);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  const isDark = pal.bg === "#1A1A2E" || pal.bg === "#1A1714";
  const olColor = isDark ? "#E8E4DD" : "#1A1A1A";

  for (const sh of shapes) {
    const { pts, th, seg } = sh;
    if (cfg.segOutline > 0) {
      const olPts = [...pts];
      const ext = cfg.segOutline * 1.5;
      if (olPts.length >= 2) {
        const p0 = olPts[0], p1 = olPts[1];
        const a0 = Math.atan2(p0.y - p1.y, p0.x - p1.x);
        olPts.unshift({ x: p0.x + Math.cos(a0)*ext, y: p0.y + Math.sin(a0)*ext });
        const pL = olPts[olPts.length-1], pL2 = olPts[olPts.length-2];
        const aL = Math.atan2(pL.y - pL2.y, pL.x - pL2.x);
        olPts.push({ x: pL.x + Math.cos(aL)*ext, y: pL.y + Math.sin(aL)*ext });
      }
      bp(makeGeo(olPts, th + cfg.segOutline * 2));
      ctx.fillStyle = olColor;
      ctx.fill();
    }
    for (let i = 0; i < seg.colors.length; i++) {
      const s = seg.splits[i], e = Math.min(seg.splits[i+1] + 1, pts.length);
      const sp = pts.slice(s, e);
      if (sp.length < 2) continue;
      ctx.save(); renderSeg(sp, th, seg.colors[i]); ctx.restore();
    }
    if (cfg.segOutline > 0 && seg.colors.length > 1) {
      ctx.strokeStyle = olColor; ctx.lineCap = "round";
      for (let i = 1; i < seg.splits.length - 1; i++) {
        const idx = Math.min(seg.splits[i], pts.length - 1);
        if (idx <= 0 || idx >= pts.length - 1) continue;
        const pt = pts[idx];
        const ang = Math.atan2(pts[Math.min(idx+1,pts.length-1)].y - pts[Math.max(0,idx-1)].y, pts[Math.min(idx+1,pts.length-1)].x - pts[Math.max(0,idx-1)].x);
        const pp = ang + Math.PI / 2;
        const hw = th / 2;
        ctx.beginPath();
        ctx.moveTo(pt.x + Math.cos(pp)*hw, pt.y + Math.sin(pp)*hw);
        ctx.lineTo(pt.x - Math.cos(pp)*hw, pt.y - Math.sin(pp)*hw);
        ctx.lineWidth = cfg.segOutline * 1.5;
        ctx.stroke();
      }
    }
  }

  if (W * H < 15000000) {
    const img = ctx.getImageData(0, 0, W, H);
    const dd = img.data;
    for (let i = 0; i < dd.length; i += 16) {
      const gr = (rng() - 0.5) * 12;
      dd[i] = Math.max(0, Math.min(255, dd[i]+gr));
      dd[i+1] = Math.max(0, Math.min(255, dd[i+1]+gr));
      dd[i+2] = Math.max(0, Math.min(255, dd[i+2]+gr));
    }
    ctx.putImageData(img, 0, 0);
  }
  return shapes.length;
}

// SVG exporter — generates vector output from same shape data
function generateSVG(seed, cfg, W, H) {
  const { shapes, makeGeo, pal } = computeShapes(seed, cfg, W, H);
  const isDark = pal.bg === "#1A1A2E" || pal.bg === "#1A1714";
  const olColor = isDark ? "#E8E4DD" : "#1A1A1A";

  function geoToPath(geo) {
    const pts = [];
    pts.push("M " + geo.left[0].x.toFixed(2) + " " + geo.left[0].y.toFixed(2));
    for (let i = 1; i < geo.left.length; i++) pts.push("L " + geo.left[i].x.toFixed(2) + " " + geo.left[i].y.toFixed(2));
    for (let i = geo.right.length - 1; i >= 0; i--) pts.push("L " + geo.right[i].x.toFixed(2) + " " + geo.right[i].y.toFixed(2));
    pts.push("Z");
    return pts.join(" ");
  }

  const elements = [];

  for (const sh of shapes) {
    const { pts, th, seg } = sh;

    // Outline
    if (cfg.segOutline > 0) {
      const olPts = [...pts];
      const ext = cfg.segOutline * 1.5;
      if (olPts.length >= 2) {
        const p0 = olPts[0], p1 = olPts[1];
        const a0 = Math.atan2(p0.y - p1.y, p0.x - p1.x);
        olPts.unshift({ x: p0.x + Math.cos(a0)*ext, y: p0.y + Math.sin(a0)*ext });
        const pL = olPts[olPts.length-1], pL2 = olPts[olPts.length-2];
        const aL = Math.atan2(pL.y - pL2.y, pL.x - pL2.x);
        olPts.push({ x: pL.x + Math.cos(aL)*ext, y: pL.y + Math.sin(aL)*ext });
      }
      const olGeo = makeGeo(olPts, th + cfg.segOutline * 2);
      elements.push('<path d="' + geoToPath(olGeo) + '" fill="' + olColor + '"/>');
    }

    // Fill segments
    for (let i = 0; i < seg.colors.length; i++) {
      const s = seg.splits[i], e = Math.min(seg.splits[i+1] + 1, pts.length);
      const sp = pts.slice(s, e);
      if (sp.length < 2) continue;
      const geo = makeGeo(sp, th);
      elements.push('<path d="' + geoToPath(geo) + '" fill="' + seg.colors[i] + '"/>');
    }

    // Divider lines
    if (cfg.segOutline > 0 && seg.colors.length > 1) {
      for (let i = 1; i < seg.splits.length - 1; i++) {
        const idx = Math.min(seg.splits[i], pts.length - 1);
        if (idx <= 0 || idx >= pts.length - 1) continue;
        const pt = pts[idx];
        const ang = Math.atan2(pts[Math.min(idx+1,pts.length-1)].y - pts[Math.max(0,idx-1)].y, pts[Math.min(idx+1,pts.length-1)].x - pts[Math.max(0,idx-1)].x);
        const pp = ang + Math.PI / 2;
        const hw = th / 2;
        const x1 = (pt.x + Math.cos(pp)*hw).toFixed(2);
        const y1 = (pt.y + Math.sin(pp)*hw).toFixed(2);
        const x2 = (pt.x - Math.cos(pp)*hw).toFixed(2);
        const y2 = (pt.y - Math.sin(pp)*hw).toFixed(2);
        elements.push('<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+olColor+'" stroke-width="'+(cfg.segOutline*1.5).toFixed(2)+'" stroke-linecap="round"/>');
      }
    }
  }

  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '">\n' +
    '<rect width="' + W + '" height="' + H + '" fill="' + pal.bg + '"/>\n' +
    elements.join('\n') + '\n</svg>';
}

/* ═══════════════════════════════════════════════════════════════
   UI COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

const SL = ({label, value, onChange, min, max, step=0.01, fmt}) => (
  <div style={{marginBottom:8}}>
    <div style={{display:"flex",justifyContent:"space-between",marginBottom:2}}>
      <span style={{fontSize:10,color:"#888",fontFamily:"mono",textTransform:"uppercase",letterSpacing:".06em"}}>{label}</span>
      <span style={{fontSize:10,color:"#C9A86C",fontFamily:"mono"}}>{fmt ? fmt(value) : value}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      style={{width:"100%",accentColor:"#C9A86C",height:3,cursor:"pointer"}} />
  </div>
);

const SEL = ({label, value, onChange, options, displayFn}) => (
  <div style={{marginBottom:8}}>
    <div style={{fontSize:10,color:"#888",fontFamily:"mono",textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>{label}</div>
    <select value={value} onChange={e => onChange(isNaN(e.target.value) ? e.target.value : parseInt(e.target.value))}
      style={{width:"100%",background:"#1A1A1A",border:"1px solid #333",color:"#DDD",padding:"5px 7px",borderRadius:3,fontSize:11,cursor:"pointer"}}>
      {options.map((o, i) => <option key={o} value={o}>{displayFn ? displayFn(o, i) : o}</option>)}
    </select>
  </div>
);

const SEC = ({title, children}) => (
  <div style={{marginBottom:4}}>
    <div style={{fontFamily:"mono",fontSize:9,color:"#555",textTransform:"uppercase",letterSpacing:".1em",marginBottom:8,borderBottom:"1px solid #1E1E1E",paddingBottom:5}}>{title}</div>
    {children}
  </div>
);

const STEPS = ["Flow field","Noise distortion","Curve tracing","Shape geometry","Spatial hashing","Collision placement","Gap control","Variable scale","Palettes","Segmentation","Stroke variants","Field modifiers","Grain","Feature distribution","Density & fill","User overrides"];

/* ═══════════════════════════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const canvasRef = useRef(null);
  const [seed, setSeed] = useState(42);
  const [cfg, setCfg] = useState(null);
  const [shapeCount, setShapeCount] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState([]);
  const [sz, setSz] = useState({ w: 800, h: 1000 });
  const [claudeSeed, setClaudeSeed] = useState(null);
  const [loadCl, setLoadCl] = useState(false);
  const [showSettings, setShowSettings] = useState(null);
  const [hiResing, setHiResing] = useState(false);

  const initCfg = useCallback(s => { const d = seedDefaults(s); setCfg(d); return d; }, []);

  const doRender = useCallback((s, c, size) => {
    setGenerating(true);
    requestAnimationFrame(() => {
      const cv = canvasRef.current; if (!cv) return;
      cv.width = size.w; cv.height = size.h;
      const n = render(cv, s, c);
      setShapeCount(n); setGenerating(false);
      setHistory(h => {
        if (h.length > 0 && h[0].seed === s && h[0].cfg === c) return h;
        return [{ seed: s, palette: PALETTES[c.palette].name, cfg: { ...c } }, ...h].slice(0, 30);
      });
    });
  }, []);

  const go = useCallback((s, c) => {
    setSeed(s); const conf = c || initCfg(s); setCfg(conf); doRender(s, conf, sz);
  }, [sz, initCfg, doRender]);

  const randomGo = useCallback(() => go(Math.floor(Math.random() * 999999999) + 1), [go]);
  const reRender = useCallback(() => { if (cfg) doRender(seed, cfg, sz); }, [seed, cfg, sz, doRender]);

  const goBack = useCallback(() => {
    if (history.length < 2) return;
    const prev = history[1];
    setSeed(prev.seed); setCfg(prev.cfg);
    doRender(prev.seed, prev.cfg, sz);
  }, [history, sz, doRender]);

  const claudeGo = async () => {
    setLoadCl(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000,
          messages: [{ role: "user", content: 'Pick a random seed 1-999999999 for generative art. Give a poetic 2-4 word title and one-sentence mood. ONLY JSON: {"seed":NUMBER,"title":"STRING","mood":"STRING"}' }]
        }),
      });
      const dd = await resp.json();
      const txt = dd.content[0].text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(txt);
      setClaudeSeed(parsed); go(parsed.seed);
    } catch { randomGo(); }
    setLoadCl(false);
  };

  useEffect(() => { randomGo(); }, []);

  const up = (key, val) => setCfg(c => ({ ...c, [key]: val }));

  // Downloads — local version uses Blob for reliable large file downloads
  const downloadPng = () => {
    try {
      const cv = canvasRef.current; if (!cv) return;
      cv.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "fidenza-" + seed + "-" + cv.width + "x" + cv.height + ".png";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    } catch (e) { console.error(e); }
  };

  // Hi-res: render to offscreen canvas, download via Blob
  const [renderSize, setRenderSize] = useState(null);
  const downloadHiRes = (w, h) => {
    if (!cfg) return;
    setHiResing(true);
    setRenderSize({ w, h });
    setTimeout(() => {
      try {
        const off = document.createElement("canvas");
        off.width = w; off.height = h;
        render(off, seed, cfg);
        off.toBlob(blob => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "fidenza-" + seed + "-" + w + "x" + h + ".png";
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          setHiResing(false);
          setRenderSize(null);
        }, "image/png");
      } catch (e) {
        console.error(e);
        setHiResing(false);
        setRenderSize(null);
      }
    }, 50);
  };
  const restorePreview = () => {
    setRenderSize(null);
    if (cfg) doRender(seed, cfg, sz);
  };

  // Save settings as JSON file download
  const openSave = () => {
    const data = JSON.stringify({ seed, cfg, canvasSize: sz }, null, 2);
    const blob = new window.Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "fidenza-" + seed + "-settings.json";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };
  // Load settings from JSON file
  const fileInputRef = useRef(null);
  const openLoad = () => { fileInputRef.current?.click(); };
  const handleFileLoad = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.seed) setSeed(parsed.seed);
        if (parsed.cfg) setCfg(parsed.cfg);
        if (parsed.canvasSize) setSz(parsed.canvasSize);
        if (parsed.seed && parsed.cfg) doRender(parsed.seed, parsed.cfg, parsed.canvasSize || sz);
      } catch (err) { console.error("Invalid settings file", err); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // SVG export — generates vector art and downloads as .svg file
  const [svgGenerating, setSvgGenerating] = useState(false);
  const exportSVG = () => {
    if (!cfg) return;
    setSvgGenerating(true);
    setTimeout(() => {
      try {
        const svgStr = generateSVG(seed, cfg, sz.w, sz.h);
        const blob = new window.Blob([svgStr], { type: "image/svg+xml" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.download = "fidenza-" + seed + ".svg";
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
      } catch (e) { console.error(e); }
      setSvgGenerating(false);
    }, 50);
  };

  const badge = (l, v, co = "#888") => (
    <span key={l} style={{ display:"inline-block", padding:"2px 7px", margin:"1px 3px 1px 0", borderRadius:3, fontSize:9.5, fontFamily:"mono", background:co+"15", color:co, border:"1px solid "+co+"25" }}>
      <span style={{ opacity:0.6, marginRight:3 }}>{l}</span>{v}
    </span>
  );

  const btnStyle = (color, border) => ({
    flex:1, padding:"9px", background:"transparent", color, border:"1px solid "+(border||"#333"),
    borderRadius:4, fontFamily:"sans-serif", fontSize:11, cursor:"pointer"
  });

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", color:"#E8E4DD" }}>
      <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@300;400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />

      <div style={{ padding:"20px 24px 0", maxWidth:1500, margin:"0 auto" }}>
        <h1 style={{ fontSize:30, fontWeight:400, margin:0, letterSpacing:"-.02em", color:"#F5F0E8", fontFamily:"'Instrument Serif',serif" }}>
          Flow Field Generator
        </h1>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#555", margin:"2px 0 14px" }}>
          {shapeCount} shapes &middot; seed {seed}
        </p>
      </div>

      <div style={{ display:"flex", maxWidth:1500, margin:"0 auto", padding:"0 24px 40px", gap:20, flexWrap:"wrap" }}>

        {/* Canvas */}
        <div style={{ flex:"1 1 420px", minWidth:260 }}>
          <div style={{ position:"relative", background:"#151515", borderRadius:5, overflow:"hidden", border:"1px solid #222" }}>
            <canvas ref={canvasRef} style={{ width:"100%", height:"auto", display:"block" }} />
            {generating && <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(13,13,13,.85)", fontFamily:"mono", fontSize:12, color:"#999" }}>Rendering...</div>}
          </div>
          {cfg && <div style={{ marginTop:6, lineHeight:2 }}>
            {badge("seed", seed, "#C9A86C")}
            {badge("palette", PALETTES[cfg.palette].name, "#7BA092")}
            {badge("shapes", shapeCount, "#A0957B")}
            {badge("stroke", cfg.stroke, "#8B7BA0")}
            {badge("thick", cfg.thickCenter+"px", "#A07B7B")}
          </div>}
          {claudeSeed && <div style={{ marginTop:10, padding:"10px 14px", background:"#161616", borderRadius:5, border:"1px solid #252525" }}>
            <div style={{ fontStyle:"italic", fontSize:17, color:"#D4C8B0", fontFamily:"'Instrument Serif',serif" }}>&ldquo;{claudeSeed.title}&rdquo;</div>
            <div style={{ fontSize:10, color:"#666" }}>{claudeSeed.mood}</div>
          </div>}
        </div>

        {/* Controls */}
        <div style={{ flex:"0 0 230px", minWidth:210, maxHeight:"calc(100vh - 100px)", overflowY:"auto", paddingRight:6 }}>

          {/* Seed */}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:"#888", fontFamily:"mono", textTransform:"uppercase", marginBottom:3 }}>Seed</div>
            <div style={{ display:"flex", gap:4 }}>
              <input type="number" value={seed} onChange={e => setSeed(parseInt(e.target.value) || 1)}
                onKeyDown={e => { if (e.key === "Enter") go(seed); }}
                style={{ flex:1, background:"#1A1A1A", border:"1px solid #333", color:"#C9A86C", padding:"8px 10px", borderRadius:4, fontSize:13, fontFamily:"mono", width:0, minWidth:0 }} />
              <button onClick={() => go(seed)} style={{ padding:"8px 14px", background:"#252525", color:"#C9A86C", border:"1px solid #3A3020", borderRadius:4, fontSize:11, cursor:"pointer" }}>Go</button>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
            <button onClick={claudeGo} disabled={loadCl}
              style={{ padding:"11px 16px", background:loadCl?"#1A1A1A":"#C9A86C", color:loadCl?"#666":"#0D0D0D", border:"none", borderRadius:4, fontSize:12, fontWeight:500, cursor:loadCl?"wait":"pointer" }}>
              {loadCl ? "Curating..." : "Generate via Claude"}
            </button>
            <div style={{ display:"flex", gap:5 }}>
              <button onClick={randomGo} style={btnStyle("#999")}>Random</button>
              <button onClick={goBack} disabled={history.length<2}
                style={btnStyle(history.length<2?"#333":"#C9A86C", history.length<2?"#222":"#3A3020")}>← Back</button>
            </div>
            <div style={{ display:"flex", gap:5 }}>
              <button onClick={reRender} style={btnStyle("#C9A86C","#3A3020")}>Re-render</button>
              <button onClick={downloadPng} style={btnStyle("#888")}>PNG</button>
            </div>
            <div style={{ display:"flex", gap:5 }}>
              <button onClick={openSave} style={btnStyle("#7BA092","#2A3A30")}>Save Settings</button>
              <button onClick={openLoad} style={btnStyle("#7BA092","#2A3A30")}>Load Settings</button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileLoad} style={{ display:"none" }} />
            </div>
            <div style={{ marginTop:2 }}>
              <div style={{ fontSize:9, color:"#555", fontFamily:"mono", textTransform:"uppercase", marginBottom:4 }}>Print Download</div>
              <div style={{ display:"flex", gap:4 }}>
                {[{l:"2K",w:2000,h:2500},{l:"4K",w:4000,h:5000},{l:"6×4ft",w:10800,h:7200}].map(s =>
                  <button key={s.l} onClick={() => downloadHiRes(s.w,s.h)} disabled={hiResing}
                    style={{ flex:1, padding:"7px 4px", background:"#1E1E1E", color:hiResing?"#333":"#C9A86C", border:"1px solid #2A2A2A", borderRadius:3, fontFamily:"mono", fontSize:9, cursor:hiResing?"wait":"pointer" }}>
                    {hiResing ? "..." : s.l}
                  </button>
                )}
              </div>
              {renderSize && !hiResing && (
                <div style={{ marginTop:6 }}>
                  <div style={{ fontSize:9, color:"#7BA092", fontFamily:"mono", marginBottom:4 }}>
                    Rendered at {renderSize.w}×{renderSize.h}. Right-click the image → Save Image As
                  </div>
                  <button onClick={restorePreview} style={{ width:"100%", padding:"7px", background:"transparent", color:"#C9A86C", border:"1px solid #3A3020", borderRadius:3, fontFamily:"mono", fontSize:9, cursor:"pointer" }}>
                    ← Back to preview
                  </button>
                </div>
              )}
              {hiResing && <div style={{ fontSize:9, color:"#888", fontFamily:"mono", marginTop:4 }}>Rendering... this may take a moment</div>}
              <button onClick={exportSVG} disabled={svgGenerating}
                style={{ width:"100%", marginTop:6, padding:"9px", background:"#1E1E1E", color:svgGenerating?"#555":"#7BA092", border:"1px solid #2A3A30", borderRadius:3, fontFamily:"mono", fontSize:10, cursor:svgGenerating?"wait":"pointer", fontWeight:"bold" }}>
                {svgGenerating ? "Generating SVG..." : "Export SVG (vector — infinite scale)"}
              </button>
            </div>
          </div>

          {cfg && <>
            <SEC title="Shape Controls">
              <SL label="Gap / Spacing" value={cfg.gap} min={0} max={5} step={0.05} fmt={v => v.toFixed(2)} onChange={v => up("gap",v)} />
              <SL label="Density" value={cfg.density} min={0.1} max={4} step={0.05} fmt={v => v.toFixed(2)} onChange={v => up("density",v)} />
              <SL label="Fill Passes" value={cfg.fillPasses} min={1} max={5} step={1} onChange={v => up("fillPasses",v)} />
              <SL label="Curve Length" value={cfg.curveLen} min={5} max={150} step={1} onChange={v => up("curveLen",v)} />
            </SEC>

            <SEC title="Thickness">
              <SL label="Center (bias)" value={cfg.thickCenter} min={3} max={100} step={1} fmt={v => v+"px"} onChange={v => up("thickCenter",v)} />
              <SL label="Spread" value={cfg.thickSpread} min={0} max={40} step={1} onChange={v => up("thickSpread",v)} />
              <SL label="Variation" value={cfg.thickVariation} min={0} max={1} step={0.05} fmt={v => Math.round(v*100)+"%"} onChange={v => up("thickVariation",v)} />
              <SL label="Min Floor" value={cfg.thickFloor} min={1} max={20} step={1} fmt={v => v+"px"} onChange={v => up("thickFloor",v)} />
              <SL label="Global Mult" value={cfg.thickMult} min={0.2} max={4} step={0.05} fmt={v => v.toFixed(2)+"×"} onChange={v => up("thickMult",v)} />
            </SEC>

            <SEC title="Segmentation">
              <SL label="Probability" value={cfg.segProb} min={0} max={1} step={0.01} fmt={v => Math.round(v*100)+"%"} onChange={v => up("segProb",v)} />
              <SL label="Min Segments" value={cfg.segMin} min={1} max={6} step={1} onChange={v => up("segMin",v)} />
              <SL label="Max Segments" value={cfg.segMax} min={2} max={8} step={1} onChange={v => up("segMax",v)} />
              <SL label="End Bias" value={cfg.segEndBias} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} onChange={v => up("segEndBias",v)} />
              <SL label="Coherence" value={cfg.segCoherence} min={0} max={1} step={0.05} fmt={v => v.toFixed(2)} onChange={v => up("segCoherence",v)} />
              <SL label="Outline" value={cfg.segOutline} min={0} max={4} step={0.1} fmt={v => v.toFixed(1)} onChange={v => up("segOutline",v)} />
            </SEC>

            <SEC title="Flow Field">
              <SL label="Turbulence" value={cfg.turbulence} min={0} max={5} step={0.1} fmt={v => v.toFixed(1)} onChange={v => up("turbulence",v)} />
              <SL label="Octaves" value={cfg.octaves} min={1} max={6} step={1} onChange={v => up("octaves",v)} />
              <SL label="Persistence" value={cfg.persistence} min={0.1} max={0.8} step={0.02} fmt={v => v.toFixed(2)} onChange={v => up("persistence",v)} />
              <SEL label="Angles" value={cfg.angle} onChange={v => up("angle",v)} options={ANGLE_NAMES} />
              <SEL label="Spiral" value={cfg.spiral} onChange={v => up("spiral",v)} options={SPIRAL_NAMES} />
            </SEC>

            <SEC title="Style">
              <SEL label="Stroke" value={cfg.stroke} onChange={v => up("stroke",v)} options={STROKE_NAMES} />
              <SEL label="Palette" value={cfg.palette} onChange={v => up("palette",parseInt(v))} options={PALETTES.map((_,i) => i)} displayFn={(_,i) => PALETTES[i].name} />
            </SEC>
          </>}

          {/* Canvas size */}
          <div style={{ marginTop:10 }}>
            <div style={{ fontFamily:"mono", fontSize:9, color:"#444", textTransform:"uppercase", marginBottom:5 }}>Canvas</div>
            <div style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
              {[{l:"800×1000",w:800,h:1000},{l:"1000²",w:1000,h:1000},{l:"1200×800",w:1200,h:800}].map(s =>
                <button key={s.l} onClick={() => { setSz({w:s.w,h:s.h}); if(cfg) setTimeout(() => doRender(seed,cfg,{w:s.w,h:s.h}), 30); }}
                  style={{ padding:"3px 7px", background:sz.w===s.w&&sz.h===s.h?"#252525":"transparent", color:sz.w===s.w&&sz.h===s.h?"#C9A86C":"#555", border:"1px solid #282828", borderRadius:3, fontFamily:"mono", fontSize:9, cursor:"pointer" }}>
                  {s.l}
                </button>
              )}
            </div>
          </div>

          {/* Steps */}
          <div style={{ marginTop:12 }}>
            <div style={{ fontFamily:"mono", fontSize:8, color:"#333", textTransform:"uppercase", marginBottom:4 }}>16 Steps</div>
            {STEPS.map((s, i) => <div key={i} style={{ display:"flex", gap:5, padding:"1.5px 0", fontSize:9, color:"#3A3A3A" }}>
              <span style={{ fontFamily:"mono", fontSize:8, color:"#2A2A2A", width:14, textAlign:"right" }}>{String(i+1).padStart(2,"0")}</span>{s}
            </div>)}
          </div>

          {/* History */}
          {history.length > 1 && <div style={{ marginTop:12 }}>
            <div style={{ fontFamily:"mono", fontSize:8, color:"#444", textTransform:"uppercase", marginBottom:5 }}>History</div>
            {history.slice(0, 10).map((h, i) =>
              <button key={h.seed+"-"+i} onClick={() => { setSeed(h.seed); setCfg(h.cfg); doRender(h.seed, h.cfg, sz); }}
                style={{ display:"block", width:"100%", textAlign:"left", padding:"4px 7px", marginBottom:2, background:h.seed===seed?"#1E1E1E":"transparent", border:"1px solid #1A1A1A", borderRadius:3, fontFamily:"mono", fontSize:9, color:h.seed===seed?"#C9A86C":"#555", cursor:"pointer" }}>
                <span>#{h.seed}</span><span style={{ float:"right", color:"#333" }}>{h.palette}</span>
              </button>
            )}
          </div>}
        </div>
      </div>

      {/* SVG Modal - only used if svgData exists (not in local version) */}
    </div>
  );
}
