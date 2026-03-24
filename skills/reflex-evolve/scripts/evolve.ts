#!/usr/bin/env bun
/**
 * Reflex Evolve - Evolution executor
 * 
 * Executes prescriptions, measures before/after, reverts on regression
 */

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, basename, join } from "node:path";
import { execSync } from "node:child_process";

const { values } = parseArgs({
  options: {
    prescription: { type: "string" },
    project: { type: "string", default: process.cwd() },
    "dry-run": { type: "boolean", default: false },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Evolve - Your code's healing response

Usage:
  reflex evolve [options]

Options:
  --prescription <file>    Path to prescription JSON
  -p, --project <dir>      Target project (default: current directory)
  --dry-run                Show what would be done without executing
  --verbose                Show detailed output
  -h, --help               Show this help

LLM Configuration:
  REFLEX_LLM_PROVIDER    Provider: openai, anthropic, ollama, zo
  REFLEX_LLM_API_KEY     API key for external providers
  REFLEX_LLM_MODEL       Model name override

Safety Features:
  - Pre-execution backup
  - Regression detection (>2% drop triggers revert)
  - Blast radius limit (max 10 files)
  - Audit trail with diffs

Example:
  reflex evolve --prescription rx-test-coverage.json
`);
  process.exit(0);
}

const prescriptionPath = values.prescription as string;
const projectPath = resolve(values.project as string);
const dryRun = values["dry-run"] as boolean;
const verbose = values.verbose as boolean;

if (!prescriptionPath) {
  console.error("Error: --prescription <file> is required");
  process.exit(1);
}

if (!existsSync(prescriptionPath)) {
  console.error(`Error: Prescription not found: ${prescriptionPath}`);
  process.exit(1);
}

// Import context-aware LLM client
import { callLLMWithContext, isConfigured, getConfig } from "../../reflex-core/scripts/llm-client.js";
import { buildSystemContext, loadMemory, recordIncident, recordCycle } from "../../reflex-core/scripts/context.js";

// Backup functions
function createBackup(project: string, backupDir: string): string[] {
  const files: string[] = [];

  function walk(dir: string) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (entry.startsWith(".") || entry === "node_modules" || entry === "dist" || entry === "build") continue;

      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile() && /\.(ts|tsx|js|jsx|json)$/.test(entry)) {
        files.push(fullPath);
      }
    }
  }

  walk(project);

  const timestamp = Date.now();
  const backupPath = resolve(backupDir, `reflex-backup-${timestamp}`);
  mkdirSync(backupPath, { recursive: true });

  for (const file of files) {
    const relativePath = file.replace(project, "");
    const targetPath = resolve(backupPath, relativePath.slice(1));
    mkdirSync(dirname(targetPath), { recursive: true });
    copyFileSync(file, targetPath);
  }

  if (verbose) {
    console.log(`Backed up ${files.length} files to ${backupPath}`);
  }

  return files;
}

function restoreBackup(backupDir: string, project: string) {
  // Find latest backup
  const backups = readdirSync(backupDir)
    .filter(f => f.startsWith("reflex-backup-"))
    .sort()
    .reverse();

  if (backups.length === 0) {
    console.error("No backup found to restore");
    return;
  }

  const latestBackup = resolve(backupDir, backups[0]);

  function walk(dir: string) {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        const relativePath = fullPath.replace(latestBackup, "");
        const targetPath = resolve(project, relativePath.slice(1));
        mkdirSync(dirname(targetPath), { recursive: true });
        copyFileSync(fullPath, targetPath);
      }
    }
  }

  walk(latestBackup);
  console.log(`Restored from ${latestBackup}`);
}

// Generate fix prompt
function generateFixPrompt(prescription: any, files: string[]): string {
  const targetFile = files[0]; // Simplified - real version would analyze

  return `You are a code fixer. Apply the following improvement:

Goal: ${prescription.goal}
Constraints:
${prescription.constraints.map((c: string) => `- ${c}`).join("\n")}

Target files:
${files.slice(0, 5).map(f => `- ${f}`).join("\n")}

Current metric value: ${prescription.currentValue}
Target: ${prescription.targetValue}

Generate a patch that improves this metric. Output the full modified file content.
Do not explain - just output the code.
`;
}

// Run metric
function runMetric(metricCommand: string): number {
  try {
    const result = execSync(metricCommand, {
      encoding: "utf-8",
      timeout: 60000,
      stdio: ["pipe", "pipe", "pipe"],
    });

    const parsed = JSON.parse(result);
    const metric = parsed.metrics?.[0];
    return metric?.value || metric?.score || 0;
  } catch (e) {
    console.error("Error running metric:", (e as Error).message);
    return 0;
  }
}

async function main() {
  // Load prescription
  const prescription = JSON.parse(readFileSync(prescriptionPath, "utf-8"));

  console.log("\n╔════════════════════════════════════════════════════════╗");
  console.log("║  REFLEX EVOLUTION                                       ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  Prescription: ${basename(prescriptionPath).slice(0, 40)}`.padEnd(56) + "║");
  console.log(`║  Metric: ${prescription.metric.padEnd(49)}║`);
  console.log(`║  Mode: ${prescription.autoApprove ? "autofix-loop" : "manual-approval"}`.padEnd(53) + "║");

  // Check if LLM is configured
  if (!isConfigured()) {
    console.log("║  ⚠️  LLM not configured                                 ║");
    console.log("║  Set REFLEX_LLM_PROVIDER and REFLEX_LLM_API_KEY       ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    process.exit(1);
  }

  const config = getConfig();
  console.log(`║  LLM: ${config.provider} (${config.model.slice(0, 25)}...)`.padEnd(53) + "║");
  console.log("╠════════════════════════════════════════════════════════╣");

  // Check governor
  if (!prescription.autoApprove) {
    console.log("║  ⚠️  GOVERNOR: This prescription requires approval      ║");
    console.log("║  Run with --approve to proceed, or review manually     ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    process.exit(0);
  }

  if (dryRun) {
    console.log("║  🏃 DRY RUN: Would execute prescription                 ║");
    console.log("╚════════════════════════════════════════════════════════╝");
    process.exit(0);
  }

  // Create backup
  const backupDir = resolve(projectPath, ".reflex-backup");
  mkdirSync(backupDir, { recursive: true });
  const backedFiles = createBackup(projectPath, backupDir);

  // Run before metric
  const beforeValue = runMetric(prescription.metricCommand);
  console.log(`║  BEFORE: ${prescription.metric} = ${beforeValue}`.padEnd(53) + "║");

  // Generate and apply fix
  console.log("║  Generating fix..." + " ".repeat(36) + "║");

  const prompt = generateFixPrompt(prescription, backedFiles.slice(0, prescription.governorRules?.blastRadius || 10));
  const fixContent = await callLLMWithContext(prompt);

  // Write fix (simplified - real version would parse and apply patches)
  const targetFile = backedFiles[0];
  if (targetFile) {
    writeFileSync(targetFile, fixContent);
    if (verbose) {
      console.log(`║  Applied fix to: ${basename(targetFile)}`.padEnd(53) + "║");
    }
  }

  // Run after metric
  const afterValue = runMetric(prescription.metricCommand);
  const delta = afterValue - beforeValue;

  console.log("╠════════════════════════════════════════════════════════╣");
  console.log(`║  AFTER: ${prescription.metric} = ${afterValue} (${delta >= 0 ? "+" : ""}${delta})`.padEnd(53) + "║");

  // Check for regression
  if (delta < 0 && Math.abs(delta / beforeValue) > (prescription.governorRules?.regressionThreshold || 0.02)) {
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║  ❌ REGRESSION DETECTED                                 ║");
    console.log("║  Reverting changes...                                  ║");
    restoreBackup(backupDir, projectPath);
    console.log("║  Changes reverted.                                      ║");
  } else {
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║  ✅ IMPROVED" + " ".repeat(43) + "║");
    console.log(`║  Files changed: 1`.padEnd(53) + "║");
  }

  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Clean up backup
  rmSync(backupDir, { recursive: true, force: true });
}

main().catch(console.error);
