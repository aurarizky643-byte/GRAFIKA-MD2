/* Lab 2 -- DDA vs Bresenham: how often do they pick different pixels?
 *   node lab2_lines.mjs */
import { lineDDA, lineBresenham } from "./raster.mjs";
let seed = 12345;
const rnd = (n) => ((seed = (seed * 1664525 + 1013904223) >>> 0) % n);
const N = 20000;
let same = 0, lenDiff = 0, pxDiff = 0;
for (let i = 0; i < N; i++) {
  const a = [rnd(200), rnd(200), rnd(200), rnd(200)];
  const d = lineDDA(...a), b = lineBresenham(...a);
  if (d.length !== b.length) lenDiff++;
  else if (JSON.stringify(d) === JSON.stringify(b)) same++;
  else pxDiff += d.filter((p, k) => p[0] !== b[k][0] || p[1] !== b[k][1]).length ? 1 : 0;
}
console.log(`random lines: ${N} (coords 0..199, seed 12345)`);
console.log(`identical pixel lists : ${same} (${(100 * same / N).toFixed(2)} %)`);
console.log(`same length, some different pixels: ${pxDiff} (${(100 * pxDiff / N).toFixed(2)} %)`);
console.log(`different length      : ${lenDiff}`);
const t = (f) => { const t0 = performance.now(); for (let i = 0; i < 20000; i++) f(0, 0, 399, 123); return performance.now() - t0; };
t(lineDDA); t(lineBresenham);
console.log(`timing 20000 x line (0,0)->(399,123): DDA ${t(lineDDA).toFixed(1)} ms, Bresenham ${t(lineBresenham).toFixed(1)} ms`);
