# MVP Scope — pilot for tenant #1

> **Re-baselined.** The project is now a service sold to businesses — see
> `artifacts/PRODUCT.md`. Дніпрограф is customer number one and the pilot.
>
> The MVP itself is unchanged: numbers in, calls out, scored leads back. What
> changed is its purpose. It is no longer an internal tool but the proof that
> the service works on one real business before it is sold to a second.
>
> One addition follows from the new model: **per-tenant cost attribution must
> be built in from the start.** Under per-lead pricing we carry the cost of
> every failed call, so knowing which client is unprofitable is not reporting —
> it is the business. Retrofitting it means never knowing.

Client direction: build the dialer first. One thing, working end to end, before
anything is integrated around it.

> «Спершу треба зробити "Дзвонилку" систему, в яку будемо підгружати номери
> телефонів і вона буде дзвонити потенційним клієнтам і "перетворювати" їх в
> ліди. Я б назвав це менеджером з холодних продажів.» `[CLIENT]`

---

## In scope

```
список номерів  →  дзвінок  →  розмова  →  кваліфікація  →  лід
   (файл)                                                  (запис у системі)
```

1. **Import** — load a list of phone numbers with company details; normalise,
   validate, deduplicate, suppress.
2. **Dial** — outbound call within the configured window, retry by outcome.
3. **Converse** — the two-stage dialogue: identify who answered → gatekeeper →
   decision maker. Barge-in, silence handling, voicemail detection.
4. **Qualify** — the four quote parameters: product, quantity, deadline,
   artwork.
5. **Produce a lead** — transcript, summary, tier A/B/C/D/X, decision-maker
   contact, qualification answers, cost. Stored in the system's own store and
   exportable.

That is the whole MVP. It is a cold-calling manager: it dials, it talks, it
qualifies, it hands back a scored lead.

---

## Explicitly out of scope for now

| Deferred | Why |
|----------|-----|
| **KeyCRM integration** | `[CLIENT]` — skip for now. MVP writes leads to its own store; sync is added once the dialer works. Field mapping is not blocking anything until then. |
| **Warm transfer to a manager** | `[CLIENT]` — **not built until research says it is worth building.** See R6 in the research brief. |
| **Email channel** | `[CLIENT]` — disabled; the switch remains in config. |
| **Second vertical (SmartEcoPack)** | `[CLIENT]` — parked. |
| **Dashboards, queue-age monitoring** | Premature. Cost and outcome telemetry is emitted from the start, but nothing is built to display it until there is traffic to display. |
| **Recording retention policy** | `[CLIENT]` — deferred with CRM. Becomes blocking again at deployment, not before. |

Deferring is not deleting. Each of these has a config switch or an interface
already defined, so turning it on later is configuration rather than a rebuild —
that was the point of ADR-0001.

---

## What the MVP still requires

The dialer cannot be built without choosing what dials, listens, thinks and
speaks. That is P2. Concretely, before a line of code:

- a telephony provider that exposes **real-time media**, not merely call control
- streaming STT with Ukrainian
- interruptible streaming TTS with Ukrainian
- a cheap model for the gatekeeper stage and a strong one for the decision maker
- a total under the gate in `core/constraints.md`

---

## Definition of done for the MVP

- [ ] A list of numbers is imported, deduplicated, queued, and **tagged as a
      batch**, so conversion can be compared between segments
- [ ] Per-batch metrics are reported, not only aggregates — otherwise segment
      testing is impossible
- [ ] The system places calls only inside the calling window
- [ ] It reaches a decision maker or captures their contact, and knows which
- [ ] It extracts the four quote parameters when it gets that far
- [ ] Every call produces a scored lead record with a transcript
- [ ] Measured cost per answered call is compared against the gate
- [ ] It stops on the daily spend cap without being redeployed

Nothing here mentions a CRM, a manager, or an email. If the dialer does the
above, it works.
