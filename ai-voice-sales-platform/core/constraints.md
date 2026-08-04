# Economic Gate — the hard pass/fail for any architecture

All figures below trace to client-supplied funnel data or arithmetic on it.
Provenance is labelled. Nothing here is estimated.

---

## Inputs

| Input | Value | Provenance |
|-------|-------|-----------|
| Dials per day | 100 | `[CLIENT]` |
| Calling window | Mon–Fri, 09:00–13:00 and 14:00–18:00 | `[CLIENT]` |
| Timezone | Europe/Kyiv | `[CLIENT]` |
| Effective calling hours per day | 8 | derived |
| Answer rate | 90% → 90 answered calls/day | `[CLIENT]`, human baseline |
| Lead rate, tiers A+B | 2.5% of dials → 2.5 leads/day | `[CLIENT]`, human baseline |
| Maximum cost per lead | $5.00 | `[CLIENT]` |

Tier C (decision-maker contact captured without expressed interest) is **not**
included in the 2.5%. It is treated as upside, never as budget justification.

---

## Derived budget

```
daily budget      = 2.5 leads × $5.00              = $12.50 / day
per answered call = $12.50 / 90                    = $0.139
monthly (21 days) = $12.50 × 21                    = $262.50  (~52 leads)
```

Cost per minute is a function of average handle time:

| Avg. answered call | Minutes/day | Max cost/minute, all-in |
|--------------------|-------------|-------------------------|
| 1.0 min | 90 | $0.139 |
| **1.5 min** | **135** | **$0.093** |
| 2.0 min | 180 | $0.069 |
| 2.5 min | 225 | $0.056 |

"All-in" means telephony + STT + LLM + TTS + hosting, summed.

---

## The gate

| Threshold | Value | Meaning |
|-----------|-------|---------|
| Target | **≤ $0.07 / min** | comfortable; leaves margin for conversion shortfall |
| Planning | **≤ $0.09 / min** | the number architectures are designed against |
| Hard cutoff | **> $0.14 / min** | rejected outright, no further evaluation |

Between $0.09 and $0.14 an option is **conditional**: viable only if average
handle time is held under the corresponding row above, and that must then
become an asserted test, not an intention.

---

## Pessimistic scenario — mandatory second evaluation

The 2.5% baseline is the performance of an experienced human who hears
hesitation and improvises. An automated agent should not be assumed to match
it, especially before tuning.

```
pessimistic lead rate = 1.25%  (half of human baseline)
daily budget          = 1.25 × $5.00 = $6.25
per answered call     = $6.25 / 90   = $0.069
max cost/min @1.5 min = $6.25 / 135  = $0.046
```

Every architecture is reported against **both** scenarios:

- passes baseline **and** pessimistic → **PASS**
- passes baseline, fails pessimistic → **CONDITIONAL** (state the conversion
  floor at which it breaks)
- fails baseline → **REJECTED**

An option may never be reported as passing on the baseline alone.

---

## Structural consequences

These follow from the funnel arithmetic and drive design, not preference.

**1. 97% of minutes produce nothing.** Of 90 answered calls, 2.5 yield a lead.
Cost is therefore dominated by conversations that were never going to convert.
The highest-leverage optimisation is not making good calls cheaper — it is
ending dead-end calls sooner. Halving dead-end handle time roughly halves
total spend.

**2. There is no cheap failure.** At a 90% answer rate almost every dial
becomes a billable conversation. Architectures that rely on unanswered calls
being free do not apply here.

**3. Model tiering is structural, not an optimisation.** Since nearly all
minutes are spent in the low-value gatekeeper stage, the cheap fast model
serves the overwhelming majority of traffic and the strong model is engaged
only after a decision maker is reached. This is a primary architectural
decision and must be present in every option evaluated.

**4. Concurrency is trivial.** 100 calls over 8 hours is 12–13 calls/hour;
one to two concurrent lines suffices. Do not pay for scale that is not needed.
Conversely, do not select a vendor whose pricing only becomes competitive at
volumes this project will not reach.

**5. Fixed costs are dangerous at this volume.** ~2,100 calls/month spreads
fixed infrastructure cost thinly. A self-hosted stack with a low per-minute
rate can still lose to a managed platform once servers and operator time are
counted. Every cost model must include fixed costs amortised over actual
projected volume, not per-minute rates alone.
