# STT test protocol — 8 files, ~30 minutes, closes P2

The recordings arrived 2026-08-05. The acoustic work is done
(`AUDIO-ANALYSIS.md`). This is the part that needs a human with a browser.

---

## Why I cannot run it here

This session's egress policy denies every host the test needs. Verified, not
assumed — the proxy logged a 403 CONNECT for each:

```
huggingface.co            403   (no local Whisper model either)
api.deepgram.com          403
api.elevenlabs.io         403
api.soniox.com            403
api.gladia.io             403
api.assemblyai.com        403
api.openai.com            403
asr.api.speechmatics.com  403
```

So API keys would not help — the block is on the network, not on credentials,
and routing around an org egress policy is not something to attempt. Local
models are out too: the model weights live on HuggingFace.

**This does not delay the build.** Steps 1–3 in `PLAN.md` never depended on the
STT answer, which is exactly why they were sequenced first.

---

## The test set — 8 files, 4.6 minutes

Chosen from the 37 to cover the failure modes, not the average.

| file | sec | turns | dyn.range | why this one |
|---|---:|---:|---:|---|
| `9b7eb2141e` | 31.8 | 16 | 60.7 dB | cleanest line, most turns — the **best case**. If a model fails here it fails everywhere. |
| `4a82d647df` | 33.8 | 15 | 58.7 dB | clean, dense exchange — the typical good call |
| `2209c3e3f3` | 37.9 | 15 | 57.8 dB | median-clean, long enough to carry a real answer |
| `a82735683d` | 63.1 | 23 | 42.3 dB | **longest call in the corpus** — most content, somewhat noisy. Most likely to contain a тираж spoken aloud. |
| `31f917eac7` | 28.4 | 12 | 36.9 dB | noisy line, 5.0 s max gap |
| `acc14cb98d` | 30.5 | 12 | 36.3 dB | noisy line |
| `1798454d8c` | 8.5 | 3 | 32.8 dB | **worst audio, shortest call** — the hard case |
| `4268e0929e` | 43.8 | 13 | 48.5 dB | contains the corpus's **11.7 s silence** — tests silence handling |

Pack: `scratchpad/STT-test-8.zip` (3 MB).

> Note before you listen: the first ~1.05 s of every file is the same
> prerecorded phrase (Тетяна Шевченко). If a model renders it oddly, that is
> the bot's own greeting, not a recognition failure.

---

## How to run it

Upload the same 8 files to each demo. Set language to **Ukrainian** manually
where offered — do not rely on auto-detect, it is not what we will use in
production.

| # | Vendor | Where |
|---|---|---|
| 1 | Soniox | https://soniox.com/speech-to-text/ukrainian |
| 2 | ElevenLabs Scribe | https://elevenlabs.io/speech-to-text/ukrainian |
| 3 | Gladia | https://www.gladia.io/ |
| 4 | Deepgram (Nova-3) | https://deepgram.com/ |
| 5 | Speechmatics | https://www.speechmatics.com/speech-to-text/ukrainian |

Five, not four — Speechmatics is cheap to add once the files are on the
clipboard. **Skip AssemblyAI**: Ukrainian is not on its streaming model
(`VENDOR-LINKS.md`).

Save each transcript as text, named `<vendor>-<file>.txt`. Send them all; I do
the comparison.

---

## What we are scoring

Not word error rate. Four things that decide whether a lead is usable:

| # | Criterion | Why it decides the deal |
|---|---|---|
| **1** | **Цифри** — тираж, кількість, дати | «п'ятсот» heard as «п'ять тисяч» produces a wrong quote, discovered only after a manager has called. This is the single most expensive error class. |
| **1b** | **Пошта по літерах** — an email address spelled aloud | Promoted to joint-first by `core/conversation/commitment.md`: `send_offer` is one of only three ways a call can succeed, and it lives or dies on this. Latin letters named in Ukrainian over 8 kHz is the hardest capture in the product. |
| **2** | **Суржик** — does it break when the speaker mixes UK/RU mid-sentence | Half of real business calls. No vendor publishes this. |
| **3** | **Терміни** — офсет, ламінація, тираж, макет, візитки, банер | Domain vocabulary. If these come out as noise, qualification is impossible. |
| **4** | **Деградація** — how much worse on the three noisy files vs the clean two | A model that only works on good lines is not usable on a cold base. |

### Scoring sheet

Per vendor, per criterion: **2** = fine, **1** = usable with errors, **0** =
broken.

| Vendor | Цифри | Пошта | Суржик | Терміни | Деградація | Σ /10 |
|---|---|---|---|---|---|---|
| Soniox | | | | | |
| ElevenLabs | | | | | |
| Gladia | | | | | |
| Deepgram | | | | | |
| Speechmatics | | | | | |

**Decision rule, set before seeing results so it cannot be rationalised
afterwards:**

- **Цифри або Пошта = 0 disqualifies outright**, whatever the total. Two of
  the three ways a call can succeed end in capturing a time or an address; a
  model that loses either cannot close a call.
- Otherwise highest Σ wins.
- Ties break toward the one that degrades least (criterion 4), not the one that
  scores best on the clean files.

---

## The second thing to record while listening

You will be hearing these calls again. Alongside the transcripts, note for each
file: **did the bot mishandle this call, and how?**

That is the estimate `KEYCALL-BASELINE.md` says the KeyCall interface cannot
produce — what share of «не цікаво» was refusal and what share was the bot
failing. Eight files is a small sample and will not settle it, but it turns a
guess into a first-hand impression with examples attached.

The pause data already says a fixed silence timer cannot work on this audience
(`AUDIO-ANALYSIS.md`, Finding 3). Hearing where it actually fired is what turns
that from a statistic into a design brief.
