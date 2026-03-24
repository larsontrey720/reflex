---
name: reflex-eval
description: Three-stage code verification pipeline. Mechanical → Semantic → Consensus. Verifies code against seed spec before merge.
---

# Reflex Eval

Trust but verify.

Three-stage verification ensures changes actually deliver what was promised.

## Usage

```bash
# Evaluate against seed spec
bun reflex eval --artifact ./my-project --seed ./seeds/seed-abc.yaml
```

## Three Stages

| Stage | Cost | What It Checks |
|-------|------|----------------|
| 1. Mechanical | Free | Compile, lint, test, coverage |
| 2. Semantic | Low | Acceptance criteria compliance, goal alignment |
| 3. Consensus | Medium | 3-perspective deliberation (if drift detected) |

## Flow

```
Stage 1: Mechanical
├── TypeScript compiles?
├── Tests pass?
├── Lint clean?
└── Coverage threshold met?
    ↓ PASS
Stage 2: Semantic
├── Each AC in seed spec verified?
├── Goal alignment score
└── Drift detection (scope creep)
    ↓ PASS or DRIFT > 0.3
Stage 3: Consensus (conditional)
├── Proposer: "This works because..."
├── Devil's Advocate: "But what about..."
└── Synthesizer: Final verdict
```

## Output

```
╔════════════════════════════════════════════════════════╗
║  REFLEX EVALUATION REPORT                               ║
╠════════════════════════════════════════════════════════╣
║  Stage 1 - Mechanical: ✅ PASS                         ║
║    Compilation: ✅                                      ║
║    Tests: ✅ 47 passed                                  ║
║    Lint: ✅ 0 errors                                    ║
║    Coverage: ✅ 82%                                     ║
╠════════════════════════════════════════════════════════╣
║  Stage 2 - Semantic: ⚠️ NEEDS WORK                     ║
║    AC1: ✅ JSON format with timestamp                   ║
║    AC2: ✅ Payment endpoints emit logs                  ║
║    AC3: ❌ PII masking not implemented                  ║
║    Drift Score: 0.12 (acceptable)                       ║
╠════════════════════════════════════════════════════════╣
║  Stage 3 - Consensus: TRIGGERED                         ║
║    Proposer: "Core works, PII is minor fix"            ║
║    Devil's Advocate: "Unmasked PII = compliance risk"  ║
║    Synthesizer: NEEDS WORK                              ║
╚════════════════════════════════════════════════════════╝
```
