# The Learning Loop — mechanism only

Client requirement: a model that keeps improving, and script changes that do
not cost money each time.

> «Потрібна модель, яка постійно навчається. А кожного разу платити по 250
> доларів за зміну сценарію, за озвучку — це не дуже мені подобається.»
> `[CLIENT]`

This file defines how improvement actually happens. It is vertical-agnostic:
the loop is the same for any business, only the content it produces differs.

---

## What "keeps learning" honestly means here

It is worth being precise, because this is where systems get oversold.

**It does not mean the model retrains itself on your calls.** Fine-tuning at
2,100 calls a month would be expensive, slow, and would produce a model that is
harder to correct than the one you started with — a bad habit learned into
weights cannot be removed by editing a line.

**It means the system accumulates evidence from real calls and turns it into
changes you approve.** Objections it has never heard, phrasings that preceded
good outcomes, the exact point where calls die — all of it comes back as
concrete proposed edits to the knowledge base and the vertical config.

That is a slower-sounding kind of learning and a far better one:

| Property | Feedback loop into config | Fine-tuning |
|---|---|---|
| Time to apply a fix | minutes | days |
| Cost per iteration | zero | retraining run |
| Can you see why it changed? | yes, it is a diff | no |
| Can you revert one bad change? | yes | no, retrain again |
| Can you A/B two variants? | yes, per batch | impractical |

The competitor's constraint is instructive. A scripted robot walks a fixed
decision tree, so improving it means rebuilding the tree — which is exactly why
a change carries a setup fee. **Our equivalent of that rebuild is editing a YAML
file.** That is the structural difference, and it is worth more over a year than
the per-minute rate.

---

## The loop

```
   calls ──▶ evidence ──▶ analysis ──▶ proposals ──▶ approval ──▶ config
     ▲                                                               │
     └───────────────── regression suite guards ─────────────────────┘
```

### 1. Evidence — collected on every call, no exceptions

Per call: full transcript, state timeline (how long in each state), outcome
tier, where the call ended and why, cost, batch id, and the config version in
force at the time.

**Config version is not optional.** Without it, a change in results cannot be
attributed to a change in configuration, and the loop degrades into guessing.

### 2. Analysis — run per batch, off the call path

Four questions, asked of every batch:

1. **What objections appeared that the config does not know?** Any refusal
   whose wording does not map to a configured `trigger` is a gap. Frequency
   ranks the gaps.
2. **Where do calls die?** State-level drop-off. A cliff at one state is a
   design fault, not bad luck.
3. **What preceded good outcomes?** Compare transcripts of tier A/B calls
   against tier D on the same batch. What differed in the first thirty seconds?
4. **What did the agent get wrong?** Cases where it stated something not in
   config, missed a qualification answer that was given, or misscored. These
   are defects, and they are found here or not at all.

### 3. Proposals — surfaced, never auto-applied

Analysis emits proposed edits: new objections with drafted responses, wording
changes, time-budget adjustments, qualification refinements.

**A human approves every one.** Under an agency model, conversation quality is
the product, and a config that edits itself unattended is a product that
degrades without anyone noticing. The gain here is that a change takes minutes
and costs nothing — not that nobody looks at it.

### 4. A/B — the only honest way to know a change helped

Variants are assigned per batch, using the batch tagging already defined in
`config/platform.yaml`. Two batches from the same segment, two config versions,
compared on answer rate, decision-maker reach, tier mix and cost per lead.

Without this, every change is an opinion. With it, "the new opening works
better" is a measurement.

Note the constraint: at ~2,100 calls a month, a variant needs enough volume to
say anything. Do not test five things at once and conclude anything from any of
them.

### 5. Regression — improvement must not break what worked

Any config or prompt change re-runs the scenario suite before it goes live.
A change that improves one objection and breaks voicemail handling is a
regression, and at these volumes it would take weeks to notice from metrics
alone.

---

## What the client's own recordings feed

The recordings of real manager calls, when they arrive, enter at step 2 as a
one-off batch of evidence: real objections, real phrasings, real tone. They
seed the loop rather than train a model.

The seven objections currently in the Дніпрограф config are drafts written by
an agent that has never heard a real call on this market. Replacing them with
observed wording is the single largest quality improvement available, and it
costs nothing but the analysis.

---

## What is deliberately not automated

- **Applying changes without review.** See step 3.
- **Retraining on call data.** See the top of this file.
- **Changing the voice automatically.** Voice is brand.
- **Tuning toward tier C.** The scoring engine's anti-gaming rules apply here
  too: a loop that optimises for the easiest outcome will find it. Tier mix is
  monitored precisely so the loop cannot quietly drift there.

---

## Success condition

The loop works when the vertical config for a business is measurably better
after a month of calling than the day it was written, and every change that
made it so can be pointed at, explained, and reverted.

If that is true, the system improves without anyone paying for a rebuild — and
that, rather than the per-minute rate, is what independence actually buys.
