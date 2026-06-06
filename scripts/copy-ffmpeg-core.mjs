import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(root, "public", "ffmpeg");
const coreDir = join(root, "node_modules", "@ffmpeg", "core", "dist", "umd");

mkdirSync(outputDir, { recursive: true });

for (const fileName of ["ffmpeg-core.js", "ffmpeg-core.wasm"]) {
  copyFileSync(join(coreDir, fileName), join(outputDir, fileName));
}
