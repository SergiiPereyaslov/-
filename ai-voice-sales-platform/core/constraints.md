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
| Maximum cost per lead | **$7.00** | `[CLIENT]` — raised from $5.00, and from $3.00 before that |

Tier C (decision-maker contact captured without expressed interest) is **not**
included in the 2.5%. It is treated as upside, never as budget justification.

---

## Derived budget

```
daily budget      = 2.5 leads × $7.00              = $17.50 / day
per answered call = $17.50 / 90                    = $0.194
monthly (21 days) = $17.50 × 21                    = $367.50  (~52 leads)
```

At ₴44.78/USD `[SEARCH: minfin.com.ua, 2026-08-04]`, $7.00 ≈ **₴313 per lead**.

Cost per minute is a function of average handle time:

| Avg. answered call | Minutes/day | Max cost/minute, all-in |
|--------------------|-------------|-------------------------|
| 1.0 min | 90 | $0.194 |
| **1.5 min** | **135** | **$0.130** |
| 2.0 min | 180 | $0.097 |
| 2.5 min | 225 | $0.078 |

"All-in" means telephony + STT + LLM + TTS + hosting, summed.

---

## The gate

| Threshold | Value | Meaning |
|-----------|-------|---------|
| Target | **≤ $0.10 / min** | comfortable; leaves margin for conversion shortfall |
| Planning | **≤ $0.13 / min** | the number architectures are designed against |
| Hard cutoff | **> $0.19 / min** | rejected outright, no further evaluation |

Between $0.13 and $0.19 an option is **conditional**: viable only if average
handle time is held under the corresponding row above, and that must then
become an asserted test, not an intention.

### Second lens: this is now a service, and the gate does not relax

The project became a service sold per successful conversation
(`artifacts/PRODUCT.md`). That changes what these numbers mean without changing
the numbers themselves.

Under per-minute billing, cost of goods is passed through and an expensive
stack is survivable. **Under per-lead billing nothing is passed through** — we
pay for every failed call and are paid only for the successful ones, so cost
per minute lands directly on margin.

```
cost per lead = (dials × cost per dial) ÷ conversion rate
margin        = price per lead − cost per lead
```

Дніпрограф worked through: 100 dials, 90 answered, 2.5 leads at $0.194 per
answered call → **$6.98 of cost per lead**, against a $7.00 ceiling. Break-even
as an internal tool; as a service, that is the whole revenue with nothing left.

So the gate below is not a budget any more — it is the floor of a margin. Treat
every threshold as tighter than it was, not looser.

**Second consequence:** the funnel figures here are *tenant #1's*. Another
client converts differently, and under per-lead pricing that variance is our
risk, not theirs. Every tenant needs its own funnel measured, and its own
economics evaluated separately, before it is priced.

### Why the ceiling moved

$3 → $5 → $7, each raised by the client as the economics became clearer. The
$7 figure is still anchored on a single order, and the client's own data
suggests that understates it: a printing house sells a **returning** B2B
customer, not one job. Once repeat frequency is known (`avg_deal_b2b_uah` and
`repeat_orders_per_year` in the vertical config), the justified ceiling may be
higher again.

Do not treat $7 as a permanent constraint. Treat it as the current best
estimate of what a lead is worth, and re-derive it when the repeat data lands.

---

## Pessimistic scenario — mandatory second evaluation

The 2.5% baseline is the performance of an experienced human who hears
hesitation and improvises. An automated agent should not be assumed to match
it, especially before tuning.

```
pessimistic lead rate = 1.25%  (half of human baseline)
daily budget          = 1.25 × $7.00 = $8.75
per answered call     = $8.75 / 90   = $0.097
max cost/min @1.5 min = $8.75 / 135  = $0.065
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
