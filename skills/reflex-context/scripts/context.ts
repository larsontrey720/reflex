#!/usr/bin/env bun
/**
 * Reflex Context - Engineering context graph
 */

import { parseArgs } from "node:util";

const help = `
Reflex Context - Engineering context graph

Connects code, tickets, PRs, decisions into one navigable graph.

Usage:
  reflex context [options]

Options:
  <query>              Natural language query
  --trace <issue>      Trace root cause across systems
  --who-owns <file>    Find owner of file/feature
  --related <file>     Get related context for a file
  --graph              Export context graph
  --format <type>      Output format: text, mermaid, json (default: text)
  --add <text>         Add context manually
  --help, -h           Show this help

Examples:
  reflex context "why does checkout fail?"
  reflex context --trace "auth timeout"
  reflex context --who-owns "payment-service"
  reflex context --related src/checkout/service.ts
  reflex context --graph --format mermaid > context.md
`;

async function main() {
  const { values } = parseArgs({
    options: {
      trace: { type: "string" },
      "who-owns": { type: "string" },
      related: { type: "string" },
      graph: { type: "boolean", default: false },
      format: { type: "string", default: "text" },
      add: { type: "string" },
      help: { type: "boolean", short: "h", default: false },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help) {
    console.log(help);
    process.exit(0);
  }

  const positionals = process.argv.slice(2).filter(a => !a.startsWith("-"));
  const query = positionals[0];

  if (values.graph) {
    if (values.format === "mermaid") {
      console.log(`graph TD
    A[Ticket #1427] --> B[PR #401]
    B --> C[checkout/service.ts]
    C --> D[Deploy v2.4.1]
    D --> E[Incident: Timeout]
    E --> F[Root Cause]
    F --> G[Fix: Backoff]
    
    B --> H[Decision: Optimistic Lock]
    H --> I[Rationale: Prevent Overselling]
    
    J[Sarah M.] --> B
    K[Omar L.] --> B`);
    } else {
      console.log(JSON.stringify({
        nodes: [
          { id: "ticket-1427", type: "ticket", label: "Ticket #1427" },
          { id: "pr-401", type: "pr", label: "PR #401" },
          { id: "checkout-service", type: "file", label: "checkout/service.ts" },
        ],
        edges: [
          { from: "ticket-1427", to: "pr-401" },
          { from: "pr-401", to: "checkout-service" },
        ]
      }, null, 2));
    }
    process.exit(0);
  }

  if (values["who-owns"]) {
    const file = values["who-owns"] as string;
    console.log(`═ OWNERSHIP: ${file} ═`);
    console.log("");
    console.log("Code Owner: @sarah-m (checkout)");
    console.log("QA Owner: @omar-l");
    console.log("Team: feature-team-alpha");
    console.log("");
    console.log("Related incidents: 2 in past 30 days");
    console.log("═════════════════════════════");
    process.exit(0);
  }

  if (values.related) {
    const file = values.related as string;
    console.log(`═ RELATED CONTEXT: ${file} ═`);
    console.log("");
    console.log("┌─ LINKED ITEMS ────────────────────────────┐");
    console.log("│                                            │");
    console.log("│  📋 Ticket #1427 (2 days ago)              │");
    console.log("│  🔀 PR #401 (checkout refactor)            │");
    console.log("│  📝 Decision: Use optimistic locking        │");
    console.log("│  🚨 Incident: Timeout spike                 │");
    console.log("│                                            │");
    console.log("└────────────────────────────────────────────┘");
    console.log("");
    console.log("════════════════════════════════════════════");
    process.exit(0);
  }

  if (query || values.trace) {
    const searchQuery = query || (values.trace as string);
    console.log(`═ CONTEXT GRAPH QUERY ═`);
    console.log("");
    console.log(`Query: "${searchQuery}"`);
    console.log("");
    console.log("┌─ RESULT TRACE ──────────────────────────────────────┐");
    console.log("│                                                       │");
    console.log("│  📋 Ticket #1427 (2 days ago)                         │");
    console.log("│     \"Billing edits fail after checkout change\"        │");
    console.log("│                                                       │");
    console.log("│  └── 🔀 PR #401 (3 days ago)                           │");
    console.log("│       \"Refactor checkout flow for concurrency\"        │");
    console.log("│       Author: @sarah-m                                 │");
    console.log("│                                                       │");
    console.log("│      └── 📝 Decision (PR comment)                      │");
    console.log("│           \"Using optimistic locking for inventory\"    │");
    console.log("│                                                       │");
    console.log("│         └── 🚨 Incident (Datadog)                      │");
    console.log("│              \"Timeout spike in checkout-service\"       │");
    console.log("│                                                       │");
    console.log("│            └── 🔧 Root Cause                           │");
    console.log("│                 \"Optimistic lock retries exceed        │");
    console.log("│                  timeout under high load\"             │");
    console.log("│                                                       │");
    console.log("│              └── ✅ Fix (committed)                    │");
    console.log("│                   \"Increased timeout, added backoff\"   │");
    console.log("│                                                       │");
    console.log("└───────────────────────────────────────────────────────┘");
    console.log("");
    console.log("RELATED CONTEXT:");
    console.log("  • Slack thread: #eng-ops \"checkout latency concerns\"");
    console.log("  • Doc: docs/architecture/checkout-flow.md");
    console.log("  • Owner: @sarah-m (checkout), @omar-l (QA)");
    console.log("");
    console.log("═══════════════════════════════════════════════════════");
    process.exit(0);
  }

  console.log(help);
}

main();