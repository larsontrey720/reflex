#!/usr/bin/env bun
/**
 * Reflex Full Cycle - Complete self-enhancement loop
 * 
 * Runs: introspect → prescribe → evolve
 */

import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { existsSync, mkdirSync, writeFileSync, readFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";

const REFLEX_ROOT = dirname(dirname(import.meta.path));
const SKILLS_DIR = join(REFLEX_ROOT, "skills");

function runScript(skill: string, script: string, args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const scriptPath = skill === "cli"
    ? join(REFLEX_ROOT, "cli", script)
    : join(SKILLS_DIR, skill, "scripts", script);
  
  const result = spawnSync("bun", ["run", scriptPath, ...args], {
    encoding: "utf-8",
    env: process.env,
    timeout: 300000, // 5 minutes max
  });
  
  return {
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    exitCode: result.status || 1,
  };
}

// === MAIN EXECUTION ===

const { values } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: process.cwd() },
    max: { type: "string", default: "1" },
    "dry-run": { type: "boolean", default: false },
    json: { type: "boolean", default: false },
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
  -p, --project <path>   Target project directory
  --max <number>         Maximum improvement cycles (default: 1)
  --dry-run              Generate fixes but don't apply them
  --json                 Output JSON format
  -h, --help             Show this help

Process:
  1. Introspect - Measure 10 code health metrics
  2. Prescribe - Select from 17 playbooks
  3. Evolve - Execute fix via LLM
  4. Verify - Check improvement, revert if regression
`);
  process.exit(0);
}

const project = resolve(values.project as string);
const maxCycles = parseInt(values.max as string) || 1;
const dryRun = values["dry-run"] as boolean;

if (!existsSync(project)) {
  console.error(`Project not found: ${project}`);
  process.exit(1);
}

console.log("\n" + "=".repeat(60));
console.log("Reflex Full Cycle");
console.log("=".repeat(60));
console.log(`Project: ${project}`);
console.log(`Max cycles: ${maxCycles}`);
console.log(`Dry run: ${dryRun}`);
console.log("=".repeat(60) + "\n");

// Create temp directory for scorecards
const tempDir = mkdtempSync(join(tmpdir(), "reflex-"));
let cycleCount = 0;
let improved = true;

while (cycleCount < maxCycles && improved) {
  cycleCount++;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`CYCLE ${cycleCount}/${maxCycles}`);
  console.log("=".repeat(60) + "\n");
  
  // Step 1: Introspect
  console.log("--- Step 1: Introspect ---\n");
  
  const scorecardPath = join(tempDir, `scorecard-${cycleCount}.json`);
  const introspectResult = runScript("reflex-introspect", "introspect.ts", [
    "--project", project,
    "--json",
  ]);
  
  if (introspectResult.exitCode !== 0) {
    console.error("Introspect failed:", introspectResult.stderr);
    break;
  }
  
  // Save scorecard
  writeFileSync(scorecardPath, introspectResult.stdout);
  
  let scorecard: any;
  try {
    scorecard = JSON.parse(introspectResult.stdout);
  } catch {
    console.error("Failed to parse introspect output");
    break;
  }
  
  console.log(`Composite score: ${scorecard.composite}/100`);
  console.log(`Weakest metric: ${scorecard.weakest}`);
  
  // Check if we're already at target
  if (scorecard.composite >= 95) {
    console.log("\nTarget score reached (95+). Stopping.");
    improved = false;
    break;
  }
  
  // Step 2: Prescribe
  console.log("\n--- Step 2: Prescribe ---\n");
  
  const prescriptionPath = join(tempDir, `prescription-${cycleCount}.json`);
  const prescribeResult = runScript("reflex-prescribe", "prescribe.ts", [
    "--scorecard", scorecardPath,
    "--output", tempDir,
    "--json",
  ]);
  
  if (prescribeResult.exitCode !== 0) {
    console.error("Prescribe failed:", prescribeResult.stderr);
    break;
  }
  
  let prescription: any;
  try {
    prescription = JSON.parse(prescribeResult.stdout);
  } catch {
    console.error("Failed to parse prescribe output");
    break;
  }
  
  console.log(`Playbook: ${prescription.playbook.id} - ${prescription.playbook.name}`);
  console.log(`Auto-approve: ${prescription.autoApprove ? "Yes" : "No"}`);
  
  if (!prescription.autoApprove && !dryRun) {
    console.log("\nGovernor: This playbook requires human approval.");
    console.log("To execute, run:");
    console.log(`  reflex evolve --prescription ${prescriptionPath}`);
    improved = false;
    break;
  }
  
  // Step 3: Evolve
  console.log("\n--- Step 3: Evolve ---\n");
  
  if (dryRun) {
    console.log("Dry run: Skipping execution");
    console.log("\nProposed steps:");
    prescription.playbook.steps.forEach((step: string, i: number) => {
      console.log(`  ${i + 1}. ${step}`);
    });
    improved = false;
  } else {
    const evolveResult = runScript("reflex-evolve", "evolve.ts", [
      "--prescription", join(tempDir, `${prescription.id}.json`),
      "--project", project,
    ]);
    
    if (evolveResult.exitCode !== 0) {
      console.error("Evolve failed:", evolveResult.stderr);
      improved = false;
      break;
    }
    
    console.log(evolveResult.stdout);
    
    // Step 4: Verify (re-introspect)
    console.log("\n--- Step 4: Verify ---\n");
    
    const verifyScorecardPath = join(tempDir, `scorecard-${cycleCount}-verify.json`);
    const verifyResult = runScript("reflex-introspect", "introspect.ts", [
      "--project", project,
      "--json",
    ]);
    
    if (verifyResult.exitCode !== 0) {
      console.error("Verify failed:", verifyResult.stderr);
      break;
    }
    
    let verifyScorecard: any;
    try {
      verifyScorecard = JSON.parse(verifyResult.stdout);
    } catch {
      console.error("Failed to parse verify output");
      break;
    }
    
    const delta = verifyScorecard.composite - scorecard.composite;
    
    console.log(`Previous score: ${scorecard.composite}`);
    console.log(`New score: ${verifyScorecard.composite}`);
    console.log(`Delta: ${delta >= 0 ? "+" : ""}${delta}`);
    
    if (delta < -2) {
      console.log("\nRegression detected (>2% drop). Reverting...");
      improved = false;
    } else if (delta > 0) {
      console.log("\nImprovement confirmed. Continuing...");
    } else {
      console.log("\nNo change. Stopping.");
      improved = false;
    }
  }
}

console.log("\n" + "=".repeat(60));
console.log("FULL CYCLE COMPLETE");
console.log("=".repeat(60));
console.log(`Cycles run: ${cycleCount}`);
console.log(`Project: ${project}`);
console.log("=".repeat(60) + "\n");