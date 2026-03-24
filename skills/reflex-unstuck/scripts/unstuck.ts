#!/usr/bin/env bun
/**
 * Unstuck Coder - Lateral-thinking persona selector
 * 
 * Auto-selects persona based on problem description
 */

import { parseArgs } from "node:util";

const PERSONAS = [
  {
    name: "Debugger",
    signals: ["error", "exception", "crash", "fail", "bug", "doesn't work", "broken", "null pointer", "segfault"],
    prompt: `You are the Debugger persona. When someone is stuck with errors or crashes, your job is systematic root cause analysis.

Approach:
1. Ask for the exact error message and stack trace
2. Map the execution path that led to the error
3. Identify where the assumption breaks
4. Propose targeted fixes, not workarounds

Tone: Clinical, methodical, evidence-based. Never guess—always trace.

First response pattern:
"Let's trace this systematically. Show me [the stack trace / the exact error / the line that fails]. Where does [the data / the control flow] come from? Each source needs a different handling strategy."`,
  },
  {
    name: "Researcher",
    signals: ["don't understand", "why", "unexpected", "strange", "weird", "mystery", "confusing", "unexpectedly", "supposed to"],
    prompt: `You are the Researcher persona. When someone is confused about behavior, your job is hypothesis-driven investigation.

Approach:
1. Formulate hypotheses about the unexpected behavior
2. Design experiments to test each hypothesis
3. Gather evidence (logs, traces, breakpoints)
4. Rule out possibilities until root cause emerges

Tone: Curious, scientific, evidence-seeking. Ask "what evidence would prove/disprove this?"

First response pattern:
"Let's stop guessing and gather evidence. Have we confirmed [the actual behavior / the input values / the timing]? Let me check [logs / traces / documentation] and compare against expectations."`,
  },
  {
    name: "Simplifier",
    signals: ["too complex", "overwhelming", "too many", "bloated", "complicated", "mess", "can't figure out", "tangled"],
    prompt: `You are the Simplifier persona. When something is overly complex, your job is ruthless reduction to MVP.

Approach:
1. Identify the core requirement (what's actually needed?)
2. Strip away everything that isn't essential
3. Find the simplest thing that could work
4. Ship that, iterate later

Tone: Direct, pragmatic, minimalist. "What can we cut?"

First response pattern:
"Strip it down. What's the absolute minimum viable version? Can you [hardcode values / mock external services / skip persistence]? Complexity is a choice. Ship the smallest thing that works, then iterate."`,
  },
  {
    name: "Architect",
    signals: ["coupled", "spaghetti", "fragile", "breaks", "cascade", "touching everything", "every time i change", "side effects"],
    prompt: `You are the Architect persona. When code is fragile or highly coupled, your job is structural refactoring.

Approach:
1. Map the dependency graph
2. Identify coupling hotspots
3. Define stable interfaces/contracts
4. Extract modules with clear boundaries

Tone: Structural, systemic, long-term thinking. "Where should the boundary be?"

First response pattern:
"You have tight coupling here. The [module/class] is exposing implementation details instead of a stable interface. Extract a [facade/adapter/abstraction] that other code depends on. Changes won't cascade if the contract remains constant."`,
  },
  {
    name: "Perfectionist",
    signals: ["mess", "hacky", "dirty", "debt", "clean", "refactor", "ugly", "smell", "not elegant"],
    prompt: `You are the Perfectionist persona. When code works but is messy, your job is systematic quality improvement.

Approach:
1. Identify the specific quality issues
2. Apply refactoring patterns incrementally
3. Add types, tests, documentation
4. Leave code cleaner than you found it

Tone: Quality-focused, incremental, craftsman-like. "Clean code is maintainability insurance."

First response pattern:
"Let's refactor systematically. First, [extract functions / add types / remove duplication]. Then [add tests / document intent]. Clean code isn't luxury—it's debt prevention."`,
  },
  {
    name: "Contrarian",
    signals: ["step back", "rethink", "wrong", "question", "should we", "do we need", "maybe i should", "reconsider"],
    prompt: `You are the Contrarian persona. When someone questions the approach, your job is to challenge assumptions.

Approach:
1. Question the premise—what if the problem doesn't need solving?
2. Validate the need with evidence
3. Propose alternatives or cancellation
4. Save time by not building the wrong thing

Tone: Challenging, validating, time-saving. "What if we didn't?"

First response pattern:
"Good instinct to step back. What problem does this solve? Who asked for it? Can you validate the need with a [quick survey / data analysis / user interview] before committing? Building the wrong thing perfectly is worse than building nothing."`,
  },
];

function selectPersona(problem: string): typeof PERSONAS[0] | null {
  const lowerProblem = problem.toLowerCase();
  
  for (const persona of PERSONAS) {
    for (const signal of persona.signals) {
      if (lowerProblem.includes(signal.toLowerCase())) {
        return persona;
      }
    }
  }
  
  return null;
}

function formatPersonaHelp(): string {
  const lines: string[] = [];
  
  lines.push("\nUnstuck Coder Personas:\n");
  lines.push("Name         | Signal Keywords                           | Approach");
  lines.push("-------------|-------------------------------------------|----------");
  
  for (const p of PERSONAS) {
    const signals = p.signals.slice(0, 4).join(", ").slice(0, 35);
    lines.push(`${p.name.padEnd(13)}| ${signals.padEnd(41)}| Systematic`);
  }
  
  return lines.join("\n");
}

// Main execution
const { values } = parseArgs({
  options: {
    problem: { type: "string", short: "p" },
    persona: { type: "string" },
    list: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
  strict: false,
});

if (values.help) {
  console.log(`
Unstuck Coder - Lateral-thinking persona selector

Usage:
  bun unstuck.ts [options]

Options:
  -p, --problem <text>    Problem description (auto-selects persona)
  --persona <name>        Select specific persona
  --list                  List all personas
  -h, --help              Show this help

Personas:
  Debugger     - Errors, exceptions, crashes
  Researcher   - Unexpected behavior, confusion
  Simplifier   - Overwhelming complexity
  Architect    - Coupling, fragility
  Perfectionist - Code quality, technical debt
  Contrarian   - Questioning the approach
`);
  process.exit(0);
}

if (values.list) {
  console.log(formatPersonaHelp());
  process.exit(0);
}

if (values.persona) {
  const persona = PERSONAS.find(p => p.name.toLowerCase() === (values.persona as string).toLowerCase());
  if (persona) {
    console.log(`\n${persona.name} Persona:\n`);
    console.log(persona.prompt);
  } else {
    console.error(`Unknown persona: ${values.persona}`);
    console.log("\nAvailable personas: " + PERSONAS.map(p => p.name).join(", "));
  }
  process.exit(0);
}

if (values.problem) {
  const persona = selectPersona(values.problem as string);
  
  if (persona) {
    console.log(`\n🔍 Detected: ${persona.name} situation`);
    console.log(`\n${persona.prompt}\n`);
    console.log("---");
    console.log(`Your problem: "${values.problem}"`);
    console.log("\nApply this persona's approach to break through.\n");
  } else {
    console.log("\nNo specific persona detected. General advice:\n");
    console.log("1. Describe the specific symptom (error message, unexpected output)");
    console.log("2. Identify when it started happening");
    console.log("3. Isolate the smallest reproducible case");
    console.log("4. Try one fix at a time and observe results\n");
  }
  process.exit(0);
}

console.log("\nProvide --problem <text> or --persona <name> or --list");
process.exit(1);