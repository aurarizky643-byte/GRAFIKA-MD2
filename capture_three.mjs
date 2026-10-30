/* Lab 3 (automated, optional): open web/ in headless Chromium, export the
 * Three.js render as plan_three.ppm + plan_three.png, and take the legend
 * screenshots (normal / deuteranopia / protanopia).
 *   npm i -D playwright    (once)   then:   node capture_three.mjs
 * Manual alternative: npx serve . -> http://localhost:3000/web/ -> "Export PPM". */
import http from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const MIME = { ".html": "text/html", ".mjs": "text/javascript", ".js": "text/javascript",
  ".css": "text/css", ".json": "application/json" };
const server = http.createServer((q, r) => {
  const p = normalize(decodeURIComponent(new URL(q.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
  const f = join(process.cwd(), p);
  if (!existsSync(f) || f.endsWith("/")) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { "content-type": MIME[extname(f)] || "application/octet-stream" });
  r.end(readFileSync(f));
}).listen(0);
const base = `http://localhost:${server.address().port}`;
mkdirSync("out", { recursive: true });

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const page = await browser.newPage({ viewport: { width: 1200, height: 720 } });
// use the local three.js if the CDN is unreachable from this machine
await page.route("**/cdn.jsdelivr.net/npm/three@0.160.0/**", (route) =>
  route.fulfill({ contentType: "text/javascript", body: readFileSync("node_modules/three/build/three.module.js") }));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
const ALIGN = process.env.ALIGN === "half";
await page.goto(`${base}/web/index.html${ALIGN ? "?align=half" : ""}`);
await page.waitForFunction("window.__ready === true", null, { timeout: 20000 });
console.log("browser:", browser.version());

const OUT = ALIGN ? "plan_three_aligned.ppm" : "plan_three.ppm";
writeFileSync(OUT, Buffer.from(await page.evaluate("window.__ppmBase64()"), "base64"));
if (ALIGN) { console.log("wrote", OUT); await browser.close(); server.close(); process.exit(0); }
const dataUrl = await page.evaluate('document.getElementById("c").toDataURL("image/png")');
writeFileSync("plan_three.png", Buffer.from(dataUrl.split(",")[1], "base64"));   // exact 800x600, as the module asks
await page.screenshot({ path: "out/legend_normal.png", fullPage: true });
await page.check("#cvd");  await page.screenshot({ path: "out/legend_deuteranopia.png", fullPage: true });
await page.uncheck("#cvd"); await page.check("#cvd2");
await page.screenshot({ path: "out/legend_protanopia.png", fullPage: true });
console.log("wrote plan_three.ppm, plan_three.png, out/legend_*.png");
await browser.close(); server.close();
