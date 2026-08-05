# The commitment — core mechanism

`[CLIENT 2026-08-05]` The agent's job is to turn a cold lead into a warm one,
and nothing else:

> «LeadRadar повинен гарно продати, але він не повинен рахувати… телефонує,
> збирає інформацію, призначає зустріч ліда з менеджером або домовляється, що
> менеджер йому надішле пропозицію або, якщо ліду незручно розмовляти, фіксує,
> коли передзвонити.»

This file is core because the mechanism is identical for every vertical. What
is being sold changes; the shape of a successful ending does not.

---

## The three exits are one thing

| Exit | What is agreed | The value that must be captured |
|---|---|---|
| `book_meeting` | менеджер поговорить із лідом | **date + time** |
| `send_offer` | менеджер надішле пропозицію | **consent + channel** (number already known) |
| `call_back` | передзвонити пізніше | **date + time** |

Read the right-hand column. Three different conversations, one mechanism:

> **A successful call ends with a named next step, a captured value, and a
> person attached to it.**

Everything else in the dialogue exists to reach that sentence.

This is worth stating plainly because it is what makes «максимально просто»
achievable. The agent is not deciding among many possible endings. It is
steering toward one of three, all of which have the same shape.

### The tier system already matched this

`scoring-engine.md` defines tier A as «specific commitment: a date, a time, a
named person on both sides». That is exactly the exits above. **The tiers do
not change.** What changed is the *gate*: qualification fields no longer decide
whether a lead is passed on. The commitment does.

---

## The hard part is not the selling

All three exits terminate in capturing **one precise value over an 8 kHz line**.
`AUDIO-ANALYSIS.md` established the channel is narrowband telephony, so capture
accuracy — not persuasion — is the critical path.

### `send_offer`: the messenger removes the hardest problem entirely

`[CLIENT 2026-08-05]` «можна замінити пошту на телеграм/вайбер/ватсап»

Correct, and the gain is larger than it looks. An email spelled aloud — latin
letters named in Ukrainian over 8 kHz — was the single most error-prone
operation in the product. A messenger deletes it, because:

> **We already have the number. We just dialled it.**

The capture collapses from a spelled string to a yes/no:

```
   «Скину вам у Вайбер на цей номер, добре?»            → boolean
```

Nothing to mis-hear. This is the largest single reduction in technical risk
available to us, and it came from the client.

**Two caveats that shape the implementation.**

1. **Telegram cannot be pushed to.** A Telegram bot cannot start a conversation
   — the user must message it first. That is a platform anti-spam rule, not
   something to engineer around. Telegram is therefore an *inbound* channel
   only: the agent can invite («напишіть нам у телеграм»), which reverses the
   direction and loses most leads. Do not offer it as the primary.
   `[SEARCH: core.telegram.org/bots/faq, 2026-08-05]`

2. **WhatsApp needs opt-in and pre-approved templates** for business-initiated
   messages, and cold sends risk the number being blocked. **Viber Business
   Messages** is the practical Ukrainian channel, sold with automatic **SMS
   fallback** when Viber does not deliver — TurboSMS, AlphaSMS and eSputnik all
   offer it behind one API. Indicative: ~0.63 UAH per Viber transactional
   message, ~0.98 UAH per SMS.
   `[SEARCH: turbosms.ua/price, 2026-08-05]`

**MVP decision:** the agent captures *consent + channel*; the **manager sends**,
exactly as the existing `[CLIENT]` rule requires — «агент не надсилає нічого
сам, він ставить задачу менеджеру». Automated sending needs an approved sender
and message templates, which is a separate integration and does not belong in
the pilot.

**When a different number is needed** — the dialled line is a switchboard, or
the decision maker is on a mobile — we fall back to capturing digits. Still far
safer than latin letters, and the read-back rule below applies. Email stays
available for the minority who ask for it, but it is no longer the default.

### `book_meeting` / `call_back`: a concrete time, never a vague one

`[CLIENT 2026-08-05]` «треба щоб агент фіксував конкретний час»

Accepted as a hard rule. «Після обіду», «десь після третьої», «краще зранку
десь у четвер» are **not** valid captures and must not close a call.

The mechanism is to **propose, not parse**. Offering two concrete slots is both
more reliable technically and better salesmanship than an open question:

```
   «Вівторок о 14:00 чи о 16:00 — як вам зручніше?»
```

Rules:

- the result must resolve to a **date + time** in `Europe/Kyiv`
- it must fall inside the configured calling window (`platform.yaml`), so the
  agent never books a slot the managers do not work
- a vague answer gets one narrowing attempt, then a proposed slot
- if the lead still will not name a time, this is **not** `book_meeting`. It is
  tier B with a reason code — interest without a commitment

An agent that persuades beautifully and then records «якось на тижні» has
produced a task nobody can action.

---

## Rule: read it back

**Mandatory, core, not configurable.** Before ending on any exit, the agent
repeats the captured value and waits for confirmation.

```
   «Записую: четвер, друга година дня, і я передам Олені Петрівні. Все вірно?»
   «Скидаю у Вайбер на цей номер, 067-123-45-67 — правильно?»
```

Three reasons this is a core rule rather than a nice touch:

1. It converts a silent capture error into a caught one, at the only moment it
   is still cheap to fix.
2. A wrong read-back gives the correction *in context*, which is far easier to
   recognise than the original.
3. It is what a competent salesperson does, so it costs nothing in naturalness
   and buys credibility.

An exit recorded **without** a confirmed read-back is marked low-confidence and
does not count as tier A.

---

## The fourth exit the client did not list

Three exits are the successes. There is a fourth ending — **the reasoned no**
— and it is worth building because it costs one question and compounds.

«Не цікаво» is not a reason. These are:

| Reason | What it means for the база |
|---|---|
| `own_printing` | має власну друкарню — ніколи не передзвонювати |
| `has_supplier` | є постачальник, влаштовує — передзвонити через N місяців |
| `no_need` | не друкує взагалі — виключити |
| `not_dm` | не той, хто вирішує — **не відмова**, шукати ОПР |
| `out_of_scope` | пакування / тканина — дискваліфікація за конфігом |
| `bad_timing` | не зараз, без конкретики — ретрай |
| `hostile` | → tier X, suppress |

Without this, «не цікаво» becomes a bucket, and the база never improves — which
is precisely how KeyCall accumulated 5,288 undifferentiated rejections that
nobody could act on (`KEYCALL-BASELINE.md`). The reason code is what makes the
second campaign cheaper than the first.

`not_dm` deserves separate emphasis: it is filed under refusal by almost every
scripted system, and it is not a refusal at all. It is a routing instruction.

---

## Anti-gaming, restated for commitments

`scoring-engine.md` warns that a metric treating unequal outcomes equally will
be optimised for the cheapest one. Under per-lead pricing the risk sharpens:

> If a lead is «a booked meeting», the agent learns to book meetings that do
> not happen.

Booking is free to the agent and expensive to the client. So the KPI is not
commitments made — it is **commitments kept**:

- did the meeting actually take place?
- did the emailed offer get a reply?
- did the callback connect?

This requires one outcome field per task, filled by the manager who worked it.
It is a small addition to the interface and the only thing that keeps the
headline number honest. Without it, «leads delivered» measures the agent's
optimism rather than the client's revenue.

**Billing consequence** (open, for the pricing decision in `PRODUCT.md`): a
kept-commitment definition is defensible to a customer auditing their invoice.
A booked-commitment definition is not, and it is the same argument we make
against KeyCall's «успішна розмова».

---

## What «гарно продати» means mechanically

Not general persuasiveness. On a 29-second cold call it is three things:

1. **A reason to keep listening**, delivered in the first sentence.
2. **The top objections handled** — and those come from Дніпрограф's own
   recordings, not from imagination. They live in the vertical config.
3. **Asking for the commitment explicitly.** The commonest failure of a polite
   agent is a pleasant conversation that ends without asking for anything.

Only the first and third are core. The second is config, and it is the part
that improves every week — for free, per `constraints.md`.

---

## Simplicity: whose?

«Максимально простим» applies to the **conversation**, not to the system.

- The call has one goal and three exits. That is the simplicity the lead feels.
- The config behind it stays rich — objections, reason codes, retry policy —
  because that is what the client edits to improve results.

Collapsing the second in the name of the first would reproduce KeyCall's
tree: simple to look at, impossible to improve.
