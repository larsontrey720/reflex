#!/usr/bin/env bun
/**
 * Reflex CLI - Unified entry point
 * 
 * Your code's reflex. Quality on automatic.
 */

import { resolve, dirname } from "node:path";
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { exec } from "node:child_process";

// Resolve from cli/ directory to parent (where skills are)
const REFLEX_ROOT = dirname(dirname(import.meta.path));

const SKILLS_DIR = resolve(import.meta.dir, "..", "skills");

function join(...parts: string[]) {
  return parts.reduce((acc, part) => acc + "/" + part, "").slice(1);
}

// Command definitions
const COMMANDS: Record<string, { skill: string; script: string; desc: string }> = {
  introspect: {
    skill: "reflex-introspect",
    script: "introspect.ts",
    desc: "Diagnose code health (10 metrics)",
  },
  prescribe: {
    skill: "reflex-prescribe",
    script: "prescribe.ts",
    desc: "Generate fix prescription (17 playbooks)",
  },
  evolve: {
    skill: "reflex-evolve",
    script: "evolve.ts",
    desc: "Execute fixes via LLM",
  },
  "full-cycle": {
    skill: "cli",
    script: "full-cycle.ts",
    desc: "Complete loop: introspect → prescribe → evolve",
  },
  interview: {
    skill: "reflex-interview",
    script: "interview.ts",
    desc: "Socratic requirements gathering",
  },
  eval: {
    skill: "reflex-eval",
    script: "evaluate.ts",
    desc: "Three-stage verification",
  },
  unstuck: {
    skill: "reflex-unstuck",
    script: "unstuck.ts",
    desc: "Lateral-thinking debug personas (9 total)",
  },
  loop: {
    skill: "reflex-loop",
    script: "autofix.ts",
    desc: "Single-metric optimization loop",
  },
};

// Main
const args = parseArgs(process.argv.slice(2));
const command = args._[0];

if (!command || command === "--help" || command === "-h") {
  console.log(`
Reflex - Your code's reflex

Usage:
  reflex <command> [options]

Commands:
  introspect     Diagnose code health (10 metrics)
  prescribe      Generate fix prescription (17 playbooks)
  evolve         Execute fixes via LLM
  full-cycle     Complete loop: introspect → prescribe → evolve
  interview      Socratic requirements gathering
  eval           Three-stage verification
  unstuck        Lateral-thinking debug personas (9 total)
  loop           Single-metric optimization loop

Options (common):
  --project, -p <path>   Target project directory
  --json                 Output JSON format
  --verbose, -v          Show detailed output
  --dry-run              Preview without executing
  --help, -h             Show command help

Run 'reflex <command> --help' for command-specific options.

Examples:
  reflex introspect --project ./my-app
  reflex full-cycle --project . --max 3
  reflex unstuck --problem "I keep hitting the same error"
`);
  process.exit(0);
}

// Natural language shortcut
if (command === "ask") {
  const query = args._.slice(1).join(" ");
  if (!query) {
    console.log('\nJust tell me what you want:\n');
    console.log('  reflex ask "check my code"');
    console.log('  reflex ask "fix the problems"');
    console.log('  reflex ask "what needs work"\n');
    process.exit(0);
  }
  exec(`bun ${SKILLS_DIR}/cli/ask.ts ask "${query}"`, { stdio: "inherit" });
  process.exit(0);
}

// One-click fix shortcut
if (command === "fix") {
  exec(`bun ${SKILLS_DIR}/reflex-evolve/scripts/fix-it.ts`, { stdio: "inherit" });
  process.exit(0);
}

// Setup wizard
if (command === "setup" || command === "wizard") {
  exec(`bun ${SKILLS_DIR}/reflex-wizard/scripts/wizard.ts`, { stdio: "inherit" });
  process.exit(0);
}

// Plain speak mode
if (command === "explain") {
  const metric = args._[1] || "all";
  exec(`bun ${SKILLS_DIR}/reflex-introspect/scripts/plain-speak.ts --metric ${metric}`, { stdio: "inherit" });
  process.exit(0);
}

if (!COMMANDS[command]) {
  console.error(`Unknown command: ${command}`);
  console.log("Available commands:", Object.keys(COMMANDS).join(", "));
  process.exit(1);
}

const { skill, script } = COMMANDS[command];
const scriptPath = skill === "cli" 
  ? join(REFLEX_ROOT, "cli", script)
  : join(SKILLS_DIR, skill, "scripts", script);

if (!existsSync(scriptPath)) {
  console.error(`Script not found: ${scriptPath}`);
  process.exit(1);
}

// Forward remaining args to the script
const scriptArgs = args.slice(1);
const fullArgs = ["run", scriptPath, ...scriptArgs];

// Use Bun to run the script
import { spawn } from "node:child_process";
const child = spawn("bun", fullArgs, {
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code || 0);
});