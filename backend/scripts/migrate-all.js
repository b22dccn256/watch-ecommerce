/**
 * Run all data migrations and index sync in sequence.
 *
 * Usage: node backend/scripts/migrate-all.js
 */
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptsDir = __dirname;

const steps = [
  "migrate-products.js",
  "migrate-specs-brand.js",
  "migrate-currency.js",
  "migrate-orders.js",
  "ensure-indexes.js",
];

const runScript = (scriptName) =>
  new Promise((resolve, reject) => {
    const scriptPath = path.join(scriptsDir, scriptName);
    console.log(`\n[migrate-all] >>> ${scriptName}`);
    const child = spawn(process.execPath, [scriptPath], {
      stdio: "inherit",
      env: process.env,
    });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptName} exited with code ${code}`));
    });
  });

const main = async () => {
  for (const step of steps) {
    await runScript(step);
  }
  console.log("\n[migrate-all] All migrations completed successfully.");
};

main().catch((err) => {
  console.error("[migrate-all] Failed:", err.message);
  process.exit(1);
});
