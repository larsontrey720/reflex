---
name: reflex-evolve
description: Executes prescriptions from reflex-prescribe. Runs fixes via reflex-loop or script mode. Captures pre/post scorecards, reverts on regression. Supports BYO-Model or Zo native LLM.
---

# Reflex Evolve

Your code's healing response.

Executes the prescription and measures the result. If the fix makes things worse, it automatically reverts. If the fix succeeds, it logs the improvement and moves on.

## Usage

```bash
# Execute a prescription
bun reflex evolve --prescription Seeds/reflex/rx-*.json

# With LLM provider (BYO-Model)
export REFLEX_LLM_PROVIDER=openai
export REFLEX_LLM_API_KEY=sk-...
bun reflex evolve --prescription rx-test-coverage.json

# Using Zo native (auto-detected)
bun reflex evolve --prescription rx-test-coverage.json
```

## LLM Integration

Reflex supports two paths:

| Path | How It Works |
|------|--------------|
| **BYO-Model** | Set `REFLEX_LLM_PROVIDER` + `REFLEX_LLM_API_KEY` |
| **Zo Native** | Auto-detects `ZO_CLIENT_IDENTITY_TOKEN` and uses current model |

Supported providers: `openai`, `anthropic`, `ollama`, `zo`

## Safety Features

- **Pre-execution backup** — Creates `.reflex-backup/` before changes
- **Regression detection** — Reverts if metric drops >2%
- **Blast radius limit** — Max 10 files per cycle
- **Audit trail** — Every change logged with diff

## Output

```
╔════════════════════════════════════════════════════════╗
║  REFLEX EVOLUTION REPORT                                ║
╠════════════════════════════════════════════════════════╣
║  Prescription: rx-test-coverage-expansion               ║
║  Mode: autofix-loop                                     ║
║  LLM: zo (byok:8d5a353d-...)                           ║
╠════════════════════════════════════════════════════════╣
║  BEFORE        →  AFTER                                 ║
║  testCoverage: 45% → 78% (+33pts)                      ║
║  typeSafety:   92% → 92% (no change)                   ║
║  complexity:   12  → 11  (-1)                          ║
╠════════════════════════════════════════════════════════╣
║  RESULT: ✅ IMPROVED                                    ║
║  Files changed: 8                                       ║
║  Tests added: 23                                        ║
╚════════════════════════════════════════════════════════╝
```
