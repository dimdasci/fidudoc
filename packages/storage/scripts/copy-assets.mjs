import { mkdir, copyFile, rm, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..");

async function copyModel() {
  const source = path.join(projectRoot, "src", "Auth", "model.conf");
  const targetDir = path.join(projectRoot, "dist");
  const target = path.join(targetDir, "model.conf");

  await mkdir(targetDir, { recursive: true });
  await copyFile(source, target);
  console.log(`[copy-assets] Copied model.conf → ${path.relative(projectRoot, target)}`);
}

async function copyDirectory(sourceRelative, targetRelative) {
  const source = path.join(projectRoot, sourceRelative);
  const target = path.join(projectRoot, targetRelative);

  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });

  const entries = await readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const from = path.join(source, entry.name);
    const to = path.join(target, entry.name);
    if (entry.isDirectory()) {
      await copyDirectory(path.join(sourceRelative, entry.name), path.join(targetRelative, entry.name));
    } else if (entry.isFile()) {
      await copyFile(from, to);
    }
  }

  console.log(`[copy-assets] Copied ${sourceRelative} → ${targetRelative}`);
}

async function main() {
  await copyModel();
  await copyDirectory("src/migrations", "dist/migrations");
}

main().catch((error) => {
  console.error("[copy-assets] Failed to copy assets", error);
  process.exitCode = 1;
});
