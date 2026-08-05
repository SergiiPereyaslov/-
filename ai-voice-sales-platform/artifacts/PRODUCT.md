# Product Re-baseline

The project changed shape. This is not a scope tweak — it reaches every phase,
so it is recorded here rather than patched into existing artifacts.

> «Мені потрібен не "Агент-Дзвонилка", мені потрібен сервіс, щось дуже схоже на
> Keycall. Але більш сучасний. У Keycall телефонує робот і не може відступати
> від сценарію. Мені потрібно, щоб сервіс міг вести живу розмову з потенційним
> лідом.» `[CLIENT]`

---

## What we are building

A cold-calling service where the agent **holds a conversation** rather than
walking a script tree. Sold as a service to businesses; Дніпрограф is customer
number one and the pilot.

Client decisions `[CLIENT]`:

| Decision | Choice |
|---|---|
| Sequence | Дніпрограф first as tenant #1, then generalise into a product |
| Delivery model | **Agency** — we configure the agent for each client, as KeyCall does |
| Monetisation | **Per successful conversation / lead** |

---

## The competitor, factually

KeyCall `[SEARCH: k-call.com, 2026-08-05]`:

- robot built on Google Speech API for synthesis and recognition
- fully scripted — the site's own wording is that the robot "only voices
  programmed messages"
- **12,000 contacts per hour**
- A/B testing of scripts
- charges only for successful conversations
- onboarding via a brief, i.e. an agency model, not self-service

### Where we cannot win, and should not try

12,000 calls an hour with Google TTS and a script tree is a fundamentally
cheaper unit than a live model with premium synthesis. **We will never beat
KeyCall on cost per call.** Any strategy that requires it is dead on arrival.

### Where the product actually competes

Their robot cannot leave the script. Ours holds a conversation: it navigates a
gatekeeper, absorbs an objection it has not seen before, and extracts a real
specification instead of a yes/no.

So the axis is **conversion, not volume**. A scripted robot at 12,000 calls an
hour converting a fraction of a percent, and an agent at a few hundred calls a
day converting several percent, are different businesses — and the second sells
a more expensive lead.

**This must be measured, not asserted.** "More natural" is marketing. The
product claim is a higher conversion rate per contacted company, and the
platform has to prove it with its own numbers or the positioning is empty.

---

## The economics inverted — and then inverted back

This needs stating carefully, because the intuition is wrong in a way that
would misdirect the whole architecture.

**Under per-minute pricing**, cost of goods is passed through to the customer.
An expensive stack is survivable: charge more per minute, keep the margin.
Stack selection relaxes.

**Under per-lead pricing — which is what was chosen — nothing is passed
through.** We pay for every failed call and are paid only for successful ones.
Cost per minute lands directly on our own margin.

```
cost per lead = (dials × cost per dial) ÷ conversion rate
margin        = price per lead − cost per lead
```

With Дніпрограф's numbers as the worked example: 100 dials, 90 answered, 2.5
leads, at $0.194 per answered call → **$6.98 of cost per lead**. Every cent
above that has to come out of the price charged.

**Therefore the cheap stack matters more under this model, not less.** The
Stage 2 gate does not relax. If anything it tightens, because the gate now also
has to leave room for margin, not merely break even.

### The real business risk: conversion varies by client

Under per-lead pricing, **we carry the conversion risk for every customer.** A
client with a weak offer, a saturated market, or a bad list still costs us a
full campaign's worth of minutes and produces few billable leads.

Дніпрограф's 2.5% is Дніпрограф's number. The next client might be 5% or 0.8%,
and we do not find out until we have spent the money.

Mitigations to decide before selling to anyone (open — see below):
- a setup fee that covers configuration regardless of outcome
- a paid pilot batch priced separately from the ongoing rate
- the right to stop a campaign that is not converting
- a per-client conversion floor below which the rate is renegotiated

None of this is optional decoration. It is the difference between a service
business and a subsidy for other people's offers.

---

## What the agency model means for the build

A useful consequence: **the Meta Prompt is the product's onboarding engine.**

The twelve-role agent was built to turn a business into a vertical config. In
an agency model, that is exactly the bottleneck — how fast can a new client be
taken from a brief to a working agent. The thing already built for internal
discipline turns out to be the thing that makes the business scale.

That also sets the near-term priority order:

1. Make one agent work well for one real business (Дніпрограф).
2. Make onboarding the second business fast.
3. Only then consider self-service, multi-tenancy and billing automation.

Self-service is explicitly **not** the first product. Under an agency model,
conversation quality is the thing being sold, and quality is exactly what
self-service configuration degrades.

---

## What changes per phase

| Phase | Change |
|---|---|
| P0 Discovery | Two customers now: Дніпрограф as tenant #1, and the service business itself. Product pricing is a new discovery area. |
| P2 Research | Gate does **not** relax — see above. Adds: what the market pays per lead, and what a scripted competitor charges. |
| P3 Architecture | MVP / Production / Enterprise reframed as: one tenant → several tenants configured by us → self-service. Tenant isolation and per-tenant cost accounting enter at tier two. |
| P5 Risk | New top risk: conversion variance across clients under per-lead pricing. |
| P6 Implementation | Unchanged for the pilot. Per-tenant cost attribution must be built in from the start — retrofitting it means never knowing which client loses money. |
| P8 Optimization | Now optimises **margin per lead**, not merely cost per call. |
| P10 Monitoring | Per-tenant unit economics becomes a first-class view, not a report. |
| P11 Improvement | Conversion benchmarking against a scripted baseline becomes a product feature, since it is the sales claim. |

---

## What does not change

The core/config split holds, and this is the payoff for ADR-0001. Everything in
`core/` remains business-agnostic. A new client is still a new config. Nothing
built so far is wasted, and nothing needs rewriting — multi-tenancy, billing
and per-tenant accounting are **additive**.

The MVP also does not change: numbers in, calls out, scored leads back. It is
now the pilot for tenant #1 rather than an internal tool, which is a change of
purpose, not of build.

---

## Open questions this raises

1. **What do we charge per lead?** Needs the market rate and what KeyCall
   charges. Until then, margin cannot be computed and the Stage 2 gate has no
   upper reference.
2. **What counts as billable?** Tier A and B only, or does C count? This is the
   same anti-gaming problem as internal scoring, but now with money attached —
   and the customer will audit it.
3. **Who pays for a campaign that does not convert?** See mitigations above.
4. **Minimum campaign size**, below which configuration effort is not repaid.
