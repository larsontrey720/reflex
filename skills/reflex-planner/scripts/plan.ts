#!/usr/bin/env bun
/**
 * Reflex Plan - Generate development plans from vague ideas
 * 
 * Features from CodeRabbit Plan:
 * - Takes tickets/ideas and breaks them into clear phases
 * - Identifies dependencies and risks
 * - Generates actionable tasks
 */

import { parseArgs } from "node:util";

// LLM Client
async function generatePlan(idea: string, context: string = ""): Promise<{ title: string; phases: Array<{ name: string; tasks: string[]; risks: string[]; dependencies: string[] }> }> {
  const prompt = `You are a senior software architect. Given this development idea, create a clear, phased implementation plan.

Idea: "${idea}"
${context ? `Context: ${context}` : ""}

Respond with a JSON object in this exact format:
{
  "title": "Feature name",
  "phases": [
    {
      "name": "Phase name",
      "tasks": ["task 1", "task 2"],
      "risks": ["risk 1"],
      "dependencies": ["dependency 1"]
    }
  ]
}

Keep it practical. 3-5 phases, 2-4 tasks per phase. Focus on what needs to be built, not how.`;

  // Use Zo's built-in LLM or configured provider
  const response = await fetch("https://api.zo.computer/zo/ask", {
    method: "POST",
    headers: {
      "Authorization": process.env.ZO_CLIENT_IDENTITY_TOKEN || "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: prompt,
      model_name: "byok:8d5a353d-a103-4997-b8b5-5e306976a3d8",
    }),
  });

  const data = await response.json();
  const output = data.output as string;
  
  // Extract JSON from response
  const jsonMatch = output.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }
  
  // Fallback plan
  return {
    title: idea.substring(0, 50),
    phases: [
      {
        name: "Research & Design",
        tasks: ["Analyze requirements", "Design architecture", "Create technical spec"],
        risks: ["Unclear requirements"],
        dependencies: [],
      },
      {
        name: "Implementation",
        tasks: ["Set up project structure", "Build core functionality", "Add error handling"],
        risks: ["Technical complexity", "Integration issues"],
        dependencies: ["Design approved"],
      },
      {
        name: "Testing & Deployment",
        tasks: ["Write tests", "Perform code review", "Deploy to staging"],
        risks: ["Bugs in production"],
        dependencies: ["Implementation complete"],
      },
    ],
  };
}

function formatPlan(plan: { title: string; phases: Array<{ name: string; tasks: string[]; risks: string[]; dependencies: string[] }> }): string {
  const lines: string[] = [];
  
  lines.push("═".repeat(60));
  lines.push(`  📋 DEVELOPMENT PLAN: ${plan.title.toUpperCase()}`);
  lines.push("═".repeat(60));
  
  for (let i = 0; i < plan.phases.length; i++) {
    const phase = plan.phases[i];
    lines.push(`\n┌─ PHASE ${i + 1}: ${phase.name} ─────────────────────────────`);
    
    lines.push("│");
    lines.push("│  Tasks:");
    for (const task of phase.tasks) {
      lines.push(`│  □ ${task}`);
    }
    
    if (phase.risks.length > 0) {
      lines.push("│");
      lines.push("│  Risks:");
      for (const risk of phase.risks) {
        lines.push(`│  ⚠ ${risk}`);
      }
    }
    
    if (phase.dependencies.length > 0) {
      lines.push("│");
      lines.push("│  Dependencies:");
      for (const dep of phase.dependencies) {
        lines.push(`│  → ${dep}`);
      }
    }
    
    lines.push("│");
    lines.push("└" + "─".repeat(50));
  }
  
  lines.push("\n" + "═".repeat(60));
  lines.push("  Next: Start with Phase 1, Task 1");
  lines.push("═".repeat(60));
  
  return lines.join("\n");
}

// Main
const { values, positionals } = parseArgs({
  options: {
    context: { type: "string", short: "c" },
    output: { type: "string", short: "o" },
    json: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Reflex Plan - Generate development plans

Usage:
  reflex plan "your idea or ticket" [options]

Options:
  -c, --context <text>    Additional context
  -o, --output <file>     Save plan to file
  --json                  JSON output
  -h, --help              Show this help

Examples:
  reflex plan "add user authentication"
  reflex plan "implement payment system" --context "using Stripe"
`);
  process.exit(0);
}

const idea = positionals[2] || positionals[0] || process.argv[2];

if (!idea) {
  console.log("Usage: reflex plan \"your idea or ticket\"");
  process.exit(1);
}

console.log(`\n🎯 Generating plan for: "${idea}"\n`);

const plan = await generatePlan(idea, values.context as string);

if (values.json) {
  console.log(JSON.stringify(plan, null, 2));
} else {
  const formatted = formatPlan(plan);
  console.log(formatted);
}

if (values.output) {
  const { writeFile } = await import('node:fs/promises');
  await writeFile(values.output as string, values.json ? JSON.stringify(plan, null, 2) : formatPlan(plan));
  console.log(`\nPlan saved to: ${values.output}`);
}