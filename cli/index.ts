#!/usr/bin/env bun
/**
 * Reflex CLI - Unified entry point
 * 
 * Your code's reflex. Quality on automatic.
 */

import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";

// Resolve from cli/ directory to parent (where skills are)
const REFLEX_ROOT = dirname(dirname(import.meta.path));

const COMMANDS: Record<string, string> = {
  introspect: "reflex-introspect/scripts/introspect.ts",
  prescribe: "reflex-prescribe/scripts/prescribe.ts",
  evolve: "reflex-evolve/scripts/evolve.ts",
  interview: "reflex-interview/scripts/interview.ts",
  eval: "reflex-eval/scripts/eval.ts",
  unstuck: "reflex-unstuck/scripts/unstuck.ts",
  loop: "reflex-loop/scripts/loop.ts",
  "full-cycle": "cli/full-cycle.ts",
  // Beginner-friendly aliases
  check: "reflex-introspect/scripts/introspect.ts",
  fix: "reflex-evolve/scripts/evolve.ts",
  security: "reflex-security/scripts/scan.ts",
  plan: "reflex-planner/scripts/plan.ts",
  setup: "reflex-wizard/scripts/wizard.ts",
  ask: "cli/ask.ts",
};

const help = `
⚡ Reflex - Your code's reflex

Usage:
  reflex <command> [options]

Commands:
  introspect     Diagnose code health across 7 metrics
  prescribe      Generate improvement prescription
  evolve         Execute prescription with LLM
  interview      Socratic requirements interview
  eval           Three-stage verification pipeline
  unstuck        Get unstuck with lateral-thinking personas
  loop           Single-metric optimization loop
  full-cycle     Run complete self-enhancement cycle

Options:
  --project, -p   Target project directory (default: cwd)
  --json          Output as JSON for scripting
  --verbose       Show detailed output
  --dry-run       Generate but don't execute
  --help, -h      Show command-specific help

Environment:
  REFLEX_LLM_PROVIDER    LLM provider: openai, anthropic, ollama, zo
  REFLEX_LLM_API_KEY     API key for external providers
  REFLEX_LLM_MODEL       Model name override
  REFLEX_SEEDS_DIR       Prescription output directory

Examples:
  reflex introspect --project ./my-app
  reflex prescribe --scorecard scorecard.json
  reflex evolve --prescription rx-test-coverage.json
  reflex full-cycle --project ./my-app
  reflex unstuck --problem "I keep hitting the same error"

Run 'reflex <command> --help' for command-specific options.
`;

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(help);
    process.exit(0);
  }

  const command = args[0];
  const scriptPath = COMMANDS[command];

  if (!scriptPath) {
    console.error(`Unknown command: ${command}`);
    console.log("\nAvailable commands:", Object.keys(COMMANDS).join(", "));
    process.exit(1);
  }

  const fullPath = resolve(REFLEX_ROOT, scriptPath);
  if (!existsSync(fullPath)) {
    console.error(`Script not found: ${fullPath}`);
    process.exit(1);
  }

  // Import and run the script
  await import(fullPath);
}

main().catch(console.error);
