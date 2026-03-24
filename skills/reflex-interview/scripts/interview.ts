#!/usr/bin/env bun
/**
 * Reflex Interview - Socratic requirements gathering
 * 
 * Asks questions, detects project type, creates config, offers to run first scan
 */

import { parseArgs } from "node:util";
import * as readline from "node:readline";

const { values } = parseArgs({
  options: {
    request: { type: "string", short: "r" },
    score: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Reflex Interview - Socratic requirements gathering

Usage:
  bun interview.ts [options]

Options:
  -r, --request <text>   The build request to analyze
  --score                Just score the request, don't run interview
  -h, --help             Show this help

The interview asks clarifying questions to reduce ambiguity before building.
`);
  process.exit(0);
}

if (values.score && values.request) {
  const request = values.request as string;
  const ambiguity = scoreAmbiguity(request);
  console.log(`\nAmbiguity Score: ${ambiguity.toFixed(2)}`);
  console.log(ambiguity > 0.7 ? "HIGH AMBIGUITY - Interview recommended" : "LOW AMBIGUITY - Ready to build");
  process.exit(0);
}

interface Answers {
  goal?: string;
  constraints?: string[];
  successCriteria?: string[];
}

async function runInterview(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (prompt: string): Promise<string> => 
    new Promise(resolve => rl.question(prompt, resolve));

  console.log("\n=== REFLEX INTERVIEW ===\n");
  console.log("Let's clarify what you want to build.\n");

  const answers: Answers = {};

  answers.goal = await question("What is the main goal? ");
  
  console.log("\nGreat! Now let's talk constraints.");
  const constraints = await question("Any constraints (time, tech, resources)? (comma-separated) ");
  answers.constraints = constraints.split(",").map(s => s.trim()).filter(Boolean);

  console.log("\nHow will we know it's done?");
  const criteria = await question("Success criteria? (comma-separated) ");
  answers.successCriteria = criteria.split(",").map(s => s.trim()).filter(Boolean);

  rl.close();

  const clarityScore = calculateClarity(answers);
  console.log(`\n=== INTERVIEW COMPLETE ===`);
  console.log(`Clarity Score: ${(clarityScore * 100).toFixed(0)}%`);
  console.log(`\nGoal: ${answers.goal}`);
  if (answers.constraints.length) console.log(`Constraints: ${answers.constraints.join(", ")}`);
  if (answers.successCriteria.length) console.log(`Success Criteria: ${answers.successCriteria.join(", ")}`);
  
  if (clarityScore >= 0.7) {
    console.log("\n✅ Requirements are clear. Ready to generate seed spec.");
  } else {
    console.log("\n⚠️  More clarity needed. Consider re-running interview.");
  }
}

function scoreAmbiguity(request: string): number {
  const vagueWords = ["fast", "better", "nice", "good", "clean", "simple", "easy", "improve", "fix"];
  const specificPatterns = [/\d+/, /api/i, /database/i, /auth/i, /test/i, /type/i];
  
  let score = 0.5;
  
  const lowerRequest = request.toLowerCase();
  for (const word of vagueWords) {
    if (lowerRequest.includes(word)) score += 0.08;
  }
  
  for (const pattern of specificPatterns) {
    if (pattern.test(request)) score -= 0.1;
  }
  
  return Math.max(0, Math.min(1, score));
}

function calculateClarity(answers: Answers): number {
  let score = 0;
  if (answers.goal && answers.goal.length > 10) score += 0.4;
  if (answers.constraints && answers.constraints.length > 0) score += 0.2;
  if (answers.successCriteria && answers.successCriteria.length > 0) score += 0.4;
  return score;
}

runInterview().catch(console.error);