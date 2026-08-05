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
| `book_meeting` | менеджер поговорить із лідом | **time** |
| `send_offer` | менеджер надішле пропозицію | **email** |
| `call_back` | передзвонити пізніше | **time** |

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

All three exits terminate in capturing **one precise value over an 8 kHz line**:
a time, or an email address.

`AUDIO-ANALYSIS.md` established the channel is narrowband telephony. Against
that, the riskiest moments of the entire product are:

- **an email spelled aloud in Ukrainian** — «ес-ем-ай-ті собака…», letter by
  letter, latin letters named in Ukrainian, over 8 kHz. This is the single
  most error-prone operation in the system.
- **a time** — «у вівторок після обіду», «десь після третьої», «краще зранку
  в четвер». Relative, vague, and requiring a calendar to resolve.

An agent that persuades beautifully and then writes down the wrong address has
produced nothing. Worse than nothing: a manager spends time on a dead task and
the lead concludes nobody called back.

**Therefore: capture accuracy is the critical path, not persuasion.** It is
where the engineering effort goes, and it is why the STT test scores digits and
spelling above everything else (`STT-TEST.md`).

---

## Rule: read it back

**Mandatory, core, not configurable.** Before ending on any exit, the agent
repeats the captured value and waits for confirmation.

```
   «Записую: четвер, друга година дня, і я передам Олені Петрівні. Все вірно?»
   «Пошта — office@dniprograf.ua, я правильно почув?»
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
