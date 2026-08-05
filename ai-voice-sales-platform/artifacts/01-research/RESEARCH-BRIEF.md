# P2 — Market Research Brief

**Status:** NOT STARTED. This file is the specification for the phase, not its
output.

**Hard precondition:** live access to primary sources. Without it, P2 is
declared **BLOCKED**. Producing a comparison table from model memory would
violate `core/epistemics.md` at the exact point where the rule matters most —
vendor pricing and model lineups change monthly, so a recalled figure is a
fabrication even when it happens to be close.

### Access reality in this environment — measured 2026-08

| Channel | Status |
|---------|--------|
| `curl` to vendor hosts | **blocked** — gateway rejects CONNECT for every vendor tested |
| WebFetch on vendor pages | **blocked** — 403 |
| WebSearch | **works**, returns figures with source URLs |

Consequence: research proceeds, but figures come from **search results citing
vendor pages**, not from reading those pages directly. This is weaker evidence
than a primary-source read and must be labelled as such.

Confidence labels for this phase:
- `[SEARCH: <url>, <date>]` — figure obtained via search citing that page;
  good enough to shortlist, **not** good enough to sign a contract on
- `[VERIFIED: <url>, <date>]` — page read directly (currently unavailable)

Any stack shortlisted on `[SEARCH]` evidence alone carries a mandatory
follow-up: confirm pricing directly with the vendor before committing. State
this in the shortlist rather than quietly treating search figures as verified.

---

## The question P2 must answer

> Can a Ukrainian-language outbound voice stack — telephony + STT + LLM + TTS
> + hosting — be assembled for **≤ $0.09 per minute all-in**, with a hard
> cutoff at $0.14/min, while supporting real-time media, barge-in and warm
> transfer at 1–2 concurrent lines?

If the answer is no, that is the finding. It is reported as such, not
engineered around with an architecture that quietly exceeds the gate.

---

## Blocking research questions

These are ordered by how much they constrain everything downstream.

### R1 — Which carriers can place outbound calls to Ukraine with a local caller ID?

Under what verification or documentation requirements? Include both global
providers and Ukrainian operators.

### R2 — Which of those expose a real-time media stream?

**This is the decisive constraint.** A live voice agent needs bidirectional
audio in real time — typically a media WebSocket or SIP media access. Many
telephony platforms expose only call *control* (dial, transfer, hang up) plus
recording. Such a provider **cannot run this system at all**, regardless of
price, coverage or local presence.

The plausible failure mode to test explicitly: local Ukrainian providers may
integrate well with local numbering while lacking real-time media APIs, and
global providers may offer real-time media while restricting Ukrainian
outbound or local caller ID. Confirm rather than assume; this is precisely the
kind of claim that must not be answered from memory.

### R3 — Ukrainian language quality

For STT: streaming recognition, partial results, accuracy on Ukrainian
business speech, behaviour on Ukrainian–Russian code-switching, which is
common in Ukrainian commercial conversation.
For TTS: natural Ukrainian voices, streaming synthesis, and — critically —
**interruptible** synthesis. A TTS that cannot be cut off mid-utterance cannot
support barge-in, and an agent that talks over its caller gets hung up on.

### R4 — Cheap-tier model viability

Assumption A-004 holds that a cheap fast model can handle gatekeeper
navigation. Establish which models are candidates, their streaming latency and
their per-token cost. If no cheap tier is meaningfully cheaper for this
workload, the primary cost lever is gone and P3 must be re-planned.

### R7 — What does the market pay for a cold-call lead?

Added by the product re-baseline (`artifacts/PRODUCT.md`). Monetisation is per
successful conversation, so the gate now needs an **upper** reference as well as
a lower one: without a price, margin cannot be computed.

Establish:
1. What KeyCall and comparable Ukrainian services charge per successful
   conversation or lead. Published rates if any; otherwise the shape of the
   pricing, e.g. per-lead vs per-brief vs minimum campaign.
2. Whether they charge a setup fee, a minimum campaign size, or a prepayment —
   this is how a per-lead service protects itself from a client whose offer does
   not convert, and we need the same protection.
3. What comparable services charge outside Ukraine, as a ceiling reference for
   a higher-quality product.

**Note the constraint this sits under.** Our cost per lead for Дніпрограф is
about $6.98 at present figures. If the market rate is near that, the model does
not work at 2.5% conversion and either the price, the conversion, or the cost
has to move. Establish the number before designing around it.

### R6 — Is immediate warm transfer worth building at all?

`[CLIENT]` asked this directly: research whether transferring to a manager
mid-call is worth it, rather than assuming it.

The question is not technical feasibility — most platforms support transfer.
It is whether it pays here, given this project's specific numbers: 2.5 leads a
day, a shared task queue with no named owner, and managers who are not sitting
waiting for calls.

Establish:
1. What transfer costs to build and operate: availability signalling, bridge
   handling, the failure path when nobody answers. Note that a live PBX
   availability signal may **constrain carrier choice**, so this interacts with
   R1 and R2 — it cannot be settled after the stack is picked.
2. What the alternative costs: a `call_back` task in the queue, actioned by a
   manager later.
3. Evidence on whether immediate transfer converts materially better than a
   prompt callback in outbound B2B. Look for published data; where none exists,
   say so rather than asserting a number.
4. The failure mode: a botched transfer strands the single most valuable
   outcome the system produces. At 2.5 leads a day, losing one to a failed
   bridge is a large proportional loss.

**Default position pending evidence:** callback via task queue, since it is
already built into the promise-to-task mechanism, has no bridge to fail, and
imposes no constraint on carrier selection. Transfer must earn its place.

### R5 — Fixed versus variable cost at this volume

~2,100 calls/month. Self-hosted stacks spread fixed cost — servers, setup,
maintenance — over very little traffic. Every option must be modelled as
`fixed/month + per-minute × projected minutes`, never per-minute alone.

An earlier working hypothesis that a low per-minute self-hosted stack would win
was formed at a 1,000 calls/day assumption and **does not survive the revision
to 100/day**. At this volume a managed platform may well win despite a higher
per-minute rate. Enter this phase with no favourite.

---

## Vendors in scope

Minimum set: **Vapi · Retell · Bland · Twilio · LiveKit · Pipecat ·
ElevenLabs · OpenAI Realtime · Deepgram · Cartesia**, plus Ukrainian carriers
relevant to R1/R2.

## Comparison matrix — required columns

Every cell carries `source URL` and `date accessed`. A cell that cannot be
sourced is marked `TODO(RESEARCH)`, never filled with a plausible value.

| Column | Notes |
|--------|-------|
| Pricing model | per-minute, per-token, per-character, subscription, or mixed |
| Cost at 2,100 calls/mo | fixed + variable, computed |
| Latency | published or measured; state which |
| Ukrainian STT | streaming? partials? |
| Ukrainian TTS | voices available? interruptible? |
| Real-time media | **pass/fail — a fail eliminates the vendor** |
| Barge-in support | |
| Warm transfer | |
| Concurrency at 2 lines | and pricing implications |
| Self-host option | |
| Lock-in | effort to migrate away |

---

## Deliverables

1. `01-research/COMPARISON.md` — the sourced matrix
2. `01-research/SHORTLIST.md` — 2–3 candidate stacks, each with a full cost
   model at baseline and pessimistic conversion
3. `01-research/FINDINGS.md` — answers to R1–R5, and anything that invalidates
   an entry in `ASSUMPTIONS.md`
4. ADRs for any decision reached

## Exit criteria

- [ ] No `[UNVERIFIED]` cells in the shortlist
- [ ] R1 and R2 answered with primary sources
- [ ] Every shortlisted stack costed at baseline **and** pessimistic
- [ ] At least one option clears the gate — or the failure stated plainly
- [ ] Signed by: Architect, Telephony Engineer, Voice Engineer
