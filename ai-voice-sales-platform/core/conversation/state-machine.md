# Dialogue State Machine — mechanism only

Vertical-agnostic. Wording, products, objection content and qualification
criteria come from `config/verticals/*.yaml`. This file defines states,
transitions, time budgets and model tiers.

The design is **two-stage** because the lead source supplies company switchboard
numbers, not decision-maker numbers. Whoever answers is almost never the person
who can buy. Reaching them is a distinct task from selling to them, with
different economics, and it gets its own stage.

---

## States

```
        DIALING
           │ answered
           ▼
     ANSWERED_IDENTIFY ──── voicemail ──▶ VOICEMAIL ──▶ POST_CALL
           │                                     
     ┌─────┴──────┐
     │            │
     ▼            ▼
 GATEKEEPER    DM_ENGAGED ◀── transferred ── GATEKEEPER
     │                │
     │                ├── interested ──▶ HANDOFF ──▶ POST_CALL
     │                │                    │ no manager available
     │                │                    ▼
     │                └── later ──────▶ CALLBACK ──▶ POST_CALL
     │
     ├── DM contact captured ──▶ CLOSE ──▶ POST_CALL
     └── hard refusal ─────────▶ CLOSE ──▶ POST_CALL
```

Every state has exactly one mandatory property: **a way out**. A state with no
exit on silence, refusal or timeout is a QA veto condition.

---

## Time and model budget per state

Derived from `core/constraints.md`: ~97% of minutes occur in stages that
produce no lead, so the cheap tier must cover the high-volume path and the
strong tier engages only where value is created.

| State | Model tier | Soft budget | Hard cap | On cap |
|-------|-----------|-------------|----------|--------|
| `ANSWERED_IDENTIFY` | cheap | 8 s | 15 s | route to GATEKEEPER |
| `GATEKEEPER` | cheap | 30 s | **45 s** | force exit decision |
| `DM_ENGAGED` | **strong** | 120 s | 210 s | move to CALLBACK |
| `HANDOFF` | cheap | 20 s | 45 s | fall back to CALLBACK |
| `CALLBACK` | cheap | 25 s | 45 s | CLOSE with what is captured |
| `VOICEMAIL` | none (static) | per config | 20 s | hang up |
| `CLOSE` | cheap | 10 s | 15 s | hang up |

Hard caps are asserted in tests, not merely documented. A hard cap that exists
only in prose will be exceeded in production.

The transition `GATEKEEPER → DM_ENGAGED` is the only point where the strong
model is engaged. Engaging it earlier defeats the cost model.

---

## State definitions

### DIALING
Outbound attempt. Classify the outcome: answered · busy · no answer · invalid
number · carrier failure. Each maps to a distinct retry policy in config.
Never retry an invalid number.

### ANSWERED_IDENTIFY
One question only: *who is on the line?* Three outcomes — a gatekeeper, the
decision maker directly, or a machine.

Voicemail detection must resolve here and fast. Every second spent talking to
an answering machine is pure loss with no possible upside, which makes this
the cheapest optimisation in the system.

### GATEKEEPER
The highest-volume state and the dominant cost centre.

Goal, in priority order:
1. get transferred to the decision maker;
2. failing that, capture their name, role, and the best time to reach them;
3. failing that, exit fast.

**The exit-fast rule is load-bearing.** The agent must recognise a dead end and
leave. Persistence past the hard cap costs money on a call that was already
lost, and every extra second is spent on a conversation with a 97% chance of
producing nothing.

A refusal here is not a failure. Capturing a name on the way out converts a
worthless call into a tier-C outcome, and those accumulate into a
decision-maker database the original lead source does not contain.

### DM_ENGAGED
The only state where selling happens, and the only one worth spending on.

Sequence: confirm the right person → establish relevance → qualification
questions from config → handle objections → drive to an outcome. Qualification
criteria and objection content are supplied entirely by the vertical config.

The agent must be able to **lose gracefully**. An agent that cannot accept "no"
burns budget and damages the brand. A clean no is a valid, cheap outcome.

### HANDOFF
See `core/conversation/handoff.md`.

### CALLBACK
Capture a specific commitment — date, time, who calls whom. A vague "call
sometime later" is not a callback and must not be recorded as one; it is a
tier-C outcome at best.

### VOICEMAIL
Behaviour is config-driven: leave a short message or hang up silently. Default
is hang up — a message costs money on every unanswered call and its value is
unmeasured until proven otherwise.

### CLOSE
Short, courteous, invariant. Never re-open a pitch here.

### POST_CALL
Off-call, no latency constraint: transcript → summary → tier scoring → CRM
write → telemetry emission (duration by state, cost, outcome).

---

## Cross-cutting behaviours

### Interruption (barge-in)
The agent stops speaking the moment the caller starts. Mandatory in every
state. Tested mid-sentence, not only between turns — an agent that only yields
at turn boundaries reads as a recording and gets hung up on.

### Silence
Two escalating prompts, then exit. Never a third.

### Repetition
If the caller asks the same thing twice, the answer failed. Rephrase; do not
repeat verbatim.

### Identity
The agent states what it is when asked, without evasion. Config sets the
wording. Evasion is a Conversation Designer finding: it destroys the call and
the brand, and it does not survive contact with a suspicious gatekeeper.

### Emotion signals
Detect irritation, hurry, confusion. Response is behavioural, not verbal
sympathy: irritation → shorten and offer exit; hurry → compress to one
sentence and ask for a better time; confusion → restate the reason for calling
in plain terms.

### Memory
Within a call: everything. Across calls: prior outcome, decision-maker details,
refusals, agreed callbacks. A second call that does not know about the first is
a Conversation Designer finding — and on a small, finite list it is quickly
noticed by the person being called.
