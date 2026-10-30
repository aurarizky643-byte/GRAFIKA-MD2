/* Lab 1 -- generate myplan.json: schematic floor plan of Candi Borobudur
 * (5 square terraces + 3 circular terraces + central stupa, 4 stairways).
 * Units: metres, y-UP (survey convention). Dimensions are a simplified
 * schematic (~120 m square base), NOT a surveyed drawing -- see LAPORAN.md.
 *   node gen_myplan.mjs   ->  myplan.json */
import { writeFileSync } from "node:fs";

const C = 60;                                   // centre of the 120 x 120 m base
const polylines = [];
const add = (id, category, closed, points) => polylines.push({ id, category, closed, points });
const r2 = (v) => Math.round(v * 100) / 100;
const circle = (cx, cy, r, n) =>
  Array.from({ length: n }, (_, i) => [r2(cx + r * Math.cos((2 * Math.PI * i) / n)),
                                        r2(cy + r * Math.sin((2 * Math.PI * i) / n))]);
const square = (a, b) => [[a, a], [b, a], [b, b], [a, b]];
const rot = ([x, y], k) => { for (let i = 0; i < k; i++) [x, y] = [2 * C - y, x]; return [x, y]; };

// 1. five square terrace walls (outer -> inner)
["base_wall", "terrace1", "terrace2", "terrace3", "terrace4"].forEach((id, i) =>
  add(id, "wall", true, square(i * 8, 120 - i * 8)));

// 2. three circular terrace walls
[18, 13, 8].forEach((r, i) => add(`round_terrace${i + 1}`, "wall", true, circle(C, C, r, 48)));

// 3. central main stupa
add("main_stupa", "cella", true, circle(C, C, 5, 40));

// 4. four stairways (south stair rotated 0/90/180/270 deg), with treads
["south", "east", "north", "west"].forEach((name, k) => {
  add(`stair_${name}`, "stair", true,
    [[57, 0], [63, 0], [63, 42], [57, 42]].map((p) => rot(p, k)));
  for (let y = 4; y <= 40; y += 4)
    add(`tread_${name}_${y}`, "stair", false, [[57, y], [63, y]].map((p) => rot(p, k)));
});

// 5. perforated stupas on the round terraces (16 on the outer ring, 12 inner)
for (const [r, n, tag] of [[15.5, 16, "a"], [10.5, 12, "b"]])
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n, cx = C + r * Math.cos(a), cy = C + r * Math.sin(a);
    add(`stupa_${tag}${i}`, "shrine", true,
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([dx, dy]) => [r2(cx + dx), r2(cy + dy)]));
  }

// 6. symmetry axes
add("axis_ns", "axis", false, [[C, 0], [C, 120]]);
add("axis_ew", "axis", false, [[0, C], [120, C]]);

const plan = {
  name: "Candi Borobudur -- simplified schematic floor plan (approximate dimensions, not traced from a photo)",
  units: "metres",
  note: "y is UP in this file (survey convention). plan.mjs flips it to screen y-down. Simplified schematic (~120 m square base, 5 square + 3 round terraces); proportions approximate, not surveyed.",
  scale_px_per_m: 4.7,
  origin_m: [2, 2],
  polylines,
  silhouette: { id: "footprint", category: "wall", points: [[0, 0], [120, 0], [120, 120], [0, 120]] },
};
writeFileSync("myplan.json", JSON.stringify(plan, null, 1));
console.log(`myplan.json: ${polylines.length} polylines`);
