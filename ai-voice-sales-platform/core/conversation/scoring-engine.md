# Lead Scoring Engine — mechanism only

Tier definitions are fixed in the core. What *qualifies* within a tier is
supplied by the vertical config.

---

## Tiers

| Tier | Definition | Counted in the funnel baseline? |
|------|-----------|-------------------------------|
| **A** | Specific commitment: a date, a time, a named person on both sides | yes — part of the client's 2.5% |
| **B** | Decision maker expressed a need, no commitment yet | yes — part of the 2.5% |
| **C** | Decision-maker identity or contact captured; no expressed interest | **no** — upside, tracked separately |
| **D** | No useful outcome | no |
| **X** | Suppress: hostility, wrong number, explicit opt-out | no — removed from future campaigns |

Tier C is deliberately excluded from budget justification. The client's 2.5%
baseline measures human callers, who do not systematically record contacts on
lost calls. Counting C toward the budget would mean spending against a number
that has never been measured.

---

## Anti-gaming — the central risk

If all tiers count as success, the system optimises for the cheapest one. Tier
C is by far the easiest to obtain: ask a name, hang up, log a success. An agent
that does this looks productive on a dashboard and produces no revenue.

This is not hypothetical. It is the predictable outcome of a metric that treats
unequal results equally, and it requires no bad intent to occur.

**Controls:**

1. **A and B are the primary KPI.** C is reported on a separate axis and never
   summed into a single "leads" figure.
2. **Tier mix is monitored.** The A:B:C ratio is a first-class metric with a
   drift alert. Rising C alongside falling A is the signature of a degraded
   agent, and it is invisible in a total-leads chart.
3. **A tier-C-only run fails QA.** The scenario suite contains a case in which
   an agent that harvests contacts but never attempts qualification is
   asserted to fail. If that test passes, the scoring is gameable.
4. **Tier A requires specificity.** Date, time and named parties must all be
   extracted. Absent any one of them the outcome is B, not A. "They said call
   back sometime" is not a commitment.

---

## Scoring inputs

Scoring runs post-call, off the latency path, over the full transcript.

| Input | Source |
|-------|--------|
| Reached decision maker? | state machine — did `DM_ENGAGED` occur |
| Qualification criteria met | vertical config, evaluated against transcript |
| Commitment extracted | date, time, parties — all three required for A |
| Contact captured | name, role, direct line, best time |
| Refusal type | soft / hard / hostile |
| Handle time by state | telemetry |
| Call cost | telemetry |

---

## Output contract

```yaml
tier: A | B | C | D | X
confidence: 0.0–1.0
reason: "<one sentence citing transcript evidence>"
decision_maker:
  name: string | null
  role: string | null
  direct_line: string | null
  best_time: string | null
commitment:            # only when tier == A
  date: ISO-8601
  time: local time
  our_party: string
  their_party: string
qualification:
  <criterion>: true | false | unknown    # keys from vertical config
suppress: true | false
cost: { total_usd: number, by_state: {...} }
```

Below the confidence floor set in config, the record is queued for human
review rather than written as a scored lead. A confidently wrong tier is
worse than an unscored call: it enters the CRM and someone acts on it.

---

## What the engine must never do

- Infer interest from politeness. Ukrainian business courtesy is not a buying
  signal, and treating it as one inflates B until the pipeline is worthless.
- Score a call in which the decision maker was never reached as A or B.
- Overwrite a prior hard refusal with a softer tier from a later call.
- Assign a tier without transcript evidence in the `reason` field.
