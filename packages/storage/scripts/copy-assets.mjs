import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function copyModel() {
  const projectRoot = path.resolve(__dirname, "..");
  const source = path.join(projectRoot, "src", "Auth", "model.conf");
  const targetDir = path.join(projectRoot, "dist");
  const target = path.join(targetDir, "model.conf");

  await mkdir(targetDir, { recursive: true });
  await copyFile(source, target);
  console.log(`[copy-assets] Copied model.conf → ${path.relative(projectRoot, target)}`);
}

copyModel().catch((error) => {
  console.error("[copy-assets] Failed to copy model.conf", error);
  process.exitCode = 1;
});
