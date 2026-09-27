import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";

// Copies Cesium static assets (workers, widgets, textures) into /public so
// they are served from CESIUM_BASE_URL = "/cesium/" in web and Tauri builds.
const src = join(process.cwd(), "node_modules", "cesium", "Build", "Cesium");
const dest = join(process.cwd(), "public", "cesium");

if (!existsSync(src)) {
  console.error(`[copy-cesium] not found: ${src} (is cesium installed?)`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });

for (const dir of ["Assets", "Workers", "ThirdParty", "Widgets"]) {
  cpSync(join(src, dir), join(dest, dir), { recursive: true });
}
cpSync(join(src, "Cesium.js"), join(dest, "Cesium.js"));

console.log(`[copy-cesium] done -> ${dest}`);
