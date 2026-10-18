import { readFile } from "node:fs/promises";
import path from "node:path";
import type { CompanyManifest } from "../domain/types";
import { loadSelectableCompanies } from "../domain/company-data";

export async function loadCompanyRegistry() {
  const root = path.join(process.cwd(), "data", "companies");
  const manifest = JSON.parse(await readFile(path.join(root, "index.json"), "utf8")) as CompanyManifest;
  const datasets: Record<string, unknown> = {};
  for (const entry of manifest.companies ?? []) {
    if (entry.eligibility !== "verified") continue;
    const resolved = path.resolve(root, entry.datasetPath);
    if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
      datasets[entry.datasetPath] = undefined;
      continue;
    }
    try {
      datasets[entry.datasetPath] = JSON.parse(await readFile(resolved, "utf8"));
    } catch {
      datasets[entry.datasetPath] = undefined;
    }
  }
  return loadSelectableCompanies(manifest, datasets);
}
