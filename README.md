# Reflex

**Your code's reflex. Quality on automatic.**

Reflex is a self-enhancing code quality system. It measures 10 code health metrics, identifies the weakest area, generates a remediation plan from 17 playbooks, executes fixes autonomously, and verifies the results.

Your code fixes itself on reflex.

![Reflex Pipeline](reflex-diagram.png)

---

## The Problem

Technical debt compounds silently. Every sprint, code quality degrades — type coverage slips, tests go unwritten, complexity grows, dependencies rot. By the time you notice, it's a two-week refactor nobody has time for.

Code reviews catch symptoms, not root causes. Linters flag violations but can't explain *why*. CI fails but doesn't suggest fixes.

**Reflex closes the loop.** It diagnoses, prescribes, and treats — automatically.

---

## Quick Start

### Install

```bash
# Clone and link
git clone https://github.com/larsontrey720/reflex.git
cd reflex
bun link

# Or one-liner install (Zo Computer)
curl -fsSL https://raw.githubusercontent.com/larsontrey720/reflex/main/install.sh | bash
```

### Run

```bash
# Diagnose your codebase
reflex introspect --project ./my-app

# Full self-enhancement cycle
reflex full-cycle --project ./my-app
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
reflex introspect [options]     # Diagnose code health
reflex prescribe [options]      # Generate fix prescription
reflex evolve [options]         # Execute fixes
reflex full-cycle [options]     # Complete loop (diagnose → fix → verify)
reflex interview [options]      # Socratic requirements gathering
reflex eval [options]           # Three-stage verification
reflex unstuck [options]        # Lateral-thinking debug personas
```

### Introspect Options

```bash
reflex introspect --project ./my-app     # Analyze project
reflex introspect --project . --json     # JSON output
reflex introspect --metric typeIntegrity # Single metric focus
reflex introspect --verbose              # Detailed breakdown
```

### Full Cycle Options

```bash
reflex full-cycle --project ./my-app     # Run once
reflex full-cycle --project . --max 3    # Max 3 improvement cycles
reflex full-cycle --dry-run              # Generate fixes, don't apply
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

## Unstuck Personas (9 Total)

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

- **Bun** v1.0+ (runtime)
- **TypeScript** (for type analysis)
- **Git** (for snapshots/rollback)
- **LLM API** (OpenAI, Anthropic, Ollama, or Zo native)

---

## Credits

Built for [Zo Computer](https://zocomputer.com).

---

## License

MIT
