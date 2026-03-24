#!/usr/bin/env bun
/**
 * Reflex Plan Generator - Turn vague ideas into phased plans
 */

import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    help: { type: "boolean", default: false },
  },
  strict: false,
  allowPositionals: true,
});

if (values.help) {
  console.log(`
Reflex Plan Generator

Usage:
  bun plan.ts "your feature idea"

Example:
  bun plan.ts "add user authentication"
  bun plan.ts "implement payment processing"
`);
  process.exit(0);
}

const idea = process.argv.slice(2).join(" ") || "Add new feature";

// Generate a phased plan based on the idea
const plan = generatePlan(idea);

console.log(`═ DEVELOPMENT PLAN: ${idea.toUpperCase()} ═\n`);

plan.phases.forEach((phase, i) => {
  console.log(`┌─ PHASE ${i + 1}: ${phase.name} ────────────────────`);
  console.log("│  Tasks:");
  phase.tasks.forEach(task => {
    console.log(`│  □ ${task}`);
  });
  if (phase.risks && phase.risks.length > 0) {
    console.log("│  Risks:");
    phase.risks.forEach(risk => {
      console.log(`│  ⚠ ${risk}`);
    });
  }
  if (phase.dependencies && phase.dependencies.length > 0) {
    console.log("│  Dependencies:");
    phase.dependencies.forEach(dep => {
      console.log(`│  → ${dep}`);
    });
  }
  console.log("└──────────────────────────────────────────────\n");
});

console.log("═ ESTIMATED TIME ═");
console.log(`Total: ${plan.estimatedTime}`);
console.log(`Complexity: ${plan.complexity}`);

function generatePlan(idea: string) {
  const lower = idea.toLowerCase();
  
  // Check for common patterns
  if (lower.includes("auth") || lower.includes("login") || lower.includes("user")) {
    return {
      phases: [
        {
          name: "Research & Design",
          tasks: [
            "Analyze authentication requirements",
            "Design auth flow (login, register, password reset)",
            "Choose auth provider (JWT, OAuth, session)",
            "Define user data model",
          ],
          risks: ["Unclear OAuth scope requirements", "Password policy compliance"],
        },
        {
          name: "Implementation",
          tasks: [
            "Set up auth middleware",
            "Implement login/register endpoints",
            "Add session/token management",
            "Create auth-protected routes",
          ],
          dependencies: ["Design approved", "User model finalized"],
        },
        {
          name: "Security & Testing",
          tasks: [
            "Add rate limiting",
            "Implement CSRF protection",
            "Write auth flow tests",
            "Security audit",
          ],
          dependencies: ["Implementation complete"],
        },
        {
          name: "Deployment",
          tasks: [
            "Configure production secrets",
            "Set up monitoring",
            "Deploy to staging",
            "User acceptance testing",
          ],
          dependencies: ["Tests passing"],
        },
      ],
      estimatedTime: "2-3 weeks",
      complexity: "Medium",
    };
  }
  
  if (lower.includes("payment") || lower.includes("stripe") || lower.includes("billing")) {
    return {
      phases: [
        {
          name: "Requirements & Setup",
          tasks: [
            "Define payment flow requirements",
            "Set up payment provider account",
            "Design pricing model",
            "Plan webhook handling",
          ],
          risks: ["PCI compliance requirements", "Currency support"],
        },
        {
          name: "Integration",
          tasks: [
            "Implement checkout flow",
            "Add payment method storage",
            "Handle webhook events",
            "Create billing dashboard",
          ],
          dependencies: ["Provider account approved"],
        },
        {
          name: "Testing & Launch",
          tasks: [
            "Test with sandbox environment",
            "Handle edge cases (refunds, disputes)",
            "Deploy to production",
            "Monitor first transactions",
          ],
          dependencies: ["Integration complete"],
        },
      ],
      estimatedTime: "1-2 weeks",
      complexity: "Medium-High",
    };
  }
  
  // Generic plan
  return {
    phases: [
      {
        name: "Planning",
        tasks: [
          "Define clear requirements",
          "Break down into components",
          "Identify dependencies",
          "Estimate effort",
        ],
      },
      {
        name: "Implementation",
        tasks: [
          "Set up project structure",
          "Build core functionality",
          "Add error handling",
          "Write documentation",
        ],
        dependencies: ["Requirements finalized"],
      },
      {
        name: "Testing & Deployment",
        tasks: [
          "Write unit tests",
          "Integration testing",
          "Deploy to staging",
          "Production release",
        ],
        dependencies: ["Implementation complete"],
      },
    ],
    estimatedTime: "1-2 weeks",
    complexity: "Medium",
  };
}