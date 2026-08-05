# P2 — Findings (preliminary)

**Status:** in progress. Every figure here is `[SEARCH]` — obtained from search
results citing vendor pages, not from reading those pages directly, because
this environment blocks direct access. None of it is contract-grade. See
`VERIFY-CHECKLIST.md`.

**Gate for reference** (`core/constraints.md`, ceiling raised to $7/lead):
target ≤$0.10/min · planning ≤$0.13/min · hard cutoff >$0.19/min, all-in.

---

## The headline finding: the binding constraint is probably not price

Going in, the assumption was that cost would decide the stack. On the evidence
so far it may not be. **Ukrainian speech recognition is the tighter constraint.**

Ukrainian text-to-speech is in good shape — ElevenLabs Flash v2.5 explicitly
supports Ukrainian at ~75 ms latency, which is exactly the profile a live agent
needs. `[SEARCH: elevenlabs.io/blog/meet-flash, 2026-08-05]`

Ukrainian speech-to-text is where it gets uncomfortable. Deepgram's Nova-3 is
described as supporting 50+ languages, but their **Flux** model — the one built
specifically for conversational, real-time recognition — is documented for
English, Spanish, German, French, Hindi, Russian, Portuguese, Japanese, Italian
and Dutch. **Ukrainian is not on that list.**
`[SEARCH: developers.deepgram.com/docs/language, 2026-08-05]`

That distinction matters more than it looks. A general transcription model and
a conversational model are not interchangeable: the conversational one is tuned
for turn-taking, endpointing and partial results — the things that make an
agent feel like a person rather than a walkie-talkie. If Ukrainian is only
available on the general model, expect worse turn detection and higher latency.

**This is now the first question of the phase**, ahead of pricing. A stack that
costs $0.05/min and mishears Ukrainian is worth nothing; a stack at $0.15/min
that understands people is worth negotiating for.

---

## Component figures gathered

### Speech-to-text

| Provider | Figure | Ukrainian | Note |
|---|---|---|---|
| Deepgram streaming | $0.0077/min PAYG | **unconfirmed** — absent from Flux language list | `[SEARCH: deepgram.com/pricing]` |
| OpenAI | not retrieved | not retrieved | check manually |
| Google STT | not retrieved | not retrieved | check manually |
| AssemblyAI | not retrieved | not retrieved | check manually |

At $0.0077/min, STT is roughly 6% of the planning budget. Cost is not the issue
here — availability and quality are.

### Text-to-speech

| Provider | Figure | Ukrainian | Note |
|---|---|---|---|
| ElevenLabs Flash v2.5 | 1 credit per 2 characters (50% cheaper than standard); $/credit not retrieved | **yes**, 32 languages incl. Ukrainian, ~75 ms | `[SEARCH: elevenlabs.io/docs/overview/models]` |
| Cartesia | not retrieved | **not retrieved — likely the deciding question for this vendor** | check manually |
| OpenAI / Google / Azure | not retrieved | not retrieved | check manually |

ElevenLabs Flash is currently the only option with Ukrainian *and* real-time
latency confirmed. That makes it the default unless manual checking finds an
equal alternative — and a single viable supplier for a critical component is a
risk worth recording, not a comfort.

### Telephony

| Provider | Figure | Note |
|---|---|---|
| Twilio Media Streams | $0.004/min, **plus** Programmable Voice minutes | `[SEARCH: twilio.com/docs/voice/media-streams]` |
| Twilio outbound to Ukraine | **not retrieved** | the single most important missing number |
| Telnyx, Zadarma, Binotel, Phonet, Ringostat | not retrieved | check manually, especially real-time media access |

Twilio confirms real-time audio over WebSockets, which clears the hard
technical requirement. But the per-minute rate to Ukrainian numbers — almost
certainly the largest single line item in the whole stack — could not be
retrieved. Mobile termination in Ukraine is not a cheap destination, and this
number alone can decide the architecture.

**Priority for manual verification: Twilio's Ukraine outbound rate, mobile and
landline separately.**

### Managed platforms

| Platform | Figure | Note |
|---|---|---|
| Vapi | $0.05/min platform fee, on top of STT/LLM/TTS | `[SEARCH: vapi.ai/pricing]` |
| Retell | $0.07/min infrastructure + $2/month per number. **Full stack incl. TTS, LLM, telephony: $0.13–$0.31/min** | `[SEARCH: retellai.com, cekura.ai]` |
| Bland | $0.09/min connected, $15/month per number, **$0.015 per unconnected outbound attempt** | `[SEARCH: retellai.com/comparisons/retell-vs-bland]` |

Read against the gate, this is the important result:

> Retell's own full-stack range, **$0.13–$0.31/min**, starts exactly at our
> planning threshold and runs to well past the hard cutoff.

So a managed platform is not automatically excluded — but only its cheapest
configuration fits, and only if Ukrainian is available in that configuration.
The comfortable end of the range is not available to us.

Bland's $0.015 per *unconnected* attempt is negligible here — at a 90% answer
rate that is 10 failed dials a day, about $0.15. Worth noting only because at a
lower answer rate it would not be.

---

## IP telephony and the caller-ID question

Client asked whether IP telephony can be used without involving a mobile
operator. The answer separates into two sides that are easy to conflate.

**Our side: yes, entirely.** Every provider under consideration — Twilio,
Telnyx, Zadarma — *is* IP telephony. Nothing originates through a mobile
operator, and nothing needs to. This was never the constraint.

**The receiving side: no, and that is where the risk lives.** If the number we
dial is a Kyivstar subscriber, Kyivstar's filtering applies to the incoming
call no matter how it was originated. Choosing IP telephony does not opt out of
the recipient's carrier — it only changes what caller ID we present to it.

### The finding that matters

Since 2 October, Ukrainian mobile operators — Kyivstar, Vodafone, lifecell —
operate a system for **blocking numbers used for spam calls**, and subscribers
can report a number through the operator's app or hotline.
`[SEARCH: itc.ua, thedigital.gov.ua, 2026-08-05]`

The mechanism is **complaint-driven**. That changes the shape of the risk in a
useful way: exposure scales with how irritating the calls are, not merely with
how many are placed. 100 calls a day that exit politely and never call a
refuser twice generate few complaints. The same 100 calls made by an agent that
argues, repeats itself, and re-dials people who already said no will get the
number reported.

This reframes several existing design decisions. The 45-second gatekeeper cap,
the two-refusal limit, durable suppression that survives re-import, and the
prohibition on arguing were all introduced as cost or brand measures. They are
also **number-survival measures**. Cheap and inoffensive turn out to be the
same engineering objective here.

Note also that this project dials **company** numbers, many of which are office
landlines or PBX lines rather than mobile subscriptions. Consumer anti-spam
filtering does not reach those. Exposure is real but smaller than it would be
for B2C dialling — and it is unevenly distributed, since small firms often
publish a mobile.

### SIP trunk resolves R2 by construction

A point worth stating plainly, because it changes the architecture: **a SIP
trunk does not need to "expose" real-time media — with a SIP trunk you are the
media endpoint.**

The concern in R2 was that Ukrainian providers offer call control and recording
but no live audio API. That concern applies to *cloud PBX products*. It does
not apply to a SIP trunk: the provider hands over signalling and RTP, and
whatever terminates that SIP leg — LiveKit SIP, Asterisk, FreeSWITCH, Pipecat's
transport — has the audio in both directions by definition.

Zadarma advertises SIP trunk with no additional fee for trunk usage, plus
Ukrainian city numbers. `[SEARCH: zadarma.com/en/services/calls/sip-trunk/,
2026-08-05]`

If that holds, it points to an architecture that was not obvious before:

```
Ukrainian SIP trunk (local rates, Dnipro city caller ID)
        → LiveKit SIP / Pipecat (own media endpoint)
        → STT → tiered models → TTS
```

This plausibly beats Twilio on the largest line item — international
termination into Ukraine — while giving a caller ID that matches the pitch
("друкарня з Дніпра") rather than an unfamiliar or foreign number.

### Caller ID strategy

| Caller ID presented | Assessment |
|---|---|
| **Ukrainian city number (Dnipro)** | Best fit. Looks like the business it is, consistent with what the agent says, and outside the mobile-spam heuristics aimed at consumer nuisance calls |
| Ukrainian mobile | Plausible to a human, but the most exposed to operator filtering |
| Foreign number | Worst. Low answer rates and immediate suspicion |
| Withheld | Effectively fatal to a 90% answer rate |

Recorded as the working recommendation pending verification, not a decision.

## What this means for the three architectures (P3)

Provisional, pending verified numbers:

- **Managed platform (Vapi / Retell / Bland).** Viable only at the bottom of
  its range. Fastest to a working dialer. Requires confirming Ukrainian works
  in the cheap configuration, not merely that the platform supports Ukrainian
  somewhere.
- **Assembled (Twilio Media Streams + Deepgram or alternative + ElevenLabs
  Flash + tiered models).** More control, likely cheaper per minute, more work.
  Blocked on the Twilio Ukraine rate.
- **Local carrier + assembled.** Potentially much cheaper telephony and a
  natural Ukrainian caller ID, but **only if the carrier exposes real-time
  media** — which is exactly what most Ukrainian PBX providers do not do.
  Highest risk, highest potential saving.

---

## Assumptions this phase has already touched

- **A-004 (model tiering yields material savings)** — still plausible, but note
  that STT at ~$0.008/min and telephony are per-minute costs that tiering does
  **not** reduce. Tiering only helps the LLM line. If telephony dominates the
  bill, the saving is smaller than assumed. Re-check once the Twilio rate is
  known.

---

## Open — carried into the checklist

1. Ukrainian STT: which providers genuinely support it in a **streaming
   conversational** model, and how well?
2. Twilio (and alternatives) outbound rate to Ukraine, mobile vs landline.
3. Which Ukrainian carriers, if any, expose real-time media?
4. ElevenLabs actual $/credit, to convert Flash pricing into $/min.
5. Whether Vapi/Retell/Bland allow bring-your-own STT and TTS keys — this
   decides whether their fee is a fixed markup or a markup on everything.
6. R6: is warm transfer worth building at all? Not yet researched.
