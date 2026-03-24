#!/usr/bin/env bun
/**
 * Reflex Full Cycle - Complete self-enhancement loop
 * 
 * Runs: introspect → prescribe → evolve
 */

import { parseArgs } from "node:util";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";

// Resolve from cli/ directory to parent (where skills are)
const REFLEX_ROOT = dirname(dirname(import.meta.path));

const { values } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: process.cwd() },
    "max-cycles": { type: "string", default: "1" },
    "dry-run": { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Full Cycle - Complete self-enhancement loop

Usage:
  reflex full-cycle [options]

Options:
  -p, --project <dir>      Target project (default: current directory)
  --max-cycles <n>         Maximum improvement cycles (default: 1)
  --dry-run                Generate prescriptions but don't execute
  --verbose                Show detailed output
  -h, --help               Show this help

Example:
  reflex full-cycle --project ./my-app --max-cycles 3
`);
  process.exit(0);
}

const projectPath = resolve(values.project as string);
const maxCycles = parseInt(values["max-cycles"] as string, 10);
const dryRun = values["dry-run"] as boolean;
const verbose = values.verbose as boolean;

// Seeds directory
const seedsDir = process.env.REFLEX_SEEDS_DIR || resolve(process.env.HOME || "/root", "Seeds/reflex");
mkdirSync(seedsDir, { recursive: true });

console.log("\n╔════════════════════════════════════════════════════════╗");
console.log("║  REFLEX FULL CYCLE                                      ║");
console.log("╠════════════════════════════════════════════════════════╣");
console.log(`║  Project: ${projectPath.slice(-40).padStart(40)}  ║`);
console.log(`║  Max Cycles: ${String(maxCycles).padStart(36)}  ║`);
console.log(`║  Dry Run: ${String(dryRun).padStart(38)}  ║`);
console.log("╚════════════════════════════════════════════════════════╝\n");

async function runScript(scriptPath: string, args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const proc = spawn("bun", [scriptPath, ...args], {
      cwd: REFLEX_ROOT,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      if (verbose) process.stdout.write(data);
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      if (verbose) process.stderr.write(data);
    });

    proc.on("close", (code) => {
      resolve({ stdout, stderr, code: code || 0 });
    });
  });
}

async function main() {
  const introspectScript = `${REFLEX_ROOT}/reflex-introspect/scripts/introspect.ts`;
  const prescribeScript = `${REFLEX_ROOT}/reflex-prescribe/scripts/prescribe.ts`;
  const evolveScript = `${REFLEX_ROOT}/reflex-evolve/scripts/evolve.ts`;

  for (let cycle = 1; cycle <= maxCycles; cycle++) {
    console.log("\n============================================================");
    console.log(`⚡ CYCLE ${cycle}/${maxCycles}`);
    console.log("============================================================\n");

    // Step 1: Introspect
    console.log("📊 Step 1: Introspecting...");
    const scorecardPath = resolve(seedsDir, `scorecard-${Date.now()}.json`);
    const introspectResult = await runScript(introspectScript, [
      "--project", projectPath,
      "--json",
      "--output", scorecardPath,
    ]);

    if (introspectResult.code !== 0) {
      console.error("❌ Introspection failed");
      console.error(introspectResult.stderr);
      process.exit(1);
    }

    // Parse scorecard to get composite score
    let compositeScore = 0;
    let weakestMetric = "";
    try {
      const scorecard = JSON.parse(introspectResult.stdout);
      compositeScore = scorecard.compositeScore;
      weakestMetric = scorecard.weakestMetric;
      console.log(`   Composite: ${compositeScore}/100 | Weakest: ${weakestMetric}`);
    } catch {
      console.log("   Scorecard generated");
    }

    // Check if we're already healthy
    if (compositeScore >= 90) {
      console.log("\n✅ Code health is excellent (≥90). No changes needed.");
      break;
    }

    // Step 2: Prescribe
    console.log("\n💊 Step 2: Prescribing...");
    const prescribeResult = await runScript(prescribeScript, [
      "--scorecard", scorecardPath,
      "--seeds-dir", seedsDir,
    ]);

    if (prescribeResult.code !== 0) {
      console.error("❌ Prescription failed");
      console.error(prescribeResult.stderr);
      process.exit(1);
    }

    // Extract prescription path from output
    const prescriptionMatch = prescribeResult.stdout.match(/Prescription saved to: (.+)/);
    const prescriptionPath = prescriptionMatch ? prescriptionMatch[1].trim() : null;

    if (!prescriptionPath) {
      console.log("   No prescription generated (all metrics healthy or blocked by governor)");
      break;
    }

    if (dryRun) {
      console.log("\n🏃 DRY RUN: Would execute prescription:");
      console.log(`   ${prescriptionPath}`);
      continue;
    }

    // Step 3: Evolve
    console.log("\n🔧 Step 3: Evolving...");
    const evolveResult = await runScript(evolveScript, [
      "--prescription", prescriptionPath,
      "--project", projectPath,
    ]);

    if (evolveResult.code !== 0) {
      console.error("❌ Evolution failed");
      console.error(evolveResult.stderr);
      // Continue to next cycle anyway - might be a partial fix
    }

    // Clean up scorecard
    rmSync(scorecardPath, { force: true });

    console.log("\n------------------------------------------------------------");
    console.log(`✅ Cycle ${cycle} complete`);
    console.log("------------------------------------------------------------");
  }

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  REFLEX FULL CYCLE COMPLETE                             ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");
}

main().catch(console.error);
