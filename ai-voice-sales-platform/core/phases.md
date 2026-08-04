# Phases and Gates

Twelve phases. Each has inputs, outputs, exit criteria and required
signatures. A phase closes only when its exit criteria are met and every
signature listed in `core/roles.md` is present in `artifacts/PHASE-STATE.md`.

You work one phase per invocation. You do not look ahead and start the next
one because it seems easy.

```
P0 Discovery → P1 Questions → P2 Research → P3 Architecture → P4 Review
   → P5 Risk → P6 Implementation → P7 Code Review → P8 Optimization
   → P9 Deployment → P10 Monitoring → P11 Continuous Improvement
```

P11 loops back into P2 or P6 as findings warrant. The project does not "end".

---

## P0 — Business Discovery

**Purpose:** establish every fact the build depends on. Ask; do not assume.

**Output:** `artifacts/00-discovery/DISCOVERY.md`, plus one config skeleton per
vertical under `config/verticals/`.

**Exit criteria:**
- volume, schedule, timezone recorded
- lead source, its format, and expected list size recorded
- lead definition and tiers agreed with the client
- funnel baseline recorded (answer rate, conversion) with its provenance
- economic ceiling recorded and converted to a cost-per-minute target
- CRM destination and field mapping recorded
- every remaining unknown classified per `core/epistemics.md`

**Note:** P0 is partially complete. Read the existing artifact before asking
anything — re-asking an answered question is a Product Manager finding.

---

## P1 — Questions gate

**Purpose:** a deliberate stop. Present every open BLOCKER at once, in
Ukrainian, in a form the client can answer in one sitting.

**Exit criteria:** every BLOCKER that gates P2–P3 is answered, or explicitly
deferred by the client with the affected scope named.

---

## P2 — Market Research

**Purpose:** determine what can actually be built, at what cost and latency,
for the target language and country.

**Hard precondition:** live access to primary sources. Without it this phase is
**BLOCKED**. Do not produce a comparison from memory.

**Vendors in scope (minimum):** Vapi, Retell, Bland, Twilio, LiveKit, Pipecat,
ElevenLabs, OpenAI Realtime, Deepgram, Cartesia. Add any local carrier
relevant to the target country.

**For each, retrieve and record with source URL and date:**
pricing model and per-minute cost · latency (published or measured) · target
language support for STT and TTS · voice quality evidence · concurrency limits
· real-time media access · barge-in support · call transfer support ·
self-host option · vendor lock-in.

**Blocking research questions:**
1. Which carriers permit outbound calling to the target country with a local
   caller ID, and under what verification?
2. Which of those expose a **real-time media stream**, not merely call control
   and recording? A carrier without media access cannot run a live agent, no
   matter how good its other properties.
3. What is the cheapest stack that meets the language requirement and clears
   `core/constraints.md`?

**Output:** `artifacts/01-research/` — a comparison matrix where every cell is
sourced, plus a shortlist with reasoning.

**Exit criteria:** no `[UNVERIFIED]` cells in the shortlist; at least one
option clears the economic gate, or the failure is reported explicitly.

---

## P3 — Architecture

**Purpose:** three genuinely different options, not one option in three sizes.

**For each of MVP / Production / Enterprise:**
component diagram · vendor selection with rationale · **cost model at baseline
and pessimistic conversion** · latency budget · failure modes · operational
burden · what it cannot do · migration path to the next tier.

**Exit criteria:** each option passes or fails `core/constraints.md`
explicitly; a recommendation with the reason it beats the others; every
significant choice recorded as an ADR.

---

## P4 — Review

All three veto agents review P3 independently, without seeing each other's
findings first. Findings are collated, then resolved. Unresolved vetoes go to
the client as a decision, never silently overridden.

---

## P5 — Risk Analysis

Enumerate what can go wrong and what it costs. Minimum categories: vendor
outage · vendor price change · carrier blocking or caller-ID reputation
decay · conversion below pessimistic scenario · list exhaustion · CRM schema
drift · model regression on a prompt change · cost runaway.

Each risk: likelihood, impact, detection signal, mitigation, owner.

**Exit criteria:** no risk rated high-impact lacks a detection signal. A risk
you cannot detect is one you will discover from an invoice.

---

## P6 — Implementation

Builds, in this order, because each depends on the last:

1. **Conversation design** — state machine, intents, interruptions,
   objections, fallback, handoff, memory, emotion signals
2. **Prompt engineering** — system, developer, call, qualification, summary,
   CRM prompts; each versioned
3. **Knowledge base** — chunking, embeddings, vector store, retrieval,
   citations, versioning
4. **Integrations** — telephony, CRM, lead import, deduplication
5. **Pipeline** — dial → STT → LLM → TTS → response → CRM → summary → score

**Exit criteria:** every state reachable and exitable; every prompt versioned;
retrieval returns citations; no hardcoded business fact outside `config/`.

---

## P7 — Code Review

Architect, Security and QA review independently. QA's scenario suite must
exist and pass: **minimum 100 scenarios**, covering every category in
`core/roles.md` §QA. Completion claims not backed by a passing test are
rejected.

---

## P8 — Optimization

Driven by the cost model, in order of leverage:

1. shorten dead-end calls — the dominant cost, since most minutes produce
   nothing
2. tier the models — cheap model for the high-volume low-value stage,
   strong model only where value is created
3. reduce turnaround latency
4. improve conversion

**Exit criteria:** measured cost per call, compared against the gate, with
before/after figures.

---

## P9 — Deployment

Secrets management, staged rollout, rollback path, spend alerting, kill
switch. **A kill switch is mandatory** — a runaway outbound dialler must be
stoppable in one action by someone who is not the engineer who built it.

---

## P10 — Monitoring

Track: latency · hallucination signals · interruption rate · cost per call ·
token usage · success rate · conversion by tier · failed calls by cause ·
answer rate · average handle time by state · **task queue depth and age of the
oldest unclaimed task**.

That last one matters because tasks go to a shared queue with no named owner.
Work nobody is assigned is work nobody is late on, so the promise the agent
made on the call decays silently. Queue age is the only signal that it is
happening.

**Exit criteria:** cost per call and lead tier mix are visible without manual
computation; alerts fire on spend anomaly and on tier-mix drift.

---

## P11 — Continuous Improvement

Review cadence: scenario suite regression, cost trend, tier mix trend,
objection frequency (feeds the vertical config), assumption re-validation.
Findings loop back into P2 or P6.
