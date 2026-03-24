#!/usr/bin/env bun
/**
 * Reflex Ask - Natural language interface for beginners
 * 
 * Usage: reflex ask "check my code"
 *        reflex ask "what's wrong with my project"
 *        reflex ask "fix the red stuff"
 * 
 * No commands to remember — just say what you want.
 */

import { parseArgs } from "node:util";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const { values, positionals } = parseArgs({
  options: {
    project: { type: "string", short: "p", default: "." },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
  allowPositionals: true,
});

if (values.help || positionals.length < 2) {
  console.log(`
Reflex Ask - Just say what you want

Usage:
  reflex ask "check my code quality"
  reflex ask "what's wrong with my project"
  reflex ask "fix the problems"
  reflex ask "how do I improve test coverage"
  reflex ask "explain the red metrics"

No commands, no flags — just talk to it.

Examples:
  "check my code"          → Runs introspect, shows scorecard
  "fix it"                 → Runs fix-it, applies auto-fixes
  "what needs work"        → Shows weakest metrics
  "explain type integrity" → Plain English explanation
  "help me improve tests"  → Shows recommendations
`);
  process.exit(0);
}

const query = positionals.slice(1).join(" ").toLowerCase();
const projectPath = resolve(values.project as string);

// Intent detection
type Intent = "check" | "fix" | "explain" | "improve" | "help" | "unknown";

interface IntentMatch {
  intent: Intent;
  confidence: number;
  action: () => void;
}

const intents: IntentMatch[] = [
  // Check intents
  {
    intent: "check",
    confidence: 0.9,
    action: () => {
      console.log("\n🔍 Checking your code quality...\n");
      execSync(`bun ${__dirname}/../reflex-introspect/scripts/introspect.ts --project "${projectPath}"`, { stdio: "inherit" });
    },
    matches: (q: string) => 
      q.includes("check") || q.includes("quality") || q.includes("score") || 
      q.includes("health") || q.includes("how is my code") || q.includes("analyze")
  },
  
  // Fix intents
  {
    intent: "fix",
    confidence: 0.9,
    action: () => {
      console.log("\n🔧 Finding and fixing issues...\n");
      execSync(`bun ${__dirname}/../reflex-evolve/scripts/fix-it.ts --project "${projectPath}"`, { stdio: "inherit" });
    },
    matches: (q: string) => 
      q.includes("fix") || q.includes("repair") || q.includes("solve") || 
      q.includes("red stuff") || q.includes("problems") || q.includes("issues")
  },
  
  // Explain intents
  {
    intent: "explain",
    confidence: 0.8,
    action: () => {
      // Extract what to explain
      const topics: Record<string, string> = {
        "type": "Type Integrity",
        "types": "Type Integrity",
        "test": "Test Breadth",
        "tests": "Test Breadth",
        "coverage": "Test Breadth",
        "complexity": "Cyclomatic Load",
        "coupling": "Coupling Factor",
        "security": "Vulnerability Score",
        "vulnerabilities": "Vulnerability Score",
        "dependencies": "Dependency Freshness",
        "lint": "Lint Hygiene",
        "docs": "Documentation Ratio",
        "documentation": "Documentation Ratio",
        "build": "Build Efficiency",
      };
      
      let topic = "code quality";
      for (const [keyword, metricName] of Object.entries(topics)) {
        if (query.includes(keyword)) {
          topic = metricName;
          break;
        }
      }
      
      console.log(`\n📚 Explaining: ${topic}\n`);
      
      const explanations: Record<string, string[]> = {
        "Type Integrity": [
          "What it means: How well TypeScript knows what your variables are.",
          "Why it matters: When TypeScript knows types, it catches bugs before you run code.",
          "Common issues: Using 'any', missing return types, untyped parameters.",
          "How to improve: Add type annotations, avoid 'any', use strict mode.",
        ],
        "Test Breadth": [
          "What it means: How much of your code runs during tests.",
          "Why it matters: Untested code might have bugs you don't know about.",
          "Common issues: Missing tests for utility functions, uncovered branches.",
          "How to improve: Write tests for each function, test error paths too.",
        ],
        "Cyclomatic Load": [
          "What it means: How complex your functions are — how many paths through the code.",
          "Why it matters: Complex functions are harder to understand and more likely to have bugs.",
          "Common issues: Too many if statements, nested conditions, long functions.",
          "How to improve: Break big functions into smaller ones, use early returns.",
        ],
        "Vulnerability Score": [
          "What it means: Security holes in packages you depend on.",
          "Why it matters: Hackers can exploit known vulnerabilities to attack your app.",
          "Common issues: Using old packages with known security issues.",
          "How to improve: Run 'npm audit fix' or update packages regularly.",
        ],
        "Lint Hygiene": [
          "What it means: Following code style rules — consistent formatting, no unused variables.",
          "Why it matters: Consistent code is easier to read and maintain.",
          "Common issues: Unused imports, inconsistent spacing, missing semicolons.",
          "How to improve: Run 'eslint --fix' or configure auto-format on save.",
        ],
      };
      
      const lines = explanations[topic] || [
        `${topic} measures an aspect of your code's quality.`,
        "Higher scores mean better code health.",
        "Run 'reflex check' to see your current score.",
      ];
      
      lines.forEach(line => console.log(`  ${line}\n`));
    },
    matches: (q: string) => 
      q.includes("explain") || q.includes("what is") || q.includes("what does") || 
      q.includes("what are") || q.includes("tell me about") || q.includes("what means")
  },
  
  // Improve intents
  {
    intent: "improve",
    confidence: 0.85,
    action: () => {
      console.log("\n🎯 Finding improvement opportunities...\n");
      
      // Get scorecard
      const scorecardJson = execSync(
        `bun ${__dirname}/../reflex-introspect/scripts/introspect.ts --project "${projectPath}" --json`,
        { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );
      
      const scorecard = JSON.parse(scorecardJson);
      
      // Sort metrics by score (ascending)
      const sortedMetrics = [...scorecard.metrics].sort((a, b) => a.normalizedScore - b.normalizedScore);
      
      console.log("  Your weakest areas (best opportunities for improvement):\n");
      
      sortedMetrics.slice(0, 3).forEach((metric: any, i: number) => {
        const icon = metric.normalizedScore < 50 ? "🔴" : metric.normalizedScore < 75 ? "🟡" : "🟢";
        console.log(`  ${i + 1}. ${icon} ${metric.name}: ${metric.value} → score: ${metric.normalizedScore}%`);
        
        // Add recommendation
        const recommendations: Record<string, string> = {
          "Type Integrity": "     → Add type annotations, enable strict mode",
          "Test Breadth": "     → Add more tests, especially for untested files",
          "Test Depth": "     → Test edge cases and error paths",
          "Cyclomatic Load": "     → Break down complex functions",
          "Coupling Factor": "     → Separate concerns, add interfaces",
          "Vulnerability Score": "     → Run npm audit fix, update packages",
          "Dependency Freshness": "     → Update outdated packages",
          "Lint Hygiene": "     → Run linter with --fix flag",
          "Documentation Ratio": "     → Add JSDoc to public functions",
          "Build Efficiency": "     → Optimize build config, check bundle size",
        };
        
        console.log(recommendations[metric.name] || "     → Focus on improving this metric");
        console.log();
      });
      
      console.log("\n  Want to fix these? Run: reflex fix\n");
    },
    matches: (q: string) => 
      q.includes("improve") || q.includes("what needs") || q.includes("weakest") || 
      q.includes("worst") || q.includes("should i work on") || q.includes("prioritize")
  },
  
  // Help intents
  {
    intent: "help",
    confidence: 0.95,
    action: () => {
      console.log(`
  Reflex — Your code's reflex. Quality on automatic.

  Just tell me what you want:

  "check my code"         → See your quality score
  "fix the problems"      → Auto-fix issues
  "what needs work"       → Find weakest areas
  "explain [metric]"      → Learn what a metric means
  "how do I improve"      → Get recommendations

  No commands to memorize.
  Just describe what you want in your own words.
`);
    },
    matches: (q: string) => 
      q.includes("help") || q.includes("how do i") || q.includes("what can") || 
      q === "" || q.length < 5
  },
];

// Find matching intent
let matchedIntent: IntentMatch | null = null;
for (const intent of intents) {
  if (intent.matches(query)) {
    matchedIntent = intent;
    break;
  }
}

// Execute matched intent or default to help
if (matchedIntent) {
  matchedIntent.action();
} else {
  console.log(`\n  I'm not sure what you mean by "${query}"\n`);
  console.log("  Try one of these:");
  console.log("    • reflex ask \"check my code\"");
  console.log("    • reflex ask \"fix the problems\"");
  console.log("    • reflex ask \"what needs work\"");
  console.log("    • reflex ask \"help\"\n");
}