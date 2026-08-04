# Phase State

Single source of truth for where the project stands. Read this first on every
invocation. A phase closes only when its exit criteria are met **and** every
required signature from `core/roles.md` is recorded here.

---

## Current phase: **P1 — Questions gate**

P0 Discovery is substantially complete. The project is stopped at the P1 gate
awaiting client answers to `artifacts/OPEN-QUESTIONS.md`.

**Why stopped rather than proceeding to P2:** P2 does not strictly depend on
most open questions, but Q11 (manager availability signal) may constrain carrier
selection, and Q1–Q4 determine the conversation design that the stack must
support. Researching a stack before those are settled risks selecting against
the wrong requirements.

---

## Gate log

| Phase | Status | Signatures | Notes |
|-------|--------|-----------|-------|
| P0 Discovery | ● substantially complete | — pending | volume, schedule, economics, lead tiers, funnel baseline settled; 11 BLOCKERs open |
| P1 Questions | ◐ **open — awaiting client** | — | see OPEN-QUESTIONS.md |
| P2 Research | ○ not started | — | brief written; hard precondition: live source access |
| P3 Architecture | ○ not started | — | |
| P4 Review | ○ not started | — | |
| P5 Risk | ○ not started | — | |
| P6 Implementation | ○ not started | — | |
| P7 Code Review | ○ not started | — | |
| P8 Optimization | ○ not started | — | |
| P9 Deployment | ○ not started | — | |
| P10 Monitoring | ○ not started | — | |
| P11 Continuous Improvement | ○ not started | — | |

Legend: ● complete · ◐ in progress · ○ not started

---

## Blocking items

| ID | Question | Blocks |
|----|----------|--------|
| Q1 | True target audience for Дніпрограф | lead-source architecture, campaign strategy, conversion expectations |
| Q2 | Public procurement in scope? | call goal, qualification criteria, lead definition |
| Q6 | What counts as a successful call | qualification criteria, scoring, KPI |
| Q9 | Manager availability signal | carrier selection (P2), handoff design |
| Q3, Q4, Q5, Q7, Q8, Q10, Q11 | see OPEN-QUESTIONS.md | vertical configs, deployment, security sign-off |

---

## What exists now

```
ai-voice-sales-platform/
├── core/                    ✔ complete — business-agnostic
│   ├── META-PROMPT.md          agent operating manual
│   ├── epistemics.md           BLOCKER / RESEARCH / ASSUMPTION protocol
│   ├── roles.md                12 roles, veto scopes, review protocol
│   ├── phases.md               12 phases, gates, exit criteria
│   ├── constraints.md          economic gate, derived from client funnel data
│   └── conversation/           state machine, gatekeeper, scoring, handoff
├── config/
│   ├── schema.json          ✔ vertical config contract
│   ├── platform.yaml        ✔ schedule, volume, economics, budgets, retry
│   └── verticals/           ◐ skeletons with TODO(BLOCKER) markers
├── artifacts/               ◐ discovery recorded, research brief written
└── .claude/agents/          ✔ three veto agents (repo root)
```

## What does not exist yet

No runnable code. No vendor selected — deliberately, per client instruction
that the stack be chosen after research rather than assumed. No prompts beyond
the mechanism specifications, since prompt content depends on answers to Q1,
Q2, Q4 and Q6.
