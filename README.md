# Reflex

[![npm version](https://img.shields.io/npm/v/reflex-code.svg)](https://www.npmjs.com/package/reflex-code)
[![npm downloads](https://img.shields.io/npm/dm/reflex-code.svg)](https://www.npmjs.com/package/reflex-code)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Your code's reflex. Quality on automatic.**

Reflex is a self-enhancing code quality system. It measures 10 code health metrics, identifies the weakest area, generates a remediation plan from 17 playbooks, executes fixes autonomously, and verifies the results.

Your code fixes itself on reflex.

![Reflex Logo](reflex-logo.svg)

![Reflex Pipeline](reflex-diagram.png)

---


## Quick Start

### Install

```bash
npm install -g reflex-code
```

Or with Bun:

```bash
bun install -g reflex-code
```

### Run

```bash
# Diagnose your codebase
reflex introspect --project ./my-app

# Diagnose a GitHub repo
reflex introspect --project https://github.com/owner/repo

# Full self-enhancement cycle
reflex full-cycle --project ./my-app
```

---

## The Problem

Technical debt compounds silently. Every sprint, code quality degrades — type coverage slips, tests go unwritten, complexity grows, dependencies rot. By the time you notice, it's a two-week refactor nobody has time for.

Code reviews catch symptoms, not root causes. Linters flag violations but can't explain *why*. CI fails but doesn't suggest fixes.

**Reflex closes the loop.** It diagnoses, prescribes, and treats — automatically.

---

## Dev Tools (from CodeRabbit & Others)

### Plan Generator

Turn vague ideas into clear phased plans:

```bash
reflex plan "add user authentication"
```

**Output:**
```
═ DEVELOPMENT PLAN: USER AUTHENTICATION ═

┌─ PHASE 1: Research & Design ─────────────
│  Tasks:
│  □ Analyze requirements
│  □ Design auth flow
│  □ Choose auth provider
│  Risks:
│  ⚠ Unclear OAuth scope requirements
└──────────────────────────────────────────────

┌─ PHASE 2: Implementation ───────────────────
│  Tasks:
│  □ Set up auth middleware
│  □ Implement login/register endpoints
│  □ Add session management
│  Dependencies:
│  → Design approved
└──────────────────────────────────────────────
```

### Pre-commit Hook

Quality gate before every commit:

```bash
reflex pre-commit --install   # Install git hook
reflex pre-commit --fix       # Auto-fix issues
```

### Analytics Tracking

Track quality over time:

```bash
reflex analytics --record     # Save current score
reflex analytics --weekly     # Weekly trends
```

### Risk Scoring

Calculate PR risk level:

```bash
reflex risk --files 15 --lines 300 --database
```

### Knowledge Graph

Ask questions about your codebase:

```bash
reflex graph --question "how does auth work?"
reflex graph --format mermaid > graph.md
```

## Predictive Features



### Simulate — Pre-Merge Prediction

Predict what breaks before you ship:

```bash
reflex simulate                    # Simulate current uncommitted changes
reflex simulate --pr 42            # Simulate a PR before merge
reflex simulate --json            # JSON output for CI gates
```

**Output:**
```
═ REFLEX SIMULATION RESULTS ═

Analyzing: 3 files changed, +127/-45 lines

┌─ SCENARIO RUNS ─────────────────────────────┐
│  ✓ Happy path: User login                   │
│  ⚠ Edge case: SSO re-auth after timeout     │
│    → BLOCKED: Session not cleared properly  │
│  ⚠ Edge case: Legacy config users           │
│    → RISK: Config schema mismatch           │
└──────────────────────────────────────────────┘

RISK SCORE: 34/100 (MEDIUM)

RECOMMENDATION: Fix HIGH issues before merge.
════════════════════════════════════════════════
```

### Memory — Production Learning Loop

Every resolved incident teaches the model:

```bash
reflex memory --status                      # View memory stats
reflex memory --search "checkout failed"    # Search past incidents
reflex memory --add "Fixed X by doing Y"    # Add resolved incident
reflex memory --insights --files auth.ts    # Get insights for changes
```

### Context — Engineering Context Graph

Connect code, tickets, PRs, decisions into one graph:

```bash
reflex context "why does checkout fail?"    # Natural language query
reflex context --trace "auth timeout"       # Trace root cause
reflex context --who-owns "payment-service" # Find owner
reflex context --graph --format mermaid     # Export graph
```


---

## Ways to Import Your Code

### 1. CLI — Local Project or GitHub URL (All Users)
```bash
# Local project
reflex introspect --project ./my-app
reflex check ./my-app

# GitHub repository (public or private)
reflex introspect --project https://github.com/username/my-app
reflex check https://github.com/username/repo

# GitHub shorthand
reflex introspect --project username/repo
```
Best for: Private repos, local development, CI/CD, remote analysis.

### 2. CLI — Natural Language (Beginners)
```bash
reflex ask "check my code in this folder"
reflex ask "fix the problems"
```
Just describe what you want. No flags, no commands to memorize.

### 3. GitHub Webhook (Teams)
Connect your repo → Automatic PR analysis.
See: [GitHub App Setup](#github-app--pr-quality-checks)


## CLI Reference

The CLI is fully available. Use it for:

- Local development
- CI/CD pipelines
- Private repositories
- Batch analysis
- Custom configurations

### Quick Commands

```bash
reflex check [path]              # Quick health check
reflex fix [path]                # Safe auto-fix
reflex ask "your question"       # Natural language Q&A
```

### Options

```bash
--project <path>     # Project directory (default: current)
--json               # JSON output for scripts
--verbose            # Detailed breakdown
--dry-run            # Preview fixes without applying
--max <n>            # Max cycles (for full-cycle)
```

---


## How It Works

### The Reflex Loop

```
INTROSPECT → PRESCRIBE → EVOLVE → VERIFY → (repeat)
```

1. **Introspect** — Measures 10 health metrics, outputs composite score (0-100)
2. **Prescribe** — Maps weakest metric to a playbook from 17 options, generates fix specification
3. **Evolve** — Executes fixes via LLM, captures before/after scores
4. **Verify** — Reverts regressions, logs improvements, loops

### 10 Health Metrics

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Type Integrity | TypeScript strictness, `any` elimination | ≥ 95% |
| Test Breadth | Line/branch coverage | ≥ 85% |
| Test Depth | Edge cases, error paths, integration | ≥ 75% |
| Cyclomatic Load | Complexity per function | ≤ 12 |
| Coupling Factor | Dependencies between modules | ≤ 40% cross-module |
| Vulnerability Score | Known CVEs in dependencies | 0 critical/high |
| Dependency Freshness | Outdated packages | ≥ 90% current |
| Lint Hygiene | Violations, formatting | ≥ 98% clean |
| Documentation Ratio | Commented public APIs | ≥ 80% |
| Build Efficiency | Build time, bundle size | Stable or improving |

### 17 Playbooks

When a metric is weak, Reflex selects from 17 remediation playbooks:

#### Type Integrity (3)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| A | Strict Mode Enablement | Yes |
| B | Any Type Elimination | No |
| C | Generic Constraint Addition | Yes |

#### Test Breadth (3)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| D | Coverage Gap Filling | Yes |
| E | Missing Branch Tests | Yes |
| F | Critical Path Coverage | No |

#### Test Depth (2)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| G | Edge Case Injection | Yes |
| H | Error Path Verification | No |

#### Cyclomatic Load (2)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| I | Function Decomposition | Yes |
| J | Guard Clause Extraction | Yes |

#### Coupling Factor (2)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| K | Interface Extraction | No |
| L | Module Boundary Enforcement | No |

#### Vulnerability Score (2)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| M | CVE Patch Application | Yes |
| N | Vulnerable Dependency Swap | No |

#### Dependency Freshness (1)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| O | Batch Update Execution | Yes |

#### Lint Hygiene (1)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| P | Auto-Fix Application | Yes |

#### Documentation Ratio (1)
| ID | Playbook | Auto-Approve |
|----|----------|--------------|
| Q | API Doc Generation | Yes |

**No = Requires human approval (governor blocks autonomous execution)**

### Governor Safety Rules

Reflex won't destroy your codebase:

1. **Approval gate** — Critical playbooks require human approval
2. **Blast radius limit** — Max 5 files modified per cycle
3. **Regression detection** — Any metric dropping >2% triggers automatic revert
4. **Git backup** — Pre-execution snapshot, easy rollback
5. **Audit trail** — Every cycle logged with full metadata

---

## LLM Integration

Reflex supports multiple LLM backends:

### Zo Computer (Native)

When running inside Zo Computer, Reflex auto-detects your model:

```bash
# Zero configuration needed
reflex introspect --project ./my-app
```

### BYO-Model

Configure your own LLM:

```bash
# OpenAI
export REFLEX_LLM_PROVIDER=openai
export REFLEX_LLM_API_KEY=sk-xxx
export REFLEX_LLM_MODEL=gpt-5.4

# Anthropic
export REFLEX_LLM_PROVIDER=anthropic
export REFLEX_LLM_API_KEY=sk-ant-xxx
export REFLEX_LLM_MODEL=claude-opus-4-6

# Ollama (local)
export REFLEX_LLM_PROVIDER=ollama
export REFLEX_LLM_MODEL=qwen3.5:27b

# Custom endpoint
export REFLEX_LLM_PROVIDER=custom
export REFLEX_LLM_ENDPOINT=https://my-api.com/v1
export REFLEX_LLM_API_KEY=xxx
```

---

## Commands

```bash
# === SETUP ===
reflex setup                      # Interactive setup wizard
reflex llm --config               # Show LLM configuration
reflex llm --test                 # Test LLM connection

# === ANALYSIS ===
reflex check [path]               # Quick health check
reflex introspect [options]       # Detailed analysis
reflex security [options]         # Vulnerability scan
reflex risk --pr 42               # Calculate PR risk

# === FIXES ===
reflex fix [path]                 # Safe auto-fix
reflex prescribe [options]        # Generate fix plan
reflex evolve [options]           # Execute fixes
reflex full-cycle [options]       # Complete self-healing loop

# === PLANNING ===
reflex plan "your idea"           # Generate development plan
reflex interview                  # Socratic requirements gathering
reflex graph --question "..."     # Ask about codebase

# === HELP ===
reflex unstuck --problem "..."    # Debug help with personas
reflex ask "your question"        # Natural language Q&A
reflex explain <metric>           # Plain English docs

# === DEV TOOLS ===
reflex eval --artifact <path> --seed <file>   # Three-stage verification
reflex pre-commit --install       # Install git hook
reflex pre-commit --fix           # Auto-fix on commit
reflex analytics --record         # Track quality over time
```

### Common Options

```bash
--project <path>     # Project directory (default: current)
--json               # JSON output for scripts
--verbose            # Detailed breakdown
--dry-run            # Preview fixes without applying
--max <n>            # Max cycles (for full-cycle)
--scorecard <file>   # Input scorecard (for prescribe)
--prescription <file> # Input prescription (for evolve)
```

### Examples

```bash
# Analyze a GitHub repo
reflex check https://github.com/owner/repo

# Analyze local project
reflex introspect --project ./my-app

# JSON output for CI/CD
reflex introspect --project . --json > scorecard.json

# Full autonomous healing
reflex full-cycle --project ./my-app --max 3

# Security scan
reflex security --project ./my-app --json

# Get unstuck on a bug
reflex unstuck --problem "I keep hitting null pointer exceptions"

# Ask about your code
reflex ask "Why is my build slow?"
```

---

## Deployment

### Docker

```bash
docker build -t reflex .
docker run -v /path/to/project:/project reflex introspect --project /project
```

### Docker Compose

```yaml
# docker-compose.yml included
docker-compose up  # Runs weekly scheduled introspection
```

### GitHub Actions

```yaml
# .github/workflows/reflex.yml included
# Runs every Monday at 6am UTC
# Opens an issue with scorecard and recommendations
```

### Bun CLI

```bash
bun link  # Install globally
reflex introspect --project ./my-app
```

---

## Skill Reference

Reflex is built as modular Zo Skills:

| Skill | Purpose |
|-------|---------|
| `reflex-introspect` | Diagnostic scorecard |
| `reflex-prescribe` | Prescription engine |
| `reflex-evolve` | Evolution executor |
| `reflex-loop` | Single-metric optimization |
| `reflex-interview` | Socratic requirements |
| `reflex-eval` | Three-stage verification |
| `reflex-unstuck` | 9 debug personas |

Each skill can be used independently:

```bash
bun skills/reflex-introspect/scripts/introspect.ts --project ./app
bun skills/reflex-unstuck/scripts/unstuck.ts --problem "async race condition"
```

---

## Reflex Personas (9 Total)

When you're stuck on a problem, Reflex has 9 lateral-thinking personas:

| Persona | When to Use |
|---------|-------------|
| **Debugger** | Errors, exceptions, crashes |
| **Investigator** | Unexpected behavior, confusion |
| **Pruner** | Overwhelming complexity |
| **Structurer** | Coupling, fragility |
| **Polisher** | Code quality, technical debt |
| **Challenger** | Questioning the approach |
| **Prototyper** | Analysis paralysis, design decisions |
| **Automator** | Repetitive work, toil |
| **Shipper** | Perfectionism, release blocking |

```bash
reflex unstuck --problem "I keep hitting null pointer exceptions"
# → Auto-selects Debugger persona

reflex unstuck --persona structurer
# → Get Structurer's perspective
```

---

## Example Output

```
$ reflex introspect --project ./my-app

Analyzing project: /home/user/my-app

==========================================================
  REFLEX INTROSPECTION SCORECARD
==========================================================
  [OK]   Type Integrity       96% → score: 100%
  [WARN] Test Breadth         52% → score: 61%
  [WARN] Test Depth           38% → score: 51%
  [OK]   Cyclomatic Load       6 → score: 100%
  [OK]   Coupling Factor      28% → score: 100%
  [OK]   Vulnerability Score   0 → score: 100%
  [OK]   Dependency Freshness 94% → score: 100%
  [OK]   Lint Hygiene         99% → score: 100%
  [WARN] Documentation Ratio  62% → score: 78%
  [OK]   Build Efficiency     1.8s → score: 100%
----------------------------------------------------------
  COMPOSITE HEALTH: 89/100
  WEAKEST: Test Depth (needs attention)
==========================================================

Recommendation: Run 'reflex prescribe' to generate improvement plan
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      DEVELOPER                               │
│   • Approves critical playbooks                             │
│   • Receives scorecard reports                              │
│   • Can override governor                                   │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │ INTROSPECT  │────▶│  PRESCRIBE  │────▶│   EVOLVE    │
  │ (diagnose)  │     │   (plan)    │     │  (execute)  │
  │             │     │             │     │             │
  │ 10 metrics  │     │ 17 playbooks│     │ LLM fixes   │
  │ Score 0-100 │     │ Governor    │     │ Pre/post    │
  └─────────────┘     └─────────────┘     └─────────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             ▼
                      ┌─────────────┐
                      │   VERIFY    │
                      │  (revert    │
                      │   on fail)  │
                      └─────────────┘
```

---

## Requirements

- **Bun** v1.0+ (runtime) — [Install](https://bun.sh) | Works on Windows, Mac, Linux
- **TypeScript** (for type analysis)
- **Git** (for snapshots/rollback)
- **LLM API** (OpenAI, Anthropic, Ollama, or Zo native)

---

## Credits

**Inspiration & Attribution**

Reflex was inspired by and borrows concepts from:

- **[Zouroboros](https://github.com/marlandoj/zouroboros-seedkit)** — Self-enhancement loop, introspect/prescribe/evolve architecture, adapted from [Q00/ouroboros](https://github.com/Q00/ouroboros)
- **[BugBunny.ai](https://bugbunny.ai)** — Autonomous security testing, simulation before merge, production incident learning
- **[CodeRabbit](https://coderabbit.ai)** — AI code review patterns, PR analysis, risk scoring
- **[karpathy/autoresearch](https://github.com/karpathy)** — Single-metric optimization loop concept
- **[Zo Computer](https://zocomputer.com)** — Native runtime environment, Zo Skills architecture

Built with ❤️ for the Zo community.

---

## License

MIT

---

