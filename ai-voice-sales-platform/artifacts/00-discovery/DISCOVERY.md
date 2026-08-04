# P0 — Business Discovery

**Status:** partially complete. Enough is settled to design against; several
BLOCKERs remain open (see `artifacts/OPEN-QUESTIONS.md`).

Every line below is labelled with its provenance. Nothing here is estimated.
An agent reading this must not re-ask what is already answered.

---

## Scope

Build a **platform**, not a single agent. The core is business-agnostic; each
business is a configuration file. Two verticals in scope now — **Дніпрограф**
and **SmartEcoPack**. Further verticals are a later commercial possibility and
must not be built for now, but must remain a config-only change. `[CLIENT]`

Explicitly out of scope: any integration with the invoicing system that shares
this repository. It is a separate product. `[CLIENT]`

---

## Volume and schedule

| Item | Value | Provenance |
|------|-------|-----------|
| Dials per day | 100 | `[CLIENT]` — revised down from an initial 1,000 |
| Days | Mon–Fri | `[CLIENT]` |
| Window | 09:00–13:00, 14:00–18:00 | `[CLIENT]` — lunch hour excluded |
| Timezone | Europe/Kyiv | `[CLIENT]` |
| Effective hours/day | 8 | derived |
| Calls/hour | ~13 | derived |
| Concurrent lines needed | 1–2 | derived |

Multi-language support is a design requirement from the outset — Ukrainian
first, other languages later as geography expands. Language is a config
parameter, never hardcoded. `[CLIENT]`

---

## Lead source

Export files, not a live API. Filtered by КВЕД and region. Own web scraping is
planned as an additional source later. `[CLIENT]`

**Critical property: the numbers are company switchboard numbers, not
decision-maker numbers.** `[CLIENT]`

This single fact drives the two-stage dialogue design in
`core/conversation/state-machine.md`. Whoever answers is almost never able to
buy, so reaching the decision maker is a separate task from selling to them,
with its own economics and its own time budget.

**Open concern — see OPEN-QUESTIONS Q1.** For Дніпрограф the audience appears
to be a closed, fully enumerable market rather than an open population of
companies, which would make a КВЕД-filtered export the wrong instrument.

---

## Lead definition

Three outcomes count. Tiers are defined in
`core/conversation/scoring-engine.md`. `[CLIENT]`

| Tier | Definition |
|------|-----------|
| A | Specific commitment — date, time, named parties |
| B | Decision maker expressed a need, no commitment |
| C | Decision-maker identity/contact captured, no interest expressed |

**Tier C is excluded from the funnel baseline.** The client confirmed that the
2.5% figure means "of 100 people, 2.5 need something" — i.e. tiers A and B.
Human managers do not systematically log contacts on lost calls, so no measured
rate exists for C. It is tracked as upside and never used to justify spend.
`[CLIENT]`

---

## Funnel baseline — human performance

| Metric | Value | Provenance |
|--------|-------|-----------|
| Answer rate | 90% | `[CLIENT]` |
| A+B lead rate | 2.5% of dials | `[CLIENT]` |
| C capture rate | unmeasured | — |

A 90% answer rate is consistent with calling office switchboards during
business hours. Its consequence is that there is no cheap failure mode: almost
every dial becomes a billable conversation.

---

## Economics

Ceiling raised from $3 to **$5 per lead** during discovery. `[CLIENT]`

Full derivation in `core/constraints.md`. Summary:

```
$5.00 × 2.5 leads/day        = $12.50/day    ≈ $263/month, ~52 leads
$12.50 / 90 answered calls   = $0.139/call
at 1.5 min average           = $0.093/minute all-in
```

Gate: target ≤$0.07/min · planning ≤$0.09/min · hard cutoff >$0.14/min.
Every architecture is additionally evaluated at a pessimistic 1.25% conversion.

---

## CRM

KeyCRM. API key exists. `[CLIENT]`
Pipeline ids, status ids and field mapping are open BLOCKERs.

---

## Channels

Voice only. Email explicitly disabled by the client, with the config switch
retained so enabling it later is a configuration change rather than a rebuild.
`[CLIENT]`

---

## Handoff

Strategy confirmed: warm transfer to an available manager, callback as
fallback. `[CLIENT]`
Manager count, endpoints and the availability signal are open BLOCKERs. The
availability source has the largest design impact and must be settled during
P2, since a live PBX signal may constrain carrier choice.

---

## Call recordings

The client has a corpus of real manager conversations. Volume, format and
whether they are transcribed are not yet known. `[CLIENT]`

Recommended use, pending confirmation: **pattern extraction into the knowledge
base and vertical config — objections, effective phrasings, tone — rather than
fine-tuning.** Cheaper, faster, and controllable: an undesirable habit can be
removed by editing a config line instead of retraining.

---

## Legal

The client states that no restrictions on telephone marketing or personal data
processing currently apply in Ukraine, and has reaffirmed this. Recorded as the
client's decision. No legal analysis is performed by this system, and none is
implied. `[CLIENT]`

Operational suppression (opt-out, hard refusal, hostility) is implemented
regardless, as an engineering and brand-protection measure.

---

## Settled technical decisions

| Decision | Choice | Provenance |
|----------|--------|-----------|
| Artifact form | File set in this repository | `[CLIENT]` |
| Runtime | Claude Code | `[CLIENT]` |
| Core prompt language | English; conversational content Ukrainian | `[CLIENT]` |
| Team model | Hybrid — Architect, Security, QA as veto subagents; nine personas | `[CLIENT]` |
| Stack | **Undetermined by design** — selected in P2 after research | `[CLIENT]` |
