// ============================================================================
// world layout + procedural content generation (load-time only)
// ============================================================================

// designed rock masses: ax, az, bx, bz, radius, top, overhang, waist
const MESAS = [
  [-37, -42, -33, -22, 9, -7, 3.5, 2], [-29, -15, -33, 5, 12, -14, 3, 2], [-36, 11, -30, 27, 9, -5, 4, 2],   // west wall of the main canyon
  [30, -45, 35, -27, 9, -9, 4, 2], [37, -20, 31, -3, 11, -16, 3, 2], [32, 5, 35, 9, 7, -8, 4, 2],          // east wall
  [19, -15, 19, -15, 4.4, -6, 2, 1.5],   // pillar with window
  [6, -88, 6, -88, 10, -34, 0, 0],       // mound in the kelp basin
  [0, -106, 0, -106, 8, 3, 2, 2],        // pillar reaching the surface
  [44, 6, 47, -8, 7, -17, 3, 1],         // ship supports
  [33, 29, 37, 12, 9, -19, -6.5, 0],     // sloped sunlit wall beside the wreck
  [74, 14, 74, 14, 8, -15, 3, 1],
  [-84, -34, -80, -12, 10, -7, 6, 2], [-78, -6, -83, 12, 12, -13, 5, 2], [-82, 18, -79, 32, 9, -8, 6, 2],   // sponge canyon west wall
  [-17, 62, -19, 78, 10, -6, 9, 3], [-21, 84, -18, 100, 11, -9, 8, 3],     // grotto overhang cliff
  [22, 67, 24, 80, 7, -11, 6, 2],        // grotto coral rock
  [-16, 122, 34, 122, 9, -27, 3, 2],     // grotto far wall
  // Ocean City: a raised platform the city stands on, plus rock cores inside the
  // spire, statue, gate posts and the four big towers, so the fish cannot swim through them
  // (each core is narrower than the shell around it, so the rock stays hidden inside)
  [80, -15, 110, 15, 28, -38, 3, 1],     // city platform
  [95, 0, 95, 0, 3, -12, 3, 1],          // spire core (shell 3.5 wide there)
  [120, -20, 120, -20, 2.5, -30, 3, 1],  // statue core (shell 2.8 wide there)
  [60, 20, 60, 20, 1.2, -18, 3, 1],      // gate post cores (inside the 1.5 ring tube)
  [80, 20, 80, 20, 1.2, -18, 3, 1],
  [85, 25, 85, 25, 1.8, -22, 3, 1],      // tower cores (shell 2.1 wide there)
  [105, -25, 105, -25, 1.8, -22, 3, 1],
  [125, 5, 125, 5, 1.8, -22, 3, 1],
  [75, -5, 75, -5, 1.8, -22, 3, 1],
  // Ocean City v2.7: the Abyssal District, a second high-tech ruins district in the deep southwest,
  // same pattern as the first city - platform, rock cores inside the tall shells (narrower than the shell)
  [-145, -135, -115, -105, 28, -38, 3, 1], // abyssal platform
  [-130, -120, -130, -120, 3, -12, 3, 1],  // abyssal spire core
  [-105, -140, -105, -140, 2.5, -30, 3, 1], // deep statue core
  [-165, -100, -165, -100, 1.2, -18, 3, 1], // abyss gate post cores
  [-145, -100, -145, -100, 1.2, -18, 3, 1],
  [-100, -120, -100, -120, 1.8, -22, 3, 1], // abyssal tower cores
  [-160, -120, -160, -120, 1.8, -22, 3, 1],
  [-130, -150, -130, -150, 1.8, -22, 3, 1],
];
// vertical ring arches: cx, cy, cz, yaw, major radius, minor radius, y squash
const ARCHES = [
  [-23, -9.5, -16, 0.3, 4.2, 1.4, 1.2],
  [0, -45, -34, 1.57, 14, 2.7, 1.2],
  [-40, -45, 44, 1.57, 10, 2.2, 1.3],
];
// carved tunnels: ax, ay, az, radius, bx, by, bz
const HOLES = [
  [19, -21, -23, 2.5, 19, -21, -7],
  [9, -37, 108, 4.2, 9, -34, 136],
];
// regions kept free of random mesas: ax, az, bx, bz, radius, softness
const CLEARS = [
  [0, -45, 0, 35, 22, 10], [0, -86, 0, -86, 46, 12], [42, 24, 74, 6, 22, 10], [72, -26, 72, -26, 26, 10],
  [-60, -36, -60, 36, 13, 8], [-60, 42, -18, 46, 12, 8], [4, 58, 8, 100, 24, 10], [-34, -74, -56, -46, 11, 8],
  [80, -15, 110, 15, 28, 10], // Ocean City: keep random mesas out of the city
  [-145, -135, -115, -105, 28, 10], // v2.7: keep random mesas out of the Abyssal District
];
const PURPLE = [6, 84];
const zoneP = (x, z) => sstep(44, 26, hypot(x - PURPLE[0], z - PURPLE[1]));
const MAGENTA = [[14, 6, 13], [-4, 20, 9], [6, 84, 30], [-58, 8, 10], [50, 30, 12], [8, -70, 10], [-12, -98, 9], [-36, 44, 9], [-46, -60, 9], [24, 42, 8], [-56, 26, 9], [-44, 38, 8], [-10, 44, 8], [12, 24, 8], [-50, -45, 8]];
const magAt = (x, z) => {
  let m = sstep(0.54, 0.66, fbm(x * 0.03, 7, z * 0.03, 3)) * 0.9;
  for (const p of MAGENTA) m = max(m, sstep(p[2], p[2] * 0.45, hypot(x - p[0], z - p[1])));
  return m * sstep(0.3, 0.55, fbm(x * 0.17, 1, z * 0.17, 2) + m * 0.25);
};

function primBuffer() {
  const a = [];
  for (const m of MESAS) a.push(m[0], m[1], m[2], m[3], m[4], m[5], m[6], m[7]);
  for (const m of ARCHES) a.push(m[0], m[1], m[2], m[3], m[4], m[5], m[6], 0);
  for (const m of HOLES) a.push(m[0], m[1], m[2], m[3], m[4], m[5], m[6], 0);
  for (const m of CLEARS) a.push(m[0], m[1], m[2], m[3], m[4], m[5], 0, 0);
  return new Float32Array(a);
}

// ---------------------------------------------------------------- terrain mesh from the density grid
function buildTerrain(D) {
  const sn = surfaceNets(D, NX, NY, NZ), nv = sn.nv, gp = sn.pos;
  const smp = sampler3(D, NX, NY, NZ);
  const vb = new ArrayBuffer(nv * 16), vf = new Float32Array(vb), v8 = new Int8Array(vb);
  const wp = new Float32Array(nv * 3), wn = new Float32Array(nv * 3);
  for (let k = 0; k < nv; k++) {
    const x = gp[k * 3], y = gp[k * 3 + 1], z = gp[k * 3 + 2], e = 0.8;
    let nx = smp(x - e, y, z) - smp(x + e, y, z), ny = smp(x, y - e, z) - smp(x, y + e, z), nz = smp(x, y, z - e) - smp(x, y, z + e);
    const l = hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const X = OX + x * VS, Y = OY + y * VS, Z = OZ + z * VS;
    wp[k * 3] = vf[k * 4] = X; wp[k * 3 + 1] = vf[k * 4 + 1] = Y; wp[k * 3 + 2] = vf[k * 4 + 2] = Z;
    wn[k * 3] = nx; wn[k * 3 + 1] = ny; wn[k * 3 + 2] = nz;
    v8[k * 16 + 12] = round(nx * 127); v8[k * 16 + 13] = round(ny * 127); v8[k * 16 + 14] = round(nz * 127); v8[k * 16 + 15] = 127;
  }
  // bucket quads into the XZ culling grid
  const nq = sn.ni / 6, key = new Uint8Array(nq), cnt = new Uint32Array(CELLS * CELLS + 1);
  const lo = new Float32Array(CELLS * CELLS).fill(1e9), hi = new Float32Array(CELLS * CELLS).fill(-1e9);
  for (let q = 0; q < nq; q++) {
    const a = sn.idx[q * 6] * 3;
    const c = clamp(floor((wp[a] - OX) / CELLW), 0, CELLS - 1) + CELLS * clamp(floor((wp[a + 2] - OZ) / CELLW), 0, CELLS - 1);
    key[q] = c; cnt[c + 1]++;
    for (let j = 0; j < 6; j++) { const y = wp[sn.idx[q * 6 + j] * 3 + 1]; if (y < lo[c]) lo[c] = y; if (y > hi[c]) hi[c] = y; }
  }
  for (let c = 0; c < CELLS * CELLS; c++) cnt[c + 1] += cnt[c];
  const ib = new Uint32Array(sn.ni), fill = cnt.slice();
  for (let q = 0; q < nq; q++) { const o = fill[key[q]]++ * 6; for (let j = 0; j < 6; j++) ib[o + j] = sn.idx[q * 6 + j]; }
  return { vb, ib, nv, wp, wn, smp, start: cnt, lo, hi };
}

// ---------------------------------------------------------------- instance stores
function makeWorld(D, T, flyPts, POSES) {
  const gi = (x, y, z) => x + NX * (y + NY * z);
  const smp = T.smp;
  const Dw = (x, y, z) => smp((x - OX) / VS, (y - OY) / VS, (z - OZ) / VS);
  const nCells = CELLS * CELLS;
  const cellOf = (x, z) => clamp(floor((x - OX) / CELLW), 0, CELLS - 1) + CELLS * clamp(floor((z - OZ) / CELLW), 0, CELLS - 1);
  const big = Array.from({ length: nCells }, () => []), small = Array.from({ length: nCells }, () => []);
  // Medium and Low keep every 2nd / 4th leaf (but every kelp stem), made wider; the random stream is the same
  let nth = 0;
  const leaf = (L, x, y, z, len, yaw, tilt, wid, hA, type, s1, s2, bend) => { if (type === 1 || !(nth++ % THIN)) L[cellOf(x, z)].push(x, y, z, len, yaw, tilt, type === 1 ? wid : wid * (1 + LV / 2), hA, type, s1, s2, bend); };
  const glint = (...a) => { nth++ % THIN || glints.push(...a); };
  const solids = []; // per mesh id: arrays of 12 floats
  const props = Array.from({ length: 6 }, () => Array.from({ length: nCells }, () => []));
  const solid = (mesh, x, y, z, sc, q, mat, seed, ts = 1, bob = 0) => { (mesh > 3 && mesh < 10 ? props[mesh - 4][cellOf(x, z)] : (solids[mesh] ||= [])).push(x, y, z, sc, q[0], q[1], q[2], q[3], mat, seed, ts, bob); };
  const chunks = Array.from({ length: NCHUNK }, () => Array.from({ length: nCells }, () => []));
  const glints = [];
  const rel = (i, f, r) => { const p = POSES[i]; let fx = p[3] - p[0], fz = p[5] - p[2]; const l = hypot(fx, fz); fx /= l; fz /= l; return [p[0] + fx * f - fz * r, p[2] + fz * f + fx * r]; };
  const bubbles = [], kelpAbs = new Float32Array((NX / 2) * (NY / 2) * (NZ / 2));

  // --- surface queries
  const fl = [];
  const floorsAt = (x, z) => {
    const ix = clamp(round((x - OX) / VS), 1, NX - 2), iz = clamp(round((z - OZ) / VS), 1, NZ - 2);
    fl.length = 0; let ceil = 3;
    for (let gy = NY - 2; gy >= 0; gy--) {
      const d = D[gi(ix, gy, iz)], da = D[gi(ix, gy + 1, iz)];
      if (da <= 0 && d > 0) { const y = OY + (gy + d / (d - da)) * VS; fl.push(y, min(ceil, 0) - y); } else if (da > 0 && d <= 0) ceil = OY + (gy + 0.5) * VS;
    }
    return fl;
  };
  const grad = (x, y, z) => {
    const e = 0.6; let nx = Dw(x - e, y, z) - Dw(x + e, y, z), ny = Dw(x, y - e, z) - Dw(x, y + e, z), nz = Dw(x, y, z - e) - Dw(x, y, z + e);
    const l = hypot(nx, ny, nz) || 1; return [nx / l, ny / l, nz / l];
  };
  // march from outside along -n to the surface
  const snap = (x, y, z, n) => {
    let px = x + n[0] * 2.5, py = y + n[1] * 2.5, pz = z + n[2] * 2.5, prev = Dw(px, py, pz);
    if (prev > 0) return null;
    for (let i = 0; i < 24; i++) {
      const qx = px - n[0] * 0.25, qy = py - n[1] * 0.25, qz = pz - n[2] * 0.25, d = Dw(qx, qy, qz);
      if (d > 0) { const t = prev / (prev - d); const p = [mix(px, qx, t), mix(py, qy, t), mix(pz, qz, t)]; return p.concat(grad(p[0], p[1], p[2])); }
      px = qx; py = qy; pz = qz; prev = d;
    }
    return null;
  };
  const pickV = () => ((rnd() * T.nv) | 0) * 3;
  const tangent = (n) => { let t = abs(n[1]) < 0.9 ? [n[2], 0, -n[0]] : [1, 0, 0]; const l = hypot(...t); t = t.map((v) => v / l); return [t, [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]]]; };
  const nearFly = (x, y, z, r) => { for (const p of flyPts) if (hypot(x - p[0], z - p[2]) < r && y < p[1] + 3 && y > p[1] - 13) return true; return false; };
  const nearPose = (x, z, r = 3) => { for (const p of POSES) if (hypot(x - p[0], z - p[2]) < r) return true; return false; };
  // --- kelp columns
  const column = (x, y, z, H, kind, dens = 1) => {
    const strands = 2 + (rnd() < 0.6) + (rnd() < 0.3), ph = rnd() * TAU, tw = rr(0.1, 0.28), sr = rr(0.2, 0.55), sc = rr(0.75, 1.25);
    const la = rnd() * TAU, lm = rr(0, 0.11), full = rr(0.55, 1.3) * dens;
    const stem = (s, h) => { const a = ph + s * TAU / strands + h * tw, r = sr * (1 - 0.6 * h / H), ln = lm * h * h / H; return [x + cos(a) * r + cos(la) * ln, z + sin(a) * r + sin(la) * ln, a]; };
    for (let s = 0; s < strands; s++) for (let h = 0; h < H - 1; h += 1.7) { const p = stem(s, h); leaf(big, p[0], y + h, p[1], 2.1, p[2] + PI / 2, 0.1, 0.17, h, 1, rnd(), rnd(), 0.3); }
    const n = floor(H * 30 * full);
    for (let i = 0; i < n; i++) {
      const t = pow(rnd(), 0.9), h = t * H, p = stem((rnd() * strands) | 0, h);
      const L = ((0.55 + 0.75 * rnd() * rnd()) * (1 - 0.5 * t * t) * sc + 0.25) * (kind === 1 ? 1.25 : 1.15);
      const tilt = mix(rr(0.4, 1.0), rr(0.15, 0.45), t);
      const type = kind === 1 ? (rnd() < 0.8 ? 3 : 4) : kind === 2 ? (rnd() < 0.5 ? 4 : 0) : 0;
      leaf(big, p[0], y + h, p[1], L, rnd() * TAU, tilt, L * (kind === 1 ? rr(0.09, 0.13) : rr(0.15, 0.21)) + 0.03, h, type, rnd(), rnd(), rr(0.38, 0.95));
    }
    for (let i = floor(H * (kind === 1 ? 16 : 13)); i > 0; i--) { const h = rnd() * H, a = rnd() * TAU, r = rr(0.15, 0.8) * (1 - 0.5 * h / H), ln = lm * h * h / H; glint(x + cos(a) * r + cos(la) * ln, y + h, z + sin(a) * r + sin(la) * ln, h, rnd(), kind === 1 ? rnd() : rnd() * 0.6, rr(0.018, 0.05), 0); }
    // light absorption footprint for the skylight bake
    const hx = round((x - OX) / VS / 2), hz = round((z - OZ) / VS / 2);
    for (let hy = floor((y - OY) / VS / 2); hy <= floor((y + H - OY) / VS / 2); hy++) {
      if (hy >= 0 && hy < NY / 2 && hx > 0 && hx < NX / 2 - 1 && hz > 0 && hz < NZ / 2 - 1) kelpAbs[hx + NX / 2 * (hy + NY / 2 * hz)] += 0.17;
    }
  };
  const KELPZ = [[-32, -5, 13, 0.85], [0, -86, 46, 1], [72, -26, 27, 0.9], [-60, -4, 11, 0.8], [0, -36, 12, 0.55], [-17, -8, 6, 0.8], [15, -8, 6, 0.8], [-4, 120, 20, 0.4], [-45, -63, 15, 0.9], [62, -26, 12, 0.9], [-100, 70, 30, 0.8], [100, 60, 30, 0.8], [-95, -90, 32, 0.8], [105, -85, 30, 0.7]];
  const NOKELP = [[-5, -106.5, 8], [4.6, -109.4, 10], [14.2, -112.3, 12], [-26, -100, 6], [-20.5, -101.7, 4.5], [-14.8, -104.5, 6], [-7.5, -107.8, 7], [4, 112, 11], [2, 4, 15], [42, 22, 12], [6, 78, 19], [-58, -16, 8], [9, -66, 9], [8, -76, 8]];
  const kelpDens = (x, z) => {
    for (const p of NOKELP) if (hypot(x - p[0], z - p[1]) < p[2]) return 0;
    let d = sstep(0.52, 0.64, fbm(x * 0.022, 4, z * 0.022, 3)) * 0.5;
    for (const p of KELPZ) d = max(d, p[3] * sstep(p[2], p[2] * 0.75, hypot(x - p[0], z - p[1])));
    return d;
  };
  const occ = new Set();
  rseed(1);
  const tryColumn = (x, z, kind, force, dens = 1) => {
    const key = floor(x / 2.3) * 4096 + floor(z / 2.3);
    if (occ.has(key)) return;
    const f = floorsAt(x, z); const c = [];
    for (let i = 0; i < f.length; i += 2) if (f[i + 1] > 9) c.push(i);
    if (!c.length) return;
    const i = c[(rnd() * c.length) | 0], y = f[i];
    if (grad(x, y, z)[1] < 0.55) return;
    if (!force && flyPts.some((p) => hypot(x - p[0], z - p[2]) < 5)) return;
    occ.add(key);
    column(x, y - 0.3, z, min(f[i + 1] - rr(0.8, 5), force ? rr(30, 42) : rr(15, 40)), kind, dens);
  };
  // hand-placed columns framing the viewpoints: x, z, kind, density
  for (const p of [[...rel(0, 11, -8.5), 0], [...rel(0, 16, -10.5), 0], [...rel(0, 21, -9), 0], [...rel(0, 9, 7), 0], [...rel(0, 14, 9.5), 0], [...rel(0, 19, 8), 0], [...rel(0, 26, 6), 0],
    [...rel(5, 6.5, 5.2), 1], [...rel(5, 12, 7), 1], [...rel(5, 15, -8), 0], [...rel(5, 22, -5), 1], [...rel(3, 12, -5.5), 0], [...rel(3, 16, 5.5), 0], [...rel(3, 20, -4.5), 0], [...rel(3, 25, 6), 0], [...rel(3, 13, 8), 0], [...rel(3, 30, -7), 0], [24, 62, 1], [-6, 96, 1], [20, 96, 2], [-10, 70, 0], [16, 52, 1],
    [...rel(4, 15, -9), 0, 1.2], [...rel(4, 19, -13), 0, 1.2], [...rel(4, 23, -8.5), 0, 1.2], [...rel(4, 25, -15), 0, 1.2],
    [...rel(4, 25, 0.5), 2, 1.2], [...rel(4, 27, -3), 2, 1.2], [...rel(4, 28, 3.5), 2, 1.2], [...rel(4, 31, 0), 0, 1.3], [...rel(4, 33, -5), 0, 1.3], [...rel(4, 33, 5), 0, 1.3], [...rel(4, 21, 9), 0, 1.2], [...rel(4, 27, 11), 0, 1.2],
    [...rel(2, 6.5, -5.5), 0, 1.5], [...rel(2, 9.5, -8), 0, 1.3], [...rel(2, 8, 6), 0, 1.4], [...rel(2, 12, 3.6), 0, 1.3], [...rel(2, 17, -2.5), 0, 1.2], [...rel(2, 21, 4), 0, 1.2], [...rel(2, 12, -4.5), 2, 1.2], [...rel(2, 27, -9), 0, 1.2], [...rel(2, 30, 8.5), 0, 1.2], [...rel(2, 37, -3), 0, 1.1],
    [...rel(2, 13.5, 6.5), 0, 1.3], [...rel(2, 14.5, -7), 0, 1.3], [...rel(2, 6.5, 6.5), 0, 1.3], [...rel(2, 9, -8), 2, 1.3]]) tryColumn(p[0], p[1], p[2], true, p[3]);
  // random columns across the world
  rseed(2);
  for (let i = 0; i < 15000; i++) {
    const a = rnd() * TAU, r = sqrt(rnd()) * 188, x = cos(a) * r, z = sin(a) * r;
    if (rnd() < kelpDens(x, z)) tryColumn(x, z, zoneP(x, z) > 0.5 && rnd() < 0.5 ? 1 : rnd() < 0.03 ? 2 : 0);
  }

  // --- clusters of ribbon leaves on the ground
  const cluster = (x, y, z, n, type, lmin, lmax, wmin, wmax, tmax, sway) => {
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU, r = rnd() * 0.5, L = rr(lmin, lmax);
      leaf(big, x + cos(a) * r, y - 0.15, z + sin(a) * r, L, a, rr(0.05, tmax), rr(wmin, wmax), sway, type, rnd(), rnd(), rr(0.3, 0.8));
    }
  };
  const HOT = [[0, 5, 30], [42, 30, 24], [6, 82, 34], [-58, 10, 24], [4, -88, 30], [-36, 44, 18], [-46, -60, 20]];
  const hot = (x, z) => { let h = 0.4; for (const p of HOT) h = max(h, sstep(p[2], p[2] * 0.4, hypot(x - p[0], z - p[1]))); return h; };
  rseed(3);
  for (let i = 0; i < 40000; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
    if (hypot(x, z) > 188 || y > -6) continue;
    const h = hot(x, z), zp = zoneP(x, z), u = rnd();
    if (nearFly(x, y, z, 4) || hypot(x + 1, z - 2) < 9 || nearPose(x, z, 8)) continue;
    if (ny > 0.75 && u < 0.10 * h) cluster(x, y, z, 8 + rnd() * 14 | 0, 2, 1.0, 3.0, 0.13, 0.26, 0.6, 2.5);
    else if (ny > 0.6 && u < 0.10 * h + 0.07 * max(zp, h * 0.4)) cluster(x, y, z, 10 + rnd() * 18 | 0, rnd() < 0.8 ? 3 : 4, 0.9, 2.6, 0.14, 0.28, 0.9, 1.5);
    else if (ny < -0.35 && u < 0.5 * max(zp, 0.2)) { // hanging fronds
      const n = 12 + rnd() * 20 | 0;
      for (let j = 0; j < n; j++) leaf(big, x + rr(-0.6, 0.6), y + 0.2, z + rr(-0.6, 0.6), rr(0.8, 3.2), rnd() * TAU, PI - rr(0, 0.4), rr(0.08, 0.18), 0, zp > 0.3 || rnd() < 0.5 ? 6 : 0, rnd(), rnd(), rr(0.3, 0.6));
    } else if (ny > -0.2 && ny < 0.8 && u < 0.07) { // wall tufts
      const yaw = atan2(T.wn[k + 2], T.wn[k]), n = 5 + rnd() * 7 | 0;
      for (let j = 0; j < n; j++) leaf(big, x, y, z, rr(0.5, 1.4), yaw + rr(-0.9, 0.9), rr(0.3, 1.1), rr(0.06, 0.12), 0.5, zp > 0.4 && rnd() < 0.6 ? 3 : 0, rnd(), rnd(), rr(0.2, 0.6));
    }
  }
  // --- ground cover: dense carpets of small tufts in the magenta patches
  rseed(4);
  for (const p of MAGENTA) for (let i = p[2] * p[2] * PI * 45; i > 0; i--) {
    const a = rnd() * TAU, r = sqrt(rnd()) * p[2], x = p[0] + cos(a) * r, z = p[1] + sin(a) * r;
    if (rnd() > magAt(x, z) + 0.12 || nearPose(x, z)) continue;
    const f = floorsAt(x, z); if (!f.length) continue;
    const y = f[f.length - 2]; if (grad(x, y, z)[1] < 0.7) continue;
    const nl = 2 + (rnd() * 3 | 0), yw = rnd() * TAU;
    for (let j = 0; j < nl; j++) leaf(small, x, y - 0.03, z, rr(0.08, 0.26), yw + j * TAU / nl + rr(-0.4, 0.4), rr(0.15, 0.85), rr(0.035, 0.07), 0, 5, rnd(), rnd(), rr(0.3, 0.7));
    if (rnd() < 0.3) for (let j = 0; j < 2; j++) leaf(small, x + rr(-0.2, 0.2), y - 0.04, z + rr(-0.2, 0.2), rr(0.2, 0.55), rnd() * TAU, rr(0.05, 0.6), rr(0.03, 0.06), 0, 7, rnd(), rnd(), rr(0.3, 0.8));
    if (rnd() < 0.3) glint(x, y + rr(0.08, 0.22), z, 0, rnd(), 0.82 + rnd() * 0.18, rr(0.01, 0.02), 0);
  }
  rseed(5);
  for (let i = 0; i < 620000; i++) {
    const k = pickV(), ny = T.wn[k + 1];
    if (ny < 0.72) continue;
    const x = T.wp[k] + rr(-0.45, 0.45), z = T.wp[k + 2] + rr(-0.45, 0.45), y = T.wp[k + 1];
    if (hypot(x, z) > 188 || nearPose(x, z)) continue;
    const m = magAt(x, z), zp = zoneP(x, z), u = rnd();
    if (m > 0.3 && u < m * 0.9) for (let j = 0; j < 4; j++) leaf(small, x + rr(-0.1, 0.1), y - 0.05, z + rr(-0.1, 0.1), rr(0.12, 0.34), rnd() * TAU, rr(0.05, 0.75), rr(0.04, 0.08), 0, 5, rnd(), rnd(), rr(0.3, 0.7));
    else if (u < m * 0.9 + 0.5 * max(zp, hot(x, z)) * sstep(0.42, 0.6, fbm(x * 0.09, 9, z * 0.09, 2))) for (let j = 0; j < 3; j++) leaf(small, x + rr(-0.1, 0.1), y - 0.05, z + rr(-0.1, 0.1), rr(0.25, 0.7), rnd() * TAU, rr(0.1, 0.8), rr(0.05, 0.1), 0, 7, rnd(), rnd(), rr(0.3, 0.8));
  }

  // --- sponges and coral (clustered on rock)
  const spots = [];
  const ZS = [[-58, 8, 30, 1], [0, 0, 30, 0.7], [6, 84, 36, 0.9], [4, -88, 22, 0.6], [44, 20, 24, 0.5]];
  const zw = (x, z) => { let h = 0.45; for (const p of ZS) h = max(h, p[3] * sstep(p[2], p[2] * 0.4, hypot(x - p[0], z - p[1]))); return h; };
  rseed(6);
  for (let i = 0; i < 13000; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2];
    if (hypot(x, z) > 188 || y > -8 || T.wn[k + 1] < -0.15 || rnd() > zw(x, z) || nearFly(x, y, z, 3)) continue;
    const n0 = [T.wn[k], T.wn[k + 1], T.wn[k + 2]], [t1, t2] = tangent(n0), coral = T.wn[k + 1] > 0.85 || rnd() < 0.35, cnt = coral ? 2 + rnd() * 5 | 0 : 3 + rnd() * 9 | 0, sd = rnd();
    for (let j = 0; j < cnt; j++) {
      const a = rr(-1, 1) * (0.5 + cnt * 0.13), b = rr(-1, 1) * (0.5 + cnt * 0.13);
      const s = snap(x + t1[0] * a + t2[0] * b, y + t1[1] * a + t2[1] * b, z + t1[2] * a + t2[2] * b, n0);
      if (!s) continue;
      let ux = s[3], uy = s[4] + (coral ? 0.9 : 1.1), uz = s[5]; const l = hypot(ux, uy, uz); ux /= l; uy /= l; uz /= l;
      const q = qMul(qFromY(ux, uy, uz), qAxis(0, 1, 0, rnd() * TAU)), sc = coral ? rr(0.5, 1.5) : rr(0.35, 0.9) * (rnd() < 0.1 ? 1.6 : 1);
      solid(coral ? 7 + (rnd() * 3 | 0) : 4 + (rnd() * 3 | 0), s[0] - ux * 0.12 * sc, s[1] - uy * 0.12 * sc, s[2] - uz * 0.12 * sc, sc, q, coral ? 5 : 4, fract(sd + rr(-0.03, 0.03)), 1, 0);
    }
    if (!coral && rnd() < 0.3) spots.push([x + n0[0], y + n0[1] + 0.5, z + n0[2]]);
  }

  // dense sponge / coral gardens: x, z, radius, count
  rseed(7);
  for (const g of [[-68, -6, 9, 260], [-66, 6, 7, 160], [16, 72, 7, 200], [-6, 74, 6, 120], [-13, -2, 6, 80], [8, -88, 8, 160], [44, 12, 7, 120], [-62, 22, 6, 140], [-47, 40, 6, 140], [-30, 47, 6, 120], [-12, 48, 5, 100], [14, 28, 6, 140], [28, 45, 6, 120], [-36, -76, 6, 130], [-49, -58, 6, 130], [-58, -38, 6, 120]]) {
    let made = 0;
    for (let i = 0; i < 400000 && made < g[3]; i++) {
      const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2];
      if (hypot(x - g[0], z - g[1]) > g[2] || y > -14 || T.wn[k + 1] < -0.1 || nearFly(x, y, z, 2.2)) continue;
      made++;
      const coral = T.wn[k + 1] > 0.85 || rnd() < 0.3, nx = T.wn[k], ny = T.wn[k + 1] + (coral ? 0.9 : 1.1), nz = T.wn[k + 2], l = hypot(nx, ny, nz);
      const sc = coral ? rr(0.5, 1.4) : rr(0.35, 0.9) * (rnd() < 0.15 ? 1.7 : 1);
      solid(coral ? 7 + (rnd() * 3 | 0) : 4 + (rnd() * 3 | 0), x - nx / l * 0.1 * sc, y - ny / l * 0.1 * sc, z - nz / l * 0.1 * sc, sc, qMul(qFromY(nx / l, ny / l, nz / l), qAxis(0, 1, 0, rnd() * TAU)), coral ? 5 : 4, rnd(), 1, 0);
    }
  }
  // --- rocks: floating boulder clusters + scattered ground rocks
  const BOULD = [[-11, -11, -105, 14, 5], [-56, -19, -18, 18, 6], [10, -13, -88, 22, 7], [24, -15, -24, 22, 7], [-18, -12, 4, 14, 6], [30, -14, 30, 16, 6], [36, -12, -70, 22, 8], [-30, -13, -84, 16, 7], [-58, -14, 0, 14, 6], [19, -13, 98, 18, 6], [62, -9, 34, 14, 6]];
  rseed(8);
  for (let i = 0; i < 9; i++) { const a = rnd() * TAU, r = rr(60, 150); BOULD.push([cos(a) * r, rr(-20, -9), sin(a) * r, 10 + rnd() * 12 | 0, rr(5, 9)]); }
  for (const b of BOULD) for (let i = 0; i < b[3]; i++) {
    const sc = rnd() < 0.12 ? rr(1.8, 3.2) : rr(0.35, 1.5);
    const x = b[0] + rr(-1, 1) * b[4], y = b[1] + rr(-1, 1) * b[4] * 0.6, z = b[2] + rr(-1, 1) * b[4];
    if (Dw(x, y, z) > -sc) continue;
    const bob = rr(0.12, 0.4), sd = rnd();
    solid(rnd() * 4 | 0, x, min(y, -2 - sc), z, sc, qRand(), 1, sd, 1, bob);
    if (sc > 1.1) for (let j = 0; j < 7; j++) solid(rnd() * 4 | 0, x + rr(-1.6, 1.6) * sc, min(y, -2 - sc) + rr(-1.4, 1) * sc, z + rr(-1.6, 1.6) * sc, rr(0.1, 0.35), qRand(), 1, sd, 1, bob);
  }
  rseed(9);
  for (let i = 0; i < 2600; i++) {
    const k = pickV(); if (T.wn[k + 1] < 0.7 || hypot(T.wp[k], T.wp[k + 2]) > 188 || nearFly(T.wp[k], T.wp[k + 1], T.wp[k + 2], 6)) continue;
    const sc = rr(0.25, 1.3) * (rnd() < 0.1 ? 2 : 1);
    solid(rnd() * 4 | 0, T.wp[k], T.wp[k + 1] + sc * 0.2, T.wp[k + 2], sc, qRand(), 1, rnd(), 1, 0);
  }

  rseed(10);
  for (let i = 0; i < 60000; i++) {
    const k = pickV(), x = T.wp[k], y = T.wp[k + 1], z = T.wp[k + 2], ny = T.wn[k + 1];
    if (hypot(x, z) > 188 || y > -3 || (ny > 0.8 && rnd() < 0.6) || nearFly(x, y, z, 3.5)) continue;
    const sc = (0.35 + 2.1 * pow(rnd(), 2.6)) * (ny > 0.8 ? 0.5 : 1), q = qRand();
    chunks[(sc > 1.15 ? 3 : 0) + (rnd() * 3 | 0)][cellOf(x, z)].push(x - T.wn[k] * sc * 0.3, y - ny * sc * 0.3, z - T.wn[k + 2] * sc * 0.3, sc, q[0], q[1], q[2], q[3], 1, rnd(), sc > 1.15 ? 0 : 96, 0);
  }
  rseed(11);
  for (let i = 0; i < 170000; i++) { // pebbles and rubble on the sea floor
    const k = pickV(), x = T.wp[k] + rr(-0.4, 0.4), z = T.wp[k + 2] + rr(-0.4, 0.4), y = T.wp[k + 1];
    if (T.wn[k + 1] < 0.8 || hypot(x, z) > 188 || nearFly(x, y, z, 1.3)) continue;
    const sc = 0.05 + 0.3 * pow(rnd(), 2), q = qRand();
    nth++ % THIN || chunks[6][cellOf(x, z)].push(x, y - sc * 0.25, z, sc, q[0], q[1], q[2], q[3], 1, rnd(), 44, 0);
  }
  // --- set pieces
  const gy = (x, z) => { const f = floorsAt(x, z); return f.length ? f[f.length - 2] : -45; };
  solid(10, -5, gy(-5, -4) - 0.6, -4, 1, qMul(qAxis(0, 1, 0, 1.2), qMul(qAxis(0, 0, 1, 0.16), qAxis(1, 0, 0, -0.3))), 2, 0.3, 1, 0);          // whale fluke
  solid(11, 59.5, -23, 6, 1, qMul(qAxis(0, 1, 0, -PI / 2), qMul(qAxis(0, 0, 1, -0.1), qAxis(1, 0, 0, 0.32))), 3, 0.5, 1, 0); // ship hull
  // --- Ocean City (v2.0): high-tech ruins on the platform (top -38, bases sunk to -39)
  // mesh ids: 28 tower, 29 column, 30 dome, 31 gate, 32 crystal, 33 statue, 34 plaza, 35 rune, 36 conduit, 37 arc
  // materials: 6 alloy, 7 energy, 8 rune, 2 pale stone
  const CY = -39;
  solid(34, 95, CY, 0, 1, [0, 0, 0, 1], 6, 0.2, 1, 0); // plaza disc
  solid(28, 95, CY, 0, 1, [0, 0, 0, 1], 6, 0.1, 1, 0); // the Spire
  for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; solid(29, 95 + cos(a) * 22, CY, sin(a) * 22, 1, [0, 0, 0, 1], 6, k / 8, 1, 0); } // colonnade ring
  solid(33, 120, CY, -20, 1, qAxis(0, 1, 0, -0.6), 2, 0.4, 1, 0); // the Statue (pale stone)
  solid(31, 70, -26, 20, 1, [0, 0, 0, 1], 6, 0.3, 1, 0); // the Energy Gate ring
  solid(34, 70, -26, 20, 0.5, qAxis(1, 0, 0, PI / 2), 7, 0.6, 1, 0); // portal interior (vertical disc)
  solid(32, 110, -20, 15, 1, [0, 0, 0, 1], 7, 0.7, 1, 1.5); // the floating Crystal (bobs)
  solid(30, 80, CY, -25, 1, [0, 0, 0, 1], 2, 0.5, 1, 0); // domes (pale stone)
  solid(30, 115, CY, 10, 1, [0, 0, 0, 1], 2, 0.8, 1, 0);
  for (const t of [[85, 25], [105, -25], [125, 5], [75, -5]]) solid(28, t[0], CY, t[1], 0.6, [0, 0, 0, 1], 6, rnd(), 1, 0); // four smaller towers
  solid(35, 95, CY + 1.5, 0, 1, [0, 0, 0, 1], 8, 0.2, 1, 0); // runes
  solid(35, 70, CY + 1.5, 20, 0.75, [0, 0, 0, 1], 8, 0.5, 1, 0);
  solid(35, 120, CY + 1.5, -20, 0.75, [0, 0, 0, 1], 8, 0.8, 1, 0);
  solid(31, 95, CY + 1.5, 0, 2.2, qAxis(1, 0, 0, PI / 2), 7, 0.4, 1, 0); // ring conduit around the plaza (flat)
  solid(36, 85, CY + 1.5, 20, 1, [0, 0, 0, 1], 7, 0.3, 1, 0); // conduit to the gate (along x)
  solid(36, 95, CY + 1.5, -12, 1, qAxis(0, 1, 0, PI / 2), 7, 0.6, 1, 0); // conduit south (along z)
  solid(37, 100, CY, 8, 1, [0, 0, 0, 1], 7, 0.2, 1, 0); // electric arcs
  solid(37, 108, CY, -22, 0.8, qAxis(0, 1, 0, 1.2), 7, 0.7, 1, 0);
  // --- Ocean City v2.7: the Abyssal District (centre -130, -120), same mesh ids and materials as the
  // first city, few bold readable shapes, no clutter. Bases sunk to -39, same as the first city.
  solid(34, -130, CY, -120, 1, [0, 0, 0, 1], 6, 0.2, 1, 0); // abyssal plaza disc
  solid(28, -130, CY, -120, 1, [0, 0, 0, 1], 6, 0.1, 1, 0); // the Abyssal Spire
  for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; solid(29, -130 + cos(a) * 22, CY, -120 + sin(a) * 22, 1, [0, 0, 0, 1], 6, k / 6, 1, 0); } // sunken colonnade ring
  solid(33, -105, CY, -140, 1, qAxis(0, 1, 0, 0.6), 2, 0.4, 1, 0); // the Deep Statue (pale stone)
  solid(31, -155, -26, -100, 1, [0, 0, 0, 1], 6, 0.3, 1, 0); // the Abyss Gate ring
  solid(34, -155, -26, -100, 0.5, qAxis(1, 0, 0, PI / 2), 7, 0.6, 1, 0); // abyss portal interior (vertical disc)
  solid(32, -115, -20, -105, 1, [0, 0, 0, 1], 7, 0.7, 1, 1.5); // the Void Crystal (bobs)
  solid(30, -142, CY, -110, 1, [0, 0, 0, 1], 2, 0.5, 1, 0); // abyssal domes (pale stone)
  solid(30, -118, CY, -130, 1, [0, 0, 0, 1], 2, 0.8, 1, 0);
  for (const t of [[-100, -120], [-160, -120], [-130, -150]]) solid(28, t[0], CY, t[1], 0.6, [0, 0, 0, 1], 6, rnd(), 1, 0); // three abyssal towers
  solid(35, -130, CY + 1.5, -120, 1, [0, 0, 0, 1], 8, 0.2, 1, 0); // abyssal runes
  solid(35, -155, CY + 1.5, -100, 0.75, [0, 0, 0, 1], 8, 0.5, 1, 0);
  solid(35, -105, CY + 1.5, -140, 0.75, [0, 0, 0, 1], 8, 0.8, 1, 0);
  solid(31, -130, CY + 1.5, -120, 2.2, qAxis(1, 0, 0, PI / 2), 7, 0.4, 1, 0); // ring conduit around the abyssal plaza (flat)
  solid(36, -142, CY + 1.5, -110, 1, qAxis(0, 1, 0, 2.46), 7, 0.3, 1, 0); // conduit to the Abyss Gate
  solid(36, -130, CY + 1.5, -135, 1, qAxis(0, 1, 0, PI / 2), 7, 0.6, 1, 0); // conduit south (along z)
  solid(37, -125, CY, -115, 1, [0, 0, 0, 1], 7, 0.2, 1, 0); // abyssal electric arcs
  solid(37, -138, CY, -128, 0.8, qAxis(0, 1, 0, 1.2), 7, 0.7, 1, 0);
  // barrel sponges in front of viewpoint 4, small sponges around the fluke base
  rseed(12);
  for (const b of [[7, 3.2, 1.3, 4], [8.4, 4.6, 1.0, 6], [9.6, 2.6, 1.5, 4], [11, 5, 1.1, 5], [8, -3.6, 1.2, 4], [12.5, 2, 1.2, 6], [9, 3.9, 0.8, 4]]) { const p = rel(3, b[0], b[1]), c = POSES[3]; let ux = (c[0] - p[0]) * 0.07, uz = (c[2] - p[1]) * 0.07; const l = hypot(ux, 1, uz); solid(b[3], p[0], gy(p[0], p[1]) - 0.1, p[1], b[2], qFromY(ux / l, 1 / l, uz / l), 4, rnd(), 1, 0); }
  for (let i = 0; i < 9; i++) { const a = rnd() * TAU; const x = -5 + cos(a) * rr(1.2, 2.6), z = -4 + sin(a) * rr(1.5, 4); solid(6, x, gy(x, z) + 0.05, z, rr(0.4, 0.9), qAxis(0, 1, 0, rnd() * 6), 4, rnd(), 1, 0); }

  // --- bubbles
  const VENTS = [[4, -44, -3], [4.5, -44, -3.5], [-1, -44, 2], [2, -44, -1], [5.5, -44, -7], [3, -44, -9], [6, -44, -90], [8, -44, -84], [4, -44, -93], [-9, -44, 3], [5, -35, -86], [9, -37, -92], [40, -44, 20], [-56, -44, 12], [10, -44, 80], [-2, -44, 30], [0, -44, -30], [12, -44, 2], [6, -44, -2], [46, -44, 30], [-20, -44, -103], [-52, -44, -12], [4, -44, 70], [9, -44, -74], [4, -44, -78], [14, -44, 26], [26, -44, 40], [-45, -44, -64], [-55, -44, -40], [-58, -44, 22], [-40, -44, 40], [-14, -44, 45], [-1, -44, -9], [-7, -44, -6]];
  rseed(13);
  for (const s of spots) if (rnd() < 0.28) VENTS.push(s);
  for (const v of VENTS) {
    const n = 90 + rnd() * 70 | 0, y0 = v[1] === -44 ? gy(v[0], v[2]) : v[1];
    for (let i = 0; i < n; i++) {
      const sz = rnd() < 0.24 ? rr(0.1, 0.3) : rr(0.025, 0.08);
      bubbles.push(v[0] + rr(-0.3, 0.3), y0, v[2] + rr(-0.3, 0.3), sz, rnd(), rr(1.1, 2.4) * (0.6 + sz * 3), -y0 - 0.2, rr(0.05, 0.16));
    }
  }

  // --- pack leaves (36 bytes: 8 floats + 4 unorm8), sorted by culling cell
  const pack = (L, step = 1, wm = 1) => {
    let n = 0; const start = new Uint32Array(nCells + 1);
    for (let c = 0; c < nCells; c++) { start[c] = n; n += Math.ceil(L[c].length / 12 / step); }
    start[nCells] = n;
    const buf = new ArrayBuffer(n * 36), f = new Float32Array(buf), u8 = new Uint8Array(buf), lo = new Float32Array(nCells).fill(1e9), hi = new Float32Array(nCells).fill(-1e9);
    let k = 0;
    for (let c = 0; c < nCells; c++) { const a = L[c]; for (let i = 0; i < a.length; i += 12 * step, k++) {
      for (let j = 0; j < 8; j++) f[k * 9 + j] = a[i + j];
      f[k * 9 + 6] *= wm;
      u8[k * 36 + 32] = a[i + 8]; u8[k * 36 + 33] = a[i + 9] * 255; u8[k * 36 + 34] = a[i + 10] * 255; u8[k * 36 + 35] = a[i + 11] * 255;
      const y = a[i + 1], l = a[i + 3]; if (y - l < lo[c]) lo[c] = y - l; if (y + l > hi[c]) hi[c] = y + l;
    } }
    return { buf, n, start, lo, hi };
  };

  // --- half-res volume: r = openness, g = skylight
  const hx = NX / 2, hy = NY / 2, hz = NZ / 2, volD = new Uint8Array(hx * hy * hz * 2);
  let Lp = new Float32Array(hx * hz).fill(1), Ln = new Float32Array(hx * hz), tmp = new Float32Array(hx * hz);
  for (let y = hy - 1; y >= 0; y--) {
    for (let z = 0; z < hz; z++) for (let x = 0; x < hx; x++) { const i = x + hx * z; tmp[i] = (Lp[x > 0 ? i - 1 : i] + 2 * Lp[i] + Lp[x < hx - 1 ? i + 1 : i]) * 0.25; }
    for (let z = 0; z < hz; z++) for (let x = 0; x < hx; x++) {
      const i = x + hx * z, b = (tmp[z > 0 ? i - hx : i] + 2 * tmp[i] + tmp[z < hz - 1 ? i + hx : i]) * 0.25;
      const g0 = gi(x * 2, y * 2, z * 2);
      const d = (D[g0] + D[g0 + 1] + D[g0 + NX] + D[g0 + NX + 1] + D[g0 + NX * NY] + D[g0 + NX * NY + 1] + D[g0 + NX * NY + NX] + D[g0 + NX * NY + NX + 1]) * 0.125;
      const o = x + hx * (y + hy * z);
      const l = b * clamp(0.5 - d / 1.5, 0, 1) * (1 - min(kelpAbs[o], 0.5));
      Ln[i] = l;
      volD[o * 2] = clamp(0.5 - d / 12, 0, 1) * 255; volD[o * 2 + 1] = min(1, b) * 255;
    }
    const t = Lp; Lp = Ln; Ln = t;
  }

  // --- ground map: r magenta cover, b purple zone, a sand
  const gm = new Uint8Array(512 * 512 * 4);
  for (let j = 0; j < 512; j++) for (let i = 0; i < 512; i++) {
    const x = (i + 0.5) / 512 * 384 - 192, z = (j + 0.5) / 512 * 384 - 192, o = (i + 512 * j) * 4;
    gm[o] = magAt(x, z) * 255; gm[o + 2] = zoneP(x, z) * 255; gm[o + 3] = sstep(0.42, 0.6, fbm(x * 0.04, 3, z * 0.04, 3)) * 255;
  }

  // --- fish schools + mantas
  const fish = [];
  rseed(14);
  const SCH = [[-2, -36, -10, 15, 650, 0.3, 1, 0.945], [8, -30, -70, 22, 520, 0.32, -1], [48, -30, 14, 18, 450, 0.3, 1], [-58, -30, -8, 11, 520, 0.28, -1, 0.3], [8, -36, 84, 16, 400, 0.28, 1],
    [-90, -28, -70, 25, 380, 0.3, 1], [95, -30, 70, 25, 380, 0.3, -1], [0, -22, 20, 30, 480, 0.34, -1], [-30, -30, -100, 18, 380, 0.3, 1], [16, -36, 30, 12, 380, 0.3, 1], [-48, -34, -58, 12, 380, 0.3, -1], [-45, -35, 38, 14, 400, 0.3, 1],
    [20, -26, -40, 14, 340, 0.3, 1], [-70, -32, 30, 16, 340, 0.3, -1], [30, -24, 60, 18, 340, 0.32, 1], [-10, -20, -60, 20, 360, 0.3, -1]];
  // species is encoded in the per-fish seed (b.x): .0-.55 default, .55-.70 clownfish, .70-.82 angelfish,
  // .82-.90 pufferfish (grown 2.1x), .90-1.0 glowfish
  for (const s of SCH) { const ss = s[7] === undefined ? rnd() : s[7]; for (let i = 0; i < s[4]; i++) { const sp = rnd(); fish.push(s[0], s[1], s[2], s[3], sp, s[6] * 1.9 / s[3], s[5] * (sp >= 0.82 && sp < 0.9 ? 2.1 : 1), ss); } }
  const mantas = [];
  for (const m of [[1, -28, 3.5, 14, 3.012, 0.085, 3.6, 0.1], [49, -31, 24.5, 5, 0.029, -0.08, 3.7, 0.4], [0, -14, -80, 34, 0.3, 0.06, 5.2, 0.7], [-50, -18, 20, 26, 5, -0.075, 3.8, 0.55], [10, -16, 86, 26, 2.2, 0.07, 4.4, 0.85], [20, -11, -20, 46, 4.2, -0.045, 5.6, 0.25]]) mantas.push(...m);

  // --- jellyfish: 12 glowing bells drifting in slow circles, same 8-float layout as fish
  const jelly = [];
  rseed(15);
  for (let i = 0; i < 12; i++) { const a = rnd() * TAU, r = rr(10, 90); jelly.push(cos(a) * r, rr(-28, -14), sin(a) * r, rr(2, 6), rnd(), rr(0.03, 0.08) * (rnd() < 0.5 ? 1 : -1), rr(0.8, 1.4), rnd()); }
  // --- mecha worm: one 8-segment metal worm swimming a slow circle, just off the spawn (the fish starts
  // near 9, -41, 6), so it is in view from the first dive
  const worm = [-2, -38, 5, 10, 0.5, 0.05, 1.2, 0.3];

  // --- Ocean City creatures (v2.0): same 8-float layout as fish (cx, cy, cz, R, seed, speed, size, phase)
  // fsBigFish branches on the seed: shark .0-.25, whale .25-.5, turtle .5-.75, leviathan .75-.9, void leviathan .9-1
  const shark = [], whale = [], turtle = [], mermaid = [], ray = [], octopus = [], kraken = [], eel = [], serpent = [], angler = [], plesio = [];
  rseed(16);
  for (let i = 0; i < 4; i++) { const a = rnd() * TAU; shark.push(95 + cos(a) * 25, rr(-30, -18), sin(a) * 25, 25, rnd() * 0.25, 0.06, rr(2.5, 3.5), rnd()); } // sharks patrolling the city
  for (let i = 0; i < 2; i++) { const a = rnd() * TAU; shark.push(-130 + cos(a) * 25, rr(-30, -18), -120 + sin(a) * 25, 25, rnd() * 0.25, 0.06, rr(2.5, 3.5), rnd()); } // v2.7: sharks patrolling the Abyssal District
  whale.push(40, -25, -60, 60, 0.3, 0.02, 7, 0.1, -60, -22, 60, 70, 0.4, 0.018, 8, 0.6); // two slow giants
  whale.push(-100, -35, -80, 80, 0.85, 0.015, 12, 0.2); // the leviathan: enormous, in the deep
  whale.push(-150, -38, -40, 70, 0.88, 0.015, 14, 0.5); // v2.7: a second leviathan in the southwest deep
  whale.push(140, -30, 90, 60, 0.82, 0.015, 13, 0.8); // v2.7: a third leviathan in the far southeast
  whale.push(-120, -40, -110, 30, 0.95, 0.012, 15, 0.3); // v2.7: the void leviathan, pale and cold, guarding the Abyssal District
  for (let i = 0; i < 4; i++) { const a = rnd() * TAU; turtle.push(95 + cos(a) * 30, rr(-32, -24), sin(a) * 30, 30, 0.5 + rnd() * 0.25, 0.03, rr(1.2, 1.6), rnd()); }
  turtle.push(0, -30, 80, 25, 0.6, 0.03, 1.4, 0.3); // one turtle in the grotto
  for (let i = 0; i < 2; i++) { const a = rnd() * TAU; turtle.push(-130 + cos(a) * 30, rr(-32, -24), -120 + sin(a) * 30, 30, 0.5 + rnd() * 0.25, 0.03, rr(1.2, 1.6), rnd()); } // v2.7: turtles in the Abyssal District
  for (let i = 0; i < 3; i++) { const a = rnd() * TAU; mermaid.push(95 + cos(a) * 18, rr(-28, -20), sin(a) * 18, 18, rnd(), 0.05, 1.6, rnd()); } // mermaids in the city
  mermaid.push(0, -25, 80, 20, 0.5, 0.04, 1.6, 0.7); // one mermaid in the grotto
  for (let i = 0; i < 2; i++) { const a = rnd() * TAU; mermaid.push(-130 + cos(a) * 18, rr(-28, -20), -120 + sin(a) * 18, 18, rnd(), 0.05, 1.6, rnd()); } // v2.7: mermaids in the Abyssal District
  for (let i = 0; i < 5; i++) { const a = rnd() * TAU, r = rr(20, 80); ray.push(cos(a) * r, rr(-28, -16), sin(a) * r, rr(15, 30), rnd(), 0.06, rr(2.5, 4), rnd()); }
  for (let i = 0; i < 3; i++) { const a = rnd() * TAU, r = rr(60, 150); ray.push(cos(a) * r, rr(-28, -16), sin(a) * r, rr(15, 30), rnd(), 0.06, rr(2.5, 4), rnd()); } // v2.7: rays in the expanded deep
  for (let i = 0; i < 4; i++) { const a = rnd() * TAU, r = rr(15, 70); octopus.push(cos(a) * r, rr(-30, -20), sin(a) * r, rr(4, 8), rnd(), 0.05, rr(1, 1.5), rnd()); }
  for (let i = 0; i < 2; i++) { const a = rnd() * TAU, r = rr(80, 150); octopus.push(cos(a) * r, rr(-30, -20), sin(a) * r, rr(4, 8), rnd(), 0.05, rr(1, 1.5), rnd()); } // v2.7: octopuses in the expanded deep
  kraken.push(60, -30, -40, 30, 0.7, 0.02, 6, 0.4); // the kraken: huge, near the deep rock
  kraken.push(-140, -30, -70, 25, 0.7, 0.02, 6, 0.6); // v2.7: a second kraken in the southwest deep
  kraken.push(120, -28, 130, 25, 0.75, 0.02, 7, 0.9); // v2.7: a third kraken in the far southeast
  for (let i = 0; i < 3; i++) { const a = rnd() * TAU, r = rr(20, 60); eel.push(cos(a) * r, rr(-35, -25), sin(a) * r, rr(8, 15), rnd(), 0.06, 0.5, rnd()); } // eels (thin)
  for (let i = 0; i < 2; i++) { const a = rnd() * TAU, r = rr(80, 150); eel.push(cos(a) * r, rr(-35, -25), sin(a) * r, rr(8, 15), rnd(), 0.06, 0.5, rnd()); } // v2.7: eels in the expanded deep
  serpent.push(-80, -32, -60, 50, 0.7, 0.02, 4, 0.1); // the sea serpent: enormous
  serpent.push(-120, -32, -120, 40, 0.7, 0.02, 5, 0.5); // v2.7: a second serpent guarding the Abyssal District
  serpent.push(100, -30, 120, 40, 0.7, 0.02, 4, 0.7); // v2.7: a third serpent in the far southeast
  // v2.7: two new giant monster types from real low-poly models (Gobkit CC0) - anglerfish (vsFish) and
  // plesiosaurus, a long-necked sea serpent (vsWorm). Meshes are meshAngler (id 42) and meshPlesio (id 43).
  angler.push(-120, -38, -100, 20, 0.3, 0.05, 4, 0.2, -150, -40, -60, 25, 0.6, 0.05, 4.5, 0.7, 100, -35, 140, 20, 0.8, 0.05, 4, 0.4);
  plesio.push(-100, -35, -130, 50, 0.5, 0.02, 2, 0.1, 80, -30, 130, 45, 0.7, 0.02, 2, 0.6);

  // --- drifting particles
  const snow = new Float32Array(9000 * 4);
  for (let i = 0; i < snow.length; i++) snow[i] = rnd();

  const sol = { data: [], ranges: [] }; let si = 0;
  for (let m = 0; m < 38; m++) { const a = solids[m] || []; sol.ranges.push([si, a.length / 12]); si += a.length / 12; for (let i = 0; i < a.length; i++) sol.data.push(a[i]); }
  const packC = (L) => {
    let n = 0; const start = new Uint32Array(nCells + 1);
    for (let c = 0; c < nCells; c++) { start[c] = n; n += L[c].length / 12; }
    start[nCells] = n;
    const data = new Float32Array(n * 12), lo = new Float32Array(nCells).fill(1e9), hi = new Float32Array(nCells).fill(-1e9);
    let k = 0;
    for (let c = 0; c < nCells; c++) { const a = L[c]; for (let i = 0; i < a.length; i += 12) { for (let j = 0; j < 12; j++) data[k++] = a[i + j]; lo[c] = min(lo[c], a[i + 1] - 3); hi[c] = max(hi[c], a[i + 1] + 3); } }
    return { data, n, start, lo, hi };
  };
  return { gy, glints: new Float32Array(glints), chunks: chunks.map(packC), props: props.map(packC), big: pack(big), bigF: pack(big, 2, 1.5), small: pack(small), solids: { data: new Float32Array(sol.data), ranges: sol.ranges }, bubbles: new Float32Array(bubbles), volD, gm, fish: new Float32Array(fish), mantas: new Float32Array(mantas), jelly: new Float32Array(jelly), worm: new Float32Array(worm), shark: new Float32Array(shark), whale: new Float32Array(whale), turtle: new Float32Array(turtle), mermaid: new Float32Array(mermaid), ray: new Float32Array(ray), octopus: new Float32Array(octopus), kraken: new Float32Array(kraken), eel: new Float32Array(eel), serpent: new Float32Array(serpent), angler: new Float32Array(angler), plesio: new Float32Array(plesio), snow, map: MESAS.map(m => [m[0], m[1], m[2], m[3], m[4]]) };
}
const fract = (x) => x - floor(x);

// ---------------------------------------------------------------- procedural meshes
function meshChunk(sd, sub = 2, det = sub > 2) {
  if (LV > 1 && sub > 1) sub--; // Low: a quarter of the triangles
  rseed(100 + sd);
  const pl = []; for (let i = 0; i < 4; i++) { const q = qRand(); pl.push([q[0], q[1], q[2], rr(0.8, 0.98)]); const l = hypot(q[0], q[1], q[2]) || 1; pl[i][0] /= l; pl[i][1] /= l; pl[i][2] /= l; }
  return icosphere(sub, (x, y, z) => {
    let r = 1 + (fbm(x * 1.6 + sd, y * 1.6, z * 1.6, 2) - 0.5) * 0.9 + (det ? (fbm(x * 4 + sd, y * 4, z * 4, 2) - 0.5) * 0.25 : 0);
    let px = x * r, py = y * r * 0.8, pz = z * r;
    for (const p of pl) { const d = px * p[0] + py * p[1] + pz * p[2] - p[3]; if (d > 0) { px -= p[0] * d; py -= p[1] * d; pz -= p[2] * d; } }
    return [px, py, pz];
  });
}
function meshLathe(prof, seg, lump, ribs = 0) {
  const m = new Mesh(), rings = [];
  for (const [r, h, ao] of prof) { const ring = []; for (let s = 0; s < seg; s++) { const a = s / seg * TAU, rl = r * (1 + lump * (fbm(cos(a) * 1.5 + h * 2, h * 3, sin(a) * 1.5, 2) - 0.5) + 0.07 * cos(ribs * a + h * 1.5)); ring.push(m.v(cos(a) * rl, h, sin(a) * rl, ao)); } rings.push(ring); }
  for (let k = 0; k < rings.length - 1; k++) for (let s = 0; s < seg; s++) { const s2 = (s + 1) % seg; m.quad(rings[k][s], rings[k + 1][s], rings[k + 1][s2], rings[k][s2]); }
  return m;
}
function meshCoral(fan, lo = LV > 1) {
  rseed(200 + fan);
  const m = new Mesh();
  const nrm = (v) => { const l = hypot(...v) || 1; return v.map((c) => c / l); };
  const br = (p, d, r, len, depth) => {
    const pts = [p]; let q = p;
    for (let i = 0; i < 3; i++) { d = nrm([d[0] + rr(-0.3, 0.3), d[1] + rr(-0.1, 0.3), d[2] + (fan ? rr(-0.05, 0.05) : rr(-0.3, 0.3))]); q = [q[0] + d[0] * len / 3, q[1] + d[1] * len / 3, q[2] + d[2] * len / 3]; pts.push(q); }
    if (!depth) pts.push([q[0] + d[0] * r * 1.6, q[1] + d[1] * r * 1.6, q[2] + d[2] * r * 1.6]);
    if (lo) m.tube(depth ? [pts[0], pts[3]] : [pts[0], pts[3], pts[4]], (k) => (k > 1 ? r * 0.36 : r * (1 - 0.22 * k)) * 1.25, 3, true, (k) => clamp(1 - (depth + 1 - k) / 5, 0, 1));
    else m.tube(pts, (k) => k > 3 ? r * 0.36 : r * (1 - 0.22 * k / 3), fan ? 5 : 6, true, (k) => clamp(1 - (depth + 1 - k / 3) / 5, 0, 1));
    if (depth > 0) { const n = 2 + (rnd() < 0.5); for (let i = 0; i < n; i++) br(q, nrm([d[0] + rr(-0.8, 0.8), d[1] + rr(-0.1, 0.5), d[2] + (fan ? rr(-0.08, 0.08) : rr(-0.8, 0.8))]), r * 0.78, len * 0.8, depth - 1); }
  };
  const n0 = fan ? 1 : 2 + (rnd() * 2 | 0);
  for (let i = 0; i < n0; i++) br([rr(-0.08, 0.08), 0, rr(-0.08, 0.08)], nrm([rr(-0.5, 0.5), 1, fan ? 0 : rr(-0.5, 0.5)]), fan ? 0.06 : 0.08, fan ? 0.5 : 0.45, 3);
  return m;
}
function meshTubes() {
  rseed(210);
  const m = new Mesh();
  for (let i = 0; i < 9; i++) {
    const a = rnd() * TAU, r0 = rr(0, 0.28), h = rr(0.45, 1.1), rad = rr(0.07, 0.12), lean = rr(0.05, 0.3), pts = [];
    for (let k = 0; k <= 4; k++) pts.push([cos(a) * (r0 + lean * k / 4 * h), h * k / 4, sin(a) * (r0 + lean * k / 4 * h)]);
    m.tube(pts, (k) => rad * (0.8 + 0.25 * k / 4), 12, false, (k) => 0.35 + 0.65 * k / 4);
    // rim + dark throat
    const e = pts[4], n = m.p.length / 3, c = m.v(e[0], e[1] - rad * 1.2, e[2], 0.05);
    for (let s2 = 0; s2 < 12; s2++) m.tri(n - 12 + s2, n - 12 + (s2 + 1) % 12, c);
  }
  return m;
}
// stone whale fluke: SDF of tapered capsules -> surface nets
function meshFluke() {
  const C = [];
  const chain = (pts, zs) => { for (let i = 0; i < pts.length - 1; i++) C.push([...pts[i], ...pts[i + 1], zs]); };
  chain([[0, -1.6, 3.7, 1.2], [0, 1.8, 2.35, 0.98], [0, 4.6, 1.0, 0.76], [0, 6.9, 0.1, 0.6]], 0.8);
  chain([[0, 6.6, 0.1, 0.72], [1.9, 7.9, 0, 0.98], [3.9, 8.8, -0.1, 0.9], [5.7, 9.8, -0.25, 0.64], [7.0, 11.2, -0.4, 0.38], [7.7, 12.8, -0.55, 0.2], [7.9, 14.1, -0.65, 0.1]], 0.18);
  chain([[0, 6.6, 0.1, 0.72], [-1.7, 8.3, 0.05, 0.96], [-3.3, 9.7, -0.05, 0.88], [-4.7, 11.2, -0.2, 0.64], [-5.6, 12.9, -0.4, 0.38], [-6.0, 14.6, -0.5, 0.2], [-5.9, 15.9, -0.6, 0.1]], 0.18);
  const sdf = (x, y, z) => {
    let d = 1e9;
    for (const c of C) {
      const zs = c[8], pz = z / zs, az = c[2] / zs, bz = c[6] / zs;
      const bax = c[4] - c[0], bay = c[5] - c[1], baz = bz - az, pax = x - c[0], pay = y - c[1], paz = pz - az;
      const h = clamp((pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz), 0, 1);
      const e = (hypot(pax - bax * h, pay - bay * h, paz - baz * h) - mix(c[3], c[7], h)) * zs;
      const k = 0.45, hh = max(k - abs(d - e), 0) / k;
      d = min(d, e) - hh * hh * k * 0.25;
    }
    return d;
  };
  const vs = 0.09, ox = -7.6, oy = -2.6, oz = -2.2, nx = 186, ny = 216, nz = 76, D = new Float32Array(nx * ny * nz);
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) D[x + nx * (y + ny * z)] = -sdf(ox + x * vs, oy + y * vs, oz + z * vs);
  const sn = surfaceNets(D, nx, ny, nz), smp = sampler3(D, nx, ny, nz);
  const vb = new ArrayBuffer(sn.nv * 16), f = new Float32Array(vb), s = new Int8Array(vb);
  for (let k = 0; k < sn.nv; k++) {
    const x = sn.pos[k * 3], y = sn.pos[k * 3 + 1], z = sn.pos[k * 3 + 2], e = 0.7;
    let ax = smp(x - e, y, z) - smp(x + e, y, z), ay = smp(x, y - e, z) - smp(x, y + e, z), az = smp(x, y, z - e) - smp(x, y, z + e);
    const l = hypot(ax, ay, az) || 1;
    f[k * 4] = ox + x * vs; f[k * 4 + 1] = oy + y * vs; f[k * 4 + 2] = oz + z * vs;
    s[k * 16 + 12] = round(ax / l * 127); s[k * 16 + 13] = round(ay / l * 127); s[k * 16 + 14] = round(az / l * 127); s[k * 16 + 15] = 127;
  }
  return { vb, ib: new Uint32Array(sn.idx), nv: sn.nv };
}
// sunken ship (bow at +x): keel with stem and stern posts, curved ribs, hull planking with a breach,
// raised stern castle with transom, deck remnants, two masts with yards, bowsprit
function meshShip() {
  rseed(220);
  const m = new Mesh(), Lh = 17, B = 5.6, Dp = 7.6;
  const hb = (x) => B * pow(max(1 - pow(abs(x / Lh), x < 0 ? 3.6 : 2.6), 0), 0.5);
  const dp = (x) => Dp * (1 - 0.36 * pow(abs(x / Lh), 2.5));
  const sheer = (x) => 0.5 + (x > 0 ? 3.0 : 3.8) * pow(abs(x / Lh), 2.2);
  const pt = (x, ph, off = 0) => { const b = hb(x) + off, d = dp(x) + off, s = sheer(x); return [x, s - (d + s) * pow(max(cos(ph), 0), 0.66), b * Math.sign(ph) * pow(abs(sin(ph)), 0.8)]; };
  const out = (p) => { const l = hypot(p[1] + 0.5, p[2] * 1.3) || 1; return [0, (p[1] + 0.5) / l, p[2] * 1.3 / l]; };
  const up = () => [0, 1, 0];
  const keel = [];
  for (let i = 0; i <= 44; i++) { const x = mix(-Lh - 1.0, Lh + 2.4, i / 44), e = max(abs(x) / Lh - 0.78, 0) * 4.2; keel.push([x, -dp(clamp(x, -Lh, Lh)) - 0.3 + e * e * e * 4.2, 0]); }
  m.sweep(keel, 0.55, 0.95, up);
  for (let x = -Lh + 0.7; x < Lh - 0.3; x += 0.8) {
    const a0 = rnd() < 0.1 ? rr(-0.9, -0.2) : -PI / 2, a1 = rnd() < 0.1 ? rr(0.2, 0.9) : PI / 2, pts = [];
    for (let i = 0; i <= 16; i++) pts.push(pt(x, mix(a0, a1, i / 16)));
    m.sweep(pts, 0.24, 0.3, out);
  }
  const holeX = rr(-6, 2), holeS = rnd() < 0.5 ? 1 : -1;
  const BR = [[holeX, holeS * 0.8, 3.2, 0.42], [7, -holeS * 0.95, 2.4, 0.34], [12, holeS * 0.5, 1.7, 0.28], [-11, -holeS * 0.55, 2.1, 0.3]];
  const holed = (x, ph) => { for (const h of BR) { const a = (x - h[0]) / h[2], b = (ph - h[1]) / h[3]; if (a * a + b * b < 1 + 0.45 * sin(x * 3.1 + ph * 9)) return true; } return false; };
  const NS = 14, xs = []; for (let x = -Lh + 0.35; x <= Lh - 0.3; x += 0.85) xs.push(x);
  for (let j = 0; j < NS; j++) {
    const p0 = mix(-1.5, 1.5, j / NS), p1 = mix(-1.5, 1.5, (j + 1) / NS), sg = p0 + p1 < 0 ? -1 : 1, lo = sg < 0 ? p1 : p0, hi = sg < 0 ? p0 : p1;
    let pv = null;
    for (const x of xs) {
      const cu = [m.v(...pt(x, lo, 0.27)), m.v(...pt(x, hi, 0.14)), m.v(...pt(x, lo, 0.1)), m.v(...pt(x, hi, 0.1))];
      if (pv && !holed(x - 0.42, (p0 + p1) / 2)) {
        if (sg > 0) { m.quad(pv[0], pv[1], cu[1], cu[0]); m.quad(pv[2], cu[2], cu[3], pv[3]); }
        else { m.quad(pv[0], cu[0], cu[1], pv[1]); m.quad(pv[2], pv[3], cu[3], cu[2]); }
      }
      pv = cu;
    }
  }
  for (const sgn of [-1, 1]) {
    let pts = []; for (let x = -Lh + 0.6; x <= Lh - 0.6; x += 1) pts.push(pt(x, sgn * PI / 2, 0.2)); m.sweep(pts, 0.3, 0.28, up);
    // stern castle bulwarks
    for (let j = 0; j < 3; j++) { pts = []; for (let x = -Lh + 0.4; x <= -Lh + 8.5 - j; x += 0.9) pts.push([x, sheer(x) + 0.55 + j * 0.86, sgn * (max(hb(x), 2.6) + 0.15)]); m.sweep(pts, 0.82, 0.09, () => [0, 0, sgn]); }
  }
  // transom
  for (let y = -3; y < sheer(-Lh) + 3; y += 0.86) { const w = max(1.2, 2.9 * sstep(-4.5, 1.5, y)); if (rnd() < 0.9) m.sweep([[-Lh + 0.35, y, -w], [-Lh + 0.35, y, w]], 0.82, 0.1, () => [1, 0, 0]); }
  for (let x = -Lh + 2; x < Lh - 2; x += rr(1.8, 3.2)) m.sweep([[x, sheer(x) - 0.25, -hb(x)], [x, sheer(x) - 0.2, 0], [x, sheer(x) - 0.25, hb(x)]], 0.26, 0.26, up);
  for (let z = -3.9; z <= 3.9; z += 0.62) { let x = -Lh + rr(1, 5); while (x < Lh - 4) { const x1 = min(x + rr(3, 9), Lh - 3.5); if (rnd() < 0.6) { const pts = []; for (let xx = x; xx <= x1; xx += 1) if (hb(xx) > abs(z) + 0.3) pts.push([xx, sheer(xx) - 0.05, z]); if (pts.length > 1) m.sweep(pts, 0.56, 0.07, up); } x = x1 + rr(0.5, 3); } }
  // foremast with yard, broken main mast, bowsprit
  m.sweep([[7, -Dp + 0.6, 0], [7.1, 1, 0], [7.4, 8, 0.3], [7.8, 15, 0.8]], (k) => 0.62 - k * 0.1, (k) => 0.62 - k * 0.1, () => [1, 0, 0]);
  m.sweep([[7.5, 9.5, -5.2], [7.5, 9.6, 0.3], [7.5, 9.2, 5.6]], 0.26, 0.26, up);
  m.sweep([[7.7, 13.2, -3.2], [7.7, 13.3, 3.6]], 0.2, 0.2, up);
  m.sweep([[-3, -Dp + 0.6, 0], [-3.2, 1, 0.2], [-3.9, 6, 1.0], [-5.2, 9.5, 2.6]], (k) => 0.74 - k * 0.1, (k) => 0.74 - k * 0.1, () => [1, 0, 0]);
  m.sweep([[Lh + 1.4, 2.6, 0], [Lh + 8, 5.2, 0.2]], 0.34, 0.34, up);
  return m;
}
// manta ray: span along x (half span = 1), nose +z; aux = span coordinate for the flap animation
function meshManta() {
  const m = new Mesh(), NU = 72, M = 22, rings = [];
  for (let j = 0; j <= NU; j++) {
    const u = j / NU * 2 - 1, au = abs(u);
    let zl = 0.52 - 0.74 * pow(au, 1.35) + 0.07 * exp(-pow((au - 0.13) / 0.05, 2)) - 0.05 * exp(-pow(au / 0.05, 2)) - 0.08 * pow(au, 5);
    const zt = -0.5 + 0.3 * pow(au, 0.8) + 0.02 - 0.08 * pow(au, 5);
    if (zl < zt + 0.004) zl = zt + 0.004;
    const th = 0.08 * pow(1 - au, 1.15) + 0.004 + 0.12 * exp(-pow(u / 0.2, 2)), ring = [];
    for (let k = 0; k < M; k++) { const a = k / M * TAU; ring.push(m.v(u, th * sin(a) * (0.62 + 0.38 * cos(a)), mix(zt, zl, 0.5 + 0.5 * cos(a)), u)); }
    rings.push(ring);
  }
  for (let j = 0; j < NU; j++) for (let k = 0; k < M; k++) { const k2 = (k + 1) % M; m.quad(rings[j][k], rings[j + 1][k], rings[j + 1][k2], rings[j][k2]); }
  const tail = []; for (let i = 0; i <= 8; i++) tail.push([0, 0, -0.42 - i * 0.19]);
  const n0 = m.p.length / 3;
  m.tube(tail, (k) => 0.016 * (1 - k / 9), 4, true);
  for (let k = n0; k < m.aux.length; k++) m.aux[k] = 0;
  for (const sx of [-1, 1]) { // cephalic fins
    const n1 = m.p.length / 3;
    m.tube([[sx * 0.12, -0.02, 0.48], [sx * 0.135, -0.05, 0.6], [sx * 0.115, -0.09, 0.69], [sx * 0.085, -0.125, 0.74]], (k) => 0.045 * (1 - k / 4.4), 6, true);
    for (let k = n1; k < m.aux.length; k++) m.aux[k] = sx * 0.1;
  }
  return m;
}
function meshFish() {
  const m = new Mesh();
  const X = [0.5, 0.3, 0.05, -0.22, -0.34], H = [0.01, 0.13, 0.17, 0.09, 0.035], Wd = [0.01, 0.05, 0.065, 0.03, 0.012], rings = [];
  for (let i = 0; i < 5; i++) { const r = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; r.push(m.v(X[i], sin(a) * H[i], cos(a) * Wd[i])); } rings.push(r); }
  for (let i = 0; i < 4; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; m.quad(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k2]); }
  const a = m.v(-0.33, 0, 0), b = m.v(-0.56, 0.2, 0), c = m.v(-0.47, 0, 0), d = m.v(-0.56, -0.2, 0);
  m.tri(a, b, c); m.tri(a, c, d);
  return m;
}
// jellyfish: lathe bell (aux 0) + 8 tentacle tubes (aux 1), bell rim at y 0, tentacles hanging to about -1.7
function meshJelly() {
  const m = new Mesh();
  const bell = meshLathe([[0.02, 0.5, 0], [0.35, 0.42, 0], [0.55, 0.22, 0], [0.58, 0.0, 0], [0.5, -0.12, 0], [0.3, -0.18, 0], [0.02, -0.2, 0]], 18, 0);
  m.p.push(...bell.p); m.i.push(...bell.i); m.aux.push(...bell.aux);
  for (let k = 0; k < 8; k++) {
    const a = k / 8 * TAU, bx = cos(a) * 0.35, bz = sin(a) * 0.35, pts = [];
    for (let j = 0; j <= 4; j++) pts.push([bx + sin(a + j * 1.3) * 0.08 * j / 4, -0.15 - j * 0.38, bz + cos(a + j * 1.1) * 0.08 * j / 4]);
    m.tube(pts, (q) => 0.035 * (1 - q / 5), 4, true, () => 1);
  }
  return m;
}
// mecha worm: 8 segments along -x from the head at +x, radius pinching at the joints (aux = segment / 7),
// plus a drill nose cone ahead of the head (aux 0)
function meshWorm() {
  const m = new Mesh();
  const pts = [];
  for (let k = 0; k <= 16; k++) pts.push([-k * 0.32, 0, 0]);
  m.tube(pts, (k) => 0.3 * (k % 2 === 0 ? 0.78 : 1.0), 8, true, (k) => floor(k / 2) / 7);
  m.tube([[0.05, 0, 0], [0.5, 0, 0], [0.95, 0, 0]], (k) => 0.26 * (1 - k / 2.4), 8, true, () => 0);
  return m;
}

// ---------------------------------------------------------------- Ocean City (v2.0): high-tech ruins
// a tall spire: stepped octagonal tower with a pointed tip (base at y 0, ~42 tall)
function meshTower() {
  return meshLathe([[5, 0, 1], [5, 8, 1], [3.5, 8, 1], [3.5, 28, 1], [2, 28, 1], [2, 34, 1], [0.01, 42, 1]], 8, 0);
}
// an energy column: flared base and capital, glowing shaft
function meshColumn() {
  return meshLathe([[1.8, 0, 1], [1.8, 1, 1], [1.2, 1, 1], [1.2, 17, 1], [1.8, 17, 1], [1.8, 18, 1], [0.01, 18.5, 1]], 8, 0);
}
// a dome: squashed hemisphere (base at y 0, radius 8, height 6)
function meshDome() {
  return meshLathe([[8, 0, 1], [7.4, 1.5, 1], [5.7, 3, 1], [3.5, 4.5, 1], [0.01, 6, 1]], 16, 0);
}
// a portal ring: torus in the XY plane, radius 10, tube 1.5 (centre at the origin)
function meshGate() {
  const m = new Mesh(), pts = [];
  for (let k = 0; k <= 16; k++) { const a = k / 16 * TAU; pts.push([cos(a) * 10, sin(a) * 10, 0]); }
  m.tube(pts, 1.5, 8, false, () => 1);
  return m;
}
// a floating crystal: elongated octahedron, centre at the origin
function meshCrystal() {
  const m = new Mesh();
  const T = m.v(0, 3, 0, 1), B = m.v(0, -3, 0, 1), M = [];
  for (let s = 0; s < 4; s++) { const a = s / 4 * TAU; M.push(m.v(cos(a) * 1.2, 0, sin(a) * 1.2, 1)); }
  for (let s = 0; s < 4; s++) { const s2 = (s + 1) % 4; m.tri(T, M[s2], M[s]); m.tri(B, M[s], M[s2]); }
  return m;
}
// a colossal robed statue: lathe body, octahedron head, tube arms (base at y 0, ~22 tall)
function meshStatue() {
  const m = new Mesh();
  const body = meshLathe([[4, 0, 1], [3.5, 4, 1], [2.8, 9, 1], [2, 13, 1], [1.6, 15, 1], [1.7, 17, 1], [1.2, 19, 1], [0.01, 20, 1]], 8, 0);
  m.p.push(...body.p); m.i.push(...body.i); m.aux.push(...body.aux);
  const top = m.v(0, 22.2, 0, 1), bot = m.v(0, 19.8, 0, 1), R = [];
  for (let s = 0; s < 4; s++) { const a = s / 4 * TAU; R.push(m.v(cos(a) * 1.1, 21, sin(a) * 1.1, 1)); }
  for (let s = 0; s < 4; s++) { const s2 = (s + 1) % 4; m.tri(top, R[s2], R[s]); m.tri(bot, R[s], R[s2]); }
  m.tube([[1.4, 18, 0], [2.2, 15, 0.3], [2.6, 12, 0.5]], 0.4, 6, true, () => 1);
  m.tube([[-1.4, 18, 0], [-2.2, 15, -0.3], [-2.6, 12, -0.5]], 0.4, 6, true, () => 1);
  return m;
}
// a paved plaza disc: flat-topped cylinder, radius 18, height 1.5 (base at y 0)
function meshPlaza() {
  return meshLathe([[18, 0, 1], [18, 1.5, 1], [0.01, 1.5, 1]], 24, 0);
}
// a magical rune: two flat glowing annuli on the ground (outer 8/6.5, inner 3.5/2.8), double-sided
function meshRune() {
  const m = new Mesh();
  const ring = (ro, ri) => {
    const O = [], I = [];
    for (let s = 0; s < 16; s++) { const a = s / 16 * TAU; O.push(m.v(cos(a) * ro, 0, sin(a) * ro, 1)); I.push(m.v(cos(a) * ri, 0, sin(a) * ri, 1)); }
    for (let s = 0; s < 16; s++) { const s2 = (s + 1) % 16; m.quad(O[s2], O[s], I[s], I[s2]); m.quad(O[s], O[s2], I[s2], I[s]); }
  };
  ring(8, 6.5); ring(3.5, 2.8);
  return m;
}
// an energy conduit: a straight thin tube along x, 30 long, centred at the origin
function meshConduit() {
  const m = new Mesh();
  m.tube([[-15, 0, 0], [-5, 0, 0], [5, 0, 0], [15, 0, 0]], 0.4, 6, true, () => 1);
  return m;
}
// an electric arc: a jagged bolt tube, 15 tall (base at y 0)
function meshArc() {
  const m = new Mesh();
  m.tube([[0, 0, 0], [2, 3, 1], [1, 6, -1], [3, 9, 0], [2, 12, 1], [0, 15, 0]], 0.25, 5, true, () => 1);
  return m;
}

// ---------------------------------------------------------------- Ocean City creatures (v2.0)
// a tube body from rings (x, half-height, half-width), 6 sides, head at +x (like meshFish)
function bodyRings(m, X, H, W) {
  const rings = [];
  for (let i = 0; i < X.length; i++) { const r = []; for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; r.push(m.v(X[i], sin(a) * H[i], cos(a) * W[i])); } rings.push(r); }
  for (let i = 0; i < X.length - 1; i++) for (let k = 0; k < 6; k++) { const k2 = (k + 1) % 6; m.quad(rings[i][k], rings[i + 1][k], rings[i + 1][k2], rings[i][k2]); }
}
// a flat fin, double-sided
function fin(m, a, b, c) { m.tri(a, b, c); m.tri(a, c, b); }
// a shark: streamlined body (head +x, tail -x), dorsal fin, tail fluke, pectoral fins
function meshShark() {
  const m = new Mesh();
  bodyRings(m, [0.55, 0.4, 0.15, -0.15, -0.4], [0.02, 0.1, 0.15, 0.1, 0.03], [0.02, 0.07, 0.09, 0.05, 0.015]);
  fin(m, m.v(0.25, 0.12, 0), m.v(0.1, 0.38, 0), m.v(-0.05, 0.12, 0)); // dorsal
  fin(m, m.v(-0.4, 0, 0), m.v(-0.62, 0.28, 0), m.v(-0.55, 0, 0)); // tail fluke, upper
  fin(m, m.v(-0.4, 0, 0), m.v(-0.55, 0, 0), m.v(-0.62, -0.28, 0)); // tail fluke, lower
  fin(m, m.v(0.25, -0.05, 0.06), m.v(-0.05, -0.05, 0.06), m.v(0.1, -0.08, 0.35)); // pectoral, right
  fin(m, m.v(0.25, -0.05, -0.06), m.v(0.1, -0.08, -0.35), m.v(-0.05, -0.05, -0.06)); // pectoral, left
  return m;
}
// a whale: big rounded body (head +x, tail -x), horizontal tail fluke, long pectoral fins
function meshWhale() {
  const m = new Mesh();
  bodyRings(m, [0.55, 0.35, 0.0, -0.3, -0.48], [0.05, 0.18, 0.22, 0.15, 0.05], [0.05, 0.15, 0.18, 0.12, 0.04]);
  fin(m, m.v(-0.48, 0, 0), m.v(-0.62, 0, 0.12), m.v(-0.7, 0, 0.35)); // tail fluke, right
  fin(m, m.v(-0.48, 0, 0), m.v(-0.7, 0, -0.35), m.v(-0.62, 0, -0.12)); // tail fluke, left
  fin(m, m.v(0.3, -0.1, 0.15), m.v(-0.1, -0.12, 0.15), m.v(-0.05, -0.15, 0.55)); // pectoral, right
  fin(m, m.v(0.3, -0.1, -0.15), m.v(-0.05, -0.15, -0.55), m.v(-0.1, -0.12, -0.15)); // pectoral, left
  return m;
}
// a sea turtle: domed shell (head +x), four flippers, small head
function meshTurtle() {
  const m = new Mesh();
  bodyRings(m, [0.38, 0.18, -0.08, -0.3], [0.06, 0.15, 0.17, 0.09], [0.08, 0.19, 0.21, 0.11]);
  fin(m, m.v(0.38, 0, 0), m.v(0.55, 0.05, 0), m.v(0.55, -0.05, 0)); // head
  fin(m, m.v(0.25, -0.08, 0.18), m.v(-0.05, -0.08, 0.2), m.v(0.1, -0.1, 0.5)); // front flipper, right
  fin(m, m.v(0.25, -0.08, -0.18), m.v(0.1, -0.1, -0.5), m.v(-0.05, -0.08, -0.2)); // front flipper, left
  fin(m, m.v(-0.15, -0.08, 0.15), m.v(-0.3, -0.08, 0.12), m.v(-0.2, -0.1, 0.4)); // rear flipper, right
  fin(m, m.v(-0.15, -0.08, -0.15), m.v(-0.2, -0.1, -0.4), m.v(-0.3, -0.08, -0.12)); // rear flipper, left
  return m;
}
// a mermaid: humanoid head and torso (head +x), flowing hair, fish tail (-x)
function meshMermaid() {
  const m = new Mesh();
  bodyRings(m, [0.32, 0.18, 0.0, -0.12], [0.05, 0.09, 0.1, 0.07], [0.05, 0.08, 0.09, 0.06]);
  const hx = 0.42, hr = 0.09;
  const top = m.v(hx, hr, 0), bot = m.v(hx, -hr, 0), R = [];
  for (let s = 0; s < 4; s++) { const a = s / 4 * TAU; R.push(m.v(hx + cos(a) * hr, 0, sin(a) * hr)); }
  for (let s = 0; s < 4; s++) { const s2 = (s + 1) % 4; m.tri(top, R[s2], R[s]); m.tri(bot, R[s], R[s2]); }
  m.tube([[0.4, 0.06, 0], [0.2, 0.04, 0], [-0.05, 0, 0]], 0.05, 5, true, () => 1); // hair
  m.tube([[0.28, 0.02, 0.07], [0.1, 0.0, 0.22], [-0.08, -0.02, 0.3]], 0.03, 5, true, () => 1); // arm, right
  m.tube([[0.28, 0.02, -0.07], [0.1, 0.0, -0.22], [-0.08, -0.02, -0.3]], 0.03, 5, true, () => 1); // arm, left
  fin(m, m.v(-0.12, 0, 0), m.v(-0.4, 0.22, 0), m.v(-0.32, 0, 0)); // tail, upper
  fin(m, m.v(-0.12, 0, 0), m.v(-0.32, 0, 0), m.v(-0.4, -0.22, 0)); // tail, lower
  return m;
}

// ---------------------------------------------------------------- Ocean City v2.7: real low-poly models (Gobkit CC0)
// Converted from GLB to the Mesh format (positions + indices, normals computed by Mesh.build).
// Both face +x (head at +x) so they work with vsFish / vsWorm. Attribution: Gobkit, CC0.
// Angler - Gobkit CC0 (https://gobkit.com/freebies/animal/Anglerfish.glb), 266 tris, normalized to 1.06 long, head at +x
function meshAngler() {
  const m = new Mesh();
  m.p = [0.324,-0.132,0,0.355,0,0,0.26,-0.143,0.194,0.324,-0.132,0,0.26,-0.143,-0.194,0.355,0,0,0.063,0,0.32,0.063,0.226,0.226,-0.122,0.185,0.185,-0.164,0,0.226,-0.258,0,0,-0.164,0.226,0,-0.122,0.185,-0.185,-0.164,0,-0.226,0.063,0,-0.32,0.063,0.226,-0.226,0.248,0.185,-0.185,0.289,0,-0.226,0.353,0,0,0.289,0.226,0,0.248,0.185,0.185,0.289,0,0.226,0.063,-0.32,0,0.063,-0.226,-0.226,0.248,-0.185,-0.185,0.289,-0.226,0,0.063,0.32,0,0.063,0.226,0.226,0.063,0.32,0,0.063,0.226,-0.226,0.063,-0.226,0.226,0.248,-0.185,0.185,-0.122,-0.185,0.185,-0.164,-0.226,0,0.063,-0.32,0,0.063,-0.226,0.226,-0.122,-0.185,-0.185,0.063,-0.226,-0.226,0.063,0,-0.32,0.063,0,0.32,0.251,0.186,0,0.233,0.2,0.04,0.282,0.269,0.034,0.297,0.257,0,0.198,0.229,0.04,0.18,0.244,0,0.236,0.307,0,0.251,0.295,0.034,0.198,0.229,-0.04,0.251,0.295,-0.034,0.233,0.2,-0.04,0.282,0.269,-0.034,0.233,0.2,0.04,0.282,0.269,0.034,0.233,0.2,-0.04,0.282,0.269,-0.034,0.357,0.287,-0.016,0.358,0.295,0,0.353,0.263,0,0.354,0.271,-0.016,0.357,0.287,0.016,0.354,0.271,0.016,0.354,0.271,-0.016,0.354,0.271,0.016,0.452,0.217,-0.008,0.458,0.224,-0.008,0.452,0.217,0.008,0.449,0.214,0,0.461,0.227,0,0.458,0.224,0.008,0.011,-0.027,-0.32,0.019,-0.012,-0.298,-0.057,0.057,-0.511,-0.008,-0.187,-0.4,0.033,-0.027,-0.329,0.045,-0.029,-0.304,0.043,-0.011,-0.308,0.021,-0.03,-0.294,0.019,-0.012,-0.298,-0.057,0.057,-0.511,0.033,-0.027,-0.329,0.011,-0.027,-0.32,-0.008,-0.187,-0.4,0.021,-0.03,-0.294,0.011,-0.027,-0.32,-0.004,-0.172,-0.392,-0.005,-0.172,-0.391,-0.047,0.046,-0.485,-0.046,0.046,-0.485,0.031,-0.017,-0.305,0.032,-0.025,-0.303,0.029,-0.018,-0.304,0.03,-0.025,-0.303,0.029,-0.018,-0.304,-0.047,0.046,-0.485,-0.005,-0.172,-0.391,0.03,-0.025,-0.303,0.011,-0.027,0.32,-0.057,0.057,0.511,0.019,-0.012,0.298,-0.008,-0.187,0.4,0.045,-0.029,0.304,0.033,-0.027,0.329,0.043,-0.011,0.308,0.021,-0.03,0.294,0.043,-0.011,0.308,0.045,-0.029,0.304,-0.057,0.057,0.511,0.033,-0.027,0.329,-0.008,-0.187,0.4,0.011,-0.027,0.32,0.033,-0.027,0.329,-0.004,-0.172,0.392,-0.046,0.046,0.485,-0.047,0.046,0.485,-0.005,-0.172,0.391,0.031,-0.017,0.305,-0.046,0.046,0.485,-0.004,-0.172,0.392,0.032,-0.025,0.303,0.031,-0.017,0.305,0.032,-0.025,0.303,0.03,-0.025,0.303,0.029,-0.018,0.304,0.455,0.22,0.075,0.455,0.274,0.053,0.411,0.264,0.044,0.401,0.22,0.053,0.379,0.22,0,0.401,0.274,0,0.411,0.264,-0.044,0.401,0.22,-0.053,0.455,0.22,-0.075,0.455,0.274,-0.053,0.498,0.264,-0.044,0.508,0.22,-0.053,0.53,0.22,0,0.508,0.274,0,0.498,0.264,0.044,0.508,0.22,0.053,0.455,0.145,0,0.455,0.167,-0.053,0.498,0.177,-0.044,0.508,0.167,0,0.455,0.296,0,0.455,0.274,0.053,0.455,0.296,0,0.455,0.274,-0.053,0.455,0.167,0.053,0.498,0.177,0.044,0.411,0.177,0.044,0.401,0.167,0,0.455,0.145,0,0.455,0.167,0.053,0.411,0.177,-0.044,0.455,0.167,-0.053,0.53,0.22,0,0.508,0.22,0.053,0.508,0.22,-0.053,0.455,0.22,-0.075,0.401,0.22,-0.053,0.455,0.22,-0.075,0.455,0.22,-0.075,0.379,0.22,0,0.401,0.22,0.053,0.455,0.22,0.075,0.455,0.22,0.075,0.455,0.22,0.075,0.326,0.102,0.073,0.322,0.123,0.083,0.311,0.134,0.121,0.318,0.109,0.1,0.332,0.081,0.053,0.332,0.004,0.074,0.33,-0.013,0.085,0.335,0.025,0.054,0.325,-0.003,0.101,0.321,-0.024,0.124,0.318,0.004,0.129,0.311,-0.013,0.162,0.311,0.025,0.148,0.302,0.015,0.19,0.308,0.053,0.155,0.297,0.055,0.199,0.308,0.081,0.147,0.297,0.094,0.188,0.312,0.102,0.127,0.302,0.123,0.16,0.322,0.053,0.101,0.326,0.102,0.073,0.318,0.109,0.1,0.322,0.053,0.101,0.332,0.081,0.053,0.322,0.053,0.101,0.335,0.053,0.046,0.322,0.053,0.101,0.335,0.025,0.054,0.322,0.053,0.101,0.332,0.004,0.074,0.322,0.053,0.101,0.325,-0.003,0.101,0.322,0.053,0.101,0.318,0.004,0.129,0.322,0.053,0.101,0.311,0.025,0.148,0.322,0.053,0.101,0.308,0.053,0.155,0.322,0.053,0.101,0.308,0.081,0.147,0.322,0.053,0.101,0.312,0.102,0.127,0.322,0.053,0.101,0.326,0.102,-0.073,0.318,0.109,-0.1,0.311,0.134,-0.121,0.322,0.123,-0.083,0.332,0.081,-0.053,0.332,0.004,-0.074,0.335,0.025,-0.054,0.33,-0.013,-0.085,0.325,-0.003,-0.101,0.321,-0.024,-0.124,0.318,0.004,-0.129,0.311,-0.013,-0.162,0.311,0.025,-0.148,0.302,0.015,-0.19,0.308,0.053,-0.155,0.297,0.055,-0.199,0.308,0.081,-0.147,0.297,0.094,-0.188,0.312,0.102,-0.127,0.302,0.123,-0.16,0.322,0.053,-0.101,0.318,0.109,-0.1,0.326,0.102,-0.073,0.322,0.053,-0.101,0.332,0.081,-0.053,0.322,0.053,-0.101,0.335,0.053,-0.046,0.322,0.053,-0.101,0.335,0.025,-0.054,0.322,0.053,-0.101,0.332,0.004,-0.074,0.322,0.053,-0.101,0.325,-0.003,-0.101,0.322,0.053,-0.101,0.318,0.004,-0.129,0.322,0.053,-0.101,0.311,0.025,-0.148,0.322,0.053,-0.101,0.308,0.053,-0.155,0.322,0.053,-0.101,0.308,0.081,-0.147,0.322,0.053,-0.101,0.312,0.102,-0.127,0.322,0.053,-0.101,-0.286,0,0.017,-0.249,0.013,0.018,-0.53,0.186,0,-0.453,-0.188,0,-0.286,0,-0.017,-0.249,-0.013,-0.018,-0.249,0.013,-0.018,-0.249,-0.013,0.018,-0.249,0.013,0.018,-0.53,0.186,0,-0.453,-0.188,0,-0.249,-0.013,0.018,-0.286,0,0.017,-0.436,-0.17,-0.001,-0.436,-0.17,0.001,-0.496,0.161,0.001,-0.496,0.161,-0.001,-0.254,0.006,-0.001,-0.254,-0.006,-0.001,-0.254,0.006,0.001,-0.254,-0.006,0.001,-0.254,0.006,0.001,-0.496,0.161,0.001,-0.436,-0.17,0.001,-0.254,-0.006,0.001];
  m.i = [0,1,2,3,4,5,6,7,8,6,8,9,10,11,12,10,12,13,14,15,16,14,16,17,18,19,20,18,20,21,22,23,24,22,24,25,26,27,20,26,20,19,15,26,19,15,19,16,12,11,28,12,28,29,11,8,7,11,7,28,30,22,25,30,25,31,32,33,34,32,34,35,33,36,37,33,37,34,18,21,31,24,17,18,17,16,19,17,19,18,23,14,17,23,17,24,36,13,38,36,38,37,13,12,29,13,29,38,33,10,13,33,13,36,32,9,10,32,10,33,9,8,11,9,11,10,35,6,9,35,9,32,31,21,39,31,39,30,21,20,27,21,27,39,25,18,31,25,24,18,40,41,42,40,42,43,44,45,46,44,46,47,45,48,49,45,49,46,50,40,43,50,43,51,52,44,47,52,47,53,48,54,55,48,55,49,46,49,56,46,56,57,51,43,58,51,58,59,53,47,60,53,60,61,49,55,62,49,62,56,43,42,63,43,63,58,47,46,57,47,57,60,56,62,64,56,64,65,58,63,66,58,66,67,60,57,68,60,68,69,57,56,65,57,65,68,59,58,67,59,67,64,61,60,69,61,69,66,70,71,72,73,74,75,76,75,74,77,75,76,77,76,78,79,78,76,79,76,80,73,75,77,81,82,83,79,80,84,73,84,80,71,70,83,85,86,87,85,87,88,89,90,85,89,85,88,89,91,92,89,92,90,85,90,92,85,92,86,93,94,95,93,95,96,88,87,91,88,91,89,97,98,99,100,101,102,103,102,101,104,99,105,104,105,106,98,105,99,107,108,103,109,104,106,110,104,109,98,110,111,109,111,110,99,104,97,112,113,114,112,114,115,116,117,118,116,118,119,120,121,122,120,122,123,112,115,122,112,122,121,123,122,115,123,115,114,113,120,123,113,123,114,124,125,126,124,126,127,128,129,130,128,130,131,132,133,134,132,134,135,136,137,138,136,138,139,140,141,142,140,142,143,144,145,138,144,138,137,133,144,137,133,137,134,130,129,146,130,146,147,129,126,125,129,125,146,148,140,143,148,143,149,150,151,152,150,152,153,151,154,155,151,155,152,143,156,157,143,157,149,142,158,156,142,156,143,135,134,137,135,137,136,141,159,158,141,158,142,154,160,161,154,161,155,131,130,147,131,147,162,151,163,160,151,160,154,150,164,163,150,163,151,127,126,129,127,129,128,153,165,164,153,164,150,149,157,166,149,166,148,139,138,145,139,145,167,168,169,170,168,170,171,172,169,168,173,174,175,176,177,174,176,174,173,178,179,177,178,177,176,180,181,179,180,179,178,182,183,181,182,181,180,184,185,183,184,183,182,186,187,185,186,185,184,171,170,187,171,187,186,188,189,190,191,192,189,193,194,192,195,196,194,197,198,196,199,200,198,201,202,200,203,204,202,205,206,204,207,208,206,209,210,208,211,190,210,212,213,214,212,214,215,216,212,215,217,218,219,220,217,219,220,219,221,222,220,221,222,221,223,224,222,223,224,223,225,226,224,225,226,225,227,228,226,227,228,227,229,230,228,229,230,229,231,213,230,231,213,231,214,232,233,234,235,234,236,237,236,238,239,238,240,241,240,242,243,242,244,245,244,246,247,246,248,249,248,250,251,250,252,253,252,254,255,254,233,256,257,258,259,260,261,262,261,260,263,261,262,263,262,264,265,264,262,265,262,260,259,261,263,256,266,267,265,260,268,259,268,260,257,256,267,269,270,271,269,271,272,273,274,269,273,269,272,273,275,276,273,276,274,269,274,276,269,276,270,277,278,279,277,279,280,272,271,275,272,275,273];
  m.aux = new Array(281).fill(0);
  return m;
}

// Plesio - Gobkit CC0 (https://gobkit.com/freebies/dino/Plesiosaurus.glb), 644 tris, normalized to 6.0 long, head at +x
function meshPlesio() {
  const m = new Mesh();
  m.p = [-1.965,-0.232,0,-1.184,-0.092,0,-1.971,-0.29,-0.191,-2.821,-0.226,-0.088,-2.862,-0.178,-0.001,-2.821,-0.226,0.088,-1.971,-0.29,0.191,-1.177,-0.171,-0.211,-1.161,-0.364,-0.298,-1.99,-0.464,-0.255,-2.897,-0.276,-0.114,-1.99,-0.464,0.255,-2.897,-0.276,0.114,-1.177,-0.171,0.21,-1.161,-0.363,0.298,-3,-0.238,0.002,-2.881,-0.374,-0.087,-2.943,-0.372,-0.001,-2.015,-0.696,0,-2.009,-0.638,-0.191,-2.881,-0.374,0.087,-2.009,-0.638,0.191,-1.137,-0.635,0,-1.144,-0.556,-0.211,-1.144,-0.556,0.21,0.352,-0.501,0.455,0.313,-0.779,0.369,0.352,-0.501,0.305,0.318,-0.779,0.506,0.15,-0.501,0.305,0.27,-1.052,0.465,0.15,-0.501,0.455,0.115,-0.779,0.506,0.237,-1.237,0.599,0.063,-1.047,0.458,0.281,-1.015,0.578,0.245,-1.171,0.687,0.023,-1.231,0.599,-0.091,-0.779,0.364,0.115,-0.779,0.356,-0.134,-1.044,0.464,0.217,-1.31,0.775,0.01,-1.312,0.766,-0.042,-1.34,1.04,-0.202,-1.379,1.265,-0.202,-1.36,1.091,-0.202,-1.342,0.918,0.188,-1.324,0.948,0.114,-1.331,1.102,0.215,-1.221,0.828,0.18,-1.232,0.97,-0.011,-1.35,1.216,-0.013,-1.261,1.203,0.109,-1.241,1.098,-0.202,-1.288,1.249,-0.052,-0.501,0.455,-0.086,-0.779,0.503,-0.128,-1.015,0.567,0.074,-1.021,0.568,-0.052,-0.501,0.305,-0.069,-1.252,1.02,-0.198,-1.243,0.961,-0.2,-1.261,1.105,0.006,-1.216,0.823,-0.193,-1.223,0.812,-0.167,-1.172,0.67,-0.191,-1.301,0.765,0.036,-1.177,0.671,-0.169,-1.225,0.6,2.398,0.759,-0.281,2.252,0.583,-0.285,2.179,0.859,-0.387,2.675,0.674,-0.193,2.503,0.645,-0.198,2.533,0.559,0,2.782,0.744,-0.219,2.282,0.483,0,2.929,0.74,0,2.788,0.594,0,2.746,0.95,0.193,2.484,1.134,0,2.51,1.001,0.264,2.469,0.826,0.299,2.817,0.805,0.248,3,0.807,0,2.845,1.008,0,2.746,0.95,-0.193,2.817,0.805,0.248,2.486,0.828,0,2.83,0.807,0,2.469,0.826,0.299,2.817,0.805,-0.248,3,0.807,0,2.11,0.868,0,2.503,0.645,0.198,2.252,0.583,0.285,2.675,0.674,0.193,2.398,0.759,0.281,2.034,0.438,0,1.537,0.593,0.281,1.133,0.897,0,1.395,0.546,0,2.022,0.869,0.453,1.33,0.839,0.449,2.04,0.575,0.39,1.561,1.266,0.396,2.246,1.149,0.309,2.017,1.273,0.397,2.179,0.859,0.387,2.04,0.575,-0.39,2.022,0.869,-0.453,2.51,1.001,-0.264,2.469,0.826,-0.299,2.278,1.279,0,2.782,0.744,0.219,2.246,1.149,-0.309,2.017,1.273,-0.397,2.052,1.379,0,2.179,0.859,-0.387,2.469,0.826,-0.299,2.179,0.859,0.387,2.398,0.759,0.281,2.412,0.761,0,2.398,0.759,-0.281,2.817,0.805,-0.248,1.362,1.27,0,1.537,0.593,-0.281,1.561,1.266,-0.396,1.33,0.839,-0.449,2.782,0.744,0.219,2.81,0.738,0,2.782,0.744,-0.219,2.929,0.74,0,0.622,-0.482,-0.497,-0.247,-0.481,-0.768,0.279,-0.226,-0.469,0.523,-0.825,-0.544,-0.268,-1.019,-0.771,-0.861,0,-0.382,-0.163,0.031,-0.465,-1.164,-0.884,-0.557,-1.376,-0.308,-0.414,0.25,0.141,-0.324,0.569,-0.026,-0.359,0.747,-0.201,-0.228,0.117,0.178,0,1.169,0.508,0.211,1.415,0.93,0.176,1.261,0.943,0.12,0.995,0.578,0.138,1.355,0.405,0.153,1.587,0.935,0.119,0.93,0.598,0,-1.376,-0.308,0.414,-1.13,-0.996,0,-1.164,-0.884,0.557,-0.899,0.08,0,-1.441,-0.13,0,-0.861,0,0.382,-0.247,-0.481,0.768,-0.163,0.031,0.465,-0.342,0.135,0,-0.28,-1.215,0,0.548,-0.994,0,0.523,-0.825,0.544,-0.268,-1.019,0.771,0.995,0.578,-0.138,1.261,0.943,-0.12,1.169,0.508,-0.211,1.208,0.947,0,1.415,0.93,-0.176,1.355,0.405,-0.153,1.011,0.031,-0.19,0.831,0.198,-0.279,0.679,-0.527,0,0.279,-0.226,0.469,0.622,-0.482,0.497,0.635,0.331,-0.205,0.544,0.38,0,0.82,-0.323,0,1.677,0.942,0,1.419,0.359,0,1.011,0.031,0.19,1.076,-0.044,0,0.747,-0.201,0.228,0.25,0.141,0.324,0.831,0.198,0.279,0.569,-0.026,0.359,1.587,0.935,-0.119,0.635,0.331,0.205,1.854,1.185,0.419,1.905,1.225,0.413,1.79,1.259,0.404,1.936,1.161,0.425,1.771,1.166,0.419,1.994,1.1,0.438,1.927,0.881,0.475,1.892,0.83,0.483,1.989,0.938,0.467,1.844,0.861,0.476,1.775,0.802,0.484,1.762,0.885,0.469,1.66,0.836,0.475,1.704,0.946,0.456,1.578,0.922,0.457,1.551,1.037,0.436,1.684,1.028,0.441,1.586,1.15,0.417,1.709,1.108,0.428,1.674,1.231,0.405,1.849,1.023,0.447,1.936,1.161,0.425,1.854,1.185,0.419,1.849,1.023,0.447,1.994,1.1,0.438,1.849,1.023,0.447,2.013,1.019,0.453,1.849,1.023,0.447,1.989,0.938,0.467,1.849,1.023,0.447,1.927,0.881,0.475,1.849,1.023,0.447,1.844,0.861,0.476,1.849,1.023,0.447,1.762,0.885,0.469,1.849,1.023,0.447,1.704,0.946,0.456,1.849,1.023,0.447,1.684,1.028,0.441,1.849,1.023,0.447,1.709,1.108,0.428,1.849,1.023,0.447,1.771,1.166,0.419,1.849,1.023,0.447,1.849,1.023,-0.447,1.771,1.166,-0.419,1.854,1.185,-0.419,1.849,1.023,-0.447,1.684,1.028,-0.441,1.709,1.108,-0.428,1.849,1.023,-0.447,1.762,0.885,-0.469,1.704,0.946,-0.456,1.849,1.023,-0.447,1.849,1.023,-0.447,1.844,0.861,-0.476,1.849,1.023,-0.447,1.927,0.881,-0.475,1.849,1.023,-0.447,1.989,0.938,-0.467,1.849,1.023,-0.447,2.013,1.019,-0.453,1.849,1.023,-0.447,1.994,1.1,-0.438,1.849,1.023,-0.447,1.849,1.023,-0.447,1.936,1.161,-0.425,1.849,1.023,-0.447,1.709,1.108,-0.428,1.674,1.231,-0.405,1.771,1.166,-0.419,1.586,1.15,-0.417,1.79,1.259,-0.404,1.854,1.185,-0.419,1.684,1.028,-0.441,1.551,1.037,-0.436,1.704,0.946,-0.456,1.578,0.922,-0.457,1.66,0.836,-0.475,1.762,0.885,-0.469,1.775,0.802,-0.484,1.844,0.861,-0.476,1.892,0.83,-0.483,1.927,0.881,-0.475,1.989,0.938,-0.467,1.994,1.1,-0.438,1.936,1.161,-0.425,1.905,1.225,-0.413,-0.511,-0.501,0.455,-0.546,-0.774,0.411,-0.511,-0.501,0.305,-0.541,-0.774,0.528,-0.713,-0.501,0.305,-0.713,-0.501,0.455,-0.74,-0.774,0.509,-0.59,-1.052,0.538,-0.641,-1.255,0.709,-0.859,-1.327,0.847,-0.837,-1.261,0.636,-0.798,-1.056,0.491,-0.679,-1.241,0.914,-0.695,-1.329,0.913,-1.032,-1.201,0.599,-0.992,-1.014,0.467,-0.948,-0.774,0.376,-0.753,-0.774,0.396,-0.581,-1.01,0.619,-0.631,-1.182,0.753,-1.052,-1.303,0.768,-0.873,-1.329,0.967,-1.069,-1.347,1.265,-1.065,-1.361,1.105,-0.748,-1.343,1.097,-1.064,-1.34,0.92,-0.883,-1.344,1.238,-1.069,-1.256,1.249,-0.915,-0.501,0.455,-0.945,-0.774,0.505,-0.978,-0.981,0.551,-0.775,-1,0.579,-0.915,-0.501,0.305,-0.905,-1.256,0.944,-1.063,-1.258,1.089,-0.877,-1.257,1.228,-0.745,-1.25,1.111,-1.059,-1.238,0.915,-0.868,-1.226,0.837,-1.046,-1.212,0.765,-0.822,-1.166,0.694,-1.015,-1.141,0.638,2.858,0.843,0.134,2.867,0.843,0.097,2.813,0.761,0.124,2.815,0.844,0.09,2.806,0.845,0.127,2.667,0.846,0.225,2.675,0.846,0.187,2.621,0.764,0.215,2.623,0.847,0.18,2.614,0.848,0.218,2.487,0.857,0.277,2.496,0.857,0.239,2.442,0.775,0.267,2.444,0.859,0.232,2.435,0.859,0.269,2.444,0.859,-0.232,2.442,0.775,-0.267,2.435,0.859,-0.269,2.487,0.857,-0.277,2.496,0.857,-0.239,2.623,0.847,-0.18,2.621,0.764,-0.215,2.614,0.848,-0.218,2.667,0.846,-0.225,2.675,0.846,-0.187,2.815,0.844,-0.09,2.813,0.761,-0.124,2.806,0.845,-0.127,2.858,0.843,-0.134,2.867,0.843,-0.097,2.92,0.854,0.058,2.961,0.829,0.03,2.934,0.86,0.035,2.935,0.831,0.062,2.961,0.829,-0.03,2.92,0.854,-0.058,2.934,0.86,-0.035,2.935,0.831,-0.062,0.352,-0.501,-0.305,0.313,-0.779,-0.369,0.352,-0.501,-0.455,0.318,-0.779,-0.506,0.27,-1.052,-0.465,0.15,-0.501,-0.305,0.115,-0.779,-0.356,0.063,-1.047,-0.458,0.237,-1.237,-0.599,-0.091,-0.779,-0.364,-0.134,-1.044,-0.464,0.281,-1.015,-0.578,0.023,-1.231,-0.599,0.217,-1.31,-0.775,-0.169,-1.225,-0.6,-0.042,-1.34,-1.04,0.01,-1.312,-0.766,-0.202,-1.342,-0.918,-0.202,-1.36,-1.091,-0.202,-1.379,-1.265,0.114,-1.331,-1.102,0.188,-1.324,-0.948,-0.011,-1.35,-1.216,-0.202,-1.288,-1.249,-0.013,-1.261,-1.203,-0.052,-0.501,-0.455,-0.052,-0.501,-0.305,0.15,-0.501,-0.455,0.115,-0.779,-0.506,-0.086,-0.779,-0.503,0.074,-1.021,-0.568,-0.069,-1.252,-1.02,0.109,-1.241,-1.098,0.18,-1.232,-0.97,0.006,-1.216,-0.823,-0.2,-1.261,-1.105,-0.198,-1.243,-0.961,-0.191,-1.301,-0.765,-0.167,-1.172,-0.67,-0.193,-1.223,-0.812,0.036,-1.177,-0.671,-0.128,-1.015,-0.567,0.245,-1.171,-0.687,0.215,-1.221,-0.828,-0.511,-0.501,-0.305,-0.546,-0.774,-0.411,-0.511,-0.501,-0.455,-0.59,-1.052,-0.538,-0.541,-0.774,-0.528,-0.713,-0.501,-0.305,-0.753,-0.774,-0.396,-0.798,-1.056,-0.491,-0.641,-1.255,-0.709,-0.948,-0.774,-0.376,-0.992,-1.014,-0.467,-1.032,-1.201,-0.599,-0.837,-1.261,-0.636,-0.679,-1.241,-0.914,-0.631,-1.182,-0.753,-0.859,-1.327,-0.847,-0.581,-1.01,-0.619,-1.052,-1.303,-0.768,-0.873,-1.329,-0.967,-0.748,-1.343,-1.097,-0.695,-1.329,-0.913,-1.069,-1.347,-1.265,-0.883,-1.344,-1.238,-1.064,-1.34,-0.92,-1.065,-1.361,-1.105,-0.915,-0.501,-0.455,-0.74,-0.774,-0.509,-0.945,-0.774,-0.505,-0.713,-0.501,-0.455,-0.915,-0.501,-0.305,-0.775,-1,-0.579,-0.978,-0.981,-0.551,-1.069,-1.256,-1.249,-0.905,-1.256,-0.944,-0.877,-1.257,-1.228,-1.063,-1.258,-1.089,-0.745,-1.25,-1.111,-1.059,-1.238,-0.915,-0.868,-1.226,-0.837,-1.046,-1.212,-0.765,-1.015,-1.141,-0.638,-0.822,-1.166,-0.694];
  m.i = [0,1,2,0,3,4,0,5,6,1,0,6,2,1,7,2,8,9,2,7,8,3,0,2,3,9,10,5,11,6,5,0,4,5,4,12,6,13,1,6,14,13,10,4,3,10,15,4,10,16,17,15,12,4,15,10,17,16,18,17,16,9,19,12,17,20,12,15,17,20,11,12,20,18,21,18,16,19,18,20,17,19,22,18,22,21,18,22,19,23,23,9,8,21,22,24,24,11,21,9,23,19,9,16,10,9,3,2,11,24,14,11,5,12,11,20,21,14,6,11,25,26,27,26,25,28,26,29,27,28,30,26,28,31,32,33,34,30,33,35,36,33,30,35,34,33,37,34,38,39,30,39,26,30,28,35,37,40,34,37,41,42,43,44,45,43,45,46,43,47,48,47,49,50,47,42,41,48,51,43,48,52,51,48,50,53,51,54,44,51,44,43,55,32,31,55,38,56,32,35,28,32,55,56,31,28,25,56,40,57,56,58,32,29,26,39,39,59,29,39,30,34,52,48,53,52,60,54,53,60,52,60,61,62,60,50,63,61,45,62,61,63,64,54,45,44,54,60,62,54,51,52,64,46,61,64,63,65,64,65,66,65,63,67,65,68,66,68,57,40,68,42,66,42,68,37,42,47,43,42,46,66,35,32,58,35,58,36,36,41,33,45,61,46,45,54,62,46,64,66,46,42,43,41,36,49,41,37,33,49,47,41,50,60,53,50,48,47,59,39,38,38,55,59,38,34,40,40,37,68,40,56,38,57,65,67,57,68,65,63,61,60,63,50,49,63,49,67,67,49,36,58,56,57,58,57,67,58,67,36,69,70,71,69,72,73,72,74,73,72,69,75,73,76,70,75,77,78,79,80,81,79,82,83,79,84,85,84,86,85,84,79,83,87,88,89,88,87,90,88,91,89,89,91,92,89,92,87,90,93,88,94,76,74,76,73,74,76,94,95,74,96,94,74,72,78,95,94,97,95,98,76,99,100,101,99,102,103,99,98,104,102,99,104,102,105,103,102,106,107,104,108,102,70,98,109,70,69,73,71,109,110,71,111,112,106,102,108,108,104,95,108,81,106,82,79,81,81,113,106,81,108,82,97,96,114,97,108,95,96,74,78,96,78,114,96,97,94,113,111,115,113,81,80,111,113,80,111,71,115,115,110,116,115,117,113,80,79,85,80,86,111,93,118,119,93,90,120,93,121,122,93,122,123,112,86,124,105,102,107,105,117,125,105,100,103,98,99,101,98,126,109,98,70,76,98,95,104,91,88,119,119,88,93,100,105,125,100,126,101,100,127,128,100,99,103,78,72,75,122,129,130,122,121,129,122,131,123,131,122,130,131,130,132,127,100,125,127,110,128,127,117,116,121,93,120,117,106,113,117,105,107,117,107,106,117,127,125,117,115,116,126,100,128,126,110,109,126,98,101,109,71,70,86,80,85,86,112,111,86,84,124,118,93,123,77,114,78,110,127,116,110,115,71,110,126,128,133,134,135,134,136,137,134,138,139,134,140,141,135,142,143,135,139,142,135,144,133,139,145,142,139,135,134,146,147,148,146,148,149,147,150,151,148,152,149,153,154,155,153,156,157,156,153,158,157,154,153,158,159,160,158,161,156,162,136,163,162,140,137,162,155,154,162,164,165,155,159,153,155,162,165,154,157,141,166,167,168,167,152,169,168,170,171,168,172,173,170,168,167,136,174,163,136,162,137,136,134,133,159,155,165,159,175,160,159,164,176,159,158,153,164,159,165,164,162,163,164,174,176,152,148,169,152,167,166,173,166,168,173,144,143,173,177,166,177,178,152,177,152,166,141,140,154,141,156,138,141,157,156,138,134,141,138,161,139,174,164,163,174,144,179,174,136,133,150,147,146,150,180,151,181,172,171,181,182,183,172,181,183,172,168,171,171,180,181,183,144,172,183,184,179,161,138,156,161,158,160,145,139,161,145,160,185,142,178,177,160,145,161,140,162,154,140,134,137,179,184,174,184,183,182,184,186,187,184,175,176,184,176,174,185,178,145,182,146,186,182,150,146,182,181,150,144,135,143,144,183,179,144,173,172,144,174,133,188,171,170,175,159,176,175,187,185,175,184,187,175,185,160,187,189,185,187,186,189,143,142,177,143,177,173,189,152,178,189,149,152,186,146,149,186,184,182,186,149,189,180,171,188,180,150,181,178,142,145,178,185,189,190,191,192,191,190,193,192,194,190,195,191,193,196,197,198,196,199,197,199,200,197,200,199,201,201,202,200,202,203,204,203,202,201,205,204,206,206,204,203,206,207,205,207,206,208,208,209,207,209,208,194,194,192,209,210,211,212,213,214,211,215,216,214,217,218,216,219,220,218,221,222,220,223,224,222,225,226,224,227,228,226,229,230,228,231,232,230,233,212,232,234,235,236,237,238,239,240,241,242,243,242,238,244,245,241,246,247,245,248,249,247,250,251,249,252,253,251,254,239,235,255,236,256,257,256,253,258,259,260,259,258,261,260,262,263,261,264,265,264,266,267,264,261,258,265,264,267,268,266,269,268,267,266,270,268,269,270,269,271,271,272,270,273,272,271,273,274,272,275,276,277,277,263,262,263,277,276,262,260,259,278,279,280,279,278,281,279,282,280,281,283,284,281,285,279,286,287,288,286,289,285,286,290,291,289,288,292,289,292,293,289,294,295,289,286,288,285,281,296,285,297,286,285,295,279,288,298,292,299,300,301,299,291,302,299,301,303,299,304,300,304,305,300,306,294,307,306,284,283,284,296,281,284,306,307,283,281,278,307,293,308,307,309,284,282,279,295,295,285,289,295,310,282,305,301,300,305,311,312,305,304,313,305,313,311,313,302,314,311,315,312,311,290,316,311,313,314,315,316,317,315,298,303,315,317,298,312,315,303,312,303,301,317,292,298,317,318,319,292,317,319,298,288,287,319,293,292,287,286,291,287,303,298,297,285,296,297,316,290,296,309,297,296,284,309,301,305,312,303,287,299,290,302,291,290,286,297,290,311,314,291,299,287,302,304,299,302,313,304,302,290,314,310,295,294,294,289,293,294,306,310,293,319,308,293,307,294,308,319,318,316,315,311,316,297,318,318,317,316,309,308,318,309,318,297,309,307,308,320,321,322,321,323,322,324,320,322,323,324,322,325,326,327,326,328,327,329,325,327,328,329,327,330,331,332,331,333,332,334,330,332,333,334,332,335,336,337,337,336,338,339,336,335,338,336,339,340,341,342,342,341,343,344,341,340,343,341,344,345,346,347,347,346,348,349,346,345,348,346,349,350,351,352,351,350,353,354,355,356,355,354,357,129,132,130,358,359,360,359,361,360,359,362,361,359,363,364,365,366,362,365,367,368,366,369,362,366,365,370,362,364,365,362,369,361,370,371,366,370,368,372,373,374,375,373,375,376,373,376,377,373,378,379,378,373,380,379,374,373,380,373,377,380,381,382,383,367,384,383,385,386,383,386,387,385,361,386,385,360,361,386,361,369,387,368,367,387,386,388,363,359,358,364,362,359,364,384,367,382,381,389,382,378,380,382,390,378,390,382,389,390,391,378,389,392,391,389,393,394,389,391,390,393,389,381,394,376,375,394,392,389,381,376,393,381,380,377,395,396,397,395,372,396,396,398,392,397,396,392,397,375,395,372,399,396,372,374,370,374,379,371,374,395,375,374,372,395,369,400,388,369,388,386,369,366,400,400,371,401,375,397,394,376,381,377,376,394,393,371,400,366,371,370,374,401,371,379,391,401,379,391,379,378,384,364,363,367,365,364,367,383,387,368,387,399,368,370,365,399,372,368,399,398,396,392,401,391,392,398,401,392,394,397,398,400,401,388,399,387,388,398,399,388,400,398,402,403,404,403,405,406,403,406,404,403,407,408,409,410,405,409,411,412,409,413,414,410,409,414,410,415,416,410,414,417,405,416,418,405,408,409,414,413,419,420,421,422,420,423,424,420,425,426,423,420,426,427,428,429,427,430,428,427,411,431,430,404,406,430,406,428,428,406,418,429,428,432,429,432,433,429,412,411,407,403,402,408,431,411,408,405,403,434,435,436,434,426,437,434,436,424,434,424,423,436,421,424,435,438,436,435,434,437,435,415,438,437,425,439,439,440,435,439,419,441,439,435,437,441,413,442,441,443,440,413,412,442,413,441,419,419,439,425,417,414,419,417,419,425,416,405,410,416,440,443,416,432,418,418,406,405,418,432,428,426,434,423,425,420,417,425,437,426,415,435,440,415,410,422,422,417,420,422,410,417,422,421,415,438,415,421,421,420,424,421,436,438,431,408,407,411,427,429,411,409,408,412,413,409,412,429,433,433,442,412,433,443,442,440,416,415,440,439,441,443,441,442,443,433,432,432,416,443];
  m.aux = new Array(444).fill(0);
  return m;
}
