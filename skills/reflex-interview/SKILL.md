---
name: reflex-interview
description: Socratic interview for code requirements. Ambiguity scoring → immutable seed spec. Never builds without clarity.
---

# Reflex Interview

Before you build, understand.

Socratic dialogue that surfaces ambiguity before a single line of code is written. Only asks questions — never promises to build. Once clarity reaches 80%, outputs an immutable seed spec.

## Usage

```bash
# Score a request for ambiguity
bun reflex interview score --request "Add rate limiting to the API"

# Interactive interview (in conversation)
# Zo runs this automatically when you describe a feature
```

## How It Works

1. **Ambiguity Score** — Rates 0-1 how clear the request is
2. **Socratic Questions** — Asks targeted questions to fill gaps
3. **Three Dimensions** — Goal (40%), Constraints (30%), Success Criteria (30%)
4. **Seed Output** — Immutable YAML spec once clarity ≥ 80%

## Example

```
You: "Add rate limiting to the API"

Zo: "Rate limiting on which endpoints? All, or specific ones like /api/chat?"
    "What's the rate limit? Per-IP, per-user, per-API-key?"
    "What happens when exceeded? 429 with retry-after, or custom response?"

(After 5-8 questions, clarity ≥ 80%)

Zo: "Requirements clear. Generating seed spec..."
    → outputs seed-rate-limiting.yaml
```

## Ambiguity Examples

```bash
# High ambiguity
bun reflex interview score --request "Make the site faster"
# → 0.98 — "What specifically? Load time, TTI, bundle size? Target metric?"

# Ready to build
bun reflex interview score --request "Add Redis caching to /api/products with 5-min TTL"
# → 0.22 — READY
```
