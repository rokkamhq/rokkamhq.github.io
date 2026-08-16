// Copies canonical seed files from the repo root into src/data/seeds so the web
// app never holds its own fork of catalog/pricing/zone data (CLAUDE.md §10:
// nothing price-affecting is hardcoded). Runs via predev/prebuild.
import { cpSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoSeeds = path.resolve(here, "..", "..", "..", "seeds");
const target = path.resolve(here, "..", "src", "data", "seeds");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
for (const dir of ["phones", "laptops", "pricing"]) {
  cpSync(path.join(repoSeeds, dir), path.join(target, dir), { recursive: true });
}
cpSync(path.join(repoSeeds, "zones.json"), path.join(target, "zones.json"));
console.log(`seeds synced -> ${target}`);
