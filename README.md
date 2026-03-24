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

---

## GitHub App — PR Quality Checks

Reflex automatically analyzes your pull requests and posts quality scorecards as PR comments. No CLI needed — just connect your repo.

### Quick Setup (Public Instance)

Use the hosted Reflex instance on any public or private repo:

**Step 1: Create a GitHub Personal Access Token**

1. Go to https://github.com/settings/personal-access-tokens/new
2. Configure:
   - **Name**: `Reflex Bot`
   - **Expiration**: 90 days (or custom)
   - **Repository access**: 
     - Option A: "Only select repositories" → pick your repos
     - Option B: "All repositories" (if you want it everywhere)
   - **Permissions**:
     - `Contents`: Read
     - `Pull requests`: Read and Write
     - `Metadata`: Read
3. Click "Generate token"
4. Copy the token (you won't see it again)

**Step 2: Add Webhook to Your Repo**

1. Go to your repository → Settings → Webhooks → Add webhook
2. Configure:
   - **Payload URL**: `https://georgeo.zo.space/api/reflex-webhook`
   - **Content type**: `application/json`
   - **Secret**: `reflex-public-2026` (or generate your own)
   - **Which events**: Select "Let me select individual events" → check only "Pull requests"
   - **Active**: Yes
3. Click "Add webhook"

**Step 3: Set Your Token (If Using Custom Secret)**

If you used a custom webhook secret instead of `reflex-public-2026`, email the token and secret to set up access:
- **Email**: georgeo@zo.computer
- **Subject**: Reflex Bot Access Request
- **Body**: Your PAT token and webhook secret

**Step 4: Test It**

1. Open a pull request in your repo
2. Wait ~10 seconds
3. See the Reflex quality scorecard appear as a comment

---

### What You'll See

When you open or update a PR, Reflex posts a comment like this:

```markdown
## ⚡ Reflex Quality Check

**Score: 78/100** (+6 from base)

| Metric | Value | Status | Change |
|--------|-------|--------|--------|
| Type Integrity | 89% | ✓ | +3% |
| Test Breadth | 72% | ⚠ | -2% |
| Test Depth | 45% | ⚠ | +5% |
| Cyclomatic Load | 8 avg | ✓ | -1 |
| Coupling Factor | 32% | ✓ | — |
| Vulnerability Score | 0 | ✓ | — |
| Dependency Freshness | 94% | ✓ | +2% |
| Lint Hygiene | 97% | ✓ | +1% |
| Documentation Ratio | 67% | ⚠ | — |
| Build Efficiency | 1.2s | ✓ | -0.3s |

### Recommendations

1. **Test Breadth** dropped 2%. Consider adding tests for:
   - `src/utils/parser.ts` (line 42-67 uncovered)
   - `src/api/handlers.ts` (error path untested)

2. **Documentation Ratio** at 67%. Add JSDoc to:
   - `processPayment()` — public API, no docs
   - `validateInput()` — complex logic, needs explanation

---
_Analyzed by [Reflex](https://github.com/larsontrey720/reflex) • [Setup on your repo](https://github.com/larsontrey720/reflex#github-app--pr-quality-checks)_
```

---

### Configuration Options

You can customize Reflex behavior by adding a `.reflex.yml` file to your repo root:

```yaml
# .reflex.yml

# Minimum score to pass PR (blocks merge if below)
minimum_score: 70

# Metrics to include/exclude
metrics:
  include:
    - typeIntegrity
    - testBreadth
    - vulnerabilityScore
  exclude:
    - documentationRatio  # Skip docs for this project

# Auto-comment settings
comment:
  on_opened: true      # Comment on new PRs
  on_sync: true        # Comment when new commits pushed
  on_reopened: true    # Comment when PR reopened

# Fail check if score drops
fail_on_regression: true
```

---

### Self-Hosting Reflex

Want to run your own instance? Here's how:

**Option 1: Deploy to Zo Computer**

1. Fork this repo
2. Create a Zo Computer account at https://zocomputer.com
3. Create a new site from your fork
4. Add these secrets in Settings → Advanced:
   ```
   REFLEX_GITHUB_WEBHOOK_SECRET=your-secret
   REFLEX_GITHUB_APP_TOKEN=your-pat
   ```
5. Update your webhook URL to your Zo Space

**Option 2: Deploy to Your Server**

```bash
# Clone
git clone https://github.com/larsontrey720/reflex.git
cd reflex

# Install dependencies
bun install

# Set environment
export REFLEX_GITHUB_WEBHOOK_SECRET=your-secret
export REFLEX_GITHUB_APP_TOKEN=your-pat

# Run webhook server
bun serve --port 3000
```

Then point your webhook to `https://your-server.com/webhook`.

---

### Troubleshooting

**No comment appears on PR:**

1. Check webhook delivery in GitHub: Repo → Settings → Webhooks → click webhook → "Recent Deliverations"
2. Look for response code — should be 200
3. If 401/403: Token lacks permissions
4. If 500: Webhook server error — check logs

**Comment shows "Error analyzing repository":**

- Repository may be empty or have no TypeScript/JavaScript files
- Check that the repo has a `package.json` or `tsconfig.json`

**Score seems wrong:**

- Reflex analyzes TypeScript/JavaScript primarily
- For other languages, only general metrics apply (lint, dependencies)

**Want to disable for specific PRs:**

Add `[skip reflex]` or `[no reflex]` to your PR title or description.

---

### Rate Limits

The public instance has these limits:
- **Public repos**: Unlimited
- **Private repos**: 100 PRs/day per user

For higher limits, self-host your own instance.

---

### Support

- **Issues**: https://github.com/larsontrey720/reflex/issues
- **Email**: georgeo@zo.computer
- **Zo Discord**: https://discord.gg/zocomputer