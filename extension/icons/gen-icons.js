// 零依赖 PNG 图标生成器：蓝色圆角方块 + 白色"图片"图形（太阳 + 山）。
// 用法：node extension/icons/gen-icons.js  -> 生成 icon16/32/48/128.png
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const BG = [0x4f, 0x7c, 0xff]; // #4F7CFF
const WHITE = [0xff, 0xff, 0xff];

function inTriangle(px, py, a, b, c) {
  const s = (p1, p2, p3) =>
    (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
  const d1 = s([px, py], a, b);
  const d2 = s([px, py], b, c);
  const d3 = s([px, py], c, a);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

function makeIcon(N) {
  const buf = Buffer.alloc(N * N * 4); // RGBA
  const r = N * 0.22; // 圆角半径
  const sun = { x: N * 0.68, y: N * 0.34, r: N * 0.11 };
  const t1 = [[N * 0.18, N * 0.78], [N * 0.42, N * 0.46], [N * 0.66, N * 0.78]];
  const t2 = [[N * 0.46, N * 0.78], [N * 0.66, N * 0.54], [N * 0.86, N * 0.78]];

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      // 圆角方块 alpha mask
      let inside = true;
      const cx = Math.min(x, N - 1 - x);
      const cy = Math.min(y, N - 1 - y);
      if (cx < r && cy < r) {
        const dx = r - cx, dy = r - cy;
        if (dx * dx + dy * dy > r * r) inside = false;
      }
      if (!inside) {
        buf[i + 3] = 0;
        continue;
      }
      let col = BG;
      const dsun = Math.hypot(x + 0.5 - sun.x, y + 0.5 - sun.y);
      if (
        dsun <= sun.r ||
        inTriangle(x + 0.5, y + 0.5, t1[0], t1[1], t1[2]) ||
        inTriangle(x + 0.5, y + 0.5, t2[0], t2[1], t2[2])
      ) {
        col = WHITE;
      }
      buf[i] = col[0];
      buf[i + 1] = col[1];
      buf[i + 2] = col[2];
      buf[i + 3] = 255;
    }
  }
  return encodePng(N, N, buf);
}

function encodePng(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // 10,11,12 = 0 (deflate/adaptive/no-interlace)
  const raw = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    raw[y * (1 + w * 4)] = 0; // filter: none
    rgba.copy(raw, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])) >>> 0, 0);
  return Buffer.concat([len, t, data, crc]);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

for (const N of [16, 32, 48, 128]) {
  fs.writeFileSync(path.join(__dirname, `icon${N}.png`), makeIcon(N));
  console.log(`icon${N}.png`);
}
