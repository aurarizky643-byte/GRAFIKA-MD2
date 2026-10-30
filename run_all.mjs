/* One command that reproduces every deliverable:   node run_all.mjs
 * (step 4 needs Playwright; it is skipped with a note if it is not installed) */
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync("out", { recursive: true });
let log = "";
const run = (title, args, { optional = false } = {}) => {
  const r = spawnSync("node", args, { encoding: "utf8" });
  const txt = `$ node ${args.join(" ")}\n${r.stdout}${r.stderr}`;
  console.log(`\n=== ${title} ===\n${txt}`); log += `\n=== ${title} ===\n${txt}`;
  if (r.status !== 0 && !optional) { console.log("STOP: step failed"); process.exit(1); }
  return r.status === 0;
};
run("Tests", ["tests.mjs"]);
run("Lab 1: generate myplan.json", ["gen_myplan.mjs"]);
run("Lab 2: DDA vs Bresenham", ["lab2_lines.mjs"]);
run("Lab 2: triangle gap bug", ["triangle_gap_bug.mjs"]);
run("Lab 2: square (fill)", ["draw_square.mjs", "--mode", "fill"]);
run("Lab 2: raster my plan", ["draw_plan.mjs", "--plan", "myplan.json", "--fill"]);
run("Lab 3: benchmark", ["bench.mjs"]);
const ok = run("Lab 3: Three.js capture", ["capture_three.mjs"], { optional: true });
if (!ok) console.log("(!) capture skipped -- open web/ in a browser and press Export PPM instead");
run("Lab 3: compare raster vs Three.js", ["compare.mjs", "out/plan_scratch.ppm", "plan_three.ppm", "--diff", "out/plan_diff.ppm", "--scale", "6"], { optional: true });
run("Lab 3: compare raster vs plan_three.png (module form)", ["compare.mjs", "out/plan_scratch.ppm", "plan_three.png"], { optional: true });
run("PNG previews", ["ppm2png.mjs", "out/plan_scratch.ppm", "out/plan_scratch.png"]);
run("PNG previews", ["ppm2png.mjs", "out/plan_diff.ppm", "out/plan_diff.png"], { optional: true });
writeFileSync("out/run_all_log.txt", log);
