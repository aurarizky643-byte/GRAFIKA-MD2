/* Convert PPM -> PNG (viewable anywhere).  node ppm2png.mjs in.ppm out.png [scale] */
import { PNG } from "pngjs";
import { writeFileSync } from "node:fs";
import { Framebuffer } from "./raster.mjs";
const [inp, out, sc = "1"] = process.argv.slice(2);
const fb = Framebuffer.readPPM(inp), k = +sc;
const png = new PNG({ width: fb.w * k, height: fb.h * k });
for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
  const [r, g, b] = fb.get((x / k) | 0, (y / k) | 0), i = (y * png.width + x) * 4;
  png.data[i] = r; png.data[i + 1] = g; png.data[i + 2] = b; png.data[i + 3] = 255;
}
writeFileSync(out, PNG.sync.write(png));
console.log(`wrote ${out}`);
