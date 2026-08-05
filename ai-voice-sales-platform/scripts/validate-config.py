#!/usr/bin/env python3
"""Validate every config file, not just the ones that were on my mind.

A broken platform.yaml went unnoticed for several commits because validation
only covered the vertical configs. Checking everything is the point.

Usage: python3 ai-voice-sales-platform/scripts/validate-config.py
Exit code 1 on any failure, so it can gate a commit.
"""

import json
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("pyyaml is required: pip install pyyaml")

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config"

failures = []
notes = []


def fail(msg):
    failures.append(msg)


def load_yaml(path):
    try:
        return yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        fail(f"{path.relative_to(ROOT)}: YAML parse error — {exc}")
        return None


# --- schema ---------------------------------------------------------------
schema_path = CONFIG / "schema.json"
try:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
except json.JSONDecodeError as exc:
    sys.exit(f"schema.json is not valid JSON: {exc}")

allowed_top = set(schema["properties"])
required_top = set(schema.get("required", []))

# --- platform.yaml --------------------------------------------------------
platform = load_yaml(CONFIG / "platform.yaml")
if platform:
    for section in ("schedule", "volume", "economics", "models", "stack",
                    "time_budgets_seconds", "retry", "suppression", "import"):
        if section not in platform:
            fail(f"platform.yaml: missing section '{section}'")

    econ = platform.get("economics", {})
    cpm = econ.get("cost_per_minute_usd", {})
    if cpm:
        if not (cpm["target"] <= cpm["planning"] <= cpm["hard_cutoff"]):
            fail("platform.yaml: cost_per_minute thresholds are not ordered "
                 "target <= planning <= hard_cutoff")

    # The daily budget must follow from the funnel, not drift from it.
    fb = econ.get("funnel_baseline", {})
    if fb and econ.get("max_cost_per_lead_usd"):
        expected = (platform["volume"]["dials_per_day"]
                    * fb["ab_lead_rate"] * econ["max_cost_per_lead_usd"])
        actual = econ.get("daily_budget_usd")
        if abs(expected - actual) > 0.01:
            fail(f"platform.yaml: daily_budget_usd is {actual} but the funnel "
                 f"implies {expected:.2f}")

    budgets = platform.get("time_budgets_seconds", {})
    for state, b in budgets.items():
        if isinstance(b, dict) and b.get("soft", 0) > b.get("hard", 0):
            fail(f"platform.yaml: time budget '{state}' has soft > hard")

# --- verticals ------------------------------------------------------------
verticals = sorted((CONFIG / "verticals").glob("*.yaml"))
if not verticals:
    fail("no vertical configs found")

for path in verticals:
    cfg = load_yaml(path)
    if not cfg:
        continue
    name = path.stem

    extra = set(cfg) - allowed_top
    if extra:
        fail(f"{name}: keys not in schema: {sorted(extra)}")

    missing = required_top - set(cfg)
    if missing:
        fail(f"{name}: missing required keys: {sorted(missing)}")

    status = cfg.get("status")
    if status not in schema["properties"]["status"]["enum"]:
        fail(f"{name}: invalid status '{status}'")

    # A vertical may not go live with unresolved blockers.
    raw = path.read_text(encoding="utf-8")
    blockers = raw.count("TODO(BLOCKER)")
    if status == "live" and blockers:
        fail(f"{name}: status is 'live' with {blockers} TODO(BLOCKER) remaining")

    # Every promise the agent can make needs a task type behind it.
    task_map = (cfg.get("crm") or {}).get("task_map") or {}
    for obj in cfg.get("objections") or []:
        for key in ("trigger", "response", "exit"):
            if not obj.get(key):
                fail(f"{name}: objection '{obj.get('trigger')}' missing '{key}'")

    if status != "parked":
        notes.append(f"{name}: status={status}, {blockers} blockers, "
                     f"{len(cfg.get('objections') or [])} objections, "
                     f"{len(task_map)} task types")

# --- report ---------------------------------------------------------------
for n in notes:
    print(f"  {n}")

if failures:
    print("\nFAILED:")
    for f in failures:
        print(f"  - {f}")
    sys.exit(1)

print("\nAll config valid.")
