# Acoustic analysis — 37 KeyCall recordings

Source: `Дзвінки.zip`, supplied by the client 2026-08-05. Real outbound calls
from the Дніпрограф cold-base campaign.

Measured with a pure-Python energy VAD (`scratchpad/analyze.py`), 20 ms frames,
adaptive noise floor. No transcription involved — everything below is signal,
not content, so none of it depends on Ukrainian STT working.

---

## The corpus

| | |
|---|---|
| Files | 37 |
| Format | **8 000 Hz, mono, 16-bit PCM** — uniform across all 37 |
| Total | 17.6 min |
| Duration | median **28.9 s**, p90 39.3 s, max 63.1 s, min 8.5 s |
| Talk ratio | median 66% of call is sound, not silence |
| Speech segments per call | median **11**, max 23 |

Two things follow immediately.

**These are genuine exchanges, not monologues.** Eleven alternating speech
segments in a 29-second call is a conversation, however short. Not one file
has ≤2 segments. Whatever else the bot fails at, it is getting people to talk.

**8 kHz is the real thing.** This is exactly the degraded narrowband condition
that vendor demo pages avoid, and it retroactively justifies the emphasis in
`STT-GUIDE.md` — every WER number published against studio audio is now
irrelevant to us. It also promotes Gladia, the only vendor publishing results
on 8 kHz telephony audio, from "interesting" to "must test".

---

## Finding 1 — mono is a problem we must not inherit

All 37 files are **single-channel**: bot and human are mixed into one signal.
Consequences:

- Speaker separation requires diarisation, which adds error on top of STT error.
- When the two talk over each other, the audio is genuinely overlapped and no
  post-processing recovers it.
- Interruption analysis — who cut off whom, and when — is not reliably
  recoverable from this corpus at all.

**Design decision for LeadRadar:** record **dual-channel** — agent on one leg,
caller on the other. It costs nothing at capture time and it makes transcripts
speaker-accurate for free, removes diarisation from the pipeline, and makes
barge-in measurable. Every SIP provider on our shortlist can do this.

This is a good example of the point that keeps recurring: KeyCall's data
limitations are not incidental, they are why nobody could measure the problem.

---

## Finding 2 — every call opens with the same ~1.05 s recording

The first ~1.05 s of all 37 files has a near-identical energy envelope
(RMS ≈ 2938, 4275, 4182, 4176, 3716, 3915, 4042, 3991, 3874, 4282, 1685),
a dominant frequency of **≈222 Hz** — a female voice — and then the files
diverge.

Not bit-identical (each file's first second has a distinct hash, and the
sample-exact common prefix is only ~20 ms), which is what you would expect from
**the same recorded phrase replayed through the telephony codec** on each call.
That matches the screenshot: диктор **Тетяна Шевченко**, a prerecorded voice.

After it, a pause — 0.3–0.5 s of near-silence in most files — and only then
does the content start to vary.

So the call opens: fixed ~1-second phrase → wait → branch. About two or three
words, then the bot listens to decide whether a human answered.

**Two implications.**

1. **Strip the opener before the STT test.** A fixed prerecorded burst at the
   head of every file can skew automatic language detection and the first
   transcribed word — and the first word after the greeting is the single most
   valuable token in a cold call, because it decides the branch.
2. Our own greeting is generated, not replayed, so it varies with the company
   name and the person answering. That is a difference we should be able to
   hear in an A/B, and it belongs in the pilot's test plan.

---

## Finding 3 — the pause distribution, and why no single threshold works

378 gaps between speech segments, across all 37 calls:

| percentile | gap |
|---|---|
| p50 | 0.56 s |
| p75 | **1.00 s** |
| p90 | 2.24 s |
| p95 | 3.08 s |
| p99 | 4.01 s |
| max | 11.72 s |

```
 0.0–0.3 s   63   16.7%  ##########
 0.3–0.5 s   98   25.9%  ###############
 0.5–0.7 s   62   16.4%  #########
 0.7–1.0 s   58   15.3%  #########
 1.0–1.5 s   31    8.2%  ####
 1.5–2.0 s   22    5.8%  ###
 2.0–3.0 s   23    6.1%  ###
 3.0+   s    21    5.6%  ###
```

**41% of all pauses in these calls are 0.7 s or longer.**

A scripted bot has exactly one mechanism for deciding that a person has
finished: a fixed silence timer. This corpus shows there is no good value for
it.

- Set it at **0.7 s** — a common default — and it expires during 41% of the
  pauses in the corpus. Every time that pause was someone thinking mid-sentence
  rather than yielding the turn, the bot talks over them or falls to a default
  branch. That is precisely the client's complaint, in their own words: «бот не
  завжди може розпізнати коли люди щось говорять», «не можна кидати людину».
- Set it high enough to be safe — **2.24 s**, the p90 — and every single turn
  now carries over two seconds of dead air. At a median 11 segments per call
  that is roughly 20 seconds of waiting inside a 29-second call. That is what
  makes a bot sound like a bot.

There is no number that is both. **This is the quantitative case for semantic
end-of-turn detection**, and it converts pastka №4 in `STT-GUIDE.md` from a
warning into a measured requirement with a number attached.

### Honest limit on this finding

Mono mixing means gaps cannot be attributed to a speaker. The 378 gaps are a
mixture of human pauses **and** the bot's own processing latency between
hearing and replying. Both matter to us and both belong in the distribution,
but the split is not recoverable from this corpus.

Dual-channel recording (Finding 1) makes exactly this measurable on our own
calls from day one — which is the point.

---

## Finding 4 — audio quality, and which files are the hard ones

Noise floor is low and silence carries light comfort noise rather than digital
zero (~0.1% exact-zero samples), so these are reasonably clean lines by
telephony standards. Crude dynamic range (p95 vs p10 frame level) is a median
57 dB.

Six files sit well below that and are the useful stress tests:

| file | dyn. range | note |
|---|---|---|
| `1798454d8c` | 32.8 dB | worst; also one of the shortest at 8.5 s |
| `acc14cb98d` | 36.3 dB | |
| `31f917eac7` | 36.9 dB | |
| `a82735683d` | 42.3 dB | longest call, 63.1 s |
| `80d114cf9c` | 42.7 dB | |
| `536582f2c2` | 43.3 dB | |

Minor clipping is present (107 frames at full scale across the corpus, peak
32768/32767). Not enough to matter for STT, worth knowing before we blame a
model for a mangled word.

`4268e0929e` contains an **11.7-second gap** — the longest in the corpus. Worth
listening to by ear: that is either someone who put the handset down, or a
transfer attempt, and either way it is a case our own silence handling must
survive.

---

## What this does and does not settle

**Settled without any STT:** the format we must handle (8 kHz narrowband), the
recording decision for LeadRadar (dual-channel), the shape of the calls
(~29 s, ~11 turns), and the fact that a fixed silence threshold cannot work on
this audience.

**Not settled:** whether any STT can actually read Ukrainian on these files.
That needs transcripts, which needs either vendor API keys or the vendor demo
pages. See `STT-TEST.md`.
