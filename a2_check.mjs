/* A2 helper: hand-check ONE pixel against triangle().
 *   node a2_check.mjs 4 4        (pixel x y; the 6x6 square split on y = x)
 * Prints the three edge functions at the pixel CENTRE (x+0.5, y+0.5), the
 * top-left bias of each edge, the verdict, and whether triangle() really
 * lit the pixel -- so you can compare with your own pencil calculation. */
import { Framebuffer, edge, triangle } from "./raster.mjs";
const [px, py] = process.argv.slice(2, 4).map(Number);
const bias = (X, Y) => { const dx = Y[0] - X[0], dy = Y[1] - X[1];
  return (dy === 0 && dx < 0) || dy > 0 ? 0 : -1; };       // same rule as raster.mjs
const T = { T1: [[2, 2], [8, 2], [8, 8]], T2: [[2, 2], [8, 8], [2, 8]] };
const cx = px + 0.5, cy = py + 0.5;
console.log(`pixel (${px},${py}) -> sample centre (${cx},${cy})`);
for (const [name, [A, B, C]] of Object.entries(T)) {
  const total = edge(...A, ...B, ...C);
  const e = [["BC", B, C], ["CA", C, A], ["AB", A, B]].map(([n, X, Y]) => {
    const raw = edge(...X, ...Y, cx, cy), b = bias(X, Y);
    return { n, raw, b, w: raw + b };
  });
  const inside = e.every((v) => v.w >= 0);
  const fb = new Framebuffer(12, 12);
  triangle(fb, A, B, C, [255, 255, 255]);
  const lit = fb.get(px, py)[0] === 255;
  console.log(`\n${name}: A(${A}) B(${B}) C(${C})   total = ${total}`);
  for (const v of e) console.log(`  E_${v.n} = ${v.raw}   bias ${v.b}   -> ${v.w}`);
  console.log(`  by hand: ${inside ? "INSIDE (drawn)" : "not drawn"}   triangle(): ${lit ? "lit" : "not lit"}   ${inside === lit ? "MATCH" : "MISMATCH"}`);
}
