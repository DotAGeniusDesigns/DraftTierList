"""Does a rookie's landing spot -- the positional opportunity his new team
vacated -- predict his rookie season beyond his draft band?

CLAUDE.md records this as measured and DECLINED: +0.035 R2 over draft capital
for RB, monotone terciles at 6.6 / 8.7 / 10.9 PPG on n=215, turned down to keep
the rookie branch to the band mean alone. That is the largest measured-but-
unshipped gain in the project, so it deserves the validation everything else
has now been held to.

Note the tension worth resolving: vacated share was tested for VETERANS
(vacated.py) and was completely dead at every position. A rookie is the case
where it should behave differently -- a veteran already has a role, and his own
stat line describes it, so vacated opportunity tells you nothing new. A rookie
has no line at all, so the job waiting for him is most of what can be known.

Landing spot here is the share of the team's prior-year positional opportunity
(carries plus targets for RB, targets for WR/TE, attempts for QB) that belonged
to players no longer on the roster in the rookie's first season. Nothing about
the rookie's own season enters it.

Validated by rolling DRAFT CLASS, not leave-one-out: fit on classes through year
Y, predict every class after. Same reasoning as everywhere else -- predicting an
earlier class from a later one is not the problem anyone has.
"""
import csv, io, os, sys
from collections import defaultdict
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from metrics import DERIVED, SEASONS
from routes import load_gz_text, norm

POS = ("QB", "RB", "WR", "TE")
DP = "/home/dotagenius/DraftList/.cache/nflstats/draft_picks.csv"
BANDS = [(1, 12), (13, 32), (33, 64), (65, 120), (121, 300)]

def opportunity(rec):
    if rec["pos"] == "RB":
        return (rec.get("rush_att") or 0) + (rec.get("tgt") or 0)
    if rec["pos"] == "QB":
        return rec.get("pass_att") or 0
    return rec.get("tgt") or 0

def vacated_positional(team, pos, year):
    """Share of `team`'s year-1 opportunity at `pos` held by players who are not
    on the roster in `year`. None when the prior season has no usable total."""
    prior, cur = DERIVED.get(year - 1), DERIVED.get(year)
    if not prior or not cur:
        return None
    total = gone = 0.0
    for key, rec in prior.items():
        if rec["pos"] != pos or rec.get("team") != team:
            continue
        opp = opportunity(rec)
        total += opp
        nxt = cur.get(key)
        if not nxt or nxt.get("team") != team:
            gone += opp
    return (gone / total * 100) if total > 20 else None

def band_of(pick):
    for i, (lo, hi) in enumerate(BANDS):
        if lo <= pick <= hi:
            return i
    return len(BANDS) - 1

rows = defaultdict(list)
for p in csv.DictReader(open(DP)):
    if p.get("position") not in POS or not p["season"].isdigit():
        continue
    yr = int(p["season"])
    if yr < min(SEASONS) + 1 or yr > max(SEASONS):
        continue
    key = f'{norm(p["pfr_player_name"])}|{p["position"]}'
    rec = DERIVED.get(yr, {}).get(key)
    ppg = rec["ppg_half"] if rec else 0.0
    team = rec.get("team") if rec else (p.get("team") or None)
    if not team:
        continue
    vac = vacated_positional(team, p["position"], yr)
    if vac is None:
        continue
    rows[p["position"]].append({
        "year": yr, "pick": int(p["pick"]), "band": band_of(int(p["pick"])),
        "ppg": ppg, "vac": vac,
    })

print("=" * 88)
print("Terciles of vacated positional opportunity, within the top four draft bands")
print("(CLAUDE.md records RB at 6.6 / 8.7 / 10.9 -- this is the check)")
print("=" * 88)
for pos in POS:
    d = [r for r in rows[pos] if r["band"] <= 3]
    if len(d) < 60:
        print(f"  {pos}: n={len(d)}, too few"); continue
    v = np.array([r["vac"] for r in d]); y = np.array([r["ppg"] for r in d])
    lo, hi = np.percentile(v, 33), np.percentile(v, 66)
    cells = []
    for label, m in (("low", v <= lo), ("mid", (v > lo) & (v <= hi)), ("high", v > hi)):
        cells.append(f"{label} {y[m].mean():.1f} (n={m.sum()})")
    print(f"  {pos:<4} n={len(d):<5} " + "   ".join(cells))

print("\n" + "=" * 88)
print("Rolling draft class: fit through year Y, predict every class after")
print("(band mean alone, vs band mean plus a landing-spot term)")
print("=" * 88)
for pos in POS:
    d = rows[pos]
    if len(d) < 80:
        print(f"  {pos}: n={len(d)}, too few"); continue
    print(f"\n  {pos}  (n={len(d)})")
    gains = []
    for origin in (2019, 2020, 2021, 2022):
        tr = [r for r in d if r["year"] <= origin]
        te = [r for r in d if r["year"] > origin]
        if len(te) < 25 or len(tr) < 40:
            continue
        means = {}
        for b in range(len(BANDS)):
            sub = [r["ppg"] for r in tr if r["band"] == b]
            means[b] = float(np.mean(sub)) if sub else float(np.mean([r["ppg"] for r in tr]))
        base_pred = np.array([means[r["band"]] for r in te])
        yte = np.array([r["ppg"] for r in te])
        ss = ((yte - yte.mean()) ** 2).sum()
        r2_base = 1 - ((yte - base_pred) ** 2).sum() / ss
        # landing spot fitted on the residual of the training classes only
        tr_resid = np.array([r["ppg"] - means[r["band"]] for r in tr])
        tr_vac = np.array([r["vac"] for r in tr])
        A = np.c_[tr_vac, np.ones(len(tr_vac))]
        coef, *_ = np.linalg.lstsq(A, tr_resid, rcond=None)
        te_vac = np.array([r["vac"] for r in te])
        pred = base_pred + np.c_[te_vac, np.ones(len(te_vac))] @ coef
        r2_land = 1 - ((yte - pred) ** 2).sum() / ss
        gains.append(r2_land - r2_base)
        print(f"    through {origin}: band {r2_base:+.4f} -> +landing {r2_land:+.4f}"
              f"   gain {r2_land - r2_base:+.4f}   (test n={len(te)})")
    if gains:
        print(f"    mean {np.mean(gains):+.4f}   worst {min(gains):+.4f}   "
              f"positive {sum(1 for g in gains if g > 0)}/{len(gains)}")
