# Epistemic Protocol — how this project handles not knowing

Every unknown MUST be classified into exactly one of three tiers before any
dependent work continues. Misclassification is itself a defect, and any role
may raise it as BLOCKING.

The purpose of this protocol is to make "never invent" *workable*. A rule that
says only "always ask the client" produces an agent that asks two hundred
questions and delivers nothing. A rule that says only "use your judgment"
produces fabrication. The tiers separate the two.

---

## Tier 1 — BLOCKER

**Definition:** a fact only the client can supply. Internal, proprietary, or a
business decision.

Examples: API keys and credentials; margins and pricing; who the target
customer is; how many managers are available; which CRM pipeline to write to;
what counts as a qualified lead; contents of internal call recordings.

**Action:**
1. STOP work that depends on it.
2. Append to `artifacts/OPEN-QUESTIONS.md` — in Ukrainian, phrased so a
   non-technical reader can answer without research.
3. Continue any independent work that does not depend on the answer.
4. Report the blocker in the status message.

**Forbidden:** inventing a plausible value; "assuming for now" and proceeding;
burying the question in a long message where it will be missed.

---

## Tier 2 — RESEARCH

**Definition:** an externally verifiable fact. Someone outside this project
has published the answer.

Examples: vendor pricing; latency benchmarks; API rate limits; language and
voice support; SDK capabilities; concurrency limits; whether a provider
supports real-time media streaming for a given country.

**Action:**
1. Retrieve from the **primary source** — the vendor's own documentation or
   pricing page. Not a blog post, not a comparison article, not memory.
2. Record as: `claim | source URL | date accessed | confidence`.
3. Where a figure is a range or depends on plan, record the range and the
   conditions, not a single convenient number.

**Forbidden:**
- **Asking the client.** They have already stated they do not know vendor
  pricing. Asking wastes their time and produces a worse answer than looking
  it up.
- **Answering from model memory.** Vendor pricing and model lineups change on
  a monthly cadence; training data is stale by construction. A price recalled
  rather than retrieved is a fabrication even when it happens to be close.
- **Proceeding without live access.** If the runtime has no web access, the
  research phase is declared **BLOCKED**. Do not produce a comparison table
  from memory and label it research — that violates the project's central
  rule at the exact moment it matters most.

---

## Tier 3 — ASSUMPTION

**Definition:** professional judgment where a defensible default exists and
being wrong is recoverable.

Examples: expected average call duration before measurement; a default retry
cadence; an initial time budget for a dialogue state; log retention period.

**Action:**
1. Decide, and proceed.
2. Append to `artifacts/ASSUMPTIONS.md`:

```
ID:        A-00N
Assumption: <the assumption, stated as a falsifiable sentence>
Rationale:  <why this default>
Impact if wrong: <what breaks, how badly>
Invalidated by:  <what evidence would overturn it>
Review at:  <phase where it must be re-checked>
```

3. Re-check at the named phase. An assumption that reaches Deployment
   unreviewed is a QA veto condition.

**Forbidden:** using ASSUMPTION as a hiding place for a BLOCKER or a RESEARCH
item. The test: *could the client answer this?* → BLOCKER. *Could a vendor's
documentation answer this?* → RESEARCH. Only what neither can answer is an
assumption.

---

## Classification decision procedure

```
Is the answer internal to the client's business or a decision they own?
    YES → BLOCKER
    NO  ↓
Has someone outside this project published the answer?
    YES → RESEARCH
    NO  ↓
Is a defensible default available and is being wrong recoverable?
    YES → ASSUMPTION
    NO  → BLOCKER (escalate: the project cannot proceed responsibly)
```

---

## Prohibited outputs

Under no circumstances produce:

- a vendor price, tier, or per-minute rate not retrieved in this session;
- a latency figure not measured or not retrieved from a primary source;
- an API endpoint, parameter, or field name not verified in vendor docs;
- a conversion rate, connect rate, or funnel figure not supplied by the client
  or measured in a pilot;
- a legal or regulatory claim of any kind;
- a benchmark comparison presented as measured when it was estimated.

If a deliverable would require one of these and it is unavailable, the correct
output is the deliverable with an explicit gap marked
`TODO(RESEARCH)` or `TODO(BLOCKER)` — never a filled-in guess.

---

## Confidence labelling

Where a claim is retained with less than full confidence, label it inline:

- `[VERIFIED: <source>, <date>]` — retrieved from primary source this session
- `[CLIENT]` — supplied by the client
- `[MEASURED]` — observed in this system's own telemetry
- `[ASSUMPTION: A-00N]` — see ASSUMPTIONS.md
- `[UNVERIFIED]` — must not appear in a signed-off artifact

An artifact containing `[UNVERIFIED]` cannot pass a gate.

---

## Communication rule: never leave an evaluation implied

`[CLIENT 2026-08-05]` «це погано чи добре. Завжди пояснюй»

Raised against a real lapse. Reporting the messenger decision, the agent wrote:

> «Я планував зміцнювати найслабше місце — ви його прибрали.»

True, and useless as written. It reads as praise, as self-criticism, or as a
neutral remark depending on the reader, and the client had to ask which was
meant.

**Rule.** Any statement carrying an evaluation must say, in the same breath,
**whether it is good or bad, and for whom**. This applies to:

- comparisons between what was planned and what happened
- notes about who found a problem or a solution
- schedule and estimate changes
- anything phrased as an observation but functioning as a judgement

A rhetorical flourish that leaves the reader guessing is a defect, not style.
It costs a round trip and, worse, invites the client to assume the least
flattering reading.

---

## Design rule: question the requirement before engineering around it

The same episode produced a lesson worth keeping, because the failure was real
even though the outcome was good.

The agent identified email capture over 8 kHz as the riskiest operation in the
product and moved directly to mitigation: read-back, a spelling alphabet,
confidence thresholds. All sound. All aimed at the wrong question.

The client asked the question one level up — **does it have to be email at
all?** — and the answer removed the operation entirely, because the phone
number was already known.

> **Mitigating a problem is worth less than deleting it. Before designing a
> defence, ask whether the requirement that creates the risk is real.**

This failure mode is specific and recurring: efficiently solving a problem that
did not need to exist. It is invisible from the inside, because the mitigation
work looks competent and progresses normally.

Practical trigger — whenever something is identified as *the hardest part* of a
design, that is the signal to challenge the requirement behind it before
building the defence, not after.

### Corollary about where good ideas come from

The client saw it because they know how their customers actually communicate;
the agent did not because it was reasoning inside the frame it had been given.
That division is expected and healthy. **If the agent were producing all the
good ideas, that would be the warning sign** — it would mean the design was
being driven by what is technically convenient rather than by how the business
works.
