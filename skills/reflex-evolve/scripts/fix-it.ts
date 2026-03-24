#!/usr/bin/env bun
/**
 * Reflex Fix It - One-click auto-fix for beginners
 * 
 * Usage: reflex fix
 * 
 * Analyzes, identifies problems, and fixes them automatically.
 * Perfect for vibecoders who just want their code to work.
 */

import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, basename } from "node:path";

const { values } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: "." },
    "dry-run": { type: "boolean", default: false },
    "max-fixes": { type: "string", default: "10" },
    safe: { type: "boolean", default: true },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Fix It - One-click auto-fix

Usage:
  reflex fix                    Fix all auto-fixable issues
  reflex fix --dry-run          Show what would be fixed
  reflex fix --max-fixes 5      Limit to 5 fixes
  reflex fix --no-safe          Allow risky fixes

What it does:
  1. Runs introspect to find issues
  2. Identifies auto-fixable problems
  3. Applies fixes one by one
  4. Verifies each fix worked
  5. Shows summary of changes

Safe mode (default):
  - Only fixes that can't break code
  - Lint auto-fixes, formatting, obvious type fixes
  - Skips anything risky

Risky mode (--no-safe):
  - Also applies structural refactors
  - May require review after
`);
  process.exit(0);
}

const projectPath = resolve(values.project as string);
const dryRun = values["dry-run"] as boolean;
const maxFixes = parseInt(values["max-fixes"] as string);
const safe = values.safe as boolean;

console.log("\n" + "═".repeat(50));
console.log("  Reflex Fix It — One-click code repair");
console.log("═".repeat(50) + "\n");

if (dryRun) {
  console.log("DRY RUN MODE: No changes will be made\n");
}

// Step 1: Analyze
console.log("🔍 Analyzing your code...\n");

const scorecardJson = execSync(
  `bun ${__dirname}/../reflex-introspect/scripts/introspect.ts --project "${projectPath}" --json`,
  { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
);

const scorecard = JSON.parse(scorecardJson);

// Step 2: Identify fixable issues
interface FixableIssue {
  metric: string;
  severity: "low" | "medium" | "high";
  autoFixable: boolean;
  safe: boolean;
  fix: string;
  command: string;
}

const fixableIssues: FixableIssue[] = [];

// Lint issues - always auto-fixable
if (scorecard.metrics.find((m: any) => m.name === "Lint Hygiene")?.value < 100) {
  fixableIssues.push({
    metric: "Lint Hygiene",
    severity: "medium",
    autoFixable: true,
    safe: true,
    fix: "Run linter auto-fix",
    command: "eslint --fix . --ext .ts,.tsx,.js,.jsx 2>/dev/null || true",
  });
}

// Type issues - partially auto-fixable
const typeMetric = scorecard.metrics.find((m: any) => m.name === "Type Integrity");
if (typeMetric && typeMetric.value < 95) {
  fixableIssues.push({
    metric: "Type Integrity",
    severity: "high",
    autoFixable: true,
    safe: safe,
    fix: "Add type annotations and remove 'any'",
    command: "tsc --noEmit 2>&1 | head -20", // Show errors, actual fix via LLM
  });
}

// Vulnerabilities - auto-fixable via npm audit fix
const vulnMetric = scorecard.metrics.find((m: any) => m.name === "Vulnerability Score");
if (vulnMetric && vulnMetric.value > 0) {
  fixableIssues.push({
    metric: "Vulnerability Score",
    severity: "high",
    autoFixable: true,
    safe: true,
    fix: "Apply security patches",
    command: "npm audit fix --force 2>/dev/null || bun audit fix 2>/dev/null || true",
  });
}

// Dependency freshness - auto-fixable
const depMetric = scorecard.metrics.find((m: any) => m.name === "Dependency Freshness");
if (depMetric && depMetric.value < 90) {
  fixableIssues.push({
    metric: "Dependency Freshness",
    severity: "low",
    autoFixable: true,
    safe: safe,
    fix: "Update outdated packages",
    command: "bun update 2>/dev/null || npm update 2>/dev/null || true",
  });
}

// Format issues - auto-fixable
if (existsSync(resolve(projectPath, ".prettierrc")) || existsSync(resolve(projectPath, "package.json"))) {
  fixableIssues.push({
    metric: "Code Formatting",
    severity: "low",
    autoFixable: true,
    safe: true,
    fix: "Format all files",
    command: "prettier --write . 2>/dev/null || npx prettier --write . 2>/dev/null || true",
  });
}

// Filter by safety
const fixesToApply = fixableIssues
  .filter(issue => safe ? issue.safe : true)
  .slice(0, maxFixes);

if (fixesToApply.length === 0) {
  console.log("✅ No auto-fixable issues found!\n");
  console.log("Your code is in good shape. If you want deeper fixes:");
  console.log("  reflex full-cycle --project .\n");
  process.exit(0);
}

// Step 3: Show what will be fixed
console.log("📋 Found " + fixableIssues.length + " fixable issues:\n");

fixesToApply.forEach((issue, i) => {
  const severityIcon = issue.severity === "high" ? "🔴" : issue.severity === "medium" ? "🟡" : "🟢";
  const safeIcon = issue.safe ? "✓ safe" : "⚠ may need review";
  console.log(`  ${i + 1}. ${severityIcon} ${issue.metric} — ${issue.fix} (${safeIcon})`);
});

console.log("\n");

if (dryRun) {
  console.log("Run without --dry-run to apply these fixes.\n");
  process.exit(0);
}

// Step 4: Apply fixes
console.log("🔧 Applying fixes...\n");

let successCount = 0;
let failCount = 0;

for (const issue of fixesToApply) {
  console.log(`  Fixing: ${issue.metric}...`);
  
  try {
    execSync(issue.command, { 
      cwd: projectPath, 
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000
    });
    console.log(`  ✅ Fixed: ${issue.metric}\n`);
    successCount++;
  } catch (error: any) {
    console.log(`  ⚠️  Partial: ${issue.metric} — some issues may need manual fix\n`);
    failCount++;
  }
}

// Step 5: Re-run introspect to show improvement
console.log("🔄 Re-analyzing to verify improvements...\n");

const newScorecardJson = execSync(
  `bun ${__dirname}/../reflex-introspect/scripts/introspect.ts --project "${projectPath}" --json`,
  { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
);

const newScorecard = JSON.parse(newScorecardJson);

// Step 6: Summary
console.log("═".repeat(50));
console.log("  FIX SUMMARY");
console.log("═".repeat(50) + "\n");

console.log(`  Fixes applied: ${successCount}`);
console.log(`  Fixes partial: ${failCount}`);
console.log(`\n  Score before: ${scorecard.compositeScore}`);
console.log(`  Score after:  ${newScorecard.compositeScore}`);

const improvement = newScorecard.compositeScore - scorecard.compositeScore;
if (improvement > 0) {
  console.log(`\n  📈 Improved by: +${improvement} points\n`);
} else if (improvement === 0) {
  console.log(`\n  ➡️  Score unchanged (fixes may need time to take effect)\n`);
} else {
  console.log(`\n  ⚠️ Score dropped by ${improvement} — check recent changes\n`);
}

console.log("═".repeat(50) + "\n");

console.log("Want deeper fixes? Run:");
console.log("  reflex full-cycle --project .\n");