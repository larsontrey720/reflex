# ⚡ Reflex

**Your code's reflex. Quality on automatic.**

Reflex is a self-enhancing code quality system. It measures 7 code health metrics, identifies the weakest area, generates a remediation plan, executes fixes autonomously, and verifies the results.

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

1. **Introspect** — Measures 7 health metrics, outputs composite score (0-100)
2. **Prescribe** — Maps weakest metric to a playbook, generates fix specification
3. **Evolve** — Executes fixes via LLM, captures before/after scores
4. **Verify** — Reverts regressions, logs improvements, loops

### 7 Health Metrics

| Metric | What It Measures | Target |
|--------|------------------|--------|
| Type Safety | TypeScript strictness, `any` usage | ≥ 90% |
| Test Coverage | Line/branch coverage | ≥ 80% |
| Code Complexity | Cyclomatic complexity | ≤ 15 per function |
| Security Vulns | Known CVEs in dependencies | 0 critical/high |
| Dependency Health | Outdated, deprecated packages | ≥ 85% fresh |
| Code Consistency | Lint violations, formatting | ≥ 95% clean |
| Build Performance | Build time, bundle size | Stable trend |

### 14 Playbooks

When a metric is weak, Reflex selects from 14 remediation playbooks:

| ID | Playbook | Metric | Auto-Approve |
|----|----------|--------|--------------|
| A | Type Strictness Fix | typeSafety | ✅ |
| B | Any Elimination | typeSafety | ❌ |
| C | Coverage Expansion | testCoverage | ✅ |
| D | Critical Path Tests | testCoverage | ❌ |
| E | Complexity Reduction | codeComplexity | ✅ |
| F | God Object Refactor | codeComplexity | ❌ |
| G | Vulnerability Patch | securityVulns | ✅ |
| H | Dependency Update | dependencyHealth | ✅ |
| I | Deprecated Replacement | dependencyHealth | ❌ |
| J | Lint Fix | codeConsistency | ✅ |
| K | Formatter Config | codeConsistency | ✅ |
| L | Bundle Optimization | buildPerformance | ✅ |
| M | Tree Shaking Fix | buildPerformance | ❌ |
| N | Performance Profile | buildPerformance | ❌ |

❌ = Requires human approval (governor blocks autonomous execution)

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
export REFLEX_LLM_MODEL=gpt-4o

# Anthropic
export REFLEX_LLM_PROVIDER=anthropic
export REFLEX_LLM_API_KEY=sk-ant-xxx
export REFLEX_LLM_MODEL=claude-3-5-sonnet-20241022

# Ollama (local)
export REFLEX_LLM_PROVIDER=ollama
export REFLEX_LLM_MODEL=qwen2.5:7b

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
reflex introspect --metric typeSafety    # Single metric focus
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
| `reflex-unstuck` | Debug personas |

Each skill can be used independently:

```bash
bun skills/reflex-introspect/scripts/introspect.ts --project ./app
bun skills/reflex-unstuck/scripts/unstuck.ts --problem "async race condition"
```

---

## Unstuck Personas

When you're stuck on a problem, Reflex has 6 lateral-thinking personas:

| Persona | When to Use |
|---------|-------------|
| **Debugger** | Errors, exceptions, crashes |
| **Researcher** | Unexpected behavior, confusion |
| **Simplifier** | Overwhelming complexity |
| **Architect** | Coupling, fragility |
| **Perfectionist** | Code quality, technical debt |
| **Contrarian** | Questioning the approach |

```bash
reflex unstuck --problem "I keep hitting null pointer exceptions"
# → Auto-selects Debugger persona

reflex unstuck --persona architect
# → Get Architect's perspective
```

---

## Example Output

```
$ reflex introspect --project ./my-app

Analyzing project: /home/user/my-app

╔════════════════════════════════════════════════════════╗
║  REFLEX INTROSPECTION SCORECARD                        ║
╠════════════════════════════════════════════════════════╣
║  ✅ Type Safety          94% → score:100%               ║
║  ⚠️  Test Coverage        45% → score:56%               ║
║  ✅ Code Complexity       8 → score:100%                ║
║  ✅ Security Vulns        0 → score:100%                ║
║  ⚠️  Dependency Health   72% → score:85%               ║
║  ✅ Code Consistency     98% → score:100%               ║
║  ✅ Build Performance   2.1s → score:100%              ║
╠════════════════════════════════════════════════════════╣
║  COMPOSITE HEALTH: 91/100                              ║
║  WEAKEST: Test Coverage (needs attention)              ║
╚════════════════════════════════════════════════════════╝

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
  │ 7 metrics   │     │ 14 playbooks│     │ LLM fixes   │
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

Inspired by [Q00/ouroboros](https://github.com/Q00/ouroboros) and [marlandoj/zouroboros-seedkit](https://github.com/marlandoj/zouroboros-seedkit).

Built for [Zo Computer](https://zocomputer.com).

---

## License

MIT

