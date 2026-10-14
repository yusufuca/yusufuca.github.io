import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "dist");

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of ["index.html", "projects.html", "games.html", "about.html", "app.js", "styles.css", "assets", "data", "games", ".nojekyll"]) {
  try {
    await cp(path.join(root, entry), path.join(output, entry), { recursive: true });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

console.log(`Static site prepared in ${output}`);
