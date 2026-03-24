#!/usr/bin/env bun
/**
 * Reflex CLI - Unified entry point
 * 
 * Your code's reflex. Quality on automatic.
 */

import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";

// Resolve from cli/ directory to parent (where skills are)
const REFLEX_ROOT = dirname(dirname(import.meta.url.replace("file://", "")));
const SKILLS_DIR = resolve(REFLEX_ROOT, "skills");

const COMMANDS: Record<string, string> = {
  introspect: `${SKILLS_DIR}/reflex-introspect/scripts/introspect.ts`,
  prescribe: `${SKILLS_DIR}/reflex-prescribe/scripts/prescribe.ts`,
  evolve: `${SKILLS_DIR}/reflex-evolve/scripts/evolve.ts`,
  interview: `${SKILLS_DIR}/reflex-interview/scripts/interview.ts`,
  eval: `${SKILLS_DIR}/reflex-eval/scripts/evaluate.ts`,
  unstuck: `${SKILLS_DIR}/reflex-unstuck/scripts/unstuck.ts`,
  loop: `${SKILLS_DIR}/reflex-loop/scripts/autofix.ts`,
  security: `${SKILLS_DIR}/reflex-security/scripts/scan.ts`,
  plan: `${SKILLS_DIR}/reflex-planner/scripts/plan.ts`,
  setup: `${SKILLS_DIR}/reflex-wizard/scripts/wizard.ts`,
  "full-cycle": resolve(REFLEX_ROOT, "cli/full-cycle.ts"),
  // Beginner-friendly aliases
  check: `${SKILLS_DIR}/reflex-introspect/scripts/introspect.ts`,
  fix: `${SKILLS_DIR}/reflex-evolve/scripts/evolve.ts`,
  ask: resolve(REFLEX_ROOT, "cli/ask.ts"),
};

const help = `
⚡ Reflex - Your code's reflex

Usage:
  reflex <command> [options]

Commands:
  check          Analyze code health (alias for introspect)
  fix            Auto-fix issues (alias for evolve)
  introspect     Diagnose code health across 10 metrics
  prescribe      Generate improvement prescription
  evolve         Execute prescription with LLM
  security       Security vulnerability scan
  plan           Generate improvement plan
  interview      Socratic requirements interview
  eval           Three-stage verification pipeline
  unstuck        Get unstuck with lateral-thinking personas
  loop           Single-metric optimization loop
  full-cycle     Run complete self-enhancement cycle

Options:
  --project, -p   Target project directory or GitHub URL
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
  reflex check ./my-app
  reflex check https://github.com/user/repo
  reflex fix --project ./my-app --dry-run
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

  if (!existsSync(scriptPath)) {
    console.error(`Script not found: ${scriptPath}`);
    console.log("\nMake sure you're running from the reflex directory.");
    console.log("Try: bun run cli/index.ts <command>");
    process.exit(1);
  }

  // Handle bare arguments for check/introspect commands
  // If it's a GitHub URL or path without --project flag, add the flag
  let scriptArgs = args.slice(1);
  if ((command === 'check' || command === 'introspect') && scriptArgs.length > 0 && !scriptArgs[0].startsWith('-')) {
    scriptArgs = ['--project', scriptArgs[0], ...scriptArgs.slice(1)];
  }
  
  // Pass args to the script
  process.argv = [process.argv[0], scriptPath, ...scriptArgs];

  // Import and run the script
  await import(scriptPath);
}

main().catch(console.error);