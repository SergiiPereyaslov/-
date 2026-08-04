# ADR-0001 — Separate mechanism (core) from content (vertical config)

**Status:** accepted
**Date:** 2026-08-04
**Deciders:** Solution Architect; confirmed by client

## Context

The client operates two businesses now (Дніпрограф, SmartEcoPack) and may
later sell the system to others. Building one voice agent per business would
mean each new business is a project: new prompts, new flow, new integration
work, and — worse — a fix to a shared bug applied by hand in several places
that have quietly diverged.

## Decision

A single business-agnostic core provides all **mechanism**. Each business is a
YAML file providing all **content**, validated against `config/schema.json`.

Onboarding a business is a config change. Nothing outside `config/` may be
touched. If it must be, that is a defect in the core and an Architect veto
condition.

**Boundary test**, applied to every statement in `core/`:
*would this still be true for a completely different industry?*
Yes → core. No → vertical config.

| Core (mechanism) | Config (content) |
|---|---|
| state machine, transitions, time budgets | what is sold, to whom |
| gatekeeper navigation strategy | which job titles are decision makers |
| how objections are detected and handled | which objections exist, what to say |
| scoring tiers and anti-gaming | what qualifies a lead in this niche |
| CRM write mechanism | pipeline ids, status ids, field names |
| barge-in, silence, voicemail handling | greeting wording, tone |

## Consequences

**Positive.** A new vertical ships in a day rather than a project. A fix to the
dialogue engine benefits every vertical at once. The commercial option of
selling the platform stays open at no extra cost. Two verticals from the start
means the boundary is tested rather than assumed — a single vertical would let
business logic leak into the core unnoticed.

**Negative.** Higher up-front design cost than hardcoding one agent. The
schema must evolve carefully once verticals depend on it. Contributors will be
tempted to "just add one field" to the core for a specific business; the veto
exists precisely to catch that.

**Enforcement.** `voice-solution-architect` blocks on any business logic found
under `core/`.

## Alternatives rejected

**One agent per business.** Fastest to a first working call, but every
subsequent business repeats the full cost, and shared fixes diverge. Rejected
because a second business already exists — the duplication would begin
immediately, not hypothetically.

**Fully generic single prompt with business facts pasted in.** Superficially
similar but with no schema, no validation, and no way to tell mechanism from
content. Rejected: an unvalidated config fails silently at call time, on a
paid call, with no diagnosis afterwards.
