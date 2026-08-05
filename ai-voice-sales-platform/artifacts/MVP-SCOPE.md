# MVP Scope — Дніпрограф calls on its own

**The goal, stated by the client and now the single measure of done:**

> «Потрібно створити так, щоб Дніпрограф зміг телефонувати. Це основне — щоб
> Дніпрограф не залежав, і щоб була жива модель, а не робот. Модель, яка
> постійно навчається.» `[CLIENT]`

Three requirements, in the client's own order of importance:

1. **Дніпрограф can call.** Independently, without a service provider in the
   loop.
2. **A live model, not a robot.** Conversation, not a decision tree.
3. **It keeps improving**, and changing the script costs nothing. See
   `core/learning-loop.md`.

Selling this to other businesses (`artifacts/PRODUCT.md`) remains the direction
of travel, but it is explicitly **not** what the MVP is for. Multi-tenancy,
billing and per-tenant cost attribution are deferred until Дніпрограф is calling
and the numbers are real.

> The build itself is unchanged: numbers in, calls out, scored leads back. What
> changed is what it must prove — independence and improvement, not just
> function.

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
4. **Secure a commitment** — `[CLIENT 2026-08-05]` one of three exits, each
   ending in a captured value: meeting (time), offer (email), callback (time).
   The agent does not compute quotes and does not collect a spec as a
   condition. Qualification questions enrich the lead; they no longer gate it.
   See `core/conversation/commitment.md`.
5. **Produce a lead** — transcript, summary, tier A/B/C/D/X, the exit and its
   captured value, decision-maker contact, whatever qualification answers were
   gathered, cost. Stored in the system's own store and exportable.
   Non-successes carry a **reason code**, not a bare «не цікаво».

That is the whole MVP. It is a cold-calling manager: it dials, it talks, it
turns a cold lead into a warm one, and it hands back a commitment with a date
on it.

---

## Web interface — in scope, minimally

`[CLIENT]` The platform has a web interface. For the MVP it is the thin layer
that makes the dialer usable by a person rather than a terminal:

1. **Upload a list** — file in, batch labelled, validation and duplicates shown
2. **Campaign control** — start, pause, stop; current state and today's spend
3. **Calls** — list with outcome, tier, duration, cost; transcript and recording
   for each
4. **Leads** — the scored results, filterable, exportable
5. **Per-batch comparison** — the numbers that make КВЕД testing possible
6. **Config editing** — the vertical config through a form rather than YAML,
   with every change versioned

Item 6 is the one that matters most and is easiest to under-build. It is the
answer to paying $250 for a script change: the wording, the objections and the
qualification questions must be editable by the client, with the version
recorded against every call that used it (see `core/learning-loop.md`).

Explicitly not in the MVP interface: user management beyond a single login,
tenant switching, billing, dashboards beyond the numbers listed above.

## Explicitly out of scope for now

| Deferred | Why |
|----------|-----|
| **KeyCRM integration** | `[CLIENT]` — skip for now. MVP writes leads to its own store; sync is added once the dialer works. Field mapping is not blocking anything until then. |
| **Warm transfer to a manager** | `[CLIENT]` — **not built until research says it is worth building.** See R6 in the research brief. |
| **Email channel** | `[CLIENT]` — disabled; the switch remains in config. |
| **Second vertical (SmartEcoPack)** | `[CLIENT]` — parked. |
| **Queue-age monitoring, analytics dashboards** | Premature. Cost and outcome telemetry is emitted from the start, but nothing elaborate is built to display it until there is traffic to display. |
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
- [ ] Every call records the **config version** in force, so a change in results
      can be attributed to a change in configuration
- [ ] Changing the script, an objection, or the wording is a config edit —
      minutes, no cost, revertible

Nothing here mentions a CRM, a manager, or an email. If the dialer does the
above, it works.
