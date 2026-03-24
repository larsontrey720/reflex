#!/usr/bin/env bun
/**
 * Reflex Prescribe - Self-prescription engine
 */

import { parseArgs } from "node:util";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const { values } = parseArgs({
  options: {
    scorecard: { type: "string" },
    "seeds-dir": { type: "string" },
    output: { type: "string" },
    json: { type: "boolean", default: false },
    "list-playbooks": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Prescribe - Your code's immune response

Usage:
  reflex prescribe [options]

Options:
  --scorecard <file>       Path to introspection JSON output
  --seeds-dir <dir>        Directory for prescription output
  --output <file>          Output prescription JSON to file
  --json                   Output as JSON (to stdout)
  --list-playbooks         List all available playbooks
  -h, --help               Show this help
`);
  process.exit(0);
}

const PLAYBOOKS: Record<string, { name: string; metric: string; severity: string; autoApprove: boolean }> = {
  A: { name: "Type Coverage Expansion", metric: "typeSafety", severity: "WARNING", autoApprove: true },
  B: { name: "Strict Mode Migration", metric: "typeSafety", severity: "CRITICAL", autoApprove: false },
  C: { name: "Test Coverage Expansion", metric: "testCoverage", severity: "WARNING", autoApprove: true },
  D: { name: "Critical Path Testing", metric: "testCoverage", severity: "CRITICAL", autoApprove: false },
  E: { name: "Complexity Reduction", metric: "codeComplexity", severity: "WARNING", autoApprove: true },
  F: { name: "Architecture Refactor", metric: "codeComplexity", severity: "CRITICAL", autoApprove: false },
  G: { name: "Dependency Updates", metric: "dependencyHealth", severity: "WARNING", autoApprove: true },
  H: { name: "Major Version Migration", metric: "dependencyHealth", severity: "CRITICAL", autoApprove: false },
  I: { name: "Security Patch", metric: "securityVulns", severity: "WARNING", autoApprove: true },
  J: { name: "Security Overhaul", metric: "securityVulns", severity: "CRITICAL", autoApprove: false },
  K: { name: "Lint Rule Fixes", metric: "codeConsistency", severity: "WARNING", autoApprove: true },
  L: { name: "Formatter Migration", metric: "codeConsistency", severity: "CRITICAL", autoApprove: false },
  M: { name: "Build Optimization", metric: "buildPerformance", severity: "WARNING", autoApprove: true },
  N: { name: "Bundle Size Reduction", metric: "buildPerformance", severity: "CRITICAL", autoApprove: false },
};

function listPlaybooks() {
  console.log("\nAvailable Playbooks:\n");
  console.log("ID | Name                         | Metric            | Severity  | Approval");
  console.log("---|------------------------------|-------------------|-----------|---------");

  for (const [id, p] of Object.entries(PLAYBOOKS)) {
    const approval = p.autoApprove ? "No" : "Yes*";
    console.log(id.padEnd(3) + "| " + p.name.padEnd(29) + "| " + p.metric.padEnd(18) + "| " + p.severity.padEnd(10) + "| " + approval);
  }

  console.log("\n* = Requires human approval\n");
}

function getPlaybook(metric: string, status: string): string | null {
  const map: Record<string, Record<string, string>> = {
    typeSafety: { warning: "A", critical: "B" },
    testCoverage: { warning: "C", critical: "D" },
    codeComplexity: { warning: "E", critical: "F" },
    dependencyHealth: { warning: "G", critical: "H" },
    securityVulns: { warning: "I", critical: "J" },
    codeConsistency: { warning: "K", critical: "L" },
    buildPerformance: { warning: "M", critical: "N" },
  };

  const statusKey = status === "healthy" ? "warning" : status;
  return map[metric]?.[statusKey] || null;
}

function generateSeedSpec(metric: string, playbookId: string, scorecard: any): any {
  const playbook = PLAYBOOKS[playbookId];
  const metricData = scorecard.metrics.find((m: any) => m.name === metric);

  return {
    id: "rx-" + Date.now() + "-" + metric,
    generated: new Date().toISOString(),
    playbook: playbookId,
    playbookName: playbook.name,
    metric: metric,
    currentValue: metricData?.value || 0,
    targetValue: metricData?.target || 0,
    autoApprove: playbook.autoApprove,
    severity: playbook.severity,
    goal: "Improve " + metric + " from " + (metricData?.value || 0) + " to " + (metricData?.target || 0),
    constraints: [
      "No changes to production logic without tests",
      "Maintain existing functionality",
      "Use project's existing patterns and conventions",
    ],
    targetFiles: ["src/**/*.ts", "src/**/*.tsx"],
    metricCommand: "reflex introspect --metric " + metric + " --json",
    maxIterations: 10,
    governorRules: { blastRadius: 10, regressionThreshold: 0.02 },
  };
}

async function main() {
  if (values["list-playbooks"]) {
    listPlaybooks();
    process.exit(0);
  }

  const scorecardPath = values.scorecard as string;
  if (!scorecardPath) {
    console.error("Error: --scorecard <file> is required");
    process.exit(1);
  }

  if (!existsSync(scorecardPath)) {
    console.error("Error: Scorecard not found: " + scorecardPath);
    process.exit(1);
  }

  const scorecard = JSON.parse(readFileSync(scorecardPath, "utf-8"));
  const weakestMetric = scorecard.weakestMetric;
  const weakestData = scorecard.metrics.find((m: any) => m.name === weakestMetric);

  if (!weakestData) {
    console.error("Error: Could not find weakest metric in scorecard");
    process.exit(1);
  }

  const playbookId = getPlaybook(weakestMetric, weakestData.status);
  if (!playbookId) {
    console.log("\nNo playbook available for metric: " + weakestMetric + " (" + weakestData.status + ")");
    process.exit(0);
  }

  const playbook = PLAYBOOKS[playbookId];
  const seedSpec = generateSeedSpec(weakestMetric, playbookId, scorecard);

  // JSON output mode
  if (values.json) {
    console.log(JSON.stringify(seedSpec, null, 2));
    
    // Also save to file if --output specified
    if (values.output) {
      writeFileSync(values.output as string, JSON.stringify(seedSpec, null, 2));
    } else {
      // Still save to seeds dir
      const seedsDir = (values["seeds-dir"] as string) || process.env.REFLEX_SEEDS_DIR || resolve(process.env.HOME || "/root", "Seeds/reflex");
      mkdirSync(seedsDir, { recursive: true });
      const outputPath = resolve(seedsDir, seedSpec.id + ".json");
      writeFileSync(outputPath, JSON.stringify(seedSpec, null, 2));
    }
    process.exit(0);
  }

  // Output
  console.log("\n========================================");
  console.log("  REFLEX PRESCRIPTION");
  console.log("========================================");
  console.log("  Target: " + weakestMetric + " (" + weakestData.value + " -> " + weakestData.target + ")");
  console.log("  Playbook: " + playbookId + " (" + playbook.name + ")");
  console.log("  Severity: " + playbook.severity);
  const approvalText = playbook.autoApprove ? "Not required" : "Required";
  console.log("  Approval: " + approvalText);
  console.log("----------------------------------------");
  console.log("  SEED SPECIFICATION");
  console.log("  Goal: " + seedSpec.goal);
  console.log("  Target files: " + seedSpec.targetFiles[0]);
  console.log("========================================\n");

  // Save prescription
  const seedsDir = (values["seeds-dir"] as string) || process.env.REFLEX_SEEDS_DIR || resolve(process.env.HOME || "/root", "Seeds/reflex");
  mkdirSync(seedsDir, { recursive: true });

  const outputPath = resolve(seedsDir, seedSpec.id + ".json");
  writeFileSync(outputPath, JSON.stringify(seedSpec, null, 2));

  console.log("Prescription saved to: " + outputPath + "\n");
}

main().catch(console.error);
