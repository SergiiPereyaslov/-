# Phase State

Single source of truth for where the project stands. Read this first on every
invocation. A phase closes only when its exit criteria are met **and** every
required signature from `core/roles.md` is recorded here.

---

## Current phase: **P2 — Market Research (in progress)**

P0 Discovery is complete for the MVP. P1 cleared: the client answered every
question that gated conversation design, and deferred the rest deliberately.

**RE-BASELINED — read `artifacts/PRODUCT.md` first.** The project is a service
sold to businesses per successful conversation, positioned against KeyCall on
conversation quality rather than volume. Дніпрограф is tenant #1 and the pilot.
Delivery is agency-model: we configure each client's agent.

The build does not change; its purpose does. Consequences that do change the
work: per-tenant cost attribution from day one, and a Stage 2 gate that
**tightens** rather than relaxes, because under per-lead pricing cost is not
passed through to the customer.

**Scope for the pilot** — see `artifacts/MVP-SCOPE.md`. Numbers in, calls out,
scored leads back. CRM integration, warm transfer, email and the second vertical
are deferred. Whether warm transfer is worth building at all is research
question R6, not an assumption.

**P2 started.** Preliminary figures gathered via search — see
`01-research/FINDINGS.md`. A manual verification checklist has been handed to
the client (`01-research/VERIFY-CHECKLIST.md`) because this environment cannot
read vendor pages directly.

**Headline finding so far:** the binding constraint looks like Ukrainian speech
recognition, not price. Ukrainian TTS is confirmed available at real-time
latency; Ukrainian STT in a *conversational* model is not yet confirmed
anywhere.

**P2 cannot be closed by desk research.** No vendor, and no independent
benchmark, publishes Ukrainian telephony figures — the Open ASR Leaderboard's
multilingual track excludes Ukrainian entirely. P2 now closes on a **test
against real recordings**, not on vendor claims. Sequencing in
`artifacts/PLAN.md`; vendor directory in `01-research/VENDOR-LINKS.md`.

**Client supplied their KeyCall account, 2026-08-05.** Two years of real
funnel data on the real audience — see `01-research/KEYCALL-BASELINE.md`. It
replaces the estimated funnel, gives the first real market price per lead
($2.63, assumption flagged), and confirms end-of-turn detection as the
competitor's failure mode in the client's own words. The account is dormant:
zero calls this month, script untouched since Aug 2024.

**Constraint discovered:** this environment blocks `curl` and WebFetch to vendor
hosts; only WebSearch works. P2 therefore proceeds on search-sourced figures,
labelled `[SEARCH]`, with direct vendor confirmation required before committing.
See the research brief.

---

## Gate log

| Phase | Status | Signatures | Notes |
|-------|--------|-----------|-------|
| P0 Discovery | ● substantially complete | — pending | volume, schedule, economics, lead tiers, funnel baseline settled; 11 BLOCKERs open |
| P1 Questions | ● closed | — | client answered or deliberately deferred every gating item |
| P2 Research | ◐ **in progress** | — | preliminary findings written; awaiting client's manual verification |
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
