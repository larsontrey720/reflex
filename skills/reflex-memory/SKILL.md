---
name: reflex-memory
description: Production memory and learning loop. Remembers patterns from past fixes, incidents, and decisions. Compounds knowledge over time.
version: "1.0.0"
---

# Reflex Memory

Production memory that compounds. Every incident diagnosed teaches the model something new.

## What It Does

1. **Remembers patterns** — Stores what broke, why, and how it was fixed
2. **Compounds knowledge** — Each resolved incident improves future predictions
3. **Connects context** — Links code changes to past incidents
4. **Surfaces insights** — Warns about high-risk patterns before merge

## Usage

```bash
# View memory status
reflex memory --status

# Search past incidents
reflex memory --search "checkout failed"

# Add a resolved incident
reflex memory --add "Fixed auth timeout by adding retry logic"

# Get insights for current changes
reflex memory --insights

# Export memory for backup
reflex memory --export ./reflex-memory-backup.json

# Import memory
reflex memory --import ./reflex-memory-backup.json
```

## Memory Structure

```json
{
  "incidents": [
    {
      "id": "inc-001",
      "timestamp": "2026-03-24T10:30:00Z",
      "title": "Checkout failed for legacy users",
      "rootCause": "Config schema mismatch in payment-service",
      "fix": "Added migration step in deploy script",
      "files": ["src/checkout/service.ts", "config/schema.json"],
      "patterns": ["config-migration", "legacy-compat"],
      "severity": "high",
      "resolvedBy": "auth-fix-branch"
    }
  ],
  "patterns": [
    {
      "name": "config-migration",
      "riskScore": 0.72,
      "occurrences": 3,
      "commonFix": "Add migration step before config load"
    }
  ],
  "decisions": [
    {
      "id": "dec-001",
      "timestamp": "2026-03-20T14:00:00Z",
      "context": "SSO implementation",
      "decision": "Used OAuth2 with PKCE flow",
      "rationale": "Mobile-friendly, no client secrets",
      "alternatives": ["SAML", "OIDC implicit flow"]
    }
  ]
}
```

## Learning Loop

```
┌─────────────────────────────────────────────────────────────┐
│                      INCIDENT ARRIVES                        │
│   Ticket, alert, or PR question starts the workflow         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   CONTEXT ASSEMBLED                          │
│   Signals, code, deploys, owners pulled into same thread    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   RESOLVED & STORED                          │
│   Patterns, decisions, validation saved for next workflow  │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                   NEXT INCIDENT FASTER                       │
│   Model already knows: "This pattern caused X before"       │
└─────────────────────────────────────────────────────────────┘
```

## Insights Output

```
═ REFLEX MEMORY INSIGHTS ═

Analyzing current changes against production memory...

┌─ MATCHED PATTERNS ──────────────────────────────────┐
│                                                       │
│  ⚠ config-migration (72% risk)                       │
│    → Occurred 3 times in past 6 months               │
│    → Common fix: Add migration step                  │
│    → Last incident: 2026-03-24 (checkout timeout)    │
│                                                       │
│  ⚠ async-timeout (58% risk)                         │
│    → Occurred 2 times in past 3 months              │
│    → Common fix: Add retry with exponential backoff │
│    → Last incident: 2026-03-10 (payment webhook)    │
│                                                       │
└───────────────────────────────────────────────────────┘

RECOMMENDATIONS:
  1. Add config migration step before deploy
  2. Wrap async calls in retry logic

CONFIDENCE: Based on 15 resolved incidents in memory
═══════════════════════════════════════════════════════
```

## Configuration

```yaml
# .reflex.yml
memory:
  # Where to store memory
  storage: .reflex/memory.json
  
  # How long to keep incidents
  retentionDays: 365
  
  # Minimum occurrences to become a pattern
  patternThreshold: 2
  
  # Auto-learn from resolved incidents
  autoLearn: true
```