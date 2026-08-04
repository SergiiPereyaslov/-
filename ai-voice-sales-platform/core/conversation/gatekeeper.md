# Gatekeeper Navigation — mechanism only

The lead source provides switchboard numbers. The person who answers is a
receptionist, an office manager, a secretary, or whoever happened to be near
the phone. They cannot buy anything, and their job includes filtering out
calls like this one.

This state carries roughly 97% of the platform's minutes and produces none of
its leads directly. It is therefore optimised for **speed of resolution**, not
for persuasion.

---

## Objectives, in strict priority order

| Priority | Objective | Outcome tier |
|----------|-----------|--------------|
| 1 | Transfer to the decision maker now | proceeds to `DM_ENGAGED` |
| 2 | Capture name + role + best time to call | **C** |
| 3 | Capture role only, no name | partial C |
| 4 | Exit fast, having spent under the cap | no cost overrun |

Objective 2 is the one most often skipped by human callers and is where the
automated system has a structural advantage: it never finds the question
tedious and never decides it is not worth writing down.

---

## Approach

**Be direct about the reason for calling.** Manufactured familiarity
("is Oleh in?") is transparent to anyone who does this all day, and burns the
call when it fails. The vertical config supplies a one-sentence reason;
deliver it plainly.

**Ask for the role, not a person.** The agent does not know who handles this.
Asking for the responsible role is answerable — the gatekeeper knows the org
chart and does not have to guess who you mean.

**Never argue.** The gatekeeper's refusal is not a negotiating position, it is
their job description. Arguing extends a call that is already lost.

**Always attempt the name capture on exit.** Even on refusal, one short
question. A refused call that yields "закупівлями займається Іванова Ольга
Петрівна" is worth materially more than a refused call that yields nothing,
and it costs three seconds.

---

## Exit decision

Evaluated continuously; forced at the 45-second hard cap.

| Signal | Action |
|--------|--------|
| Offer to transfer | accept immediately, stop talking |
| Decision maker named | capture, then ask for direct line or best time |
| "Send it by email" | config decides: capture address as tier C, or decline |
| "We already have a supplier" | one calibrated question from config, then exit |
| "Not interested" ×2 | exit, attempt name capture on the way out |
| Hostility | exit immediately, no name attempt, flag for suppression |
| Wrong number / no such org | exit, mark record invalid, suppress from retries |
| Hard cap reached | exit with whatever has been captured |

**Two refusals is the limit.** A third attempt does not convert; it converts a
neutral outcome into a complaint.

---

## What must never happen here

- Pitching the product. The gatekeeper cannot buy it, and pitching signals
  that the agent has misread the situation.
- Requesting a decision. They are not empowered to make one.
- Exceeding the hard cap. This is the single largest controllable cost in the
  system.
- Recording "will call back" as a callback. That is a brush-off, not a
  commitment.
- Engaging the strong model. If the conversation genuinely warrants it, the
  correct move is to transition to `DM_ENGAGED`, not to upgrade in place.

---

## Config inputs required

The vertical config must supply:

```yaml
gatekeeper:
  reason_for_call: "<one sentence, plain speech>"
  target_roles: ["<role>", "<role>"]      # who to ask for, by function
  on_send_by_email: capture | decline     # email channel may be disabled
  existing_supplier_probe: "<one question>"
  identity_disclosure: "<what the agent says when asked what it is>"
```

Anything absent must fail loudly at config validation. A gatekeeper prompt
assembled from missing fields produces a call that wastes money and cannot be
diagnosed afterwards.
