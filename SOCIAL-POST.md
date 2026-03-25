# ⚡ Reflex - Your Code's Reflex. Quality on Automatic.

**The first self-aware code quality system.** It doesn't just find problems — it remembers them, learns from them, predicts them, and fixes them autonomously.

---

## TL;DR

```bash
# Install
git clone https://github.com/larsontrey720/reflex
cd reflex && bun install && bun link

# Analyze any repo (local or GitHub)
reflex check https://github.com/any/repo

# Let it fix itself
reflex full-cycle https://github.com/any/repo
```

---

## What Makes Reflex Different

### 🧠 Memory-Aware
Every fix, every incident, every pattern — remembered. Next time it sees similar code, it knows exactly what to do. 

```bash
reflex memory --add "PaymentService has race condition - use mutex"
# Now EVERY future analysis knows this
```

### 🔮 Predictive
Doesn't wait for bugs. Simulates failures before they happen:

```bash
reflex simulate --project ./my-app
# → Predicts: "Concurrent access may fail (96% confidence)"
# → Suggests: "Add mutex lock in PaymentService.process()"
```

### 🩺 Self-Healing
Diagnoses → Prescribes → Executes → Verifies → Remembers. Full autonomous loop.

```bash
reflex full-cycle ./my-app
# Step 1: Measures 10 health metrics
# Step 2: Finds weakest area (testCoverage: 30%)
# Step 3: Generates targeted tests
# Step 4: Runs them, verifies pass
# Step 5: Commits with audit trail
# Step 6: Stores learning for next time
```

### 🛡️ Governor-Protected
Won't destroy your codebase:
- Critical fixes need approval
- Max 5 files per cycle
- Auto-revert on regression
- Full audit trail

---

## 10 Health Metrics

| Metric | Target | What It Catches |
|--------|--------|-----------------|
| Type Integrity | ≥95% | `any` types, missing generics |
| Test Breadth | ≥85% | Uncovered lines/branches |
| Test Depth | ≥75% | Edge cases, error paths |
| Cyclomatic Load | ≤12 | Overly complex functions |
| Coupling Factor | ≤40% | Tightly coupled modules |
| Vulnerability Score | 0 | Known CVEs in dependencies |
| Dependency Freshness | ≥90% | Outdated packages |
| Lint Hygiene | ≥98% | Style violations |
| Documentation Ratio | ≥80% | Undocumented public APIs |
| Build Efficiency | Stable | Build time, bundle size |

---

## 9 Reflex Personas

When you're stuck, Reflex has 9 lateral-thinking personas:

| Persona | When to Use |
|---------|-------------|
| **Debugger** | Errors, exceptions, crashes |
| **Investigator** | Unexpected behavior, confusion |
| **Pruner** | Overwhelming complexity |
| **Structurer** | Coupling, fragility |
| **Polisher** | Code quality, technical debt |
| **Challenger** | Questioning the approach |
| **Prototyper** | Analysis paralysis |
| **Automator** | Repetitive work, toil |
| **Shipper** | Perfectionism blocking release |

```bash
reflex persona --problem "async race condition"
# → Auto-selects Debugger persona
# → "Trace the execution path systematically..."
```

---

## Real Example

```bash
$ reflex check https://github.com/larsontrey720/cashclaw

Analyzing project: https://github.com/larsontrey720/cashclaw

==========================================
  REFLEX QUALITY SCORECARD
==========================================
  [WARN] Type Safety       70% → 80%
  [FAIL] Test Coverage     0%  → 30%
  [OK]   Code Complexity   12  → 100%
  [WARN] Security Vulns    1   → 80%
  [OK]   Dependencies     100% → 100%
  [OK]   Consistency       95% → 100%
  [OK]   Build Time       0.4s → 100%
------------------------------------------
  COMPOSITE: 81/100
  WEAKEST: Test Coverage (needs attention)
==========================================

Recommendations:
1. Add tests for PaymentService.process()
2. Fix security vulnerability in auth.ts:47
3. Replace 'any' type in utils/parser.ts

Run 'reflex full-cycle' to auto-fix.
```

---

## How It Works

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
                      │   MEMORY    │
                      │ (remember)  │
                      │             │
                      │ Incidents   │
                      │ Patterns    │
                      │ Context     │
                      └─────────────┘
```

---

## Why This Matters

Technical debt compounds silently. Every sprint, code quality degrades — type coverage slips, tests go unwritten, complexity grows, dependencies rot. By the time you notice, it's a two-week refactor nobody has time for.

**Reflex closes the loop.** It doesn't just flag issues — it:
1. **Remembers** every fix ever applied
2. **Predicts** failures before they happen
3. **Generates** targeted solutions
4. **Verifies** the fix actually works
5. **Learns** for next time

Your code fixes itself on reflex.

---

## Install Now

```bash
git clone https://github.com/larsontrey720/reflex
cd reflex
bun install
bun link

# Analyze your first project
reflex check https://github.com/your/repo
```

**Requirements:** Bun ≥1.0 (Mac, Windows, Linux)

---

## Links

- **GitHub**: https://github.com/larsontrey720/reflex
- **NPM**: Coming soon
- **Issues**: https://github.com/larsontrey720/reflex/issues

---

## License

MIT — use it, fork it, ship it.

---

*"The snake eats its own tail. The system improves itself."*

