// QR code maker for "Show my picks as a QR code" (Oct 28). Byte mode, versions 1 to 40, error correction M (or L
// when M would need a much denser code). Works offline, no library. Follows the QR spec (ISO 18004) the same way
// Project Nayuki's reference generator does. qrSvg(text) returns an SVG string, or null when the text is too long.

const ECC = { // codewords per block, then blocks, for versions 1 to 40 (index 0 unused)
  L: [[-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
      [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25], 1],
  M: [[-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
      [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49], 0]
};
const rawModules = v => { let r = (16 * v + 128) * v + 64; if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; } return r; };
const dataCodewords = (v, e) => Math.floor(rawModules(v) / 8) - ECC[e][0][v] * ECC[e][1][v];
const bit = (x, i) => ((x >>> i) & 1) !== 0;

function gfMul(x, y) { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11d); z ^= ((y >>> i) & 1) * x; } return z; }
function rsDivisor(deg) {
  const r = new Array(deg).fill(0); r[deg - 1] = 1; let root = 1;
  for (let i = 0; i < deg; i++) { for (let j = 0; j < deg; j++) { r[j] = gfMul(r[j], root); if (j + 1 < deg) r[j] ^= r[j + 1]; } root = gfMul(root, 2); }
  return r;
}
function rsRemainder(data, div) {
  const r = div.map(() => 0);
  for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => { r[i] ^= gfMul(c, f); }); }
  return r;
}

// smallest version that holds n bytes at level e (byte mode header: 4 bits + 8 or 16 bits of length)
function fitVersion(n, e) {
  for (let v = 1; v <= 40; v++) if (4 + (v <= 9 ? 8 : 16) + 8 * n <= dataCodewords(v, e) * 8) return v;
  return 0;
}

function encode(bytes, v, e) {
  const cap = dataCodewords(v, e) * 8, bits = [];
  const put = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1); };
  put(4, 4); put(bytes.length, v <= 9 ? 8 : 16); bytes.forEach(b => put(b, 8));
  put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
  for (let pad = 0xec; bits.length < cap; pad ^= 0xec ^ 0x11) put(pad, 8);
  const data = []; for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0));
  // split into blocks, add error correction, interleave
  const nb = ECC[e][1][v], el = ECC[e][0][v], raw = Math.floor(rawModules(v) / 8);
  const nShort = nb - raw % nb, shortLen = Math.floor(raw / nb), div = rsDivisor(el), blocks = [];
  for (let i = 0, k = 0; i < nb; i++) {
    const d = data.slice(k, k + shortLen - el + (i < nShort ? 0 : 1)); k += d.length;
    const ecc = rsRemainder(d, div); if (i < nShort) d.push(0); blocks.push(d.concat(ecc));
  }
  const out = [];
  for (let i = 0; i < blocks[0].length; i++) blocks.forEach((b, j) => { if (i !== shortLen - el || j >= nShort) out.push(b[i]); });
  return out;
}

function matrix(codewords, v, e) {
  const n = v * 4 + 17, m = [], fn = [];
  for (let y = 0; y < n; y++) { m.push(new Array(n).fill(false)); fn.push(new Array(n).fill(false)); }
  const set = (x, y, d) => { m[y][x] = d; fn[y][x] = true; };
  for (let i = 0; i < n; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  [[3, 3], [n - 4, 3], [3, n - 4]].forEach(([cx, cy]) => {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy, d = Math.max(Math.abs(dx), Math.abs(dy));
      if (x >= 0 && x < n && y >= 0 && y < n) set(x, y, d !== 2 && d !== 4);
    }
  });
  if (v > 1) {
    const na = Math.floor(v / 7) + 2, step = Math.floor((v * 8 + na * 3 + 5) / (na * 4 - 4)) * 2, pos = [6];
    for (let p = n - 7; pos.length < na; p -= step) pos.splice(1, 0, p);
    pos.forEach((ax, i) => pos.forEach((ay, j) => {
      if ((i === 0 && j === 0) || (i === 0 && j === na - 1) || (i === na - 1 && j === 0)) return;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    }));
  }
  const format = mask => {
    const d = (ECC[e][2] << 3) | mask; let r = d;
    for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    const b = ((d << 10) | r) ^ 0x5412;
    for (let i = 0; i <= 5; i++) set(8, i, bit(b, i));
    set(8, 7, bit(b, 6)); set(8, 8, bit(b, 7)); set(7, 8, bit(b, 8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(b, i));
    for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(b, i));
    for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(b, i));
    set(8, n - 8, true);
  };
  format(0); // reserve the format areas before placing data
  if (v >= 7) {
    let r = v; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1f25);
    const b = (v << 12) | r;
    for (let i = 0; i < 18; i++) { const a = n - 11 + i % 3, c = Math.floor(i / 3); set(a, c, bit(b, i)); set(c, a, bit(b, i)); }
  }
  for (let right = n - 1, i = 0; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vert = 0; vert < n; vert++) for (let j = 0; j < 2; j++) {
      const x = right - j, y = ((right + 1) & 2) === 0 ? n - 1 - vert : vert;
      if (!fn[y][x] && i < codewords.length * 8) { m[y][x] = bit(codewords[i >>> 3], 7 - (i & 7)); i++; }
    }
  }
  const flip = mask => {
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (fn[y][x]) continue;
      const t = [(x + y) % 2, y % 2, x % 3, (x + y) % 3, (Math.floor(x / 3) + Math.floor(y / 2)) % 2,
        x * y % 2 + x * y % 3, (x * y % 2 + x * y % 3) % 2, ((x + y) % 2 + x * y % 3) % 2][mask];
      if (t === 0) m[y][x] = !m[y][x];
    }
  };
  // try all 8 masks, keep the one with the lowest penalty
  let best = 0, low = Infinity;
  for (let k = 0; k < 8; k++) { flip(k); format(k); const p = penalty(m, n); if (p < low) { low = p; best = k; } flip(k); }
  flip(best); format(best);
  return m;
}

const FINDER = [[1,0,1,1,1,0,1,0,0,0,0], [0,0,0,0,1,0,1,1,1,0,1]];
function penalty(m, n) {
  let p = 0, dark = 0;
  for (let pass = 0; pass < 2; pass++) for (let a = 0; a < n; a++) {
    const line = []; for (let b = 0; b < n; b++) line.push(pass ? m[b][a] : m[a][b]);
    for (let b = 0, run = 1; b < n; b++) {
      if (b > 0 && line[b] === line[b - 1]) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1;
    }
    for (let b = 0; b + 11 <= n; b++) FINDER.forEach(f => { if (f.every((c, k) => (c === 1) === line[b + k])) p += 40; });
  }
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (m[y][x]) dark++;
    if (x < n - 1 && y < n - 1 && m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
  }
  return p + (Math.ceil(Math.abs(dark * 20 - n * n * 10) / (n * n)) - 1) * 10;
}

export function qrMatrix(text) {
  const bytes = [...new TextEncoder().encode(text)];
  const vm = fitVersion(bytes.length, "M"), vl = fitVersion(bytes.length, "L");
  if (!vl) return null;
  const e = vm && vm <= vl + 1 ? "M" : "L", v = e === "M" ? vm : vl;
  return { version: v, level: e, size: v * 4 + 17, modules: matrix(encode(bytes, v, e), v, e) };
}

// dark modules as one path, with a 4-module quiet zone; the caller sets the size and the white backing
export function qrSvg(text, label) {
  const q = qrMatrix(text); if (!q) return null;
  const n = q.size, b = 4; let d = "";
  q.modules.forEach((row, y) => { for (let x = 0; x < n; x++) { if (!row[x]) continue; let r = 1; while (x + r < n && row[x + r]) r++; d += `M${x + b},${y + b}h${r}v1h-${r}z`; x += r - 1; } });
  const w = n + 2 * b;
  return { version: q.version, svg: `<svg viewBox="0 0 ${w} ${w}" shape-rendering="crispEdges" role="img" aria-label="${label || "QR code"}"><rect width="${w}" height="${w}" fill="#fff"/><path d="${d}" fill="#140a2e"/></svg>` };
}
