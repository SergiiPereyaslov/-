# Handoff — transfer to a human, mechanism only

Triggered from `DM_ENGAGED` when the decision maker is engaged and a human
should take over. Warm transfer is preferred; a scheduled callback is the
fallback. Which managers exist, their numbers and their availability source
are supplied by config.

> **Status:** the client has confirmed the strategy (transfer first, callback
> as fallback) but has not yet supplied manager count, endpoints, or the
> availability signal. Those are open BLOCKERs — see
> `artifacts/OPEN-QUESTIONS.md`. This file defines the mechanism so the rest of
> the system can be built against it; it cannot be enabled until they land.

---

## Decision sequence

```
DM_ENGAGED — handoff condition met (from vertical config)
   │
   ├─ manager available?  ── yes ──▶ WARM TRANSFER
   │                       ── no  ──▶ CALLBACK SCHEDULING
   │
   └─ outside calling window ──────▶ CALLBACK SCHEDULING
```

The availability check must complete inside the `HANDOFF` soft budget of 20
seconds. If availability cannot be determined in that time, treat it as
unavailable and go to callback. Silence on the line while a lookup runs is
worse than a callback: the decision maker hangs up and the call is lost
entirely.

---

## Warm transfer

1. Tell the decision maker what is about to happen, in one sentence.
2. Bridge the call.
3. Confirm the human answered before releasing.
4. If the bridge fails or is not answered within the config timeout, **return
   to the live call** and go to callback. Never drop the decision maker into
   silence or into a dial tone.

The failure path matters more than the happy path. A failed transfer that
strands a genuinely interested decision maker destroys the most valuable
outcome the system produces, and it is the failure mode most often left
untested.

---

## Callback scheduling

Capture all four, or it is not tier A:

- date
- time (with timezone, always resolved to the caller's local time)
- who calls whom
- direct number to use

Offer concrete slots inside the calling window. Open-ended questions
("when suits you?") produce vague answers that cannot be scored or actioned.

Verify the captured time against the configured window before confirming. An
agreed callback outside working hours is a broken promise scheduled in advance.

---

## Config inputs required

```yaml
handoff:
  enabled: true | false
  condition: "<when to attempt handoff — from vertical config>"
  managers:
    - id: string
      endpoint: string          # SIP URI or E.164
      hours: "<schedule>"
  availability_source: static_schedule | pbx_api | queue_state
  bridge_timeout_seconds: integer
  announcement: "<one sentence to the decision maker>"
  fallback: callback
```

`availability_source` is the open question with the largest design impact.
A static schedule is trivial and often wrong. A live PBX or queue signal is
accurate but requires an integration that does not yet exist and may constrain
carrier choice — which means it must be settled during research (P2), not
after an architecture has been selected.

---

## Recording rules

Every handoff attempt is logged with outcome: transferred · bridge failed ·
no manager available · outside hours · decision maker declined transfer.

Bridge failure rate is a monitored metric. It degrades silently — nobody
reports a transfer that quietly failed, because the person it failed for is
gone.
