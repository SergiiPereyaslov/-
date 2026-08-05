# Assumptions Register

Every ASSUMPTION per `core/epistemics.md` Tier 3. An assumption that reaches
Deployment past its review phase without being re-checked is a QA veto
condition.

Nothing here may be a disguised BLOCKER or RESEARCH item. The test:
*could the client answer this?* → BLOCKER. *Could vendor documentation answer
this?* → RESEARCH.

---

### A-001 — Average answered call is ~60 seconds *(revised down from 90 s)*

**Assumption:** mean handle time across all answered calls is approximately 60
seconds.

**Revision.** The original 90-second figure was set before the state time
budgets existed. Working it through against the budgets now in
`config/platform.yaml` gives a lower number:

```
97.5% of answered calls never reach a decision maker:
  identify 8 s + gatekeeper ~30 s + close 10 s          ≈ 50 s
 2.5% reach a decision maker:
  identify 8 + gatekeeper 30 + DM 120 + callback 25 + close 10  ≈ 190 s

weighted:  0.975 × 50 + 0.025 × 190                     ≈ 54 s
```

Rounded to 60 s to leave headroom for ring time and imperfect adherence.

**Why it matters more than it used to.** Under per-lead pricing, handle time
multiplies directly into cost per lead, and it is the lever we fully control —
unlike the price of a vendor's minute. At $0.10/min, 1.0 minute average puts
cost per answered call at $0.100, level with KeyCall's *selling* price. At 1.5
minutes it is $0.150 and the competitive position weakens sharply.

**Impact if wrong:** at a true 1.5 min average, cost per lead rises from ~₴161
to ~₴242 at the same stack cost. Not fatal, but it removes the margin that
makes the business model work.

**Invalidated by:** measured handle-time distribution from the first 200 pilot
calls, or a gatekeeper cap that proves unenforceable in real conversation.

**Review at:** P8, and immediately after the first pilot batch.

---

### A-002 — Gatekeeper conversations can be resolved within 45 seconds

**Assumption:** a 45-second hard cap is sufficient to attempt transfer, attempt
a name capture, and exit.
**Rationale:** the state has three narrow objectives and no persuasion task.
**Impact if wrong:** either cost overruns, or the cap truncates calls that
would have converted — the latter being the more expensive error and the
harder to detect.
**Invalidated by:** pilot data showing tier-C capture concentrated after the
40-second mark.
**Review at:** P8.

---

### A-003 — An automated agent converts at no better than half the human rate

**Assumption:** pessimistic scenario of 1.25% A+B conversion versus the human
2.5%.
**Rationale:** the human baseline reflects an experienced caller who hears
hesitation and improvises. Assuming parity before evidence would be optimistic
in the direction that costs money.
**Impact if wrong (in our favour):** budget is larger than modelled, more
vendor options qualify. Wrong in the other direction: economics fail.
**Invalidated by:** pilot conversion measurement.
**Review at:** P8, and after the first 500 calls.

---

### A-004 — Model tiering yields material savings

**Assumption:** using a cheap model for gatekeeper-stage traffic and a strong
model only after reaching a decision maker meaningfully reduces total LLM cost.
**Rationale:** ~97% of minutes occur in the cheap-tier states, so the saving
scales with almost the entire minute volume.
**Impact if wrong:** the primary cost lever disappears and the architecture
must be re-evaluated against the gate.
**Invalidated by:** P2 pricing showing the cheap tier is not materially cheaper
for streaming workloads, or quality testing showing the cheap tier fails at
gatekeeper navigation.
**Review at:** P2 (pricing), P7 (quality).

---

### A-005 — Voicemail is not worth leaving a message on

**Assumption:** default behaviour on voicemail detection is to hang up silently.
**Rationale:** a message costs money on every unanswered call and its
conversion value is unmeasured. Defaulting to the cheaper behaviour is
reversible; defaulting to the costlier one silently spends budget.
**Impact if wrong:** foregone leads from callbacks that would have happened.
**Invalidated by:** an A/B test during pilot.
**Review at:** P11.

---

### A-006 — Existing manager objections transfer to the automated agent

**Assumption:** objections and phrasings extracted from recorded human calls
remain applicable when the caller is an automated agent.
**Rationale:** the objection ("we already have a supplier") is a property of
the market, not of the caller.
**Impact if wrong:** the objection set is incomplete — an automated caller
attracts objections a human never hears, above all "is this a robot?", which
requires a prepared, non-evasive answer.
**Invalidated by:** pilot transcripts containing frequent objections absent
from the config.
**Review at:** P11, continuously.

---

### A-007 — Tier-C capture is a compounding asset

**Assumption:** decision-maker contacts captured on otherwise-lost calls
accumulate into a database that materially improves the economics of later
campaigns, because subsequent calls reach a named person directly rather than a
switchboard.
**Rationale:** the lead source supplies only company numbers; direct
decision-maker contacts are not obtainable from it at any price.
**Impact if wrong:** tier C is merely a vanity metric and the second-campaign
economics do not improve.
**Invalidated by:** a second-pass campaign against captured contacts showing no
conversion improvement over cold switchboard dialling.
**Review at:** P11, after the first second-pass campaign.
