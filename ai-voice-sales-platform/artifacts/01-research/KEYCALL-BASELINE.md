# KeyCall baseline — Дніпрограф's own two years of data

Source: five screenshots of `client.keycall.pro`, Дніпрограф's account,
supplied by the client 2026-08-05. This is not competitor marketing. It is the
pilot customer's real funnel on the real target audience, and it replaces
several assumptions that were until now guesses.

**This supersedes the estimated funnel in `00-discovery/DISCOVERY.md`.**

---

## The account

| Project | ID | Created | State |
|---|---|---|---|
| База існуючих клієнтів | 1176 | 16 Apr 2024 | no productive campaigns, ever |
| Холодна база | 1214 | 11 Jun 2024 | 15,732 dials, **dormant** |
| NPS-опитування | 1427 | 04 Sep 2025 | 3 campaigns, 84–90% reach |

Balance 3,774 UAH. Project manager assigned (agency model confirmed —
the client does not self-serve).

---

## The cold-calling funnel, measured

Project 1214, lifetime:

```
15,732  набрано
        ├─  7,899  не беруть слухавку      50.2%
        ├─    684  автовідповідач           4.3%
        └─  7,131  підняли слухавку        45.3%   ← the only calls that cost money
```

Of the 7,152 categorised answers:

| Category | n | % of answered |
|---|---:|---:|
| не цікаво | 5,288 | 73.9% |
| сбросив | 1,001 | 14.0% |
| **дзвінок менеджера** | **294** | **4.1%** |
| актуально пізніше | 176 | 2.5% |
| передзвонити пізніше | 173 | 2.4% |
| задавали питання | 94 | 1.3% |
| вже є | 84 | 1.2% |
| видалити номер | 30 | 0.4% |
| відправити на пошту | 12 | 0.2% |

### Conversion

- **Hard lead** (`дзвінок менеджера`): 294 → **1.87% of dials, 4.1% of answers**
- **Broad warm** (+ актуально пізніше, передзвонити пізніше, задавали питання,
  відправити на пошту): 749 → **4.76% of dials, 10.5% of answers**

### Unit economics `[DERIVED — assumption flagged]`

At the 4.5 UAH per connection already on file, and taking "connection" to mean
an answered call:

```
7,131 × 4.5 UAH  =  32,090 UAH  ≈  $773   (за ~41.5 UAH/USD)

per дзвінок менеджера   32,090 / 294  =  109 UAH  ≈  $2.63
per broad warm lead     32,090 / 749  =   43 UAH  ≈  $1.03
```

**Assumption to confirm with the client:** that 4.5 UAH/connection applied
across the whole two-year history, and that KeyCall bills per answered call
rather than per "successful conversation" as their site claims. If they bill
only on the 749 warm outcomes, the effective rate is very different. The
**Фінанси** tab in the cabinet settles this — one screenshot closes it.

### What this does to our pricing

The `$7/lead` ceiling in `core/constraints.md` was set without a market
reference. Now there is one, and it is **$2.63**.

This does not mean we must charge $2.63. The units are not the same thing:

| | KeyCall lead | LeadRadar lead |
|---|---|---|
| Content | «так, хай передзвонять» | тираж, терміни, продукт, макет |
| Next step | менеджер починає з нуля | менеджер має бриф і рахує |
| Auditable | ні | транскрипт + запис |

We sell a qualified brief; they sell a raised hand. But **$2.63 is now the
number in the client's head**, and any price we name is measured against it.
That belongs in the pricing decision, not discovered during it.

---

## The two findings that matter more than any percentage

### 1. The project is dead

`сьогодні 0 · за тиждень 0 · за місяць 0`. The last campaign is labelled
`04.02_ua` and reached 110/191. The last script version is dated **13.08.2024**
— two years untouched, though all three versions are marked «Узгоджено».

Дніпрограф bought this, ran it, and stopped. That is a harder verdict than any
conversion rate, and it is the actual brief for LeadRadar: not «зробити
дешевше», but «зробити те, чим користуватимуться далі ніж півроку».

### 2. The client already diagnosed the failure — in KeyCall's own comment box

Three comments, all 16 Mar, all still showing «Відповісти» — unanswered:

> «Тут теж така ситуація, що ми чогось не зрозуміли і в кусти. Треба передавати
> контакти менеджерам. **Також бот не завжди може розпізнати коли люди щось
> говорять.**»

> «Тут треба переробити. **Не можна кидати людину.**»

> «Тут не треба питати. Для більш детальної консультації я передам ваш контакт
> провідному фахівцю…»

This is pastka №4 from `STT-GUIDE.md` — end-of-turn detection — reported by the
customer in plain language, without knowing it had a name. The bot cannot tell
whether a person has finished speaking, so it bails to a default branch.

**Therefore the 5,288 «не цікаво» is not a measurement of demand.** It is
demand plus every call the bot mishandled, and the two are not separable from
this interface. Nobody knows the real split — including KeyCall.

That unknown is the size of our prize. If even a fifth of «не цікаво» is bot
failure rather than genuine rejection, the reachable lead pool is roughly five
times the 294 KeyCall found.

---

## The script tree, as a picture

Screenshot 5 is the argument for our product, drawn by the competitor:
`Hello → Main` → twelve branches (`yes`, `no`, `any`, `later`, `robot`,
`delete`, `question`, `where`, `act_later`, `client_jet`, `who`) → three
converging nodes → a hairball of crossing edges and faded duplicate nodes,
unreadable at full zoom.

Every real conversation must be forced down one of those twelve paths. `any` is
the confession: a branch for «сказали щось, чого ми не передбачили».

**LeadRadar has no such screen, because it has no such tree.** That is not a UI
improvement — it is the product difference, and it is why the script editor in
our scope is a form of instructions and objections, not a graph editor.

---

## What their interface does not let you do

Directly observed, and each one is a requirement for ours:

| KeyCall | Consequence | LeadRadar requirement |
|---|---|---|
| **Аналітика** menu item is greyed out | the analytics screen does not exist for this customer | analytics is the main screen, not a locked tab |
| Donuts only; no drill-down | «5,288 не цікаво» cannot be opened | **every number clicks through to the calls behind it** |
| No transcript or recording visible anywhere | a category cannot be checked | transcript + recording on every single call |
| Feedback lives in comments on a script node, dated Mar, unanswered | changing anything routes through a project manager | the client edits config directly, versioned |
| No per-campaign comparison | КВЕД / batch testing impossible | per-batch comparison in MVP scope |
| **Повідомлення** greyed out | no in-product channel | — |

The first three are one requirement wearing three hats: **an aggregate you
cannot open is not a measurement, it is a claim.** KeyCall's own UI is what
prevented Дніпрограф from ever discovering finding №2 themselves — they found
it by ear, in a comment box, and nobody answered.

---

## What to ask the client next

1. **Screenshot of Фінанси** — settles the billing basis and the true $/lead.
2. **Do KeyCall recordings exist and can they be exported?** 7,131 answered
   calls to exactly our target audience is a better STT test set than 3–5
   manager calls, and it is already paid for. This is now the top ask.
3. **Screenshot of the Бази tab** — shows what fields they carry per contact,
   i.e. the minimum import schema.
4. **A «не цікаво» call and a «дзвінок менеджера» call, listened to end to
   end** — to estimate the misclassification rate by hand.
